import React, { useState, useEffect } from 'react';
import {
    Plus,
    BookOpen,
    Search,
    CheckCircle,
    ChevronRight,
    ChevronLeft,
    AlertCircle,
    Clock,
    Layers
} from 'lucide-react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/api-client';
import learnerApi from '../api/learner-api-client';
import type { Course, BackendSpecialite, Formation } from '../types';

const CourseCatalogPage: React.FC = () => {
    const navigate = useNavigate();
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [searchTerm, setSearchTerm] = useState('');
    const [filterCycle, setFilterCycle] = useState<'All' | 'Licence' | 'Master' | 'Libre'>('All');
    const [selectedFiliere, setSelectedFiliere] = useState('All');
    const [selectedFormation, setSelectedFormation] = useState('All');
    const [specialities, setSpecialities] = useState<BackendSpecialite[]>([]);
    const [formations, setFormations] = useState<Formation[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
    const [showToast, setShowToast] = useState(false);

    // Enrollment states for the trainer (acting as learner)
    const [enrolledRequests, setEnrolledRequests] = useState<string[]>([]);
    const [acceptedRequests, setAcceptedRequests] = useState<string[]>([]);
    const [rejectedRequests, setRejectedRequests] = useState<string[]>([]);

    const itemsPerPage = 6;

    const fetchEnrollments = async () => {
        try {
            const response = await learnerApi.get('/enrollments/my');
            const data = response.data;
            if (Array.isArray(data)) {
                setEnrolledRequests(data.filter((e: any) => e.status === 'PENDING').map((e: any) => e.course?.id?.toString() || ""));
                setAcceptedRequests(data.filter((e: any) => e.status === 'ACCEPTED').map((e: any) => e.course?.id?.toString() || ""));
                setRejectedRequests(data.filter((e: any) => e.status === 'REJECTED').map((e: any) => e.course?.id?.toString() || ""));
            } else {
                setEnrolledRequests([]);
                setAcceptedRequests([]);
                setRejectedRequests([]);
            }
        } catch (err) {
            console.error("Failed to fetch enrollments", err);
        }
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const [coursesRes, specsRes, formationsRes] = await Promise.all([
                api.get('/courses/all'),
                api.get('/specialites'),
                api.get('/formations')
            ]);
            
            setCourses(coursesRes.data || []);
            setSpecialities(specsRes.data || []);
            setFormations(formationsRes.data || []);
            await fetchEnrollments();
            setError(null);
        } catch (err) {
            console.error("Failed to fetch data", err);
            setError("Erreur lors du chargement des données.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const filteredCourses = (courses || []).filter(course => {
        const rawCourse = course as any;
        const specNom = specialities.find(s => s.id === course.specialiteId)?.nom || 'Général';

        const titleMatch = course.title?.toLowerCase().includes(searchTerm.toLowerCase());
        const categoryMatch = specNom.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesSearch = titleMatch || categoryMatch;

        let matchesCycle = filterCycle === 'All' || course.level === filterCycle;
        const matchesFiliere = selectedFiliere === 'All' || specNom.toLowerCase() === selectedFiliere.toLowerCase();
        
        const matchesFormation = selectedFormation === 'All' || 
            course.formations?.some(f => f.nom.toLowerCase() === selectedFormation.toLowerCase());

        const isPublished = rawCourse.published !== false;

        return matchesSearch && matchesCycle && matchesFiliere && matchesFormation && isPublished;
    });

    const currentItems = filteredCourses.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const totalPages = Math.ceil(filteredCourses.length / itemsPerPage);

    const handleEnroll = async (courseId: string) => {
        try {
            await learnerApi.post(`/enrollments/${courseId}/request`);
            await fetchEnrollments();
            setShowToast(true);
            setTimeout(() => setShowToast(false), 3000);
        } catch (err: any) {
            console.error("Enrollment failed", err);
            alert(err.response?.data?.message || "Une erreur est survenue lors de l'inscription.");
        }
    };

    const handleReEnroll = async (courseId: string) => {
        try {
            await learnerApi.post(`/enrollments/${courseId}/re-request`);
            await fetchEnrollments();
            setShowToast(true);
            setTimeout(() => setShowToast(false), 3000);
        } catch (err: any) {
            console.error("Re-enrollment failed", err);
            alert(err.response?.data?.message || "Une erreur est survenue lors de la ré-inscription.");
        }
    };

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

    return (
        <div className="relative">
            <div className="space-y-6 animate-fade-in pb-12">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-primary tracking-tight">Catalogue des Cours</h1>
                        <p className="text-sm text-text-muted font-medium mt-1">Découvrez tous les cours disponibles sur la plateforme</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                        <div className="flex bg-surface border border-glass-border rounded-xl p-1 font-bold">
                            {(['All', 'Licence', 'Master', 'Libre'] as const).map((cycle) => (
                                <button
                                    key={cycle}
                                    onClick={() => {
                                        setFilterCycle(cycle);
                                        setCurrentPage(1);
                                    }}
                                    className={`px-4 py-1.5 rounded-lg text-xs transition-all ${filterCycle === cycle
                                        ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                        : 'text-text-muted hover:text-primary hover:bg-primary/5'
                                        }`}
                                >
                                    {cycle === 'All' ? 'Tous' : cycle}
                                </button>
                            ))}
                        </div>

                        <select
                            value={selectedFiliere}
                            onChange={(e) => {
                                setSelectedFiliere(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="bg-surface border border-glass-border rounded-xl px-4 py-2 text-xs font-bold focus:outline-none focus:border-primary transition-all cursor-pointer min-w-[150px]"
                        >
                            <option value="All">Filières</option>
                            {specialities.map((spec) => (
                                <option key={spec.id} value={spec.nom}>{spec.nom}</option>
                            ))}
                        </select>

                        <select
                            value={selectedFormation}
                            onChange={(e) => {
                                setSelectedFormation(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="bg-surface border border-glass-border rounded-xl px-4 py-2 text-xs font-bold focus:outline-none focus:border-primary transition-all cursor-pointer min-w-[150px]"
                        >
                            <option value="All">Formations</option>
                            {formations.map((f) => (
                                <option key={f.id} value={f.nom}>{f.nom}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 animate-pulse">
                        <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4"></div>
                        <p className="text-text-muted font-bold">Chargement du catalogue...</p>
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-surface border border-glass-border rounded-[32px]">
                        <AlertCircle size={48} className="text-error mb-4" />
                        <p className="text-error font-bold mb-2">{error}</p>
                        <button onClick={() => fetchData()} className="text-primary hover:underline font-bold">Réessayer</button>
                    </div>
                ) : (
                    <>
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={20} />
                            <input
                                type="text"
                                placeholder="Rechercher par titre ou filière..."
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="w-full bg-surface border border-glass-border rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-primary/50 transition-all shadow-sm font-medium"
                            />
                        </div>

                        {filteredCourses.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 bg-surface border border-glass-border rounded-[32px]">
                                <BookOpen size={48} className="text-text-muted mb-4" />
                                <p className="text-text-muted font-bold">Aucun cours trouvé</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {currentItems.map((course: Course, idx: number) => (
                                    <div
                                        key={course.id || `course-${idx}`}
                                        className="group bg-surface border border-glass-border rounded-[24px] hover:border-primary/40 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300 cursor-pointer relative overflow-hidden flex flex-col h-full shadow-sm"
                                        onClick={() => setSelectedCourse(course)}
                                    >
                                        <div className="h-48 w-full bg-surface-hover relative overflow-hidden">
                                            {course.coverImage ? (
                                                <img
                                                    src={course.coverImage}
                                                    alt={course.title}
                                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10">
                                                    <BookOpen size={48} className="text-primary/30" />
                                                </div>
                                            )}
                                            <span className={`absolute top-4 left-4 px-3 py-1 rounded-xl text-[10px] font-black uppercase shadow-lg z-10 border bg-white ${course.level === 'Master' ? 'text-purple-600 border-purple-500/20' : 'text-blue-600 border-blue-500/20'}`}>
                                                {course.level}
                                            </span>
                                        </div>

                                        <div className="p-6 flex flex-col flex-1">
                                            <div className="flex-1">
                                                <div className="text-[10px] font-black text-primary mb-2 uppercase tracking-wider">
                                                    {specialities.find(s => s.id === course.specialiteId)?.nom || "Général"}
                                                </div>
                                                <h3 className="text-lg font-black mb-3 group-hover:text-primary transition-colors line-clamp-2 leading-tight">{course.title}</h3>
                                                
                                                <div className="flex items-center gap-4 text-[11px] text-text-muted font-bold mb-6">
                                                    <span className="flex items-center gap-1.5 p-1 px-2 bg-surface-hover rounded-lg">
                                                        <BookOpen size={14} />
                                                        {(course.sections || []).length} Sections
                                                    </span>
                                                </div>
                                            </div>

                                            {acceptedRequests.includes(String(course.id)) ? (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigate(`/courses/${course.id}/preview`);
                                                    }}
                                                    className="w-full py-3 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-2 bg-success text-white shadow-lg shadow-success/25 hover:bg-success/90"
                                                >
                                                    <BookOpen size={18} strokeWidth={3} />
                                                    Commencer le cours
                                                </button>
                                            ) : enrolledRequests.includes(String(course.id)) ? (
                                                <button
                                                    disabled
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="w-full py-3 rounded-xl font-black text-sm bg-primary/10 text-primary cursor-default flex items-center justify-center gap-2"
                                                >
                                                    <Clock size={18} strokeWidth={3} />
                                                    Demande envoyée
                                                </button>
                                            ) : rejectedRequests.includes(String(course.id)) ? (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleReEnroll(String(course.id));
                                                    }}
                                                    className="w-full py-3 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-2 bg-primary text-white shadow-lg shadow-primary/25 hover:bg-primary/90 hover:scale-[1.02]"
                                                >
                                                    <Plus size={18} strokeWidth={3} />
                                                    Demande d'inscrire
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleEnroll(String(course.id));
                                                    }}
                                                    className="w-full py-3 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-2 bg-primary text-white shadow-lg shadow-primary/25 hover:bg-primary/90 hover:scale-[1.02]"
                                                >
                                                    <Plus size={18} strokeWidth={3} />
                                                    Demande d'inscrire
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {totalPages > 1 && (
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 mt-4 border-t border-glass-border">
                                <div className="text-xs text-text-muted font-bold">
                                    Affichage <span className="text-text">{(currentPage - 1) * itemsPerPage + 1}</span> à <span className="text-text">{Math.min(currentPage * itemsPerPage, filteredCourses.length)}</span> sur <span className="text-text">{filteredCourses.length}</span> cours
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface border border-glass-border text-text-muted hover:text-primary disabled:opacity-20 transition-all font-bold"
                                    >
                                        <ChevronLeft size={20} strokeWidth={2.5} />
                                    </button>
                                    <div className="flex gap-1">
                                        {getPages().map((page, i) => (
                                            <button
                                                key={i}
                                                onClick={() => page !== '...' && setCurrentPage(Number(page))}
                                                className={`w-10 h-10 rounded-xl font-bold transition-all text-xs border ${currentPage === page ? 'bg-primary text-white border-primary shadow-lg' : 'bg-surface border-glass-border text-text-muted hover:border-primary hover:text-primary'}`}
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
                                        <ChevronRight size={20} strokeWidth={2.5} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            <AnimatePresence>
                {showToast && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, x: '-50%' }}
                        animate={{ opacity: 1, y: 20, x: '-50%' }}
                        exit={{ opacity: 0, y: -20, x: '-50%' }}
                        className="fixed top-0 left-1/2 z-[200] px-6 py-4 bg-white border border-primary/30 rounded-2xl shadow-2xl flex items-center gap-4 min-w-[320px]"
                    >
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary"><CheckCircle size={24} /></div>
                        <div>
                            <div className="font-bold text-text">Demande envoyée !</div>
                            <div className="text-sm text-text-muted text-xs">Votre demande d'inscription est en attente.</div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {selectedCourse && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedCourse(null)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-2xl bg-surface border border-glass-border rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            <div className="h-48 w-full relative">
                                <img
                                    src={selectedCourse.coverImage || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=60'}
                                    className="w-full h-full object-cover"
                                    alt={selectedCourse.title}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-surface to-transparent" />
                                <button
                                    onClick={() => setSelectedCourse(null)}
                                    className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full backdrop-blur-md transition-all"
                                >
                                    <ChevronRight className="rotate-90" />
                                </button>
                            </div>

                            <div className="flex-1 p-8 space-y-8 overflow-y-auto custom-scrollbar">
                                <div>
                                    <div className="text-xs font-black text-primary mb-2 uppercase tracking-widest">
                                        {specialities.find(s => s.id === selectedCourse.specialiteId)?.nom || "Général"}
                                    </div>
                                    <h2 className="text-3xl font-black tracking-tight mb-4 leading-tight">{selectedCourse.title}</h2>
                                    
                                    <div className="flex items-center gap-6 p-6 bg-surface-hover/50 rounded-2xl border border-glass-border">
                                        <div className="space-y-1">
                                            <span className="text-[10px] text-text-muted font-black uppercase tracking-widest">Niveau</span>
                                            <div className="text-sm font-bold flex items-center gap-2">
                                                <Layers size={16} className="text-primary" />
                                                {selectedCourse.level}
                                            </div>
                                        </div>
                                        <div className="w-px h-10 bg-glass-border" />
                                        <div className="space-y-1">
                                            <span className="text-[10px] text-text-muted font-black uppercase tracking-widest">Contenu</span>
                                            <div className="text-sm font-bold flex items-center gap-2">
                                                <BookOpen size={16} className="text-primary" />
                                                {(selectedCourse.sections || []).length} Sections
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="text-lg font-black tracking-tight flex items-center gap-2">
                                        <BookOpen className="text-primary" size={20} strokeWidth={3} />
                                        Description
                                    </h4>
                                    <div className="text-text-muted text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: selectedCourse.description }} />
                                </div>

                                {selectedCourse.prerequisites && (
                                    <div className="space-y-4">
                                        <h4 className="text-lg font-black tracking-tight flex items-center gap-2">
                                            <AlertCircle className="text-warning" size={20} strokeWidth={3} />
                                            Prérequis
                                        </h4>
                                        <div className="text-text-muted text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: selectedCourse.prerequisites }} />
                                    </div>
                                )}
                            </div>

                            <div className="p-8 bg-surface-hover border-t border-glass-border flex gap-4">
                                <button
                                    onClick={() => setSelectedCourse(null)}
                                    className="flex-1 px-6 py-4 rounded-xl bg-surface border border-glass-border font-black text-sm hover:bg-background transition-all"
                                >
                                    Fermer
                                </button>
                                {acceptedRequests.includes(String(selectedCourse.id)) ? (
                                    <button
                                        onClick={() => navigate(`/courses/${selectedCourse.id}/preview`)}
                                        className="flex-[2] px-6 py-4 rounded-xl bg-success text-white font-black text-sm shadow-lg shadow-success/25 hover:bg-success/90 transition-all flex items-center justify-center gap-2"
                                    >
                                        <BookOpen size={20} strokeWidth={3} />
                                        Commencer le cours
                                    </button>
                                ) : rejectedRequests.includes(String(selectedCourse.id)) ? (
                                    <button
                                        onClick={() => {
                                            handleReEnroll(String(selectedCourse.id));
                                            setSelectedCourse(null);
                                        }}
                                        className="flex-[2] px-6 py-4 rounded-xl font-black text-sm bg-primary text-white shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
                                    >
                                        <Plus size={20} strokeWidth={3} />
                                        Demande d'inscrire
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => {
                                            handleEnroll(String(selectedCourse.id));
                                            setSelectedCourse(null);
                                        }}
                                        disabled={enrolledRequests.includes(String(selectedCourse.id))}
                                        className={`flex-[2] px-6 py-4 rounded-xl font-black text-sm transition-all ${enrolledRequests.includes(String(selectedCourse.id))
                                            ? 'bg-primary/10 text-primary cursor-default'
                                            : 'bg-primary text-white shadow-lg shadow-primary/25 hover:bg-primary/90'
                                            }`}
                                    >
                                        {enrolledRequests.includes(String(selectedCourse.id)) ? 'Demande envoyée' : 'Demande d\'inscrire'}
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default CourseCatalogPage;
