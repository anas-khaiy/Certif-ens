import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import {
    PlayCircle,
    Clock,
    Search,
    ChevronLeft,
    ChevronRight,
    BookOpen,
    AlertCircle
} from 'lucide-react';
import api from '../api/api-client';
import { motion } from 'framer-motion';
import type { Course } from '../types';
import { API_FORMATEUR, API_APPRENANT, API_ADMIN, WS_APPRENANT, WS_LIVEKIT, AI_DETECT_URL, VERIFY_URL_APPRENANT, VERIFY_URL_FORMATEUR } from '../config';

const EnrolledCoursesPage = () => {
    const navigate = useNavigate();
    const [enrolledCourses, setEnrolledCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 6;

    useEffect(() => {
        const fetchEnrolledCourses = async () => {
            setLoading(true);
            try {
                // Enrollment data is in the Trainer service (port 8081)
                const enrollResponse = await api.get('/enrollments/my/accepted');
                const rawEnrollments = enrollResponse.data;
                const enrollments = Array.isArray(rawEnrollments) ? rawEnrollments : [];

                const mappedCourses = enrollments
                    .filter((e: any) => e && e.course)
                    .map((e: any) => {
                        const c = e.course;
                        return {
                            ...c,
                            id: c.id.toString(),
                            category: c.category || 'Cours',
                            trainerName: c.enseignant ? `${c.enseignant.prenom} ${c.enseignant.nom}` : 'Formateur Inconnu',
                            trainerImage: c.enseignant?.photoProfile ? `${API_FORMATEUR}/files/profiles/${c.enseignant.photoProfile}` : undefined,
                            coverImage: c.coverImage ? (
                                c.coverImage.startsWith('http') || c.coverImage.startsWith('data:')
                                    ? c.coverImage
                                    : `${API_FORMATEUR}/files/content-images/${c.coverImage}`
                            ) : undefined,
                        };
                    });
                setEnrolledCourses(mappedCourses);
            } catch (err) {
                console.error("Error fetching enrolled courses:", err);
                setError("Impossible de charger vos cours inscrits.");
            } finally {
                setLoading(false);
            }
        };

        fetchEnrolledCourses();
    }, []);

    // Apply search filter
    const filteredCourses = enrolledCourses.filter(course => {
        const title = course.title || '';
        const level = course.level || '';
        const category = (course as any).category || level;
        
        const matchesSearch = title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            category.toLowerCase().includes(searchTerm.toLowerCase());
            
        const isPublished = course.published !== false;
        return matchesSearch && isPublished;
    });

    // Pagination
    const totalPages = Math.ceil(filteredCourses.length / itemsPerPage);
    const currentItems = filteredCourses.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const getPages = () => {
        const pages: (number | string)[] = [];
        const showMax = 5;
        if (totalPages <= showMax) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            pages.push(1);
            if (currentPage > 3) pages.push('...');
            const start = Math.max(2, currentPage - 1);
            const end = Math.min(totalPages - 1, currentPage + 1);
            for (let i = start; i <= end; i++) {
                if (!pages.includes(i)) pages.push(i);
            }
            if (currentPage < totalPages - 2) pages.push('...');
            pages.push(totalPages);
        }
        return pages;
    };

    const [coursesProgress, setCoursesProgress] = useState<Record<string, number>>({});

    useEffect(() => {
        const fetchAllProgress = async () => {
            if (enrolledCourses.length === 0) return;

            try {
                const results = await Promise.all(
                    enrolledCourses.map(async (course) => {
                        try {
                            // Progress management is on the Trainer service (port 8081)
                            const [progressRes, resultsRes] = await Promise.all([
                                api.get(`/progress/${course.id}`),
                                api.get(`/progress/${course.id}/quizzes`)
                            ]);

                            const progressData = progressRes.data;
                            const quizResults = Array.isArray(resultsRes.data) ? resultsRes.data : [];

                            const allSubSections = course.sections?.flatMap((s: any) => s.subSections || []) || [];
                            const allSubSectionIds = new Set(allSubSections.map((ss: any) => String(ss.id)));

                            const completedIds = progressData.completedSubSectionIds
                                ? progressData.completedSubSectionIds.split(',').filter((id: string) => id !== '')
                                : [];

                            const validCompletedCount = [...new Set(completedIds)]
                                .filter(id => allSubSectionIds.has(String(id)))
                                .length;

                            let totalItems = allSubSections.length;
                            let completedItems = validCompletedCount;

                            if (course.finalExam && (course as any).examEnabled !== false) {
                                totalItems += 1;
                                const examPassed = quizResults.some((r: any) =>
                                    (String(r.quizId) === String(course.finalExam?.id) || String(r.quizId) === 'final_exam') && r.passed
                                );
                                if (examPassed) completedItems += 1;
                            }

                            const percentage = totalItems > 0
                                ? Math.min(100, Math.round((completedItems / totalItems) * 100))
                                : 0;

                            return { id: course.id, percentage };
                        } catch (err) {
                            console.error(`Error calculating progress for course ${course.id}:`, err);
                            return { id: course.id, percentage: 0 };
                        }
                    })
                );

                const progressMap: Record<string, number> = {};
                results.forEach(res => {
                    progressMap[res.id] = res.percentage;
                });
                setCoursesProgress(progressMap);
            } catch (err) {
                console.error("Error fetching all progress:", err);
            }
        };

        if (enrolledCourses.length > 0) {
            fetchAllProgress();
        }
    }, [enrolledCourses]);

    return (
        <div className="space-y-8 animate-fade-in pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h2 className="text-4xl font-black text-text tracking-tight flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                            <BookOpen size={28} />
                        </div>
                        Mes Cours Inscrits
                    </h2>
                    <p className="text-text-muted mt-2 font-medium">Vous êtes inscrit à <span className="text-primary font-bold">{filteredCourses.length} formations</span> en tant qu'apprenant.</p>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 animate-pulse">
                    <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4"></div>
                    <p className="text-text-muted font-bold">Chargement de votre espace...</p>
                </div>
            ) : error ? (
                <div className="flex flex-col items-center justify-center py-20 bg-surface border border-glass-border rounded-2xl">
                    <AlertCircle size={48} className="text-error mb-4" />
                    <p className="text-error font-bold mb-2">{error}</p>
                    <button onClick={() => window.location.reload()} className="text-primary hover:underline font-bold">Réessayer</button>
                </div>
            ) : (
                <>
                    {/* Search Bar */}
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={20} />
                        <input
                            type="text"
                            placeholder="Rechercher par titre ou catégorie..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="w-full bg-surface border border-glass-border rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-primary/50 transition-all shadow-sm text-text"
                        />
                    </div>

                    {filteredCourses.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 bg-surface border border-glass-border rounded-2xl text-center">
                            <BookOpen size={64} className="text-text-muted mb-6" />
                            <h3 className="text-2xl font-bold text-text mb-2">Aucun cours trouvé</h3>
                            <p className="text-text-muted max-w-md mx-auto">Vous n'avez pas encore de cours acceptés ou aucun ne correspond à votre recherche. Explorez le catalogue pour vous inscrire !</p>
                            <button
                                onClick={() => navigate('/catalog')}
                                className="mt-8 px-8 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary-hover transition-all"
                            >
                                Parcourir le catalogue
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {currentItems.map((course, idx) => {
                                    const progress = coursesProgress[course.id] || 0;
                                    return (
                                        <motion.div
                                            key={course.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.1 }}
                                            whileHover={{ y: -8 }}
                                            className="group glass overflow-hidden border border-glass-border hover:border-primary/30 transition-all shadow-lg hover:shadow-primary/10"
                                        >
                                            <div className="h-48 relative overflow-hidden">
                                                <img
                                                    src={course.coverImage || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=60'}
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                                    alt={course.title}
                                                />
                                                <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-black shadow-lg ${
                                                    progress >= 100 ? 'bg-success text-white' : 
                                                    progress > 0 ? 'bg-primary text-white' : 'bg-accent text-white'
                                                }`}>
                                                    {progress >= 100 ? 'TERMINÉ' : progress > 0 ? 'EN COURS' : 'NOUVEAU'}
                                                </div>
                                                <div className="absolute top-4 left-4 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-white text-xs font-bold border border-white/30">
                                                    {course.level}
                                                </div>
                                            </div>
                                            <div className="p-6 space-y-4">
                                                <div>
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 px-2 py-1 rounded-md">{(course as any).category || course.level}</span>
                                                    <h3 className="text-xl font-bold text-text mt-3 group-hover:text-primary transition-colors h-14 line-clamp-2 leading-tight">{course.title}</h3>
                                                </div>

                                                <div className="space-y-2 py-4 border-y border-glass-border/30">
                                                    <div className="flex justify-between items-end">
                                                        <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">Progression</span>
                                                        <span className="text-sm font-black text-primary">{progress}%</span>
                                                    </div>
                                                    <div className="w-full h-2 bg-background rounded-full overflow-hidden border border-glass-border/30">
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${progress}%` }}
                                                            className="h-full bg-primary rounded-full shadow-lg shadow-primary/20"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between text-xs font-bold text-text-muted">
                                                    <span className="flex items-center gap-1.5 italic">
                                                        <BookOpen size={14} />
                                                        {(course.sections || []).length} Chapitres
                                                    </span>
                                                    <span className="flex items-center gap-1.5">
                                                        <Clock size={14} />
                                                        {(course.sections || []).length * 2}h estimées
                                                    </span>
                                                </div>

                                                <button
                                                    onClick={() => navigate(`/courses/${course.id}/preview`)}
                                                    className="w-full py-3.5 bg-primary hover:bg-primary-hover text-white rounded-xl font-black shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 active:scale-95"
                                                >
                                                    <PlayCircle size={18} />
                                                    {progress >= 100 ? 'Voir détails' : progress > 0 ? 'Continuer le cours' : 'Commencer le cours'}
                                                </button>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 mt-4 border-t border-glass-border">
                                    <div className="text-sm text-text-muted font-bold">
                                        Affichage <span className="text-text">{(currentPage - 1) * itemsPerPage + 1}</span> à <span className="text-text">{Math.min(currentPage * itemsPerPage, filteredCourses.length)}</span> sur <span className="text-text">{filteredCourses.length}</span> cours
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                            disabled={currentPage === 1}
                                            className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface border border-glass-border text-text-muted hover:text-primary disabled:opacity-20 transition-all font-bold"
                                        >
                                            <ChevronLeft size={20} strokeWidth={2.5} style={{ display: 'block', minWidth: '20px' }} />
                                        </button>
                                        <div className="flex gap-1">
                                            {getPages().map((page, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => page !== '...' && setCurrentPage(Number(page))}
                                                    className={`w-10 h-10 rounded-xl font-bold transition-all text-sm border ${currentPage === page ? 'bg-primary text-white border-primary shadow-lg' : 'bg-surface border-glass-border text-text-muted hover:border-primary hover:text-primary'}`}
                                                >
                                                    {page}
                                                </button>
                                            ))}
                                        </div>
                                        <button
                                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                            disabled={currentPage === totalPages}
                                            className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface border border-glass-border text-text-muted hover:text-primary disabled:opacity-20 transition-all font-bold"
                                        >
                                            <ChevronRight size={20} strokeWidth={2.5} style={{ display: 'block', minWidth: '20px' }} />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </>
            )}
        </div>
    );
};

export default EnrolledCoursesPage;
