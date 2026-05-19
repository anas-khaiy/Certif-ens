import React, { useState } from 'react';
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
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useCourses } from '../hooks/useCourses';
import api from '../api/api-client';
import type { Course } from '../types';

const CoursesPage: React.FC = () => {
    const { courses, loading, error } = useCourses();
    const navigate = useNavigate();

    const [searchTerm, setSearchTerm] = useState('');
    const [filterCycle, setFilterCycle] = useState<'All' | 'Licence' | 'Master' | 'Libre'>('All');
    const [selectedFiliere, setSelectedFiliere] = useState('All');
    const [selectedFormation, setSelectedFormation] = useState('All');
    const [formations, setFormations] = useState<any[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
    const [specialities, setSpecialities] = useState<any[]>([]);
    const [enrolledRequests, setEnrolledRequests] = useState<string[]>([]);
    const [acceptedRequests, setAcceptedRequests] = useState<string[]>([]);
    const [rejectedRequests, setRejectedRequests] = useState<string[]>([]);
    const [showToast, setShowToast] = useState(false);

    const itemsPerPage = 6;

    const fetchEnrollments = async () => {
        try {
            const response = await api.get('/enrollments/my');
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
    React.useEffect(() => {
        const fetchSpecs = async () => {
            try {
                const [specsRes, formationsRes] = await Promise.all([
                    api.get('/specialites'),
                    api.get('/formations')
                ]);
                
                if (Array.isArray(specsRes.data)) {
                    setSpecialities(specsRes.data);
                    localStorage.setItem('specialities', JSON.stringify(specsRes.data));
                }
                if (Array.isArray(formationsRes.data)) {
                    setFormations(formationsRes.data);
                }
            } catch (err) {
                console.error("Failed to fetch metadata", err);
                const savedSpecs = localStorage.getItem('specialities');
                if (savedSpecs) setSpecialities(JSON.parse(savedSpecs));
            }
        };

        fetchSpecs();
        fetchEnrollments();
    }, []);

    const filteredCourses = (courses || []).filter(course => {
        const rawCourse = course as any;
        // 1. Resolve from course's own specialiteId first (the most specific)
        const specId = rawCourse.specialiteId ?? rawCourse.specialite_id;
        const resolvedFromId = specialities.find((s: any) => String(s.id) === String(specId))?.nom;

        // 2. Final resolved name priority
        const specNom: string =
            resolvedFromId                         // Highest priority: the ID explicitly set on the course
            || rawCourse.specialiteNom             // Next: the transient name from backend
            || rawCourse.enseignant?.specialite?.nom // Fallback: the trainer's own specialty
            || 'Général';

        const titleMatch = course.title?.toLowerCase().includes(searchTerm.toLowerCase());
        const categoryMatch = specNom.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesSearch = titleMatch || categoryMatch;

        let matchesCycle = filterCycle === 'All';
        if (!matchesCycle) {
            matchesCycle = course.level === filterCycle;
        }

        const matchesFiliere = selectedFiliere === 'All' ||
            specNom.toLowerCase() === selectedFiliere.toLowerCase();

        const matchesFormation = selectedFormation === 'All' || 
            rawCourse.formations?.some((f: any) => f.nom.toLowerCase() === selectedFormation.toLowerCase());

        const isPublished = rawCourse.published !== false;

        return matchesSearch && matchesCycle && matchesFiliere && matchesFormation && isPublished;
    });


    const totalPages = Math.ceil(filteredCourses.length / itemsPerPage);
    const currentItems = filteredCourses.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handleEnroll = async (courseId: string) => {
        try {
            await api.post(`/enrollments/${courseId}/request`);
            await fetchEnrollments(); // Reload from backend for accurate state
            setShowToast(true);
            setTimeout(() => setShowToast(false), 3000);
        } catch (err: any) {
            console.error("Enrollment failed", err);
            alert(err.response?.data?.message || "Une erreur est survenue lors de l'inscription.");
        }
    };

    const handleReEnroll = async (courseId: string) => {
        try {
            await api.post(`/enrollments/${courseId}/re-request`);
            await fetchEnrollments(); // Reload from backend — clears REJECTED, sets PENDING
            setShowToast(true);
            setTimeout(() => setShowToast(false), 3000);
        } catch (err: any) {
            console.error("Re-enrollment failed", err);
            alert(err.response?.data?.message || "Une erreur est survenue lors de la re-inscription.");
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
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Catalogue des Cours</h1>
                        <p className="text-text-muted mt-1">Découvrez et inscrivez-vous à de nouveaux cours</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                        <div className="flex bg-surface border border-glass-border rounded-xl p-1">
                            {(['All', 'Licence', 'Master', 'Libre'] as const).map((cycle) => (
                                <button
                                    key={cycle}
                                    onClick={() => {
                                        setFilterCycle(cycle);
                                        setCurrentPage(1);
                                    }}
                                    className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${filterCycle === cycle
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
                            className="bg-surface border border-glass-border rounded-xl px-4 py-2 text-sm font-bold focus:outline-none focus:border-primary transition-all cursor-pointer min-w-[150px]"
                        >
                            <option value="All">Toutes les Filières</option>
                            {specialities.map((spec: any) => (
                                <option key={spec.id} value={spec.nom}>
                                    {spec.nom}
                                </option>
                            ))}
                        </select>

                        <select
                            value={selectedFormation}
                            onChange={(e) => {
                                setSelectedFormation(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="bg-surface border border-glass-border rounded-xl px-4 py-2 text-sm font-bold focus:outline-none focus:border-primary transition-all cursor-pointer min-w-[150px]"
                        >
                            <option value="All">Toutes les Formations</option>
                            {formations.map((f: any) => (
                                <option key={f.id} value={f.nom}>
                                    {f.nom}
                                </option>
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
                    <div className="flex flex-col items-center justify-center py-20 bg-surface border border-glass-border rounded-2xl">
                        <AlertCircle size={48} className="text-error mb-4" />
                        <p className="text-error font-bold mb-2">{error}</p>
                        <button onClick={() => window.location.reload()} className="text-primary hover:underline font-bold">Réessayer</button>
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
                                style={{ backgroundColor: 'var(--surface)', color: 'var(--text)' }}
                                className="w-full bg-surface border border-glass-border rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-primary/50 transition-all shadow-sm"
                            />
                        </div>

                        {filteredCourses.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 bg-surface border border-glass-border rounded-2xl">
                                <BookOpen size={48} className="text-text-muted mb-4" />
                                <p className="text-text-muted font-bold">Aucun cours trouvé</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {currentItems.map((course: Course, idx: number) => (
                                    <div
                                        key={course.id || `course-${idx}`}
                                        className="group bg-surface border border-glass-border rounded-2xl hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 transition-all cursor-pointer relative overflow-hidden flex flex-col h-full"
                                        onClick={() => setSelectedCourse(course)}
                                    >
                                        <div className="h-48 w-full bg-surface-hover relative overflow-hidden">
                                            {course.coverImage ? (
                                                <img
                                                    src={course.coverImage}
                                                    alt={course.title}
                                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=60';
                                                    }}
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/5 to-accent/5">
                                                    <BookOpen size={48} className="text-primary/20" />
                                                </div>
                                            )}
                                            <span className={`absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-bold bg-white shadow-md z-10 ${course.level === 'Master' ? 'text-purple-600 border border-purple-200' : 'text-blue-600 border border-blue-200'
                                                }`}>
                                                {course.level}
                                            </span>
                                        </div>

                                        <div className="p-6 flex flex-col flex-1">
                                            <div className="flex-1">
                                                <div className="text-xs font-bold text-primary mb-2 uppercase tracking-wider">
                                                    {(() => {
                                                        const rawCourse = course as any;
                                                        const specId = rawCourse.specialiteId ?? rawCourse.specialite_id;
                                                        return specialities.find((s: any) => String(s.id) === String(specId))?.nom
                                                            || rawCourse.specialiteNom
                                                            || rawCourse.enseignant?.specialite?.nom
                                                            || "Général";
                                                    })()}
                                                </div>
                                                <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors line-clamp-2">{course.title}</h3>

                                                <div className="flex items-center gap-2 mb-4">
                                                    <div className="w-6 h-6 rounded-full overflow-hidden border border-glass-border bg-accent/10 flex items-center justify-center text-[10px] font-bold text-accent">
                                                        <img
                                                            src={course.trainerImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(course.trainerName || 'F')}&background=random`}
                                                            className="w-full h-full object-cover"
                                                            alt={course.trainerName}
                                                            onError={(e) => {
                                                                (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(course.trainerName || 'F')}&background=random`;
                                                            }}
                                                        />
                                                    </div>
                                                    <span className="text-xs text-text-muted font-medium italic">{course.trainerName || 'Formateur Inconnu'}</span>
                                                </div>

                                                <div className="flex items-center gap-4 text-sm text-text-muted mb-6">
                                                    <span className="flex items-center gap-1.5 font-medium">
                                                        <BookOpen size={16} />
                                                        {(course.sections || []).length} Chapitres
                                                    </span>
                                                </div>
                                            </div>
                                            {acceptedRequests.includes(course.id) ? (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigate(`/courses/${course.id}/preview`);
                                                    }}
                                                    className="w-full py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 bg-success text-white shadow-lg shadow-success/25 hover:bg-success/90"
                                                >
                                                    <BookOpen size={18} />
                                                    Commencer le cours
                                                </button>
                                            ) : enrolledRequests.includes(course.id) ? (
                                                <button
                                                    disabled
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="w-full py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 bg-primary/10 text-primary cursor-default"
                                                >
                                                    <Clock size={18} />
                                                    Demande envoyée
                                                </button>
                                            ) : rejectedRequests.includes(course.id) ? (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleReEnroll(course.id);
                                                    }}
                                                    className="w-full py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 bg-primary text-white shadow-lg shadow-primary/25 hover:bg-primary-hover hover:scale-[1.02]"
                                                >
                                                    <Plus size={18} />
                                                    Demande d'inscrire
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleEnroll(course.id);
                                                    }}
                                                    className="w-full py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 bg-primary text-white shadow-lg shadow-primary/25 hover:bg-primary-hover hover:scale-[1.02]"
                                                >
                                                    <Plus size={18} />
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
            </div>

            <AnimatePresence>
                {showToast && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, x: '-50%' }}
                        animate={{ opacity: 1, y: 20, x: '-50%' }}
                        exit={{ opacity: 0, y: -20, x: '-50%' }}
                        className="fixed top-0 left-1/2 z-[200] px-6 py-4 bg-white border border-primary/30 rounded-2xl shadow-2xl shadow-primary/20 flex items-center gap-4 min-w-[320px]"
                    >
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                            <CheckCircle size={24} />
                        </div>
                        <div>
                            <div className="font-bold text-text">Demande envoyée !</div>
                            <div className="text-sm text-text-muted">Votre demande d'inscription est en cours.</div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {selectedCourse && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-4"
                    >
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
                            className="relative w-full max-w-2xl bg-surface border border-glass-border rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            <div className="h-48 w-full relative">
                                <img
                                    src={selectedCourse.coverImage || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=60'}
                                    className="w-full h-full object-cover"
                                    alt={selectedCourse.title}
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=60';
                                    }}
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
                                    <div className="text-xs font-bold text-primary mb-2 uppercase tracking-wider">{selectedCourse.category}</div>
                                    <h2 className="text-3xl font-bold mb-4">{selectedCourse.title}</h2>

                                    {/* Modal Trainer & Course Info Row */}
                                    <div className="flex flex-row items-center justify-between p-5 bg-gradient-to-r from-primary/5 via-surface-hover/40 to-accent/5 rounded-2xl border border-glass-border gap-2 backdrop-blur-sm shadow-inner">
                                        <div
                                            className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity group/trainer"
                                            onClick={() => navigate(`/trainer/${selectedCourse.trainerName || 'Équipe Académique'}`)}
                                        >
                                            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary/20 shadow-md flex-shrink-0 group-hover/trainer:border-primary transition-all">
                                                <img
                                                    src={selectedCourse.trainerImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedCourse.trainerName || 'F')}&background=random`}
                                                    className="w-full h-full object-cover"
                                                    alt={selectedCourse.trainerName}
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedCourse.trainerName || 'F')}&background=random`;
                                                    }}
                                                />
                                            </div>
                                            <div>
                                                <div className="text-[9px] font-black uppercase tracking-widest text-primary mb-0.5">Formateur</div>
                                                <div className="text-sm font-bold text-text truncate max-w-[100px] sm:max-w-[150px] group-hover/trainer:text-primary transition-colors">{selectedCourse.trainerName || 'Équipe Académique'}</div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 px-4 border-x border-glass-border/30">
                                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                                                <Layers size={16} />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[9px] text-text-muted font-bold uppercase tracking-wider">Niveau</span>
                                                <span className="text-xs font-bold">{selectedCourse.level}</span>
                                            </div>
                                        </div>


                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="text-lg font-bold flex items-center gap-2">
                                        <BookOpen className="text-primary" size={20} />
                                        Description du cours
                                    </h4>
                                    <div
                                        className="text-text-muted leading-relaxed html-content"
                                        dangerouslySetInnerHTML={{ __html: selectedCourse.description || "Aucune description disponible pour ce cours." }}
                                    />
                                </div>

                                <div className="space-y-4">
                                    <h4 className="text-lg font-bold flex items-center gap-2">
                                        <AlertCircle className="text-warning" size={20} />
                                        Prérequis
                                    </h4>
                                    <div
                                        className="text-text-muted leading-relaxed html-content"
                                        dangerouslySetInnerHTML={{ __html: selectedCourse.prerequisites || "Aucun prérequis spécifié." }}
                                    />
                                </div>

                            </div>

                            <div className="p-8 bg-surface-hover/50 border-t border-glass-border flex gap-4">
                                <button
                                    onClick={() => setSelectedCourse(null)}
                                    className="flex-1 px-6 py-3 rounded-xl bg-surface border border-glass-border font-bold hover:bg-surface-hover transition-all"
                                >
                                    Fermer
                                </button>
                                {acceptedRequests.includes(selectedCourse.id) ? (
                                    <button
                                        onClick={() => {
                                            navigate(`/courses/${selectedCourse.id}/preview`);
                                        }}
                                        className="flex-[2] px-6 py-3 rounded-xl bg-success text-white font-bold shadow-lg shadow-success/25 hover:bg-success/90 transition-all flex items-center justify-center gap-2"
                                    >
                                        <BookOpen size={20} />
                                        Commencer le cours
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => {
                                            handleEnroll(selectedCourse.id);
                                            setSelectedCourse(null);
                                        }}
                                        disabled={enrolledRequests.includes(selectedCourse.id)}
                                        className={`flex-[2] px-6 py-3 rounded-xl font-bold transition-all ${enrolledRequests.includes(selectedCourse.id)
                                            ? 'bg-success/10 text-success cursor-default'
                                            : 'bg-primary text-white shadow-lg shadow-primary/25 hover:bg-primary-hover'
                                            }`}
                                    >
                                        {enrolledRequests.includes(selectedCourse.id) ? 'Demande envoyée' : 'S\'inscrire au cours'}
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default CoursesPage;
