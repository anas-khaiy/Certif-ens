import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Users,
    GraduationCap,
    Award,
    TrendingUp,
    Loader2,
    Target,
    UserCheck,
    ShieldCheck,
    BookOpenCheck
} from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../api/api-client';

const StatCard = ({ title, value, icon, onClick }: any) => (
    <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        onClick={onClick}
        className={`glass p-6 flex flex-col gap-4 hover:border-primary/50 transition-colors ${onClick ? 'cursor-pointer hover:scale-[1.02]' : ''}`}
    >
        <div className="flex justify-between items-start">
            <div className="p-3 rounded-xl bg-surface-hover text-primary">
                {icon}
            </div>
        </div>
        <div>
            <p className="text-text-muted text-sm">{title}</p>
            <h3 className="text-3xl font-bold mt-1">{value}</h3>
        </div>
    </motion.div>
);

interface DashboardStats {
    totalFormateurs: number;
    totalApprenants: number;
    nombreExaminateur: number;
    nombreRapporteur: number;
    nombreEncadrant: number;
    nombreSujets: number;
    nombreApprenantsAffectes: number;
}

const DashboardPage = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const userInfo = JSON.parse(localStorage.getItem('user') || '{}');

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await api.get('/dashboard/stats');
                setStats(response.data);
            } catch (error) {
                console.error('Error fetching dashboard stats:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
                <p className="text-text-muted font-bold animate-pulse">Chargement de vos statistiques...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in pb-24 lg:pb-8">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-bold text-text">Bonjour, {userInfo.prenom || 'Coordinateur'} 👋</h2>
                    <p className="text-text-muted font-medium">Voici un aperçu de vos activités de coordination.</p>
                </div>
            </div>

            {/* Stats Grid - Row 1 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-2">
                <StatCard
                    title="Total Formateurs"
                    value={stats?.totalFormateurs || 0}
                    icon={<Users size={24} />}
                />
                <StatCard
                    title="Total Apprenants"
                    value={stats?.totalApprenants || 0}
                    icon={<GraduationCap size={24} />}
                />
                <StatCard
                    title="Nombre Sujets"
                    value={stats?.nombreSujets || 0}
                    icon={<Target size={24} />}
                    onClick={() => navigate('/sujets')}
                />
                <StatCard
                    title="Nombre Encadrants"
                    value={stats?.nombreEncadrant || 0}
                    icon={<UserCheck size={24} />}
                    onClick={() => navigate('/affectations')}
                />
            </div>

            {/* Stats Grid - Row 2 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
                <StatCard
                    title="Nombre Examinateurs"
                    value={stats?.nombreExaminateur || 0}
                    icon={<ShieldCheck size={24} />}
                    onClick={() => navigate('/jury')}
                />
                <StatCard
                    title="Nombre Rapporteurs"
                    value={stats?.nombreRapporteur || 0}
                    icon={<Award size={24} />}
                    onClick={() => navigate('/jury')}
                />
                <StatCard
                    title="Apprenants Affectés"
                    value={stats?.nombreApprenantsAffectes || 0}
                    icon={<BookOpenCheck size={24} />}
                />
            </div>

            {/* Summary Card */}
            <div className="glass p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-primary/5 to-transparent rounded-full -translate-y-1/2 translate-x-1/2"></div>
                <h4 className="text-lg font-bold mb-6 flex items-center gap-3 relative z-10">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <TrendingUp className="text-primary" size={20} />
                    </div>
                    Résumé des Affectations
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                    <div className="flex flex-col items-center p-6 bg-surface-hover/30 rounded-2xl border border-glass-border">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mb-3">
                            <GraduationCap size={28} className="text-primary" />
                        </div>
                        <p className="text-3xl font-bold text-text">{stats?.totalApprenants || 0}</p>
                        <p className="text-sm text-text-muted font-medium mt-1">Total Apprenants</p>
                    </div>
                    <div className="flex flex-col items-center p-6 bg-surface-hover/30 rounded-2xl border border-glass-border">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center mb-3">
                            <BookOpenCheck size={28} className="text-green-500" />
                        </div>
                        <p className="text-3xl font-bold text-text">{stats?.nombreApprenantsAffectes || 0}</p>
                        <p className="text-sm text-text-muted font-medium mt-1">Apprenants Affectés</p>
                        <p className="text-xs text-text-muted mt-0.5">(Sujet + Encadrant)</p>
                    </div>
                    <div className="flex flex-col items-center p-6 bg-surface-hover/30 rounded-2xl border border-glass-border">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center mb-3">
                            <TrendingUp size={28} className="text-amber-500" />
                        </div>
                        <p className="text-3xl font-bold text-text">
                            {stats?.totalApprenants ? Math.round((stats.nombreApprenantsAffectes / stats.totalApprenants) * 100) : 0}%
                        </p>
                        <p className="text-sm text-text-muted font-medium mt-1">Taux d'Affectation</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;
