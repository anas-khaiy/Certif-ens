import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, ChevronRight, Moon, Sun } from 'lucide-react';
import logoDark from '../assets/logoDark.png';
import logoLite from '../assets/logoLite.png';
import api from '../api/api-client';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [isDarkMode, setIsDarkMode] = useState(() => {
        try {
            const saved = localStorage.getItem('theme');
            return saved !== 'light';
        } catch (e) {
            return true;
        }
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
            const response = await api.post('/auth/authenticate', {
                email,
                password
            });

            const { token, role, nom, prenom } = response.data;
            localStorage.setItem('token', token);
            localStorage.setItem('isAdmin', 'true');
            localStorage.setItem('user', JSON.stringify({ nom, prenom, role, email }));
            localStorage.setItem('adminNom', nom);
            localStorage.setItem('adminPrenom', prenom);


            setIsLoading(false);
            navigate('/');
        } catch (err: any) {
            console.error('Login error:', err);
            setError(err.response?.data?.message || 'Identifiants invalides ou serveur indisponible');
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-animated relative overflow-hidden p-6">
            {/* Static Background Decorative Elements */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-secondary/20 rounded-full blur-[150px]" />
            </div>

            {/* Simple Theme Toggle */}
            <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="absolute top-8 right-8 z-50 w-14 h-14 flex items-center justify-center rounded-xl bg-surface text-primary border border-white/10 hover:bg-surface-hover transition-all"
            >
                {isDarkMode ? <Sun size={34} /> : <Moon size={34} />}
            </button>

            {/* Main Login Card - Using standard div for stability */}
            <div className="glass-morphism max-w-md w-full p-10 z-10 relative overflow-hidden shadow-soft animate-fade-in">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />

                <div className="text-center mb-8">
                    <img
                        src={isDarkMode ? logoDark : logoLite}
                        alt="CertiFlow"
                        className="logo-responsive object-contain mx-auto mb-4"
                    />
                    <h1 className="text-2xl font-bold gradient-text mb-2 tracking-tight">Portail Administration</h1>
                    <p className="text-text-muted text-lg font-medium">Connectez-vous pour continuer</p>
                </div>

                {/* Simple Non-Animated Error Alert */}
                {error && (
                    <div className="mb-6 p-4 bg-error/10 border border-error/20 rounded-xl flex items-center gap-3 text-error text-sm font-semibold">
                        <span className="shrink-0">⚠️</span>
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-8">
                    <div className="space-y-6">
                        <div className="form-group">
                            <label className="text-xs font-bold text-text-muted uppercase tracking-widest mb-2 block ml-1">Email</label>
                            <div className="relative input-focus-effect rounded-xl transition-all duration-300">
                                <div className="absolute left-5 top-1/2 -translate-y-1/2 flex items-center justify-center text-primary z-20 pointer-events-none">
                                    <Mail size={20} strokeWidth={2.5} />
                                </div>
                                <input
                                    type="email"
                                    required
                                    placeholder="admin@certiflow.com"
                                    className="form-input w-full pl-14 h-14 bg-background/30 border-white/10 text-base outline-none"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="text-xs font-bold text-text-muted uppercase tracking-widest mb-2 block ml-1">Mot de Passe</label>
                            <div className="relative input-focus-effect rounded-xl transition-all duration-300">
                                <div className="absolute left-5 top-1/2 -translate-y-1/2 flex items-center justify-center text-primary z-20 pointer-events-none">
                                    <Lock size={20} strokeWidth={2.5} />
                                </div>
                                <input
                                    type="password"
                                    required
                                    placeholder="••••••••"
                                    className="form-input w-full pl-14 h-14 bg-background/30 border-white/10 text-base outline-none"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full h-14 primary flex items-center justify-center gap-3 text-lg font-bold rounded-xl shadow-xl transition-all"
                    >
                        {isLoading ? (
                            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            <>
                                <span>Se Connecter</span>
                                <ChevronRight size={22} />
                            </>
                        )}
                    </button>
                </form>
            </div>

            <div className="absolute bottom-8 text-text-muted/50 text-xs font-semibold uppercase tracking-widest z-10">
                © 2026 CertiFlow Digital Assets
            </div>
        </div>
    );
};

export default LoginPage;
