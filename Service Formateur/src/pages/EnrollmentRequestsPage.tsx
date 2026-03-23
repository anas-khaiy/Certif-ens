import React, { useState, useEffect } from 'react';
import {
    Clock,
    Search,
    BookOpen,
    ArrowLeft,
    Check,
    X,
    Filter,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api-client';

interface Enrollment {
    id: number;
    course: {
        id: number;
        title: string;
    };
    apprenant: {
        id: number;
        prenom: string;
        nom: string;
        email: string;
        specialite?: {
            id: number;
            nom: string;
        };
    };
    status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
    requestedAt: string;
}

const EnrollmentRequestsPage: React.FC = () => {
    const navigate = useNavigate();
    const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'ACCEPTED' | 'REJECTED'>('PENDING');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    const fetchEnrollments = async () => {
        setLoading(true);
        try {
            const response = await api.get('/enrollments');
            setEnrollments(response.data);
        } catch (error) {
            console.error('Error fetching enrollments:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEnrollments();
    }, []);

    const handleAction = async (id: number, action: 'accept' | 'reject') => {
        try {
            await api.put(`/enrollments/${id}/${action}`);
            fetchEnrollments();
        } catch (error) {
            console.error(`Error ${action}ing enrollment:`, error);
        }
    };

    const filteredEnrollments = enrollments.filter(e => {
        const matchesSearch =
            (e.apprenant.prenom || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (e.apprenant.nom || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (e.course.title || '').toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === 'ALL' || e.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const totalPages = Math.ceil(filteredEnrollments.length / itemsPerPage);
    const currentItems = filteredEnrollments.slice(
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

    return (
        <div className="space-y-8 animate-fade-in pb-12">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 hover:bg-surface-hover rounded-xl transition-colors text-text-muted"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-3xl font-black text-text tracking-tight flex items-center gap-3">
                            Gestion des Inscriptions
                        </h1>
                        <p className="text-text-muted font-medium mt-1">Acceptez ou refusez les demandes d'inscription de vos apprenants.</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={20} />
                    <input
                        type="text"
                        placeholder="Rechercher par apprenant ou cours..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-surface border border-glass-border rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-primary/50 transition-all shadow-sm text-text"
                    />
                </div>
                <div className="flex items-center gap-2 bg-surface border border-glass-border p-1 rounded-2xl">
                    {(['ALL', 'PENDING', 'ACCEPTED', 'REJECTED'] as const).map((status) => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={`flex-1 py-3 px-4 rounded-xl text-sm font-black transition-all ${statusFilter === status
                                    ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                    : 'text-text-muted hover:bg-surface-hover hover:text-text'
                                }`}
                        >
                            {status === 'ALL' ? 'Toutes' : status === 'PENDING' ? 'En attente' : status === 'ACCEPTED' ? 'Acceptées' : 'Refusées'}
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-surface border border-glass-border rounded-3xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-surface-hover/50 border-b border-glass-border">
                                <th className="px-8 py-5 text-xs font-black uppercase tracking-widest text-text-muted">Apprenant</th>
                                <th className="px-6 py-5 text-xs font-black uppercase tracking-widest text-text-muted">Cours</th>
                                <th className="px-6 py-5 text-xs font-black uppercase tracking-widest text-text-muted text-center">Date Demande</th>
                                <th className="px-6 py-5 text-xs font-black uppercase tracking-widest text-text-muted text-center">Statut</th>
                                <th className="px-8 py-5 text-xs font-black uppercase tracking-widest text-text-muted text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-glass-border/30">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-4 animate-pulse">
                                            <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                                            <span className="font-bold text-text-muted">Chargement des demandes...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredEnrollments.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-16 h-16 rounded-full bg-surface-hover flex items-center justify-center text-text-muted">
                                                <Filter size={32} />
                                            </div>
                                            <span className="font-bold text-text-muted">Aucune demande trouvée.</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredEnrollments.length > 0 && currentItems.map((en) => (
                                    <tr key={en.id} className="hover:bg-surface-hover/30 transition-colors group">
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black shadow-sm shrink-0">
                                                    {(en.apprenant.prenom?.[0] || 'A')}{(en.apprenant.nom?.[0] || 'P')}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-text leading-tight">{en.apprenant.prenom} {en.apprenant.nom}</div>
                                                    <div className="flex flex-col">
                                                        <div className="text-[10px] text-text-muted font-medium">{en.apprenant.email}</div>
                                                        <div className="text-[10px] text-primary font-black uppercase tracking-wider">{en.apprenant.specialite?.nom || 'Non spécifiée'}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-2">
                                                <BookOpen size={16} className="text-primary" />
                                                <span className="font-bold text-text">{en.course.title}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center justify-center gap-2 text-text-muted bg-background/40 py-1.5 px-3 rounded-lg border border-glass-border/10 w-fit mx-auto">
                                                <Clock size={14} className="text-primary/70" />
                                                <span className="text-sm font-bold">{en.requestedAt ? new Date(en.requestedAt).toLocaleDateString() : 'Non définie'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-center">
                                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ${en.status === 'ACCEPTED' ? 'bg-success/10 text-success border border-success/20' :
                                                    en.status === 'REJECTED' ? 'bg-error/10 text-error border border-error/20' :
                                                        'bg-warning/20 text-warning border border-warning/30'
                                                }`}>
                                                {en.status === 'PENDING' ? 'En attente' : en.status === 'ACCEPTED' ? 'Acceptée' : 'Refusée'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center justify-end gap-3">
                                                {en.status === 'PENDING' ? (
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => handleAction(en.id, 'accept')}
                                                            className="w-11 h-11 flex items-center justify-center bg-success/20 text-success hover:bg-success hover:text-white rounded-xl transition-all shadow-sm active:scale-95 border border-success/30 shrink-0"
                                                            title="Accepter"
                                                        >
                                                            <Check size={22} strokeWidth={3} style={{ display: 'block', minWidth: '22px', minHeight: '22px' }} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleAction(en.id, 'reject')}
                                                            className="w-11 h-11 flex items-center justify-center bg-error/20 text-error hover:bg-error hover:text-white rounded-xl transition-all shadow-sm active:scale-95 border border-error/30 shrink-0"
                                                            title="Refuser"
                                                        >
                                                            <X size={22} strokeWidth={3} style={{ display: 'block', minWidth: '22px', minHeight: '22px' }} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="text-[10px] font-black text-text-muted/40 uppercase tracking-widest px-4 py-1.5 bg-surface-hover/50 rounded-full border border-glass-border">
                                                        Traitée
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6">
                    <div className="text-xs text-text-muted font-bold">
                        Affichage <span className="text-text">{(currentPage - 1) * itemsPerPage + 1}</span> à <span className="text-text">{Math.min(currentPage * itemsPerPage, filteredEnrollments.length)}</span> sur <span className="text-text">{filteredEnrollments.length}</span> demandes
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="h-10 px-4 flex items-center justify-center gap-2 rounded-xl bg-surface border border-glass-border text-text-muted hover:text-primary hover:border-primary/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all font-black text-xs"
                        >
                            <ChevronLeft size={18} strokeWidth={3} />
                            <span>Précédent</span>
                        </button>
                        <div className="flex gap-1">
                            {getPageNumbers().map((page, index) => (
                                page === '...' ? (
                                    <span key={`dots-${index}`} className="w-10 h-10 flex items-center justify-center text-text-muted font-bold tracking-widest text-xs">...</span>
                                ) : (
                                    <button
                                        key={`page-${page}`}
                                        onClick={() => setCurrentPage(page as number)}
                                        className={`w-10 h-10 rounded-xl font-bold transition-all text-xs border ${currentPage === page ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-110 z-10' : 'bg-surface border-glass-border text-text-muted hover:border-primary hover:text-primary'}`}
                                    >
                                        {page}
                                    </button>
                                )
                            ))}
                        </div>
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="h-10 px-4 flex items-center justify-center gap-2 rounded-xl bg-surface border border-glass-border text-text-muted hover:text-primary hover:border-primary/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all font-black text-xs"
                        >
                            <span>Suivant</span>
                            <ChevronRight size={18} strokeWidth={3} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EnrollmentRequestsPage;
