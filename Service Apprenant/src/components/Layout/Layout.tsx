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
    Code,
    Video,
    ClipboardList
} from 'lucide-react';
import ReminderOverlay from '../Notifications/ReminderOverlay';
import { useReminders } from '../../hooks/useReminders';
import { API_FORMATEUR, API_APPRENANT, API_ADMIN, WS_APPRENANT, WS_LIVEKIT, AI_DETECT_URL, VERIFY_URL_APPRENANT, VERIFY_URL_FORMATEUR } from '../../config';

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
    const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1024);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);
    const [theme, setTheme] = useState<'dark' | 'light'>(() => {
        return (localStorage.getItem('theme') as 'dark' | 'light') || 'dark';
    });
    const { reminders } = useReminders();

    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth <= 1024;
            setIsMobile(mobile);
            if (!mobile) {
                setIsSidebarOpen(true);
            } else {
                setIsSidebarOpen(false);
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
        if (isMobile) {
            setIsSidebarOpen(false);
        }
    };

    return (
        <div className="flex h-[100dvh] bg-background text-text overflow-hidden transition-colors">
            {/* Backdrop for mobile */}
            {isMobile && isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[40] animate-fade-in"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`sidebar w-72 border-r border-glass-border bg-surface flex flex-col p-4 z-[50] ${!isSidebarOpen ? 'collapsed' : ''} ${isMobile ? 'mobile-sidebar' : ''}`}>
                <div className="mb-10 mt-2 px-2 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3 animate-fade-in">
                        <img
                            src={theme === 'dark' ? "/logoDark.png" : "/logoLite.png"}
                            alt="CertiFlow Logo"
                            style={{ height: '57px', width: 'auto' }}
                            className="object-contain"
                        />
                    </div>
                    {!isMobile && (
                        <button
                            onClick={() => setIsSidebarOpen(false)}
                            className="p-1.5 rounded-lg text-text-muted hover:bg-surface-hover hover:text-text transition-all icon-container flex-shrink-0"
                            title="Masquer la barre latérale"
                        >
                            <ChevronLeft size={22} />
                        </button>
                    )}
                    {isMobile && (
                        <button
                            onClick={() => setIsSidebarOpen(false)}
                            className="p-1.5 rounded-lg text-text-muted hover:bg-surface-hover hover:text-text transition-all icon-container flex-shrink-0"
                        >
                            <ChevronLeft size={22} />
                        </button>
                    )}
                </div>

                <nav className="flex-1 flex flex-col gap-2 overflow-y-auto pr-2 custom-scrollbar">
                    <SidebarItem to="/" icon={<LayoutDashboard size={20} />} label="Tableau de bord" onClick={closeSidebarOnMobile} />
                    <SidebarItem to="/courses" icon={<BookOpen size={20} />} label="Catalogue des Cours" onClick={closeSidebarOnMobile} />
                    <SidebarItem to="/enrolled-courses" icon={<BookOpen size={20} className="text-primary" />} label="Mes Cours Inscrits" onClick={closeSidebarOnMobile} />
                    <SidebarItem to="/completed-courses" icon={<BookOpen size={20} className="text-success" />} label="Cours Terminés" onClick={closeSidebarOnMobile} />
                    <SidebarItem to="/live-class" icon={<Video size={20} className="text-danger" />} label="Rejoindre le Direct" onClick={closeSidebarOnMobile} />

                    
                    {(() => {
                        const user = JSON.parse(localStorage.getItem('user') || '{}');
                        const isInfoSpeciality = user.specialite?.toLowerCase().includes('informatique');
                        return isInfoSpeciality && (
                            <SidebarItem 
                                to="/code-editor" 
                                icon={<Code size={20} className="text-accent" />} 
                                label="Éditeur de Code" 
                                onClick={closeSidebarOnMobile} 
                            />
                        );
                    })()}

                    <SidebarItem to="/settings" icon={<Settings size={20} />} label="Paramètres" onClick={closeSidebarOnMobile} />
                    <SidebarItem to="/encadrement" icon={<ClipboardList size={20} />} label="Mon Encadrement" onClick={closeSidebarOnMobile} />

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
                        {!isSidebarOpen && (
                            <button
                                onClick={() => setIsSidebarOpen(true)}
                                className="p-2 rounded-lg text-text-muted hover:bg-surface-hover hover:text-text icon-container transition-all"
                                title="Afficher la barre latérale"
                            >
                                <Menu size={22} />
                            </button>
                        )}
                        {!isSidebarOpen && (
                            <img
                                src={theme === 'dark' ? "/logoDark.png" : "/logoLite.png"}
                                alt="CertiFlow"
                                style={{ height: '57px', width: 'auto' }}
                                className="object-contain sm:hidden"
                            />
                        )}
                        <h2 className="font-bold text-lg hidden sm:block">CertiFlow Apprenant</h2>
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
                        <button 
                            onClick={() => navigate('/notifications')}
                            className="relative w-10 h-10 rounded-xl bg-background border border-glass-border flex items-center justify-center text-text-muted hover:text-primary transition-all icon-container"
                        >
                            <Bell size={20} strokeWidth={2.5} />
                            {reminders.length > 0 && (
                                <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 bg-red-500 text-white text-[10px] font-black rounded-full border-2 border-surface flex items-center justify-center animate-pulse shadow-lg shadow-red-500/40">
                                    {reminders.length}
                                </span>
                            )}
                        </button>

                        {/* User Profile */}
                        <div className="flex items-center gap-[10px]">
                            <div className="hidden sm:flex flex-col items-end">
                                <p className="text-sm font-bold text-text">
                                    {JSON.parse(localStorage.getItem('user') || '{}').prenom || 'Apprenant'}
                                </p>
                                <p className="text-xs text-text-muted font-medium">En ligne</p>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center font-extrabold text-white shadow-lg shadow-indigo-500/30 overflow-hidden">
                                {JSON.parse(localStorage.getItem('user') || '{}').photoProfile && JSON.parse(localStorage.getItem('user') || '{}').photoProfile !== 'default.png' ? (
                                    <img
                                        src={`${API_APPRENANT}/files/profiles/${JSON.parse(localStorage.getItem('user') || '{}').photoProfile}`}
                                        alt="Profile"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    (JSON.parse(localStorage.getItem('user') || '{}').prenom?.[0] || 'A') + (JSON.parse(localStorage.getItem('user') || '{}').nom?.[0] || 'P')
                                )}
                            </div>
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-4 sm:p-8">
                    {children}
                </div>
                <ReminderOverlay />
            </main>
        </div>
    );
};

export default Layout;
