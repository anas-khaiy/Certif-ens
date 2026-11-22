import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Mail, User, IdCard, Users, GraduationCap, BookOpen, Layers, ChevronRight, Moon, Sun, AlertCircle, CheckCircle2, Home, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import '../login.css';
import RecaptchaWidget from '../components/RecaptchaWidget';
import { API_ADMIN } from '../config';

const RegisterPage = () => {
    const navigate = useNavigate();
    const [enabled, setEnabled] = useState<boolean | null>(null);
    const [nom, setNom] = useState('');
    const [prenom, setPrenom] = useState('');
    const [email, setEmail] = useState('');
    const [specialiteId, setSpecialiteId] = useState('');
    const [options, setOptions] = useState<{ formations: any[]; cycles: any[]; specialites: any[] }>({ formations: [], cycles: [], specialites: [] });
    const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('theme') !== 'light');

    useEffect(() => {
        const root = document.documentElement;
        root.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
        localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    }, [isDarkMode]);

    useEffect(() => {
        fetch(`${API_ADMIN}/public/registration-settings`)
            .then(r => r.ok ? r.json() : Promise.reject())
            .then(d => setEnabled(d.formateur === true))
            .catch(() => setEnabled(false));
    }, []);

    useEffect(() => {
        fetch(`${API_ADMIN}/public/registration-options`)
            .then(r => r.ok ? r.json() : null)
            .then(d => { if (d) setOptions({ formations: d.formations || [], cycles: d.cycles || [], specialites: d.specialites || [] }); })
            .catch(() => {});
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!recaptchaToken) {
            setError('Veuillez cocher « Je ne suis pas un robot ».');
            return;
        }
        setIsLoading(true);
        try {
            const res = await fetch(`${API_ADMIN}/public/register/formateur`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nom, prenom, email, specialiteId, recaptchaToken })
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                setError(data.message || "Erreur lors de l'inscription.");
                if ((window as any).grecaptcha) { try { (window as any).grecaptcha.reset(); } catch {} }
                setRecaptchaToken(null);
                if (res.status === 403) setEnabled(false);
                return;
            }
            setSuccess(data.message || 'Inscription réussie. Vérifiez votre boîte e-mail pour vous connecter.');
        } catch {
            setError('Impossible de contacter le serveur. Veuillez réessayer.');
        } finally {
            setIsLoading(false);
        }
    };

    const field = (icon: React.ReactNode, props: React.InputHTMLAttributes<HTMLInputElement>) => (
        <div className="relative input-focus-effect rounded-xl overflow-hidden transition-all duration-300">
            <div className="absolute left-[10px] top-0 bottom-0 w-12 flex items-center justify-center text-primary pointer-events-none z-20">{icon}</div>
            <input
                {...props}
                required
                className="form-input w-full h-14 bg-background/30 backdrop-blur-md border border-white/10 rounded-xl pl-14 pr-6 text-base focus:bg-background/50 transition-all outline-none text-text"
            />
        </div>
    );

    const selectField = (icon: React.ReactNode, value: string, onChange: (v: string) => void, placeholder: string, options: { id: any; nom: string }[]) => (
        <div className="relative input-focus-effect rounded-xl overflow-hidden transition-all duration-300">
            <div className="absolute left-[10px] top-0 bottom-0 w-12 flex items-center justify-center text-primary pointer-events-none z-20">{icon}</div>
            <select
                required
                value={value}
                onChange={e => onChange(e.target.value)}
                className="form-input w-full h-14 bg-background/30 backdrop-blur-md border border-white/10 rounded-xl pl-14 pr-6 text-base focus:bg-background/50 transition-all outline-none text-text appearance-none"
            >
                <option value="">{placeholder}</option>
                {options.map(o => <option key={String(o.id)} value={String(o.id)}>{o.nom}</option>)}
            </select>
        </div>
    );

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-animated relative overflow-hidden p-6">
            <div className="absolute top-8 right-8 z-50 flex flex-col gap-4">
                <button
                    onClick={() => setIsDarkMode(p => !p)}
                    className="w-14 h-14 flex items-center justify-center rounded-xl bg-surface text-primary border border-white/10 hover:bg-surface-hover transition-all"
                    aria-label="Toggle theme"
                >
                    {isDarkMode ? <Sun size={34} /> : <Moon size={34} />}
                </button>
                <button
                    onClick={() => navigate('/login')}
                    className="w-14 h-14 flex items-center justify-center rounded-xl bg-surface text-primary border border-white/10 hover:bg-surface-hover transition-all"
                    aria-label="Retour"
                >
                    <Home size={34} />
                </button>
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="glass-morphism max-w-md w-full p-10 z-10 relative overflow-hidden shadow-soft"
            >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />

                <div className="text-center mb-8">
                    <h1 className="text-3xl font-black text-text">Inscription Formateur</h1>
                    <p className="text-text-muted mt-2 text-sm">Créez votre compte ENS-Learning</p>
                </div>

                {enabled === null && (
                    <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary" size={32} /></div>
                )}

                {enabled === false && !success && (
                    <div className="text-center space-y-6 py-4">
                        <div className="mx-auto w-16 h-16 rounded-full bg-error/10 flex items-center justify-center text-error"><AlertCircle size={32} /></div>
                        <p className="text-text font-semibold">L'inscription n'est pas disponible pour le moment.</p>
                        <button onClick={() => navigate('/login')} className="text-sm font-bold text-primary hover:text-primary-hover transition-colors">Retour à la connexion</button>
                    </div>
                )}

                {success && (
                    <div className="text-center space-y-6 py-4">
                        <div className="mx-auto w-16 h-16 rounded-full bg-success/10 flex items-center justify-center text-success"><CheckCircle2 size={36} /></div>
                        <p className="text-text font-bold text-lg">Vous êtes bien inscrit(e) !</p>
                        <p className="text-text-muted text-sm leading-relaxed">{success}</p>
                        <button onClick={() => navigate('/login')} className="w-full h-14 primary flex items-center justify-center gap-2 text-lg font-bold rounded-xl">
                            Aller à la connexion <ChevronRight size={22} />
                        </button>
                    </div>
                )}

                {enabled === true && !success && (
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {error && (
                            <div className="flex items-center gap-2 p-3 rounded-xl bg-error/10 border border-error/20 text-error text-sm font-semibold">
                                <AlertCircle size={18} className="shrink-0" /> {error}
                            </div>
                        )}
                        {field(<User size={22} strokeWidth={2.5} />, { type: 'text', placeholder: 'Nom', value: nom, onChange: e => setNom(e.target.value) })}
                        {field(<User size={22} strokeWidth={2.5} />, { type: 'text', placeholder: 'Prénom', value: prenom, onChange: e => setPrenom(e.target.value) })}
                        {field(<Mail size={22} strokeWidth={2.5} />, { type: 'email', placeholder: 'Adresse e-mail', value: email, onChange: e => setEmail(e.target.value) })}
                        {selectField(<GraduationCap size={22} strokeWidth={2.5} />, specialiteId, setSpecialiteId, 'Spécialité', options.specialites)}
                        <RecaptchaWidget onChange={setRecaptchaToken} />
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full h-14 primary flex items-center justify-center gap-3 text-lg font-bold rounded-xl shadow-xl transition-all duration-300"
                        >
                            {isLoading ? <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div> : <><span>S'inscrire</span><ChevronRight size={22} /></>}
                        </button>
                        <div className="text-center">
                            <button type="button" onClick={() => navigate('/login')} className="text-sm font-bold text-text-muted hover:text-text transition-colors">
                                Déjà inscrit ? Se connecter
                            </button>
                        </div>
                    </form>
                )}
            </motion.div>
        </div>
    );
};

export default RegisterPage;
