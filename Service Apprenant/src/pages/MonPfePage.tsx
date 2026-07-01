import { useState, useEffect } from 'react';
import { 
    FolderOpen, 
    Upload, 
    FileText, 
    Calendar, 
    UserCheck, 
    Users, 
    Mail, 
    CheckCircle2, 
    AlertCircle,
    Loader2,
    MessageSquare,
    CheckCircle,
    XCircle
} from 'lucide-react';
import api from '../api/api-client';

interface Remarque {
    enseignantNom: string;
    commentaire: string;
    dateRemarque: string;
}

interface MonPfeData {
    sujetTitre: string | null;
    sujetDescription: string | null;
    objectifs: string[] | null;
    dateSoutenance: string | null;
    encadrant: { nom: string; prenom: string; email: string } | null;
    examinateurs: { nom: string; prenom: string; email: string }[] | null;
    rapporteurs: { nom: string; prenom: string; email: string }[] | null;
    deadlines: { [key: string]: string };
    depots: {
        [key: string]: {
            fichierUrl: string;
            dateDepot: string;
            remarques?: Remarque[];
            statut?: string;
        }
    };
}

const MonPfePage = () => {
    const [data, setData] = useState<MonPfeData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState<{ [key: string]: boolean }>({});
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        fetchPfeData();
    }, []);

    const fetchPfeData = async () => {
        setIsLoading(true);
        try {
            const response = await api.get('/mon-pfe');
            setData(response.data);
        } catch (error) {
            console.error("Erreur lors de la récupération des données", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFileUpload = async (typeDepot: string, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.type !== 'application/pdf') {
            setMessage({ type: 'error', text: 'Veuillez sélectionner un fichier PDF.' });
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        setIsUploading(prev => ({ ...prev, [typeDepot]: true }));
        setMessage(null);

        try {
            await api.post(`/mon-pfe/upload/${typeDepot}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setMessage({ type: 'success', text: 'Fichier déposé avec succès !' });
            fetchPfeData(); // Refresh to see the new depot
        } catch (error: any) {
            console.error("Erreur d'upload", error);
            setMessage({ type: 'error', text: error.response?.data?.error || 'Erreur lors du dépôt.' });
        } finally {
            setIsUploading(prev => ({ ...prev, [typeDepot]: false }));
            if (e.target) e.target.value = ''; // Reset input
        }
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'Non définie';
        return new Date(dateString).toLocaleString('fr-FR', {
            year: 'numeric', month: 'long', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
        );
    }

    if (!data) return null;

    // Restriction d'accès : seulement pour les étudiants avec sujet et encadrant
    if (!data.sujetTitre || !data.encadrant) {
        return (
            <div className="flex justify-center items-center h-[70vh] animate-fade-in">
                <div className="glass p-10 rounded-3xl text-center max-w-lg border border-warning/20 shadow-xl shadow-warning/5 bg-gradient-to-br from-warning/10 to-transparent">
                    <div className="w-20 h-20 bg-warning/20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                        <AlertCircle size={40} className="text-warning" />
                    </div>
                    <h2 className="text-3xl font-extrabold mb-4 text-text">Accès restreint</h2>
                    <p className="text-text-muted text-lg leading-relaxed">
                        Cette page est accessible uniquement aux apprenants ayant un <strong>sujet</strong> et un <strong>encadrant</strong> affectés pour l'année en cours.
                    </p>
                </div>
            </div>
        );
    }

    const renderDepotSection = (title: string, typeDepot: string, description: string) => {
        const isEnabled = data.deadlines[`DEADLINE_${typeDepot}_ENABLED`] === 'true';
        const deadlineDate = data.deadlines[`DEADLINE_${typeDepot}`];
        const depot = data.depots[typeDepot];

        let isExpired = false;
        if (deadlineDate) {
            isExpired = new Date() > new Date(deadlineDate);
        }
        
        const canUpload = isEnabled && !isExpired;
        const remarques = depot?.remarques || [];

        return (
            <div className="glass p-6 rounded-2xl mb-6 relative overflow-hidden">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h3 className="text-xl font-bold mb-1">{title}</h3>
                        <p className="text-text-muted text-sm">{description}</p>
                    </div>
                    {deadlineDate && (
                        <div className="text-right">
                            <span className="text-xs text-text-muted uppercase font-bold tracking-wider">Date limite</span>
                            <div className="font-medium">{formatDate(deadlineDate)}</div>
                        </div>
                    )}
                </div>

                {depot ? (
                    depot.statut === 'REFUSE' && typeDepot === 'DEPOT_1' ? (
                        <div className="space-y-4">
                            <div className="bg-gradient-to-r from-error/10 to-transparent border border-error/20 rounded-2xl p-5 flex items-center justify-between shadow-sm">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-error/20 flex items-center justify-center text-error shadow-inner">
                                        <XCircle size={24} />
                                    </div>
                                    <div>
                                        <p className="font-bold text-error text-lg">Dépôt refusé par l'encadrant</p>
                                        <p className="text-sm opacity-80">Vous pouvez déposer une version corrigée</p>
                                    </div>
                                </div>
                                <span className="text-sm bg-error text-white shadow-lg shadow-error/30 px-4 py-1.5 rounded-full font-bold">Refusé</span>
                            </div>
                            {/* Re-upload for rejected DEPOT_1 */}
                            <label className={`
                                relative overflow-hidden
                                flex flex-col items-center justify-center w-full h-40 
                                border-2 border-dashed rounded-2xl 
                                transition-all duration-300 group
                                ${canUpload 
                                    ? 'border-primary/40 hover:border-primary bg-gradient-to-br from-surface to-primary/5 hover:from-primary/5 hover:to-primary/10 shadow-sm hover:shadow-md cursor-pointer' 
                                    : 'border-glass-border bg-surface/30 cursor-not-allowed opacity-60'
                                }
                            `}>
                                {canUpload && <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/5 transition-colors duration-300"></div>}
                                {!canUpload && (
                                    <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/40 backdrop-blur-[2px]">
                                        <div className="bg-surface/90 px-6 py-3 rounded-2xl text-sm font-bold border border-glass-border shadow-xl flex items-center gap-2">
                                            {isExpired ? (
                                                <>
                                                    <Calendar size={18} className="text-error" />
                                                    Délai dépassé
                                                </>
                                            ) : (
                                                <>
                                                    <AlertCircle size={18} className="text-text-muted" />
                                                    Dépôt désactivé
                                                </>
                                            )}
                                        </div>
                                    </div>
                                )}
                                <div className="flex flex-col items-center justify-center pt-5 pb-6 relative z-10">
                                    {isUploading[typeDepot] ? (
                                        <Loader2 className="w-10 h-10 text-primary animate-spin mb-3 drop-shadow-md" />
                                    ) : (
                                        <div className={`p-3 rounded-full mb-3 transition-transform duration-300 ${canUpload ? 'group-hover:scale-110 bg-primary/10 text-primary' : 'bg-surface border border-glass-border text-text-muted'}`}>
                                            <Upload className="w-6 h-6" />
                                        </div>
                                    )}
                                    <p className="text-sm font-bold mt-1">
                                        {isUploading[typeDepot] ? 'Envoi en cours...' : 'Déposer une version corrigée'}
                                    </p>
                                </div>
                                <input 
                                    type="file" 
                                    className="hidden" 
                                    accept="application/pdf"
                                    onChange={(e) => handleFileUpload(typeDepot, e)}
                                    disabled={!canUpload || isUploading[typeDepot]}
                                />
                            </label>
                        </div>
                    ) : (
                    <div className="bg-gradient-to-r from-success/10 to-transparent border border-success/20 rounded-2xl p-5 flex items-center justify-between shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-success/20 flex items-center justify-center text-success shadow-inner">
                                <CheckCircle2 size={24} />
                            </div>
                            <div>
                                <p className="font-bold text-success text-lg">Fichier déposé</p>
                                <p className="text-sm opacity-80">Le {formatDate(depot.dateDepot)}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {typeDepot === 'DEPOT_1' && (
                            <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                                depot.statut === 'VALIDE' ? 'bg-success/20 text-success' :
                                depot.statut === 'REFUSE' ? 'bg-error/20 text-error' :
                                'bg-warning/20 text-warning'
                            }`}>
                                {depot.statut === 'VALIDE' ? 'Validé' :
                                 depot.statut === 'REFUSE' ? 'Refusé' : 'En attente'}
                            </span>
                            )}
                            <span className="text-sm bg-success text-white shadow-lg shadow-success/30 px-4 py-1.5 rounded-full font-bold">Terminé</span>
                        </div>
                    </div>
                    )
                ) : (
                    <div className="mt-4">
                        <label className={`
                            relative overflow-hidden
                            flex flex-col items-center justify-center w-full h-40 
                            border-2 border-dashed rounded-2xl 
                            transition-all duration-300 group
                            ${canUpload 
                                ? 'border-primary/40 hover:border-primary bg-gradient-to-br from-surface to-primary/5 hover:from-primary/5 hover:to-primary/10 shadow-sm hover:shadow-md cursor-pointer' 
                                : 'border-glass-border bg-surface/30 cursor-not-allowed opacity-60'
                            }
                        `}>
                            {canUpload && <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/5 transition-colors duration-300"></div>}
                            
                            {!canUpload && (
                                <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/40 backdrop-blur-[2px]">
                                    <div className="bg-surface/90 px-6 py-3 rounded-2xl text-sm font-bold border border-glass-border shadow-xl flex items-center gap-2">
                                        {isExpired ? (
                                            <>
                                                <Calendar size={18} className="text-error" />
                                                Délai dépassé
                                            </>
                                        ) : (
                                            <>
                                                <AlertCircle size={18} className="text-text-muted" />
                                                Dépôt désactivé
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="flex flex-col items-center justify-center pt-5 pb-6 relative z-10">
                                {isUploading[typeDepot] ? (
                                    <Loader2 className="w-10 h-10 text-primary animate-spin mb-3 drop-shadow-md" />
                                ) : (
                                    <div className={`p-3 rounded-full mb-3 transition-transform duration-300 ${canUpload ? 'group-hover:scale-110 bg-primary/10 text-primary' : 'bg-surface border border-glass-border text-text-muted'}`}>
                                        <Upload className="w-6 h-6" />
                                    </div>
                                )}
                                <p className="text-sm font-bold mt-1">
                                    {isUploading[typeDepot] ? 'Envoi en cours...' : 'Cliquez pour sélectionner un PDF'}
                                </p>
                                {canUpload && !isUploading[typeDepot] && (
                                    <p className="text-xs text-text-muted mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        Taille max: 100MB
                                    </p>
                                )}
                            </div>
                            <input 
                                type="file" 
                                className="hidden" 
                                accept="application/pdf"
                                onChange={(e) => handleFileUpload(typeDepot, e)}
                                disabled={!canUpload || isUploading[typeDepot]}
                            />
                        </label>
                    </div>
                )}

                {/* Remarques du jury / encadrant */}
                {remarques.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-glass-border">
                        <h5 className="text-sm font-bold text-text-muted uppercase tracking-wider flex items-center gap-2 mb-3">
                            <MessageSquare size={14} /> Remarques du jury / encadrant ({remarques.length})
                        </h5>
                        <div className="space-y-3">
                            {remarques.map((remarque, idx) => (
                                <div key={idx} className="bg-primary/5 border border-primary/10 rounded-xl p-4">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm font-bold text-primary">{remarque.enseignantNom}</span>
                                        <span className="text-xs text-text-muted">{formatDate(remarque.dateRemarque)}</span>
                                    </div>
                                    <p className="text-sm text-text-muted">{remarque.commentaire}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="space-y-8 animate-fade-in pb-20">
            {/* Header */}
            <div className="relative">
                <div className="absolute -top-10 -left-10 w-40 h-40 bg-primary/20 rounded-full blur-[80px] pointer-events-none"></div>
                <h2 className="text-4xl font-extrabold flex items-center gap-4 relative z-10">
                    <div className="p-3 bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl text-primary shadow-lg shadow-primary/10 border border-primary/10">
                        <FolderOpen size={32} />
                    </div>
                    <span className="bg-gradient-to-r from-text to-text-muted bg-clip-text text-transparent">Mon PFE</span>
                </h2>
                <p className="text-text-muted mt-3 text-lg font-medium max-w-2xl">Retrouvez toutes les informations sur votre projet de fin d'études et déposez vos rapports de manière sécurisée.</p>
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Info */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Sujet Info */}
                    <div className="glass p-6 rounded-3xl bg-gradient-to-br from-primary/5 to-transparent border border-primary/10 shadow-xl shadow-black/5 hover:shadow-primary/5 transition-all duration-300">
                        <h3 className="text-xl font-bold flex items-center gap-3 mb-5">
                            <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                <FileText size={20} />
                            </div>
                            Mon Sujet
                        </h3>
                        {data.sujetTitre ? (
                            <div className="space-y-4">
                                <h4 className="font-extrabold text-xl leading-tight text-text">{data.sujetTitre}</h4>
                                <p className="text-sm text-text-muted leading-relaxed whitespace-pre-wrap">{data.sujetDescription}</p>
                                
                                {data.objectifs && data.objectifs.length > 0 && (
                                    <div className="mt-4 pt-4 border-t border-glass-border">
                                        <h5 className="font-bold text-sm mb-3 uppercase tracking-wider text-primary">Objectifs</h5>
                                        <ul className="space-y-2">
                                            {data.objectifs.map((obj, i) => (
                                                <li key={i} className="flex items-start gap-2 text-sm text-text-muted">
                                                    <span className="text-primary mt-0.5">•</span>
                                                    <span>{obj}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-text-muted bg-surface/50 rounded-2xl border border-glass-border">
                                Aucun sujet assigné pour le moment.
                            </div>
                        )}
                    </div>

                    {/* Soutenance Date */}
                    <div className="glass p-6 rounded-3xl relative overflow-hidden group hover:shadow-xl transition-all duration-300">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-[50px] group-hover:bg-primary/20 transition-colors"></div>
                        <h3 className="text-xl font-bold flex items-center gap-3 mb-5 relative z-10">
                            <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                <Calendar size={20} />
                            </div>
                            Date de Soutenance
                        </h3>
                        {data.dateSoutenance ? (
                            <div className="relative z-10 bg-gradient-to-r from-primary/20 to-primary/5 border border-primary/20 text-primary p-5 rounded-2xl font-bold text-center text-xl shadow-inner backdrop-blur-md">
                                {formatDate(data.dateSoutenance)}
                            </div>
                        ) : (
                            <div className="relative z-10 text-center py-8 text-text-muted bg-surface/50 rounded-2xl border border-glass-border">
                                Pas encore programmée.
                            </div>
                        )}
                    </div>

                    {/* Jury Info */}
                    <div className="glass p-6 rounded-3xl bg-gradient-to-br from-surface to-transparent shadow-xl shadow-black/5 hover:shadow-lg transition-all duration-300 border border-glass-border">
                        <h3 className="text-xl font-bold flex items-center gap-3 mb-6">
                            <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                <Users size={20} />
                            </div>
                            Équipe d'évaluation
                        </h3>
                        
                        <div className="space-y-4">
                            {/* Encadrant */}
                            <div>
                                <span className="text-xs uppercase font-bold text-text-muted tracking-wider">Encadrant</span>
                                {data.encadrant ? (
                                    <div className="mt-2 flex items-center gap-3 bg-surface p-3 rounded-xl border border-glass-border">
                                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                                            <UserCheck size={18} />
                                        </div>
                                        <div>
                                            <p className="font-bold">{data.encadrant.nom} {data.encadrant.prenom}</p>
                                            <a href={`mailto:${data.encadrant.email}`} className="text-xs text-text-muted hover:text-primary flex items-center gap-1">
                                                <Mail size={12} /> {data.encadrant.email}
                                            </a>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-sm text-text-muted mt-1 italic">Non assigné</p>
                                )}
                            </div>


                        </div>
                    </div>
                </div>

                {/* Right Column: Depots */}
                <div className="lg:col-span-2">
                    <div className="sticky top-6">
                        <h3 className="text-2xl font-bold mb-6">Dépôts de Rapports</h3>
                        
                        {renderDepotSection(
                            "1er Dépôt (Rapport Intermédiaire)", 
                            "DEPOT_1", 
                            "Soumettez la première version de votre rapport pour évaluation."
                        )}

                        {renderDepotSection(
                            "2ème Dépôt", 
                            "DEPOT_2", 
                            "Soumettez la deuxième version corrigée de votre rapport."
                        )}

                        {renderDepotSection(
                            "Dépôt Final", 
                            "FINAL", 
                            "Soumettez la version finale et complète de votre mémoire de PFE."
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MonPfePage;
