import React, { useState, useEffect } from 'react';
import {
    Users, Search, ChevronLeft, ChevronRight, ChevronDown,
    Loader2, FileText, Calendar, Mail, Send, Eye,
    MessageSquare, CheckCircle2, AlertCircle, UserCheck,
    Download, Maximize2, Minimize2, CheckCircle, XCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/api-client';
import { API_APPRENANT } from '../config';

interface TeamMember {
    id: number;
    nom: string;
    prenom: string;
    email: string;
}

interface ApprenantSuivi {
    id: number;
    nom: string;
    prenom: string;
    email: string;
    photoProfile?: string;
    role: string;
    specialite?: string;
    dateSoutenance: string | null;
    sujet?: {
        titre: string;
        description: string;
        objectifs: string[];
    };
    depotCount: number;
}

interface Depot {
    id: number;
    typeDepot: string;
    fichierUrl: string;
    dateDepot: string;
    statut: string;
    remarques: Remarque[];
}

interface Remarque {
    id: number;
    commentaire: string;
    dateRemarque: string;
    enseignantNom: string;
}

interface ApprenantDetails {
    apprenantNom: string;
    apprenantEmail: string;
    sujet?: { titre: string; description: string; objectifs: string[] };
    dateSoutenance: string | null;
    encadrant?: TeamMember;
    examinateurs?: TeamMember[];
    rapporteurs?: TeamMember[];
    depots: Depot[];
}

const DEPOT_LABELS: Record<string, string> = {
    DEPOT_1: '1er Dépôt',
    DEPOT_2: '2ème Dépôt',
    FINAL: 'Dépôt Final',
};

const SuiviPfePage = () => {
    const [apprenants, setApprenants] = useState<ApprenantSuivi[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('ALL');
    const [specialiteFilter, setSpecialiteFilter] = useState('ALL');
    const [selectedApprenant, setSelectedApprenant] = useState<ApprenantSuivi | null>(null);
    const [details, setDetails] = useState<ApprenantDetails | null>(null);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [newRemark, setNewRemark] = useState('');
    const [selectedDepotId, setSelectedDepotId] = useState<number | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [pdfModalDepot, setPdfModalDepot] = useState<Depot | null>(null);
    const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
    const [loadingPdf, setLoadingPdf] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);

    useEffect(() => {
        fetchApprenants();
    }, []);

    useEffect(() => {
        return () => {
            if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl);
        };
    }, [pdfBlobUrl]);

    const fetchApprenants = async () => {
        setLoading(true);
        try {
            const response = await api.get('/formateur/suivi-pfe');
            setApprenants(response.data);
        } catch (error) {
            console.error('Erreur lors de la récupération des apprenants', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchDetails = async (apprenant: ApprenantSuivi) => {
        setSelectedApprenant(apprenant);
        setLoadingDetails(true);
        setDetails(null);
        try {
            const response = await api.get(`/formateur/suivi-pfe/${apprenant.id}/depots`);
            setDetails(response.data);
        } catch (error) {
            console.error('Erreur lors de la récupération des détails', error);
        } finally {
            setLoadingDetails(false);
        }
    };

    const handleAddRemark = async (depotId: number) => {
        if (!newRemark.trim() || submitting) return;
        setSubmitting(true);
        setMessage(null);
        try {
            await api.post(`/formateur/suivi-pfe/depots/${depotId}/remarques`, {
                commentaire: newRemark.trim(),
            });
            setMessage({ type: 'success', text: 'Remarque ajoutée avec succès' });
            setNewRemark('');
            setSelectedDepotId(null);
            if (selectedApprenant) {
                fetchDetails(selectedApprenant);
            }
        } catch (error: any) {
            setMessage({ type: 'error', text: error.response?.data?.error || 'Erreur lors de l\'ajout de la remarque' });
        } finally {
            setSubmitting(false);
        }
    };

    const handleValiderDepot = async (depotId: number, action: 'VALIDER' | 'REFUSER') => {
        try {
            await api.post(`/formateur/suivi-pfe/depots/${depotId}/valider`, { action });
            setMessage({
                type: 'success',
                text: action === 'VALIDER' ? 'Dépôt validé avec succès' : 'Dépôt refusé'
            });
            if (selectedApprenant) {
                fetchDetails(selectedApprenant);
            }
        } catch (error: any) {
            setMessage({ type: 'error', text: error.response?.data?.error || 'Erreur lors de la validation' });
        }
    };

    const fetchPdfBlob = async (fichierUrl: string) => {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_APPRENANT}/mon-pfe/download/${fichierUrl}`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!response.ok) throw new Error('Erreur lors du chargement du PDF');
        return await response.blob();
    };

    const openPdfModal = async (depot: Depot) => {
        setPdfModalDepot(depot);
        setLoadingPdf(true);
        setPdfBlobUrl(null);
        try {
            const blob = await fetchPdfBlob(depot.fichierUrl);
            const url = URL.createObjectURL(blob);
            setPdfBlobUrl(url);
        } catch (err) {
            console.error('Erreur chargement PDF', err);
            setMessage({ type: 'error', text: 'Impossible de charger le PDF' });
            setPdfModalDepot(null);
        } finally {
            setLoadingPdf(false);
        }
    };

    const handleDownloadPdf = async (depot: Depot) => {
        try {
            const blob = await fetchPdfBlob(depot.fichierUrl);
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = depot.fichierUrl;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Erreur téléchargement', err);
        }
    };

    const closePdfModal = () => {
        if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl);
        setPdfBlobUrl(null);
        setPdfModalDepot(null);
        setIsFullscreen(false);
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'Non définie';
        return new Date(dateString).toLocaleString('fr-FR', {
            year: 'numeric', month: 'long', day: 'numeric',
            hour: '2-digit', minute: '2-digit',
        });
    };

    const filteredApprenants = apprenants.filter(a => {
        const query = search.toLowerCase();
        const matchesSearch = `${a.prenom} ${a.nom}`.toLowerCase().includes(query) ||
                              a.email.toLowerCase().includes(query);
        const matchesRole = roleFilter === 'ALL' || a.role === roleFilter;
        const matchesSpecialite = specialiteFilter === 'ALL' || a.specialite === specialiteFilter;
        return matchesSearch && matchesRole && matchesSpecialite;
    });

    const specialites = Array.from(
        new Set(apprenants.map(a => a.specialite).filter((s): s is string => !!s && s.trim() !== ''))
    ).sort();

    const getInitials = (a: ApprenantSuivi | TeamMember) =>
        `${(a.prenom || '?')[0]}${(a.nom || '?')[0]}`.toUpperCase();

    const renderTeamSection = (title: string, members: TeamMember[] | undefined, icon: React.ReactNode) => {
        if (!members || members.length === 0) return null;
        return (
            <div>
                <span className="text-xs uppercase font-bold text-text-muted tracking-wider flex items-center gap-1">
                    {icon} {title}
                </span>
                <div className="mt-2 space-y-2">
                    {members.map(m => (
                        <div key={m.id} className="flex items-center gap-3 bg-surface p-3 rounded-xl border border-glass-border">
                            <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold shrink-0">
                                {getInitials(m)}
                            </div>
                            <div className="min-w-0">
                                <p className="font-bold text-sm truncate">{m.prenom} {m.nom}</p>
                                <a href={`mailto:${m.email}`} className="text-xs text-text-muted hover:text-primary flex items-center gap-1">
                                    <Mail size={10} /> {m.email}
                                </a>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
        );
    }

    if (selectedApprenant) {
        return (
            <div className="space-y-6 animate-fade-in pb-10">
                {/* Header */}
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => { setSelectedApprenant(null); setDetails(null); setMessage(null); }}
                            className="secondary p-2 rounded-xl"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center font-black text-primary border border-primary/10 shrink-0">
                            {getInitials(selectedApprenant)}
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-text">
                                {selectedApprenant.prenom} {selectedApprenant.nom}
                            </h1>
                            <p className="text-text-muted text-sm flex items-center gap-1">
                                <Mail size={12} /> {selectedApprenant.email} &middot; <span className="text-primary font-bold">{selectedApprenant.role}</span>
                            </p>
                        </div>
                    </div>
                </div>

                {message && (
                    <div className={`p-4 rounded-xl flex items-center gap-3 font-medium ${
                        message.type === 'success'
                            ? 'bg-success/10 text-success border border-success/20'
                            : 'bg-error/10 text-error border border-error/20'
                    }`}>
                        {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                        {message.text}
                    </div>
                )}

                {loadingDetails ? (
                    <div className="flex justify-center items-center h-40">
                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    </div>
                ) : details ? (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left: Subject, Team & Info */}
                        <div className="lg:col-span-1 space-y-6">
                            {/* Subject */}
                            {details.sujet && (
                                <div className="glass p-6 rounded-3xl bg-gradient-to-br from-primary/5 to-transparent border border-primary/10">
                                    <h3 className="text-xl font-bold flex items-center gap-3 mb-4">
                                        <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                            <FileText size={20} />
                                        </div>
                                        Sujet
                                    </h3>
                                    <h4 className="font-extrabold text-lg leading-tight text-text mb-2">
                                        {details.sujet.titre}
                                    </h4>
                                    <p className="text-sm text-text-muted leading-relaxed whitespace-pre-wrap">
                                        {details.sujet.description}
                                    </p>
                                    {details.sujet.objectifs && details.sujet.objectifs.length > 0 && (
                                        <div className="mt-4 pt-4 border-t border-glass-border">
                                            <h5 className="font-bold text-sm mb-3 uppercase tracking-wider text-primary">
                                                Objectifs
                                            </h5>
                                            <ul className="space-y-2">
                                                {details.sujet.objectifs.map((obj, i) => (
                                                    <li key={i} className="flex items-start gap-2 text-sm text-text-muted">
                                                        <span className="text-primary mt-0.5">&bull;</span>
                                                        <span>{obj}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Date Soutenance */}
                            <div className="glass p-6 rounded-3xl">
                                <h3 className="text-xl font-bold flex items-center gap-3 mb-4">
                                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                        <Calendar size={20} />
                                    </div>
                                    Date de Soutenance
                                </h3>
                                <div className="bg-gradient-to-r from-primary/20 to-primary/5 border border-primary/20 text-primary p-4 rounded-2xl font-bold text-center shadow-inner">
                                    {formatDate(details.dateSoutenance)}
                                </div>
                            </div>

                            {/* Team */}
                            <div className="glass p-6 rounded-3xl space-y-5">
                                <h3 className="text-xl font-bold flex items-center gap-3">
                                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                        <Users size={20} />
                                    </div>
                                    Équipe d'évaluation
                                </h3>
                                {renderTeamSection('Encadrant', details.encadrant ? [details.encadrant] : undefined, <UserCheck size={12} />)}
                                {renderTeamSection('Examinateurs', details.examinateurs, <Users size={12} />)}
                                {renderTeamSection('Rapporteurs', details.rapporteurs, <Users size={12} />)}
                                {!details.encadrant && (!details.examinateurs || details.examinateurs.length === 0) && (!details.rapporteurs || details.rapporteurs.length === 0) && (
                                    <p className="text-text-muted text-sm italic">Aucun membre d'équipe assigné</p>
                                )}
                            </div>
                        </div>

                        {/* Right: Depots & Remarks */}
                        <div className="lg:col-span-2 space-y-6">
                            <h3 className="text-2xl font-bold">Dépôts & Remarques</h3>

                            {details.depots.length === 0 ? (
                                <div className="glass p-12 text-center rounded-2xl">
                                    <AlertCircle size={40} className="mx-auto text-text-muted mb-3 opacity-30" />
                                    <p className="text-text-muted">Aucun dépôt effectué pour le moment.</p>
                                </div>
                            ) : (
                                details.depots.map(depot => (
                                    <motion.div
                                        key={depot.id}
                                        initial={{ opacity: 0, y: 12 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="glass p-6 rounded-2xl"
                                    >
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h4 className="text-lg font-bold">{DEPOT_LABELS[depot.typeDepot] || depot.typeDepot}</h4>
                                                <p className="text-text-muted text-sm">
                                                    Déposé le {formatDate(depot.dateDepot)}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {/* Status badge only for DEPOT_1 */}
                                                {depot.typeDepot === 'DEPOT_1' && (
                                                <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                                                    depot.statut === 'VALIDE' ? 'bg-success/15 text-success border border-success/20' :
                                                    depot.statut === 'REFUSE' ? 'bg-error/15 text-error border border-error/20' :
                                                    'bg-warning/15 text-warning border border-warning/20'
                                                }`}>
                                                    {depot.statut === 'VALIDE' ? 'Validé' :
                                                     depot.statut === 'REFUSE' ? 'Refusé' : 'En attente'}
                                                </span>
                                                )}
                                                <button
                                                    onClick={() => handleDownloadPdf(depot)}
                                                    className="secondary flex items-center gap-1.5 text-sm"
                                                    title="Télécharger"
                                                >
                                                    <Download size={15} />
                                                </button>
                                                <button
                                                    onClick={() => openPdfModal(depot)}
                                                    className="secondary flex items-center gap-1.5 text-sm"
                                                >
                                                    <Eye size={15} /> Voir PDF
                                                </button>
                                            </div>
                                        </div>

                                        {/* Validation buttons for encadrant on DEPOT_1 */}
                                        {depot.typeDepot === 'DEPOT_1' && selectedApprenant.role === 'Encadrant' && depot.statut === 'EN_ATTENTE' && (
                                            <div className="flex items-center gap-3 mb-4 p-4 bg-surface/50 border border-glass-border rounded-xl">
                                                <span className="text-sm font-bold text-text-muted">Décision :</span>
                                                <button
                                                    onClick={() => handleValiderDepot(depot.id, 'VALIDER')}
                                                    className="flex items-center gap-1.5 text-sm font-bold px-4 py-2 rounded-xl bg-success/15 text-success border border-success/20 hover:bg-success/25 transition-all"
                                                >
                                                    <CheckCircle size={16} /> Valider
                                                </button>
                                                <button
                                                    onClick={() => handleValiderDepot(depot.id, 'REFUSER')}
                                                    className="flex items-center gap-1.5 text-sm font-bold px-4 py-2 rounded-xl bg-error/15 text-error border border-error/20 hover:bg-error/25 transition-all"
                                                >
                                                    <XCircle size={16} /> Refuser
                                                </button>
                                            </div>
                                        )}

                                        {/* File info */}
                                        <div className="bg-surface/50 border border-glass-border rounded-xl p-4 mb-4">
                                            <div className="flex items-center gap-3">
                                                <FileText size={20} className="text-primary" />
                                                <span className="text-sm font-medium truncate">{depot.fichierUrl}</span>
                                            </div>
                                        </div>

                                        {/* Remarks */}
                                        {depot.remarques.length > 0 && (
                                            <div className="space-y-3 mb-4">
                                                <h5 className="text-sm font-bold text-text-muted uppercase tracking-wider flex items-center gap-2">
                                                    <MessageSquare size={14} /> Remarques ({depot.remarques.length})
                                                </h5>
                                                {depot.remarques.map(remarque => (
                                                    <div key={remarque.id} className="bg-primary/5 border border-primary/10 rounded-xl p-4">
                                                        <div className="flex justify-between items-center mb-2">
                                                            <span className="text-sm font-bold text-primary">{remarque.enseignantNom}</span>
                                                            <span className="text-xs text-text-muted">{formatDate(remarque.dateRemarque)}</span>
                                                        </div>
                                                        <p className="text-sm text-text-muted">{remarque.commentaire}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Add remark */}
                                        {!(depot.typeDepot === 'DEPOT_1' && selectedApprenant.role !== 'Encadrant') && (
                                        <div className="border-t border-glass-border pt-4">
                                            {selectedDepotId === depot.id ? (
                                                <div className="space-y-3">
                                                    <textarea
                                                        className="form-input w-full"
                                                        rows={3}
                                                        placeholder="Écrivez votre remarque..."
                                                        value={newRemark}
                                                        onChange={e => setNewRemark(e.target.value)}
                                                        autoFocus
                                                    />
                                                    <div className="flex items-center gap-2 justify-end">
                                                        <button
                                                            onClick={() => { setSelectedDepotId(null); setNewRemark(''); }}
                                                            className="secondary text-sm px-4 py-2"
                                                        >
                                                            Annuler
                                                        </button>
                                                        <button
                                                            onClick={() => handleAddRemark(depot.id)}
                                                            disabled={!newRemark.trim() || submitting}
                                                            className="primary text-sm px-4 py-2 flex items-center gap-2"
                                                        >
                                                            {submitting ? (
                                                                <Loader2 size={14} className="animate-spin" />
                                                            ) : (
                                                                <Send size={14} />
                                                            )}
                                                            Envoyer
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => setSelectedDepotId(depot.id)}
                                                    className="secondary w-full flex items-center justify-center gap-2 text-sm"
                                                >
                                                    <MessageSquare size={15} />
                                                    Ajouter une remarque
                                                </button>
                                            )}
                                        </div>
                                        )}
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </div>
                ) : null}

                {/* PDF Modal */}
                <AnimatePresence>
                    {pdfModalDepot && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
                            onClick={closePdfModal}
                        >
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                className={`bg-surface rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-glass-border transition-all ${
                                    isFullscreen ? 'fixed inset-2 z-[110]' : 'w-full max-w-5xl h-[85vh]'
                                }`}
                                onClick={e => e.stopPropagation()}
                            >
                                <div className="flex items-center justify-between px-6 py-4 border-b border-glass-border shrink-0">
                                    <h3 className="font-bold text-lg">
                                        {DEPOT_LABELS[pdfModalDepot.typeDepot]} - {selectedApprenant?.prenom} {selectedApprenant?.nom}
                                    </h3>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleDownloadPdf(pdfModalDepot)}
                                            className="p-2 rounded-xl hover:bg-surface-hover text-text-muted hover:text-primary transition-all"
                                            title="Télécharger"
                                        >
                                            <Download size={20} />
                                        </button>
                                        <button
                                            onClick={() => setIsFullscreen(!isFullscreen)}
                                            className="p-2 rounded-xl hover:bg-surface-hover text-text-muted hover:text-primary transition-all"
                                            title={isFullscreen ? "Réduire" : "Plein écran"}
                                        >
                                            {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                                        </button>
                                        <button
                                            onClick={closePdfModal}
                                            className="p-2 rounded-xl hover:bg-surface-hover text-text-muted hover:text-text transition-all text-xl leading-none"
                                        >
                                            &times;
                                        </button>
                                    </div>
                                </div>
                                {loadingPdf ? (
                                    <div className="flex-1 flex items-center justify-center">
                                        <Loader2 className="w-10 h-10 text-primary animate-spin" />
                                    </div>
                                ) : pdfBlobUrl ? (
                                    <iframe
                                        src={pdfBlobUrl}
                                        className="flex-1 w-full border-none"
                                        title="PDF Viewer"
                                    />
                                ) : (
                                    <div className="flex-1 flex items-center justify-center text-text-muted">
                                        Erreur de chargement
                                    </div>
                                )}
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    }

    // List view
    return (
        <div className="space-y-8 animate-fade-in pb-10">
            <div>
                <h1 className="text-3xl font-bold" style={{ background: 'linear-gradient(135deg, #6366f1, #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    Suivi des Dépôts PFE
                </h1>
                <p className="text-text-muted mt-1">Consultez les dépôts de vos apprenants et laissez vos remarques.</p>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative max-w-md flex-1">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
                    <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Rechercher un apprenant..."
                        className="form-input pl-12 w-full"
                    />
                </div>
                <div className="relative max-w-xs flex-1">
                    <select
                        value={roleFilter}
                        onChange={e => setRoleFilter(e.target.value)}
                        className="form-input appearance-none w-full font-bold"
                    >
                        <option value="ALL">Tous les rôles</option>
                        <option value="Encadrant">Encadrant</option>
                        <option value="Examinateur">Examinateur</option>
                        <option value="Rapporteur">Rapporteur</option>
                    </select>
                    <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                </div>
                <div className="relative max-w-xs flex-1">
                    <select
                        value={specialiteFilter}
                        onChange={e => setSpecialiteFilter(e.target.value)}
                        className="form-input appearance-none w-full font-bold"
                    >
                        <option value="ALL">Toutes les spécialités</option>
                        {specialites.map(s => (
                            <option key={s} value={s}>{s}</option>
                        ))}
                    </select>
                    <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                </div>
            </div>

            {/* Apprenants Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredApprenants.map(a => (
                    <motion.div
                        key={a.id}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        whileHover={{ scale: 1.02 }}
                        onClick={() => fetchDetails(a)}
                        className="glass p-6 cursor-pointer hover:border-primary/40 transition-all group"
                        style={{ borderRadius: '20px' }}
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center font-black text-primary text-lg border border-primary/10 shadow-inner shrink-0">
                                {getInitials(a)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-text group-hover:text-primary transition-colors truncate">
                                    {a.prenom} {a.nom}
                                </h3>
                                <p className="text-text-muted text-xs truncate mt-0.5">{a.email}</p>
                                <div className="flex items-center gap-2 mt-2 flex-wrap">
                                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                                        {a.role}
                                    </span>
                                    {a.specialite && (
                                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-secondary/10 text-secondary border border-secondary/20">
                                            {a.specialite}
                                        </span>
                                    )}
                                    {a.sujet && (
                                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-surface-hover border border-glass-border text-text-muted">
                                            {a.sujet.titre.length > 20 ? a.sujet.titre.substring(0, 20) + '...' : a.sujet.titre}
                                        </span>
                                    )}
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-success/10 text-success">
                                        {a.depotCount} dépôt{a.depotCount !== 1 ? 's' : ''}
                                    </span>
                                </div>
                            </div>
                            <ChevronRight size={20} className="text-text-muted group-hover:text-primary transition-colors shrink-0" />
                        </div>
                    </motion.div>
                ))}

                {filteredApprenants.length === 0 && (
                    <div className="col-span-3 glass p-12 text-center" style={{ borderRadius: '20px' }}>
                        <Users size={48} className="mx-auto text-text-muted mb-4 opacity-20" />
                        <h3 className="text-lg font-bold">Aucun apprenant trouvé</h3>
                        <p className="text-text-muted text-sm mt-1">Aucun apprenant n'est lié à votre encadrement ou jury.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SuiviPfePage;
