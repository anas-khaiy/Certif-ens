import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Search, FileText, Filter, Eye, Loader2, Calendar, BookOpen, AlertCircle, Users, CheckCircle2, FileCheck, X, ChevronDown, Download
} from 'lucide-react';
import api from '../api/api-client';

/* ──────────────────── Pagination ──────────────────── */
const Pagination = ({ page, totalPages, total, itemsPerPage, label, onPageChange }: {
    page: number; totalPages: number; total: number; itemsPerPage: number; label: string; onPageChange: (p: number) => void;
}) => {
    if (totalPages <= 1) return null;
    const getPageNumbers = () => {
        const pages: (number | string)[] = [];
        if (totalPages <= 4) {
            for (let i = 0; i < totalPages; i++) pages.push(i);
        } else {
            pages.push(0);
            if (page > 2) pages.push('...');
            for (let i = Math.max(1, page - 1); i <= Math.min(totalPages - 2, page + 1); i++) pages.push(i);
            if (page < totalPages - 3) pages.push('...');
            pages.push(totalPages - 1);
        }
        return pages;
    };
    return (
        <div className="pagination border-t border-glass-border bg-surface-hover/10 px-6 py-4 flex items-center justify-between">
            <div className="pagination-info text-text-muted text-xs">
                Affichage <span className="text-text font-bold">{page * itemsPerPage + 1}</span> à <span className="text-text font-bold">{Math.min((page + 1) * itemsPerPage, total)}</span> sur <span className="text-text font-bold">{total}</span> {label}
            </div>
            <div className="flex items-center gap-1">
                <button onClick={() => onPageChange(Math.max(0, page - 1))} disabled={page === 0}
                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface border border-glass-border text-text hover:text-primary disabled:opacity-20 transition-all font-bold text-xl pb-1">
                    &laquo;
                </button>
                <div className="flex gap-1">
                    {getPageNumbers().map((p, i) =>
                        typeof p === 'string' ? (
                            <span key={`dots-${i}`} className="w-10 h-10 flex items-center justify-center text-text-muted font-bold text-xs">...</span>
                        ) : (
                            <button key={p} onClick={() => onPageChange(p as number)}
                                className={`w-10 h-10 rounded-xl font-bold transition-all text-xs border ${p === page ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-110 z-10' : 'bg-surface border-glass-border text-text-muted hover:border-primary hover:text-primary'}`}>
                                {(p as number) + 1}
                            </button>
                        )
                    )}
                </div>
                <button onClick={() => onPageChange(Math.min(totalPages - 1, page + 1))} disabled={page >= totalPages - 1}
                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface border border-glass-border text-text hover:text-primary disabled:opacity-20 transition-all font-bold text-xl pb-1">
                    &raquo;
                </button>
            </div>
        </div>
    );
};

interface Depot {
    id: number;
    nomApprenant: string;
    prenomApprenant: string;
    specialiteApprenant: string;
    cycleApprenant: string;
    sujetTitre: string;
    typeDepot: string;
    fichierUrl: string;
    dateDepot: string;
}

interface Specialite {
    id: number;
    nom: string;
}

interface Cycle {
    id: number;
    nomCycle: string;
}

export default function DepotsPage() {
    const [depots, setDepots] = useState<Depot[]>([]);
    const [specialites, setSpecialites] = useState<Specialite[]>([]);
    const [cycles, setCycles] = useState<Cycle[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [specialiteFilter, setSpecialiteFilter] = useState('');
    const [cycleFilter, setCycleFilter] = useState('');
    const [typeFilter, setTypeFilter] = useState('ALL');
    const [yearFilter, setYearFilter] = useState('ALL');

    // Pagination
    const [page, setPage] = useState(0);
    const itemsPerPage = 8;

    // Modal
    const [selectedFichierUrl, setSelectedFichierUrl] = useState<string | null>(null);

    useEffect(() => {
        fetchSpecialites();
        fetchCycles();
        fetchDepots();
    }, []);

    const fetchSpecialites = async () => {
        try {
            const res = await api.get('/affectation/specialites');
            setSpecialites(res.data);
        } catch (error) {
            console.error("Erreur chargement spécialités", error);
        }
    };

    const fetchCycles = async () => {
        try {
            const res = await api.get('/affectation/cycles');
            setCycles(res.data || []);
        } catch {}
    };

    const fetchDepots = async () => {
        setLoading(true);
        try {
            const res = await api.get('/depots');
            setDepots(res.data);
        } catch (error) {
            console.error("Erreur lors du chargement des dépôts", error);
        } finally {
            setLoading(false);
        }
    };

    const availableYears = useMemo(() => {
        const years = new Set(depots.map(d => new Date(d.dateDepot).getFullYear()));
        return Array.from(years).sort((a, b) => b - a);
    }, [depots]);

    const filteredDepots = useMemo(() => {
        return depots.filter(depot => {
            const matchSearch = `${depot.prenomApprenant} ${depot.nomApprenant} ${depot.sujetTitre}`.toLowerCase().includes(searchQuery.toLowerCase());
            const matchSpec = specialiteFilter ? depot.specialiteApprenant === specialiteFilter : true;
            const matchCycle = cycleFilter ? depot.cycleApprenant === cycleFilter : true;
            const matchType = typeFilter !== 'ALL' ? depot.typeDepot === typeFilter : true;
            const matchYear = yearFilter !== 'ALL' ? new Date(depot.dateDepot).getFullYear().toString() === yearFilter : true;
            return matchSearch && matchSpec && matchCycle && matchType && matchYear;
        });
    }, [depots, searchQuery, specialiteFilter, typeFilter, yearFilter]);

    const totalPages = Math.ceil(filteredDepots.length / itemsPerPage);
    const currentDepots = filteredDepots.slice(page * itemsPerPage, (page + 1) * itemsPerPage);

    const formatDate = (dateStr: string) => {
        return new Intl.DateTimeFormat('fr-FR', { 
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        }).format(new Date(dateStr));
    };

    const getTypeLabel = (type: string) => {
        switch(type) {
            case 'DEPOT_1': return '1er Dépôt';
            case 'DEPOT_2': return '2ème Dépôt';
            case 'FINAL': return 'Dépôt Final';
            default: return type;
        }
    };

    return (
        <div className="space-y-8 animate-fade-in pb-20">
            {/* Header */}
            <div className="relative">
                <div className="absolute -top-10 -left-10 w-40 h-40 bg-primary/20 rounded-full blur-[80px] pointer-events-none"></div>
                <div className="absolute top-0 right-20 w-32 h-32 bg-secondary/20 rounded-full blur-[60px] pointer-events-none"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2.5 bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl border border-primary/10 shadow-inner">
                                <FileCheck className="text-primary" size={26} strokeWidth={2.5} />
                            </div>
                            <h1 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-text to-text-muted drop-shadow-sm">
                                Suivi des Dépôts PFE
                            </h1>
                        </div>
                        <p className="text-text-muted text-sm ml-14 max-w-2xl">
                            Consultez, filtrez et prévisualisez les rapports déposés par les apprenants.
                        </p>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="glass overflow-hidden shadow-xl mt-6">
                <div className="p-6 border-b border-glass-border">
                    <div className="flex flex-wrap gap-4 items-center">
                        {/* Search */}
                        <div className="search-container flex-1 min-w-[200px]">
                            <div className="search-icon"><Search size={18} /></div>
                            <input 
                                type="text"
                                placeholder="Rechercher un apprenant ou sujet..."
                                value={searchQuery}
                                onChange={(e) => { setSearchQuery(e.target.value); setPage(0); }}
                                className="search-input"
                            />
                        </div>

                        {/* Specialite */}
                        <div className="relative min-w-[180px] flex-1">
                            <select
                                value={specialiteFilter}
                                onChange={(e) => { setSpecialiteFilter(e.target.value); setPage(0); }}
                                className="form-input appearance-none w-full font-bold bg-surface"
                            >
                                <option value="">Toutes les spécialités</option>
                                {specialites.map(s => (
                                    <option key={s.id} value={s.nom}>{s.nom}</option>
                                ))}
                            </select>
                            <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                        </div>

                        {/* Cycle */}
                        <div className="relative min-w-[180px] flex-1">
                            <select
                                value={cycleFilter}
                                onChange={(e) => { setCycleFilter(e.target.value); setPage(0); }}
                                className="form-input appearance-none w-full font-bold bg-surface"
                            >
                                <option value="">Tous les cycles</option>
                                {cycles.map(c => (
                                    <option key={c.id} value={c.nomCycle}>{c.nomCycle}</option>
                                ))}
                            </select>
                            <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                        </div>

                        {/* Type */}
                        <div className="relative min-w-[180px] flex-1">
                            <select
                                value={typeFilter}
                                onChange={(e) => { setTypeFilter(e.target.value); setPage(0); }}
                                className="form-input appearance-none w-full font-bold bg-surface"
                            >
                                <option value="ALL">Tous les types</option>
                                <option value="DEPOT_1">1er Dépôt</option>
                                <option value="DEPOT_2">2ème Dépôt</option>
                                <option value="FINAL">Dépôt Final</option>
                            </select>
                            <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                        </div>

                        {/* Year */}
                        <div className="relative min-w-[180px] flex-1">
                            <select
                                value={yearFilter}
                                onChange={(e) => { setYearFilter(e.target.value); setPage(0); }}
                                className="form-input appearance-none w-full font-bold bg-surface"
                            >
                                <option value="ALL">Toutes les années</option>
                                {availableYears.map(year => (
                                    <option key={year} value={year}>{year}</option>
                                ))}
                            </select>
                            <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                        </div>
                    </div>
                </div>

                {/* Content */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-64 text-text-muted">
                        <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
                        <p className="font-medium animate-pulse">Chargement des dépôts...</p>
                    </div>
                ) : filteredDepots.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-text-muted">
                        <div className="w-16 h-16 bg-surface rounded-full flex items-center justify-center mb-4 border border-glass-border shadow-inner">
                            <Search size={28} className="opacity-40" />
                        </div>
                        <p className="text-lg font-bold text-text">Aucun dépôt trouvé</p>
                        <p className="text-sm mt-1">Essayez de modifier vos filtres.</p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-surface/50 border-b border-glass-border">
                                        <th className="p-4 text-xs font-bold text-text-muted uppercase tracking-wider">Apprenant</th>
                                        <th className="p-4 text-xs font-bold text-text-muted uppercase tracking-wider">Spécialité</th>
                                        <th className="p-4 text-xs font-bold text-text-muted uppercase tracking-wider">Cycle</th>
                                        <th className="p-4 text-xs font-bold text-text-muted uppercase tracking-wider">Type de dépôt</th>
                                        <th className="p-4 text-xs font-bold text-text-muted uppercase tracking-wider">Date</th>
                                        <th className="p-4 text-xs font-bold text-text-muted uppercase tracking-wider text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <AnimatePresence>
                                        {currentDepots.map((depot, index) => (
                                            <motion.tr 
                                                key={depot.id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: index * 0.05 }}
                                                className="border-b border-glass-border/50 hover:bg-surface-hover/30 transition-colors group"
                                            >
                                                <td className="p-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center font-bold text-primary shadow-inner border border-primary/10">
                                                            {depot.prenomApprenant[0]}{depot.nomApprenant[0]}
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-text group-hover:text-primary transition-colors">
                                                                {depot.nomApprenant} {depot.prenomApprenant}
                                                            </div>
                                                            <div className="text-xs text-text-muted truncate max-w-[200px]">
                                                                {depot.sujetTitre}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-surface border border-glass-border text-text-muted">
                                                        {depot.specialiteApprenant}
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-surface border border-glass-border text-text-muted">
                                                        {depot.cycleApprenant}
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold shadow-sm ${
                                                        depot.typeDepot === 'FINAL' ? 'bg-success/10 text-success border border-success/20' :
                                                        depot.typeDepot === 'DEPOT_2' ? 'bg-secondary/10 text-secondary border border-secondary/20' :
                                                        'bg-primary/10 text-primary border border-primary/20'
                                                    }`}>
                                                        <FileText size={12} />
                                                        {getTypeLabel(depot.typeDepot)}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-sm font-medium text-text-muted">
                                                    {formatDate(depot.dateDepot)}
                                                </td>
                                                <td className="p-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button 
                                                            onClick={() => setSelectedFichierUrl(depot.fichierUrl)}
                                                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all text-sm font-bold shadow-sm"
                                                        >
                                                            <Eye size={16} />
                                                            <span>Prévisualiser</span>
                                                        </button>
                                                        <a 
                                                            href={`http://192.168.20.25:9093/api/v1/mon-pfe/download/${depot.fichierUrl}`}
                                                            download
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface border border-glass-border text-text-muted hover:text-primary hover:border-primary/30 transition-all text-sm font-bold shadow-sm"
                                                        >
                                                            <Download size={16} />
                                                        </a>
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        ))}
                                    </AnimatePresence>
                                </tbody>
                            </table>
                        </div>
                        <Pagination 
                            page={page} 
                            totalPages={totalPages} 
                            total={filteredDepots.length} 
                            itemsPerPage={itemsPerPage} 
                            label="dépôts" 
                            onPageChange={setPage} 
                        />
                    </>
                )}
            </div>

            {/* Preview Modal */}
            <AnimatePresence>
                {selectedFichierUrl && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-sm"
                        onClick={() => setSelectedFichierUrl(null)}
                    >
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full h-full bg-background overflow-hidden flex flex-col"
                        >
                            <div className="flex items-center justify-between p-4 border-b border-glass-border bg-surface/50">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary/10 rounded-xl text-primary">
                                        <FileText size={20} />
                                    </div>
                                    <h3 className="text-xl font-bold">Prévisualisation du rapport</h3>
                                </div>
                                <button 
                                    onClick={() => setSelectedFichierUrl(null)}
                                    className="p-2 rounded-xl hover:bg-error/10 hover:text-error transition-colors bg-surface border border-glass-border text-text-muted"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                            
                            <div className="flex-1 bg-surface-hover/30 relative">
                                <iframe 
                                    src={`http://192.168.20.25:9093/api/v1/mon-pfe/download/${selectedFichierUrl}`} 
                                    className="w-full h-full border-none bg-white"
                                    title="Prévisualisation PDF"
                                />
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
