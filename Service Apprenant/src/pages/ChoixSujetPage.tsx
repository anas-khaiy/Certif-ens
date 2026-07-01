import { useState, useEffect } from 'react';
import { BookOpen, Users, Search, Loader2, CheckCircle2, AlertCircle, Lock, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/api-client';

interface SujetDisponible {
    id: number; titre: string; description?: string;
    objectifs?: string[];
    pris: boolean;
    formateur?: { id: number; nom: string; prenom: string } | null;
}

interface MonSujet {
    hasSujet: boolean;
    sujet?: { id: number; titre: string; description?: string };
    encadrant?: { id: number; nom: string; prenom: string } | null;
}

const ChoixSujetPage = () => {
    const [sujets, setSujets] = useState<SujetDisponible[]>([]);
    const [monSujet, setMonSujet] = useState<MonSujet | null>(null);
    const [loading, setLoading] = useState(true);
    const [choosing, setChoosing] = useState<number | null>(null);
    const [search, setSearch] = useState('');
    const [selectedSujet, setSelectedSujet] = useState<SujetDisponible | null>(null);
    const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [sujetsRes, monSujetRes] = await Promise.all([
                api.get<SujetDisponible[]>('/apprenant/sujets/disponibles'),
                api.get<MonSujet>('/apprenant/sujets/mon-sujet')
            ]);
            setSujets(sujetsRes.data);
            setMonSujet(monSujetRes.data);
        } catch {}
        setLoading(false);
    };

    const showToast = (type: 'success' | 'error', text: string) => {
        setToast({ type, text });
        setTimeout(() => setToast(null), 5000);
    };

    const handleChoose = async (sujetId: number) => {
        setChoosing(sujetId);
        try {
            const res = await api.post<{ success: boolean; message: string }>(`/apprenant/sujets/choisir/${sujetId}`);
            if (res.data.success) {
                showToast('success', res.data.message);
                setSelectedSujet(null);
                fetchData();
            } else {
                showToast('error', res.data.message);
            }
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Erreur lors du choix du sujet";
            showToast('error', msg);
        }
        setChoosing(null);
    };

    const filtered = sujets.filter(s =>
        s.titre.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in pb-20">
            <div>
                <h2 className="text-3xl font-bold">Choix du Sujet PFE</h2>
                <p className="text-text-muted">Cliquez sur un sujet pour voir ses détails et le choisir.</p>
            </div>

            {monSujet?.hasSujet ? (
                <div className="glass p-6 border-l-4 border-success">
                    <div className="flex items-center gap-3">
                        <CheckCircle2 size={28} className="text-success shrink-0" />
                        <div>
                            <p className="text-lg font-semibold text-text">Vous avez déjà un sujet assigné</p>
                            <p className="text-text-muted mt-1">
                                Sujet : <span className="font-semibold text-text">{monSujet.sujet?.titre}</span>
                            </p>
                            {monSujet.encadrant && (
                                <p className="text-text-muted text-sm">
                                    Encadrant : {monSujet.encadrant.prenom} {monSujet.encadrant.nom}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            ) : sujets.length === 0 ? (
                <div className="glass p-12 text-center">
                    <BookOpen size={56} className="mx-auto text-text-muted mb-4 opacity-40" />
                    <p className="text-lg font-semibold text-text">Aucun sujet disponible pour le moment</p>
                    <p className="text-text-muted mt-1">Veuillez revenir plus tard ou contacter votre coordinateur.</p>
                </div>
            ) : (
                <>
                    <div className="search-container max-w-md">
                        <div className="search-icon"><Search size={18} /></div>
                        <input
                            type="text"
                            placeholder="Rechercher un sujet..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="search-input"
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filtered.map(s => {
                            const canSelect = !s.pris;
                            return (
                                <div
                                    key={s.id}
                                    onClick={() => {
                                        if (canSelect) setSelectedSujet(s);
                                    }}
                                    className={`glass p-5 transition-all border-2 ${
                                        !canSelect
                                            ? 'opacity-50 cursor-not-allowed border-transparent'
                                            : 'cursor-pointer border-transparent hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10'
                                    }`}
                                >
                                    <div className="flex items-center gap-2 min-w-0">
                                        {!canSelect && <Lock size={16} className="text-text-muted shrink-0" />}
                                        <h3 className={`font-bold leading-snug truncate ${canSelect ? 'text-text' : 'text-text-muted'}`}>
                                            {s.titre}
                                        </h3>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </>
            )}

            <AnimatePresence>
                {selectedSujet && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
                        onClick={() => setSelectedSujet(null)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            onClick={e => e.stopPropagation()}
                            className="glass w-full max-w-lg max-h-[85vh] overflow-y-auto p-6 rounded-2xl shadow-2xl"
                        >
                            <div className="flex items-start justify-between gap-4 mb-4">
                                <h3 className="text-xl font-bold text-text pr-8">{selectedSujet.titre}</h3>
                                <button
                                    onClick={() => setSelectedSujet(null)}
                                    className="shrink-0 p-1 rounded-lg hover:bg-surface-hover transition-colors"
                                >
                                    <X size={20} className="text-text-muted" />
                                </button>
                            </div>

                            {selectedSujet.description && (
                                <p className="text-sm text-text-muted leading-relaxed mb-4">{selectedSujet.description}</p>
                            )}

                            {selectedSujet.objectifs && selectedSujet.objectifs.length > 0 && (
                                <div className="mb-4">
                                    <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Objectifs</p>
                                    <ul className="space-y-1.5">
                                        {selectedSujet.objectifs.map((obj, i) => (
                                            <li key={i} className="flex items-start gap-2 text-sm text-text-muted">
                                                <span className="w-5 h-5 shrink-0 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold mt-0.5">
                                                    {i + 1}
                                                </span>
                                                {obj}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {selectedSujet.formateur && (
                                <p className="text-sm text-text-muted flex items-center gap-1.5 mb-6">
                                    <Users size={14} />
                                    Proposé par : <span className="font-semibold text-text">{selectedSujet.formateur.prenom} {selectedSujet.formateur.nom}</span>
                                </p>
                            )}

                            <button
                                onClick={() => handleChoose(selectedSujet.id)}
                                disabled={choosing === selectedSujet.id}
                                className="primary action-btn w-full py-3 flex items-center justify-center gap-2 text-sm font-bold"
                            >
                                {choosing === selectedSujet.id ? (
                                    <Loader2 size={18} className="animate-spin" />
                                ) : (
                                    <CheckCircle2 size={18} />
                                )}
                                {choosing === selectedSujet.id ? 'Choix en cours...' : 'Choisir ce sujet'}
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

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

export default ChoixSujetPage;
