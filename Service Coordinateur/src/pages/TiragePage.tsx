import { useState, useEffect } from 'react';
import { Shuffle, Users, BookOpen, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/api-client';

const TiragePage = () => {
    const [stats, setStats] = useState<{ apprenantsSansSujet: number; sujetsDisponibles: number } | null>(null);
    const [loadingStats, setLoadingStats] = useState(true);
    const [assigning, setAssigning] = useState(false);
    const [result, setResult] = useState<{ success: boolean; message: string; assigned?: number } | null>(null);

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
                                className={`glass p-6 border-l-4 ${result.success ? 'border-success' : 'border-error'}`}
                            >
                                <div className="flex items-center gap-3">
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
