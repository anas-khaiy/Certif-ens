import { useState, useEffect } from 'react';
import {
    Plus,
    Search,
    Edit2,
    Trash2,
    FileUp,
    FileDown,
    Download,
    X,
    ChevronLeft,
    ChevronRight,
    UserCircle,
    Mail,
    BookOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Trainer } from '../types';
import { exportToExcel, importFromExcel, downloadSampleExcel } from '../utils/excelUtils';

const TrainersPage = () => {
    const [trainers, setTrainers] = useState<Trainer[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [trainerToDelete, setTrainerToDelete] = useState<string | null>(null);
    const [editingTrainer, setEditingTrainer] = useState<Trainer | null>(null);
    const [formData, setFormData] = useState({ nom: '', prenom: '', email: '', specialite: '' });

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 6;

    useEffect(() => {
        const saved = localStorage.getItem('trainers');
        if (saved && JSON.parse(saved).length < 20) {
            loadInitialData();
        } else if (saved) {
            try {
                setTrainers(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to parse trainers", e);
                loadInitialData();
            }
        } else {
            loadInitialData();
        }
    }, []);

    const loadInitialData = () => {
        const initial: Trainer[] = Array.from({ length: 50 }).map((_, i) => ({
            id: (i + 1).toString(),
            nom: `Formateur ${i + 1}`,
            prenom: `Prénom`,
            email: `trainer${i + 1}@example.com`,
            specialite: i % 2 === 0 ? 'Informatique' : 'Gestion'
        }));
        setTrainers(initial);
        localStorage.setItem('trainers', JSON.stringify(initial));
    };

    const saveToLocal = (data: Trainer[]) => {
        setTrainers(data);
        localStorage.setItem('trainers', JSON.stringify(data));
    };

    const handleAddOrUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingTrainer) {
            const updated = trainers.map(t =>
                t.id === editingTrainer.id ? { ...t, ...formData } : t
            );
            saveToLocal(updated);
        } else {
            const newTrainer = {
                id: Math.random().toString(36).substr(2, 9),
                ...formData
            };
            saveToLocal([...trainers, newTrainer]);
        }
        closeModal();
    };

    const handleDeleteClick = (id: string) => {
        setTrainerToDelete(id);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = () => {
        if (trainerToDelete) {
            const filtered = trainers.filter(t => t.id !== trainerToDelete);
            saveToLocal(filtered);
            const newTotalPages = Math.ceil(filtered.length / itemsPerPage);
            if (currentPage > newTotalPages && newTotalPages > 0) {
                setCurrentPage(newTotalPages);
            }
            setIsDeleteModalOpen(false);
            setTrainerToDelete(null);
        }
    };

    const openModal = (trainer?: Trainer) => {
        if (trainer) {
            setEditingTrainer(trainer);
            setFormData({
                nom: trainer.nom || '',
                prenom: trainer.prenom || '',
                email: trainer.email || '',
                specialite: trainer.specialite || ''
            });
        } else {
            setEditingTrainer(null);
            setFormData({ nom: '', prenom: '', email: '', specialite: '' });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingTrainer(null);
    };

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const data = await importFromExcel(file);
            const newTrainers = data.map(item => ({
                id: Math.random().toString(36).substr(2, 9),
                nom: item.nom || item.Nom || '',
                prenom: item.prenom || item.Prenom || '',
                email: item.email || item.Email || '',
                specialite: item.specialite || item.Specialite || ''
            }));
            saveToLocal([...trainers, ...newTrainers]);
        }
        e.target.value = '';
    };

    const filteredTrainers = trainers.filter(t => {
        const search = searchTerm.toLowerCase();
        return (
            (t.nom || '').toLowerCase().includes(search) ||
            (t.prenom || '').toLowerCase().includes(search) ||
            (t.email || '').toLowerCase().includes(search) ||
            (t.specialite || '').toLowerCase().includes(search)
        );
    });

    const totalPages = Math.ceil(filteredTrainers.length / itemsPerPage);
    const currentItems = filteredTrainers.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Smart Pagination Range
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
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold">Gestion des Formateurs</h2>
                    <p className="text-text-muted">Gérez vos formateurs.</p>
                </div>
                <div className="grid grid-cols-2 md:flex md:flex-wrap gap-3 w-full md:w-auto">
                    <button onClick={() => downloadSampleExcel(['nom', 'prenom', 'email', 'specialite'], 'formateurs')} className="action-sample action-btn w-full md:w-auto">
                        <Download size={18} />
                        Sample
                    </button>
                    <label className="action-import cursor-pointer action-btn w-full md:w-auto">
                        <FileUp size={18} />
                        Importer
                        <input type="file" accept=".xlsx, .xls" className="hidden" onChange={handleImport} />
                    </label>
                    <button onClick={() => exportToExcel(trainers, 'liste_formateurs')} className="action-export action-btn w-full md:w-auto">
                        <FileDown size={18} />
                        Exporter
                    </button>
                    <button onClick={() => openModal()} className="primary action-btn w-full md:w-auto">
                        <Plus size={18} />
                        Ajouter Formateur
                    </button>
                </div>
            </div>

            <div className="glass overflow-hidden shadow-xl">
                <div className="p-6 border-b border-glass-border">
                    <div className="search-container w-full max-w-md">
                        <div className="search-icon"><Search size={18} /></div>
                        <input
                            type="text"
                            placeholder="Rechercher..."
                            className="search-input"
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1);
                            }}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-surface-hover/50 text-text-muted text-xs uppercase tracking-widest">
                                <th>Nom & Prénom</th>
                                <th>Email</th>
                                <th>Spécialité</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-glass-border">
                            {currentItems.length > 0 ? (
                                currentItems.map((trainer, idx) => (
                                    <tr key={trainer.id || `trainer-${idx}`} className="hover:bg-surface-hover/30 transition-colors">
                                        <td className="font-bold text-text">{trainer.nom} {trainer.prenom}</td>
                                        <td>{trainer.email}</td>
                                        <td>
                                            <span className="tag tag-licence font-bold">{trainer.specialite || 'N/A'}</span>
                                        </td>
                                        <td>
                                            <div className="flex justify-center gap-2">
                                                <button onClick={() => openModal(trainer)} className="w-9 h-9 p-0 text-primary hover:bg-primary/10 rounded-xl transition-all icon-container">
                                                    <Edit2 size={16} />
                                                </button>
                                                <button onClick={(e) => { e.stopPropagation(); handleDeleteClick(trainer.id); }} className="w-9 h-9 p-0 text-error hover:bg-error/10 rounded-xl transition-all icon-container">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="py-20 text-text-muted font-medium">Aucun formateur trouvé</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {totalPages > 1 && (
                    <div className="pagination border-t border-glass-border bg-surface-hover/10 px-6 py-4 flex items-center justify-between">
                        <div className="pagination-info">
                            Affichage <span className="text-text font-bold">{(currentPage - 1) * itemsPerPage + 1}</span> à <span className="text-text font-bold">{Math.min(currentPage * itemsPerPage, filteredTrainers.length)}</span> sur <span className="text-text font-bold">{filteredTrainers.length}</span> formateurs
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage((p: number) => Math.max(1, p - 1))}
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
                                            className={`w-10 h-10 rounded-xl font-bold transition-all text-xs border ${currentPage === page ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-110 z-10' : 'bg-surface border-glass-border text-text-muted hover:border-primary hover:text-primary'}`}
                                        >
                                            {page}
                                        </button>
                                    )
                                ))}
                            </div>
                            <button
                                onClick={() => setCurrentPage((p: number) => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface border border-glass-border text-text-muted hover:text-primary disabled:opacity-20 transition-all font-bold"
                                aria-label="Next page"
                            >
                                <ChevronRight size={20} style={{ minWidth: '20px', minHeight: '20px', display: 'block' }} strokeWidth={2.5} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <AnimatePresence mode="wait">
                {isModalOpen && (
                    <div className="modal-overlay" onClick={closeModal}>
                        <motion.div
                            key="edit-modal"
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
                                    <UserCircle size={22} />
                                </div>
                                {editingTrainer ? 'Modifier' : 'Ajouter'} Formateur
                            </h3>

                            <form onSubmit={handleAddOrUpdate} className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="form-group">
                                        <label className="form-label">Nom</label>
                                        <input type="text" required className="form-input" value={formData.nom} onChange={(e) => setFormData({ ...formData, nom: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Prénom</label>
                                        <input type="text" required className="form-input" value={formData.prenom} onChange={(e) => setFormData({ ...formData, prenom: e.target.value })} />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Adresse Email</label>
                                    <div className="relative">
                                        <div className="search-icon" style={{ left: '16px' }}><Mail size={18} /></div>
                                        <input
                                            type="email"
                                            required
                                            className="form-input"
                                            style={{ paddingLeft: '48px' }}
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Spécialité</label>
                                    <div className="relative">
                                        <div className="search-icon" style={{ left: '16px' }}><BookOpen size={18} /></div>
                                        <input
                                            type="text"
                                            required
                                            className="form-input"
                                            style={{ paddingLeft: '48px' }}
                                            value={formData.specialite}
                                            onChange={(e) => setFormData({ ...formData, specialite: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="pt-6 flex gap-4">
                                    <button type="button" onClick={closeModal} className="flex-1 secondary h-12">Annuler</button>
                                    <button type="submit" className="flex-1 primary h-12">
                                        {editingTrainer ? 'Mettre à jour' : 'Ajouter le formateur'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}

                {isDeleteModalOpen && (
                    <div className="modal-overlay" onClick={() => setIsDeleteModalOpen(false)}>
                        <motion.div
                            key="delete-modal"
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
                                Voulez-vous vraiment supprimer ce formateur ? Cette action est irréversible.
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
        </div>
    );
};

export default TrainersPage;
