import { useState, useEffect } from 'react';
import { Shuffle, Users, BookOpen, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/api-client';

interface ApprenantRef { id: number; nom: string; prenom: string; }
interface AssignDetail {
    apprenant: ApprenantRef;
    encadrant: { id: number; nom: string; prenom: string };
    sujet: { id: number; titre: string };
}
interface StatsData {
    apprenantsSansSujet: number; sujetsDisponibles: number;
    apprenants: ApprenantRef[]; assigned: AssignDetail[];
}

const TiragePage = () => {
    const [stats, setStats] = useState<StatsData | null>(null);
    const [loadingStats, setLoadingStats] = useState(true);
    const [assigning, setAssigning] = useState(false);
    const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [page, setPage] = useState(1);
    const [assignedPage, setAssignedPage] = useState(1);
    const itemsPerPage = 10;

    const fetchStats = async () => {
        setLoadingStats(true);
        try {
            const res = await api.get<StatsData>('/affectation/random-assign-stats');
            setStats(res.data);
        } catch {}
        setLoadingStats(false);
    };

    useEffect(() => { fetchStats(); }, []);

    const handleRandomAssign = async () => {
        setAssigning(true);
        setToastMsg(null);
        try {
            const res = await api.post<{ success: boolean; message: string }>('/affectation/random-assign');
            if (res.data.success) {
                setToastMsg({ type: 'success', text: res.data.message });
            } else {
                setToastMsg({ type: 'error', text: res.data.message });
            }
            fetchStats();
            setAssignedPage(1);
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Erreur lors du tirage";
            setToastMsg({ type: 'error', text: msg });
        }
        setAssigning(false);
    };

    const canAssign = stats !== null && stats.apprenantsSansSujet > 0 && stats.sujetsDisponibles >= stats.apprenantsSansSujet;

    const getInitials = (p: string, n: string) =>
        `${(p?.[0] || '').toUpperCase()}${(n?.[0] || '').toUpperCase()}`;

    const unassigned = stats?.apprenants || [];
    const unassignedPages = Math.ceil(unassigned.length / itemsPerPage);
    const paginatedUnassigned = unassigned.slice((page - 1) * itemsPerPage, page * itemsPerPage);

    const assigned = stats?.assigned || [];
    const assignedPages = Math.ceil(assigned.length / itemsPerPage);
    const paginatedAssigned = assigned.slice((assignedPage - 1) * itemsPerPage, assignedPage * itemsPerPage);

    return (
        <div className="space-y-6 animate-fade-in pb-20">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold">Tirage Aléatoire</h2>
                    <p className="text-text-muted">Assigner aléatoirement un sujet et son encadrant à chaque apprenant.</p>
                </div>
            </div>

            {loadingStats ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>
            ) : stats ? (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="glass p-6">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                    <Users size={28} />
                                </div>
                                <div>
                                    <p className="text-3xl font-bold">{stats.apprenantsSansSujet}</p>
                                    <p className="text-sm text-text-muted">Apprenants sans sujet</p>
                                </div>
                            </div>
                        </div>
                        <div className="glass p-6">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary">
                                    <BookOpen size={28} />
                                </div>
                                <div>
                                    <p className="text-3xl font-bold">{stats.sujetsDisponibles}</p>
                                    <p className="text-sm text-text-muted">Sujets disponibles</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {toastMsg && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`glass p-4 border-l-4 flex items-center gap-3 ${toastMsg.type === 'success' ? 'border-success' : 'border-error'}`}
                        >
                            {toastMsg.type === 'success' ? <CheckCircle2 size={20} className="text-success shrink-0" /> : <AlertCircle size={20} className="text-error shrink-0" />}
                            <p className="font-semibold text-text text-sm">{toastMsg.text}</p>
                        </motion.div>
                    )}

                    {unassigned.length > 0 && (
                        <div className="glass overflow-hidden">
                            <div className="p-6 border-b border-glass-border flex items-center justify-between">
                                <h3 className="text-lg font-bold flex items-center gap-2">
                                    <Users size={20} className="text-primary" />
                                    Apprenants à assigner
                                    <span className="text-sm font-normal text-text-muted ml-2">({unassigned.length})</span>
                                </h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-surface-hover/50 text-text-muted text-xs uppercase tracking-widest">
                                            <th className="py-3 px-6 text-left">Apprenant</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-glass-border">
                                        {paginatedUnassigned.map(a => (
                                            <tr key={a.id} className="hover:bg-surface-hover/30 transition-colors">
                                                <td className="py-3 px-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-primary/20 shrink-0">
                                                            {getInitials(a.prenom, a.nom)}
                                                        </div>
                                                        <span className="font-semibold text-sm text-text">{a.prenom} {a.nom}</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {unassignedPages > 1 && (
                                <div className="flex items-center justify-between px-6 py-4 border-t border-glass-border">
                                    <span className="text-xs text-text-muted">{(page - 1) * itemsPerPage + 1}–{Math.min(page * itemsPerPage, unassigned.length)} sur {unassigned.length}</span>
                                    <div className="flex items-center gap-1">
                                        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="action-btn text-xs px-3 py-1.5 disabled:opacity-40">&lt;</button>
                                        {Array.from({ length: unassignedPages }, (_, i) => i + 1).map(p => (
                                            <button key={p} onClick={() => setPage(p)} className={`action-btn text-xs px-3 py-1.5 ${p === page ? 'primary' : ''}`}>{p}</button>
                                        ))}
                                        <button onClick={() => setPage(p => Math.min(unassignedPages, p + 1))} disabled={page === unassignedPages} className="action-btn text-xs px-3 py-1.5 disabled:opacity-40">&gt;</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {assigned.length > 0 && (
                        <div className="glass overflow-hidden">
                            <div className="p-6 border-b border-glass-border flex items-center justify-between">
                                <h3 className="text-lg font-bold flex items-center gap-2">
                                    <CheckCircle2 size={20} className="text-success" />
                                    Apprenants assignés
                                    <span className="text-sm font-normal text-text-muted ml-2">({assigned.length})</span>
                                </h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-surface-hover/50 text-text-muted text-xs uppercase tracking-widest">
                                            <th className="py-3 px-6 text-left">Apprenant</th>
                                            <th className="py-3 px-4 text-left">Encadrant</th>
                                            <th className="py-3 px-4 text-left">Sujet</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-glass-border">
                                        {paginatedAssigned.map(d => (
                                            <tr key={d.apprenant.id} className="hover:bg-surface-hover/30 transition-colors">
                                                <td className="py-4 px-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-primary/20 shrink-0">
                                                            {getInitials(d.apprenant.prenom, d.apprenant.nom)}
                                                        </div>
                                                        <span className="font-bold text-sm text-text">{d.apprenant.prenom} {d.apprenant.nom}</span>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4">
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)' }}>
                                                        <CheckCircle2 size={12} /> {d.encadrant.prenom} {d.encadrant.nom}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-4">
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold" style={{ background: 'rgba(168, 85, 247, 0.1)', color: 'var(--secondary)' }}>
                                                        <CheckCircle2 size={12} /> {d.sujet.titre}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {assignedPages > 1 && (
                                <div className="flex items-center justify-between px-6 py-4 border-t border-glass-border">
                                    <span className="text-xs text-text-muted">{(assignedPage - 1) * itemsPerPage + 1}–{Math.min(assignedPage * itemsPerPage, assigned.length)} sur {assigned.length}</span>
                                    <div className="flex items-center gap-1">
                                        <button onClick={() => setAssignedPage(p => Math.max(1, p - 1))} disabled={assignedPage === 1} className="action-btn text-xs px-3 py-1.5 disabled:opacity-40">&lt;</button>
                                        {Array.from({ length: assignedPages }, (_, i) => i + 1).map(p => (
                                            <button key={p} onClick={() => setAssignedPage(p)} className={`action-btn text-xs px-3 py-1.5 ${p === assignedPage ? 'primary' : ''}`}>{p}</button>
                                        ))}
                                        <button onClick={() => setAssignedPage(p => Math.min(assignedPages, p + 1))} disabled={assignedPage === assignedPages} className="action-btn text-xs px-3 py-1.5 disabled:opacity-40">&gt;</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {canAssign && (
                        <div className="flex justify-center">
                            <button
                                onClick={handleRandomAssign}
                                disabled={assigning}
                                className="primary action-btn text-base px-8 py-3 flex items-center gap-3"
                            >
                                {assigning ? <Loader2 size={20} className="animate-spin" /> : <Shuffle size={20} />}
                                {assigning ? 'Assignation en cours...' : 'Lancer le tirage aléatoire'}
                            </button>
                        </div>
                    )}
                </>
            ) : (
                <div className="glass p-6 text-center text-text-muted">Impossible de charger les statistiques</div>
            )}
        </div>
    );
};

export default TiragePage;
