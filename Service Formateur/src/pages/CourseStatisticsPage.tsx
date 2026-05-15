import { useState, useEffect } from 'react';
import {
    Users,
    BookOpen,
    TrendingUp,
    Award,
    ChevronRight,
    ChevronLeft,
    ArrowUpRight,
    ArrowDownRight,
    Loader2
} from 'lucide-react';
import api from '../api/api-client';

interface CourseEngagement {
    name: string;
    learners: number;
    progress: number;
    success: number;
}

interface TopLearner {
    name: string;
    xp: string;
    coursesCount: number;
    avatar: string;
    averageProgress: number;
}

interface CourseStatistics {
    totalLearners: number;
    activeCourses: number;
    engagementRate: number;
    totalCertifications: number;
    courseEngagements: CourseEngagement[];
    topLearners: TopLearner[];
}

const StatCard = ({ title, value, icon, trend, isPositive }: any) => (
    <div className="glass p-6 rounded-2xl border border-glass-border hover:border-primary/50 transition-all group">
        <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-surface-hover rounded-xl text-primary group-hover:scale-110 transition-transform flex items-center justify-center">
                {icon}
            </div>
            <div className={`flex items-center gap-1 text-xs font-bold ${isPositive ? 'text-success' : 'text-error'}`}>
                {trend}
                {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            </div>
        </div>
        <div>
            <p className="text-text-muted text-sm font-medium">{title}</p>
            <h3 className="text-3xl font-bold mt-1 text-text">{value}</h3>
        </div>
    </div>
);

const CourseStatisticsPage: React.FC = () => {
    const [stats, setStats] = useState<CourseStatistics | null>(null);
    const [loading, setLoading] = useState(true);

    // Course Engagement Pagination
    const [coursesPage, setCoursesPage] = useState(1);
    const coursesPerPage = 5;

    // Top Learners Pagination
    const [learnersPage, setLearnersPage] = useState(1);
    const learnersPerPage = 4;

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await api.get('/dashboard/course-statistics');
                setStats(response.data);
            } catch (error) {
                console.error('Error fetching course stats:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
            </div>
        );
    }

    const courseEngagements = stats?.courseEngagements || [];
    const topLearners = stats?.topLearners || [];

    const totalCoursePages = Math.ceil(courseEngagements.length / coursesPerPage);
    const displayedCourses = courseEngagements.slice((coursesPage - 1) * coursesPerPage, coursesPage * coursesPerPage);

    const totalLearnerPages = Math.ceil(topLearners.length / learnersPerPage);
    const displayedLearners = topLearners.slice((learnersPage - 1) * learnersPerPage, learnersPage * learnersPerPage);

    return (
        <div className="space-y-8 pb-10">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    Statistiques des Cours
                </h1>
                <p className="text-text-muted mt-1 font-medium">
                    Analyse détaillée des performances de vos cours et de l'engagement des apprenants.
                </p>
            </div>

            {/* Global Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Apprenants"
                    value={stats?.totalLearners.toLocaleString() || 0}
                    icon={<Users size={24} />}
                    trend="+12%"
                    isPositive={true}
                />
                <StatCard
                    title="Cours Actifs"
                    value={stats?.activeCourses || 0}
                    icon={<BookOpen size={24} />}
                    trend="+2"
                    isPositive={true}
                />
                <StatCard
                    title="Taux d'Engagement"
                    value={`${stats?.engagementRate || 0}%`}
                    icon={<TrendingUp size={24} />}
                    trend="+5%"
                    isPositive={true}
                />
                <StatCard
                    title="Certifications"
                    value={stats?.totalCertifications || 0}
                    icon={<Award size={24} />}
                    trend="+8%"
                    isPositive={true}
                />
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Courses Table Section */}
                <div className="lg:col-span-2 space-y-6">
                    <h2 className="text-xl font-bold text-text">Engagement par Cours</h2>

                    <div className="glass overflow-hidden rounded-3xl border border-glass-border flex flex-col">
                        <div className="overflow-x-auto min-h-[420px]">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-surface-hover/50 border-b border-glass-border">
                                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-text-muted">Cours</th>
                                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-text-muted text-right">Apprenants</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-glass-border">
                                    {displayedCourses.map((stat, i) => (
                                        <tr key={i} className="hover:bg-surface-hover/30 transition-colors group h-[76px]">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                                                        {stat.name.charAt(0)}
                                                    </div>
                                                    <span className="font-bold text-text group-hover:text-primary transition-colors text-sm">{stat.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right font-bold text-base text-text">{stat.learners}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Courses Pagination Controls */}
                        <div className="px-6 py-4 bg-surface-hover/30 border-t border-glass-border flex items-center justify-start gap-4">
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setCoursesPage(p => Math.max(1, p - 1))}
                                    disabled={coursesPage === 1}
                                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface border border-glass-border text-text-muted hover:text-primary disabled:opacity-20 transition-all font-bold"
                                    aria-label="Previous page"
                                >
                                    <ChevronLeft size={20} style={{ minWidth: '20px', minHeight: '20px', display: 'block' }} strokeWidth={2.5} />
                                </button>
                                <div className="flex gap-1">
                                    {[...Array(totalCoursePages)].map((_, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setCoursesPage(i + 1)}
                                            className={`w-10 h-10 rounded-xl font-bold transition-all text-xs border ${coursesPage === i + 1 ? 'bg-primary text-white border-primary shadow-lg' : 'bg-surface border-glass-border text-text-muted hover:border-primary hover:text-primary'}`}
                                        >
                                            {i + 1}
                                        </button>
                                    ))}
                                </div>
                                <button
                                    onClick={() => setCoursesPage(p => Math.min(totalCoursePages, p + 1))}
                                    disabled={coursesPage === totalCoursePages}
                                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface border border-glass-border text-text-muted hover:text-primary disabled:opacity-20 transition-all font-bold"
                                    aria-label="Next page"
                                >
                                    <ChevronRight size={20} style={{ minWidth: '20px', minHeight: '20px', display: 'block' }} strokeWidth={2.5} />
                                </button>
                            </div>
                            <span className="text-xs text-text-muted font-bold ml-2">
                                Page {coursesPage} / {totalCoursePages}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Top Learners List Section */}
                <div className="space-y-6">
                    <h2 className="text-xl font-bold text-text">Top Apprenants</h2>
                    <div className="glass p-6 rounded-3xl border border-glass-border flex flex-col h-full min-h-[500px]">
                        <div className="flex-1 space-y-6">
                            {displayedLearners.map((student, i) => (
                                <div
                                    key={i}
                                    className="flex items-center justify-between group h-[64px]"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center font-bold text-primary border border-primary/10 text-sm">
                                            {student.avatar}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-sm text-text">{student.name}</h4>
                                            <p className="text-[10px] text-text-muted font-medium">{student.coursesCount} cours complétés</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-xs font-bold text-primary bg-primary/5 px-2 py-1 rounded-lg border border-primary/10">
                                            {student.averageProgress}% progression globale
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Learners Pagination */}
                        <div className="mt-8 pt-6 border-t border-glass-border flex items-center justify-start gap-3">
                            <button
                                onClick={() => setLearnersPage(p => Math.max(1, p - 1))}
                                disabled={learnersPage === 1}
                                className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface border border-glass-border text-text-muted hover:text-primary disabled:opacity-20 transition-all font-bold"
                                aria-label="Previous learners"
                            >
                                <ChevronLeft size={20} style={{ minWidth: '20px', minHeight: '20px', display: 'block' }} strokeWidth={2.5} />
                            </button>
                            <div className="flex gap-1">
                                {[...Array(totalLearnerPages)].map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setLearnersPage(i + 1)}
                                        className={`w-9 h-9 rounded-xl font-bold transition-all text-xs border ${learnersPage === i + 1 ? 'bg-primary text-white border-primary shadow-lg' : 'bg-surface border-glass-border text-text-muted hover:border-primary hover:text-primary'}`}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={() => setLearnersPage(p => Math.min(totalLearnerPages, p + 1))}
                                disabled={learnersPage === totalLearnerPages}
                                className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface border border-glass-border text-text-muted hover:text-primary disabled:opacity-20 transition-all font-bold"
                                aria-label="Next learners"
                            >
                                <ChevronRight size={20} style={{ minWidth: '20px', minHeight: '20px', display: 'block' }} strokeWidth={2.5} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CourseStatisticsPage;
