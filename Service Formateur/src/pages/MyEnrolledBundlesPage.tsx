import React, { useState, useEffect } from 'react';
import { 
    Clock, 
    CheckCircle, 
    XCircle, 
    Search, 
    ArrowLeft, 
    Layers,
    ChevronRight,
    Calendar,
    Award,
    BookOpen
} from 'lucide-react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/api-client';
import BundleCertificateModal from '../components/BundleCertificateModal';
import { API_FORMATEUR, API_APPRENANT, API_ADMIN, WS_APPRENANT, WS_LIVEKIT, AI_DETECT_URL, VERIFY_URL_APPRENANT, VERIFY_URL_FORMATEUR } from '../config';

interface BundleEnrollmentData {
    enrollment: {
        id: number;
        bundleId: number;
        status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
        enrolledAt: string;
    };
    progress: number;
}

interface Bundle {
    id: number;
    title: string;
    description: string;
    coverImage: string;
    specialite?: { nom: string };
    courses?: any[];
}

const MyEnrolledBundlesPage: React.FC = () => {
    const navigate = useNavigate();
    const [enrollments, setEnrollments] = useState<BundleEnrollmentData[]>([]);
    const [bundles, setBundles] = useState<Bundle[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCertificate, setSelectedCertificate] = useState<{id: number, enrollmentId: number, title: string} | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                const [enrollRes, bundlesRes] = await Promise.all([
                    api.get('/bundles/trainer/my-enrollments'),
                    api.get('/bundles/trainer/published')
                ]);
                setEnrollments(enrollRes.data || []);
                setBundles(bundlesRes.data || []);
            } catch (err: any) {
                console.error(err);
                setError(err.response?.data?.message || "Impossible de charger vos inscriptions. Vérifiez votre connexion au serveur.");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const getBundleInfo = (id: number) => bundles.find(b => b.id === id);

    const filtered = (enrollments || [])
        .filter(item => item.enrollment.status === 'ACCEPTED')
        .filter(item => {
            const bundle = getBundleInfo(item.enrollment.bundleId);
            if (!bundle) return false;
            
            const title = bundle.title || '';
            const desc = bundle.description || '';
            
            return title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                   desc.toLowerCase().includes(searchQuery.toLowerCase());
        });

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] gap-6 text-primary bg-background text-text">
                <div className="relative">
                    <div className="w-20 h-20 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                    <Layers className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary/40" size={32} />
                </div>
                <div className="text-center space-y-2">
                    <p className="text-xl font-black tracking-tight">Récupération de vos parcours...</p>
                    <p className="text-sm text-text-muted font-medium opacity-60">Synchronisation avec le centre de formation</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center px-6 bg-background text-text">
                <div className="w-24 h-24 bg-error/10 text-error rounded-[32px] flex items-center justify-center mb-8 rotate-3">
                    <XCircle size={48} strokeWidth={2.5} />
                </div>
                <h2 className="text-3xl font-black mb-4">Erreur de Synchronisation</h2>
                <p className="text-text-muted font-medium mb-10 max-w-md mx-auto leading-relaxed">{error}</p>
                <button 
                    onClick={() => window.location.reload()} 
                    className="px-10 py-4 bg-primary text-white font-black rounded-2xl shadow-2xl shadow-primary/30 hover:scale-[1.05] active:scale-95 transition-all flex items-center gap-3 mx-auto"
                >
                    <ArrowLeft size={18} className="rotate-90" />
                    Réessayer maintenant
                </button>
            </div>
        );
    }

    const getImageUrl = (imagePath: string) => {
        const defaultImage = 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800&auto=format&fit=crop&q=80';
        if (!imagePath) return defaultImage;
        if (imagePath.startsWith('http') || imagePath.startsWith('data:')) return imagePath;
        return `${API_FORMATEUR}/files/${imagePath}`;
    };

    return (
        <div className="bg-background text-text transition-colors duration-300 min-h-full">
            <div className="animate-fade-in space-y-8 p-1 sm:p-2">
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest rounded-lg border border-primary/20">Tableau de bord</span>
                            <h1 className="text-4xl font-black tracking-tight">Mes Parcours Inscrits</h1>
                        </div>
                        <p className="text-text-muted font-medium opacity-70">Gérez vos formations thématiques et suivez votre progression en temps réel.</p>
                    </div>
                    <button 
                        className="flex items-center gap-3 px-6 py-3 bg-surface border border-glass-border rounded-2xl text-text-muted font-bold hover:bg-surface-hover hover:text-primary transition-all group shadow-sm hover:shadow-md"
                        onClick={() => navigate('/bundle-catalog')}
                    >
                        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> 
                        Retour au catalogue
                    </button>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:flex lg:items-center lg:justify-between mb-2">
                    <div className="relative max-w-md w-full">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-text-muted opacity-40 shadow-xl" size={20} />
                        <input 
                            type="text" 
                            placeholder="Quelle expertise recherchez-vous ?" 
                            className="w-full pl-14 pr-6 py-4 bg-surface border border-glass-border rounded-[22px] text-text focus:outline-none focus:border-primary/50 transition-all font-bold placeholder:text-text-muted/40 shadow-inner"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    
                    <div className="flex items-center gap-3 text-text-muted font-black text-[10px] uppercase tracking-widest bg-surface/50 px-4 py-2 rounded-xl border border-glass-border shadow-sm">
                        Total: <span className="text-primary text-sm">{filtered.length}</span>
                    </div>
                </div>

                {filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-28 bg-surface/30 border-2 border-glass-border border-dashed rounded-[50px] text-text-muted group">
                        <div className="w-24 h-24 bg-surface rounded-full flex items-center justify-center mb-8 shadow-xl group-hover:scale-110 transition-transform duration-500">
                            <Layers size={48} strokeWidth={1} className="opacity-20 text-primary" />
                        </div>
                        <h2 className="text-3xl font-black text-text mb-3">Aucun parcours trouvé</h2>
                        <p className="font-bold opacity-50 max-w-sm text-center px-4">Vous n'avez aucune inscription active correspondant à ces critères.</p>
                        <button 
                            className="mt-10 text-primary font-black flex items-center gap-2 hover:underline"
                            onClick={() => navigate('/bundle-catalog')}
                        >
                            Découvrir le catalogue <ChevronRight size={18} />
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-10">
                        <AnimatePresence>
                            {filtered.map((item, idx) => {
                                const { enrollment, progress } = item;
                                const bundle = getBundleInfo(enrollment.bundleId);
                                if (!bundle) return null;
                                
                                return (
                                    <motion.div 
                                        key={enrollment.id}
                                        layout
                                        initial={{ opacity: 0, y: 30 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.08, duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
                                        className="group bg-surface border border-glass-border rounded-[40px] overflow-hidden hover:scale-[1.03] transition-all duration-500 flex flex-col h-full shadow-2xl shadow-black/10 hover:shadow-primary/5 relative"
                                    >
                                        <div className="h-60 bg-[#1e293b] relative overflow-hidden flex items-center justify-center">
                                            {bundle.coverImage ? (
                                                <img 
                                                    src={getImageUrl(bundle.coverImage)} 
                                                    alt={bundle.title}
                                                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-125"
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
                                                <BookOpen size={64} className="text-white/40" />
                                            </div>
                                            
                                            <div className={`absolute top-6 left-6 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-2xl z-10 bg-white text-primary`}>
                                                PARCOURS
                                            </div>

                                            <div className={`absolute top-6 right-6 px-5 py-2.5 rounded-[20px] text-[10px] font-black uppercase tracking-[0.2em] backdrop-blur-3xl border border-white/20 shadow-2xl flex items-center gap-2 text-white z-10
                                                ${enrollment.status === 'PENDING' ? 'bg-orange-500/90' : 
                                                enrollment.status === 'ACCEPTED' ? 'bg-emerald-500/90' : 'bg-rose-500/90'}`}
                                            >
                                                {enrollment.status === 'PENDING' && <Clock size={14} strokeWidth={3} className="animate-pulse" />}
                                                {enrollment.status === 'ACCEPTED' && <CheckCircle size={14} strokeWidth={3} />}
                                                {enrollment.status === 'REJECTED' && <XCircle size={14} strokeWidth={3} />}
                                                {enrollment.status === 'PENDING' ? 'En attente' : enrollment.status === 'ACCEPTED' ? 'Admis' : 'Refusé'}
                                            </div>
                                        </div>

                                        <div className="p-10 flex flex-col flex-1 relative">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="text-[11px] font-black text-primary uppercase tracking-[0.3em]">
                                                    {bundle.specialite?.nom || 'Poursuite d\'expertise'}
                                                </div>
                                                {enrollment.status === 'ACCEPTED' && (
                                                    <div className="text-[10px] font-black text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-md uppercase tracking-widest">
                                                        {Math.round(progress)}%
                                                    </div>
                                                )}
                                            </div>
                                            
                                            <h3 className="text-2xl font-black text-text mb-4 leading-tight group-hover:text-primary transition-colors line-clamp-2">
                                                {bundle.title}
                                            </h3>

                                            {enrollment.status === 'ACCEPTED' && (
                                                <div className="mb-6 space-y-2">
                                                    <div className="h-1.5 w-full bg-glass-border rounded-full overflow-hidden">
                                                        <motion.div 
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${progress}%` }}
                                                            transition={{ duration: 1, delay: 0.5 }}
                                                            className="h-full bg-gradient-to-r from-primary to-emerald-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                            
                                            {/* Description removed as requested */}

                                            
                                            <div className="pt-8 border-t border-glass-border flex justify-between items-center">
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-[10px] text-text-muted font-black uppercase tracking-widest opacity-40">Inscription</span>
                                                    <div className="text-xs font-bold text-text-muted flex items-center gap-2">
                                                        <Calendar size={12} className="text-primary/60" />
                                                        {new Date(enrollment.enrolledAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                    </div>
                                                </div>
                                                
                                                {enrollment.status === 'ACCEPTED' ? (
                                                    <div className="flex gap-2">
                                                        <button 
                                                            className="px-8 py-4 bg-primary text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-primary-hover shadow-xl shadow-primary/30 hover:shadow-primary/50 transition-all active:scale-95 flex items-center gap-2 group/btn"
                                                            onClick={() => navigate(`/bundle/${bundle.id}`)}
                                                        >
                                                            Démarrer
                                                            <ChevronRight size={16} className="group-hover/btn:translate-x-1.5 transition-transform" />
                                                        </button>

                                                        {Math.round(progress) === 100 && (
                                                            <button 
                                                                className="px-6 py-4 bg-emerald-500 text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-emerald-600 shadow-xl shadow-emerald-500/30 transition-all active:scale-95 flex items-center gap-2 group/btn"
                                                                onClick={() => setSelectedCertificate({ id: bundle.id, enrollmentId: enrollment.id, title: bundle.title })}
                                                            >
                                                                <Award size={16} />
                                                                Certificat
                                                            </button>
                                                        )}
                                                    </div>
                                                ) : enrollment.status === 'PENDING' ? (
                                                    <div className="px-6 py-3 bg-surface-hover rounded-2xl text-[10px] font-black text-text-muted/60 uppercase tracking-widest border border-glass-border flex items-center gap-2">
                                                        <Clock size={12} />
                                                        Examen...
                                                    </div>
                                                ) : (
                                                    <div className="px-6 py-3 bg-rose-500/10 text-rose-500 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-rose-500/20">
                                                        Refusé
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            {selectedCertificate && (
                <BundleCertificateModal 
                    isOpen={!!selectedCertificate}
                    onClose={() => setSelectedCertificate(null)}
                    bundleId={selectedCertificate?.id || 0}
                    enrollmentId={selectedCertificate?.enrollmentId || 0}
                    bundleTitle={selectedCertificate?.title || ''}
                />
            )}
        </div>
    );
};

export default MyEnrolledBundlesPage;
