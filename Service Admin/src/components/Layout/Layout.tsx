import React, { useState, useEffect, useCallback } from 'react';
import api from '../../api/api-client';
import { NavLink, useNavigate } from 'react-router-dom';
import { API_FORMATEUR, API_APPRENANT, API_ADMIN, WS_APPRENANT, WS_LIVEKIT, AI_DETECT_URL, VERIFY_URL_APPRENANT, VERIFY_URL_FORMATEUR } from '../../config';
import {
    LayoutDashboard,
    Users,
    GraduationCap,
    Settings,
    LogOut,
    Bell,
    Menu,
    ChevronLeft,
    Sun,
    Moon,
    Layers,
    RefreshCw,
    Award,
    TrendingUp,
    BookOpen,
    PackageCheck,
    Briefcase
} from 'lucide-react';

interface SidebarItemProps {
    to: string;
    icon: React.ReactNode;
    label: string;
    onClick?: () => void;
}

const SidebarItem = ({ to, icon, label, onClick }: SidebarItemProps) => (
    <NavLink
        to={to}
        onClick={onClick}
        className={({ isActive }) =>
            `flex items-center gap-3 p-3 rounded-xl transition-all ${isActive
                ? 'bg-primary text-white shadow-lg shadow-indigo-500/20'
                : 'text-text-muted hover:bg-surface-hover hover:text-text'
            }`
        }
    >
        <div className="icon-container">{icon}</div>
        <span className="font-semibold">{label}</span>
    </NavLink>
);

const Layout = ({ children }: { children: React.ReactNode }) => {
    const navigate = useNavigate();
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(window.innerWidth < 1024);
    const [theme, setTheme] = useState<'dark' | 'light'>(() => {
        return (localStorage.getItem('theme') as 'dark' | 'light') || 'dark';
    });

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 1024) {
                setIsSidebarCollapsed(true);
            } else {
                setIsSidebarCollapsed(false);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'dark' ? 'light' : 'dark');
    };

    const handleLogout = () => {
        localStorage.removeItem('isAdmin');
        navigate('/login');
    };

    const [userInfo, setUserInfo] = useState({
        nom: localStorage.getItem('adminNom') || 'Admin',
        prenom: localStorage.getItem('adminPrenom') || '',
        photoProfile: 'default.png'
    });
    
    const [imgError, setImgError] = useState(false);

    const fetchUserInfo = useCallback(async () => {
        try {
            const response = await api.get('/auth/me');
            setUserInfo(response.data);
            localStorage.setItem('adminNom', response.data.nom);
            localStorage.setItem('adminPrenom', response.data.prenom);
        } catch (error) {
            console.error('Error fetching user info:', error);
        }
    }, []);

    useEffect(() => {
        fetchUserInfo();

        const handleProfileUpdate = () => {
            fetchUserInfo();
        };

        window.addEventListener('profileUpdate', handleProfileUpdate);
        return () => window.removeEventListener('profileUpdate', handleProfileUpdate);
    }, [fetchUserInfo]);

    const API_BASE_URL = API_ADMIN;
    const avatarUrl = `${API_BASE_URL}/files/profiles/${userInfo.photoProfile || 'default.png'}`;

    return (
        <div className="layout-root transition-colors">
            {/* Mobile Backdrop */}
            {!isSidebarCollapsed && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
                    style={{ backdropFilter: 'blur(4px)', backgroundColor: 'rgba(0,0,0,0.5)' }}
                    onClick={() => setIsSidebarCollapsed(true)}
                />
            )}
            {/* Sidebar */}
            <aside className={`sidebar ${isSidebarCollapsed ? 'hidden lg:hidden' : 'mobile-open lg:flex'} w-72 h-screen sticky top-0 border-r border-glass-border bg-surface flex flex-col p-4 ${isSidebarCollapsed ? 'collapsed' : ''}`}>
                <div className="mb-10 mt-2 px-2 flex items-center justify-between shrink-0">
                    {!isSidebarCollapsed ? (
                        <div className="flex items-center gap-3 animate-fade-in whitespace-nowrap overflow-hidden">
                            <img
                                src={theme === 'dark' ? "/logoDark.png?v=2" : "/logoLite.png?v=2"}
                                alt="Certif-fun Logo"
                                style={{ height: '57px', width: 'auto' }}
                                className="object-contain"
                            />
                        </div>
                    ) : (
                        <div className="flex justify-center w-full">
                            <img
                                src={theme === 'dark' ? "/logoDark.png?v=2" : "/logoLite.png?v=2"}
                                alt="Logo"
                                style={{ height: '40px', width: '40px' }}
                                className="object-contain"
                            />
                        </div>
                    )}
                    {!isSidebarCollapsed && (
                        <button
                            onClick={() => setIsSidebarCollapsed(true)}
                            className="p-1 rounded-lg text-text-muted hover:bg-surface-hover hover:text-text transition-all icon-container"
                            title="Masquer la barre latérale"
                        >
                            <ChevronLeft size={22} />
                        </button>
                    )}
                </div>

                <nav className="flex-1 flex flex-col gap-2 overflow-y-auto pr-2 custom-scrollbar">
                    <div className="mt-4 mb-2 px-3 text-xs font-bold text-text-muted uppercase tracking-widest">Gestion</div>
                    <SidebarItem to="/" icon={<LayoutDashboard size={20} />} label="Dashboard" onClick={() => window.innerWidth < 1024 && setIsSidebarCollapsed(true)} />
                    <SidebarItem to="/trainers" icon={<Users size={20} />} label="Formateurs" onClick={() => window.innerWidth < 1024 && setIsSidebarCollapsed(true)} />
                    <SidebarItem to="/learners" icon={<GraduationCap size={20} />} label="Apprenants" onClick={() => window.innerWidth < 1024 && setIsSidebarCollapsed(true)} />
                    <SidebarItem to="/cycles" icon={<RefreshCw size={20} />} label="Cycles" onClick={() => window.innerWidth < 1024 && setIsSidebarCollapsed(true)} />
                    <SidebarItem to="/formations" icon={<BookOpen size={20} />} label="Formations" onClick={() => window.innerWidth < 1024 && setIsSidebarCollapsed(true)} />
                    <SidebarItem to="/specialities" icon={<Layers size={20} />} label="Spécialités" onClick={() => window.innerWidth < 1024 && setIsSidebarCollapsed(true)} />
                    <SidebarItem to="/certificates" icon={<Award size={20} />} label="Certificats" onClick={() => window.innerWidth < 1024 && setIsSidebarCollapsed(true)} />
                    <SidebarItem to="/admin-bundles" icon={<Briefcase size={20} className="text-secondary" />} label="Gestion des Parcours" onClick={() => window.innerWidth < 1024 && setIsSidebarCollapsed(true)} />
                    <SidebarItem to="/bundle-enrollments" icon={<PackageCheck size={20} />} label="Inscriptions Parcours" onClick={() => window.innerWidth < 1024 && setIsSidebarCollapsed(true)} />

                    <div className="mt-6 mb-2 px-3 text-xs font-bold text-text-muted uppercase tracking-widest">Analyses</div>
                    <SidebarItem to="/trainers-stats" icon={<Users size={20} />} label="Stats Formateurs" onClick={() => window.innerWidth < 1024 && setIsSidebarCollapsed(true)} />
                    <SidebarItem to="/learners-stats" icon={<GraduationCap size={20} />} label="Stats Apprenants" onClick={() => window.innerWidth < 1024 && setIsSidebarCollapsed(true)} />
                    <SidebarItem to="/certifications-stats" icon={<Award size={20} />} label="Stats Certifs" onClick={() => window.innerWidth < 1024 && setIsSidebarCollapsed(true)} />
                    <SidebarItem to="/bundles-stats" icon={<TrendingUp size={20} className="text-secondary" />} label="Stats Parcours" onClick={() => window.innerWidth < 1024 && setIsSidebarCollapsed(true)} />
                    <SidebarItem to="/analytics" icon={<TrendingUp size={20} />} label="Analytics" onClick={() => window.innerWidth < 1024 && setIsSidebarCollapsed(true)} />

                    <SidebarItem to="/settings" icon={<Settings size={20} />} label="Paramètres" onClick={() => window.innerWidth < 1024 && setIsSidebarCollapsed(true)} />

                    {/* Spacer to push logout to bottom if space permits */}
                    <div className="flex-1" />

                    <div className="pt-4 mt-4 border-t border-glass-border">
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 p-3 rounded-xl text-text-muted hover:bg-error hover:text-white transition-all icon-container justify-start"
                        >
                            <LogOut size={20} />
                            <span className="font-semibold">Déconnexion</span>
                        </button>
                    </div>
                </nav>
            </aside>

            {/* Main Content */}
            <div className="main-wrapper">
                <header className="h-16 border-b border-glass-border flex items-center justify-between px-4 sm:px-8 bg-surface transition-colors z-10">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                            className={`p-2 rounded-lg text-text-muted hover:bg-surface-hover hover:text-text icon-container transition-all ${!isSidebarCollapsed ? 'lg:hidden' : ''}`}
                            style={{ marginLeft: 10 }}
                            title={isSidebarCollapsed ? "Afficher la barre latérale" : "Masquer la barre latérale"}
                        >
                            <Menu size={22} />
                        </button>
                        <div className="flex items-center gap-3">
                            <img
                                src={theme === 'dark' ? "/logoDark.png?v=2" : "/logoLite.png?v=2"}
                                alt="Certif-fun"
                                style={{ height: '57px', width: 'auto' }}
                                className="object-contain lg:hidden"
                            />
                            <h2 className="font-bold text-lg hidden sm:block">Certif-fun Admin</h2>
                        </div>
                    </div>

                    <div className="flex items-center gap-[10px] sm:gap-4">
                        {/* Theme Toggle */}
                        <button
                            onClick={toggleTheme}
                            className="w-10 h-10 rounded-xl bg-background border border-glass-border flex items-center justify-center text-primary hover:text-white transition-all icon-container"
                            title={theme === 'dark' ? "Passer au mode clair" : "Passer au mode sombre"}
                        >
                            {theme === 'dark' ? <Sun size={20} strokeWidth={2.5} /> : <Moon size={20} strokeWidth={2.5} />}
                        </button>

                        {/* Notifications */}
                        <button className="relative w-10 h-10 rounded-xl bg-background border border-glass-border flex items-center justify-center text-text-muted hover:text-primary transition-all icon-container" style={{ marginLeft: 10 }}>
                            <Bell size={20} strokeWidth={2.5} />
                            <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-secondary rounded-full border-2 border-surface"></span>
                        </button>

                        <div className="h-8 w-px bg-glass-border sm:mx-2"></div>

                        {/* User Profile */}
                        <div className="flex items-center gap-2 sm:gap-3">
                            <div className="hidden sm:flex text-right flex flex-col items-end">
                                <p className="text-sm font-bold text-text">
                                    {userInfo.nom} {userInfo.prenom}
                                </p>
                                <p className="text-xs text-text-muted font-medium">En ligne</p>
                            </div>
                            <div className="w-10 h-10 rounded-xl overflow-hidden border border-glass-border shadow-lg shadow-indigo-500/20 bg-primary flex items-center justify-center text-white font-bold" style={{ marginLeft: 10, marginRight: 10 }}>
                                {!imgError && userInfo.photoProfile && userInfo.photoProfile !== 'default.png' ? (
                                    <img
                                        src={avatarUrl}
                                        alt="Admin"
                                        className="w-full h-full object-cover"
                                        onError={() => setImgError(true)}
                                    />
                                ) : (
                                    <span>{userInfo.prenom?.[0] || 'A'}{userInfo.nom?.[0] || 'D'}</span>
                                )}
                            </div>
                        </div>
                    </div>

                </header>

                <div className="scroll-container p-4 sm:p-8">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Layout;
