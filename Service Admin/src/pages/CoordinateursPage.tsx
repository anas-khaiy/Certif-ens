import { useState, useEffect } from 'react';
import {
    Plus,
    Search,
    Edit2,
    Trash2,
    X,
    ChevronLeft,
    ChevronRight,
    UserCircle,
    Mail,
    Loader2,
    CheckCircle2,
    AlertCircle,
    UserCog,
    ChevronDown
} from 'lucide-react';
import type { Coordinateur, Enseignant, Specialite } from '../types';
import api from '../api/api-client';

const CoordinateursPage = () => {
    const [coordinateurs, setCoordinateurs] = useState<Coordinateur[]>([]);
    const [enseignants, setEnseignants] = useState<Enseignant[]>([]);
    const [specialites, setSpecialites] = useState<Specialite[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isBatchDelete, setIsBatchDelete] = useState(false);
    const [coordinateurToDelete, setCoordinateurToDelete] = useState<number | null>(null);
    const [editingCoordinateur, setEditingCoordinateur] = useState<Coordinateur | null>(null);
    
    // For the modal
    const [activeTab, setActiveTab] = useState<'manuel' | 'formateur'>('manuel');
    const [formData, setFormData] = useState({ nom: '', prenom: '', email: '' });
    const [selectedFormateurId, setSelectedFormateurId] = useState<string>('');
    
    // Formateur List states
    const [formateurSearch, setFormateurSearch] = useState('');
    const [formateurSpecialiteFilter, setFormateurSpecialiteFilter] = useState('');
    const [formateurPage, setFormateurPage] = useState(1);
    const formateursPerPage = 5;

    const [isLoading, setIsLoading] = useState(true);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [selectedCoordinateurs, setSelectedCoordinateurs] = useState<number[]>([]);

    useEffect(() => {
        fetchCoordinateurs();
        fetchEnseignants();
        fetchSpecialites();
    }, []);

    const fetchCoordinateurs = async () => {
        setIsLoading(true);
        try {
            const response = await api.get('/coordinateurs');
            setCoordinateurs(response.data);
        } catch (error) {
            console.error("Failed to fetch coordinateurs", error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchEnseignants = async () => {
        try {
            const response = await api.get('/enseignants');
            setEnseignants(response.data);
        } catch (error) {
            console.error("Failed to fetch enseignants", error);
        }
    };

    const fetchSpecialites = async () => {
        try {
            const response = await api.get('/specialites');
            setSpecialites(response.data);
        } catch (error) {
            console.error("Failed to fetch specialites", error);
        }
    };

    const handleAddOrUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (editingCoordinateur) {
                // UPDATE
                await api.put(`/coordinateurs/${editingCoordinateur.id}`, formData);
                setMessage({ type: 'success', text: 'Coordinateur mis à jour avec succès.' });
            } else {
                // CREATE
                if (activeTab === 'manuel') {
                    await api.post('/coordinateurs', formData);
                } else {
                    if (!selectedFormateurId) {
                        throw new Error("Veuillez sélectionner un formateur.");
                    }
                    await api.post(`/coordinateurs/from-formateur/${selectedFormateurId}`);
                }
                setMessage({ type: 'success', text: 'Coordinateur ajouté avec succès.' });
            }
            fetchCoordinateurs();
            closeModal();
        } catch (error: any) {
            console.error("Failed to save coordinateur", error);
            const errorMsg = error.response?.data?.message || error.message || "";
            let descriptiveError = "Impossible d'enregistrer le coordinateur.";
            
            if (errorMsg.toLowerCase().includes("email") || errorMsg.toLowerCase().includes("already exists")) {
                descriptiveError = "Cet email est déjà utilisé.";
            } else if (errorMsg) {
                descriptiveError = errorMsg;
            }
            
            setMessage({ type: 'error', text: descriptiveError });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteClick = (id: number) => {
        setCoordinateurToDelete(id);
        setIsBatchDelete(false);
        setIsDeleteModalOpen(true);
    };

    const handleBatchDeleteClick = () => {
        setIsBatchDelete(true);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        setIsDeleting(true);
        try {
            if (isBatchDelete) {
                await api.post('/coordinateurs/batch-delete', selectedCoordinateurs);
                setSelectedCoordinateurs([]);
                setMessage({ type: 'success', text: 'Coordinateurs supprimés avec succès.' });
            } else if (coordinateurToDelete) {
                await api.delete(`/coordinateurs/${coordinateurToDelete}`);
                setMessage({ type: 'success', text: 'Coordinateur supprimé avec succès.' });
            }
            fetchCoordinateurs();
            setIsDeleteModalOpen(false);
        } catch (error) {
            console.error("Failed to delete", error);
            setIsDeleteModalOpen(false);
            alert("Erreur lors de la suppression.");
        } finally {
            setIsDeleting(false);
            setCoordinateurToDelete(null);
        }
    };

    const openModal = (coordinateur?: Coordinateur) => {
        if (coordinateur) {
            setEditingCoordinateur(coordinateur);
            setFormData({ nom: coordinateur.nom, prenom: coordinateur.prenom, email: coordinateur.email });
            setActiveTab('manuel');
        } else {
            setEditingCoordinateur(null);
            setFormData({ nom: '', prenom: '', email: '' });
            setSelectedFormateurId('');
            setActiveTab('manuel');
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingCoordinateur(null);
        setFormateurSearch('');
        setFormateurSpecialiteFilter('');
        setFormateurPage(1);
    };

    const toggleSelection = (id: number) => {
        setSelectedCoordinateurs(prev => 
            prev.includes(id) ? prev.filter(coordId => coordId !== id) : [...prev, id]
        );
    };

    const toggleAll = () => {
        if (selectedCoordinateurs.length === currentItems.length && currentItems.length > 0) {
            setSelectedCoordinateurs([]);
        } else {
            setSelectedCoordinateurs(currentItems.map(c => c.id));
        }
    };

    // Filter logic
    const filteredCoordinateurs = coordinateurs.filter(coord => {
        const matchesSearch = 
            coord.nom.toLowerCase().includes(searchTerm.toLowerCase()) || 
            coord.prenom.toLowerCase().includes(searchTerm.toLowerCase()) || 
            coord.email.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch;
    });

    // Pagination logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredCoordinateurs.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredCoordinateurs.length / itemsPerPage);

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

    // Formateur Pagination Logic
    const filteredFormateurs = enseignants.filter(ens => {
        const matchSearch = `${ens.prenom} ${ens.nom}`.toLowerCase().includes(formateurSearch.toLowerCase()) ||
                            (ens.email || '').toLowerCase().includes(formateurSearch.toLowerCase());
        const matchSpec = formateurSpecialiteFilter ? String(ens.specialite?.id) === formateurSpecialiteFilter : true;
        return matchSearch && matchSpec;
    });
    const totalFormateurPages = Math.ceil(filteredFormateurs.length / formateursPerPage);
    const paginatedFormateurs = filteredFormateurs.slice((formateurPage - 1) * formateursPerPage, formateurPage * formateursPerPage);

    if (isLoading) {
        return (
            <div className="h-[60vh] flex items-center justify-center">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
            </div>
        );
    }

    return (
        <>
            <div className="space-y-6">
                <div>
                    <h2 className="text-3xl font-bold">Gestion des Coordinateurs</h2>
                    <p className="text-text-muted" style={{ marginBottom: 15 }}>Gérez l'ensemble des coordinateurs de la plateforme.</p>
                </div>

                {message && (
                    <div
                        className={`p-4 rounded-xl flex items-center justify-between ${message.type === 'success' ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-error/10 text-error border border-error/20'}`}
                    >
                        <div className="flex items-center gap-2 font-bold">
                            {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                            {message.text}
                        </div>
                        <button onClick={() => setMessage(null)} className="hover:opacity-70">
                            <X size={18} />
                        </button>
                    </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="hidden lg:block lg:col-span-3"></div>
                    <button onClick={() => openModal()} className="primary action-btn w-full justify-center shadow-lg shadow-primary/20 sm:col-span-2 lg:col-span-1">
                        <Plus size={18} />
                        Ajouter Coordinateur
                    </button>
                </div>

                {selectedCoordinateurs.length > 0 && (
                    <div
                        className="bg-error/10 border border-error/20 p-4 rounded-2xl flex items-center justify-between"
                    >
                        <div className="flex items-center gap-3 text-error">
                            <div className="w-10 h-10 bg-error/20 rounded-xl flex items-center justify-center font-bold">
                                {selectedCoordinateurs.length}
                            </div>
                            <span className="font-bold">coordinateurs sélectionnés</span>
                        </div>
                        <button
                            onClick={handleBatchDeleteClick}
                            className="bg-error text-white px-6 py-2.5 rounded-xl font-bold hover:bg-error/80 transition-all flex items-center gap-2 shadow-lg shadow-error/20"
                        >
                            <Trash2 size={18} />
                            Supprimer la sélection
                        </button>
                    </div>
                )}
            </div>

            <div className="glass overflow-hidden shadow-xl">
                <div className="p-6 border-b border-glass-border flex flex-col lg:flex-row justify-between items-center gap-4">
                    <div className="flex flex-row flex-1 items-center gap-4 w-full">
                        <div className="search-container flex-1">
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

                    <div className="flex items-center gap-2 text-sm text-text-muted">
                        <span>Afficher</span>
                        <select
                            className="bg-background border border-glass-border rounded-lg px-2 py-1 focus:outline-none focus:border-primary"
                            value={itemsPerPage}
                            onChange={(e) => {
                                setItemsPerPage(Number(e.target.value));
                                setCurrentPage(1);
                            }}
                        >
                            <option value={5}>5</option>
                            <option value={10}>10</option>
                            <option value={50}>50</option>
                        </select>
                        <span>par page</span>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-surface-hover/50 text-text-muted text-xs uppercase tracking-widest">
                                <th className="w-12 text-center">
                                    <input
                                        type="checkbox"
                                        className="w-4 h-4 rounded border-glass-border bg-background cursor-pointer"
                                        checked={currentItems.length > 0 && selectedCoordinateurs.length === currentItems.length}
                                        onChange={toggleAll}
                                    />
                                </th>
                                <th>Nom & Prénom</th>
                                <th>Email</th>
                                <th className="text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-glass-border">
                            {currentItems.length > 0 ? (
                                currentItems.map((coord) => (
                                    <tr key={coord.id} className={`hover:bg-surface-hover/30 transition-colors ${selectedCoordinateurs.includes(coord.id) ? 'bg-primary/5' : ''}`}>
                                        <td className="text-center">
                                            <input
                                                type="checkbox"
                                                className="w-4 h-4 rounded border-glass-border bg-background cursor-pointer"
                                                checked={selectedCoordinateurs.includes(coord.id)}
                                                onChange={() => toggleSelection(coord.id)}
                                            />
                                        </td>
                                        <td className="font-bold text-text capitalize">{coord.nom} {coord.prenom}</td>
                                        <td>{coord.email}</td>
                                        <td>
                                            <div className="flex justify-center gap-2">
                                                <button onClick={() => openModal(coord)} className="w-9 h-9 p-0 text-primary hover:bg-primary/10 rounded-xl transition-all icon-container">
                                                    <Edit2 size={16} />
                                                </button>
                                                <button onClick={(e) => { e.stopPropagation(); handleDeleteClick(coord.id); }} className="w-9 h-9 p-0 text-error hover:bg-error/10 rounded-xl transition-all icon-container">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="py-20 text-text-muted font-medium text-center">Aucun coordinateur trouvé</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {totalPages > 1 && (
                    <div className="pagination border-t border-glass-border bg-surface-hover/10 px-6 py-4 flex items-center justify-between">
                        <div className="pagination-info">
                            Affichage <span className="text-text font-bold">{(currentPage - 1) * itemsPerPage + 1}</span> à <span className="text-text font-bold">{Math.min(currentPage * itemsPerPage, filteredCoordinateurs.length)}</span> sur <span className="text-text font-bold">{filteredCoordinateurs.length}</span> coordinateurs
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

            {/* Add/Edit Modal */}
            {isModalOpen && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div
                        className="modal-content"
                        style={{ maxWidth: '48rem' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="modal-close" onClick={closeModal}>
                            <X size={22} />
                        </div>

                        <h3 className="text-2xl font-bold mb-8 flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-xl text-primary">
                                <UserCog size={22} />
                            </div>
                            {editingCoordinateur ? 'Modifier' : 'Ajouter'} Coordinateur
                        </h3>

                        {!editingCoordinateur && (
                            <div className="flex gap-4 mb-6 border-b border-glass-border pb-2">
                                <button
                                    className={`pb-2 font-medium transition-colors ${activeTab === 'manuel' ? 'text-primary border-b-2 border-primary' : 'text-text-muted hover:text-text'}`}
                                    onClick={() => setActiveTab('manuel')}
                                >
                                    Manuel
                                </button>
                                <button
                                    className={`pb-2 font-medium transition-colors ${activeTab === 'formateur' ? 'text-primary border-b-2 border-primary' : 'text-text-muted hover:text-text'}`}
                                    onClick={() => setActiveTab('formateur')}
                                >
                                    Depuis un formateur
                                </button>
                            </div>
                        )}

                        <form onSubmit={handleAddOrUpdate} className="space-y-6">
                            {activeTab === 'manuel' ? (
                                <>
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
                                </>
                            ) : (
                                <div className="space-y-4">
                                    <div className="flex gap-4">
                                        <div className="search-container flex-1">
                                            <div className="search-icon"><Search size={18} /></div>
                                            <input
                                                type="text"
                                                placeholder="Rechercher un formateur..."
                                                className="search-input text-sm w-full"
                                                value={formateurSearch}
                                                onChange={e => { setFormateurSearch(e.target.value); setFormateurPage(1); }}
                                            />
                                        </div>
                                        <div className="relative flex-1">
                                            <select
                                                className="form-input text-sm appearance-none w-full bg-surface"
                                                value={formateurSpecialiteFilter}
                                                onChange={e => { setFormateurSpecialiteFilter(e.target.value); setFormateurPage(1); }}
                                            >
                                                <option value="">Toutes les spécialités</option>
                                                {specialites.map(s => (
                                                    <option key={s.id} value={String(s.id)}>{s.nom}</option>
                                                ))}
                                            </select>
                                            <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                                        </div>
                                    </div>
                                    <div className="border border-glass-border rounded-xl overflow-hidden bg-surface">
                                        <table className="w-full text-left text-sm">
                                            <thead className="bg-surface-hover/50 text-text-muted text-xs uppercase">
                                                <tr>
                                                    <th className="px-4 py-2 w-10 text-center"></th>
                                                    <th className="px-4 py-2">Nom</th>
                                                    <th className="px-4 py-2">Email</th>
                                                    <th className="px-4 py-2">Spécialité</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-glass-border">
                                                {paginatedFormateurs.map(ens => (
                                                    <tr 
                                                        key={ens.id} 
                                                        className={`hover:bg-surface-hover/30 cursor-pointer transition-colors ${selectedFormateurId === String(ens.id) ? 'bg-primary/10' : ''}`}
                                                        onClick={() => setSelectedFormateurId(String(ens.id))}
                                                    >
                                                        <td className="px-4 py-3 text-center">
                                                            <input 
                                                                type="radio" 
                                                                name="selectedFormateur" 
                                                                checked={selectedFormateurId === String(ens.id)}
                                                                onChange={() => setSelectedFormateurId(String(ens.id))}
                                                                className="w-4 h-4 cursor-pointer"
                                                            />
                                                        </td>
                                                        <td className="px-4 py-3 font-semibold">{ens.prenom} {ens.nom}</td>
                                                        <td className="px-4 py-3 text-text-muted">{ens.email}</td>
                                                        <td className="px-4 py-3 text-text-muted">{ens.specialite?.nom || 'N/A'}</td>
                                                    </tr>
                                                ))}
                                                {paginatedFormateurs.length === 0 && (
                                                    <tr>
                                                        <td colSpan={4} className="px-4 py-8 text-center text-text-muted">Aucun formateur trouvé</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                        {/* Pagination Formateurs */}
                                        {totalFormateurPages > 1 && (
                                            <div className="flex items-center justify-between px-4 py-2 border-t border-glass-border bg-surface-hover/10">
                                                <button 
                                                    type="button" 
                                                    onClick={() => setFormateurPage(p => Math.max(1, p - 1))} 
                                                    disabled={formateurPage === 1}
                                                    className="p-1 rounded bg-background border border-glass-border disabled:opacity-50"
                                                >
                                                    <ChevronLeft size={16} />
                                                </button>
                                                <span className="text-xs text-text-muted">
                                                    Page {formateurPage} sur {totalFormateurPages}
                                                </span>
                                                <button 
                                                    type="button" 
                                                    onClick={() => setFormateurPage(p => Math.min(totalFormateurPages, p + 1))} 
                                                    disabled={formateurPage === totalFormateurPages}
                                                    className="p-1 rounded bg-background border border-glass-border disabled:opacity-50"
                                                >
                                                    <ChevronRight size={16} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-xs text-text-muted mt-2">
                                        Les informations seront copiées pour créer le compte coordinateur.
                                    </p>
                                </div>
                            )}

                            <div className="pt-6 flex gap-4">
                                <button type="button" onClick={closeModal} className="flex-1 secondary h-12">Annuler</button>
                                <button type="submit" disabled={isSubmitting || (activeTab === 'formateur' && !selectedFormateurId)} className="flex-1 primary h-12 disabled:opacity-50 flex items-center justify-center gap-2">
                                    {isSubmitting && <Loader2 size={18} className="animate-spin" />}
                                    {editingCoordinateur ? 'Mettre à jour' : 'Ajouter Coordinateur'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            
            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && (
                <div className="modal-overlay" onClick={() => setIsDeleteModalOpen(false)}>
                    <div
                        className="glass max-w-md w-full p-8 space-y-6 relative overflow-hidden text-center"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="w-20 h-20 bg-error/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Trash2 size={40} className="text-error" />
                        </div>
                        <h3 className="text-2xl font-bold mb-2">Confirmer la suppression</h3>
                        <p className="text-text-muted mb-6">
                            {isBatchDelete
                                ? `Voulez-vous vraiment supprimer les ${selectedCoordinateurs.length} coordinateurs sélectionnés ?`
                                : "Voulez-vous vraiment supprimer ce coordinateur ?"
                            } Cette action est irréversible.
                        </p>
                        <div className="flex gap-4">
                            <button
                                onClick={() => setIsDeleteModalOpen(false)}
                                className="flex-1 px-6 py-3 rounded-xl bg-surface border border-glass-border font-bold hover:bg-surface-hover transition-all text-text"
                                disabled={isDeleting}
                            >
                                Annuler
                            </button>
                            <button
                                onClick={confirmDelete}
                                disabled={isDeleting}
                                className="flex-1 px-6 py-3 rounded-xl bg-error text-white font-bold hover:bg-error/80 shadow-lg shadow-error/20 transition-all flex items-center justify-center gap-2"
                            >
                                {isDeleting && <Loader2 size={18} className="animate-spin" />}
                                Supprimer
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default CoordinateursPage;
