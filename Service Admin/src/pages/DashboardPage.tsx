import { useEffect, useState } from 'react';

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
    PieChart,
    Pie,
    Cell
} from 'recharts';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import api from '../api/api-client';

const COLORS = ['#6366f1', '#ec4899', '#8b5cf6', '#10b981'];

const StatCard = ({ title, value, icon, onClick }: any) => (
    <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
        className={`glass p-6 flex flex-col gap-4 hover:border-primary/50 transition-all cursor-pointer`}
        onClick={onClick}
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


const DashboardPage = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await api.get('/stats/dashboard');
                setStats(response.data);
            } catch (error) {
                console.error('Error fetching stats:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (isLoading) {
        return (
            <div className="h-[60vh] flex items-center justify-center">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-bold">Tableau de bord</h2>
                    <p className="text-text-muted">Bienvenue, voici un aperçu de vos activités.</p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-4">
                <StatCard
                    title="Enseignants"
                    value={stats?.enseignantsCount || 0}
                    icon={<Users size={24} />}
                    onClick={() => navigate('/trainers-stats')}
                />
                <StatCard
                    title="Apprenants"
                    value={stats?.apprenantsCount || 0}
                    icon={<GraduationCap size={24} />}
                    onClick={() => navigate('/learners-stats')}
                />
                <StatCard
                    title="Certifications"
                    value={stats?.certificationsCount || 0}
                    icon={<Award size={24} />}
                    onClick={() => navigate('/certifications-stats')}
                />
                <StatCard
                    title="Taux de réussite"
                    value={`${stats?.successRate || 0}%`}
                    icon={<TrendingUp size={24} />}
                    onClick={() => navigate('/analytics')}
                />
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="glass p-6">
                    <h4 className="text-lg font-semibold mb-6">Certifications par mois</h4>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={stats?.monthlyCertifications || []}>
                                <defs>
                                    <linearGradient id="colorCerts" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Area type="monotone" dataKey="certs" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorCerts)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="glass p-6">
                    <h4 className="text-lg font-semibold mb-6">Répartition par Spécialité</h4>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={stats?.specialtyDistribution || []}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {(stats?.specialtyDistribution || []).map((_: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="flex justify-center gap-4 mt-4">
                        {(stats?.specialtyDistribution || []).map((item: any, idx: number) => (
                            <div key={item.name} className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                                <span className="text-xs text-text-muted">{item.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;
