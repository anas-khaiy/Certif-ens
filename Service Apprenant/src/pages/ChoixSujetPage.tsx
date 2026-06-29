import { useState, useEffect } from 'react';
import { BookOpen, Users, Search, Loader2, CheckCircle2, AlertCircle, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/api-client';

interface SujetDisponible {
    id: number; titre: string; description?: string;
    objectifs?: string[];
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
                api.get<SujetDisponible[]>('/api/v1/apprenant/sujets/disponibles'),
                api.get<MonSujet>('/api/v1/apprenant/sujets/mon-sujet')
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
            const res = await api.post<{ success: boolean; message: string }>(`/api/v1/apprenant/sujets/choisir/${sujetId}`);
            if (res.data.success) {
                showToast('success', res.data.message);
                fetchData();
                setSelectedSujet(null);
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

    const getInitials = (p?: string, n?: string) =>
        `${(p?.[0] || '').toUpperCase()}${(n?.[0] || '').toUpperCase()}`;

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
                <p className="text-text-muted">Parcourez les sujets disponibles et choisissez celui qui vous correspond.</p>
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
                        {filtered.map(s => (
                            <div
                                key={s.id}
                                className={`glass p-5 cursor-pointer transition-all border-2 ${
                                    selectedSujet?.id === s.id
                                        ? 'border-primary shadow-lg shadow-primary/20'
                                        : 'border-transparent hover:border-primary/30'
                                }`}
                                onClick={() => setSelectedSujet(selectedSujet?.id === s.id ? null : s)}
                            >
                                <div className="flex items-start justify-between gap-3 mb-3">
                                    <h3 className="font-bold text-text leading-snug">{s.titre}</h3>
                                </div>
                                {s.description && (
                                    <p className="text-sm text-text-muted mb-3 line-clamp-2">{s.description}</p>
                                )}
                                {s.objectifs && s.objectifs.length > 0 && (
                                    <div className="mb-3">
                                        <p className="text-xs font-semibold text-text-muted uppercase mb-1">Objectifs</p>
                                        <ul className="list-disc list-inside text-xs text-text-muted space-y-0.5">
                                            {s.objectifs.slice(0, 3).map((obj, i) => (
                                                <li key={i} className="line-clamp-1">{obj}</li>
                                            ))}
                                            {s.objectifs.length > 3 && (
                                                <li className="text-primary">+{s.objectifs.length - 3} autres</li>
                                            )}
                                        </ul>
                                    </div>
                                )}
                                {s.formateur && (
                                    <p className="text-xs text-text-muted flex items-center gap-1">
                                        <Users size={12} />
                                        Proposé par : <span className="font-semibold text-text">{s.formateur.prenom} {s.formateur.nom}</span>
                                    </p>
                                )}
                                {selectedSujet?.id === s.id && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        className="mt-4 pt-4 border-t border-glass-border"
                                    >
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleChoose(s.id); }}
                                            disabled={choosing === s.id}
                                            className="primary action-btn w-full py-2.5 flex items-center justify-center gap-2 text-sm"
                                        >
                                            {choosing === s.id ? (
                                                <Loader2 size={16} className="animate-spin" />
                                            ) : (
                                                <CheckCircle2 size={16} />
                                            )}
                                            {choosing === s.id ? 'Choix en cours...' : 'Choisir ce sujet'}
                                        </button>
                                    </motion.div>
                                )}
                            </div>
                        ))}
                    </div>
                </>
            )}

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
