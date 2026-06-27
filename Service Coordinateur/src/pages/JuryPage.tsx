import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Search, Save, X, Loader2, CheckCircle2, AlertCircle, ChevronDown, Users, UserCheck, ShieldCheck, Eye, CalendarDays, Pencil
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

interface Enseignant {
    id: number;
    nom: string;
    prenom: string;
    email: string;
    specialite: Specialite | null;
}

interface Apprenant {
    id: number;
    nom: string;
    prenom: string;
    email: string;
    specialite: Specialite | null;
    encadrant: Enseignant | null;
    examinateurs: Enseignant[];
    rapporteurs: Enseignant[];
    sujetDetails?: { id: number; titre: string } | null;
    dateSoutenance?: string | null;
}

export default function JuryPage() {
    const [apprenants, setApprenants] = useState<Apprenant[]>([]);
    const [specialites, setSpecialites] = useState<Specialite[]>([]);
    const [formateurs, setFormateurs] = useState<Enseignant[]>([]);
    
    const [loadingApprenants, setLoadingApprenants] = useState(true);
    
    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [specialiteFilter, setSpecialiteFilter] = useState('');
    const [sujetFilter, setSujetFilter] = useState('ALL');
    const [encadrantFilter, setEncadrantFilter] = useState('ALL');
    const [yearFilter, setYearFilter] = useState('ALL');

    // Pagination
    const [page, setPage] = useState(0);
    const itemsPerPage = 6;

    // Modal state
    const [selectedApprenant, setSelectedApprenant] = useState<Apprenant | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);

    const [selectedExaminateurs, setSelectedExaminateurs] = useState<Set<number>>(new Set());
    const [selectedRapporteurs, setSelectedRapporteurs] = useState<Set<number>>(new Set());
    const [selectedDateSoutenance, setSelectedDateSoutenance] = useState<string>('');

    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    
    // Modal Formateurs Filters & Pagination
    const [formateurSearch, setFormateurSearch] = useState('');
    const [formateurSpecialiteFilter, setFormateurSpecialiteFilter] = useState('');
    const [formateurPage, setFormateurPage] = useState(0);
    const formateursPerPage = 4;

    const showToast = (type: 'success' | 'error', text: string) => {
        setToast({ type, text });
        setTimeout(() => setToast(null), 3000);
    };

    useEffect(() => {
        fetchSpecialites();
        fetchApprenants();
        fetchFormateurs();
    }, []);

    const fetchSpecialites = async () => {
        try {
            const res = await api.get('/affectation/specialites');
            setSpecialites(res.data);
        } catch (error) {
            console.error("Erreur chargement spécialités", error);
        }
    };

    const fetchFormateurs = async () => {
        try {
            const res = await api.get('/affectation/formateurs?size=1000');
            setFormateurs(res.data.content);
        } catch (error) {
            console.error("Erreur chargement formateurs", error);
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

    const openJuryModal = (a: Apprenant) => {
        setSelectedApprenant(a);
        setSelectedExaminateurs(new Set((a.examinateurs || []).map(e => e.id)));
        setSelectedRapporteurs(new Set((a.rapporteurs || []).map(e => e.id)));
        setSelectedDateSoutenance(a.dateSoutenance || '');
        setFormateurSearch('');
        setFormateurSpecialiteFilter('');
        setFormateurPage(0);
        setIsModalOpen(true);
    };

    const openViewModal = (e: React.MouseEvent, a: Apprenant) => {
        e.stopPropagation();
        setSelectedApprenant(a);
        setIsViewModalOpen(true);
    };

    const handleSave = async () => {
        if (!selectedApprenant) return;

        setSaving(true);
        try {
            const payload = {
                examinateursIds: Array.from(selectedExaminateurs),
                rapporteursIds: Array.from(selectedRapporteurs),
                dateSoutenance: selectedDateSoutenance || null
            };
            const res = await api.put(`/affectation/apprenant/${selectedApprenant.id}/jury`, payload);
            showToast('success', "Jury enregistré avec succès !");
            
            // Update local state
            setApprenants(prev => prev.map(a => 
                a.id === selectedApprenant.id ? res.data : a
            ));
            setIsModalOpen(false);
        } catch (error) {
            showToast('error', "Erreur lors de l'enregistrement du jury");
        } finally {
            setSaving(false);
        }
    };

    const toggleExaminateur = (id: number) => {
        setSelectedExaminateurs(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    const toggleRapporteur = (id: number) => {
        setSelectedRapporteurs(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    const filteredApprenants = useMemo(() => {
        return apprenants.filter(a => {
            const matchSearch = `${a.prenom} ${a.nom}`.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                (a.email || '').toLowerCase().includes(searchQuery.toLowerCase());
            const matchSpec = specialiteFilter ? a.specialite?.id?.toString() === specialiteFilter : true;
            const matchSujet = sujetFilter === 'ALL' ? true : sujetFilter === 'YES' ? !!a.sujetDetails : !a.sujetDetails;
            const matchEncadrant = encadrantFilter === 'ALL' ? true : encadrantFilter === 'YES' ? !!a.encadrant : !a.encadrant;
            const matchYear = yearFilter === 'ALL' ? true : a.dateSoutenance ? new Date(a.dateSoutenance).getFullYear().toString() === yearFilter : false;
            return matchSearch && matchSpec && matchSujet && matchEncadrant && matchYear;
        });
    }, [apprenants, searchQuery, specialiteFilter, sujetFilter, encadrantFilter, yearFilter]);

    useEffect(() => { setPage(0); }, [searchQuery, specialiteFilter, sujetFilter, encadrantFilter, yearFilter]);

    const totalPages = Math.ceil(filteredApprenants.length / itemsPerPage);
    const paginatedApprenants = filteredApprenants.slice(page * itemsPerPage, (page + 1) * itemsPerPage);

    const getInitials = (p: string, n: string) => `${(p||'').charAt(0)}${(n||'').charAt(0)}`.toUpperCase();

    const availableYears = useMemo(() => {
        const years = new Set<string>();
        apprenants.forEach(a => {
            if (a.dateSoutenance) years.add(new Date(a.dateSoutenance).getFullYear().toString());
        });
        return Array.from(years).sort((a, b) => Number(b) - Number(a));
    }, [apprenants]);

    const filteredFormateurs = formateurs.filter(f => {
        const matchSearch = `${f.prenom} ${f.nom}`.toLowerCase().includes(formateurSearch.toLowerCase());
        const matchSpec = formateurSpecialiteFilter ? f.specialite?.id?.toString() === formateurSpecialiteFilter : true;
        return matchSearch && matchSpec;
    });

    useEffect(() => { setFormateurPage(0); }, [formateurSearch, formateurSpecialiteFilter]);

    const formateurTotalPages = Math.ceil(filteredFormateurs.length / formateursPerPage);
    const paginatedFormateurs = filteredFormateurs.slice(formateurPage * formateursPerPage, (formateurPage + 1) * formateursPerPage);

    return (
        <div className="space-y-6 animate-fade-in pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold">Jury et Soutenances</h2>
                    <p className="text-text-muted">Affectez les examinateurs et rapporteurs à chaque apprenant.</p>
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
                        <div className="search-container flex-1 min-w-[200px]">
                            <div className="search-icon"><Search size={18} /></div>
                            <input 
                                type="text"
                                placeholder="Rechercher un apprenant par nom..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="search-input"
                            />
                        </div>

                        <div className="relative min-w-[150px] flex-1 sm:flex-none">
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
                        
                        <div className="relative min-w-[150px] flex-1">
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

                        <div className="relative min-w-[150px] flex-1">
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

                        <div className="relative min-w-[150px] flex-1">
                            <select
                                value={yearFilter}
                                onChange={(e) => setYearFilter(e.target.value)}
                                className="form-input appearance-none w-full font-bold bg-surface"
                            >
                                <option value="ALL">Toutes les années</option>
                                {availableYears.map(y => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>
                            <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                        </div>
                    </div>
                </div>

                {/* List of Apprenants */}
                {loadingApprenants ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    </div>
                ) : filteredApprenants.length === 0 ? (
                    <div className="py-20 text-center">
                        <Users size={48} className="mx-auto text-text-muted mb-4 opacity-40" />
                        <p className="text-text-muted font-medium">Aucun apprenant trouvé.</p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-surface-hover/50 text-text-muted text-xs uppercase tracking-widest">
                                        <th className="py-3 px-6 text-left">Apprenant</th>
                                        <th className="py-3 px-4 text-left">Spécialité</th>
                                        <th className="py-3 px-4 text-left">Encadrant</th>
                                        <th className="py-3 px-4 text-left">Examinateurs</th>
                                        <th className="py-3 px-4 text-left">Rapporteurs</th>
                                        <th className="py-3 px-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-glass-border">
                                    {paginatedApprenants.map(a => (
                                        <tr 
                                            key={a.id} 
                                            className="hover:bg-surface-hover/30 transition-colors group"
                                        >
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-4 flex-1">
                                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-primary/20 shrink-0">
                                                        {getInitials(a.prenom, a.nom)}
                                                    </div>
                                                    <span className="font-bold text-text">{a.prenom} {a.nom}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-4">
                                                <span className="tag tag-licence font-bold text-xs">{a.specialite?.nom || 'N/A'}</span>
                                            </td>
                                            <td className="py-4 px-4">
                                                {a.encadrant ? (
                                                    <span className="text-sm font-semibold text-text">{a.encadrant.prenom} {a.encadrant.nom}</span>
                                                ) : (
                                                    <span className="text-xs text-text-muted italic">Aucun</span>
                                                )}
                                            </td>
                                            <td className="py-4 px-4">
                                                {a.examinateurs && a.examinateurs.length > 0 ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
                                                        <ShieldCheck size={14}/> {a.examinateurs.length}
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-text-muted italic">0</span>
                                                )}
                                            </td>
                                            <td className="py-4 px-4">
                                                {a.rapporteurs && a.rapporteurs.length > 0 ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold" style={{ background: 'rgba(168, 85, 247, 0.1)', color: 'var(--secondary)' }}>
                                                        <UserCheck size={14}/> {a.rapporteurs.length}
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-text-muted italic">0</span>
                                                )}
                                            </td>
                                            <td className="py-4 px-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); openJuryModal(a); }}
                                                        className="p-2 text-text-muted hover:text-[#3b82f6] hover:bg-[#3b82f6]/10 rounded-lg transition-colors"
                                                        title="Modifier le Jury"
                                                    >
                                                        <Pencil size={18} />
                                                    </button>
                                                    <button 
                                                        onClick={(e) => openViewModal(e, a)}
                                                        className="p-2 text-text-muted hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                                        title="Aperçu du Jury"
                                                    >
                                                        <Eye size={18} />
                                                    </button>
                                                </div>
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
                            key="jury-modal"
                            initial={{ opacity: 0, scale: 0.9, y: 30 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 30 }}
                            className="modal-content"
                            style={{ maxWidth: '900px', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="modal-close" onClick={() => setIsModalOpen(false)}>
                                <X size={22} />
                            </div>

                            {/* Modal Header */}
                            <div className="pb-5 border-b border-glass-border mb-5 shrink-0 flex flex-col gap-4">
                                <div className="flex justify-between items-start mt-2">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-primary/20">
                                            {getInitials(selectedApprenant.prenom, selectedApprenant.nom)}
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-bold flex items-center gap-3">
                                                Jury pour {selectedApprenant.prenom} {selectedApprenant.nom}
                                            </h3>
                                            <p className="text-text-muted text-sm mt-1">
                                                Spécialité : <strong className="text-text">{selectedApprenant.specialite?.nom || 'N/A'}</strong>
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
                                
                                {/* Formateurs Filters & Date Soutenance */}
                                <div className="flex flex-wrap gap-4 mt-2 bg-surface-hover/30 p-4 rounded-xl border border-glass-border">
                                    <div className="search-container flex-1 min-w-[200px]">
                                        <div className="search-icon"><Search size={18} /></div>
                                        <input 
                                            type="text"
                                            placeholder="Filtrer les formateurs..."
                                            value={formateurSearch}
                                            onChange={e => setFormateurSearch(e.target.value)}
                                            className="search-input text-sm"
                                        />
                                    </div>
                                    <div className="relative w-1/4 min-w-[150px]">
                                        <select
                                            value={formateurSpecialiteFilter}
                                            onChange={(e) => setFormateurSpecialiteFilter(e.target.value)}
                                            className="form-input appearance-none w-full font-bold bg-surface"
                                        >
                                            <option value="">Spécialités</option>
                                            {specialites.map(s => (
                                                <option key={s.id} value={s.id.toString()}>{s.nom}</option>
                                            ))}
                                        </select>
                                        <ChevronDown size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                                    </div>
                                    <div className="flex-1 min-w-[200px]">
                                        <div className="flex flex-col gap-1">
                                            <label className="text-xs font-bold text-text-muted uppercase tracking-wider ml-1">Date et heure de soutenance</label>
                                            <div className="flex items-center gap-2 bg-surface border border-glass-border rounded-xl px-3 py-2 h-10">
                                                <CalendarDays size={16} className="text-primary" />
                                                <input 
                                                    type="datetime-local" 
                                                    value={selectedDateSoutenance ? selectedDateSoutenance.substring(0, 16) : ''}
                                                    onChange={e => setSelectedDateSoutenance(e.target.value ? `${e.target.value}:00` : '')}
                                                    className="bg-transparent border-none outline-none text-sm font-bold w-full text-text cursor-pointer"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Modal Body */}
                            <div className="flex-1 overflow-y-auto custom-scrollbar">
                                <div className="grid grid-cols-1 gap-4 p-4 pt-0">
                                    {paginatedFormateurs.length === 0 ? (
                                        <div className="text-center py-12 text-text-muted">Aucun formateur trouvé.</div>
                                    ) : (
                                        paginatedFormateurs.map(f => {
                                            const isExaminateur = selectedExaminateurs.has(f.id);
                                            const isRapporteur = selectedRapporteurs.has(f.id);
                                            const isEncadrant = selectedApprenant.encadrant?.id === f.id;

                                            return (
                                                <div key={f.id} className={`flex items-center justify-between p-4 rounded-xl border transition-all ${isExaminateur || isRapporteur ? 'bg-primary/5 border-primary/30 shadow-sm' : 'bg-surface border-glass-border hover:border-text-muted'}`}>
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-lg bg-surface-hover flex items-center justify-center text-text font-bold text-xs shrink-0">
                                                            {getInitials(f.prenom, f.nom)}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-sm text-text">
                                                                {f.prenom} {f.nom}
                                                                {isEncadrant && <span className="ml-2 text-[10px] bg-success/10 text-success px-2 py-0.5 rounded font-bold">Encadrant</span>}
                                                            </p>
                                                            <p className="text-xs text-text-muted">{f.specialite?.nom || 'Sans spécialité'}</p>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="flex gap-4">
                                                        <label className="flex items-center gap-2 cursor-pointer group">
                                                            <div className="relative flex items-center justify-center w-5 h-5">
                                                                <input 
                                                                    type="checkbox" 
                                                                    className="peer sr-only"
                                                                    checked={isExaminateur}
                                                                    onChange={() => toggleExaminateur(f.id)}
                                                                />
                                                                <div className="w-5 h-5 border-2 border-text-muted rounded flex items-center justify-center peer-checked:bg-[#3b82f6] peer-checked:border-[#3b82f6] transition-colors">
                                                                    {isExaminateur && <CheckCircle2 size={14} className="text-white" />}
                                                                </div>
                                                            </div>
                                                            <span className={`text-sm font-semibold transition-colors ${isExaminateur ? 'text-[#3b82f6]' : 'text-text-muted group-hover:text-text'}`}>
                                                                Examinateur
                                                            </span>
                                                        </label>

                                                        <label className="flex items-center gap-2 cursor-pointer group ml-2">
                                                            <div className="relative flex items-center justify-center w-5 h-5">
                                                                <input 
                                                                    type="checkbox" 
                                                                    className="peer sr-only"
                                                                    checked={isRapporteur}
                                                                    onChange={() => toggleRapporteur(f.id)}
                                                                />
                                                                <div className="w-5 h-5 border-2 border-text-muted rounded flex items-center justify-center peer-checked:bg-secondary peer-checked:border-secondary transition-colors">
                                                                    {isRapporteur && <CheckCircle2 size={14} className="text-white" />}
                                                                </div>
                                                            </div>
                                                            <span className={`text-sm font-semibold transition-colors ${isRapporteur ? 'text-secondary' : 'text-text-muted group-hover:text-text'}`}>
                                                                Rapporteur
                                                            </span>
                                                        </label>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                                
                                {filteredFormateurs.length > 0 && (
                                    <div className="mt-4 pb-4">
                                        <Pagination 
                                            page={formateurPage} 
                                            totalPages={formateurTotalPages} 
                                            total={filteredFormateurs.length} 
                                            itemsPerPage={formateursPerPage} 
                                            label="formateurs" 
                                            onPageChange={setFormateurPage} 
                                        />
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Read-Only View Modal */}
            <AnimatePresence>
                {isViewModalOpen && selectedApprenant && (
                    <div className="modal-overlay" onClick={() => setIsViewModalOpen(false)}>
                        <motion.div 
                            key="view-modal"
                            initial={{ opacity: 0, scale: 0.9, y: 30 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 30 }}
                            className="modal-content relative overflow-hidden"
                            style={{ maxWidth: '600px', width: '100%' }}
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-primary/20 to-secondary/20 z-0"></div>
                            
                            <div className="modal-close z-10 bg-surface/50 backdrop-blur-md" onClick={() => setIsViewModalOpen(false)}>
                                <X size={22} />
                            </div>

                            <div className="relative z-10 flex flex-col items-center mt-6 mb-8">
                                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-3xl shadow-xl shadow-primary/20 mb-4 border-4 border-surface">
                                    {getInitials(selectedApprenant.prenom, selectedApprenant.nom)}
                                </div>
                                <h3 className="text-2xl font-bold text-text text-center">
                                    {selectedApprenant.prenom} {selectedApprenant.nom}
                                </h3>
                                <p className="text-primary font-bold mt-1 bg-primary/10 px-3 py-1 rounded-full text-sm">
                                    {selectedApprenant.specialite?.nom || 'Aucune spécialité'}
                                </p>
                            </div>

                            <div className="space-y-6 relative z-10 bg-surface rounded-2xl">
                                {/* Soutenance Date */}
                                <div className="bg-surface-hover/30 p-4 rounded-xl border border-glass-border flex flex-col items-center justify-center text-center">
                                    <div className="flex items-center gap-2 mb-1">
                                        <CalendarDays size={18} className="text-text-muted" />
                                        <span className="text-sm font-bold text-text-muted uppercase tracking-wider">Date de Soutenance</span>
                                    </div>
                                    <div className="text-xl font-bold text-text">
                                        {selectedApprenant.dateSoutenance ? new Date(selectedApprenant.dateSoutenance).toLocaleString('fr-FR', {
                                            day: '2-digit', month: 'long', year: 'numeric',
                                            hour: '2-digit', minute: '2-digit'
                                        }) : <span className="text-text-muted italic text-base">Non définie</span>}
                                    </div>
                                </div>

                                {/* Encadrant */}
                                <div>
                                    <h4 className="text-sm font-bold text-text-muted uppercase tracking-wider mb-3 flex items-center gap-2">
                                        <UserCheck size={16} className="text-success" /> Encadrant
                                    </h4>
                                    {selectedApprenant.encadrant ? (
                                        <div className="flex items-center gap-3 p-3 bg-success/5 border border-success/20 rounded-xl">
                                            <div className="w-10 h-10 rounded-lg bg-success/20 text-success flex items-center justify-center font-bold text-sm">
                                                {getInitials(selectedApprenant.encadrant.prenom, selectedApprenant.encadrant.nom)}
                                            </div>
                                            <div>
                                                <p className="font-bold text-text">{selectedApprenant.encadrant.prenom} {selectedApprenant.encadrant.nom}</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-sm text-text-muted italic pl-2">Aucun encadrant affecté.</p>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Examinateurs */}
                                    <div>
                                        <h4 className="text-sm font-bold text-text-muted uppercase tracking-wider mb-3 flex items-center gap-2">
                                            <ShieldCheck size={16} className="text-[#3b82f6]" /> Examinateurs
                                        </h4>
                                        <div className="space-y-2">
                                            {selectedApprenant.examinateurs && selectedApprenant.examinateurs.length > 0 ? (
                                                selectedApprenant.examinateurs.map(e => (
                                                    <div key={`ex-${e.id}`} className="flex items-center gap-3 p-2.5 bg-blue-500/5 border border-blue-500/20 rounded-xl">
                                                        <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-500 flex items-center justify-center font-bold text-xs">
                                                            {getInitials(e.prenom, e.nom)}
                                                        </div>
                                                        <p className="font-semibold text-sm text-text">{e.prenom} {e.nom}</p>
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="text-sm text-text-muted italic pl-2">Aucun examinateur.</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Rapporteurs */}
                                    <div>
                                        <h4 className="text-sm font-bold text-text-muted uppercase tracking-wider mb-3 flex items-center gap-2">
                                            <UserCheck size={16} className="text-secondary" /> Rapporteurs
                                        </h4>
                                        <div className="space-y-2">
                                            {selectedApprenant.rapporteurs && selectedApprenant.rapporteurs.length > 0 ? (
                                                selectedApprenant.rapporteurs.map(e => (
                                                    <div key={`rap-${e.id}`} className="flex items-center gap-3 p-2.5 bg-secondary/5 border border-secondary/20 rounded-xl">
                                                        <div className="w-8 h-8 rounded-lg bg-secondary/20 text-secondary flex items-center justify-center font-bold text-xs">
                                                            {getInitials(e.prenom, e.nom)}
                                                        </div>
                                                        <p className="font-semibold text-sm text-text">{e.prenom} {e.nom}</p>
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="text-sm text-text-muted italic pl-2">Aucun rapporteur.</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
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
