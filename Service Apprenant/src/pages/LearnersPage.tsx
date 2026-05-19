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
    GraduationCap,
    Mail,
    Hash,
    BookOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Learner } from '../types';
import { exportToExcel, importFromExcel, downloadSampleExcel } from '../utils/excelUtils';
import ConfirmationModal from '../components/ConfirmationModal';

const LearnersPage = () => {
    const [learners, setLearners] = useState<Learner[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [learnerToDelete, setLearnerToDelete] = useState<string | null>(null);
    const [editingLearner, setEditingLearner] = useState<Learner | null>(null);
    const [formData, setFormData] = useState({ nom: '', prenom: '', cne: '', email: '', specialite: '' });

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 6;

    useEffect(() => {
        const saved = localStorage.getItem('learners');
        if (saved && JSON.parse(saved).length < 20) {
            loadInitialData();
        } else if (saved) {
            try {
                setLearners(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to parse learners", e);
                loadInitialData();
            }
        } else {
            loadInitialData();
        }
    }, []);

    const loadInitialData = () => {
        const initial: Learner[] = Array.from({ length: 60 }).map((_, i) => ({
            id: (i + 1).toString(),
            nom: `Nom ${i + 1}`,
            prenom: `Prénom ${i + 1}`,
            cne: `G${100000000 + i}`,
            email: `learner${i + 1}@example.com`,
            specialite: i % 2 === 0 ? 'Informatique' : 'Gestion'
        }));
        setLearners(initial);
        localStorage.setItem('learners', JSON.stringify(initial));
    };

    const saveToLocal = (data: Learner[]) => {
        setLearners(data);
        localStorage.setItem('learners', JSON.stringify(data));
    };

    const handleAddOrUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingLearner) {
            const updated = learners.map(l =>
                l.id === editingLearner.id ? { ...l, ...formData } : l
            );
            saveToLocal(updated);
        } else {
            const newLearner = {
                id: Math.random().toString(36).substr(2, 9),
                ...formData
            };
            saveToLocal([...learners, newLearner]);
        }
        closeModal();
    };

    const handleDeleteClick = (id: string) => {
        setLearnerToDelete(id);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = () => {
        if (learnerToDelete) {
            const filtered = learners.filter(l => l.id !== learnerToDelete);
            saveToLocal(filtered);
            const newTotalPages = Math.ceil(filtered.length / itemsPerPage);
            if (currentPage > newTotalPages && newTotalPages > 0) {
                setCurrentPage(newTotalPages);
            }
            setIsDeleteModalOpen(false);
            setLearnerToDelete(null);
        }
    };

    const openModal = (learner?: Learner) => {
        if (learner) {
            setEditingLearner(learner);
            setFormData({
                nom: learner.nom || '',
                prenom: learner.prenom || '',
                cne: learner.cne || '',
                email: learner.email || '',
                specialite: learner.specialite || ''
            });
        } else {
            setEditingLearner(null);
            setFormData({ nom: '', prenom: '', cne: '', email: '', specialite: '' });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingLearner(null);
    };

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const data = await importFromExcel(file);
            const newLearners = data.map(item => ({
                id: Math.random().toString(36).substr(2, 9),
                nom: item.nom || item.Nom || '',
                prenom: item.prenom || item.Prenom || '',
                cne: item.cne || item.CNE || '',
                email: item.email || item.Email || '',
                specialite: item.specialite || item.Specialite || ''
            }));
            saveToLocal([...learners, ...newLearners]);
        }
        e.target.value = '';
    };

    const filteredLearners = learners.filter(l => {
        const search = searchTerm.toLowerCase();
        return (
            (l.nom || '').toLowerCase().includes(search) ||
            (l.prenom || '').toLowerCase().includes(search) ||
            (l.cne || '').toLowerCase().includes(search) ||
            (l.email || '').toLowerCase().includes(search) ||
            (l.specialite || '').toLowerCase().includes(search)
        );
    });

    const totalPages = Math.ceil(filteredLearners.length / itemsPerPage);
    const currentItems = filteredLearners.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Smart Pagination Range
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

    return (
        <>
            <div className="space-y-6 animate-fade-in">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h2 className="text-3xl font-bold">Gestion des Apprenants</h2>
                        <p className="text-text-muted">Gérez vos apprenants.</p>
                    </div>
                    <div className="grid grid-cols-2 md:flex md:flex-wrap gap-3 w-full md:w-auto">
                        <button onClick={() => downloadSampleExcel(['nom', 'prenom', 'cne', 'email', 'specialite'], 'apprenants')} className="action-sample action-btn w-full md:w-auto">
                            <Download size={18} />
                            Sample
                        </button>
                        <label className="action-import cursor-pointer action-btn w-full md:w-auto">
                            <FileUp size={18} />
                            Importer
                            <input type="file" accept=".xlsx, .xls" className="hidden" onChange={handleImport} />
                        </label>
                        <button onClick={() => exportToExcel(learners, 'liste_apprenants')} className="action-export action-btn w-full md:w-auto">
                            <FileDown size={18} />
                            Exporter
                        </button>
                        <button onClick={() => openModal()} className="primary action-btn w-full md:w-auto">
                            <Plus size={18} />
                            Ajouter Apprenant
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
                                    <th>CNE</th>
                                    <th>Nom & Prénom</th>
                                    <th>Email</th>
                                    <th>Spécialité</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-glass-border">
                                {currentItems.length > 0 ? (
                                    currentItems.map((learner) => (
                                        <tr key={learner.id} className="hover:bg-surface-hover/30 transition-colors">
                                            <td className="font-mono text-xs text-primary font-bold">{learner.cne}</td>
                                            <td className="font-bold text-text">{learner.nom} {learner.prenom}</td>
                                            <td>{learner.email}</td>
                                            <td>
                                                <span className="tag tag-master font-bold">{learner.specialite}</span>
                                            </td>
                                            <td>
                                                <div className="flex justify-center gap-2">
                                                    <button onClick={() => openModal(learner)} className="w-9 h-9 p-0 text-primary hover:bg-primary/10 rounded-xl transition-all icon-container">
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button onClick={(e) => { e.stopPropagation(); handleDeleteClick(learner.id); }} className="w-9 h-9 p-0 text-error hover:bg-error/10 rounded-xl transition-all icon-container">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="py-20 text-text-muted font-medium">Aucun apprenant trouvé</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {totalPages > 1 && (
                        <div className="pagination border-t border-glass-border bg-surface-hover/10 px-6 py-4 flex items-center justify-between">
                            <div className="pagination-info">
                                Affichage <span className="text-text font-bold">{(currentPage - 1) * itemsPerPage + 1}</span> à <span className="text-text font-bold">{Math.min(currentPage * itemsPerPage, filteredLearners.length)}</span> sur <span className="text-text font-bold">{filteredLearners.length}</span> apprenants
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
                                                className={`w-10 h-10 rounded-xl font-bold transition-all text-xs border ${currentPage === page
                                                    ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20'
                                                    : 'bg-surface border-glass-border text-text-muted hover:border-primary hover:text-primary'}`}
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
            </div>

            <AnimatePresence>
                {isModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="modal-overlay"
                        onClick={closeModal}
                    >
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
                                    <GraduationCap size={22} />
                                </div>
                                {editingLearner ? 'Modifier' : 'Ajouter'} Apprenant
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

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="form-group">
                                        <label className="form-label">CNE</label>
                                        <div className="relative">
                                            <div className="search-icon" style={{ left: '16px' }}><Hash size={18} /></div>
                                            <input
                                                type="text"
                                                required
                                                className="form-input"
                                                style={{ paddingLeft: '48px' }}
                                                value={formData.cne}
                                                onChange={(e) => setFormData({ ...formData, cne: e.target.value })}
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

                                <div className="pt-6 flex gap-4">
                                    <button type="button" onClick={closeModal} className="flex-1 secondary h-12">Annuler</button>
                                    <button type="submit" className="flex-1 primary h-12">
                                        {editingLearner ? 'Mettre à jour' : 'Ajouter l\'apprenant'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                title="Confirmer la suppression"
                message="Voulez-vous vraiment supprimer cet apprenant ? Cette action est irréversible."
                confirmText="Supprimer"
                cancelText="Annuler"
            />
        </>
    );
};

export default LearnersPage;
