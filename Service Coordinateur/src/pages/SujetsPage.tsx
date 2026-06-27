import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Search, Target, Save, Plus, X, Loader2, BookOpen, CheckCircle2, AlertCircle, ChevronDown, Users
} from 'lucide-react';
import api from '../api/api-client';

/* ──────────────────── Pagination ──────────────────── */
const Pagination = ({ page, totalPages, total, itemsPerPage, label, onPageChange }: {
    page: number; totalPages: number; total: number; itemsPerPage: number; label: string; onPageChange: (p: number) => void;
}) => {
    if (totalPages <= 1) return null;
    const getPageNumbers = () => {
        const pages: (number | string)[] = [];
        if (totalPages <= 4) {
            for (let i = 0; i < totalPages; i++) pages.push(i);
        } else {
            pages.push(0);
            if (page > 2) pages.push('...');
            for (let i = Math.max(1, page - 1); i <= Math.min(totalPages - 2, page + 1); i++) pages.push(i);
            if (page < totalPages - 3) pages.push('...');
            pages.push(totalPages - 1);
        }
        return pages;
    };
    return (
        <div className="pagination border-t border-glass-border bg-surface-hover/10 px-6 py-4 flex items-center justify-between">
            <div className="pagination-info text-text-muted text-xs">
                Affichage <span className="text-text font-bold">{page * itemsPerPage + 1}</span> à <span className="text-text font-bold">{Math.min((page + 1) * itemsPerPage, total)}</span> sur <span className="text-text font-bold">{total}</span> {label}
            </div>
            <div className="flex items-center gap-1">
                <button onClick={() => onPageChange(Math.max(0, page - 1))} disabled={page === 0}
                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface border border-glass-border text-text hover:text-primary disabled:opacity-20 transition-all font-bold text-xl pb-1">
                    &laquo;
                </button>
                <div className="flex gap-1">
                    {getPageNumbers().map((p, i) =>
                        typeof p === 'string' ? (
                            <span key={`dots-${i}`} className="w-10 h-10 flex items-center justify-center text-text-muted font-bold text-xs">...</span>
                        ) : (
                            <button key={p} onClick={() => onPageChange(p as number)}
                                className={`w-10 h-10 rounded-xl font-bold transition-all text-xs border ${p === page ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-110 z-10' : 'bg-surface border-glass-border text-text-muted hover:border-primary hover:text-primary'}`}>
                                {(p as number) + 1}
                            </button>
                        )
                    )}
                </div>
                <button onClick={() => onPageChange(Math.min(totalPages - 1, page + 1))} disabled={page >= totalPages - 1}
                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface border border-glass-border text-text hover:text-primary disabled:opacity-20 transition-all font-bold text-xl pb-1">
                    &raquo;
                </button>
            </div>
        </div>
    );
};

interface Specialite {
    id: number;
    nom: string;
}

interface Apprenant {
    id: number;
    nom: string;
    prenom: string;
    email: string;
    photoProfile: string;
    specialite: Specialite | null;
    encadrant: { id: number; nom: string; prenom: string } | null;
    sujetDetails?: { id: number; titre: string } | null;
}

interface Sujet {
    id?: number;
    titre: string;
    description: string;
    objectifs: string[];
}

export default function SujetsPage() {
    const [apprenants, setApprenants] = useState<Apprenant[]>([]);
    const [specialites, setSpecialites] = useState<Specialite[]>([]);
    
    const [loadingApprenants, setLoadingApprenants] = useState(true);
    
    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [specialiteFilter, setSpecialiteFilter] = useState('');
    const [sujetFilter, setSujetFilter] = useState('ALL');
    const [encadrantFilter, setEncadrantFilter] = useState('ALL');

    // Pagination
    const [page, setPage] = useState(0);
    const itemsPerPage = 6;

    // Modal state
    const [selectedApprenant, setSelectedApprenant] = useState<Apprenant | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [sujet, setSujet] = useState<Sujet>({ titre: '', description: '', objectifs: [] });
    const [loadingSujet, setLoadingSujet] = useState(false);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    
    const [newObjectif, setNewObjectif] = useState('');

    const showToast = (type: 'success' | 'error', text: string) => {
        setToast({ type, text });
        setTimeout(() => setToast(null), 3000);
    };

    useEffect(() => {
        fetchSpecialites();
        fetchApprenants();
    }, []);

    useEffect(() => {
        if (selectedApprenant && isModalOpen) {
            fetchSujet(selectedApprenant.id);
        } else {
            setSujet({ titre: '', description: '', objectifs: [] });
            setNewObjectif('');
        }
    }, [selectedApprenant, isModalOpen]);

    const fetchSpecialites = async () => {
        try {
            const res = await api.get('/affectation/specialites');
            setSpecialites(res.data);
        } catch (error) {
            console.error("Erreur chargement spécialités", error);
        }
    };

    const fetchApprenants = async () => {
        setLoadingApprenants(true);
        try {
            const res = await api.get('/affectation/apprenants?size=1000');
            setApprenants(res.data.content);
        } catch (error) {
            showToast('error', "Erreur lors du chargement des apprenants");
        } finally {
            setLoadingApprenants(false);
        }
    };

    const fetchSujet = async (apprenantId: number) => {
        setLoadingSujet(true);
        try {
            const res = await api.get(`/affectation/apprenant/${apprenantId}/sujet`);
            if (res.data && res.data.titre) {
                setSujet({
                    id: res.data.id,
                    titre: res.data.titre || '',
                    description: res.data.description || '',
                    objectifs: res.data.objectifs || []
                });
            } else {
                setSujet({ titre: '', description: '', objectifs: [] });
            }
        } catch (error) {
            setSujet({ titre: '', description: '', objectifs: [] });
        } finally {
            setLoadingSujet(false);
        }
    };

    const handleSave = async () => {
        if (!selectedApprenant) return;
        if (!sujet.titre.trim()) {
            showToast('error', "Le titre du sujet est obligatoire");
            return;
        }

        setSaving(true);
        try {
            const res = await api.put(`/affectation/apprenant/${selectedApprenant.id}/sujet`, sujet);
            showToast('success', "Sujet et objectifs enregistrés avec succès !");
            
            // Update local state so tags update immediately
            setApprenants(prev => prev.map(a => 
                a.id === selectedApprenant.id 
                    ? { ...a, sujetDetails: { id: res.data.id, titre: res.data.titre } } 
                    : a
            ));
            setIsModalOpen(false);
        } catch (error) {
            showToast('error', "Erreur lors de la sauvegarde");
        } finally {
            setSaving(false);
        }
    };

    const addObjectif = () => {
        if (newObjectif.trim()) {
            setSujet(prev => ({ ...prev, objectifs: [...prev.objectifs, newObjectif.trim()] }));
            setNewObjectif('');
        }
    };

    const removeObjectif = (index: number) => {
        setSujet(prev => ({
            ...prev,
            objectifs: prev.objectifs.filter((_, i) => i !== index)
        }));
    };

    const openApprenantModal = (a: Apprenant) => {
        setSelectedApprenant(a);
        setIsModalOpen(true);
    }

    const filteredApprenants = useMemo(() => {
        return apprenants.filter(a => {
            const matchSearch = `${a.prenom} ${a.nom}`.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                (a.email || '').toLowerCase().includes(searchQuery.toLowerCase());
            const matchSpec = specialiteFilter ? a.specialite?.id?.toString() === specialiteFilter : true;
            const matchSujet = sujetFilter === 'ALL' ? true : sujetFilter === 'YES' ? !!a.sujetDetails : !a.sujetDetails;
            const matchEncadrant = encadrantFilter === 'ALL' ? true : encadrantFilter === 'YES' ? !!a.encadrant : !a.encadrant;
            
            return matchSearch && matchSpec && matchSujet && matchEncadrant;
        });
    }, [apprenants, searchQuery, specialiteFilter, sujetFilter, encadrantFilter]);

    // Reset pagination when filters change
    useEffect(() => {
        setPage(0);
    }, [searchQuery, specialiteFilter, sujetFilter, encadrantFilter]);

    const totalPages = Math.ceil(filteredApprenants.length / itemsPerPage);
    const paginatedApprenants = filteredApprenants.slice(page * itemsPerPage, (page + 1) * itemsPerPage);

    const getInitials = (p: string, n: string) => `${(p||'').charAt(0)}${(n||'').charAt(0)}`.toUpperCase();

    return (
        <div className="space-y-6 animate-fade-in pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold">Sujets et Objectifs</h2>
                    <p className="text-text-muted">Gérez les sujets de PFE et les objectifs pour chaque apprenant affecté.</p>
                </div>
                <div className="flex gap-3">
                    <div className="glass px-4 py-2.5 flex items-center gap-2">
                        <Users size={16} className="text-primary" />
                        <span className="text-sm font-bold text-text">{filteredApprenants.length} Apprenant{filteredApprenants.length > 1 ? 's' : ''}</span>
                    </div>
                </div>
            </div>

            {/* Table Area */}
            <div className="glass overflow-hidden shadow-xl">
                {/* Top Bar Filters */}
                <div className="p-6 border-b border-glass-border">
                    <div className="flex flex-wrap gap-4 items-center">
                        {/* Search */}
                        <div className="search-container flex-1 min-w-[200px]">
                            <div className="search-icon"><Search size={18} /></div>
                            <input 
                                type="text"
                                placeholder="Rechercher par nom..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="search-input"
                            />
                        </div>

                        {/* Specialite */}
                        <div className="relative min-w-[180px] flex-1">
                            <select
                                value={specialiteFilter}
                                onChange={(e) => setSpecialiteFilter(e.target.value)}
                                className="form-input appearance-none w-full font-bold bg-surface"
                            >
                                <option value="">Toutes les spécialités</option>
                                {specialites.map(s => (
                                    <option key={s.id} value={s.id.toString()}>{s.nom}</option>
                                ))}
                            </select>
                            <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                        </div>

                        {/* Encadrant Filter */}
                        <div className="relative min-w-[180px] flex-1">
                            <select
                                value={encadrantFilter}
                                onChange={(e) => setEncadrantFilter(e.target.value)}
                                className="form-input appearance-none w-full font-bold bg-surface"
                            >
                                <option value="ALL">Tous les encadrants</option>
                                <option value="YES">Avec Encadrant</option>
                                <option value="NO">Sans Encadrant</option>
                            </select>
                            <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                        </div>

                        {/* Sujet Filter */}
                        <div className="relative min-w-[180px] flex-1">
                            <select
                                value={sujetFilter}
                                onChange={(e) => setSujetFilter(e.target.value)}
                                className="form-input appearance-none w-full font-bold bg-surface"
                            >
                                <option value="ALL">Tous les sujets</option>
                                <option value="YES">Avec Sujet</option>
                                <option value="NO">Sans Sujet</option>
                            </select>
                            <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                        </div>
                    </div>
                </div>

                {/* List of Apprenants (Table style) */}
                {loadingApprenants ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    </div>
                ) : filteredApprenants.length === 0 ? (
                    <div className="py-20 text-center">
                        <Users size={48} className="mx-auto text-text-muted mb-4 opacity-40" />
                        <p className="text-text-muted font-medium">Aucun apprenant trouvé selon ces critères.</p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-surface-hover/50 text-text-muted text-xs uppercase tracking-widest">
                                        <th className="py-3 px-6 text-left">Apprenant</th>
                                        <th className="py-3 px-4 text-left">Email</th>
                                        <th className="py-3 px-4 text-left">Spécialité</th>
                                        <th className="py-3 px-4 text-left">Encadrant</th>
                                        <th className="py-3 px-4 text-left">Sujet</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-glass-border">
                                    {paginatedApprenants.map(a => (
                                        <tr 
                                            key={a.id} 
                                            onClick={() => openApprenantModal(a)} 
                                            className="hover:bg-surface-hover/30 transition-colors cursor-pointer group"
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-4 flex-1">
                                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-secondary/80 to-primary/60 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-primary/20 shrink-0">
                                                        {getInitials(a.prenom, a.nom)}
                                                    </div>
                                                    <span className="font-bold text-text group-hover:text-primary transition-colors">{a.prenom} {a.nom}</span>
                                                </div>
                                            </td>
                                            <td className="text-text-muted text-sm py-4 px-4">{a.email}</td>
                                            <td className="py-4 px-4">
                                                <span className="tag tag-licence font-bold text-xs">{a.specialite?.nom || 'N/A'}</span>
                                            </td>
                                            <td className="py-4 px-4">
                                                {a.encadrant ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold" style={{ background: 'rgba(34, 197, 94, 0.1)', color: 'var(--success)' }}>
                                                        <CheckCircle2 size={12}/> Encadré
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold" style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)' }}>
                                                        <AlertCircle size={12}/> Pas d'encadrant
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-4 px-4">
                                                {a.sujetDetails ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold" style={{ background: 'rgba(168, 85, 247, 0.1)', color: 'var(--secondary)' }}>
                                                        <CheckCircle2 size={12}/> Attribué
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold" style={{ background: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)' }}>
                                                        <AlertCircle size={12}/> Sans sujet
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <Pagination 
                            page={page} 
                            totalPages={totalPages} 
                            total={filteredApprenants.length} 
                            itemsPerPage={itemsPerPage} 
                            label="apprenants" 
                            onPageChange={setPage} 
                        />
                    </>
                )}
            </div>

            {/* Modal */}
            <AnimatePresence>
                {isModalOpen && selectedApprenant && (
                    <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
                        <motion.div 
                            key="sujet-modal"
                            initial={{ opacity: 0, scale: 0.9, y: 30 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 30 }}
                            className="modal-content"
                            style={{ maxWidth: '800px', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Close btn */}
                            <div className="modal-close" onClick={() => setIsModalOpen(false)}>
                                <X size={22} />
                            </div>

                            {/* Modal Header */}
                            <div className="pb-5 border-b border-glass-border mb-5 shrink-0 flex justify-between items-start mt-2">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-secondary/80 to-primary/60 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-primary/20">
                                        {getInitials(selectedApprenant.prenom, selectedApprenant.nom)}
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-bold flex items-center gap-3">
                                            {selectedApprenant.prenom} {selectedApprenant.nom}
                                            {!selectedApprenant.encadrant && (
                                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold" style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)' }}>
                                                    <AlertCircle size={12}/> Aucun encadrant
                                                </span>
                                            )}
                                        </h3>
                                        <p className="text-text-muted text-sm mt-1">
                                            {selectedApprenant.encadrant ? (
                                                <span>Encadré par : <strong className="text-text">{selectedApprenant.encadrant.prenom} {selectedApprenant.encadrant.nom}</strong></span>
                                            ) : (
                                                "Veuillez noter que cet apprenant n'a pas encore d'encadrant, mais vous pouvez quand même lui affecter un sujet."
                                            )}
                                        </p>
                                    </div>
                                </div>
                                <button 
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="primary action-btn px-6 py-2.5 flex items-center gap-2 mt-2"
                                >
                                    {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                                    Enregistrer
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-4">
                                {loadingSujet ? (
                                    <div className="flex items-center justify-center py-20">
                                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        {/* Sujet Section */}
                                        <div className="bg-surface border border-glass-border rounded-xl p-5">
                                            <div className="flex items-center gap-2 mb-4">
                                                <BookOpen size={20} className="text-primary" />
                                                <h3 className="text-lg font-bold text-text">Sujet du Projet</h3>
                                            </div>
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-sm font-semibold text-text-muted mb-2">Titre du sujet</label>
                                                    <input 
                                                        type="text" 
                                                        value={sujet.titre}
                                                        onChange={e => setSujet({...sujet, titre: e.target.value})}
                                                        placeholder="Ex: Mise en place d'une architecture Microservices..."
                                                        className="form-input w-full font-bold"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-semibold text-text-muted mb-2">Description (Optionnel)</label>
                                                    <textarea 
                                                        value={sujet.description}
                                                        onChange={e => setSujet({...sujet, description: e.target.value})}
                                                        placeholder="Brève description du projet..."
                                                        className="form-input w-full min-h-[120px] resize-y leading-relaxed"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Objectifs Section */}
                                        <div className="bg-surface border border-glass-border rounded-xl p-5">
                                            <div className="flex items-center gap-2 mb-4">
                                                <Target size={20} className="text-secondary" />
                                                <h3 className="text-lg font-bold text-text">Objectifs</h3>
                                            </div>
                                            
                                            <div className="flex gap-2 mb-6">
                                                <input 
                                                    type="text" 
                                                    value={newObjectif}
                                                    onChange={e => setNewObjectif(e.target.value)}
                                                    onKeyDown={e => e.key === 'Enter' && addObjectif()}
                                                    placeholder="Nouvel objectif... (Appuyez sur Entrée)"
                                                    className="form-input flex-1 text-sm"
                                                />
                                                <button 
                                                    onClick={addObjectif}
                                                    className="px-6 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-all shadow-md shadow-primary/20 flex items-center gap-2"
                                                >
                                                    <Plus size={18} />
                                                    Ajouter
                                                </button>
                                            </div>

                                            <div className="space-y-2">
                                                <AnimatePresence>
                                                    {sujet.objectifs.map((obj, idx) => (
                                                        <motion.div 
                                                            key={idx}
                                                            initial={{ opacity: 0, y: -10 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            exit={{ opacity: 0, scale: 0.95 }}
                                                            className="flex items-start gap-3 p-3 bg-background border border-glass-border rounded-xl group"
                                                        >
                                                            <div className="mt-0.5 w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 font-bold text-xs">
                                                                {idx + 1}
                                                            </div>
                                                            <p className="flex-1 text-sm text-text font-medium leading-snug break-words">
                                                                {obj}
                                                            </p>
                                                            <button 
                                                                onClick={() => removeObjectif(idx)}
                                                                className="opacity-0 group-hover:opacity-100 p-1.5 text-text-muted hover:text-danger hover:bg-danger/10 rounded-lg transition-all"
                                                            >
                                                                <X size={16} />
                                                            </button>
                                                        </motion.div>
                                                    ))}
                                                </AnimatePresence>
                                                {sujet.objectifs.length === 0 && (
                                                    <div className="text-center py-8 text-text-muted text-sm border-2 border-dashed border-glass-border rounded-xl">
                                                        Aucun objectif défini. Ajoutez-en un ci-dessus !
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Toast Notification */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.3 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
                        className={`fixed bottom-6 right-6 flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl border backdrop-blur-xl z-50 text-white ${
                            toast.type === 'success'
                                ? 'bg-success/90 border-success/20 shadow-success/20'
                                : 'bg-error/90 border-error/20 shadow-error/20'
                        }`}
                    >
                        {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                        <span className="text-sm font-semibold">{toast.text}</span>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
