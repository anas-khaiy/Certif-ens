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
    UserCog
} from 'lucide-react';
import type { Coordinateur, Enseignant } from '../types';
import api from '../api/api-client';

const CoordinateursPage = () => {
    const [coordinateurs, setCoordinateurs] = useState<Coordinateur[]>([]);
    const [enseignants, setEnseignants] = useState<Enseignant[]>([]);
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
        } catch (error) {
            console.error("Failed to delete", error);
            setMessage({ type: 'error', text: 'Erreur lors de la suppression.' });
        } finally {
            setIsDeleting(false);
            setIsDeleteModalOpen(false);
            setCoordinateurToDelete(null);
        }
    };

    const openModal = (coordinateur?: Coordinateur) => {
        if (coordinateur) {
            setEditingCoordinateur(coordinateur);
            setFormData({ nom: coordinateur.nom, prenom: coordinateur.prenom, email: coordinateur.email });
            setActiveTab('manuel'); // Edit is always manual form
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
    };

    const toggleSelection = (id: number) => {
        setSelectedCoordinateurs(prev => 
            prev.includes(id) ? prev.filter(coordId => coordId !== id) : [...prev, id]
        );
    };

    const toggleAll = () => {
        if (selectedCoordinateurs.length === filteredCoordinateurs.length) {
            setSelectedCoordinateurs([]);
        } else {
            setSelectedCoordinateurs(filteredCoordinateurs.map(c => c.id));
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

    return (
        <div className="p-4 sm:p-8 space-y-6 sm:space-y-8 animate-fade-in pb-24 lg:pb-8">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-text mb-2">Gestion des Coordinateurs</h1>
                    <p className="text-text-muted">Gérez les coordinateurs de la plateforme.</p>
                </div>
                <button
                    onClick={() => openModal()}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white px-6 py-3 rounded-xl transition-all shadow-lg shadow-primary/20 hover:shadow-primary/40 active:scale-95"
                >
                    <Plus size={20} />
                    <span>Nouveau Coordinateur</span>
                </button>
            </div>

            {/* Global Message */}
            {message && (
                <div className={`p-4 rounded-xl flex items-center gap-3 animate-slide-up ${
                    message.type === 'success' ? 'bg-success/10 text-success border border-success/20' : 'bg-error/10 text-error border border-error/20'
                }`}>
                    {message.type === 'success' ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
                    <span className="font-medium">{message.text}</span>
                    <button onClick={() => setMessage(null)} className="ml-auto opacity-70 hover:opacity-100">
                        <X size={20} />
                    </button>
                </div>
            )}

            {/* Actions Bar */}
            <div className="glass-panel p-4 sm:p-6 rounded-2xl flex flex-col sm:flex-row gap-4 justify-between items-center relative z-10">
                <div className="w-full sm:w-96 relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors" size={20} />
                    <input
                        type="text"
                        placeholder="Rechercher par nom, prénom ou email..."
                        className="input-field pl-10 w-full"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                
                <div className="flex gap-2 w-full sm:w-auto">
                    {selectedCoordinateurs.length > 0 && (
                        <button
                            onClick={handleBatchDeleteClick}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-error/10 hover:bg-error hover:text-white text-error px-4 py-2 rounded-xl transition-all"
                        >
                            <Trash2 size={20} />
                            <span className="hidden sm:inline">Supprimer ({selectedCoordinateurs.length})</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Data Table */}
            <div className="glass-panel rounded-2xl overflow-hidden relative z-0">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                            <tr className="border-b border-glass-border bg-surface-hover/50">
                                <th className="p-4 w-12 text-center">
                                    <input 
                                        type="checkbox" 
                                        className="rounded border-glass-border bg-surface text-primary focus:ring-primary focus:ring-offset-surface"
                                        checked={selectedCoordinateurs.length === filteredCoordinateurs.length && filteredCoordinateurs.length > 0}
                                        onChange={toggleAll}
                                    />
                                </th>
                                <th className="p-4 font-semibold text-text-muted">Coordinateur</th>
                                <th className="p-4 font-semibold text-text-muted">Email</th>
                                <th className="p-4 font-semibold text-text-muted text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-glass-border">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-text-muted">
                                        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-primary" />
                                        Chargement...
                                    </td>
                                </tr>
                            ) : currentItems.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="p-12 text-center text-text-muted">
                                        <div className="bg-surface-hover w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <UserCog size={32} className="opacity-50" />
                                        </div>
                                        <p className="text-lg">Aucun coordinateur trouvé</p>
                                    </td>
                                </tr>
                            ) : (
                                currentItems.map((coord) => (
                                    <tr key={coord.id} className="hover:bg-surface-hover/50 transition-colors group">
                                        <td className="p-4 text-center">
                                            <input 
                                                type="checkbox" 
                                                className="rounded border-glass-border bg-surface text-primary focus:ring-primary focus:ring-offset-surface"
                                                checked={selectedCoordinateurs.includes(coord.id)}
                                                onChange={() => toggleSelection(coord.id)}
                                            />
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center border border-glass-border shadow-inner overflow-hidden shrink-0">
                                                    <img 
                                                        src={coord.photoProfile ? `${api.defaults.baseURL}/files/profiles/${coord.photoProfile}` : "/default.png"}
                                                        alt="Profile"
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => {
                                                            (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLXVzZXItY2lyY2xlIj48Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSIxMCIvPjxjaXJjbGUgY3g9IjEyIiBjeT0iMTAiIHI9IjMiLz48cGF0aCBkPSJNNyAyMC42NjJWMTlhMiAyIDAgMCAxIDItMmg2YTIgMiAwIDAgMSAyIDJ2MS42NjIiLz48L3N2Zz4=';
                                                        }}
                                                    />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-text group-hover:text-primary transition-colors">
                                                        {coord.nom} {coord.prenom}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2 text-text-muted">
                                                <Mail size={16} className="opacity-70" />
                                                {coord.email}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => openModal(coord)}
                                                    className="p-2 hover:bg-surface rounded-lg text-text-muted hover:text-primary transition-all"
                                                    title="Modifier"
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteClick(coord.id)}
                                                    className="p-2 hover:bg-surface rounded-lg text-text-muted hover:text-error transition-all"
                                                    title="Supprimer"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="p-4 border-t border-glass-border flex items-center justify-between bg-surface-hover/30">
                        <p className="text-sm text-text-muted hidden sm:block">
                            Affichage de {indexOfFirstItem + 1} à {Math.min(indexOfLastItem, filteredCoordinateurs.length)} sur {filteredCoordinateurs.length}
                        </p>
                        <div className="flex items-center gap-2 w-full sm:w-auto justify-center">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="p-2 rounded-xl border border-glass-border hover:bg-surface disabled:opacity-50 disabled:cursor-not-allowed transition-all text-text-muted hover:text-text"
                            >
                                <ChevronLeft size={20} />
                            </button>
                            <span className="px-4 font-medium text-text">
                                {currentPage} / {totalPages}
                            </span>
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className="p-2 rounded-xl border border-glass-border hover:bg-surface disabled:opacity-50 disabled:cursor-not-allowed transition-all text-text-muted hover:text-text"
                            >
                                <ChevronRight size={20} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal: Add / Edit Coordinateur */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={closeModal}></div>
                    <div className="glass-panel w-full max-w-lg rounded-2xl p-6 sm:p-8 relative z-10 animate-scale-in border border-glass-border shadow-2xl">
                        <button
                            onClick={closeModal}
                            className="absolute right-6 top-6 text-text-muted hover:text-text bg-surface-hover p-2 rounded-full transition-colors"
                        >
                            <X size={20} />
                        </button>
                        
                        <h2 className="text-2xl font-bold text-text mb-6">
                            {editingCoordinateur ? 'Modifier le Coordinateur' : 'Nouveau Coordinateur'}
                        </h2>

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

                        <form onSubmit={handleAddOrUpdate} className="space-y-4">
                            {activeTab === 'manuel' ? (
                                <>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-medium text-text-muted ml-1">Nom *</label>
                                            <div className="relative">
                                                <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={20} />
                                                <input
                                                    type="text"
                                                    required
                                                    className="input-field pl-10 w-full"
                                                    placeholder="Entrez le nom"
                                                    value={formData.nom}
                                                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-medium text-text-muted ml-1">Prénom *</label>
                                            <div className="relative">
                                                <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={20} />
                                                <input
                                                    type="text"
                                                    required
                                                    className="input-field pl-10 w-full"
                                                    placeholder="Entrez le prénom"
                                                    value={formData.prenom}
                                                    onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-text-muted ml-1">Email *</label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={20} />
                                            <input
                                                type="email"
                                                required
                                                className="input-field pl-10 w-full"
                                                placeholder="email@example.com"
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-text-muted ml-1">Formateur existant *</label>
                                    <select
                                        required
                                        className="input-field w-full"
                                        value={selectedFormateurId}
                                        onChange={(e) => setSelectedFormateurId(e.target.value)}
                                    >
                                        <option value="">Sélectionnez un formateur...</option>
                                        {enseignants.map(ens => (
                                            <option key={ens.id} value={ens.id}>
                                                {ens.nom} {ens.prenom} ({ens.email})
                                            </option>
                                        ))}
                                    </select>
                                    <p className="text-xs text-text-muted mt-2">
                                        Les informations (nom, prénom, email, photo) seront copiées pour créer le compte coordinateur.
                                    </p>
                                </div>
                            )}

                            <div className="flex justify-end gap-3 pt-6 border-t border-glass-border mt-6">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="px-5 py-2.5 rounded-xl hover:bg-surface-hover text-text-muted font-medium transition-colors"
                                    disabled={isSubmitting}
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting || (activeTab === 'formateur' && !selectedFormateurId)}
                                    className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white font-medium transition-colors shadow-lg shadow-primary/20 flex items-center gap-2 disabled:opacity-70"
                                >
                                    {isSubmitting && <Loader2 size={18} className="animate-spin" />}
                                    {editingCoordinateur ? 'Enregistrer' : 'Ajouter'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Confirm Delete */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setIsDeleteModalOpen(false)}></div>
                    <div className="glass-panel w-full max-w-md rounded-2xl p-6 sm:p-8 relative z-10 animate-scale-in border border-error/20 shadow-2xl">
                        <div className="w-16 h-16 rounded-full bg-error/10 flex items-center justify-center mx-auto mb-6">
                            <AlertCircle size={32} className="text-error" />
                        </div>
                        <h2 className="text-2xl font-bold text-text mb-2 text-center">Confirmation</h2>
                        <p className="text-text-muted text-center mb-8">
                            {isBatchDelete
                                ? `Êtes-vous sûr de vouloir supprimer ces ${selectedCoordinateurs.length} coordinateurs ?`
                                : "Êtes-vous sûr de vouloir supprimer ce coordinateur ?"}
                            <br />Cette action est irréversible.
                        </p>
                        
                        <div className="flex gap-3">
                            <button
                                onClick={() => setIsDeleteModalOpen(false)}
                                className="flex-1 px-5 py-3 rounded-xl bg-surface-hover hover:bg-surface text-text font-medium transition-colors"
                                disabled={isDeleting}
                            >
                                Annuler
                            </button>
                            <button
                                onClick={confirmDelete}
                                disabled={isDeleting}
                                className="flex-1 px-5 py-3 rounded-xl bg-error hover:bg-red-600 text-white font-medium transition-colors shadow-lg shadow-error/20 flex items-center justify-center gap-2"
                            >
                                {isDeleting ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                                Supprimer
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CoordinateursPage;
