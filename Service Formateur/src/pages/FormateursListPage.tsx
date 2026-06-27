import { useState, useEffect, useMemo } from 'react';
import { Search, Users, ChevronDown, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../api/api-client';

interface Specialite {
    id: number;
    nom: string;
}

interface Enseignant {
    id: number;
    nom: string;
    prenom: string;
    email: string;
    specialite: Specialite | null;
}

/* ──────────────────── Pagination ──────────────────── */
const Pagination = ({ page, totalPages, total, itemsPerPage, onPageChange }: {
    page: number; totalPages: number; total: number; itemsPerPage: number; onPageChange: (p: number) => void;
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
                Affichage <span className="text-text font-bold">{page * itemsPerPage + 1}</span> à <span className="text-text font-bold">{Math.min((page + 1) * itemsPerPage, total)}</span> sur <span className="text-text font-bold">{total}</span> formateurs
            </div>
            <div className="flex items-center gap-1">
                <button onClick={() => onPageChange(Math.max(0, page - 1))} disabled={page === 0}
                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface border border-glass-border text-text hover:text-primary disabled:opacity-20 transition-all font-bold text-xl pb-1">
                    <ChevronLeft size={18} />
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
                    <ChevronRight size={18} />
                </button>
            </div>
        </div>
    );
};

const FormateursListPage = () => {
    const [formateurs, setFormateurs] = useState<Enseignant[]>([]);
    const [specialites, setSpecialites] = useState<Specialite[]>([]);
    const [loading, setLoading] = useState(true);

    const [searchQuery, setSearchQuery] = useState('');
    const [specialiteFilter, setSpecialiteFilter] = useState('');
    const [page, setPage] = useState(0);
    const itemsPerPage = 8;

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [formatRes, specRes] = await Promise.all([
                api.get('/enseignants'),
                api.get('/specialites')
            ]);
            setFormateurs(formatRes.data);
            setSpecialites(specRes.data);
        } catch (error) {
            console.error('Erreur chargement:', error);
        } finally {
            setLoading(false);
        }
    };

    const filtered = useMemo(() => {
        return formateurs.filter(f => {
            const matchSearch = `${f.prenom} ${f.nom}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                (f.email || '').toLowerCase().includes(searchQuery.toLowerCase());
            const matchSpec = specialiteFilter ? f.specialite?.id?.toString() === specialiteFilter : true;
            return matchSearch && matchSpec;
        });
    }, [formateurs, searchQuery, specialiteFilter]);

    useEffect(() => { setPage(0); }, [searchQuery, specialiteFilter]);

    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const paginated = filtered.slice(page * itemsPerPage, (page + 1) * itemsPerPage);

    const getInitials = (p: string, n: string) => `${(p || '').charAt(0)}${(n || '').charAt(0)}`.toUpperCase();

    return (
        <div className="space-y-6 animate-fade-in pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold">Formateurs</h2>
                    <p className="text-text-muted">Liste des formateurs de la plateforme.</p>
                </div>
                <div className="flex gap-3">
                    <div className="glass px-4 py-2.5 flex items-center gap-2">
                        <Users size={16} className="text-primary" />
                        <span className="text-sm font-bold text-text">{filtered.length} Formateur{filtered.length > 1 ? 's' : ''}</span>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="glass overflow-hidden shadow-xl">
                {/* Filters */}
                <div className="p-6 border-b border-glass-border">
                    <div className="flex flex-wrap gap-4 items-center">
                        <div className="search-container flex-1 min-w-[200px]">
                            <div className="search-icon"><Search size={18} /></div>
                            <input
                                type="text"
                                placeholder="Rechercher par nom ou email..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="search-input"
                            />
                        </div>
                        <div className="relative min-w-[200px] flex-1 sm:flex-none">
                            <select
                                value={specialiteFilter}
                                onChange={e => setSpecialiteFilter(e.target.value)}
                                className="form-input appearance-none w-full font-bold bg-surface"
                            >
                                <option value="">Toutes les spécialités</option>
                                {specialites.map(s => (
                                    <option key={s.id} value={s.id.toString()}>{s.nom}</option>
                                ))}
                            </select>
                            <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                        </div>
                    </div>
                </div>

                {/* Content */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="py-20 text-center">
                        <Users size={48} className="mx-auto text-text-muted mb-4 opacity-40" />
                        <p className="text-text-muted font-medium">Aucun formateur trouvé.</p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-surface-hover/50 text-text-muted text-xs uppercase tracking-widest">
                                        <th className="py-3 px-6 text-left">Formateur</th>
                                        <th className="py-3 px-4 text-left">Email</th>
                                        <th className="py-3 px-4 text-left">Spécialité</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-glass-border">
                                    {paginated.map((f, idx) => (
                                        <motion.tr
                                            key={f.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.03 }}
                                            className="hover:bg-surface-hover/30 transition-colors"
                                        >
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-primary/20 shrink-0">
                                                        {getInitials(f.prenom, f.nom)}
                                                    </div>
                                                    <span className="font-bold text-text">{f.prenom} {f.nom}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-4">
                                                <span className="text-sm text-text-muted">{f.email}</span>
                                            </td>
                                            <td className="py-4 px-4">
                                                <span className="tag tag-licence font-bold text-xs">{f.specialite?.nom || 'N/A'}</span>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <Pagination
                            page={page}
                            totalPages={totalPages}
                            total={filtered.length}
                            itemsPerPage={itemsPerPage}
                            onPageChange={setPage}
                        />
                    </>
                )}
            </div>
        </div>
    );
};

export default FormateursListPage;
