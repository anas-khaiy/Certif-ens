import { useState, useEffect } from 'react';
import {
    Users, Search, ChevronDown, Loader2, CheckCircle2, AlertCircle, Save, X, BookOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/api-client';

interface Specialite { id: number; nom: string; }
interface Cycle { id: number; nomCycle: string; }
interface Enseignant {
    id: number; nom: string; prenom: string; email: string;
    specialite?: Specialite; photoProfile?: string;
}
interface Sujet {
    id: number; titre: string; description?: string;
    formateur?: { id: number; nom: string; prenom: string };
    modifiePar?: { id: number; nom: string; prenom: string; email: string } | null;
    apprenant?: { id: number } | null;
}
interface Apprenant {
    id: number; nom: string; prenom: string; email: string; cin?: string;
    specialite?: Specialite; cycle?: Cycle; sexe?: string;
    encadrant?: Enseignant | null;
    coordinateur?: { id: number; email: string; nom: string; prenom: string } | null;
    sujetDetails?: Sujet | null;
}
interface PageResponse<T> {
    content: T[]; totalPages: number; totalElements: number;
    number: number; size: number;
}

const MesAffectationsPage = () => {
    const [apprenants, setApprenants] = useState<Apprenant[]>([]);
    const [formateurs, setFormateurs] = useState<Enseignant[]>([]);
    const [sujets, setSujets] = useState<Sujet[]>([]);
    const [specialites, setSpecialites] = useState<Specialite[]>([]);
    const [cycles, setCycles] = useState<Cycle[]>([]);

    const [loadingApprenants, setLoadingApprenants] = useState(true);
    const [loadingFormateurs, setLoadingFormateurs] = useState(true);
    const [loadingSujets, setLoadingSujets] = useState(true);

    const [searchQuery, setSearchQuery] = useState('');
    const [specialiteFilter, setSpecialiteFilter] = useState('');
    const [cycleFilter, setCycleFilter] = useState('');
    const [encadrantFilter, setEncadrantFilter] = useState('ALL');
    const [sujetFilter, setSujetFilter] = useState('ALL');

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 15;

    const [editingId, setEditingId] = useState<number | null>(null);
    const [editEncadrantId, setEditEncadrantId] = useState<number | null>(null);
    const [editSujetId, setEditSujetId] = useState<number | null>(null);
    const [savingRow, setSavingRow] = useState<number | null>(null);
    const [currentCoordEmail, setCurrentCoordEmail] = useState<string>('');

    const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const showToast = (type: 'success' | 'error', text: string) => {
        setToast({ type, text });
        setTimeout(() => setToast(null), 4000);
    };

    useEffect(() => {
        fetchSpecialites();
        fetchCycles();
        fetchFormateurs();
        fetchSujets();
        fetchCurrentUser();
        fetchApprenants();
    }, []);

    const fetchCurrentUser = async () => {
        try {
            const res = await api.get('/auth/me');
            setCurrentCoordEmail(res.data.email || '');
        } catch {}
    };

    const fetchSpecialites = async () => {
        try {
            const res = await api.get('/affectation/specialites');
            setSpecialites(res.data || []);
        } catch {}
    };

    const fetchCycles = async () => {
        try {
            const res = await api.get('/affectation/cycles');
            setCycles(res.data || []);
        } catch {}
    };

    const fetchFormateurs = async () => {
        setLoadingFormateurs(true);
        try {
            const res = await api.get<PageResponse<Enseignant>>('/affectation/formateurs', { params: { page: 0, size: 1000 } });
            setFormateurs(res.data.content);
        } catch {}
        setLoadingFormateurs(false);
    };

    const fetchApprenants = async () => {
        setLoadingApprenants(true);
        try {
            const res = await api.get<PageResponse<Apprenant>>('/affectation/all-apprenants', { params: { size: 1000 } });
            setApprenants(res.data.content);
        } catch {}
        setLoadingApprenants(false);
    };

    const fetchSujets = async () => {
        setLoadingSujets(true);
        try {
            const res = await api.get<Sujet[]>('/affectation/sujets');
            setSujets(res.data || []);
        } catch {}
        setLoadingSujets(false);
    };

    const startEditing = (a: Apprenant) => {
        setEditingId(a.id);
        setEditEncadrantId(a.encadrant?.id ?? null);
        setEditSujetId(a.sujetDetails?.id ?? null);
    };

    const cancelEditing = () => {
        setEditingId(null);
        setEditEncadrantId(null);
        setEditSujetId(null);
    };

    const handleEncadrantChange = (apprenantId: number, encadrantId: string) => {
        const id = encadrantId ? parseInt(encadrantId) : null;
        setEditEncadrantId(id);
        setEditSujetId(null);
    };

    const handleSujetChange = async (apprenant: Apprenant, sujetId: string) => {
        const sujetIdNum = sujetId ? parseInt(sujetId) : null;
        setEditSujetId(sujetIdNum);
        if (!sujetIdNum) return;

        const sujet = sujets.find(s => s.id === sujetIdNum);
        const formateurId = sujet?.formateur?.id;
        if (formateurId) setEditEncadrantId(formateurId);

        setSavingRow(apprenant.id);
        try {
            if (formateurId !== null && formateurId !== (apprenant.encadrant?.id ?? null)) {
                await api.post('/affectation/assign', {
                    enseignantId: formateurId,
                    apprenantIds: [apprenant.id]
                });
            }
            if (sujetIdNum !== (apprenant.sujetDetails?.id ?? null)) {
                await api.post(`/affectation/apprenant/${apprenant.id}/affecter-sujet/${sujetIdNum}`);
            }
            showToast('success', 'Affectation mise à jour avec succès');
            cancelEditing();
            fetchApprenants();
            fetchSujets();
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Erreur lors de l'affectation";
            showToast('error', msg);
        }
        setSavingRow(null);
    };

    const handleSave = async (apprenant: Apprenant) => {
        if (editEncadrantId === null && editSujetId === null) {
            cancelEditing();
            return;
        }
        setSavingRow(apprenant.id);
        try {
            if (editEncadrantId !== null && editEncadrantId !== (apprenant.encadrant?.id ?? null)) {
                await api.post('/affectation/assign', {
                    enseignantId: editEncadrantId,
                    apprenantIds: [apprenant.id]
                });
            }
            if (editSujetId !== null && editSujetId !== (apprenant.sujetDetails?.id ?? null)) {
                await api.post(`/affectation/apprenant/${apprenant.id}/affecter-sujet/${editSujetId}`);
            }
            showToast('success', 'Affectation mise à jour avec succès');
            cancelEditing();
            fetchApprenants();
            fetchSujets();
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Erreur lors de l'affectation";
            showToast('error', msg);
        }
        setSavingRow(null);
    };

    const getInitials = (p: string, n: string) =>
        `${(p?.[0] || '').toUpperCase()}${(n?.[0] || '').toUpperCase()}`;

    const isOwnApprenant = (a: Apprenant) =>
        !a.coordinateur || a.coordinateur.email === currentCoordEmail;

    const filteredApprenants = apprenants.filter(a => {
        const matchSearch = `${a.prenom} ${a.nom} ${a.email}`.toLowerCase().includes(searchQuery.toLowerCase());
        const matchSpec = specialiteFilter ? a.specialite?.id?.toString() === specialiteFilter : true;
        const matchCycle = cycleFilter ? a.cycle?.id?.toString() === cycleFilter : true;
        const matchEncadrant = encadrantFilter === 'ALL' ? true : encadrantFilter === 'YES' ? !!a.encadrant : !a.encadrant;
        const matchSujet = sujetFilter === 'ALL' ? true : sujetFilter === 'YES' ? !!a.sujetDetails : !a.sujetDetails;
        return matchSearch && matchSpec && matchCycle && matchEncadrant && matchSujet;
    });

    const filteredSujets = sujets.filter(s => {
        if (searchQuery) {
            const match = s.titre.toLowerCase().includes(searchQuery.toLowerCase());
            if (!match) return false;
        }
        if (s.apprenant) {
            const app = apprenants.find(a => a.id === s.apprenant?.id);
            if (specialiteFilter && app?.specialite?.id?.toString() !== specialiteFilter) return false;
            if (cycleFilter && app?.cycle?.id?.toString() !== cycleFilter) return false;
            if (encadrantFilter !== 'ALL') {
                const hasEncadrant = !!app?.encadrant;
                if (encadrantFilter === 'YES' && !hasEncadrant) return false;
                if (encadrantFilter === 'NO' && hasEncadrant) return false;
            }
            if (sujetFilter !== 'ALL') {
                const hasSujet = !!app?.sujetDetails;
                if (sujetFilter === 'YES' && !hasSujet) return false;
                if (sujetFilter === 'NO' && hasSujet) return false;
            }
        } else {
            if (sujetFilter === 'YES') return false;
            if (encadrantFilter === 'YES') return false;
        }
        return true;
    });
    const sujetsDisponibles = filteredSujets.filter(s => !s.apprenant);
    const sujetsAttribues = filteredSujets.filter(s => s.apprenant);

    const pageCount = Math.ceil(filteredApprenants.length / itemsPerPage);
    const paginatedApprenants = filteredApprenants.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    return (
        <div className="space-y-6 animate-fade-in pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold">Mes Affectations</h2>
                    <p className="text-text-muted">Affectez directement un encadrant et un sujet à chaque apprenant.</p>
                </div>
                <div className="flex gap-3">
                    <div className="glass px-4 py-2.5 flex items-center gap-2">
                        <BookOpen size={16} className="text-primary" />
                        <span className="text-sm font-bold text-text">{filteredSujets.length} Sujet{filteredSujets.length > 1 ? 's' : ''}</span>
                    </div>
                    <div className="glass px-4 py-2.5 flex items-center gap-2">
                        <Users size={16} className="text-primary" />
                        <span className="text-sm font-bold text-text">{filteredApprenants.length} Apprenant{filteredApprenants.length > 1 ? 's' : ''}</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="glass p-5 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary">
                        <BookOpen size={24} />
                    </div>
                    <div>
                        <p className="text-2xl font-bold">{sujetsAttribues.length}</p>
                        <p className="text-xs text-text-muted">Sujets attribués</p>
                    </div>
                </div>
                <div className="glass p-5 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center text-warning">
                        <BookOpen size={24} />
                    </div>
                    <div>
                        <p className="text-2xl font-bold">{sujetsDisponibles.length}</p>
                        <p className="text-xs text-text-muted">Sujets disponibles</p>
                    </div>
                </div>
                <div className="glass p-5 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                        <Users size={24} />
                    </div>
                    <div>
                        <p className="text-2xl font-bold">{filteredApprenants.filter(a => a.encadrant && a.sujetDetails).length}</p>
                        <p className="text-xs text-text-muted">Apprenants complets</p>
                    </div>
                </div>
            </div>

            <div className="glass overflow-hidden shadow-xl">
                <div className="p-6 border-b border-glass-border">
                    <div className="flex flex-wrap gap-4 items-center">
                        <div className="search-container flex-1 min-w-[200px]">
                            <div className="search-icon"><Search size={18} /></div>
                            <input
                                type="text"
                                placeholder="Rechercher par nom ou email..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="search-input"
                            />
                        </div>
                        <div className="relative min-w-[180px] flex-1">
                            <select
                                value={specialiteFilter}
                                onChange={e => setSpecialiteFilter(e.target.value)}
                                className="form-input appearance-none w-full font-bold bg-surface"
                            >
                                <option value="">Toutes les spécialités</option>
                                {specialites.map(s => (
                                    <option key={s.id} value={s.id.toString()}>{s.nom}</option>
                                ))}
                            </select>
                            <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                        </div>
                        <div className="relative min-w-[180px] flex-1">
                            <select
                                value={cycleFilter}
                                onChange={e => setCycleFilter(e.target.value)}
                                className="form-input appearance-none w-full font-bold bg-surface"
                            >
                                <option value="">Tous les cycles</option>
                                {cycles.map(c => (
                                    <option key={c.id} value={c.id.toString()}>{c.nomCycle}</option>
                                ))}
                            </select>
                            <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                        </div>
                        <div className="relative min-w-[160px] flex-1">
                            <select
                                value={encadrantFilter}
                                onChange={e => setEncadrantFilter(e.target.value)}
                                className="form-input appearance-none w-full font-bold bg-surface"
                            >
                                <option value="ALL">Tous les encadrants</option>
                                <option value="YES">Avec encadrant</option>
                                <option value="NO">Sans encadrant</option>
                            </select>
                            <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                        </div>
                        <div className="relative min-w-[160px] flex-1">
                            <select
                                value={sujetFilter}
                                onChange={e => setSujetFilter(e.target.value)}
                                className="form-input appearance-none w-full font-bold bg-surface"
                            >
                                <option value="ALL">Tous les sujets</option>
                                <option value="YES">Avec sujet</option>
                                <option value="NO">Sans sujet</option>
                            </select>
                            <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                        </div>
                    </div>
                </div>

                {loadingApprenants || loadingFormateurs ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    </div>
                ) : filteredApprenants.length === 0 ? (
                    <div className="py-20 text-center">
                        <Users size={48} className="mx-auto text-text-muted mb-4 opacity-40" />
                        <p className="text-text-muted font-medium">Aucun apprenant trouvé</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-surface-hover/50 text-text-muted text-xs uppercase tracking-widest">
                                    <th className="py-3 px-6 text-left">Apprenant</th>
                                    <th className="py-3 px-4 text-left">Spécialité</th>
                                    <th className="py-3 px-4 text-left">Cycle</th>
                                    <th className="py-3 px-4 text-left">Coordinateur</th>
                                    <th className="py-3 px-4 text-left">Encadrant</th>
                                    <th className="py-3 px-4 text-left">Sujet</th>
                                    <th className="py-3 px-4 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-glass-border">
                                {paginatedApprenants.map(a => {
                                    const isEditing = editingId === a.id;
                                    return (
                                        <tr key={a.id} className="hover:bg-surface-hover/30 transition-colors">
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-primary/20 shrink-0">
                                                        {getInitials(a.prenom, a.nom)}
                                                    </div>
                                                    <div>
                                                        <span className="font-bold text-text block">{a.prenom} {a.nom}</span>
                                                        <span className="text-xs text-text-muted">{a.email}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-4">
                                                <span className="tag tag-licence font-bold text-xs">{a.specialite?.nom || 'N/A'}</span>
                                            </td>
                                            <td className="py-4 px-4">
                                                <span className="tag tag-master font-bold text-xs">{a.cycle?.nomCycle || 'N/A'}</span>
                                            </td>
                                            <td className="py-4 px-4">
                                                {a.coordinateur ? (
                                                    <span className={`text-xs font-semibold ${isOwnApprenant(a) ? 'text-primary' : 'text-text-muted'}`}>
                                                        {a.coordinateur.prenom} {a.coordinateur.nom}
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-text-muted italic">Non assigné</span>
                                                )}
                                            </td>
                                            <td className="py-4 px-4">
                                                {isEditing ? (
                                                    <div className="relative">
                                                        <select
                                                            value={editEncadrantId ?? ''}
                                                            onChange={e => handleEncadrantChange(a.id, e.target.value)}
                                                            className="form-input appearance-none w-full font-bold bg-surface text-sm py-2"
                                                        >
                                                            <option value="">-- Aucun --</option>
                                                            {formateurs.map(f => (
                                                                <option key={f.id} value={f.id}>{f.prenom} {f.nom}</option>
                                                            ))}
                                                        </select>
                                                        <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                                                    </div>
                                                ) : a.encadrant ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)' }}>
                                                        <CheckCircle2 size={12} />
                                                        {a.encadrant.prenom} {a.encadrant.nom}
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold" style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)' }}>
                                                        <AlertCircle size={12} /> Non affecté
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-4 px-4">
                                                {isEditing ? (
                                                    <div className="relative">
                                                        <select
                                                            value={editSujetId ?? ''}
                                                            onChange={e => handleSujetChange(a, e.target.value)}
                                                            className="form-input appearance-none w-full font-bold bg-surface text-sm py-2"
                                                            disabled={!editEncadrantId}
                                                        >
                                                            <option value="">-- Choisir un sujet --</option>
                                                            {sujets.filter(s => (!s.apprenant || s.apprenant.id === a.id) && s.formateur?.id === editEncadrantId).map(s => (
                                                                <option key={s.id} value={s.id}>
                                                                    {s.titre}
                                                                </option>
                                                            ))}
                                                        </select>
                                                        <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                                                    </div>
                                                ) : a.sujetDetails ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold" style={{ background: 'rgba(168, 85, 247, 0.1)', color: 'var(--secondary)' }}>
                                                        <CheckCircle2 size={12} /> {a.sujetDetails.titre?.substring(0, 30)}{a.sujetDetails.titre?.length > 30 ? '...' : ''}
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold" style={{ background: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)' }}>
                                                        <AlertCircle size={12} /> Aucun sujet
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-4 px-4 text-center">
                                                {isEditing ? (
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button
                                                            onClick={() => handleSave(a)}
                                                            disabled={savingRow === a.id}
                                                            className="primary action-btn text-xs px-3 py-2 flex items-center gap-1"
                                                        >
                                                            {savingRow === a.id ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                                                            Sauver
                                                        </button>
                                                        <button
                                                            onClick={cancelEditing}
                                                            className="secondary action-btn text-xs px-3 py-2 flex items-center gap-1"
                                                        >
                                                            <X size={14} /> Annuler
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => startEditing(a)}
                                                        className="primary action-btn text-xs px-4 py-2"
                                                    >
                                                        Affecter
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
                {pageCount > 1 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-glass-border">
                        <span className="text-xs text-text-muted">
                            {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, filteredApprenants.length)} sur {filteredApprenants.length} apprenants
                        </span>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="action-btn text-xs px-3 py-1.5 disabled:opacity-40"
                            >
                                &lt;
                            </button>
                            {Array.from({ length: pageCount }, (_, i) => i + 1).map(p => (
                                <button
                                    key={p}
                                    onClick={() => setCurrentPage(p)}
                                    className={`action-btn text-xs px-3 py-1.5 ${p === currentPage ? 'primary' : ''}`}
                                >
                                    {p}
                                </button>
                            ))}
                            <button
                                onClick={() => setCurrentPage(p => Math.min(pageCount, p + 1))}
                                disabled={currentPage === pageCount}
                                className="action-btn text-xs px-3 py-1.5 disabled:opacity-40"
                            >
                                &gt;
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <div className="glass overflow-hidden shadow-xl">
                <div className="p-6 border-b border-glass-border">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                        <BookOpen size={20} className="text-primary" />
                        Sujets
                    </h3>
                </div>
                {loadingSujets ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-6 h-6 text-primary animate-spin" />
                    </div>
                ) : filteredSujets.length === 0 ? (
                    <div className="py-12 text-center">
                        <BookOpen size={40} className="mx-auto text-text-muted mb-3 opacity-40" />
                        <p className="text-text-muted font-medium">Aucun sujet trouvé pour ces filtres</p>
                    </div>
                ) : (
                    <div className="p-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredSujets.map(s => (
                                <div key={s.id} className="bg-surface border border-glass-border rounded-xl p-4 hover:border-primary/30 transition-all">
                                    <div className="flex items-start justify-between gap-2 mb-2">
                                        <h4 className="font-bold text-sm text-text leading-snug">{s.titre}</h4>
                                        {s.apprenant ? (
                                            <span className="tag tag-licence text-xs shrink-0">Attribué</span>
                                        ) : (
                                            <span className="text-xs shrink-0 px-2 py-0.5 rounded-lg font-semibold" style={{ background: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)' }}>Disponible</span>
                                        )}
                                    </div>
                                    {s.formateur && (
                                        <p className="text-xs text-text-muted mt-1">
                                            Proposé par: <span className="text-text font-medium">{s.formateur.prenom} {s.formateur.nom}</span>
                                        </p>
                                    )}
                                    {s.apprenant && (
                                        <p className="text-xs text-text-muted mt-1">
                                            Apprenant: <span className="text-text font-medium">
                                                {apprenants.find(a => a.id === s.apprenant?.id)?.prenom} {apprenants.find(a => a.id === s.apprenant?.id)?.nom}
                                            </span>
                                        </p>
                                    )}
                                    {s.modifiePar && (
                                        <p className="text-xs text-text-muted mt-1">
                                            Modifié par: <span className="text-text font-medium">{s.modifiePar.prenom} {s.modifiePar.nom}</span>
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

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

export default MesAffectationsPage;
