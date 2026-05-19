import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, ChevronRight, Moon, Sun } from 'lucide-react';
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

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-animated relative overflow-hidden p-6">


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
                        src={isDarkMode ? "/logoDark.png?v=2" : "/logoLite.png?v=2"}
                        alt="Certif-fun"
                        className="logo-responsive object-contain mx-auto mb-4"
                    />
                    <h1 className="text-2xl font-bold gradient-text mb-2 tracking-tight">Portail Administration</h1>
                    <p className="text-text-muted text-lg font-medium">Connectez-vous pour continuer</p>
                </div>

                {/* Error / Success Messages */}
                {error && (
                    <div className="mb-6 p-4 bg-error/10 border border-error/20 rounded-xl flex items-center gap-3 text-error text-sm font-semibold">
                        <span className="shrink-0">⚠️</span>
                        <span>{error}</span>
                    </div>
                )}
                {successMsg && (
                    <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center gap-3 text-green-500 text-sm font-semibold">
                        <span className="shrink-0">✅</span>
                        <span>{successMsg}</span>
                    </div>
                )}

                {viewState === 'LOGIN' && (
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
                            <div className="flex justify-end mt-2">
                                <button 
                                    type="button" 
                                    onClick={() => {
                                        setViewState('RESET_EMAIL');
                                        setResetEmail(email);
                                        setError('');
                                        setSuccessMsg('');
                                    }}
                                    className="bg-transparent hover:bg-transparent border-none outline-none shadow-none text-xs font-bold text-primary hover:text-primary-hover transition-colors p-0 m-0"
                                >
                                    Mot de passe oublié ?
                                </button>
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
                )}

                {viewState === 'RESET_EMAIL' && (
                    <form onSubmit={handleForgotPassword} className="space-y-8">
                        <div className="space-y-6">
                            <div className="form-group">
                                <label className="text-xs font-bold text-text-muted uppercase tracking-widest mb-2 block ml-1 text-center">Réinitialisation</label>
                                <div className="relative input-focus-effect rounded-xl transition-all duration-300">
                                    <div className="absolute left-5 top-1/2 -translate-y-1/2 flex items-center justify-center text-primary z-20 pointer-events-none"><Mail size={20} strokeWidth={2.5} /></div>
                                    <input type="email" required placeholder="admin@certiflow.com" className="form-input w-full pl-14 h-14 bg-background/30 border-white/10 text-base outline-none" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} />
                                </div>
                                <p className="text-xs text-text-muted text-center mt-4">Entrez votre adresse email pour recevoir un code.</p>
                            </div>
                        </div>
                        <div className="flex flex-col gap-4">
                            <button type="submit" disabled={isLoading} className="w-full h-14 primary flex items-center justify-center gap-3 text-lg font-bold rounded-xl shadow-xl transition-all">
                                {isLoading ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <span>Envoyer le code</span>}
                            </button>
                            <button type="button" onClick={() => { setViewState('LOGIN'); setError(''); setSuccessMsg(''); }} className="text-sm font-bold text-text-muted hover:text-text transition-colors text-center w-full">Retour à la connexion</button>
                        </div>
                    </form>
                )}

                {viewState === 'RESET_CODE' && (
                    <form onSubmit={handleVerifyResetCode} className="space-y-8">
                        <div className="space-y-6">
                            <div className="form-group">
                                <label className="text-xs font-bold text-text-muted uppercase tracking-widest mb-2 block ml-1 text-center">Code de vérification</label>
                                <div className="relative input-focus-effect rounded-xl transition-all duration-300">
                                    <div className="absolute left-5 top-1/2 -translate-y-1/2 flex items-center justify-center text-primary z-20 pointer-events-none"><Lock size={20} strokeWidth={2.5} /></div>
                                    <input type="text" required maxLength={6} placeholder="000000" className="form-input w-full pl-14 h-14 bg-background/30 border-white/10 text-center text-2xl tracking-[0.5em] font-bold outline-none" value={resetCode} onChange={(e) => setResetCode(e.target.value.replace(/\D/g, ''))} />
                                </div>
                                <p className="text-xs text-text-muted text-center mt-4">Vérifiez votre boîte mail ({resetEmail}).</p>
                            </div>
                        </div>
                        <div className="flex flex-col gap-4">
                            <button type="submit" disabled={isLoading} className="w-full h-14 primary flex items-center justify-center gap-3 text-lg font-bold rounded-xl shadow-xl transition-all">
                                {isLoading ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <span>Vérifier le code</span>}
                            </button>
                            <button type="button" onClick={() => { setViewState('RESET_EMAIL'); setError(''); setSuccessMsg(''); }} className="text-sm font-bold text-text-muted hover:text-text transition-colors text-center w-full">Changer d'adresse email</button>
                        </div>
                    </form>
                )}

                {viewState === 'RESET_PASSWORD' && (
                    <form onSubmit={handleResetPassword} className="space-y-8">
                        <div className="space-y-6">
                            <div className="form-group">
                                <label className="text-xs font-bold text-text-muted uppercase tracking-widest mb-2 block ml-1">Nouveau mot de passe</label>
                                <div className="relative input-focus-effect rounded-xl transition-all duration-300">
                                    <div className="absolute left-5 top-1/2 -translate-y-1/2 flex items-center justify-center text-primary z-20"><Lock size={20} strokeWidth={2.5} /></div>
                                    <input type="password" required minLength={6} placeholder="••••••••" className="form-input w-full pl-14 h-14 bg-background/30 border-white/10 text-base outline-none" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="text-xs font-bold text-text-muted uppercase tracking-widest mb-2 block ml-1">Confirmer mot de passe</label>
                                <div className="relative input-focus-effect rounded-xl transition-all duration-300">
                                    <div className="absolute left-5 top-1/2 -translate-y-1/2 flex items-center justify-center text-primary z-20"><Lock size={20} strokeWidth={2.5} /></div>
                                    <input type="password" required minLength={6} placeholder="••••••••" className="form-input w-full pl-14 h-14 bg-background/30 border-white/10 text-base outline-none" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                                </div>
                            </div>

                        </div>
                        <div className="flex flex-col gap-4">
                            <button type="submit" disabled={isLoading} className="w-full h-14 primary flex items-center justify-center gap-3 text-lg font-bold rounded-xl shadow-xl transition-all">
                                {isLoading ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <span>Réinitialiser</span>}
                            </button>
                        </div>
                    </form>
                )}
            </div>

            <div className="absolute bottom-8 text-text-muted/50 text-xs font-semibold uppercase tracking-widest z-10">
                © 2026 Certif-fun Digital Assets
            </div>
        </div>
    );
};

export default LoginPage;
