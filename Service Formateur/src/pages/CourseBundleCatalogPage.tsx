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
    Layers,
    LayoutDashboard
} from 'lucide-react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/api-client';
import type { BackendSpecialite } from '../types';
import { API_FORMATEUR, API_APPRENANT, API_ADMIN, WS_APPRENANT, WS_LIVEKIT, AI_DETECT_URL, VERIFY_URL_APPRENANT, VERIFY_URL_FORMATEUR } from '../config';

interface Bundle {
    id: number;
    title: string;
    description: string;
    coverImage: string;
    published: boolean;
    specialite?: BackendSpecialite;
    courses?: any[];
}

interface BundleEnrollment {
    enrollment: {
        id: number;
        bundleId: number;
        status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
    };
    progress?: number;
}

const CourseBundleCatalogPage: React.FC = () => {
    const navigate = useNavigate();
    const [bundles, setBundles] = useState<Bundle[]>([]);
    const [enrollments, setEnrollments] = useState<BundleEnrollment[]>([]);
    const [specialities, setSpecialities] = useState<BackendSpecialite[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedFiliere, setSelectedFiliere] = useState('All');
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedBundle, setSelectedBundle] = useState<Bundle | null>(null);
    const [showToast, setShowToast] = useState(false);

    const itemsPerPage = 6;

    const fetchEnrollments = async () => {
        try {
            const response = await api.get('/bundles/trainer/my-enrollments');
            setEnrollments(response.data || []);
        } catch (err) {
            console.error("Failed to fetch bundle enrollments", err);
        }
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const [bundlesRes, specsRes] = await Promise.all([
                api.get('/bundles/trainer/published'),
                api.get('/specialites')
            ]);
            
            setBundles(bundlesRes.data || []);
            setSpecialities(specsRes.data || []);
            await fetchEnrollments();
            setError(null);
        } catch (err) {
            console.error("Failed to fetch bundle data", err);
            setError("Erreur lors du chargement des parcours.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const filteredBundles = (bundles || []).filter(bundle => {
        const titleMatch = bundle.title?.toLowerCase().includes(searchTerm.toLowerCase());
        const specName = bundle.specialite?.nom || 'Général';
        const categoryMatch = specName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesSearch = titleMatch || categoryMatch;

        const matchesFiliere = selectedFiliere === 'All' || specName.toLowerCase() === selectedFiliere.toLowerCase();
        
        return matchesSearch && matchesFiliere;
    });

    const currentItems = filteredBundles.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const totalPages = Math.ceil(filteredBundles.length / itemsPerPage);

    const handleEnroll = async (bundleId: number) => {
        try {
            await api.post(`/bundles/trainer/enroll/${bundleId}`);
            await fetchEnrollments();
            setShowToast(true);
            setTimeout(() => setShowToast(false), 3000);
        } catch (err: any) {
            console.error("Bundle enrollment failed", err);
            alert(err.response?.data?.message || "Une erreur est survenue lors de l'inscription au parcours.");
        }
    };

    const getEnrollmentStatus = (bundleId: number) => {
        return enrollments.find(e => e.enrollment.bundleId === bundleId)?.enrollment.status;
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

    const getImageUrl = (imagePath: string) => {
        const defaultImage = 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800&auto=format&fit=crop&q=80';
        if (!imagePath) return defaultImage;
        if (imagePath.startsWith('http') || imagePath.startsWith('data:')) return imagePath;
        return `${API_FORMATEUR}/files/${imagePath}`;
    };

    return (
        <div className="relative">
            <div className="space-y-6 animate-fade-in pb-12">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-primary tracking-tight mb-1">Catalogue de Parcours</h1>
                        <p className="text-sm text-text-muted font-medium mb-4">Découvrez les parcours de certification complets</p>
                        <button 
                            onClick={() => navigate('/enrolled-bundles')}
                            className="flex items-center gap-2 px-5 py-2.5 bg-primary/10 text-primary border border-primary/20 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-primary hover:text-white transition-all shadow-sm w-fit"
                        >
                            <LayoutDashboard size={14} strokeWidth={3} />
                            Mes Inscriptions
                        </button>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 w-full md:w-auto mt-4 md:mt-0">
                        <select
                            value={selectedFiliere}
                            onChange={(e) => {
                                setSelectedFiliere(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="bg-surface border border-glass-border rounded-xl px-4 py-2 text-xs font-bold focus:outline-none focus:border-primary transition-all cursor-pointer min-w-[200px]"
                        >
                            <option value="All">Toutes les spécialités</option>
                            {specialities.map((spec) => (
                                <option key={spec.id} value={spec.nom}>{spec.nom}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 animate-pulse">
                        <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4"></div>
                        <p className="text-text-muted font-bold">Chargement des parcours...</p>
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
                                placeholder="Rechercher un parcours par titre..."
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="w-full bg-surface border border-glass-border rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-primary/50 transition-all shadow-sm font-medium"
                            />
                        </div>

                        {filteredBundles.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 bg-surface border border-glass-border rounded-[32px]">
                                <Layers size={48} className="text-text-muted mb-4" />
                                <p className="text-text-muted font-bold">Aucun parcours trouvé</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {currentItems.map((bundle: Bundle, idx: number) => {
                                    const status = getEnrollmentStatus(bundle.id);
                                    return (
                                        <div
                                            key={bundle.id || `bundle-${idx}`}
                                            className="group bg-surface border border-glass-border rounded-[24px] hover:border-primary/40 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300 cursor-pointer relative overflow-hidden flex flex-col h-full shadow-sm"
                                            onClick={() => setSelectedBundle(bundle)}
                                        >
                                            <div className="h-48 w-full bg-[#1e293b] relative overflow-hidden flex items-center justify-center">
                                                {bundle.coverImage ? (
                                                    <img
                                                        src={getImageUrl(bundle.coverImage)}
                                                        alt={bundle.title}
                                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
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
                                                <div className="absolute top-4 left-4 px-3 py-1 rounded-full text-[10px] font-black uppercase shadow-lg z-10 bg-white text-primary">
                                                    PARCOURS
                                                </div>
                                            </div>

                                            <div className="p-6 flex flex-col flex-1">
                                                <div className="flex-1">
                                                    <div className="text-[10px] font-black text-primary mb-2 uppercase tracking-wider">
                                                        {bundle.specialite?.nom || "Général"}
                                                    </div>
                                                    <h3 className="text-lg font-black mb-3 group-hover:text-primary transition-colors line-clamp-2 leading-tight">{bundle.title}</h3>
                                                    
                                                    <div className="flex items-center gap-4 text-[11px] text-text-muted font-bold mb-6">
                                                        <span className="flex items-center gap-1.5 p-1 px-2 bg-surface-hover rounded-lg">
                                                            <BookOpen size={14} />
                                                            {(bundle.courses || []).length} Cours inclus
                                                        </span>
                                                    </div>
                                                </div>

                                                {status === 'ACCEPTED' ? (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            navigate(`/bundle/${bundle.id}`);
                                                        }}
                                                        className="w-full py-3 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-2 bg-success text-white shadow-lg shadow-success/25 hover:bg-success/90"
                                                    >
                                                        <CheckCircle size={18} strokeWidth={3} />
                                                        Commencer
                                                    </button>
                                                ) : status === 'PENDING' ? (
                                                    <button
                                                        disabled
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="w-full py-3 rounded-xl font-black text-sm bg-primary/10 text-primary cursor-default flex items-center justify-center gap-2"
                                                    >
                                                        <Clock size={18} strokeWidth={3} />
                                                        Demande envoyée
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleEnroll(bundle.id);
                                                        }}
                                                        className="w-full py-3 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-2 bg-primary text-white shadow-lg shadow-primary/25 hover:bg-primary/90 hover:scale-[1.02]"
                                                    >
                                                        <Plus size={18} strokeWidth={3} />
                                                        S'inscrire au parcours
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {totalPages > 1 && (
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 mt-4 border-t border-glass-border">
                                <div className="text-xs text-text-muted font-bold">
                                    Affichage <span className="text-text">{(currentPage - 1) * itemsPerPage + 1}</span> à <span className="text-text">{Math.min(currentPage * itemsPerPage, filteredBundles.length)}</span> sur <span className="text-text">{filteredBundles.length}</span> parcours
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
                            <div className="text-sm text-text-muted text-xs">Votre demande d'inscription au parcours est en attente.</div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {selectedBundle && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedBundle(null)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-2xl bg-surface border border-glass-border rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            <div className="h-48 w-full bg-[#1e293b] relative flex items-center justify-center">
                                {selectedBundle.coverImage ? (
                                    <img
                                        src={getImageUrl(selectedBundle.coverImage)}
                                        className="w-full h-full object-cover"
                                        alt={selectedBundle.title}
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
                                <div className={`custom-placeholder flex flex-col items-center justify-center w-full h-full ${selectedBundle.coverImage ? 'hidden' : 'flex'}`}>
                                    <BookOpen size={48} className="text-white/40" />
                                </div>
                                <div className="absolute top-4 left-4 px-3 py-1 rounded-full text-[10px] font-black uppercase shadow-lg z-10 bg-white text-primary">
                                    PARCOURS
                                </div>
                                <div className="absolute inset-0 bg-gradient-to-t from-[#1e293b] to-transparent opacity-60" />
                                <button
                                    onClick={() => setSelectedBundle(null)}
                                    className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full backdrop-blur-md transition-all"
                                >
                                    <ChevronRight className="rotate-90" />
                                </button>
                            </div>

                            <div className="flex-1 p-8 space-y-8 overflow-y-auto custom-scrollbar">
                                <div>
                                    <div className="text-xs font-black text-primary mb-2 uppercase tracking-widest">
                                        {selectedBundle.specialite?.nom || "Général"}
                                    </div>
                                    <h2 className="text-3xl font-black tracking-tight mb-4 leading-tight">{selectedBundle.title}</h2>
                                    
                                    <div className="flex items-center gap-6 p-6 bg-surface-hover/50 rounded-2xl border border-glass-border">
                                        <div className="space-y-1">
                                            <span className="text-[10px] text-text-muted font-black uppercase tracking-widest">Type</span>
                                            <div className="text-sm font-bold flex items-center gap-2 text-primary">
                                                <Layers size={16} />
                                                Parcours
                                            </div>
                                        </div>
                                        <div className="w-px h-10 bg-glass-border" />
                                        <div className="space-y-1">
                                            <span className="text-[10px] text-text-muted font-black uppercase tracking-widest">Contenu</span>
                                            <div className="text-sm font-bold flex items-center gap-2">
                                                <BookOpen size={16} className="text-primary" />
                                                {(selectedBundle.courses || []).length} Cours inclus
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="text-lg font-black tracking-tight flex items-center gap-2">
                                        <Layers className="text-primary" size={20} strokeWidth={3} />
                                        Description du parcours
                                    </h4>
                                    <div className="text-text-muted text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: selectedBundle.description }} />
                                </div>

                                <div className="space-y-4">
                                    <h4 className="text-lg font-black tracking-tight flex items-center gap-2">
                                        <LayoutDashboard className="text-primary" size={20} strokeWidth={3} />
                                        Cours inclus dans ce parcours
                                    </h4>
                                    <div className="grid grid-cols-1 gap-2">
                                        {selectedBundle.courses?.map((course: any, idx: number) => (
                                            <div key={course.id} className="flex items-center gap-3 p-3 bg-surface-hover/30 rounded-xl border border-glass-border">
                                                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                                                    {idx + 1}
                                                </div>
                                                <span className="text-sm font-bold">{course.title}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="p-8 bg-surface-hover border-t border-glass-border flex gap-4">
                                <button
                                    onClick={() => setSelectedBundle(null)}
                                    className="flex-1 px-6 py-4 rounded-xl bg-surface border border-glass-border font-black text-sm hover:bg-background transition-all"
                                >
                                    Fermer
                                </button>
                                {getEnrollmentStatus(selectedBundle.id) === 'ACCEPTED' ? (
                                    <button
                                        onClick={() => navigate(`/bundle/${selectedBundle.id}`)}
                                        className="flex-[2] px-6 py-4 rounded-xl bg-success text-white font-black text-sm shadow-lg shadow-success/25 hover:bg-success/90 transition-all flex items-center justify-center gap-2"
                                    >
                                        <CheckCircle size={20} strokeWidth={3} />
                                        Commencer
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => {
                                            handleEnroll(selectedBundle.id);
                                            setSelectedBundle(null);
                                        }}
                                        disabled={getEnrollmentStatus(selectedBundle.id) === 'PENDING'}
                                        className={`flex-[2] px-6 py-4 rounded-xl font-black text-sm transition-all ${getEnrollmentStatus(selectedBundle.id) === 'PENDING'
                                            ? 'bg-primary/10 text-primary cursor-default'
                                            : 'bg-primary text-white shadow-lg shadow-primary/25 hover:bg-primary/90'
                                            }`}
                                    >
                                        {getEnrollmentStatus(selectedBundle.id) === 'PENDING' ? 'Demande envoyée' : 'S\'inscrire au parcours'}
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

export default CourseBundleCatalogPage;
