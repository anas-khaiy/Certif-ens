import { useState, useEffect } from 'react';
import {
    Plus,
    Search,
    Edit2,
    Trash2,
    X,
    BookOpen,
    Check,
    Layers,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Speciality } from '../types';
import ConfirmationModal from '../components/ConfirmationModal';

const SpecialitiesPage = () => {
    const [specialities, setSpecialities] = useState<Speciality[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [specialityToDelete, setSpecialityToDelete] = useState<string | null>(null);
    const [editingSpeciality, setEditingSpeciality] = useState<Speciality | null>(null);
    const [formData, setFormData] = useState<{ nom: string; type: 'Licence' | 'Master'; semesters: string[] }>({
        nom: '',
        type: 'Licence',
        semesters: []
    });

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    useEffect(() => {
        const saved = localStorage.getItem('specialities');
        if (saved && saved !== '[]') {
            try {
                setSpecialities(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to parse specialities", e);
                loadInitialData();
            }
        } else {
            loadInitialData();
        }
    }, []);

    const loadInitialData = () => {
        const initial: Speciality[] = [
            { id: '1', nom: 'Génie Informatique', type: 'Licence', semesters: ['S1', 'S2', 'S3', 'S4', 'S5', 'S6'] },
            { id: '2', nom: 'Intelligence Artificielle', type: 'Master', semesters: ['S1', 'S2'] },
            { id: '3', nom: 'Génie Civil', type: 'Licence', semesters: ['S1', 'S2', 'S3', 'S4', 'S5', 'S6'] },
            { id: '4', nom: 'Management des Entreprises', type: 'Master', semesters: ['S1', 'S2'] },
            { id: '5', nom: 'Droit Public', type: 'Licence', semesters: ['S1', 'S2', 'S3', 'S4', 'S5', 'S6'] },
            { id: '6', nom: 'Finance et Comptabilité', type: 'Master', semesters: ['S1', 'S2'] },
            { id: '7', nom: 'Marketing Digital', type: 'Licence', semesters: ['S1', 'S2', 'S3', 'S4', 'S5', 'S6'] },
            { id: '8', nom: 'Ressources Humaines', type: 'Master', semesters: ['S1', 'S2'] },
            { id: '9', nom: 'Logistique et Transport', type: 'Licence', semesters: ['S1', 'S2', 'S3', 'S4', 'S5', 'S6'] },
            { id: '10', nom: 'Cybersécurité', type: 'Master', semesters: ['S1', 'S2'] },
        ];
        setSpecialities(initial);
        localStorage.setItem('specialities', JSON.stringify(initial));
    };

    const saveToLocal = (data: Speciality[]) => {
        setSpecialities(data);
        localStorage.setItem('specialities', JSON.stringify(data));
    };

    const handleAddOrUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.semesters.length === 0) {
            alert("Veuillez sélectionner au moins un semestre.");
            return;
        }

        if (editingSpeciality) {
            const updated = specialities.map(s =>
                s.id === editingSpeciality.id ? { ...s, ...formData } : s
            );
            saveToLocal(updated);
        } else {
            const newSpec: Speciality = {
                id: Math.random().toString(36).substr(2, 9),
                ...formData
            };
            saveToLocal([...specialities, newSpec]);
        }
        closeModal();
    };

    const handleDeleteClick = (id: string) => {
        setSpecialityToDelete(id);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = () => {
        if (specialityToDelete) {
            const filtered = specialities.filter(s => s.id !== specialityToDelete);
            saveToLocal(filtered);
            setIsDeleteModalOpen(false);
            setSpecialityToDelete(null);
        }
    };

    const openModal = (spec?: Speciality) => {
        if (spec) {
            setEditingSpeciality(spec);
            setFormData({
                nom: spec.nom || '',
                type: spec.type || 'Licence',
                semesters: spec.semesters || []
            });
        } else {
            setEditingSpeciality(null);
            setFormData({ nom: '', type: 'Licence', semesters: [] });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingSpeciality(null);
    };

    const toggleSemester = (sem: string) => {
        setFormData(prev => ({
            ...prev,
            semesters: [sem] // Only one semester allowed
        }));
    };

    const handleTypeChange = (type: 'Licence' | 'Master') => {
        setFormData(prev => ({
            ...prev,
            type,
            semesters: [] // Reset semesters when type changes
        }));
    };

    const filteredSpecs = specialities.filter(s => {
        const search = searchTerm.toLowerCase();
        return (
            (s.nom || '').toLowerCase().includes(search) ||
            (s.type || '').toLowerCase().includes(search)
        );
    });

    const semestersList = formData.type === 'Licence'
        ? ['S1', 'S2', 'S3', 'S4', 'S5', 'S6']
        : ['S1', 'S2'];

    // Pagination Logic
    const totalPages = Math.ceil(filteredSpecs.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentItems = filteredSpecs.slice(startIndex, endIndex);

    // Reset pagination when searching
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

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
            <div className="space-y-6 animate-fade-in px-4 md:px-0">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h2 className="text-3xl font-bold">Gestion des Spécialités</h2>
                        <p className="text-text-muted">Configurez les filières et leurs semestres respectifs.</p>
                    </div>
                    <button onClick={() => openModal()} className="primary w-full md:w-auto">
                        <Plus size={18} />
                        Ajouter Spécialité
                    </button>
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
                                    <th>Type</th>
                                    <th>Semestres</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-glass-border">
                                {currentItems.length > 0 ? (
                                    currentItems.map((spec) => (
                                        <tr key={spec.id} className="hover:bg-surface-hover/30 transition-colors">
                                            <td className="font-bold text-text">{spec.nom}</td>
                                            <td>
                                                <span className={`tag ${spec.type === 'Licence' ? 'tag-licence' : 'tag-master'}`}>
                                                    {spec.type}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="flex justify-center gap-1.5 flex-wrap">
                                                    {(spec.semesters || []).sort().map(s => (
                                                        <span key={s} className="px-2.5 py-1 rounded-lg bg-background text-[10px] font-bold border border-glass-border">
                                                            {s}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
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
                                        <td colSpan={4} className="py-20 text-text-muted font-medium">Aucune spécialité trouvée</td>
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
                                                className={`w-10 h-10 p-0 rounded-xl font-bold transition-all text-xs border ${currentPage === page
                                                    ? 'bg-primary text-white shadow-lg shadow-primary/20 border-primary'
                                                    : 'bg-surface border border-glass-border text-text-muted hover:border-primary hover:text-primary'}`}
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
                                    <Layers size={22} />
                                </div>
                                {editingSpeciality ? 'Modifier' : 'Ajouter'} Spécialité
                            </h3>

                            <form onSubmit={handleAddOrUpdate} className="space-y-6">
                                {/* Nom Field */}
                                <div className="form-group">
                                    <label className="form-label">Nom de la filière</label>
                                    <div className="relative">
                                        <div className="search-icon" style={{ left: '16px' }}><BookOpen size={18} /></div>
                                        <input
                                            type="text"
                                            required
                                            className="form-input"
                                            style={{ paddingLeft: '48px' }}
                                            placeholder="Ex: Intelligence Artificielle"
                                            value={formData.nom}
                                            onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                                        />
                                    </div>
                                </div>

                                {/* Niveau Selection */}
                                <div className="form-group">
                                    <label className="form-label">Niveau d'étude</label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <button
                                            type="button"
                                            className={`h-12 rounded-xl transition-all ${formData.type === 'Licence' ? 'bg-primary text-white shadow-lg' : 'bg-background border border-glass-border text-text-muted'}`}
                                            onClick={() => handleTypeChange('Licence')}
                                        >
                                            Licence (Bac+3)
                                        </button>
                                        <button
                                            type="button"
                                            className={`h-12 rounded-xl transition-all ${formData.type === 'Master' ? 'bg-primary text-white shadow-lg' : 'bg-background border border-glass-border text-text-muted'}`}
                                            onClick={() => handleTypeChange('Master')}
                                        >
                                            Master (Bac+5)
                                        </button>
                                    </div>
                                </div>

                                {/* Semesters Selection */}
                                <div className="form-group">
                                    <label className="form-label">Sélectionner le semestre</label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {semestersList.map(sem => (
                                            <div
                                                key={sem}
                                                onClick={() => toggleSemester(sem)}
                                                className={`cursor-pointer p-3 rounded-xl border flex items-center justify-between transition-all ${formData.semesters.includes(sem)
                                                    ? 'border-primary bg-primary/5 text-primary'
                                                    : 'border-glass-border bg-background text-text-muted'
                                                    }`}
                                            >
                                                <span className="font-bold">{sem}</span>
                                                {formData.semesters.includes(sem) && <Check size={16} />}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="pt-6 flex gap-4">
                                    <button type="button" onClick={closeModal} className="flex-1 secondary h-12">Annuler</button>
                                    <button type="submit" className="flex-1 primary h-12">
                                        {editingSpeciality ? 'Enregistrer les modifications' : 'Créer la spécialité'}
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
                message="Voulez-vous vraiment supprimer cette spécialité ? Cette action est irréversible."
                confirmText="Supprimer"
                cancelText="Annuler"
            />
        </>
    );
};

export default SpecialitiesPage;
