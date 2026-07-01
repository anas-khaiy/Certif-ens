import React, { useState, useEffect, useCallback } from 'react';
import api from '../../api/api-client';
import { NavLink, useNavigate } from 'react-router-dom';
import { API_COORDINATEUR } from '../../config';
import {
    LayoutDashboard,
    LogOut,
    Menu,
    ChevronLeft,
    Sun,
    Moon,
    Settings,
    Users,
    Calendar,
    FileText,
    ListChecks,
    Shuffle,
    ToggleLeft
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
        localStorage.removeItem('isCoordinateur');
        navigate('/login');
    };

    const [userInfo, setUserInfo] = useState({
        nom: localStorage.getItem('coordinateurNom') || 'Coordinateur',
        prenom: localStorage.getItem('coordinateurPrenom') || '',
        photoProfile: 'default.png'
    });
    
    const [imgError, setImgError] = useState(false);

    const fetchUserInfo = useCallback(async () => {
        try {
            const response = await api.get('/auth/me');
            setUserInfo(response.data);
            localStorage.setItem('coordinateurNom', response.data.nom);
            localStorage.setItem('coordinateurPrenom', response.data.prenom);
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

    const avatarUrl = `${API_COORDINATEUR}/files/profiles/${userInfo.photoProfile || 'default.png'}`;

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
                    <div className="mt-4 mb-2 px-3 text-xs font-bold text-text-muted uppercase tracking-widest">Coordinateur</div>
                    <SidebarItem to="/" icon={<LayoutDashboard size={20} />} label="Dashboard" onClick={() => window.innerWidth < 1024 && setIsSidebarCollapsed(true)} />
                    <SidebarItem to="/mes-affectations" icon={<ListChecks size={20} />} label="Mes Affectations" onClick={() => window.innerWidth < 1024 && setIsSidebarCollapsed(true)} />
                    <SidebarItem to="/config-sujets" icon={<Settings size={20} />} label="Config. Sujets" onClick={() => window.innerWidth < 1024 && setIsSidebarCollapsed(true)} />
                    <SidebarItem to="/config-selection-sujets" icon={<ToggleLeft size={20} />} label="Config. Sélection" onClick={() => window.innerWidth < 1024 && setIsSidebarCollapsed(true)} />
                    <SidebarItem to="/deadlines" icon={<Calendar size={20} />} label="Dates Limites" onClick={() => window.innerWidth < 1024 && setIsSidebarCollapsed(true)} />
                    <SidebarItem to="/depots" icon={<FileText size={20} />} label="Dépôts PFE" onClick={() => window.innerWidth < 1024 && setIsSidebarCollapsed(true)} />
                    <SidebarItem to="/jury" icon={<Users size={20} />} label="Jury & Soutenances" onClick={() => window.innerWidth < 1024 && setIsSidebarCollapsed(true)} />
                    <SidebarItem to="/tirage" icon={<Shuffle size={20} />} label="Tirage Aléatoire" onClick={() => window.innerWidth < 1024 && setIsSidebarCollapsed(true)} />
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
                                className="object-contain block lg:hidden"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-4">
                        <button
                            onClick={toggleTheme}
                            className="p-2 sm:p-2.5 rounded-xl text-text-muted hover:bg-surface-hover hover:text-text icon-container transition-all"
                            title={theme === 'dark' ? "Passer au thème clair" : "Passer au thème sombre"}
                        >
                            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                        </button>

                        <div className="h-8 w-px bg-glass-border mx-1 sm:mx-2"></div>

                        <div className="flex items-center gap-3 pl-1 sm:pl-2">
                            <div className="hidden sm:block text-right">
                                <p className="text-sm font-semibold text-text">{userInfo.prenom} {userInfo.nom}</p>
                                <p className="text-xs text-text-muted">Coordinateur</p>
                            </div>
                            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-primary to-secondary p-0.5 shadow-lg shadow-primary/20 cursor-pointer hover:scale-105 transition-transform" onClick={() => navigate('/settings')}>
                                <div className="w-full h-full rounded-full border-2 border-surface overflow-hidden bg-primary flex items-center justify-center font-bold text-white text-lg">
                                    {!imgError && userInfo.photoProfile && userInfo.photoProfile !== 'default.png' ? (
                                        <img
                                            src={avatarUrl}
                                            alt="Profile"
                                            className="w-full h-full object-cover"
                                            onError={() => setImgError(true)}
                                        />
                                    ) : (
                                        <span>{userInfo.prenom?.[0] || 'C'}{userInfo.nom?.[0] || 'C'}</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </header>
                <main className="main-content">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default Layout;
