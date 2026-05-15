import { useState, useEffect } from 'react';
import {
    Users,
    Clock,
    Award,
    Search,
    ChevronLeft,
    ChevronRight,
    Loader2,
    Briefcase
} from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../api/api-client';

interface Learner {
    id: number;
    name: string;
    email: string;
    status: string;
    progress: number;
    score: number;
    lastActive: string;
}

const LearnerStatisticsPage: React.FC = () => {
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [learners, setLearners] = useState<Learner[]>([]);
    const [enseignantEmails, setEnseignantEmails] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const itemsPerPage = 8;

    useEffect(() => {
        const fetchLearners = async () => {
            try {
                const response = await api.get('/dashboard/learner-statistics');
                setLearners(response.data);
            } catch (error) {
                console.error('Error fetching learner statistics:', error);
            } finally {
                setLoading(false);
            }
        };

        const fetchEnseignants = async () => {
            try {
                const response = await api.get('/enseignants');
                const emails = new Set<string>();
                response.data.forEach((e: any) => {
                    if (e.email) emails.add(e.email.toLowerCase());
                });
                setEnseignantEmails(emails);
            } catch (error) {
                console.error('Error fetching enseignants for Stats:', error);
            }
        };

        fetchLearners();
        fetchEnseignants();
    }, []);

    const filteredLearners = learners.filter(l =>
        l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const totalPages = Math.ceil(filteredLearners.length / itemsPerPage);
    const displayedLearners = filteredLearners.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

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
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                        Progression des Apprenants
                    </h1>
                    <p className="text-text-muted mt-1">
                        Suivi en temps réel de l'avancement de vos étudiants.
                    </p>
                </div>

                <div className="relative w-full md:w-80">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Rechercher un apprenant..."
                        className="w-full pl-10 pr-4 py-3 bg-surface border border-glass-border rounded-2xl text-sm outline-none focus:border-primary transition-all shadow-sm"
                    />
                </div>
            </div>

            {/* Learners List Grid - Using full width now */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {displayedLearners.map((learner) => (
                    <motion.div
                        key={learner.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="glass p-6 rounded-3xl border border-glass-border hover:border-primary/40 transition-all group flex flex-col justify-between"
                    >
                        <div className="space-y-4">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center font-bold text-primary border border-primary/5 shadow-inner">
                                        {learner.name.split(' ').map(n => n[0]).join('')}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-sm text-text group-hover:text-primary transition-colors flex items-center gap-2">
                                            {learner.name}
                                            {enseignantEmails.has((learner.email || '').toLowerCase()) && (
                                                <div className="group/tooltip relative flex items-center justify-center bg-primary/10 w-5 h-5 rounded-md cursor-help">
                                                    <Briefcase size={12} className="text-primary" />
                                                    <span className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-surface border border-glass-border px-2 py-1 rounded-lg text-[10px] text-text-muted opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-lg">
                                                        Formateur
                                                    </span>
                                                </div>
                                            )}
                                        </h4>
                                        <p className="text-[10px] text-text-muted truncate max-w-[120px]">{learner.email}</p>
                                    </div>
                                </div>
                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter ${learner.status === 'Actif' ? 'bg-success/10 text-success' : 'bg-text-muted/10 text-text-muted'}`}>
                                    {learner.status}
                                </span>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-text-muted">
                                    <span>Progression</span>
                                    <span className="text-primary">{learner.progress}%</span>
                                </div>
                                <div className="h-2 bg-surface-hover rounded-full overflow-hidden border border-glass-border">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${learner.progress}%` }}
                                        transition={{ duration: 1, ease: "easeOut" }}
                                        className="h-full bg-gradient-to-r from-primary to-accent"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 pt-4 border-t border-glass-border flex justify-between items-center">
                            <div className="flex items-center gap-1.5">
                                <Award size={14} className="text-accent" />
                                <span className="text-xs font-bold text-text">{learner.score}%</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-text-muted">
                                <Clock size={14} />
                                <span className="text-[10px] font-medium">{learner.lastActive}</span>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Empty State */}
            {displayedLearners.length === 0 && (
                <div className="glass p-12 text-center rounded-3xl border border-dashed border-glass-border">
                    <Users size={48} className="mx-auto text-text-muted mb-4 opacity-20" />
                    <h3 className="text-lg font-bold text-text">Aucun apprenant trouvé</h3>
                    <p className="text-text-muted text-sm mt-1">Essayez d'ajuster votre recherche.</p>
                </div>
            )}

            {/* Pagination - LEFT ALIGNED */}
            {totalPages > 1 && (
                <div className="flex items-center justify-start gap-4 pt-6">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface border border-glass-border text-text-muted hover:text-primary disabled:opacity-20 transition-all shadow-sm"
                            aria-label="Previous page"
                        >
                            <ChevronLeft size={20} style={{ minWidth: '20px', minHeight: '20px', display: 'block' }} strokeWidth={2.5} />
                        </button>
                        <div className="flex gap-1">
                            {getPageNumbers().map((page, index) => (
                                page === '...' ? (
                                    <span key={`dots-${index}`} className="w-10 h-10 flex items-center justify-center text-text-muted font-bold tracking-widest text-xs">...</span>
                                ) : (
                                    <button
                                        key={`page-${page}`}
                                        onClick={() => setCurrentPage(page as number)}
                                        className={`w-10 h-10 rounded-xl font-bold transition-all text-xs border ${currentPage === page ? 'bg-primary text-white border-primary shadow-lg' : 'bg-surface border-glass-border text-text-muted hover:border-primary hover:text-primary'}`}
                                    >
                                        {page}
                                    </button>
                                )
                            ))}
                        </div>
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface border border-glass-border text-text-muted hover:text-primary disabled:opacity-20 transition-all shadow-sm"
                            aria-label="Next page"
                        >
                            <ChevronRight size={20} style={{ minWidth: '20px', minHeight: '20px', display: 'block' }} strokeWidth={2.5} />
                        </button>
                    </div>
                    <span className="text-xs text-text-muted font-bold">
                        Page {currentPage} / {totalPages}
                    </span>
                </div>
            )}
        </div>
    );
};

export default LearnerStatisticsPage;
