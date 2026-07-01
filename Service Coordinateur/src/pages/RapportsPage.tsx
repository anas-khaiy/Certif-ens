import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search, Send, Loader2, CheckCircle2, AlertCircle, ChevronDown, Users, UserCheck, FileText, X, Eye, UserPlus, Mail, RefreshCw
} from 'lucide-react';
import api from '../api/api-client';

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

interface Cycle {
    id: number;
    nomCycle: string;
}

interface Recipient {
    nom: string;
    email: string;
}

interface ApprenantRapport {
    id: number;
    nom: string;
    prenom: string;
    email: string;
    specialite: string | null;
    cycle: string | null;
    sujetTitre: string | null;
    encadrant: string | null;
    examinateurs: Recipient[];
    rapporteurs: Recipient[];
    examinateursExternes: Recipient[];
    rapporteursExternes: Recipient[];
    depots: { type: string; fichierUrl: string; dateDepot: string }[];
    envois: Record<string, string>;
}

type DepotType = 'DEPOT_1' | 'DEPOT_2' | 'FINAL';

const DEPOT_LABELS: Record<DepotType, string> = {
    DEPOT_1: 'Dépôt 1',
    DEPOT_2: 'Dépôt 2',
    FINAL: 'Final',
};

export default function RapportsPage() {
    const [apprenants, setApprenants] = useState<ApprenantRapport[]>([]);
    const [specialites, setSpecialites] = useState<Specialite[]>([]);
    const [cycles, setCycles] = useState<Cycle[]>([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const [searchQuery, setSearchQuery] = useState('');
    const [specialiteFilter, setSpecialiteFilter] = useState('');
    const [cycleFilter, setCycleFilter] = useState('');
    const [sujetFilter, setSujetFilter] = useState('ALL');
    const [encadrantFilter, setEncadrantFilter] = useState('ALL');
    const [page, setPage] = useState(0);
    const itemsPerPage = 8;

    const [previewDepot, setPreviewDepot] = useState<{ url: string; label: string } | null>(null);
    const [previewDepotLoading, setPreviewDepotLoading] = useState(false);

    // Modal for selecting recipients per apprenant
    const [recipientsModal, setRecipientsModal] = useState<{
        apprenantId: number;
        prenom: string;
        nom: string;
        recipients: Recipient[];
    } | null>(null);
    const [selectedRecipients, setSelectedRecipients] = useState<Record<number, Set<string>>>({});

    const showToast = (type: 'success' | 'error', text: string) => {
        setToast({ type, text });
        setTimeout(() => setToast(null), 3000);
    };

    useEffect(() => {
        fetchData();
        fetchSpecialites();
        fetchCycles();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await api.get('/rapports');
            const data: ApprenantRapport[] = res.data;
            setApprenants(data);
            // Initialize selected recipients: all selected by default
            const initial: Record<number, Set<string>> = {};
            for (const a of data) {
                const all = [
                    ...a.examinateurs,
                    ...a.rapporteurs,
                    ...a.examinateursExternes,
                    ...a.rapporteursExternes,
                ].filter(r => r.email);
                initial[a.id] = new Set(all.map(r => r.email));
            }
            setSelectedRecipients(initial);
        } catch {
            showToast('error', "Erreur lors du chargement des rapports");
        } finally {
            setLoading(false);
        }
    };

    const fetchSpecialites = async () => {
        try {
            const res = await api.get('/affectation/specialites');
            setSpecialites(res.data);
        } catch {}
    };

    const fetchCycles = async () => {
        try {
            const res = await api.get('/affectation/cycles');
            setCycles(res.data || []);
        } catch {}
    };

    const openRecipientsModal = (a: ApprenantRapport) => {
        const recipients = [
            ...a.examinateurs,
            ...a.rapporteurs,
            ...a.examinateursExternes,
            ...a.rapporteursExternes,
        ].filter(r => r.email);
        setRecipientsModal({
            apprenantId: a.id,
            prenom: a.prenom,
            nom: a.nom,
            recipients,
        });
    };

    const toggleRecipient = (apprenantId: number, email: string) => {
        setSelectedRecipients(prev => {
            const next = { ...prev };
            const set = new Set(next[apprenantId] || []);
            if (set.has(email)) set.delete(email); else set.add(email);
            next[apprenantId] = set;
            return next;
        });
    };

    const toggleSelectAll = (apprenantId: number, recipients: Recipient[]) => {
        setSelectedRecipients(prev => {
            const currentSet = prev[apprenantId] || new Set();
            const allEmails = new Set(recipients.map(r => r.email));
            if (currentSet.size === allEmails.size) {
                return { ...prev, [apprenantId]: new Set() };
            }
            return { ...prev, [apprenantId]: allEmails };
        });
    };

    const handleSend = async (apprenantId: number, typeDepot: string) => {
        const targetEmails = Array.from(selectedRecipients[apprenantId] || []);
        if (targetEmails.length === 0) {
            showToast('error', "Aucun destinataire sélectionné. Cliquez sur 'Destinataires' pour en choisir.");
            return;
        }
        setSending(true);
        try {
            const res = await api.post(`/rapports/envoyer/${apprenantId}/${typeDepot}`, targetEmails);
            if (res.data.success) {
                showToast('success', res.data.message);
                await fetchData();
            } else {
                showToast('error', res.data.message);
            }
        } catch {
            showToast('error', "Erreur lors de l'envoi du rapport");
        } finally {
            setSending(false);
        }
    };

    const getDepot = (a: ApprenantRapport, type: DepotType) => {
        return a.depots.find(d => d.type === type);
    };

    const isSent = (a: ApprenantRapport, type: DepotType) => {
        return a.envois && a.envois[type] !== undefined;
    };

    const getDepotLabel = (type: string) => DEPOT_LABELS[type as DepotType] || type;

    const allRecipientsCount = (a: ApprenantRapport) =>
        a.examinateurs.length + a.rapporteurs.length + a.examinateursExternes.length + a.rapporteursExternes.length;

    const selectedCount = (a: ApprenantRapport) =>
        (selectedRecipients[a.id] || new Set()).size;

    const hasNoTeam = (a: ApprenantRapport) =>
        !a.encadrant && allRecipientsCount(a) === 0;

    const filteredApprenants = useMemo(() => {
        return apprenants.filter(a => {
            const matchSearch = `${a.prenom} ${a.nom}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                (a.email || '').toLowerCase().includes(searchQuery.toLowerCase());
            const matchSpec = specialiteFilter ? a.specialite === specialiteFilter : true;
            const matchCycle = cycleFilter ? a.cycle === cycleFilter : true;
            const matchSujet = sujetFilter === 'ALL' ? true : sujetFilter === 'YES' ? !!a.sujetTitre : !a.sujetTitre;
            const matchEncadrant = encadrantFilter === 'ALL' ? true : encadrantFilter === 'YES' ? !!a.encadrant : !a.encadrant;
            return matchSearch && matchSpec && matchCycle && matchSujet && matchEncadrant;
        });
    }, [apprenants, searchQuery, specialiteFilter, cycleFilter, sujetFilter, encadrantFilter]);

    useEffect(() => { setPage(0); }, [searchQuery, specialiteFilter, cycleFilter, sujetFilter, encadrantFilter]);

    const totalPages = Math.ceil(filteredApprenants.length / itemsPerPage);
    const paginatedApprenants = filteredApprenants.slice(page * itemsPerPage, (page + 1) * itemsPerPage);

    const getInitials = (p: string, n: string) => `${(p||'').charAt(0)}${(n||'').charAt(0)}`.toUpperCase();

    const depotTypes: DepotType[] = ['DEPOT_1', 'DEPOT_2', 'FINAL'];

    return (
        <div className="space-y-6 animate-fade-in pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold">Envoi des Rapports</h2>
                    <p className="text-text-muted">Sélectionnez les destinataires puis envoyez les rapports PFE.</p>
                </div>
                <div className="flex gap-3">
                    <div className="glass px-4 py-2.5 flex items-center gap-2">
                        <Users size={16} className="text-primary" />
                        <span className="text-sm font-bold text-text">{filteredApprenants.length} Apprenant{filteredApprenants.length > 1 ? 's' : ''}</span>
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
                                placeholder="Rechercher un apprenant..."
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
                                    <option key={s.id} value={s.nom}>{s.nom}</option>
                                ))}
                            </select>
                            <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                        </div>

                        <div className="relative min-w-[150px] flex-1">
                            <select
                                value={cycleFilter}
                                onChange={(e) => setCycleFilter(e.target.value)}
                                className="form-input appearance-none w-full font-bold bg-surface"
                            >
                                <option value="">Tous les cycles</option>
                                {cycles.map(c => (
                                    <option key={c.id} value={c.nomCycle}>{c.nomCycle}</option>
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
                    </div>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    </div>
                ) : filteredApprenants.length === 0 ? (
                    <div className="py-20 text-center">
                        <FileText size={48} className="mx-auto text-text-muted mb-4 opacity-40" />
                        <p className="text-text-muted font-medium">Aucun apprenant trouvé.</p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-surface-hover/50 text-text-muted text-xs uppercase tracking-widest">
                                        <th className="py-3 px-4 text-left">Apprenant</th>
                                        <th className="py-3 px-3 text-left">Spécialité</th>
                                        <th className="py-3 px-3 text-left">Cycle</th>
                                        <th className="py-3 px-3 text-left">Encadrant</th>
                                        <th className="py-3 px-3 text-left">Destinataires</th>
                                        <th className="py-3 px-3 text-center" colSpan={3}>Dépôts</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-glass-border">
                                    {paginatedApprenants.map(a => (
                                        <tr key={a.id} className="hover:bg-surface-hover/30 transition-colors">
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-xs shadow-lg shadow-primary/20 shrink-0">
                                                        {getInitials(a.prenom, a.nom)}
                                                    </div>
                                                    <div>
                                                        <span className="font-bold text-sm text-text block">{a.prenom} {a.nom}</span>
                                                        <span className="text-[10px] text-text-muted">{a.email}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3 px-3">
                                                <span className="tag tag-licence font-bold text-[10px]">{a.specialite || 'N/A'}</span>
                                            </td>
                                            <td className="py-3 px-3">
                                                <span className="tag tag-master font-bold text-[10px]">{a.cycle || 'N/A'}</span>
                                            </td>
                                            <td className="py-3 px-3">
                                                <span className="text-xs font-semibold text-text">{a.encadrant || <span className="text-text-muted italic">Aucun</span>}</span>
                                            </td>
                                            <td className="py-3 px-3">
                                                {allRecipientsCount(a) > 0 ? (
                                                    <button
                                                        onClick={() => openRecipientsModal(a)}
                                                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold bg-primary/10 text-primary hover:bg-primary/20 transition-all"
                                                    >
                                                        <Mail size={10} />
                                                        {selectedCount(a)}/{allRecipientsCount(a)} sélectionné(s)
                                                    </button>
                                                ) : (
                                                    <span className="text-[10px] text-text-muted italic">Aucun</span>
                                                )}
                                            </td>
                                            {depotTypes.map(type => {
                                                const depot = getDepot(a, type);
                                                const sent = isSent(a, type);
                                                const noTeam = hasNoTeam(a);

                                                return (
                                                    <td key={type} className="py-3 px-3 align-top">
                                                        <div className="flex flex-col gap-1.5 min-w-[140px]">
                                                            {depot ? (
                                                                <>
                                                                    <div className="flex items-center gap-1.5">
                                                                        <FileText size={12} className="text-primary shrink-0" />
                                                                        <span className="text-[10px] font-bold text-text truncate max-w-[80px]" title={depot.fichierUrl}>
                                                                            {new Date(depot.dateDepot).toLocaleDateString('fr-FR')}
                                                                        </span>
                                                                        <button
                                                                            onClick={() => setPreviewDepot({ url: depot.fichierUrl, label: `${a.prenom} ${a.nom} - ${getDepotLabel(type)}` })}
                                                                            className="ml-auto p-0.5 text-text-muted hover:text-primary transition-colors"
                                                                            title="Aperçu"
                                                                        >
                                                                            <Eye size={12} />
                                                                        </button>
                                                                    </div>
                                                                    <div className="flex items-center gap-1.5">
                                                                        {sent && (
                                                                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-success/10 text-success">
                                                                                <CheckCircle2 size={10} /> Envoyé
                                                                            </span>
                                                                        )}
                                                                        {noTeam ? (
                                                                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold bg-gray-500/10 text-text-muted cursor-not-allowed" title="Aucun encadrant, examinateur ou rapporteur assigné">
                                                                                <Send size={10} /> Non disponible
                                                                            </span>
                                                                        ) : (
                                                                            <button
                                                                                onClick={() => handleSend(a.id, type)}
                                                                                disabled={sending || selectedCount(a) === 0}
                                                                                className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                                                                                    sent
                                                                                        ? 'bg-amber-500/10 text-amber-600 hover:bg-amber-500/20'
                                                                                        : 'bg-primary text-white hover:bg-primary/80'
                                                                                } disabled:opacity-50`}
                                                                                title={selectedCount(a) === 0 ? "Aucun destinataire sélectionné" : sent ? "Renvoyer le rapport" : "Envoyer le rapport"}
                                                                            >
                                                                                {sending ? <Loader2 size={10} className="animate-spin" /> : sent ? <RefreshCw size={10} /> : <Send size={10} />}
                                                                                {sent ? 'Renvoyer' : 'Envoyer'}
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                </>
                                                            ) : (
                                                                <span className="text-[10px] text-text-muted italic">Non déposé</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                );
                                            })}
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

            {/* Recipients Selection Modal */}
            <AnimatePresence>
                {recipientsModal && (
                    <div className="modal-overlay" onClick={() => setRecipientsModal(null)}>
                        <motion.div
                            key="recipients-modal"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="modal-content"
                            style={{ maxWidth: '520px', width: '100%' }}
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="modal-close" onClick={() => setRecipientsModal(null)}>
                                <X size={22} />
                            </div>
                            <div className="p-6">
                                <h3 className="text-lg font-bold text-text mb-1">Sélection des destinataires</h3>
                                <p className="text-sm text-text-muted mb-3">
                                    <strong>{recipientsModal.prenom} {recipientsModal.nom}</strong>
                                </p>

                                {recipientsModal.recipients.length > 0 && (
                                    <div className="flex items-center gap-3 mb-3 pb-2 border-b border-glass-border">
                                        <button
                                            onClick={() => toggleSelectAll(recipientsModal.apprenantId, recipientsModal.recipients)}
                                            className="text-xs font-bold text-primary hover:text-primary/80 transition-colors"
                                        >
                                            {(selectedRecipients[recipientsModal.apprenantId]?.size || 0) === recipientsModal.recipients.length
                                                ? 'Tout désélectionner'
                                                : 'Tout sélectionner'}
                                        </button>
                                        <span className="text-[10px] text-text-muted">
                                            {selectedRecipients[recipientsModal.apprenantId]?.size || 0}/{recipientsModal.recipients.length} sélectionné(s)
                                        </span>
                                    </div>
                                )}

                                <div className="max-h-[300px] overflow-y-auto space-y-1.5 custom-scrollbar">
                                    {recipientsModal.recipients.length === 0 ? (
                                        <p className="text-sm text-text-muted italic text-center py-6">
                                            Aucun destinataire avec email disponible.
                                        </p>
                                    ) : (
                                        <>
                                            {/* Examinateurs */}
                                            {apprenants.find(a => a.id === recipientsModal.apprenantId)?.examinateurs.filter(r => r.email).map((r, i) => (
                                                <label key={`ex-${r.email}-${i}`} className={`flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer transition-all ${
                                                    selectedRecipients[recipientsModal.apprenantId]?.has(r.email)
                                                        ? 'bg-blue-500/5 border-blue-500/30'
                                                        : 'bg-surface border-glass-border hover:border-text-muted'
                                                }`}>
                                                    <input type="checkbox" className="sr-only"
                                                        checked={selectedRecipients[recipientsModal.apprenantId]?.has(r.email) || false}
                                                        onChange={() => toggleRecipient(recipientsModal.apprenantId, r.email)}
                                                    />
                                                    <div className={`w-5 h-5 border-2 rounded flex items-center justify-center shrink-0 transition-colors ${
                                                        selectedRecipients[recipientsModal.apprenantId]?.has(r.email)
                                                            ? 'bg-blue-500 border-blue-500'
                                                            : 'border-text-muted'
                                                    }`}>
                                                        {selectedRecipients[recipientsModal.apprenantId]?.has(r.email) && <CheckCircle2 size={14} className="text-white" />}
                                                    </div>
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="text-xs font-semibold text-text truncate flex items-center gap-1.5">
                                                            <UserCheck size={12} className="text-blue-500 shrink-0" />
                                                            {r.nom}
                                                        </span>
                                                        <span className="text-[10px] text-text-muted truncate">Examinateur &middot; {r.email}</span>
                                                    </div>
                                                </label>
                                            ))}

                                            {/* Rapporteurs */}
                                            {apprenants.find(a => a.id === recipientsModal.apprenantId)?.rapporteurs.filter(r => r.email).map((r, i) => (
                                                <label key={`rap-${r.email}-${i}`} className={`flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer transition-all ${
                                                    selectedRecipients[recipientsModal.apprenantId]?.has(r.email)
                                                        ? 'bg-secondary/5 border-secondary/30'
                                                        : 'bg-surface border-glass-border hover:border-text-muted'
                                                }`}>
                                                    <input type="checkbox" className="sr-only"
                                                        checked={selectedRecipients[recipientsModal.apprenantId]?.has(r.email) || false}
                                                        onChange={() => toggleRecipient(recipientsModal.apprenantId, r.email)}
                                                    />
                                                    <div className={`w-5 h-5 border-2 rounded flex items-center justify-center shrink-0 transition-colors ${
                                                        selectedRecipients[recipientsModal.apprenantId]?.has(r.email)
                                                            ? 'bg-secondary border-secondary'
                                                            : 'border-text-muted'
                                                    }`}>
                                                        {selectedRecipients[recipientsModal.apprenantId]?.has(r.email) && <CheckCircle2 size={14} className="text-white" />}
                                                    </div>
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="text-xs font-semibold text-text truncate flex items-center gap-1.5">
                                                            <UserCheck size={12} className="text-secondary shrink-0" />
                                                            {r.nom}
                                                        </span>
                                                        <span className="text-[10px] text-text-muted truncate">Rapporteur &middot; {r.email}</span>
                                                    </div>
                                                </label>
                                            ))}

                                            {/* Examinateurs Externes */}
                                            {apprenants.find(a => a.id === recipientsModal.apprenantId)?.examinateursExternes.filter(r => r.email).map((r, i) => (
                                                <label key={`ex-ext-${r.email}-${i}`} className={`flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer transition-all ${
                                                    selectedRecipients[recipientsModal.apprenantId]?.has(r.email)
                                                        ? 'bg-amber-500/5 border-amber-500/30'
                                                        : 'bg-surface border-glass-border hover:border-text-muted'
                                                }`}>
                                                    <input type="checkbox" className="sr-only"
                                                        checked={selectedRecipients[recipientsModal.apprenantId]?.has(r.email) || false}
                                                        onChange={() => toggleRecipient(recipientsModal.apprenantId, r.email)}
                                                    />
                                                    <div className={`w-5 h-5 border-2 rounded flex items-center justify-center shrink-0 transition-colors ${
                                                        selectedRecipients[recipientsModal.apprenantId]?.has(r.email)
                                                            ? 'bg-amber-500 border-amber-500'
                                                            : 'border-text-muted'
                                                    }`}>
                                                        {selectedRecipients[recipientsModal.apprenantId]?.has(r.email) && <CheckCircle2 size={14} className="text-white" />}
                                                    </div>
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="text-xs font-semibold text-text truncate flex items-center gap-1.5">
                                                            <UserPlus size={12} className="text-amber-500 shrink-0" />
                                                            {r.nom}
                                                        </span>
                                                        <span className="text-[10px] text-text-muted truncate">Examinateur Externe &middot; {r.email}</span>
                                                    </div>
                                                </label>
                                            ))}

                                            {/* Rapporteurs Externes */}
                                            {apprenants.find(a => a.id === recipientsModal.apprenantId)?.rapporteursExternes.filter(r => r.email).map((r, i) => (
                                                <label key={`rap-ext-${r.email}-${i}`} className={`flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer transition-all ${
                                                    selectedRecipients[recipientsModal.apprenantId]?.has(r.email)
                                                        ? 'bg-amber-500/5 border-amber-500/30'
                                                        : 'bg-surface border-glass-border hover:border-text-muted'
                                                }`}>
                                                    <input type="checkbox" className="sr-only"
                                                        checked={selectedRecipients[recipientsModal.apprenantId]?.has(r.email) || false}
                                                        onChange={() => toggleRecipient(recipientsModal.apprenantId, r.email)}
                                                    />
                                                    <div className={`w-5 h-5 border-2 rounded flex items-center justify-center shrink-0 transition-colors ${
                                                        selectedRecipients[recipientsModal.apprenantId]?.has(r.email)
                                                            ? 'bg-amber-500 border-amber-500'
                                                            : 'border-text-muted'
                                                    }`}>
                                                        {selectedRecipients[recipientsModal.apprenantId]?.has(r.email) && <CheckCircle2 size={14} className="text-white" />}
                                                    </div>
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="text-xs font-semibold text-text truncate flex items-center gap-1.5">
                                                            <UserPlus size={12} className="text-amber-500 shrink-0" />
                                                            {r.nom}
                                                        </span>
                                                        <span className="text-[10px] text-text-muted truncate">Rapporteur Externe &middot; {r.email}</span>
                                                    </div>
                                                </label>
                                            ))}
                                        </>
                                    )}
                                </div>

                                <div className="flex justify-end mt-4 pt-3 border-t border-glass-border">
                                    <button
                                        onClick={() => setRecipientsModal(null)}
                                        className="px-6 py-2.5 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary/80 transition-all"
                                    >
                                        Confirmer
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* PDF Preview Modal */}
            <AnimatePresence>
                {previewDepot && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-sm"
                        onClick={() => setPreviewDepot(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full h-full bg-background overflow-hidden flex flex-col"
                        >
                            <div className="flex items-center justify-between p-4 border-b border-glass-border bg-surface/50">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary/10 rounded-xl text-primary">
                                        <FileText size={20} />
                                    </div>
                                    <h3 className="text-xl font-bold">Prévisualisation du rapport</h3>
                                    <span className="text-sm text-text-muted ml-2">— {previewDepot.label}</span>
                                </div>
                                <button
                                    onClick={() => setPreviewDepot(null)}
                                    className="p-2 rounded-xl hover:bg-error/10 hover:text-error transition-colors bg-surface border border-glass-border text-text-muted"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="flex-1 bg-surface-hover/30 relative">
                                <iframe
                                    src={`http://localhost:9093/api/v1/mon-pfe/download/${previewDepot.url}`}
                                    className="w-full h-full border-none bg-white"
                                    title="Prévisualisation PDF"
                                />
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

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
