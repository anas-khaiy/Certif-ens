import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import {
    Plus,
    Trash2,
    BookOpen,
    PlayCircle,
    Search,
    ChevronLeft,
    ChevronRight,
    BarChart3,
    Users,
    TrendingUp,
    ClipboardCheck,
    ArrowLeft,
    GraduationCap,
    RefreshCw,
    CheckCircle,
    AlertCircle,
    MessageSquare,
    Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCourses } from '../hooks/useCourses';
import type { BackendSpecialite, Course } from '../types';
import api from '../api/api-client';

interface QuizSubmission {
    id: string;
    studentName: string;
    studentAvatar: string;
    courseTitle: string;
    quizTitle: string;
    submittedAt: string;
    status: 'pending' | 'graded';
    answers: {
        questionText: string;
        studentAnswer: string;
        type: 'QCU' | 'QCM' | 'OPEN';
        isCorrect?: boolean;
    }[];
}

const MOCK_SUBMISSIONS: QuizSubmission[] = [
    {
        id: 'sub1',
        studentName: 'Anas Ben',
        studentAvatar: 'AB',
        courseTitle: '', // Will be filled
        quizTitle: 'Quiz de démarrage',
        submittedAt: 'Il y a 2 heures',
        status: 'pending',
        answers: [
            {
                questionText: 'Qui est le père de l\'informatique ?',
                studentAnswer: 'Alan Turing',
                type: 'QCU',
                isCorrect: true
            },
            {
                questionText: 'Expliquez l\'importance des données en IA.',
                studentAnswer: 'Les données sont le carburant des modèles.',
                type: 'OPEN'
            }
        ]
    }
];

const CoursesPage: React.FC = () => {
    const navigate = useNavigate();
    const { courses, deleteCourse } = useCourses();

    const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; id: string }>({ isOpen: false, id: '' });
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCycle, setFilterCycle] = useState<'All' | 'Licence' | 'Master' | 'Libre'>('All');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 6;
    const [specialites, setSpecialites] = useState<BackendSpecialite[]>([]);

    useEffect(() => {
        api.get<BackendSpecialite[]>('/specialites').then(r => setSpecialites(r.data)).catch(() => { });
    }, []);

    const getSpecialiteName = (id?: number) => {
        if (!id) return 'Général';
        const found = specialites.find(s => s.id === id);
        return found ? (found.nom.charAt(0).toUpperCase() + found.nom.slice(1)) : 'Général';
    };

    // Stats View State
    const [selectedCourseStats, setSelectedCourseStats] = useState<Course | null>(null);
    const [selectedSubmission, setSelectedSubmission] = useState<QuizSubmission | null>(null);
    const [gradingFeedback, setGradingFeedback] = useState('');

    const confirmDelete = async () => {
        try {
            await deleteCourse(confirmModal.id);
            setConfirmModal({ isOpen: false, id: '' });
        } catch (error) {
            setConfirmModal({ isOpen: false, id: '' });
            alert("Impossible de supprimer ce cours car il contient des données liées (inscriptions, progression, etc.).");
        }
    };

    const filteredCourses = [...courses]
        .sort((a, b) => {
            const timeA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
            const timeB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
            if (timeA === timeB) {
                return Number(b.id) - Number(a.id);
            }
            return timeB - timeA;
        })
        .filter(course => {
            const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                getSpecialiteName(course.specialiteId).toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCycle = filterCycle === 'All' || course.level === filterCycle;
            return matchesSearch && matchesCycle;
        });

    const totalPages = Math.ceil(filteredCourses.length / itemsPerPage);
    const currentItems = filteredCourses.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

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

    if (selectedCourseStats) {
        return (
            <div className="space-y-8 animate-fade-in">
                <button
                    onClick={() => setSelectedCourseStats(null)}
                    className="flex items-center gap-2 text-text-muted hover:text-primary transition-all font-bold group"
                >
                    <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    Retour aux cours
                </button>

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                            Statistiques : {selectedCourseStats.title}
                        </h1>
                        <p className="text-text-muted mt-1">Suivez les progrès et gérez les corrections pour ce cours.</p>
                    </div>
                </div>

                {/* Specific Course Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="glass p-6">
                        <div className="p-3 bg-primary/10 text-primary rounded-xl w-fit mb-4">
                            <Users size={24} />
                        </div>
                        <p className="text-text-muted text-sm font-medium">Apprenants Inscrits</p>
                        <h3 className="text-3xl font-bold mt-1">342</h3>
                    </div>
                    <div className="glass p-6">
                        <div className="p-3 bg-secondary/10 text-secondary rounded-xl w-fit mb-4">
                            <TrendingUp size={24} />
                        </div>
                        <p className="text-text-muted text-sm font-medium">Taux de Complétion</p>
                        <h3 className="text-3xl font-bold mt-1">58%</h3>
                    </div>
                    <div className="glass p-6">
                        <div className="p-3 bg-accent/10 text-accent rounded-xl w-fit mb-4">
                            <CheckCircle size={24} />
                        </div>
                        <p className="text-text-muted text-sm font-medium">Note Moyenne Quiz</p>
                        <h3 className="text-3xl font-bold mt-1">4.5/5</h3>
                    </div>
                    <div className="glass p-6 border-warning/20 bg-warning/5">
                        <div className="p-3 bg-warning/10 text-warning rounded-xl w-fit mb-4">
                            <Clock size={24} />
                        </div>
                        <p className="text-text-muted text-sm font-medium">Corrections en attente</p>
                        <h3 className="text-3xl font-bold mt-1">12</h3>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <ClipboardCheck className="text-primary" size={22} />
                            Submissions de Quiz
                        </h2>
                        <div className="space-y-4">
                            {MOCK_SUBMISSIONS.map((sub) => (
                                <div
                                    key={sub.id}
                                    onClick={() => setSelectedSubmission(sub)}
                                    className="glass p-5 flex items-center justify-between gap-4 group transition-all cursor-pointer hover:border-primary/50"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center font-bold text-primary border border-primary/10">
                                            {sub.studentAvatar}
                                        </div>
                                        <div>
                                            <h4 className="font-bold group-hover:text-primary transition-colors">{sub.studentName}</h4>
                                            <p className="text-xs text-text-muted">{sub.quizTitle} • {sub.submittedAt}</p>
                                        </div>
                                    </div>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${sub.status === 'graded'
                                        ? 'bg-success/10 text-success border border-success/20'
                                        : 'bg-warning/10 text-warning border border-warning/20'
                                        }`}>
                                        {sub.status === 'graded' ? 'CORRIGÉ' : 'À CORRIGER'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-6">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <BarChart3 className="text-primary" size={22} />
                            Détails Apprenants
                        </h2>
                        <div className="glass p-6 overflow-hidden">
                            <div className="space-y-4">
                                {[
                                    { name: 'Anas Ben', progress: 75 },
                                    { name: 'Sara Lami', progress: 40 },
                                    { name: 'Karim Tazi', progress: 95 }
                                ].map((student, i) => (
                                    <div key={i} className="space-y-2">
                                        <div className="flex justify-between text-xs font-bold">
                                            <span>{student.name}</span>
                                            <span>{student.progress}%</span>
                                        </div>
                                        <div className="h-1.5 bg-surface-hover rounded-full overflow-hidden">
                                            <div className="h-full bg-primary" style={{ width: `${student.progress}%` }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Grading Modal */}
                <AnimatePresence>
                    {selectedSubmission && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setSelectedSubmission(null)}
                                className="absolute inset-0 bg-black/60 backdrop-blur-md"
                            />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                className="relative w-full max-w-2xl bg-surface border border-glass-border rounded-3xl shadow-2xl overflow-hidden"
                            >
                                <div className="p-4 sm:p-8 space-y-6 sm:space-y-8 max-h-[85vh] overflow-y-auto custom-scrollbar">
                                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                                        <div className="flex items-center gap-3 sm:gap-4">
                                            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold text-lg sm:text-xl border border-primary/20 shrink-0">
                                                {selectedSubmission.studentAvatar}
                                            </div>
                                            <div className="min-w-0">
                                                <h3 className="text-xl sm:text-2xl font-bold truncate">{selectedSubmission.studentName}</h3>
                                                <p className="text-xs sm:text-sm text-text-muted font-medium flex items-center gap-2 truncate">
                                                    <GraduationCap size={16} /> {selectedSubmission.quizTitle}
                                                </p>
                                            </div>
                                        </div>
                                        <button onClick={() => setSelectedSubmission(null)} className="p-2 hover:bg-surface-hover rounded-xl transition-all">
                                            <ChevronRight className="rotate-90" />
                                        </button>
                                    </div>

                                    <div className="space-y-6">
                                        {selectedSubmission.answers.map((answer, i) => (
                                            <div key={i} className="p-6 bg-surface-hover/30 rounded-2xl border border-glass-border space-y-4">
                                                <h5 className="font-bold text-lg flex gap-3">
                                                    <span className="text-primary opacity-50">Q{i + 1}.</span>
                                                    {answer.questionText}
                                                </h5>
                                                <div className="p-4 bg-background border border-glass-border rounded-xl italic">
                                                    "{answer.studentAnswer}"
                                                </div>
                                                {answer.type === 'OPEN' && (
                                                    <div className="flex flex-col xs:flex-row gap-3 pt-4 border-t border-glass-border/10">
                                                        <button className="flex-1 py-3 px-4 rounded-xl bg-success/10 text-success border border-success/20 font-bold hover:bg-success hover:text-white transition-all flex items-center justify-center gap-2 text-sm">
                                                            <CheckCircle size={18} /> Valider
                                                        </button>
                                                        <button className="flex-1 py-3 px-4 rounded-xl bg-error/10 text-error border border-error/20 font-bold hover:bg-error hover:text-white transition-all flex items-center justify-center gap-2 text-sm">
                                                            <AlertCircle size={18} /> Invalider
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>

                                    <div className="space-y-4">
                                        <label className="text-sm font-bold flex items-center gap-2">
                                            <MessageSquare size={18} className="text-primary" />
                                            Feedback
                                        </label>
                                        <textarea
                                            className="w-full h-32 p-4 bg-surface-hover rounded-2xl border border-glass-border focus:border-primary outline-none transition-all text-sm resize-none"
                                            placeholder="Commentaire pour l'élève..."
                                            value={gradingFeedback}
                                            onChange={(e) => setGradingFeedback(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="p-4 sm:p-6 bg-surface-hover/50 border-t border-glass-border flex flex-col sm:flex-row gap-3 sm:gap-4">
                                    <button onClick={() => setSelectedSubmission(null)} className="w-full sm:flex-1 px-6 py-3 rounded-xl bg-surface border border-glass-border font-bold text-sm">Annuler</button>
                                    <button className="w-full sm:flex-[2] px-6 py-3 rounded-xl bg-primary text-white font-bold shadow-lg shadow-primary/25 text-sm">Enregistrer la correction</button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        );
    }

    return (
        <div className="bg-surface border border-glass-border rounded-[32px] p-6 lg:p-10 shadow-xl shadow-black/5 animate-fade-in">
            <div className="flex flex-col gap-8 mb-10">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <h1 className="text-3xl font-black text-primary tracking-tight">Mes Cours</h1>
                        <p className="text-sm text-text-muted font-medium mt-1">Gérez vos cours, modules et leçons vidéo</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
                        {/* Cycle Filter */}
                        <div className="flex bg-surface-hover/50 border border-glass-border rounded-xl p-1 font-bold">
                            {(['All', 'Licence', 'Master', 'Libre'] as const).map((cycle) => (
                                <button
                                    key={cycle}
                                    onClick={() => {
                                        setFilterCycle(cycle);
                                        setCurrentPage(1);
                                    }}
                                    className={`px-5 py-2 rounded-lg text-xs transition-all ${filterCycle === cycle
                                        ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                        : 'text-text-muted hover:text-primary hover:bg-primary/5'
                                        }`}
                                >
                                    {cycle === 'All' ? 'Tous' : cycle}
                                </button>
                            ))}
                        </div>

                        <div className="relative flex-1 md:w-72">
                            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
                            <input
                                type="text"
                                placeholder="Rechercher un cours..."
                                className="w-full pl-12 pr-4 py-2.5 bg-surface-hover/50 border border-glass-border rounded-xl focus:border-primary outline-none transition-all text-sm font-medium"
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setCurrentPage(1);
                                }}
                            />
                        </div>
                        <button
                            onClick={() => navigate('/courses/new')}
                            className="bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-primary/20 font-black text-sm"
                        >
                            <Plus size={20} strokeWidth={3} />
                            <span>Nouveau Cours</span>
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {currentItems.map((course: Course, idx: number) => (
                    <div
                        key={course.id || `course-${idx}`}
                        onClick={() => navigate(`/courses/${course.id}`)}
                        className="group bg-surface border border-glass-border rounded-[24px] hover:border-primary/40 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300 cursor-pointer relative overflow-hidden flex flex-col h-full shadow-sm"
                    >
                        {/* Cover Image */}
                        <div className="h-48 w-full bg-surface-hover relative overflow-hidden">
                            {course.coverImage ? (
                                <img
                                    src={course.coverImage}
                                    alt={course.title}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = 'https://placehold.co/600x400?text=Course';
                                    }}
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10">
                                    <BookOpen size={48} className="text-primary/30" />
                                </div>
                            )}

                            {/* Delete Button */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (course.id) setConfirmModal({ isOpen: true, id: course.id });
                                }}
                                className="absolute top-4 right-4 p-2.5 bg-white hover:bg-error text-error hover:text-white rounded-xl border border-error/30 transition-all duration-300 z-20 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 shadow-lg shadow-error/10 hover:shadow-error/30"
                                title="Supprimer ce cours"
                            >
                                <Trash2 size={18} strokeWidth={2.5} />
                            </button>

                            {/* Level Badge */}
                            <span className={`absolute top-4 left-4 px-3 py-1 rounded-xl text-[10px] font-black uppercase shadow-lg z-10 border bg-white ${course.level === 'Master'
                                ? 'text-purple-600 border-purple-500/20'
                                : 'text-blue-600 border-blue-500/20'
                                }`}>
                                {course.level}
                            </span>
                            {/* Formation Badges */}
                            <div className="absolute top-4 left-24 flex flex-col gap-1.5 z-10">
                                {course.formations?.map((f) => (
                                    <span
                                        key={f.id}
                                        className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase shadow-lg border flex items-center gap-1.5 bg-white ${f.nom.toLowerCase().includes('initial')
                                            ? 'text-success border-success/20'
                                            : f.nom.toLowerCase().includes('continue')
                                                ? 'text-orange-600 border-orange-500/20'
                                                : 'text-primary border-primary/20'
                                            }`}
                                    >
                                        {f.nom.toLowerCase().includes('initial') && <GraduationCap size={12} />}
                                        {f.nom.toLowerCase().includes('continue') && <RefreshCw size={12} />}
                                        {!f.nom.toLowerCase().includes('initial') && !f.nom.toLowerCase().includes('continue') && <Users size={12} />}
                                        {f.nom}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="p-6 flex flex-col flex-1">
                            <div className="flex-1">
                                <h3 className="text-lg font-black mb-3 group-hover:text-primary transition-colors line-clamp-2 leading-tight">{course.title}</h3>

                                <div className="flex items-center gap-4 text-[11px] text-text-muted font-bold mb-6">
                                    <span className="flex items-center gap-1.5 p-1 px-2 bg-surface-hover rounded-lg">
                                        <BookOpen size={14} />
                                        {course.sections.length} Sections
                                    </span>
                                    {course.semesters.length > 0 && (
                                        <span className="flex items-center gap-1.5 p-1 px-2 bg-surface-hover rounded-lg">
                                            {course.semesters.slice(0, 3).join(', ')}
                                            {course.semesters.length > 3 && '...'}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t border-glass-border mt-auto">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-surface-hover flex items-center justify-center text-[10px] font-black text-text-muted border border-glass-border">
                                        {getSpecialiteName(course.specialiteId).substring(0, 2).toUpperCase()}
                                    </div>
                                    <span className="text-[10px] font-bold text-text-muted truncate max-w-[80px]">{getSpecialiteName(course.specialiteId)}</span>
                                </div>
                                {course.updatedAt && (
                                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-text-muted/60">
                                        <Clock size={12} />
                                        <span>Maj : {new Date(course.updatedAt).toLocaleString('fr-FR', {
                                            day: '2-digit',
                                            month: '2-digit',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Pagination Controls ... */}
            {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-glass-border">
                    <div className="text-xs text-text-muted font-bold">
                        Affichage <span className="text-text">{(currentPage - 1) * itemsPerPage + 1}</span> à <span className="text-text">{Math.min(currentPage * itemsPerPage, filteredCourses.length)}</span> sur <span className="text-text">{filteredCourses.length}</span> cours
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface border border-glass-border text-text-muted hover:text-primary disabled:opacity-20 transition-all font-bold"
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
                                        className={`w-10 h-10 rounded-xl font-bold transition-all text-xs border ${currentPage === page ? 'bg-primary text-white border-primary shadow-lg scale-110 z-10' : 'bg-surface border-glass-border text-text-muted hover:border-primary hover:text-primary'}`}
                                    >
                                        {page}
                                    </button>
                                )
                            ))}
                        </div>
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface border border-glass-border text-text-muted hover:text-primary disabled:opacity-20 transition-all font-bold"
                            aria-label="Next page"
                        >
                            <ChevronRight size={20} style={{ minWidth: '20px', minHeight: '20px', display: 'block' }} strokeWidth={2.5} />
                        </button>
                    </div>
                </div>
            )}

            {/* Confirmation Modal ... */}
            {confirmModal.isOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setConfirmModal({ isOpen: false, id: '' })}>
                    <div className="bg-surface border border-glass-border p-8 rounded-3xl shadow-2xl max-w-md w-full text-center relative" onClick={e => e.stopPropagation()}>
                        <div className="w-20 h-20 bg-error/10 rounded-full flex items-center justify-center mx-auto mb-4"><Trash2 size={40} className="text-error" /></div>
                        <h3 className="text-2xl font-bold mb-2">Supprimer le cours ?</h3>
                        <p className="text-text-muted mb-6">Cette action est irréversible.</p>
                        <div className="flex gap-4">
                            <button onClick={() => setConfirmModal({ isOpen: false, id: '' })} className="flex-1 px-6 py-3 rounded-xl bg-surface-hover font-bold">Annuler</button>
                            <button onClick={confirmDelete} className="flex-1 px-6 py-3 rounded-xl bg-error text-white font-bold">Supprimer</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CoursesPage;
