import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { XCircle, Award, User, BookOpen, Calendar, Star, ShieldCheck, Loader2, Sun, Moon } from 'lucide-react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { API_FORMATEUR, API_APPRENANT, API_ADMIN, WS_APPRENANT, WS_LIVEKIT, AI_DETECT_URL, VERIFY_URL_APPRENANT, VERIFY_URL_FORMATEUR } from '../config';

interface VerificationData {
    learnerName: string;
    trainerName: string;
    courseName: string;
    score: number;
    completionDate: string;
    valid: boolean;
    type?: string;
    errorMessage?: string;
}

const VerifyCertificatePage = () => {
    const { enrollmentId } = useParams<{ enrollmentId: string }>();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<VerificationData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [theme, setTheme] = useState<'dark' | 'light'>(() => {
        return (localStorage.getItem('theme') as 'dark' | 'light') || 'dark';
    });

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'dark' ? 'light' : 'dark');
    };

    useEffect(() => {
        const verify = async () => {
            try {
                // Logic: If starts with BND-, call Trainer Backend (8081). Otherwise Apprenant Backend (8082).
                const backendUrl = enrollmentId?.startsWith('BND-') 
                    ? `${API_FORMATEUR}/verify/${enrollmentId}`
                    : `${API_APPRENANT}/verify/${enrollmentId}`;
                    
                const response = await axios.get(backendUrl);
                setData(response.data);
            } catch (err) {
                setError("Impossible de vérifier ce certificat.");
            } finally {
                setLoading(false);
            }
        };
        verify();
    }, [enrollmentId]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0A0F1C] flex flex-col items-center justify-center p-6 bg-[radial-gradient(circle_at_50%_50%,rgba(17,24,39,1)_0%,rgba(5,8,15,1)_100%)]">
                <div className="relative">
                    <Loader2 size={48} className="text-primary animate-spin" />
                    <div className="absolute inset-0 blur-xl bg-primary/20 animate-pulse"></div>
                </div>
                <p className="mt-6 text-slate-400 font-medium tracking-wide">Vérification de l'authenticité en cours...</p>
            </div>
        );
    }

    if (error || !data || !data.valid) {
        return (
            <div className="min-h-screen bg-background text-text flex flex-col items-center pt-8 md:pt-16 pb-20 px-6 relative overflow-x-hidden transition-colors duration-300">
                {/* Background Decorations */}
                <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
                    <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-error/5 blur-[120px] rounded-full"></div>
                    <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 blur-[120px] rounded-full"></div>
                </div>

                {/* Theme Toggle Button */}
                <div className="fixed right-6 top-6 z-50">
                    <button
                        onClick={toggleTheme}
                        className="p-3 rounded-xl bg-surface/50 border border-glass-border hover:bg-surface transition-all text-text shadow-lg backdrop-blur-md"
                    >
                        {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                    </button>
                </div>

                {/* Main Logo */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-12 relative z-10"
                >
                    <Link to="/" className="transform hover:scale-105 transition-transform duration-300 block">
                        <img
                            src={theme === 'dark' ? "/logoDark.png" : "/logoLite.png"}
                            alt="CertifEns Logo"
                            className="h-24 md:h-40 w-auto object-contain"
                        />
                    </Link>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="glass max-w-md w-full p-10 text-center border-error/20 shadow-xl relative z-10 backdrop-blur-xl"
                >
                    <div className="w-20 h-20 bg-error/10 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-error/20 rotate-3">
                        <XCircle size={40} className="text-error" />
                    </div>
                    <h1 className="text-2xl font-black text-text mb-3">Certificat non valide</h1>
                    <p className="text-text-muted mb-8 leading-relaxed font-medium">
                        {data?.errorMessage || "Désolé, nous n'avons pas pu confirmer l'authenticité de ce certificat. Il pourrait s'agir d'un lien expiré ou d'un document non officiel."}
                    </p>
                </motion.div>
            </div>
        );
    }

    const formattedDate = new Date(data.completionDate).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });

    const isBundle = data.type === 'BUNDLE' || enrollmentId?.startsWith('BND-');

    return (
        <div className="min-h-screen bg-background text-text flex flex-col items-center pt-8 md:pt-16 pb-20 px-6 relative overflow-x-hidden transition-colors duration-300">
            {/* Background Decorations */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full dark:bg-primary/20"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full dark:bg-blue-500/20"></div>
            </div>

            {/* Theme Toggle Button (Standalone) */}
            <div className="fixed right-6 top-6 z-50">
                <button
                    onClick={toggleTheme}
                    className="p-3 rounded-xl bg-surface/50 border border-glass-border hover:bg-surface transition-all text-text shadow-lg backdrop-blur-md"
                >
                    {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                </button>
            </div>

            {/* Main Logo - Centered and in-flow */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-12 relative z-10"
            >
                <Link to="/" className="transform hover:scale-105 transition-transform duration-300 block">
                    <img
                        src={theme === 'dark' ? "/logoDark.png" : "/logoLite.png"}
                        alt="CertifEns Logo"
                        className="h-24 md:h-40 w-auto object-contain"
                    />
                </Link>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-2xl w-full relative z-10"
            >
                {/* Header Badge */}
                <div className="flex justify-center mb-8">
                    <motion.div
                        initial={{ y: 10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="bg-primary/10 text-primary px-6 py-2 rounded-full border border-primary/20 flex items-center gap-2 backdrop-blur-md"
                    >
                        <ShieldCheck size={18} className="animate-pulse" />
                        <span className="text-sm font-black uppercase tracking-[0.2em]">Certificat Vérifié</span>
                    </motion.div>
                </div>

                <div className="glass p-8 md:p-12 relative overflow-hidden group">
                    {/* Decorative Corner */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-[100px] -mr-8 -mt-8 group-hover:bg-primary/10 transition-colors"></div>

                    <div className="text-center mb-10 relative">
                        <div className="w-24 h-24 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-primary/20 rotate-3 group-hover:rotate-6 transition-transform">
                            <Award size={48} className="text-primary" />
                        </div>
                        <h1
                            className="text-3xl md:text-4xl font-black mb-2 tracking-tight line-clamp-2 uppercase"
                            style={{ color: theme === 'light' ? '#000000' : '#ffffff' }}
                        >
                            {data.courseName}
                        </h1>
                        <p className="text-text-muted uppercase tracking-[0.3em] text-[10px] font-bold">Certification de Réussite</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
                        {/* Module Info */}
                        <div className="md:col-span-2 bg-surface/40 p-6 rounded-2xl border border-glass-border hover:border-primary/30 transition-all group/item backdrop-blur-sm">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 group-hover/item:scale-110 transition-transform">
                                    <BookOpen size={20} className="text-primary" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[10px] uppercase tracking-widest text-text-muted font-bold mb-0.5">{isBundle ? 'Nom du Parcours' : 'Nom du Module'}</p>
                                    <h3 className="text-text font-bold text-lg">{data.courseName}</h3>
                                </div>
                            </div>
                        </div>

                        {/* Learner Info */}
                        <div className="bg-surface/40 p-6 rounded-2xl border border-glass-border hover:border-primary/30 transition-all group/item backdrop-blur-sm">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 group-hover/item:scale-110 transition-transform">
                                    <User size={20} className="text-blue-400" />
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase tracking-widest text-text-muted font-bold mb-0.5">Apprenant</p>
                                    <h3 className="text-text font-bold">{data.learnerName}</h3>
                                </div>
                            </div>
                        </div>

                        {/* Trainer Info */}
                        <div className="bg-surface/40 p-6 rounded-2xl border border-glass-border hover:border-primary/30 transition-all group/item backdrop-blur-sm">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20 group-hover/item:scale-110 transition-transform">
                                    <ShieldCheck size={20} className="text-purple-400" />
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase tracking-widest text-text-muted font-bold mb-0.5">Délivré par</p>
                                    <h3 className="text-text font-bold">{data.trainerName}</h3>
                                </div>
                            </div>
                        </div>

                        {/* Date Info */}
                        <div className="bg-surface/40 p-6 rounded-2xl border border-glass-border hover:border-primary/30 transition-all group/item backdrop-blur-sm">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center border border-green-500/20 group-hover/item:scale-110 transition-transform">
                                    <Calendar size={20} className="text-green-400" />
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase tracking-widest text-text-muted font-bold mb-0.5">Date d'obtention</p>
                                    <h3 className="text-text font-bold">{formattedDate}</h3>
                                </div>
                            </div>
                        </div>

                        {/* Score Info */}
                        <div className="bg-surface/40 p-6 rounded-2xl border border-glass-border hover:border-primary/30 transition-all group/item backdrop-blur-sm">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center border border-yellow-500/20 group-hover/item:scale-110 transition-transform">
                                    <Star size={20} className="text-yellow-400" />
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase tracking-widest text-text-muted font-bold mb-0.5">{isBundle ? 'Moyenne du Parcours' : 'Moyenne du Module'}</p>
                                    <h3 className="text-text font-bold">{data.score}%</h3>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-12 pt-8 border-t border-glass-border text-center">
                        <div className="inline-flex items-center gap-2 text-text-muted text-xs px-4 py-2 bg-surface/50 rounded-lg border border-glass-border">
                            <ShieldCheck size={14} className="text-primary" />
                            Document numérique vérifié avec succès
                        </div>
                    </div>
                </div>

                <div className="mt-8 text-center text-text-muted text-sm">
                    <p>© 2026 CertifEns. Tous droits réservés.</p>
                </div>
            </motion.div>
        </div>
    );
};

export default VerifyCertificatePage;
