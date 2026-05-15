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
    RefreshCw,
    Mail,
    Hash,
    BookOpen,
    Filter,
    Loader2,
    CheckCircle2,
    AlertCircle,
    ArrowRight,
    User
} from 'lucide-react';
import * as XLSX from 'xlsx';
import type { Apprenant, Specialite, Cycle, Formation } from '../types';
import { exportToExcel, downloadSampleExcel } from '../utils/excelUtils';
import api from '../api/api-client';

const LearnersPage = () => {
    const [apprenants, setApprenants] = useState<Apprenant[]>([]);
    const [specialities, setSpecialities] = useState<Specialite[]>([]);
    const [cycles, setCycles] = useState<Cycle[]>([]);
    const [formations, setFormations] = useState<Formation[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isBatchDelete, setIsBatchDelete] = useState(false);
    const [apprenantToDelete, setApprenantToDelete] = useState<number | null>(null);
    const [editingApprenant, setEditingApprenant] = useState<Apprenant | null>(null);
    const [selectedApprenants, setSelectedApprenants] = useState<number[]>([]);
    const [selectedSpecialty, setSelectedSpecialty] = useState<string>('');
    const [importResult, setImportResult] = useState<{
        totalAttempted: number;
        successCount: number;
        failureCount: number;
        errorMessages: string[];
    } | null>(null);
    const [isImporting, setIsImporting] = useState(false);
    const [isImportResultOpen, setIsImportResultOpen] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [selectedCycle, setSelectedCycle] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [isLoading, setIsLoading] = useState(true);

    const [formData, setFormData] = useState({
        nom: '',
        prenom: '',
        cin: '',
        email: '',
        specialiteId: '',
        cycleId: '',
        sexe: '',
        formationId: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [appRes, specRes, cycleRes, formRes] = await Promise.all([
                api.get('/apprenants'),
                api.get('/specialites'),
                api.get('/cycles'),
                api.get('/formations')
            ]);
            setApprenants(appRes.data);
            setSpecialities(specRes.data);
            setCycles(cycleRes.data);
            setFormations(formRes.data);
        } catch (error) {
            console.error("Failed to fetch learners data", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddOrUpdate = async (e: React.FormEvent) => {
        e.preventDefault();

        const payload = {
            nom: formData.nom,
            prenom: formData.prenom,
            cin: formData.cin,
            email: formData.email,
            specialite: { id: parseInt(formData.specialiteId) },
            cycle: { id: parseInt(formData.cycleId) },
            sexe: formData.sexe,
            formation: formData.formationId ? { id: parseInt(formData.formationId) } : null
        };

        setIsSubmitting(true);
        try {
            if (editingApprenant) {
                await api.put(`/apprenants/${editingApprenant.id}`, payload);
            } else {
                await api.post('/apprenants', { ...payload, motDePasse: formData.cin });
            }
            fetchData();
            closeModal();
            setMessage({ type: 'success', text: `Apprenant ${editingApprenant ? 'mis à jour' : 'ajouté'} avec succès.` });
        } catch (error: any) {
            console.error("Failed to save learner", error);
            const errorMsg = error.response?.data?.message || "";
            
            let descriptiveError = "Impossible d'enregistrer l'apprenant. Vérifiez que l'email et le CIN sont uniques.";
            const isDuplicate = errorMsg.toLowerCase().includes("email") || 
                              errorMsg.toLowerCase().includes("cin") || 
                              errorMsg.toLowerCase().includes("already exists");
            
            if (isDuplicate) {
                descriptiveError = "Le CIN ou l'Email est déjà utilisé par un autre utilisateur.";
            }
            
            setMessage({ type: 'error', text: descriptiveError });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteClick = (id: number) => {
        setApprenantToDelete(id);
        setIsBatchDelete(false);
        setIsDeleteModalOpen(true);
    };

    const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsImporting(true);
        setImportResult(null);

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const data = new Uint8Array(event.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet);

                // Quick local validation for Learners: nom, prenom, cin, email
                const missingInfo = jsonData.some((row: any) => !row.nom || !row.prenom || !row.cin || !row.email);
                if (missingInfo && !window.confirm("Certaines lignes semblent avoir des informations manquantes (Nom, Prénom, CIN ou Email). Voulez-vous continuer l'importation ?")) {
                    setIsImporting(false);
                    return;
                }

                const formData = new FormData();
                formData.append('file', file);

                const response = await api.post('/excel/import/apprenants', formData);
                setImportResult(response.data);
                setIsImportResultOpen(true);
                fetchData();
            } catch (error: any) {
                console.error("Excel import failed", error);
                const errorMsg = error.response?.data?.message || error.message || "L'importation a échoué.";
                setMessage({ type: 'error', text: `${errorMsg} Veuillez vérifier le format du fichier.` });
            } finally {
                setIsImporting(false);
                if (e.target) e.target.value = ''; // Reset input
            }
        };
        reader.readAsArrayBuffer(file);
    };

    const handleBatchDeleteClick = () => {
        setIsBatchDelete(true);
        setIsDeleteModalOpen(true);
    };

    const toggleSelectAll = () => {
        if (selectedApprenants.length === currentItems.length) {
            setSelectedApprenants([]);
        } else {
            setSelectedApprenants(currentItems.map(l => l.id));
        }
    };

    const toggleSelectLearner = (id: number) => {
        setSelectedApprenants(prev =>
            prev.includes(id) ? prev.filter(lId => lId !== id) : [...prev, id]
        );
    };

    const confirmDelete = async () => {
        setIsDeleting(true);
        try {
            if (isBatchDelete) {
                await api.post('/apprenants/batch-delete', selectedApprenants);
                setSelectedApprenants([]);
            } else if (apprenantToDelete) {
                await api.delete(`/apprenants/${apprenantToDelete}`);
                setApprenantToDelete(null);
            }
            fetchData();
            setIsDeleteModalOpen(false);
        } catch (error: any) {
            console.error("Failed to delete", error);
            setIsDeleteModalOpen(false);
            alert("Impossible de supprimer car cet apprenant est lié à d'autres données (inscriptions, notes, etc.).");
        } finally {
            setIsDeleting(false);
        }
    };

    const openModal = (apprenant?: Apprenant) => {
        if (apprenant) {
            setEditingApprenant(apprenant);
            setFormData({
                nom: apprenant.nom || '',
                prenom: apprenant.prenom || '',
                cin: apprenant.cin || '',
                email: apprenant.email || '',
                specialiteId: apprenant.specialite?.id?.toString() || '',
                cycleId: apprenant.cycle?.id?.toString() || '',
                sexe: apprenant.sexe || '',
                formationId: apprenant.formation?.id?.toString() || ''
            });
        } else {
            setEditingApprenant(null);
            setFormData({ nom: '', prenom: '', cin: '', email: '', specialiteId: '', cycleId: '', sexe: '', formationId: '' });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingApprenant(null);
    };

    const filteredLearners = apprenants.filter(l => {
        const search = searchTerm.toLowerCase();
        const matchesSearch = (
            (l.nom || '').toLowerCase().includes(search) ||
            (l.prenom || '').toLowerCase().includes(search) ||
            (l.cin || '').toLowerCase().includes(search) ||
            (l.email || '').toLowerCase().includes(search)
        );
        const matchesSpecialty = selectedSpecialty === '' || l.specialite?.nom === selectedSpecialty;
        const matchesCycle = selectedCycle === '' || l.cycle?.nomCycle === selectedCycle;
        return matchesSearch && matchesSpecialty && matchesCycle;
    });

    const totalPages = Math.ceil(filteredLearners.length / itemsPerPage);
    const currentItems = filteredLearners.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

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

    const capitalizeFirstLetter = (string: string) => {
        if (!string) return '';
        return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
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
            <div className="space-y-6">
                <div>
                    <h2 className="text-3xl font-bold">Gestion des Apprenants</h2>
                    <p className="text-text-muted" style={{ marginBottom: 15 }}>Gérez l'ensemble des étudiants inscrits.</p>
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
                    <button onClick={() => downloadSampleExcel(['nom', 'prenom', 'cin', 'email', 'sexe', 'specialite', 'cycle', 'formation'], 'apprenants')} className="action-sample action-btn w-full justify-center">
                        <Download size={18} />
                        Exemple Excel
                    </button>
                    <label className="action-import cursor-pointer action-btn w-full justify-center">
                        {isImporting ? <Loader2 size={18} className="animate-spin" /> : <FileUp size={18} />}
                        {isImporting ? 'Importation...' : 'Importer Excel'}
                        <input
                            type="file"
                            accept=".xlsx, .xls"
                            className="hidden"
                            onChange={handleImportExcel}
                            disabled={isImporting}
                        />
                    </label>
                    <button onClick={() => {
                        const dataToExport = apprenants.map(a => ({
                            CIN: a.cin,
                            Nom: a.nom,
                            Prénom: a.prenom,
                            Email: a.email,
                            Sexe: a.sexe || 'N/A',
                            Spécialité: a.specialite?.nom || 'N/A',
                            Cycle: a.cycle?.nomCycle || 'N/A',
                            Formation: a.formation?.nom || 'N/A'
                        }));
                        exportToExcel(dataToExport, 'liste_apprenants');
                    }} className="action-export action-btn w-full justify-center">
                        <FileDown size={18} />
                        Exporter Excel
                    </button>
                    <button onClick={() => openModal()} className="primary action-btn w-full justify-center shadow-lg shadow-primary/20 sm:col-span-2 lg:col-span-1">
                        <Plus size={18} />
                        Ajouter Apprenant
                    </button>
                </div>



                {selectedApprenants.length > 0 && (
                    <div
                        className="bg-error/10 border border-error/20 p-4 rounded-2xl flex items-center justify-between"
                    >
                        <div className="flex items-center gap-3 text-error">
                            <div className="w-10 h-10 bg-error/20 rounded-xl flex items-center justify-center font-bold">
                                {selectedApprenants.length}
                            </div>
                            <span className="font-bold">apprenants sélectionnés</span>
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

                        <div className="search-container flex-1">
                            <div className="search-icon"><Filter size={18} /></div>
                            <select
                                className="search-input cursor-pointer"
                                value={selectedSpecialty}
                                onChange={(e) => {
                                    setSelectedSpecialty(e.target.value);
                                    setCurrentPage(1);
                                }}
                            >
                                <option value="">Toutes les spécialités</option>
                                {specialities.map(s => (
                                    <option key={s.id} value={s.nom} className="capitalize">{s.nom}</option>
                                ))}
                            </select>
                        </div>

                        <div className="search-container flex-1">
                            <div className="search-icon"><Filter size={18} /></div>
                            <select
                                className="search-input cursor-pointer"
                                value={selectedCycle}
                                onChange={(e) => {
                                    setSelectedCycle(e.target.value);
                                    setCurrentPage(1);
                                }}
                            >
                                <option value="">Tous les cycles</option>
                                {cycles.map(c => (
                                    <option key={c.id} value={c.nomCycle}>{capitalizeFirstLetter(c.nomCycle)}</option>
                                ))}
                            </select>
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
                                        checked={currentItems.length > 0 && selectedApprenants.length === currentItems.length}
                                        onChange={toggleSelectAll}
                                    />
                                </th>
                                <th>CIN</th>
                                <th>Sexe</th>
                                <th>Nom & Prénom</th>
                                <th>Email</th>
                                <th>Formation</th>
                                <th>Cycle</th>
                                <th>Spécialité</th>
                                <th className="text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-glass-border">
                            {currentItems.length > 0 ? (
                                currentItems.map((apprenant) => (
                                    <tr key={apprenant.id} className={`hover:bg-surface-hover/30 transition-colors ${selectedApprenants.includes(apprenant.id) ? 'bg-primary/5' : ''}`}>
                                        <td className="text-center">
                                            <input
                                                type="checkbox"
                                                className="w-4 h-4 rounded border-glass-border bg-background cursor-pointer"
                                                checked={selectedApprenants.includes(apprenant.id)}
                                                onChange={() => toggleSelectLearner(apprenant.id)}
                                            />
                                        </td>
                                        <td className="font-mono text-xs text-primary font-bold">{apprenant.cin}</td>
                                        <td className="text-center">
                                            {apprenant.sexe === 'Homme' ? (
                                                <span className="px-2 py-1 rounded-lg bg-blue-500/10 text-blue-500 text-[10px] font-bold uppercase">Homme</span>
                                            ) : apprenant.sexe === 'Femme' ? (
                                                <span className="px-2 py-1 rounded-lg bg-pink-500/10 text-pink-500 text-[10px] font-bold uppercase">Femme</span>
                                            ) : (
                                                <span className="text-text-muted text-[10px]">-</span>
                                            )}
                                        </td>
                                        <td className="font-bold text-text capitalize">{apprenant.nom} {apprenant.prenom}</td>
                                        <td className="text-sm">{apprenant.email}</td>
                                        <td>
                                            {apprenant.formation ? (
                                                <span className="px-2 py-1 rounded-lg bg-orange-500/10 text-orange-600 text-[10px] font-bold uppercase">{apprenant.formation.nom}</span>
                                            ) : (
                                                <span className="text-text-muted text-[10px]">-</span>
                                            )}
                                        </td>
                                        <td className="font-semibold text-text-muted capitalize text-sm">{apprenant.cycle?.nomCycle || 'N/A'}</td>
                                        <td>
                                            <span className="tag tag-master font-bold capitalize">{apprenant.specialite?.nom || 'N/A'}</span>
                                        </td>
                                        <td>
                                            <div className="flex justify-center gap-2">
                                                <button onClick={() => openModal(apprenant)} className="w-9 h-9 p-0 text-primary hover:bg-primary/10 rounded-xl transition-all icon-container">
                                                    <Edit2 size={16} />
                                                </button>
                                                <button onClick={(e) => { e.stopPropagation(); handleDeleteClick(apprenant.id); }} className="w-9 h-9 p-0 text-error hover:bg-error/10 rounded-xl transition-all icon-container">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={7} className="py-20 text-text-muted font-medium text-center">Aucun apprenant trouvé</td>
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
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="modal-close" onClick={closeModal}>
                            <X size={22} />
                        </div>

                        <h3 className="text-2xl font-bold mb-8 flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-xl text-primary">
                                <GraduationCap size={22} />
                            </div>
                            {editingApprenant ? 'Modifier' : 'Ajouter'} Apprenant
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
                                    <label className="form-label">CIN</label>
                                    <div className="relative">
                                        <div className="search-icon" style={{ left: '16px' }}><Hash size={18} /></div>
                                        <input
                                            type="text"
                                            required
                                            className="form-input"
                                            style={{ paddingLeft: '48px' }}
                                            value={formData.cin}
                                            onChange={(e) => setFormData({ ...formData, cin: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Spécialité</label>
                                    <div className="relative">
                                        <div className="search-icon" style={{ left: '16px' }}><BookOpen size={18} /></div>
                                        <select
                                            required
                                            className="form-input"
                                            style={{ paddingLeft: '48px' }}
                                            value={formData.specialiteId}
                                            onChange={(e) => setFormData({ ...formData, specialiteId: e.target.value })}
                                        >
                                            <option value="">Sélectionner</option>
                                            {specialities.map(s => (
                                                <option key={s.id} value={s.id}>{s.nom}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
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
                                    <label className="form-label">Cycle</label>
                                    <div className="relative">
                                        <div className="search-icon" style={{ left: '16px' }}><GraduationCap size={18} /></div>
                                        <select
                                            required
                                            className="form-input"
                                            style={{ paddingLeft: '48px' }}
                                            value={formData.cycleId}
                                            onChange={(e) => setFormData({ ...formData, cycleId: e.target.value })}
                                        >
                                            <option value="">Sélectionner</option>
                                            {cycles.map(c => (
                                                <option key={c.id} value={c.id}>{capitalizeFirstLetter(c.nomCycle)}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="form-group">
                                    <label className="form-label">Sexe</label>
                                    <div className="relative">
                                        <div className="search-icon" style={{ left: '16px' }}><User size={18} /></div>
                                        <select
                                            required
                                            className="form-input"
                                            style={{ paddingLeft: '48px' }}
                                            value={formData.sexe}
                                            onChange={(e) => setFormData({ ...formData, sexe: e.target.value })}
                                        >
                                            <option value="">Sélectionner</option>
                                            <option value="Homme">Homme</option>
                                            <option value="Femme">Femme</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Type de formation</label>
                                    <div className="relative">
                                        <div className="search-icon" style={{ left: '16px' }}><RefreshCw size={18} /></div>
                                        <select
                                            required
                                            className="form-input"
                                            style={{ paddingLeft: '48px' }}
                                            value={formData.formationId}
                                            onChange={(e) => setFormData({ ...formData, formationId: e.target.value })}
                                        >
                                            <option value="">Sélectionner</option>
                                            {formations.map(f => (
                                                <option key={f.id} value={f.id}>{f.nom}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
 Riverside
                            <div className="pt-6 flex gap-4">
                                <button type="button" onClick={closeModal} className="flex-1 secondary h-12">Annuler</button>
                                <button type="submit" disabled={isSubmitting} className="flex-1 primary h-12 disabled:opacity-50 flex items-center justify-center gap-2">
                                    {isSubmitting && <Loader2 size={18} className="animate-spin" />}
                                    {editingApprenant ? 'Mettre à jour' : 'Ajouter l\'apprenant'}
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
                                ? `Voulez-vous vraiment supprimer les ${selectedApprenants.length} apprenants sélectionnés ?`
                                : "Voulez-vous vraiment supprimer cet apprenant ?"
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

            {/* Import Result Side Panel */}
            {isImportResultOpen && importResult && (
                <>
                    {/* Overlay */}
                    <div
                        className="side-panel-overlay"
                        onClick={() => setIsImportResultOpen(false)}
                    />

                    {/* Panel */}
                    <div className="side-panel">
                        <div className="side-panel-header border-b border-glass-border">
                            <h3 className="text-xl font-bold text-text">
                                Compte-rendu d'importation
                            </h3>
                            <button
                                onClick={() => setIsImportResultOpen(false)}
                                className="p-2 hover:bg-surface-hover rounded-xl text-text-muted transition-all"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="side-panel-content custom-scrollbar space-y-6">
                            {/* Summary Card */}
                            <div className="p-6 rounded-2xl bg-surface border border-glass-border shadow-sm text-center">
                                <p className="text-sm font-bold text-text-muted uppercase tracking-wider mb-2">Taux de réussite</p>
                                <p className="text-5xl font-black text-primary">
                                    {Math.round((importResult.successCount / (importResult.totalAttempted || 1)) * 100)}%
                                </p>
                            </div>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-3 gap-3">
                                <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 text-center hover:bg-primary/10">
                                    <p className="text-xs font-bold text-primary/70 uppercase mb-1">Succès</p>
                                    <p className="text-2xl font-black text-primary">{importResult.successCount}</p>
                                </div>
                                <div className="p-4 rounded-2xl bg-error/5 border border-error/10 text-center hover:bg-error/10">
                                    <p className="text-xs font-bold text-error/70 uppercase mb-1">Échecs</p>
                                    <p className="text-2xl font-black text-error">{importResult.failureCount}</p>
                                </div>
                                <div className="p-4 rounded-2xl bg-surface border border-glass-border text-center shadow-sm hover:bg-surface-hover">
                                    <p className="text-xs font-bold text-text-muted uppercase mb-1">Total</p>
                                    <p className="text-2xl font-black text-text">{importResult.totalAttempted}</p>
                                </div>
                            </div>

                            {/* Detailed Errors */}
                            {importResult.errorMessages.length > 0 && (
                                <div className="space-y-4">
                                    <h4 className="text-sm font-bold text-text flex items-center gap-2">
                                        <AlertCircle size={16} className="text-error" />
                                        Détails des incidents ({importResult.errorMessages.length})
                                    </h4>
                                    <div className="space-y-3">
                                        {importResult.errorMessages.map((err, idx) => (
                                            <div key={idx} className="error-item">
                                                <div className="icon-box bg-error/10 text-error">
                                                    <AlertCircle size={18} />
                                                </div>
                                                <p className="text-sm text-text-muted leading-relaxed py-1">
                                                    {err}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="side-panel-footer">
                            <button
                                onClick={() => setIsImportResultOpen(false)}
                                className="w-full h-14 rounded-2xl bg-primary text-white font-bold text-lg hover:bg-primary-hover shadow-lg shadow-primary/20 flex items-center justify-center gap-2 group"
                            >
                                Terminer
                                <ArrowRight size={20} />
                            </button>
                        </div>
                    </div>
                </>
            )}
        </>
    );
};

export default LearnersPage;
