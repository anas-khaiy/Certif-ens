import {
    Users,
    Award,
    BookOpen,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import { useState, useEffect } from 'react';
import api from '../api/api-client';

const TrainersStatsPage = () => {
    const [data, setData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await api.get('/stats/trainers');
                setData(response.data);
            } catch (error) {
                console.error('Error fetching trainers stats:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    const trainersData = [...(data?.trainersData || [])].sort((a: any, b: any) => {
        const rateA = a.enrollments > 0 ? a.certifications / a.enrollments : 0;
        const rateB = b.enrollments > 0 ? b.certifications / b.enrollments : 0;
        if (rateB !== rateA) return rateB - rateA;
        return b.certifications - a.certifications; // Secondary sort by total certs
    });

    // Pagination Logic
    const totalPages = Math.ceil(trainersData.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentItems = trainersData.slice(startIndex, endIndex);

    // Smart Pagination Range (getPageNumbers)
    const getPageNumbers = () => {
        const pages: (number | string)[] = [];
        const showMax = 7; // Increased slightly for better range

        if (totalPages <= showMax) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            // Always show first page
            pages.push(1);

            if (currentPage > 3) {
                pages.push('...');
            }

            // Window around current page
            const start = Math.max(2, currentPage - 1);
            const end = Math.min(totalPages - 1, currentPage + 1);

            for (let i = start; i <= end; i++) {
                if (!pages.includes(i)) pages.push(i);
            }

            if (currentPage < totalPages - 2) {
                pages.push('...');
            }

            // Always show last page
            if (!pages.includes(totalPages)) {
                pages.push(totalPages);
            }
        }
        return pages;
    };

    return (
        <div className="space-y-12 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold">Statistiques des Formateurs</h2>
                    <p className="text-text-muted">Analyse détaillée de la performance par formateur.</p>
                </div>
                <div className="p-3 bg-primary/10 text-primary rounded-xl">
                    <Users size={24} />
                </div>
            </div>

            {/* Global KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass p-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-primary/10 text-primary">
                            <Users size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-text-muted">Total Formateurs</p>
                            <h3 className="text-2xl font-bold">{data?.totalTrainers || 0}</h3>
                        </div>
                    </div>
                </div>
                <div className="glass p-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-success/10 text-success">
                            <BookOpen size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-text-muted">Total Cours</p>
                            <h3 className="text-2xl font-bold">{data?.totalCourses || 0}</h3>
                        </div>
                    </div>
                </div>
                <div className="glass p-6" style={{ marginBottom: '30px' }}>
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-secondary/10 text-secondary">
                            <Award size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-text-muted">Certifications Délivrées</p>
                            <h3 className="text-2xl font-bold">{data?.totalCertifications || 0}</h3>
                        </div>
                    </div>
                </div>
            </div>

            <div className="py-2"></div>
            {/* Detailed Table */}
            <div className="glass overflow-hidden shadow-xl">
                <div className="p-6 border-b border-glass-border">
                    <h4 className="text-lg font-semibold">Détails par Formateur</h4>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-surface-hover/50 text-text-muted text-xs uppercase tracking-widest">
                                <th className="text-left p-4">Formateur</th>
                                <th className="text-center p-4">Certifications</th>
                                <th className="text-center p-4">Inscriptions</th>
                                <th className="text-center p-4">Apprenants</th>
                                <th className="text-center p-4">Taux de réussite</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-glass-border">
                            {currentItems.map((trainer: any, index: number) => {
                                const enrollments = Number(trainer.enrollments) || 0;
                                const certs = Number(trainer.certifications) || 0;
                                const rate = enrollments > 0 
                                    ? Math.min(100, Math.round((certs / enrollments) * 100)) 
                                    : 0;
                                return (
                                    <tr key={index} className="hover:bg-surface-hover/30 transition-colors">
                                        <td className="p-4 font-bold text-text">{trainer.name}</td>
                                        <td className="p-4 text-center font-semibold text-secondary">{certs}</td>
                                        <td className="p-4 text-center font-semibold text-primary/70">{enrollments}</td>
                                        <td className="p-4 text-center font-semibold text-primary">{trainer.learners}</td>
                                        <td className="p-4 text-center">
                                            <span className={`px-2 py-1 rounded-lg text-xs font-bold ${rate >= 90 ? 'bg-success/10 text-success' :
                                                rate >= 70 ? 'bg-warning/10 text-warning' : 'bg-error/10 text-error'
                                                }`}>
                                                {rate}%
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="pagination border-t border-glass-border bg-surface-hover/10 px-6 py-4 flex items-center justify-between">
                        <div className="pagination-info">
                            Affichage <span className="text-text font-bold">{startIndex + 1}</span> à <span className="text-text font-bold">{Math.min(endIndex, trainersData.length)}</span> sur <span className="text-text font-bold">{trainersData.length}</span> formateurs
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="w-10 h-10 p-0 rounded-xl bg-background border border-glass-border text-text-muted hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-all icon-container">
                                <ChevronLeft size={18} />
                            </button>
                            <div className="flex gap-1.5">
                                {getPageNumbers().map((page, i) => (
                                    page === '...' ? (
                                        <div key={i} className="w-10 h-10 flex items-center justify-center text-text-muted font-bold select-none cursor-default">
                                            ...
                                        </div>
                                    ) : (
                                        <button
                                            key={i}
                                            onClick={() => setCurrentPage(Number(page))}
                                            className={`w-10 h-10 p-0 rounded-xl font-bold transition-all ${currentPage === page
                                                ? 'bg-primary text-white shadow-lg shadow-indigo-500/30'
                                                : 'bg-background border border-glass-border text-text-muted hover:border-primary hover:text-primary'}`}
                                        >
                                            {page}
                                        </button>
                                    )
                                ))}
                            </div>
                            <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="w-10 h-10 p-0 rounded-xl bg-background border border-glass-border text-text-muted hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-all icon-container">
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TrainersStatsPage;
