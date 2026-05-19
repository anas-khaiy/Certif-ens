import React, { useState, useEffect } from 'react';
import {
    Award,
    CheckCircle2,
    XCircle,
    Clock,
    Search,
    ChevronLeft,
    ChevronRight,
    TrendingUp,
    BarChart3,
    Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/api-client';

interface QuizStatItem {
    id: number;
    learner: string;
    quizName: string;
    score: number;
    date: string;
    status: string;
}

interface QuizStatistics {
    totalCompleted: number;
    successRate: number;
    averageScore: number;
    recentResults: QuizStatItem[];
}

const StatCard = ({ title, value, icon, trend, isPositive }: any) => (
    <div className="glass p-6 rounded-2xl border border-glass-border hover:border-primary/50 transition-all group">
        <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-surface-hover rounded-xl text-primary group-hover:scale-110 transition-transform">
                {icon}
            </div>
            <div className={`flex items-center gap-1 text-xs font-bold ${isPositive ? 'text-success' : 'text-error'}`}>
                {trend}
                {isPositive ? <TrendingUp size={14} /> : <BarChart3 size={14} />}
            </div>
        </div>
        <div>
            <p className="text-text-muted text-sm font-medium">{title}</p>
            <h3 className="text-3xl font-bold mt-1">{value}</h3>
        </div>
    </div>
);

const QuizStatisticsPage: React.FC = () => {
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [stats, setStats] = useState<QuizStatistics | null>(null);
    const [loading, setLoading] = useState(true);
    const itemsPerPage = 6;

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await api.get('/dashboard/quiz-statistics');
                setStats(response.data);
            } catch (error) {
                console.error('Error fetching quiz statistics:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    const filteredResults = (stats?.recentResults || []).filter(r =>
        r.learner.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.quizName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const totalPages = Math.ceil(filteredResults.length / itemsPerPage);
    const displayedResults = filteredResults.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const getPageNumbers = () => {
        const pages = [];
        if (totalPages <= 5) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            if (currentPage <= 3) {
                pages.push(1, 2, 3, 4, '...', totalPages);
            } else if (currentPage >= totalPages - 2) {
                pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
            } else {
                pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
            }
        }
        return pages;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in pb-10">
            {/* Header - Simple Text */}
            <div className="flex flex-col items-start text-left gap-1">
                <h1 className="text-3xl font-bold text-text">
                    Statistiques des Quiz
                </h1>
                <p className="text-text-muted font-medium">
                    Analyse des résultats et des performances de vos apprenants aux évaluations.
                </p>
            </div>

            {/* Global Quiz KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Complétés"
                    value={stats?.totalCompleted || 0}
                    icon={<Award size={24} />}
                    trend="+5%"
                    isPositive={true}
                />
                <StatCard
                    title="Taux de Réussite"
                    value={`${stats?.successRate || 0}%`}
                    icon={<CheckCircle2 size={24} />}
                    trend="+2%"
                    isPositive={true}
                />
                <StatCard
                    title="Score Moyen"
                    value={`${stats?.averageScore || 0}%`}
                    icon={<TrendingUp size={24} />}
                    trend="+1%"
                    isPositive={true}
                />
                <StatCard
                    title="Temps Moyen"
                    value="---"
                    icon={<Clock size={24} />}
                    trend=""
                    isPositive={true}
                />
            </div>

            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h2 className="text-xl font-bold">Résultats Récents</h2>
                    <div className="relative w-full sm:w-80">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Rechercher par apprenant ou quiz..."
                            className="w-full pl-10 pr-4 py-2.5 bg-surface border border-glass-border rounded-xl text-sm outline-none focus:border-primary transition-all shadow-sm"
                        />
                    </div>
                </div>

                <div className="glass overflow-hidden rounded-3xl border border-glass-border">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-surface-hover/50 border-b border-glass-border">
                                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-text-muted">Apprenant</th>
                                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-text-muted">Quiz</th>
                                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-text-muted text-center">Score</th>
                                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-text-muted">Date</th>
                                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-text-muted text-right">Statut</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-glass-border">
                                <AnimatePresence mode="wait">
                                    {displayedResults.map((result, i) => (
                                        <motion.tr
                                            key={result.id}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.05 }}
                                            className="hover:bg-surface-hover/30 transition-colors group"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                                                        {result.learner.charAt(0)}
                                                    </div>
                                                    <span className="font-bold text-sm">{result.learner}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm font-medium text-text-muted">{result.quizName}</td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`text-sm font-bold ${result.score >= 70 ? 'text-success' : result.score >= 50 ? 'text-warning' : 'text-error'}`}>
                                                    {result.score}%
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-xs text-text-muted">{result.date}</td>
                                            <td className="px-6 py-4 text-right">
                                                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-tighter flex items-center justify-end gap-1.5 ${result.status === 'Réussi' ? 'text-success bg-success/10' : 'text-error bg-error/10'}`}>
                                                    {result.status === 'Réussi' ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                                                    {result.status}
                                                </span>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination - LEFT ALIGNED */}
                    <div className="px-6 py-4 bg-surface-hover/30 border-t border-glass-border flex items-center justify-start gap-4">
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="w-9 h-9 flex items-center justify-center rounded-xl bg-surface border border-glass-border text-text-muted hover:text-primary disabled:opacity-20 transition-all shadow-sm"
                                aria-label="Previous page"
                            >
                                <ChevronLeft size={20} style={{ minWidth: '20px', minHeight: '20px', display: 'block' }} strokeWidth={2.5} />
                            </button>
                            <div className="flex gap-1">
                                {getPageNumbers().map((page, index) => (
                                    page === '...' ? (
                                        <span key={`dots-${index}`} className="w-9 h-9 flex items-center justify-center text-text-muted font-bold tracking-widest text-xs">...</span>
                                    ) : (
                                        <button
                                            key={`page-${page}`}
                                            onClick={() => setCurrentPage(page as number)}
                                            className={`w-9 h-9 rounded-xl font-bold transition-all text-xs border ${currentPage === page ? 'bg-primary text-white border-primary shadow-md' : 'bg-surface border-glass-border text-text-muted hover:border-primary hover:text-primary'}`}
                                        >
                                            {page}
                                        </button>
                                    )
                                ))}
                            </div>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="w-9 h-9 flex items-center justify-center rounded-xl bg-surface border border-glass-border text-text-muted hover:text-primary disabled:opacity-20 transition-all shadow-sm"
                                aria-label="Next page"
                            >
                                <ChevronRight size={20} style={{ minWidth: '20px', minHeight: '20px', display: 'block' }} strokeWidth={2.5} />
                            </button>
                        </div>
                        <span className="text-[11px] text-text-muted font-bold ml-2">
                            Page {currentPage} / {totalPages}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuizStatisticsPage;
