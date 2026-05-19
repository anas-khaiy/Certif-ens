import { useState, useEffect } from 'react';
import {
    Plus,
    Search,
    Edit2,
    Trash2,
    X,
    BookOpen,
    Layers,
    RefreshCw,
    ChevronLeft,
    ChevronRight,
    Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Specialite } from '../types';
import api from '../api/api-client';

const SpecialitiesPage = () => {
    const [specialities, setSpecialities] = useState<Specialite[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [specialityToDelete, setSpecialityToDelete] = useState<number | null>(null);
    const [editingSpeciality, setEditingSpeciality] = useState<Specialite | null>(null);
    const [formData, setFormData] = useState<{ nom: string }>({
        nom: ''
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    useEffect(() => {
        fetchSpecialities();
    }, []);

    const fetchSpecialities = async () => {
        setIsLoading(true);
        try {
            const response = await api.get('/specialites');
            setSpecialities(response.data);
        } catch (error) {
            console.error("Failed to fetch specialities", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddOrUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.nom.trim()) {
            return;
        }

        setIsSubmitting(true);

        const payload = {
            nom: formData.nom.trim()
        };

        try {
            if (editingSpeciality) {
                await api.put(`/specialites/${editingSpeciality.id}`, payload);
            } else {
                await api.post('/specialites', payload);
            }
            fetchSpecialities();
            setMessage({ type: 'success', text: `Spécialité ${editingSpeciality ? 'mise à jour' : 'ajoutée'} avec succès` });
            closeModal();
        } catch (error: any) {
            console.error("Failed to save speciality", error);
            const errorMsg = error.response?.data?.message || error.message || "Une erreur est survenue";
            setMessage({ type: 'error', text: errorMsg });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteClick = (id: number) => {
        setSpecialityToDelete(id);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (specialityToDelete) {
            try {
                await api.delete(`/specialites/${specialityToDelete}`);
                fetchSpecialities();
                setIsDeleteModalOpen(false);
                setSpecialityToDelete(null);
            } catch (error: any) {
                console.error("Failed to delete speciality", error);
                setIsDeleteModalOpen(false);
                setSpecialityToDelete(null);
                alert("Impossible de supprimer cette spécialité car elle est liée à d'autres données (étudiants, cours, etc.).");
            }
        }
    };

    const openModal = (spec?: Specialite) => {
        if (spec) {
            setEditingSpeciality(spec);
            setFormData({
                nom: spec.nom || ''
            });
        } else {
            setEditingSpeciality(null);
            setFormData({ nom: '' });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingSpeciality(null);
    };

    const filteredSpecs = specialities.filter(s => {
        const search = searchTerm.toLowerCase();
        return (s.nom || '').toLowerCase().includes(search);
    });

    // Pagination Logic
    const totalPages = Math.ceil(filteredSpecs.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentItems = filteredSpecs.slice(startIndex, endIndex);

    // Reset pagination when searching
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    const getPages = () => {
        const pages = [];
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

    if (isLoading) {
        return (
            <div className="h-[60vh] flex items-center justify-center">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
            </div>
        );
    }

    return (
        <>
            <div className="space-y-6 animate-fade-in px-4 md:px-0">
                <div className="flex flex-col gap-6">
                    <div>
                        <h2 className="text-3xl font-bold">Gestion des Spécialités</h2>
                        <p className="text-text-muted mb-4">Configurez les filières d'études disponibles.</p>

                        {message && (
                            <div className={`mb-6 p-4 rounded-xl flex items-center justify-between ${message.type === 'success' ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-error/10 text-error border border-error/20'}`}>
                                <div className="flex items-center gap-2 font-bold">
                                    {message.type === 'success' ? <RefreshCw size={18} className="animate-spin" /> : <X size={18} />}
                                    {message.text}
                                </div>
                                <button onClick={() => setMessage(null)} className="hover:opacity-70">
                                    <X size={18} />
                                </button>
                            </div>
                        )}

                        <button onClick={() => openModal()} className="primary action-btn w-full md:w-auto">
                            <Plus size={18} />
                            Ajouter Spécialité
                        </button>
                    </div>
                </div>

                <div className="glass overflow-hidden shadow-xl">
                    <div className="p-6 border-b border-glass-border">
                        <div className="search-container w-full max-w-md">
                            <div className="search-icon"><Search size={18} /></div>
                            <input
                                type="text"
                                placeholder="Rechercher une spécialité..."
                                className="search-input"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-surface-hover/50 text-text-muted text-xs uppercase tracking-widest">
                                    <th>Nom de la Filière</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-glass-border">
                                {currentItems.length > 0 ? (
                                    currentItems.map((spec) => (
                                        <tr key={spec.id} className="hover:bg-surface-hover/30 transition-colors">
                                            <td className="font-bold text-text capitalize">{spec.nom}</td>
                                            <td>
                                                <div className="flex justify-center gap-2">
                                                    <button onClick={() => openModal(spec)} className="w-9 h-9 p-0 text-primary hover:bg-primary/10 rounded-xl transition-all icon-container">
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button onClick={(e) => { e.stopPropagation(); handleDeleteClick(spec.id); }} className="w-9 h-9 p-0 text-error hover:bg-error/10 rounded-xl transition-all icon-container">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={2} className="py-20 text-text-muted font-medium text-center">Aucune spécialité trouvée</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {filteredSpecs.length > 0 && (
                        <div className="pagination border-t border-glass-border bg-surface-hover/10 px-6 py-4 flex items-center justify-between">
                            <div className="pagination-info">
                                Affichage <span className="text-text font-bold">{(currentPage - 1) * itemsPerPage + 1}</span> à <span className="text-text font-bold">{Math.min(currentPage * itemsPerPage, filteredSpecs.length)}</span> sur <span className="text-text font-bold">{filteredSpecs.length}</span> spécialités
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => setCurrentPage((p: number) => Math.max(1, p - 1))} disabled={currentPage === 1} className="w-10 h-10 p-0 rounded-xl bg-background border border-glass-border text-text-muted hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-all icon-container">
                                    <ChevronLeft size={18} />
                                </button>
                                <div className="flex gap-1.5">
                                    {getPages().map((page, i) => (
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
                                <button onClick={() => setCurrentPage((p: number) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="w-10 h-10 p-0 rounded-xl bg-background border border-glass-border text-text-muted hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-all icon-container">
                                    <ChevronRight size={18} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>

            </div>

            <AnimatePresence>
                {isModalOpen && (
                    <div className="modal-overlay" onClick={closeModal}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 30 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 30 }}
                            className="modal-content"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="modal-close" onClick={closeModal}>
                                <X size={22} />
                            </div>

                            <h3 className="text-2xl font-bold mb-8 flex items-center gap-3">
                                <div className="p-2 bg-primary/10 rounded-xl text-primary">
                                    <Layers size={22} />
                                </div>
                                {editingSpeciality ? 'Modifier' : 'Ajouter'} Spécialité
                            </h3>

                            <form onSubmit={handleAddOrUpdate} className="space-y-6">
                                <div className="form-group">
                                    <label className="form-label">Nom de la filière</label>
                                    <div className="relative">
                                        <div className="search-icon" style={{ left: '16px' }}><BookOpen size={18} /></div>
                                        <input
                                            type="text"
                                            required
                                            className="form-input"
                                            style={{ paddingLeft: '48px' }}
                                            placeholder="Ex: Informatique"
                                            value={formData.nom}
                                            onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="pt-6 flex gap-4">
                                    <button type="button" onClick={closeModal} className="flex-1 secondary h-12">Annuler</button>
                                    <button type="submit" disabled={isSubmitting} className="flex-1 primary h-12 disabled:opacity-50 disabled:cursor-not-allowed">
                                        {isSubmitting ? <Loader2 size={18} className="animate-spin mx-auto" /> : (editingSpeciality ? 'Enregistrer les modifications' : 'Créer la spécialité')}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
            <AnimatePresence>
                {isDeleteModalOpen && (
                    <div className="modal-overlay" onClick={() => setIsDeleteModalOpen(false)}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 30 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 30 }}
                            className="glass max-w-md w-full p-8 space-y-6 relative overflow-hidden text-center"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="w-20 h-20 bg-error/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Trash2 size={40} className="text-error" />
                            </div>
                            <h3 className="text-2xl font-bold mb-2">Confirmer la suppression</h3>
                            <p className="text-text-muted mb-6">
                                Voulez-vous vraiment supprimer cette spécialité ? Cette action est irréversible.
                            </p>
                            <div className="flex gap-4">
                                <button
                                    onClick={() => setIsDeleteModalOpen(false)}
                                    className="flex-1 px-6 py-3 rounded-xl bg-surface border border-glass-border font-bold hover:bg-surface-hover transition-all text-text"
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    className="flex-1 px-6 py-3 rounded-xl bg-error text-white font-bold hover:bg-error/80 shadow-lg shadow-error/20 transition-all"
                                >
                                    Supprimer
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
};

export default SpecialitiesPage;
