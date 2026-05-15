import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Lock, Mail, ChevronRight, Moon, Sun, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import '../login.css';
import api from '../api/api-client';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    
    // --- Password Reset State ---
    const [viewState, setViewState] = useState<'LOGIN' | 'RESET_EMAIL' | 'RESET_CODE' | 'RESET_PASSWORD'>('LOGIN');
    const [resetEmail, setResetEmail] = useState('');
    const [resetCode, setResetCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    // ----------------------------

    const [isDarkMode, setIsDarkMode] = useState(() => {
        const savedTheme = localStorage.getItem('theme');
        return savedTheme !== 'light';
    });
    const navigate = useNavigate();

    useEffect(() => {
        const root = document.documentElement;
        if (isDarkMode) {
            root.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
        } else {
            root.setAttribute('data-theme', 'light');
            localStorage.setItem('theme', 'light');
        }
    }, [isDarkMode]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const response = await api.post('/auth/authenticate', { email, password });
            const data = response.data;

            // Store JWT token and user info
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify({
                email: data.email,
                nom: data.nom,
                prenom: data.prenom,
                role: data.role,
                photoProfile: data.photoProfile,
            }));

            navigate('/');
        } catch (err: any) {
            setError('Email ou mot de passe incorrect. Veuillez réessayer.');
        } finally {
            setIsLoading(false);
        }
    };

    // --- Password Reset Handlers ---
    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setSuccessMsg('');
        try {
            const res = await api.post('/auth/forgot-password', { email: resetEmail });
            setSuccessMsg(res.data.message || 'Code envoyé.');
            setViewState('RESET_CODE');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Erreur lors de l\'envoi du code.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyResetCode = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setSuccessMsg('');
        try {
            const res = await api.post('/auth/verify-reset-code', { email: resetEmail, code: resetCode });
            setSuccessMsg(res.data.message || 'Code vérifié.');
            setViewState('RESET_PASSWORD');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Code invalide ou expiré.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setError('Les mots de passe ne correspondent pas.');
            return;
        }
        setIsLoading(true);
        setError('');
        setSuccessMsg('');
        try {
            const res = await api.post('/auth/reset-password', { email: resetEmail, code: resetCode, newPassword });
            setSuccessMsg(res.data.message || 'Mot de passe réinitialisé. Vous pouvez vous connecter.');
            // Go back to login after short delay
            setTimeout(() => {
                setViewState('LOGIN');
                setSuccessMsg('');
                setPassword('');
            }, 3000);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Erreur lors de la réinitialisation.');
        } finally {
            setIsLoading(false);
        }
    };
    // -------------------------------

    const toggleTheme = () => {
        setIsDarkMode((prev) => !prev);
    };

    return (
        <div className="h-screen w-full bg-animated relative overflow-y-auto">
            <div className="min-h-full w-full flex flex-col items-center justify-center p-6 md:p-10 relative z-10">
                {/* Theme Toggle Button */}
                <motion.button
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={toggleTheme}
                    className="absolute top-8 right-8 z-50 w-14 h-14 flex items-center justify-center rounded-xl bg-[#0f172a] text-primary shadow-2xl border border-white/10 hover:bg-[#1e293b] transition-all"
                    aria-label="Toggle theme"
                >
                    {isDarkMode ? <Sun size={34} strokeWidth={2.5} /> : <Moon size={34} strokeWidth={2.5} />}
                </motion.button>

                {/* Main Container - Centered */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className="glass-morphism max-w-md w-full p-10 relative overflow-hidden shadow-soft"
                >
                    {/* Decorative border glow */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />

                    {/* Header */}
                    <div className="text-center mb-8">
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8 }}
                            className="inline-flex items-center justify-center relative mb-4"
                        >
                            <img
                                src={isDarkMode ? "/logoDark.png" : "/logoLite.png"}
                                alt="CertifEns Logo"
                                className="logo-responsive object-contain relative z-10"
                            />
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            <h1 className="text-2xl font-bold gradient-text mb-3 tracking-tight">Plateforme de Certification </h1>
                            <p className="text-text-muted text-lg font-medium">Portail de Formateur</p>
                        </motion.div>
                    </div>

                    {/* Error / Success Messages */}
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-6 flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400"
                        >
                            <AlertCircle size={18} className="flex-shrink-0" />
                            <span className="text-sm font-medium">{error}</span>
                        </motion.div>
                    )}
                    {successMsg && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-6 flex items-center gap-3 p-4 rounded-xl bg-green-500/10 border border-green-500/30 text-green-500"
                        >
                            <AlertCircle size={18} className="flex-shrink-0" />
                            <span className="text-sm font-medium">{successMsg}</span>
                        </motion.div>
                    )}

                    {viewState === 'LOGIN' && (
                        <form onSubmit={handleLogin} className="space-y-8">
                        <div className="space-y-6">
                            {/* Email Field */}
                            <motion.div
                                initial={{ x: -20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: 0.4 }}
                                className="form-group"
                            >
                                <label className="text-xs font-bold text-text-muted uppercase tracking-[0.2em] mb-2 block ml-1">
                                    Identifiant Email
                                </label>
                                <div className="relative input-focus-effect rounded-xl overflow-hidden transition-all duration-300">
                                    <div className="absolute left-[10px] top-0 bottom-0 w-12 flex items-center justify-center text-primary pointer-events-none z-20">
                                        <Mail size={22} strokeWidth={3} />
                                    </div>
                                    <input
                                        type="email"
                                        required
                                        placeholder="formateur@certifens.com"
                                        className="form-input w-full h-14 bg-background/30 backdrop-blur-md border border-white/10 rounded-xl pl-14 pr-6 text-base focus:bg-background/50 transition-all outline-none text-text"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                            </motion.div>

                            {/* Password Field */}
                            <motion.div
                                initial={{ x: -20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: 0.5 }}
                                className="form-group"
                            >
                                <label className="text-xs font-bold text-text-muted uppercase tracking-[0.2em] mb-2 block ml-1">
                                    Mot de Passe
                                </label>
                                <div className="relative input-focus-effect rounded-xl overflow-hidden transition-all duration-300">
                                    <div className="absolute left-[10px] top-0 bottom-0 w-12 flex items-center justify-center text-primary pointer-events-none z-20">
                                        <Lock size={22} strokeWidth={3} />
                                    </div>
                                    <input
                                        type="password"
                                        required
                                        placeholder="••••••••"
                                        className="form-input w-full h-14 bg-background/30 backdrop-blur-md border border-white/10 rounded-xl pl-14 pr-6 text-base focus:bg-background/50 transition-all outline-none text-text"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>
                                <div className="flex justify-end mt-2">
                                    <button 
                                        type="button" 
                                        onClick={() => {
                                            setViewState('RESET_EMAIL');
                                            setResetEmail(email);
                                            setError('');
                                            setSuccessMsg('');
                                        }}
                                        className="text-xs font-bold text-primary hover:text-primary-hover transition-colors"
                                    >
                                        Mot de passe oublié ?
                                    </button>
                                </div>
                            </motion.div>
                        </div>

                        {/* Login Button */}
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.6 }}
                        >
                            <motion.button
                                whileHover={{ scale: 1.02, y: -2 }}
                                whileTap={{ scale: 0.98 }}
                                type="submit"
                                disabled={isLoading}
                                className="w-full h-14 primary flex items-center justify-center gap-3 text-lg font-bold rounded-xl shadow-xl hover:shadow-primary/20 transition-all duration-300 relative overflow-hidden group"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                {isLoading ? (
                                    <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin relative z-10"></div>
                                ) : (
                                    <div className="flex items-center gap-2 relative z-10">
                                        <span>Se Connecter</span>
                                        <ChevronRight size={22} className="group-hover:translate-x-1 transition-transform" />
                                    </div>
                                )}
                            </motion.button>
                        </motion.div>
                    </form>
                    )}

                    {viewState === 'RESET_EMAIL' && (
                        <form onSubmit={handleForgotPassword} className="space-y-8">
                            <div className="space-y-6">
                                <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="form-group">
                                    <label className="text-xs font-bold text-text-muted uppercase tracking-[0.2em] mb-2 block ml-1 text-center">
                                        Réinitialisation du mot de passe
                                    </label>
                                    <div className="relative input-focus-effect rounded-xl overflow-hidden transition-all duration-300">
                                        <div className="absolute left-[10px] top-0 bottom-0 w-12 flex items-center justify-center text-primary pointer-events-none z-20">
                                            <Mail size={22} strokeWidth={3} />
                                        </div>
                                        <input
                                            type="email" required placeholder="Votre adresse email"
                                            className="form-input w-full h-14 bg-background/30 backdrop-blur-md border border-white/10 rounded-xl pl-14 pr-6 text-base focus:bg-background/50 transition-all outline-none text-text"
                                            value={resetEmail} onChange={(e) => setResetEmail(e.target.value)}
                                        />
                                    </div>
                                    <p className="text-xs text-text-muted text-center mt-4 px-4 leading-relaxed">
                                        Entrez votre adresse email pour recevoir un code de réinitialisation.
                                    </p>
                                </motion.div>
                            </div>
                            <div className="flex flex-col gap-4">
                                <motion.button type="submit" disabled={isLoading} className="w-full h-14 primary flex items-center justify-center gap-3 text-lg font-bold rounded-xl shadow-xl transition-all duration-300">
                                    {isLoading ? <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin relative z-10" /> : <span>Envoyer le code</span>}
                                </motion.button>
                                <button type="button" onClick={() => { setViewState('LOGIN'); setError(''); setSuccessMsg(''); }} className="text-sm font-bold text-text-muted hover:text-text transition-colors">
                                    Retour à la connexion
                                </button>
                            </div>
                        </form>
                    )}

                    {viewState === 'RESET_CODE' && (
                        <form onSubmit={handleVerifyResetCode} className="space-y-8">
                            <div className="space-y-6">
                                <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="form-group">
                                    <label className="text-xs font-bold text-text-muted uppercase tracking-[0.2em] mb-2 block ml-1 text-center">
                                        Code de vérification
                                    </label>
                                    <div className="relative input-focus-effect rounded-xl overflow-hidden transition-all duration-300">
                                        <div className="absolute left-[10px] top-0 bottom-0 w-12 flex items-center justify-center text-primary pointer-events-none z-20">
                                            <Lock size={22} strokeWidth={3} />
                                        </div>
                                        <input
                                            type="text" required maxLength={6} placeholder="000000"
                                            className="form-input w-full h-14 bg-background/30 backdrop-blur-md border border-white/10 rounded-xl pl-14 pr-6 text-center text-2xl tracking-[0.5em] font-bold focus:bg-background/50 transition-all outline-none text-text"
                                            value={resetCode} onChange={(e) => setResetCode(e.target.value.replace(/\D/g, ''))}
                                        />
                                    </div>
                                    <p className="text-xs text-text-muted text-center mt-4 px-4 leading-relaxed">
                                        Vérifiez votre boîte mail ({resetEmail}). Le code expire dans 10 minutes.
                                    </p>
                                </motion.div>
                            </div>
                            <div className="flex flex-col gap-4">
                                <motion.button type="submit" disabled={isLoading} className="w-full h-14 primary flex items-center justify-center gap-3 text-lg font-bold rounded-xl shadow-xl transition-all duration-300">
                                    {isLoading ? <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin relative z-10" /> : <span>Vérifier le code</span>}
                                </motion.button>
                                <button type="button" onClick={() => { setViewState('RESET_EMAIL'); setError(''); setSuccessMsg(''); }} className="text-sm font-bold text-text-muted hover:text-text transition-colors">
                                    Changer d'adresse email
                                </button>
                            </div>
                        </form>
                    )}

                    {viewState === 'RESET_PASSWORD' && (
                        <form onSubmit={handleResetPassword} className="space-y-8">
                            <div className="space-y-6">
                                <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="form-group">
                                    <label className="text-xs font-bold text-text-muted uppercase tracking-[0.2em] mb-2 block ml-1">Nouveau mot de passe</label>
                                    <div className="relative input-focus-effect rounded-xl overflow-hidden transition-all duration-300">
                                        <div className="absolute left-[10px] top-0 bottom-0 w-12 flex items-center justify-center text-primary z-20"><Lock size={22} strokeWidth={3} /></div>
                                        <input type="password" required minLength={6} placeholder="••••••••" className="form-input w-full h-14 bg-background/30 backdrop-blur-md border border-white/10 rounded-xl pl-14 pr-6 text-base focus:bg-background/50 transition-all outline-none text-text" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                                    </div>
                                </motion.div>
                                <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="form-group">
                                    <label className="text-xs font-bold text-text-muted uppercase tracking-[0.2em] mb-2 block ml-1">Confirmer le mot de passe</label>
                                    <div className="relative input-focus-effect rounded-xl overflow-hidden transition-all duration-300">
                                        <div className="absolute left-[10px] top-0 bottom-0 w-12 flex items-center justify-center text-primary z-20"><Lock size={22} strokeWidth={3} /></div>
                                        <input type="password" required minLength={6} placeholder="••••••••" className="form-input w-full h-14 bg-background/30 backdrop-blur-md border border-white/10 rounded-xl pl-14 pr-6 text-base focus:bg-background/50 transition-all outline-none text-text" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                                    </div>
                                </motion.div>
                            </div>
                            <div className="flex flex-col gap-4">
                                <motion.button type="submit" disabled={isLoading} className="w-full h-14 primary flex items-center justify-center gap-3 text-lg font-bold rounded-xl shadow-xl transition-all duration-300">
                                    {isLoading ? <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin relative z-10" /> : <span>Réinitialiser</span>}
                                </motion.button>
                            </div>
                        </form>
                    )}
                </motion.div>

                {/* Footer Credit */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                    className="mt-8 text-text-muted/50 text-xs font-semibold uppercase tracking-widest relative z-10"
                >
                    © 2026 CertifEns Digital Assets
                </motion.div>
            </div>


        </div>
    );
};

export default LoginPage;
