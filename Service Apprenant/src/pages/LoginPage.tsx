import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, ChevronRight, Moon, Sun, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import logoDark from '../assets/logoDark.png';
import logoLite from '../assets/logoLite.png';
import '../login.css';
import api from '../api/api-client';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(() => {
        const savedTheme = localStorage.getItem('theme');
        return savedTheme !== 'light';
    });
    const [error, setError] = useState('');
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
            setError(err.response?.data?.message || 'Email ou mot de passe incorrect. Veuillez réessayer.');
        } finally {
            setIsLoading(false);
        }
    };

    const toggleTheme = () => {
        setIsDarkMode((prev) => !prev);
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-animated relative overflow-hidden p-6">
            {/* Background Decorative Elements */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        rotate: [0, 90, 0],
                        x: [0, 100, 0],
                        y: [0, 50, 0]
                    }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px]"
                />
                <motion.div
                    animate={{
                        scale: [1, 1.3, 1],
                        x: [0, -100, 0],
                        y: [0, -50, 0]
                    }}
                    transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                    className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-secondary/20 rounded-full blur-[150px]"
                />

                {/* Floating particles */}
                {[...Array(15)].map((_, i) => (
                    <motion.div
                        key={i}
                        animate={{
                            y: [0, -100, 0],
                            opacity: [0, 0.5, 0],
                            scale: [0, 1, 0],
                        }}
                        transition={{
                            duration: 5 + Math.random() * 5,
                            repeat: Infinity,
                            delay: Math.random() * 5,
                        }}
                        className="absolute w-2 h-2 bg-white/20 rounded-full blur-sm"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                        }}
                    />
                ))}
            </div>

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
                className="glass-morphism max-w-md w-full p-10 z-10 relative overflow-hidden shadow-soft"
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
                            src={isDarkMode ? logoDark : logoLite}
                            alt="CertiFlow Logo"
                            className="logo-responsive object-contain relative z-10"
                        />
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        <h1 className="text-2xl font-bold gradient-text mb-3 tracking-tight">Plateforme de Certification </h1>
                        <p className="text-text-muted text-lg font-medium">Portail d'apprenant</p>
                    </motion.div>
                </div>

                {/* Error Message */}
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

                {/* Login Form */}
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
                                    placeholder="admin@certiflow.com"
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
            </motion.div>

            {/* Footer Credit */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="absolute bottom-8 text-text-muted/50 text-xs font-semibold uppercase tracking-widest z-10"
            >
                © 2026 CertiFlow Digital Assets
            </motion.div>
        </div>
    );
};

export default LoginPage;
