import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Users,
    GraduationCap,
    Award,
    TrendingUp,
    Loader2
} from 'lucide-react';
import {
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area,
    BarChart,
    Bar,
    Cell
} from 'recharts';
import { motion } from 'framer-motion';
import api from '../api/api-client';

const COLORS = ['#6366f1', '#ec4899', '#8b5cf6', '#10b981', '#f59e0b', '#3b82f6'];

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
    totalCourses: number;
    totalLearners: number;
    totalQuizzesCompleted: number;
    totalCertifications: number;
    averageScore: number;
    monthlyCertifications: Array<{ month: string; certs: number; learners: number }>;
    courseStudentsDistribution: Array<{ name: string; value: number }>;
}

const DashboardPage = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

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
        <div className="space-y-8">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-bold text-text">Tableau de bord</h2>
                    <p className="text-text-muted font-medium">Bon retour ! Voici un aperçu de votre activité.</p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-4">
                <StatCard
                    title="Mes Cours"
                    value={stats?.totalCourses || 0}
                    icon={<Users size={24} />}
                    onClick={() => navigate('/statistics-cours')}
                />
                <StatCard
                    title="Apprenants Inscrits"
                    value={stats?.totalLearners || 0}
                    icon={<GraduationCap size={24} />}
                    onClick={() => navigate('/statistics-apprenants')}
                />
                <StatCard
                    title="Certifications Obtenues"
                    value={stats?.totalCertifications || 0}
                    icon={<Award size={24} />}
                    onClick={() => navigate('/statistics-quiz')}
                />
                <StatCard
                    title="Score Moyen (%)"
                    value={`${stats?.averageScore || 0}%`}
                    icon={<TrendingUp size={24} />}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="glass p-8 relative overflow-hidden group">
                    <h4 className="text-lg font-bold mb-8 flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <TrendingUp className="text-primary" size={20} />
                        </div>
                        Activité Inscriptions & Certifications
                    </h4>
                    <div className="h-[320px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={stats?.monthlyCertifications || []}>
                                <defs>
                                    <linearGradient id="colorCerts" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorLearners" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ec4899" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} opacity={0.3} />
                                <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tick={{ dy: 10 }} />
                                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.3)' }}
                                    itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                                />
                                <Area name="Certifications" type="monotone" dataKey="certs" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#colorCerts)" />
                                <Area name="Apprenants" type="monotone" dataKey="learners" stroke="#ec4899" strokeWidth={4} fillOpacity={1} fill="url(#colorLearners)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="glass p-8 flex flex-col h-full">
                    <h4 className="text-lg font-bold mb-8 flex items-center gap-3">
                        <div className="p-2 bg-pink-500/10 rounded-lg">
                            <Users size={20} className="text-pink-500" />
                        </div>
                        Répartition par Cours
                    </h4>
                    <div className="flex-1 min-h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats?.courseStudentsDistribution || []} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                <XAxis 
                                    dataKey="name" 
                                    stroke="#94a3b8" 
                                    fontSize={11} 
                                    tickLine={false} 
                                    axisLine={false} 
                                    tickFormatter={(val) => val.length > 15 ? val.substring(0, 15) + '...' : val} 
                                />
                                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                                <Tooltip
                                    cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px' }}
                                    itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                                />
                                <Bar dataKey="value" name="Apprenants" radius={[6, 6, 0, 0]} maxBarSize={50}>
                                    {(stats?.courseStudentsDistribution || []).map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};


export default DashboardPage;
