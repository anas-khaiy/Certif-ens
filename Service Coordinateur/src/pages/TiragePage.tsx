import { useState, useEffect } from 'react';
import { Shuffle, Users, BookOpen, Loader2, CheckCircle2, AlertCircle, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/api-client';

interface AssignDetail {
    apprenant: { id: number; nom: string; prenom: string };
    encadrant: { id: number; nom: string; prenom: string };
    sujet: { id: number; titre: string };
}

interface AssignResult {
    success: boolean;
    message: string;
    assigned?: number;
    details?: AssignDetail[];
}

const TiragePage = () => {
    const [stats, setStats] = useState<{ apprenantsSansSujet: number; sujetsDisponibles: number } | null>(null);
    const [loadingStats, setLoadingStats] = useState(true);
    const [assigning, setAssigning] = useState(false);
    const [result, setResult] = useState<AssignResult | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const fetchStats = async () => {
        setLoadingStats(true);
        try {
            const res = await api.get('/affectation/random-assign-stats');
            setStats(res.data);
        } catch {}
        setLoadingStats(false);
    };

    useEffect(() => { fetchStats(); }, []);

    const handleRandomAssign = async () => {
        setAssigning(true);
        setResult(null);
        setCurrentPage(1);
        try {
            const res = await api.post('/affectation/random-assign');
            setResult(res.data);
            fetchStats();
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Erreur lors du tirage";
            setResult({ success: false, message: msg });
        }
        setAssigning(false);
    };

    const canAssign = stats !== null && stats.apprenantsSansSujet > 0 && stats.sujetsDisponibles >= stats.apprenantsSansSujet;

    const details = result?.details || [];
    const pageCount = Math.ceil(details.length / itemsPerPage);
    const paginated = details.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const getInitials = (p: string, n: string) =>
        `${(p?.[0] || '').toUpperCase()}${(n?.[0] || '').toUpperCase()}`;

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

                    {stats.apprenantsSansSujet === 0 ? (
                        <div className="glass p-6 text-center">
                            <CheckCircle2 size={48} className="mx-auto text-success mb-3" />
                            <p className="text-lg font-semibold text-text">Tous les apprenants ont déjà un sujet</p>
                        </div>
                    ) : !canAssign ? (
                        <div className="glass p-6 text-center">
                            <AlertCircle size={48} className="mx-auto text-error mb-3" />
                            <p className="text-lg font-semibold text-text">Pas assez de sujets disponibles</p>
                            <p className="text-text-muted mt-1">
                                {stats.sujetsDisponibles} sujet{stats.sujetsDisponibles > 1 ? 's' : ''} disponible{stats.sujetsDisponibles > 1 ? 's' : ''} pour {stats.apprenantsSansSujet} apprenant{stats.apprenantsSansSujet > 1 ? 's' : ''}
                            </p>
                        </div>
                    ) : (
                        <div className="glass p-6 text-center">
                            <p className="text-text-muted mb-4">
                                {stats.sujetsDisponibles} sujets disponibles pour {stats.apprenantsSansSujet} apprenants
                            </p>
                            <button
                                onClick={handleRandomAssign}
                                disabled={assigning}
                                className="primary action-btn text-base px-8 py-3 flex items-center gap-3 mx-auto"
                            >
                                {assigning ? (
                                    <Loader2 size={20} className="animate-spin" />
                                ) : (
                                    <Shuffle size={20} />
                                )}
                                {assigning ? 'Assignation en cours...' : 'Lancer le tirage aléatoire'}
                            </button>
                        </div>
                    )}

                    <AnimatePresence>
                        {result && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className={`glass overflow-hidden border-l-4 ${result.success ? 'border-success' : 'border-error'}`}
                            >
                                <div className={`p-6 flex items-center gap-3 ${result.success ? '' : ''}`}>
                                    {result.success ? (
                                        <CheckCircle2 size={24} className="text-success shrink-0" />
                                    ) : (
                                        <AlertCircle size={24} className="text-error shrink-0" />
                                    )}
                                    <div>
                                        <p className="font-semibold text-text">{result.message}</p>
                                        {result.assigned !== undefined && (
                                            <p className="text-sm text-text-muted mt-1">
                                                {result.assigned} apprenant{result.assigned > 1 ? 's' : ''} assigné{result.assigned > 1 ? 's' : ''}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {result.details && result.details.length > 0 && (
                                    <div className="border-t border-glass-border">
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
                                                    {paginated.map(d => (
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
                                                                    <CheckCircle2 size={12} />
                                                                    {d.encadrant.prenom} {d.encadrant.nom}
                                                                </span>
                                                            </td>
                                                            <td className="py-4 px-4">
                                                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold" style={{ background: 'rgba(168, 85, 247, 0.1)', color: 'var(--secondary)' }}>
                                                                    <CheckCircle2 size={12} />
                                                                    {d.sujet.titre}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                        {pageCount > 1 && (
                                            <div className="flex items-center justify-between px-6 py-4 border-t border-glass-border">
                                                <span className="text-xs text-text-muted">
                                                    {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, details.length)} sur {details.length}
                                                </span>
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                                        disabled={currentPage === 1}
                                                        className="action-btn text-xs px-3 py-1.5 disabled:opacity-40"
                                                    >&lt;
                                                    </button>
                                                    {Array.from({ length: pageCount }, (_, i) => i + 1).map(p => (
                                                        <button
                                                            key={p}
                                                            onClick={() => setCurrentPage(p)}
                                                            className={`action-btn text-xs px-3 py-1.5 ${p === currentPage ? 'primary' : ''}`}
                                                        >{p}
                                                        </button>
                                                    ))}
                                                    <button
                                                        onClick={() => setCurrentPage(p => Math.min(pageCount, p + 1))}
                                                        disabled={currentPage === pageCount}
                                                        className="action-btn text-xs px-3 py-1.5 disabled:opacity-40"
                                                    >&gt;
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </>
            ) : (
                <div className="glass p-6 text-center text-text-muted">Impossible de charger les statistiques</div>
            )}
        </div>
    );
};

export default TiragePage;
