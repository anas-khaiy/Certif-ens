import { useState, useEffect, useCallback } from 'react';
import {
    Users,
    GraduationCap,
    Search,
    ChevronLeft,
    ChevronRight,
    UserCheck,
    X,
    Filter,
    Loader2,
    CheckCircle2,
    AlertCircle,
    Trash2,
    UserPlus,
    CheckSquare,
    ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/api-client';

/* ──────────────────── Types ──────────────────── */
interface Specialite { id: number; nom: string; }
interface Enseignant {
    id: number; nom: string; prenom: string; email: string;
    specialite?: Specialite; photoProfile?: string;
}
interface Apprenant {
    id: number; nom: string; prenom: string; email: string; cin?: string;
    specialite?: Specialite; sexe?: string;
    encadrant?: Enseignant | null;
}
interface PageResponse<T> {
    content: T[]; totalPages: number; totalElements: number;
    number: number; size: number;
}

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
                            <button key={p} onClick={() => onPageChange(p)}
                                className={`w-10 h-10 rounded-xl font-bold transition-all text-xs border ${p === page ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-110 z-10' : 'bg-surface border-glass-border text-text-muted hover:border-primary hover:text-primary'}`}>
                                {p + 1}
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

/* ──────────────────── Main Page ──────────────────── */
const AffectationPage = () => {
    // ── Formateur list ──
    const [formateurs, setFormateurs] = useState<Enseignant[]>([]);
    const [formateurPage, setFormateurPage] = useState(0);
    const [formateurTotalPages, setFormateurTotalPages] = useState(0);
    const [formateurTotal, setFormateurTotal] = useState(0);
    const [formateurSearch, setFormateurSearch] = useState('');
    const [formateurSpecialiteFilter, setFormateurSpecialiteFilter] = useState('');
    const [loadingFormateurs, setLoadingFormateurs] = useState(true);

    // ── Modal ──
    const [selectedFormateur, setSelectedFormateur] = useState<Enseignant | null>(null);
    const [apprenants, setApprenants] = useState<Apprenant[]>([]);
    const [apprenantPage, setApprenantPage] = useState(0);
    const [apprenantTotalPages, setApprenantTotalPages] = useState(0);
    const [apprenantTotal, setApprenantTotal] = useState(0);
    const [apprenantSearch, setApprenantSearch] = useState('');
    const [specialiteFilter, setSpecialiteFilter] = useState<string>('');
    const [selectedApprenants, setSelectedApprenants] = useState<Set<number>>(new Set());
    const [loadingApprenants, setLoadingApprenants] = useState(false);
    const [saving, setSaving] = useState(false);

    // ── Specialites ──
    const [specialites, setSpecialites] = useState<Specialite[]>([]);

    // ── Toast ──
    const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // ── Confirm modal ──
    const [confirmModal, setConfirmModal] = useState<{ visible: boolean; formateur: Enseignant | null }>({ visible: false, formateur: null });

    const showToast = (type: 'success' | 'error', text: string) => {
        setToast({ type, text });
        setTimeout(() => setToast(null), 4000);
    };

    /* ── Fetch specialites ── */
    useEffect(() => {
        api.get('/affectation/specialites')
            .then(res => setSpecialites(res.data || []))
            .catch(() => {});
    }, []);

    /* ── Fetch formateurs ── */
    const fetchFormateurs = useCallback(async () => {
        setLoadingFormateurs(true);
        try {
            const params: any = { page: formateurPage, size: 8 };
            if (formateurSearch.trim()) params.search = formateurSearch.trim();
            if (formateurSpecialiteFilter) params.specialiteId = Number(formateurSpecialiteFilter);
            const res = await api.get<PageResponse<Enseignant>>('/affectation/formateurs', { params });
            setFormateurs(res.data.content);
            setFormateurTotalPages(res.data.totalPages);
            setFormateurTotal(res.data.totalElements);
        } catch { }
        setLoadingFormateurs(false);
    }, [formateurPage, formateurSearch, formateurSpecialiteFilter]);

    useEffect(() => { fetchFormateurs(); }, [fetchFormateurs]);
    useEffect(() => { setFormateurPage(0); }, [formateurSearch, formateurSpecialiteFilter]);

    /* ── Fetch apprenants (modal) ── */
    const fetchApprenants = useCallback(async () => {
        if (!selectedFormateur) return;
        setLoadingApprenants(true);
        try {
            const params: any = { page: apprenantPage, size: 6, formateurId: selectedFormateur.id };
            if (apprenantSearch.trim()) params.search = apprenantSearch.trim();
            if (specialiteFilter) params.specialiteId = Number(specialiteFilter);
            const res = await api.get<PageResponse<Apprenant>>('/affectation/apprenants', { params });
            setApprenants(res.data.content);
            setApprenantTotalPages(res.data.totalPages);
            setApprenantTotal(res.data.totalElements);
        } catch { }
        setLoadingApprenants(false);
    }, [selectedFormateur, apprenantPage, apprenantSearch, specialiteFilter]);

    useEffect(() => { fetchApprenants(); }, [fetchApprenants]);
    useEffect(() => { setApprenantPage(0); }, [apprenantSearch, specialiteFilter]);

    /* ── Open modal & pre-select assigned ── */
    const openModal = async (f: Enseignant) => {
        setSelectedFormateur(f);
        setApprenantPage(0);
        setApprenantSearch('');
        setSpecialiteFilter('');
        // Fetch already-assigned apprenants for this formateur
        try {
            const res = await api.get<number[]>(`/affectation/formateur/${f.id}/apprenants`);
            setSelectedApprenants(new Set(res.data));
        } catch {
            setSelectedApprenants(new Set());
        }
    };

    /* ── Toggle selection ── */
    const toggleApprenant = (id: number) => {
        setSelectedApprenants(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    /* ── Save assignment (with confirmation) ── */
    const handleSaveClick = () => {
        if (!selectedFormateur) return;
        setConfirmModal({ visible: true, formateur: selectedFormateur });
    };

    const confirmSave = async () => {
        if (!confirmModal.formateur) return;
        setConfirmModal({ visible: false, formateur: null });
        setSaving(true);
        try {
            await api.post('/affectation/assign', {
                enseignantId: confirmModal.formateur.id,
                apprenantIds: Array.from(selectedApprenants)
            });
            showToast('success', `${selectedApprenants.size} apprenant(s) affecté(s) à ${confirmModal.formateur.prenom} ${confirmModal.formateur.nom}`);
            setSelectedFormateur(null);
            fetchFormateurs();
        } catch {
            showToast('error', 'Erreur lors de l\'affectation');
        }
        setSaving(false);
    };

    /* ── Helpers ── */
    const getInitials = (prenom: string, nom: string) =>
        `${(prenom?.[0] || '').toUpperCase()}${(nom?.[0] || '').toUpperCase()}`;

    return (
        <div className="space-y-6 animate-fade-in pb-20">
            {/* ── Header ── */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold">Affectation des Apprenants</h2>
                    <p className="text-text-muted">Cliquez sur un formateur pour lui affecter des apprenants.</p>
                </div>
                <div className="flex gap-3">
                    <div className="glass px-4 py-2.5 flex items-center gap-2">
                        <Users size={16} className="text-primary" />
                        <span className="text-sm font-bold text-text">{formateurTotal} Formateur{formateurTotal > 1 ? 's' : ''}</span>
                    </div>
                </div>
            </div>

            {/* ── Table ── */}
            <div className="glass overflow-hidden shadow-xl">
                <div className="p-6 border-b border-glass-border">
                    <div className="flex flex-col sm:flex-row gap-4 items-center">
                        <div className="search-container flex-1 w-full">
                            <div className="search-icon"><Search size={18} /></div>
                            <input
                                type="text"
                                placeholder="Rechercher un formateur..."
                                className="search-input w-full"
                                value={formateurSearch}
                                onChange={e => { setFormateurSearch(e.target.value); setFormateurPage(0); }}
                            />
                        </div>
                        <div className="relative min-w-[200px] w-full sm:w-auto">
                            <select
                                value={formateurSpecialiteFilter}
                                onChange={e => setFormateurSpecialiteFilter(e.target.value)}
                                className="form-input appearance-none w-full font-bold bg-surface"
                            >
                                <option value="">Toutes les spécialités</option>
                                {specialites.map(s => (
                                    <option key={s.id} value={s.id}>{s.nom}</option>
                                ))}
                            </select>
                            <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                        </div>
                    </div>
                </div>

                {loadingFormateurs ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    </div>
                ) : formateurs.length === 0 ? (
                    <div className="py-20 text-center">
                        <Users size={48} className="mx-auto text-text-muted mb-4 opacity-40" />
                        <p className="text-text-muted font-medium">Aucun formateur trouvé</p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-surface-hover/50 text-text-muted text-xs uppercase tracking-widest">
                                        <th>Formateur</th>
                                        <th>Email</th>
                                        <th>Spécialité</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-glass-border">
                                    {formateurs.map((f, idx) => (
                                        <tr key={f.id} className="hover:bg-surface-hover/30 transition-colors">
                                            <td>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-primary/20 shrink-0">
                                                        {getInitials(f.prenom, f.nom)}
                                                    </div>
                                                    <span className="font-bold text-text">{f.prenom} {f.nom}</span>
                                                </div>
                                            </td>
                                            <td className="text-text-muted">{f.email}</td>
                                            <td>
                                                <span className="tag tag-licence font-bold">{f.specialite?.nom || 'N/A'}</span>
                                            </td>
                                            <td>
                                                <div className="flex justify-center">
                                                    <button onClick={() => openModal(f)}
                                                        className="primary action-btn text-xs px-4 py-2 flex items-center gap-2">
                                                        <UserPlus size={15} />
                                                        Affecter
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <Pagination page={formateurPage} totalPages={formateurTotalPages} total={formateurTotal} itemsPerPage={8} label="formateurs" onPageChange={setFormateurPage} />
                    </>
                )}
            </div>

            {/* ══════════════ Assignment Modal ══════════════ */}
            <AnimatePresence>
                {selectedFormateur && (
                    <div className="modal-overlay" onClick={() => setSelectedFormateur(null)}>
                        <motion.div
                            key="assign-modal"
                            initial={{ opacity: 0, scale: 0.9, y: 30 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 30 }}
                            className="modal-content"
                            style={{ maxWidth: '1000px', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Close btn */}
                            <div className="modal-close" onClick={() => setSelectedFormateur(null)}>
                                <X size={22} />
                            </div>

                            {/* Header */}
                            <div className="pb-5 border-b border-glass-border mb-5 shrink-0">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-primary/20">
                                        {getInitials(selectedFormateur.prenom, selectedFormateur.nom)}
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-bold flex items-center gap-3">
                                            <div className="p-2 bg-primary/10 rounded-xl text-primary">
                                                <UserCheck size={22} />
                                            </div>
                                            Affecter à {selectedFormateur.prenom} {selectedFormateur.nom}
                                        </h3>
                                        <p className="text-text-muted text-sm mt-1">
                                            {selectedFormateur.specialite?.nom || 'Aucune spécialité'} · {selectedFormateur.email}
                                        </p>
                                    </div>
                                </div>

                                {/* Filters */}
                                <div className="flex flex-col sm:flex-row gap-3 mt-5">
                                    <div className="search-container flex-1">
                                        <div className="search-icon"><Search size={16} /></div>
                                        <input
                                            type="text"
                                            placeholder="Rechercher par nom ou prénom..."
                                            className="search-input"
                                            value={apprenantSearch}
                                            onChange={e => setApprenantSearch(e.target.value)}
                                        />
                                    </div>
                                    <div className="relative max-w-xs flex-1">
                                        <select
                                            value={specialiteFilter}
                                            onChange={e => setSpecialiteFilter(e.target.value)}
                                            className="form-input appearance-none w-full font-bold bg-surface"
                                        >
                                            <option value="">Toutes les spécialités</option>
                                            {specialites.map(s => (
                                                <option key={s.id} value={s.id}>{s.nom}</option>
                                            ))}
                                        </select>
                                        <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                                    </div>
                                </div>

                                {/* Counter */}
                                <div className="flex items-center justify-between mt-4">
                                    <p className="text-xs text-text-muted">
                                        {apprenantTotal} apprenant{apprenantTotal > 1 ? 's' : ''} trouvé{apprenantTotal > 1 ? 's' : ''}
                                    </p>
                                    {selectedApprenants.size > 0 && (
                                        <motion.span
                                            initial={{ scale: 0.8, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            className="tag tag-licence font-bold text-xs"
                                        >
                                            {selectedApprenants.size} sélectionné{selectedApprenants.size > 1 ? 's' : ''}
                                        </motion.span>
                                    )}
                                </div>
                            </div>

                            {/* Body - scrollable */}
                            <div className="flex-1 overflow-y-auto custom-scrollbar" style={{ minHeight: '300px' }}>
                                {loadingApprenants ? (
                                    <div className="flex items-center justify-center py-16">
                                        <Loader2 className="w-6 h-6 text-primary animate-spin" />
                                    </div>
                                ) : apprenants.length === 0 ? (
                                    <div className="text-center py-16">
                                        <GraduationCap size={48} className="mx-auto text-text-muted mb-3 opacity-40" />
                                        <p className="text-text-muted font-medium">Aucun apprenant trouvé</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto w-full pb-20">
                                        <table className="w-full min-w-[650px]">
                                            <thead>
                                                <tr className="bg-surface-hover/50 text-text-muted text-xs uppercase tracking-widest">
                                                    <th style={{ width: '60px' }} className="py-3 px-4"></th>
                                                    <th className="py-3 px-4">Apprenant</th>
                                                    <th className="py-3 px-4">Email</th>
                                                    <th className="py-3 px-4">Spécialité</th>
                                                    <th className="py-3 px-4">Encadrant actuel</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-glass-border">
                                                {apprenants.map((a) => {
                                                    const isSelected = selectedApprenants.has(a.id);
                                                    const isAssignedToOther = Boolean(a.encadrant && a.encadrant.id !== selectedFormateur!.id);
                                                    return (
                                                        <tr key={a.id}
                                                            onClick={() => { if (!isAssignedToOther) toggleApprenant(a.id); }}
                                                            className={`transition-colors ${isAssignedToOther ? 'opacity-60 cursor-not-allowed bg-surface-hover/10' : (isSelected ? 'bg-primary/5 hover:bg-primary/10 cursor-pointer' : 'hover:bg-surface-hover/30 cursor-pointer')}`}>
                                                            <td className="py-3 px-4">
                                                                <div className={`checkbox-wrapper-23 ${isAssignedToOther ? 'disabled' : ''}`} onClick={(e) => e.stopPropagation()}>
                                                                    <input 
                                                                        type="checkbox" 
                                                                        id={`check-${a.id}`} 
                                                                        checked={isSelected}
                                                                        readOnly
                                                                        disabled={isAssignedToOther}
                                                                        onClick={() => { if (!isAssignedToOther) toggleApprenant(a.id); }}
                                                                    />
                                                                    <label htmlFor={`check-${a.id}`}>
                                                                        <svg viewBox="0,0,50,50">
                                                                            <path d="M5 30 L 20 45 L 45 5"></path>
                                                                        </svg>
                                                                    </label>
                                                                </div>
                                                            </td>
                                                            <td className="py-3 px-4">
                                                                <div className="flex items-center gap-3">
                                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs shrink-0 ${isAssignedToOther ? 'bg-surface-hover/80 text-text-muted' : 'bg-gradient-to-br from-secondary/80 to-primary/60'}`}>
                                                                        {getInitials(a.prenom, a.nom)}
                                                                    </div>
                                                                    <span className={`font-bold ${isAssignedToOther ? 'text-text-muted' : 'text-text'}`}>{a.prenom} {a.nom}</span>
                                                                </div>
                                                            </td>
                                                            <td className="text-text-muted text-sm py-3 px-4">{a.email}</td>
                                                            <td className="py-3 px-4">
                                                                <span className={`tag font-bold text-xs ${isAssignedToOther ? 'bg-surface-hover text-text-muted' : 'tag-licence'}`}>
                                                                    {a.specialite?.nom || 'N/A'}
                                                                </span>
                                                            </td>
                                                            <td className="py-3 px-4">
                                                                {isAssignedToOther ? (
                                                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold" style={{ background: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)' }}>
                                                                        <AlertCircle size={12} />
                                                                        {a.encadrant?.prenom} {a.encadrant?.nom}
                                                                    </span>
                                                                ) : a.encadrant ? (
                                                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)' }}>
                                                                        <CheckCircle2 size={12} />
                                                                        Ce formateur
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-text-muted text-xs">—</span>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                        {/* Spacer to guarantee scroll visibility */}
                                        <div className="h-24 w-full"></div>
                                    </div>
                                )}
                            </div>

                            {/* Footer with pagination */}
                            <div className="shrink-0 mt-4 flex flex-col gap-4 bg-surface p-4 rounded-xl border border-glass-border">
                                {apprenantTotalPages > 1 && (
                                    <div className="w-full overflow-hidden rounded-lg">
                                        <Pagination page={apprenantPage} totalPages={apprenantTotalPages} total={apprenantTotal} itemsPerPage={6} label="apprenants" onPageChange={setApprenantPage} />
                                    </div>
                                )}
                                <div className="flex gap-4">
                                    <button type="button" onClick={() => setSelectedFormateur(null)} className="flex-1 secondary h-12 rounded-xl font-bold">
                                        Annuler
                                    </button>
                                    <button
                                        onClick={handleSaveClick}
                                        disabled={saving}
                                        className="flex-1 primary h-12 rounded-xl font-bold flex items-center justify-center gap-2"
                                    >
                                        {saving ? <Loader2 size={18} className="animate-spin" /> : <UserCheck size={18} />}
                                        Enregistrer l'affectation ({selectedApprenants.size})
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ══════════════ Confirm Modal ══════════════ */}
            <AnimatePresence>
                {confirmModal.visible && confirmModal.formateur && (
                    <div className="modal-overlay" onClick={() => setConfirmModal({ visible: false, formateur: null })}>
                        <motion.div
                            key="confirm-modal"
                            initial={{ opacity: 0, scale: 0.9, y: 30 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 30 }}
                            className="glass max-w-md w-full p-8 space-y-6 relative overflow-hidden text-center"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                <UserCheck size={40} className="text-primary" />
                            </div>
                            <h3 className="text-2xl font-bold mb-2">Confirmer l'affectation</h3>
                            <p className="text-text-muted mb-6">
                                Voulez-vous affecter <span className="text-text font-bold">{selectedApprenants.size} apprenant{selectedApprenants.size > 1 ? 's' : ''}</span> à <span className="text-text font-bold">{confirmModal.formateur.prenom} {confirmModal.formateur.nom}</span> ?
                            </p>
                            <div className="flex gap-4">
                                <button
                                    onClick={() => setConfirmModal({ visible: false, formateur: null })}
                                    className="flex-1 px-6 py-3 rounded-xl bg-surface border border-glass-border font-bold hover:bg-surface-hover transition-all text-text"
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={confirmSave}
                                    className="flex-1 px-6 py-3 rounded-xl bg-primary text-white font-bold hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all"
                                >
                                    Confirmer
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ── Toast ── */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50 }}
                        className={`fixed bottom-6 right-6 z-[60] px-5 py-3 rounded-xl border shadow-xl flex items-center gap-3 ${
                            toast.type === 'success'
                                ? 'bg-success/10 border-success/20 text-success'
                                : 'bg-error/10 border-error/20 text-error'
                        }`}
                        style={{ backdropFilter: 'blur(12px)' }}
                    >
                        {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                        <span className="text-sm font-semibold">{toast.text}</span>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AffectationPage;
