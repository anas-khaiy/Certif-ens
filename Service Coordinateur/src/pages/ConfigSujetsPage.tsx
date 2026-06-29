import React, { useState, useEffect } from 'react';
import { Save, Users, Settings, Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../api/api-client';
import type { Enseignant, SujetPropositionConfig, Specialite } from '../types';

const ConfigSujetsPage = () => {
    const [formateurs, setFormateurs] = useState<Enseignant[]>([]);
    const [specialites, setSpecialites] = useState<Specialite[]>([]);
    const [config, setConfig] = useState<SujetPropositionConfig | null>(null);
    const [nombreSujets, setNombreSujets] = useState<number>(1);
    const [selectedFormateurIds, setSelectedFormateurIds] = useState<number[]>([]);
    const [occupiedFormateurIds, setOccupiedFormateurIds] = useState<number[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

    // Filters & Pagination
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [selectedSpecialite, setSelectedSpecialite] = useState<string>('');
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    // Initial load for config and specialities
    useEffect(() => {
        fetchInitialData();
    }, []);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
            setPage(0); // reset page on search
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Reset page when specialty changes
    useEffect(() => {
        setPage(0);
    }, [selectedSpecialite]);

    // Fetch formateurs when filters or page change
    useEffect(() => {
        fetchFormateurs();
    }, [page, debouncedSearch, selectedSpecialite]);

    const fetchInitialData = async () => {
        try {
            setIsLoading(true);
            const [configRes, specRes, occRes] = await Promise.all([
                api.get('/sujet-config').catch(err => {
                    if (err.response?.status === 404) return { data: null };
                    throw err;
                }),
                api.get('/affectation/specialites').catch(() => ({ data: [] })),
                api.get('/sujet-config/formateurs-occupes').catch(() => ({ data: [] }))
            ]);

            setSpecialites(specRes.data || []);
            setOccupiedFormateurIds(occRes.data || []);
            const conf = configRes.data;
            if (conf) {
                setConfig(conf);
                setNombreSujets(conf.nombreSujetsParFormateur);
                setSelectedFormateurIds(conf.formateursConcernes.map((f: Enseignant) => f.id));
            }
        } catch (error) {
            console.error('Error fetching initial data:', error);
            setMessage({ text: 'Erreur lors du chargement des données', type: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    const fetchFormateurs = async () => {
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                size: '10'
            });
            if (debouncedSearch) params.append('search', debouncedSearch);
            if (selectedSpecialite) params.append('specialiteId', selectedSpecialite);

            const res = await api.get(`/affectation/formateurs?${params.toString()}`);
            setFormateurs(res.data?.content || []);
            setTotalPages(res.data?.totalPages || 0);
        } catch (error) {
            console.error('Error fetching formateurs:', error);
        }
    };

    const toggleFormateur = (id: number) => {
        setSelectedFormateurIds(prev => 
            prev.includes(id) ? prev.filter(fid => fid !== id) : [...prev, id]
        );
    };

    const handleSave = async () => {
        try {
            setIsSaving(true);
            setMessage(null);
            
            const payload = {
                nombreSujets: nombreSujets,
                formateurIds: selectedFormateurIds
            };

            await api.post('/sujet-config', payload);
            setMessage({ text: 'Configuration enregistrée avec succès !', type: 'success' });
        } catch (error) {
            console.error('Error saving config:', error);
            setMessage({ text: 'Erreur lors de la sauvegarde de la configuration', type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return <div className="p-8 flex justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;
    }

    return (
        <div className="p-4 sm:p-8 space-y-6 max-w-5xl mx-auto animate-fade-in">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-text mb-2">Configuration des Sujets</h1>
                    <p className="text-text-muted">Définissez les règles pour la proposition de sujets par les formateurs.</p>
                </div>
                <button 
                    onClick={handleSave} 
                    disabled={isSaving}
                    className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-xl transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
                >
                    <Save size={20} />
                    {isSaving ? 'Enregistrement...' : 'Enregistrer'}
                </button>
            </div>

            {message && (
                <div className={`p-4 rounded-xl ${message.type === 'success' ? 'bg-success/10 text-success border border-success/20' : 'bg-error/10 text-error border border-error/20'}`}>
                    {message.text}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                    <div className="bg-surface/50 backdrop-blur-xl border-glass-border rounded-xl border overflow-hidden">
                        <div className="p-6 pb-2">
                            <h2 className="text-xl font-semibold flex items-center gap-2">
                                <Settings size={20} className="text-primary" />
                                Paramètres Généraux
                            </h2>
                        </div>
                        <div className="p-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-text-muted mb-2">Nombre de sujets à proposer par formateur</label>
                                    <div className="relative w-full">
                                        <input 
                                            type="number" 
                                            min="1"
                                            value={nombreSujets}
                                            onChange={(e) => setNombreSujets(parseInt(e.target.value) || 1)}
                                            className="sujet-config-input w-full"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-surface/50 backdrop-blur-xl border-glass-border rounded-xl border overflow-hidden flex flex-col">
                        <div className="p-6 pb-4 border-b border-glass-border">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                                <h2 className="text-xl font-semibold flex items-center gap-2">
                                    <Users size={20} className="text-primary" />
                                    Formateurs Concernés ({selectedFormateurIds.length} sélectionnés)
                                </h2>
                            </div>
                            
                            {/* Search and Filters */}
                            <div className="flex flex-col sm:flex-row gap-3">
                                <div className="search-container flex-1 min-w-[200px]">
                                    <div className="search-icon"><Search size={18} /></div>
                                    <input 
                                        type="text" 
                                        placeholder="Rechercher par nom ou email..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="search-input"
                                    />
                                </div>
                                <div className="relative min-w-[180px] sm:w-48 shrink-0">
                                    <select
                                        value={selectedSpecialite}
                                        onChange={(e) => setSelectedSpecialite(e.target.value)}
                                        className="form-input appearance-none w-full font-bold bg-surface"
                                    >
                                        <option value="">Toutes spécialités</option>
                                        {specialites.map(spec => (
                                            <option key={spec.id} value={spec.id}>{spec.nom}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 flex-1 bg-surface-hover/30">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                {formateurs.map(f => {
                                    const isSelected = selectedFormateurIds.includes(f.id);
                                    const isOccupied = occupiedFormateurIds.includes(f.id) && !isSelected;
                                    return (
                                    <div 
                                        key={f.id} 
                                        onClick={() => { if (!isOccupied) toggleFormateur(f.id); }}
                                        className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${isSelected ? 'border-primary bg-primary/10' : isOccupied ? 'border-warning/40 bg-warning/5 cursor-not-allowed opacity-70' : 'border-glass-border bg-surface cursor-pointer hover:bg-surface-hover'}`}
                                        title={isOccupied ? 'Déjà configuré par un autre coordinateur' : ''}
                                    >
                                        <div className={`w-5 h-5 rounded flex items-center justify-center border shrink-0 ${isSelected ? 'bg-primary border-primary text-white' : isOccupied ? 'bg-warning border-warning text-white' : 'border-text-muted'}`}>
                                            {(isSelected || isOccupied) && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                                        </div>
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <div className="w-10 h-10 rounded-full bg-surface-hover flex items-center justify-center overflow-hidden border border-glass-border shrink-0">
                                                {f.photoProfile && f.photoProfile !== 'default.png' ? (
                                                    <img src={`http://192.168.20.25:9094/api/v1/files/profiles/${f.photoProfile}`} alt="Avatar" className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="font-semibold text-sm">{f.prenom?.[0]}{f.nom?.[0]}</span>
                                                )}
                                            </div>
                                            <div className="truncate flex-1">
                                                <p className="font-semibold text-text text-sm truncate">{f.prenom} {f.nom}</p>
                                                <p className="text-xs text-text-muted truncate">
                                                    {f.specialite?.nom || 'Sans spécialité'}
                                                    {isOccupied && <span className="ml-2 text-warning font-bold">(Occupé)</span>}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    );
                                })}
                                {formateurs.length === 0 && (
                                    <div className="col-span-full py-8 text-center text-text-muted flex flex-col items-center gap-2">
                                        <Users size={32} className="opacity-20" />
                                        <p>Aucun formateur ne correspond à vos critères.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="p-4 border-t border-glass-border flex items-center justify-between bg-surface/50">
                                <span className="text-sm text-text-muted">
                                    Page {page + 1} sur {totalPages}
                                </span>
                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={() => setPage(p => Math.max(0, p - 1))}
                                        disabled={page === 0}
                                        className="p-1 rounded bg-surface border border-glass-border text-text hover:bg-surface-hover disabled:opacity-50 transition-colors"
                                    >
                                        <ChevronLeft size={20} />
                                    </button>
                                    <button 
                                        onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                                        disabled={page >= totalPages - 1}
                                        className="p-1 rounded bg-surface border border-glass-border text-text hover:bg-surface-hover disabled:opacity-50 transition-colors"
                                    >
                                        <ChevronRight size={20} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConfigSujetsPage;
