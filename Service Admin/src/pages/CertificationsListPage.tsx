import { useState, useEffect } from 'react';
import { Search, Award, Download, Eye, Filter, Loader2 } from 'lucide-react';
import type { Certification } from '../types';
import api from '../api/api-client';

const CertificationsListPage = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [certifications, setCertifications] = useState<Certification[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchCertifications();
    }, []);

    const fetchCertifications = async () => {
        setIsLoading(true);
        try {
            const response = await api.get('/certifications');
            setCertifications(response.data);
        } catch (error) {
            console.error("Failed to fetch certifications", error);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredCerts = certifications.filter(cert => {
        const matchesSearch = (cert.learnerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (cert.title || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'all' || cert.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    if (isLoading) {
        return (
            <div className="h-[60vh] flex items-center justify-center">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold">Certifications Délivrées</h2>
                    <p className="text-text-muted">Consultez l'historique des certifications de vos apprenants.</p>
                </div>
                <div className="p-3 bg-primary/10 text-primary rounded-xl">
                    <Award size={24} />
                </div>
            </div>

            <div className="glass overflow-hidden shadow-xl">
                <div className="p-6 border-b border-glass-border flex flex-col md:flex-row gap-4 justify-between">
                    <div className="search-container w-full max-w-md">
                        <div className="search-icon"><Search size={18} /></div>
                        <input
                            type="text"
                            placeholder="Rechercher par étudiant ou cours..."
                            className="search-input"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Filter size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted" />
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="pl-10 pr-4 py-2 bg-background border border-glass-border rounded-xl text-text focus:border-primary focus:outline-none appearance-none"
                            >
                                <option value="all">Tous les statuts</option>
                                <option value="Délivré">Délivré</option>
                                <option value="En attente">En attente</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-surface-hover/50 text-text-muted text-xs uppercase tracking-widest">
                                <th className="text-left p-4">Apprenant</th>
                                <th className="text-left p-4">Formation</th>
                                <th className="text-left p-4">Date d'obtention</th>
                                <th className="text-center p-4">Score</th>
                                <th className="text-center p-4">Statut</th>
                                <th className="text-center p-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-glass-border">
                            {filteredCerts.length > 0 ? (
                                filteredCerts.map((cert) => (
                                    <tr key={cert.id} className="hover:bg-surface-hover/30 transition-colors">
                                        <td className="p-4 font-bold text-text">{cert.learnerName}</td>
                                        <td className="p-4 text-text-muted">{cert.title}</td>
                                        <td className="p-4 text-text-muted">{cert.date ? new Date(cert.date).toLocaleDateString('fr-FR') : 'N/A'}</td>
                                        <td className="p-4 text-center">
                                            <span className={`px-2 py-1 rounded-lg text-xs font-bold ${(cert.score || 0) >= 90 ? 'bg-success/10 text-success' :
                                                (cert.score || 0) >= 70 ? 'bg-warning/10 text-warning' : 'bg-error/10 text-error'
                                                }`}>
                                                {cert.score || 0}%
                                            </span>
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className={`tag ${cert.status === 'Délivré' ? 'bg-success/20 text-success border-success/20' : 'bg-warning/20 text-warning border-warning/20'}`}>
                                                {cert.status}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex justify-center gap-2">
                                                <button className="w-9 h-9 p-0 text-primary hover:bg-primary/10 rounded-xl transition-all icon-container" title="Voir">
                                                    <Eye size={16} />
                                                </button>
                                                <button className="w-9 h-9 p-0 text-secondary hover:bg-secondary/10 rounded-xl transition-all icon-container" title="Télécharger">
                                                    <Download size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="py-20 text-center text-text-muted font-medium">Aucune certification trouvée</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default CertificationsListPage;
