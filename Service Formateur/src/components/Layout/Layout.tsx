import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Settings,
    LogOut,
    Bell,
    Menu,
    ChevronLeft,
    Sun,
    Moon,
    BookOpen,
    Users
} from 'lucide-react';
import logoDark from '../../assets/logoDark.png';
import logoLite from '../../assets/logoLite.png';

interface SidebarItemProps {
    to: string;
    icon: React.ReactNode;
    label: string;
}

const SidebarItem = ({ to, icon, label, onClick }: SidebarItemProps & { onClick?: () => void }) => (
    <NavLink
        to={to}
        onClick={onClick}
        className={({ isActive }) =>
            `flex items-center gap-3 p-3 rounded-xl transition-all min-w-0 ${isActive
                ? 'bg-primary text-white shadow-lg shadow-indigo-500/20'
                : 'text-text-muted hover:bg-surface-hover hover:text-text'
            }`
        }
    >
        <div className="icon-container flex-shrink-0">{icon}</div>
        <span className="font-semibold truncate flex-1">{label}</span>
    </NavLink>
);

const Layout = ({ children }: { children: React.ReactNode }) => {
    const navigate = useNavigate();
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(window.innerWidth < 1024);
    const [theme, setTheme] = useState<'dark' | 'light'>(() => {
        return (localStorage.getItem('theme') as 'dark' | 'light') || 'dark';
    });

    // Load user info from localStorage
    const loadUser = () => {
        try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; }
    };

    const [user, setUser] = useState(loadUser());

    useEffect(() => {
        const handleStorageChange = () => {
            setUser(loadUser());
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    const fullName = `${user.prenom || ''} ${user.nom || ''}`.trim() || 'Formateur';
    const initials = `${(user.prenom || '?')[0]}${(user.nom || '?')[0]}`.toUpperCase();

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
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    const closeSidebarOnMobile = () => {
        if (window.innerWidth < 1024) {
            setIsSidebarCollapsed(true);
        }
    };

    return (
        <div className="flex h-screen bg-background text-text overflow-hidden transition-colors relative">
            {/* Mobile Sidebar Backdrop */}
            {!isSidebarCollapsed && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[40] lg:hidden"
                    onClick={() => setIsSidebarCollapsed(true)}
                />
            )}

            {/* Sidebar */}
            <aside className={`sidebar w-72 border-r border-glass-border bg-surface flex flex-col p-4 z-[50] ${isSidebarCollapsed ? 'collapsed' : ''} fixed lg:relative h-full`}>
                <div className="mb-10 mt-2 px-2 flex items-center justify-between shrink-0">
                    {!isSidebarCollapsed ? (
                        <div className="flex items-center gap-3 animate-fade-in whitespace-nowrap overflow-hidden">
                            <img
                                src={theme === 'dark' ? logoDark : logoLite}
                                alt="CertiFlow Logo"
                                style={{ height: '57px', width: 'auto' }}
                                className="object-contain"
                            />
                        </div>
                    ) : (
                        <div className="flex justify-center w-full">
                            <img
                                src={theme === 'dark' ? logoDark : logoLite}
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
                    <SidebarItem to="/" icon={<LayoutDashboard size={20} />} label="Tableau de bord" onClick={closeSidebarOnMobile} />
                    <SidebarItem to="/courses" icon={<BookOpen size={20} />} label="Mes Cours" onClick={closeSidebarOnMobile} />
                    <SidebarItem to="/enrollments" icon={<Users size={20} />} label="Inscriptions" onClick={closeSidebarOnMobile} />
                    <SidebarItem to="/settings" icon={<Settings size={20} />} label="Paramètres" onClick={closeSidebarOnMobile} />

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
            <main className="flex-1 flex flex-col overflow-hidden relative">
                <header className="h-16 border-b border-glass-border flex items-center justify-between px-4 sm:px-8 bg-surface transition-colors z-10">
                    <div className="flex items-center gap-[10px] sm:gap-4">
                        {isSidebarCollapsed && (
                            <button
                                onClick={() => setIsSidebarCollapsed(false)}
                                className="p-2 rounded-lg text-text-muted hover:bg-surface-hover hover:text-text icon-container transition-all"
                                title="Afficher la barre latérale"
                            >
                                <Menu size={22} />
                            </button>
                        )}
                        {isSidebarCollapsed && (
                            <img
                                src={theme === 'dark' ? logoDark : logoLite}
                                alt="CertiFlow"
                                style={{ height: '57px', width: 'auto' }}
                                className="object-contain sm:hidden"
                            />
                        )}
                        <h2 className="font-bold text-lg hidden lg:block text-text/80 tracking-tight">CertiFlow Formateur</h2>
                    </div>

                    <div className="flex items-center gap-[10px]">
                        {/* Theme Toggle */}
                        <button
                            onClick={toggleTheme}
                            className="w-10 h-10 rounded-xl bg-background border border-glass-border flex items-center justify-center text-primary hover:text-white transition-all icon-container"
                            title={theme === 'dark' ? "Passer au mode clair" : "Passer au mode sombre"}
                        >
                            {theme === 'dark' ? <Sun size={20} strokeWidth={2.5} /> : <Moon size={20} strokeWidth={2.5} />}
                        </button>

                        {/* Notifications */}
                        <button className="relative w-10 h-10 rounded-xl bg-background border border-glass-border flex items-center justify-center text-text-muted hover:text-primary transition-all icon-container">
                            <Bell size={20} strokeWidth={2.5} />
                            <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-secondary rounded-full border-2 border-surface"></span>
                        </button>

                        {/* User Profile */}
                        <div className="flex items-center gap-3 pl-2 border-l border-glass-border">
                            <div className="hidden sm:flex flex-col items-end leading-tight">
                                <span className="text-xs font-black text-text capitalize">{fullName}</span>
                                <span className="text-[10px] text-text-muted font-bold">En ligne</span>
                            </div>
                            {user.photoProfile && user.photoProfile !== 'default.png' ? (
                                <img
                                    src={user.photoProfile.startsWith('http') ? user.photoProfile : `http://localhost:8081/api/v1/files/profiles/${user.photoProfile}`}
                                    alt="Profile"
                                    className="w-10 h-10 rounded-xl object-cover shadow-lg shadow-primary/20"
                                />
                            ) : (
                                <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center font-black text-white shadow-lg shadow-primary/20">
                                    {initials}
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 pb-32 bg-background">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default Layout;
