import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api-client';
import {
    BookOpen,
    CheckCircle,
    Award,
    TrendingUp,
    ArrowUpRight,
    ArrowDownRight,
    PlayCircle
} from 'lucide-react';
import {
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    Cell
} from 'recharts';
import { motion } from 'framer-motion';

const StatCard = ({ title, value, icon, trend, isPositive, onClick }: any) => (
    <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        onClick={onClick}
        className={`glass p-6 flex flex-col gap-4 hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/20 transition-all ${onClick ? 'cursor-pointer hover:scale-[1.02]' : ''}`}
    >
        <div className="flex justify-between items-start">
            <div className="p-3 rounded-xl bg-surface-hover text-primary">
                {icon}
            </div>
            {trend && (
                <div className={`flex items-center gap-1 text-sm ${isPositive ? 'text-success' : 'text-error'}`}>
                    {trend}
                    {isPositive ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                </div>
            )}
        </div>
        <div>
            <p className="text-text-muted text-sm">{title}</p>
            <h3 className="text-3xl font-bold mt-1 text-text">{value}</h3>
        </div>
    </motion.div>
);

const DashboardPage = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [userName, setUserName] = useState('Apprenant');
    const [hoverData, setHoverData] = useState<any>(null);

    useEffect(() => {
        // Try to get user name from localStorage
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const name = user.nom || user.firstName || localStorage.getItem('nom') || 'Apprenant';
        setUserName(name);

        const fetchDashboardData = async () => {
            try {
                const response = await api.get('/dashboard/stats');
                setStats(response.data);
            } catch (err) {
                console.error("Error fetching dashboard data:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                <p className="text-text-muted font-bold animate-pulse text-lg tracking-widest uppercase">Chargement de votre réussite...</p>
            </div>
        );
    }

    return (
        <div className="space-y-10 animate-fade-in pb-12">
            {/* Header with Welcome Message */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h2 className="text-4xl font-black text-text tracking-tight">Bonjour, <span className="text-primary">{userName}</span> ! 👋</h2>
                    <p className="text-text-muted mt-2 font-medium">Bon retour sur votre espace d'apprentissage.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => navigate('/enrolled-courses')}
                        className="glass hover:bg-surface-hover text-text px-5 py-2.5 rounded-2xl flex items-center gap-2 transition-all font-bold"
                    >
                        <BookOpen size={18} />
                        Mes Cours
                    </button>
                    <button
                        onClick={() => navigate('/completed-courses')}
                        className="bg-primary hover:bg-primary-hover text-white px-6 py-2.5 rounded-2xl flex items-center gap-2 transition-all shadow-lg shadow-primary/25 font-bold"
                    >
                        <Award size={18} />
                        Certificats
                    </button>
                </div>
            </div>

            {/* Main Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Cours Inscrits"
                    value={stats?.enrolledCoursesCount || 0}
                    icon={<BookOpen size={24} />}
                    onClick={() => navigate('/enrolled-courses')}
                />
                <StatCard
                    title="Cours Terminés"
                    value={stats?.completedCoursesCount || 0}
                    icon={<CheckCircle size={24} />}
                    onClick={() => navigate('/completed-courses')}
                />
                <StatCard
                    title="Cours en cours"
                    value={stats?.inProgressCoursesCount || 0}
                    icon={<PlayCircle size={24} />}
                    onClick={() => navigate('/enrolled-courses')}
                />
                <StatCard
                    title="Score Moyen"
                    value={`${stats?.averageScore || 0}%`}
                    icon={<TrendingUp size={24} />}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Continue Learning Section */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-black flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                <TrendingUp size={22} />
                            </div>
                            Continuer l'apprentissage
                        </h3>
                        <button 
                            onClick={() => navigate('/enrolled-courses')}
                            className="text-primary font-bold text-sm hover:underline"
                        >
                            Voir tout
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {(stats?.activeCourses || []).map((course: any) => (
                            <motion.div
                                key={course.id}
                                whileHover={{ y: -5 }}
                                onClick={() => navigate(`/courses/${course.id}/preview`)}
                                className="glass p-5 flex flex-col gap-5 border border-glass-border hover:border-primary/30 transition-all cursor-pointer group"
                            >
                                <div className="flex gap-4">
                                    <div className="w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0 shadow-lg border border-glass-border/50 bg-surface-hover">
                                        {course.coverImage ? (
                                            <img src={course.coverImage} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={course.title} />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-primary/30">
                                                <BookOpen size={30} />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex flex-col justify-center">
                                        <h4 className="font-bold text-text line-clamp-2 leading-tight mb-1 group-hover:text-primary transition-colors">{course.title}</h4>
                                        <span className="text-xs text-text-muted font-bold tracking-wide uppercase italic">Dernier accès: {course.lastAccessed}</span>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-end">
                                        <span className="text-xs font-black text-text-muted uppercase tracking-widest">Progression</span>
                                        <span className="text-sm font-black text-primary">{course.progress}%</span>
                                    </div>
                                    <div className="w-full h-2.5 bg-surface-hover rounded-full overflow-hidden border border-glass-border/30 shadow-inner p-0.5">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${course.progress}%` }}
                                            className="h-full bg-gradient-to-r from-primary via-primary to-accent rounded-full shadow-lg shadow-primary/30 relative"
                                        >
                                            <div className="absolute top-0 right-0 bottom-0 w-2 bg-white/30 animate-pulse rounded-full" />
                                        </motion.div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                        {(!stats?.activeCourses || stats.activeCourses.length === 0) && (
                            <div className="col-span-2 p-12 glass border-dashed flex flex-col items-center justify-center text-center space-y-4">
                                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary/40">
                                    <BookOpen size={32} />
                                </div>
                                <h4 className="font-bold text-text-muted">Aucun cours en cours</h4>
                                <button 
                                    onClick={() => navigate('/courses')}
                                    className="text-primary font-bold hover:underline"
                                >
                                    Parcourir le catalogue
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Course Progress Chart */}
                    <div className="glass p-8 space-y-8">
                        <div>
                            <h4 className="text-xl font-black flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                    <BookOpen size={20} />
                                </div>
                                Progression par Formation
                            </h4>
                            <p className="text-text-muted text-sm mt-1 font-medium min-h-[20px]">
                                {hoverData ? (
                                    <span className="text-primary font-bold animate-in fade-in slide-in-from-left-2 duration-300">
                                        {hoverData.courseTitle} : {hoverData.progress}%
                                    </span>
                                ) : (
                                    `Suivez votre avancement global dans chacune de vos ${(stats?.courseProgressData || []).length} formations.`
                                )}
                            </p>
                        </div>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={stats?.courseProgressData || []}
                                    barCategoryGap="30%"
                                    onMouseMove={(e: any) => {
                                        if (e.activePayload && e.activePayload.length > 0) {
                                            setHoverData(e.activePayload[0].payload);
                                        } else {
                                            setHoverData(null);
                                        }
                                    }}
                                    onMouseLeave={() => setHoverData(null)}
                                >
                                    <defs>
                                        <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#6366f1" stopOpacity={1} />
                                            <stop offset="100%" stopColor="#818cf8" stopOpacity={0.7} />
                                        </linearGradient>
                                        <linearGradient id="barGradientDone" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#22c55e" stopOpacity={1} />
                                            <stop offset="100%" stopColor="#4ade80" stopOpacity={0.7} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} opacity={0.3} />
                                    <XAxis
                                        dataKey="courseTitle"
                                        stroke="#94a3b8"
                                        fontSize={10}
                                        tickLine={false}
                                        axisLine={false}
                                        dy={10}
                                        fontStyle="bold"
                                        tickFormatter={(title) => title.length > 15 ? `${title.substring(0, 12)}...` : title}
                                    />
                                    <YAxis
                                        domain={[0, 100]}
                                        stroke="#94a3b8"
                                        fontSize={11}
                                        tickLine={false}
                                        axisLine={false}
                                        dx={-10}
                                        fontStyle="bold"
                                        tickFormatter={(value) => `${value}%`}
                                    />
                                    <Tooltip
                                        content={({ active, payload }: any) => {
                                            if (active && payload && payload.length > 0) {
                                                const data = payload[0].payload;
                                                return (
                                                    <div className="bg-[#1e2a3a]/90 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 shadow-2xl">
                                                        <p className="text-[#818cf8] text-[10px] font-black uppercase tracking-wider mb-0.5">
                                                            {data.courseTitle}
                                                        </p>
                                                        <p className="text-white text-xs font-bold">
                                                            Progression : {data.progress}%
                                                        </p>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                        cursor={{ fill: 'rgba(99,102,241,0.08)' }}
                                    />
                                    <Bar dataKey="progress" radius={[8, 8, 0, 0]} animationDuration={1200}>
                                        {(stats?.courseProgressData || []).map((_: any, index: number) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={_.progress >= 100 ? 'url(#barGradientDone)' : 'url(#barGradient)'}
                                            />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Sidebar Section */}
                <div className="space-y-8">
                    {/* Recent Activity */}
                    <div className="glass p-6 space-y-6">
                        <h4 className="text-lg font-black flex items-center gap-3 border-b border-glass-border pb-4">
                            Dernières Activités
                        </h4>
                        <div className="space-y-5">
                            {(stats?.recentActivities || []).map((activity: any, index: number) => (
                                <div key={index} className="flex gap-4 group cursor-pointer">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg ${activity.type === 'quiz' ? 'bg-success/10 text-success' :
                                        activity.type === 'module' ? 'bg-primary/10 text-primary' :
                                            'bg-accent/10 text-accent'
                                        }`}>
                                        {activity.type === 'quiz' ? <Award size={18} /> :
                                            activity.type === 'module' ? <BookOpen size={18} /> :
                                                <TrendingUp size={18} />}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-text group-hover:text-primary transition-colors leading-snug">{activity.title}</span>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[10px] font-black text-text-muted uppercase tracking-wider">
                                                {new Date(activity.date).toLocaleDateString()}
                                            </span>
                                            {activity.result && <span className="text-[10px] font-black py-0.5 px-1.5 bg-success/10 text-success rounded-md">{activity.result}</span>}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {(!stats?.recentActivities || stats.recentActivities.length === 0) && (
                                <div className="py-8 text-center text-text-muted text-sm italic">
                                    Aucune activité récente.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;
