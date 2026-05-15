import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { 
    ChevronLeft, 
    BookOpen, 
    Layers, 
    LayoutDashboard,
    CheckCircle,
    Play
} from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../api/api-client';
import { API_FORMATEUR, API_APPRENANT, API_ADMIN, WS_APPRENANT, WS_LIVEKIT, AI_DETECT_URL, VERIFY_URL_APPRENANT, VERIFY_URL_FORMATEUR } from '../config';

interface Course {
    id: number;
    title: string;
    description: string;
    coverImage: string;
    sections?: any[];
}

interface Bundle {
    id: number;
    title: string;
    description: string;
    coverImage: string;
    courses: Course[];
}

const BundleCoursesPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [bundle, setBundle] = useState<Bundle | null>(null);
    const [courseProgress, setCourseProgress] = useState<Record<number, number>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchBundle = async () => {
            setLoading(true);
            try {
                // Fetch progress first to verify enrollment
                const progressRes = await api.get(`/bundles/trainer/my-enrollments/${id}/detailed-progress`);
                const bundleRes = await api.get(`/bundles/${id}`);
                
                setBundle(bundleRes.data);
                setCourseProgress(progressRes.data.courseProgress || {});
                setError(null);
            } catch (err: any) {
                console.error("Failed to fetch bundle details", err);
                const message = err.response?.data?.message || err.message || "Accès refusé.";
                setError(message);
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchBundle();
    }, [id]);

    const getImageUrl = (imagePath: string) => {
        const defaultImage = 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800&auto=format&fit=crop&q=80';
        if (!imagePath) return defaultImage;
        if (imagePath.startsWith('http') || imagePath.startsWith('data:')) return imagePath;
        return `${API_FORMATEUR}/files/${imagePath}`;
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-primary bg-background text-text">
                <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                <p className="text-xl font-black tracking-tight">Chargement du parcours...</p>
            </div>
        );
    }

    if (error || !bundle) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] bg-surface border border-glass-border rounded-[40px] p-12 text-center text-text">
                <div className="w-20 h-20 bg-error/10 rounded-full flex items-center justify-center text-error mb-6 mx-auto">
                    <Layers size={40} />
                </div>
                <h2 className="text-3xl font-black mb-4">Oups !</h2>
                <p className="text-text-muted font-bold mb-10 max-w-md mx-auto leading-relaxed">{error || "Nous n'avons pas pu trouver ce parcours."}</p>
                <button 
                    onClick={() => navigate('/bundle-catalog')}
                    className="px-10 py-4 bg-primary text-white rounded-2xl font-black hover:bg-primary/90 transition-all flex items-center gap-2 mx-auto shadow-xl shadow-primary/20"
                >
                    <ChevronLeft size={20} />
                    Retour au catalogue
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-12 animate-fade-in pb-20 bg-background text-text transition-colors duration-300">
            {/* Header Section */}
            <div className="relative group">
                <button 
                    onClick={() => navigate('/enrolled-bundles')}
                    className="absolute -top-14 left-0 flex items-center gap-3 text-text-muted hover:text-primary font-bold transition-all group/btn"
                >
                    <div className="p-2 rounded-xl bg-surface border border-glass-border group-hover/btn:border-primary/30 transition-all shadow-sm">
                        <ChevronLeft size={20} />
                    </div>
                    Retour à mes inscriptions
                </button>

                <div className="flex flex-col lg:flex-row gap-10 items-center lg:items-start p-10 bg-surface border-2 border-glass-border rounded-[40px] shadow-2xl shadow-black/5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32" />
                    
                    <div className="w-48 h-48 rounded-[32px] overflow-hidden border-4 border-background shadow-2xl shrink-0 bg-[#1e293b] relative z-10 flex items-center justify-center transition-transform duration-500 group-hover:scale-105">
                        {bundle.coverImage ? (
                            <img 
                                src={getImageUrl(bundle.coverImage)} 
                                alt={bundle.title}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                    const parent = (e.target as HTMLImageElement).parentElement;
                                    if (parent) {
                                        const placeholder = parent.querySelector('.custom-placeholder');
                                        if (placeholder) (placeholder as HTMLElement).style.display = 'flex';
                                    }
                                }}
                            />
                        ) : null}
                        <div className={`custom-placeholder flex flex-col items-center justify-center w-full h-full ${bundle.coverImage ? 'hidden' : 'flex'}`}>
                            <BookOpen size={48} className="text-white/40" />
                        </div>
                        <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-white text-primary text-[9px] font-black uppercase tracking-widest z-20 shadow-md">
                            PARCOURS
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col justify-center space-y-4 text-center lg:text-left">
                        <div>
                            <div className="flex flex-col lg:flex-row lg:items-center gap-2 mb-2 justify-center lg:justify-start">
                                <span className="inline-block px-2 py-0.5 rounded-md bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest border border-primary/20 w-fit">
                                    Parcours de Certification
                                </span>
                                <h1 className="text-xl lg:text-2xl font-black tracking-tight leading-tight">
                                    {bundle.title}
                                </h1>
                            </div>
                            
                            <div className="flex flex-wrap gap-3 items-center justify-center lg:justify-start">
                                <div className="flex items-center gap-1.5 text-text-muted">
                                    <BookOpen size={16} className="text-primary" />
                                    <span className="text-xs font-bold">{bundle.courses.length} Cours</span>
                                </div>
                                <div className="w-1 h-1 rounded-full bg-glass-border hidden lg:block" />
                                <div className="flex items-center gap-1.5 text-success">
                                    <CheckCircle size={16} />
                                    <span className="text-xs font-bold">Inscrit</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Courses List Section */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-black tracking-tight flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-primary text-white shadow-lg shadow-primary/20">
                            <LayoutDashboard size={20} />
                        </div>
                        Liste des cours du parcours
                    </h2>
                    <span className="text-xs font-black text-text-muted bg-surface border border-glass-border px-3 py-1.5 rounded-full uppercase tracking-widest">
                        Ordre séquentiel
                    </span>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    {bundle.courses.map((course, index) => (
                        <motion.div
                            key={course.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="group bg-surface border border-glass-border hover:border-primary/30 p-2 pr-6 rounded-[24px] flex items-center gap-6 transition-all hover:shadow-xl hover:shadow-primary/5 cursor-pointer overflow-hidden relative"
                            onClick={() => navigate(`/courses/${course.id}/preview`)}
                        >
                            {/* Sequence Number */}
                            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-[20px] bg-background border border-glass-border flex flex-col items-center justify-center group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all duration-500">
                                <span className="text-xs font-black opacity-50 uppercase tracking-tighter mb-0.5 line-height-none">Étape</span>
                                <span className="text-2xl font-black line-height-none leading-none">{index + 1}</span>
                            </div>

                            {/* Course Info */}
                            <div className="flex-1 min-w-0">
                                <h3 className="text-lg font-black truncate group-hover:text-primary transition-colors mb-1">
                                    {course.title}
                                </h3>
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center gap-4 text-xs font-bold text-text-muted">
                                        <span className="flex items-center gap-1.5">
                                            <BookOpen size={14} className="text-primary" />
                                            {(course.sections || []).length} Sections
                                        </span>
                                        <span className="w-1 h-1 rounded-full bg-glass-border" />
                                        <span className="flex items-center gap-1.5">
                                            <CheckCircle size={14} className="text-emerald-500" />
                                            Certificat disponible
                                        </span>
                                    </div>
                                    
                                    {/* Course Progress Bar */}
                                    <div className="flex items-center gap-3 w-full max-w-xs">
                                        <div className="h-1.5 flex-1 bg-glass-border rounded-full overflow-hidden">
                                            <motion.div 
                                                initial={{ width: 0 }}
                                                animate={{ width: `${courseProgress[course.id] || 0}%` }}
                                                className="h-full bg-gradient-to-r from-primary to-emerald-500"
                                            />
                                        </div>
                                        <span className="text-[10px] font-black text-text-muted">
                                            {Math.round(courseProgress[course.id] || 0)}%
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Action Icon */}
                            <div className="w-12 h-12 rounded-full border border-glass-border flex items-center justify-center text-text-muted group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all duration-500 group-hover:scale-110 shadow-sm">
                                <Play size={20} className="ml-1" />
                            </div>

                            {/* Background Number Accent */}
                            <div className="absolute -right-4 -bottom-6 text-9xl font-black opacity-[0.02] pointer-events-none group-hover:opacity-[0.05] transition-opacity duration-1000">
                                {index + 1}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default BundleCoursesPage;
