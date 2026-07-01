import { useState, useEffect } from 'react';
import { Search, Users, ToggleLeft, ToggleRight, Loader2, ChevronLeft, ChevronRight, Filter, BookOpen, Lock } from 'lucide-react';
import api from '../api/api-client';

interface Specialite { id: number; nom: string }
interface Cycle { id: number; nomCycle: string }

interface ApprenantItem {
    id: number; nom: string; prenom: string; email: string;
    selectionSujetActive: boolean; hasSujet: boolean; sujetTitre?: string;
    specialiteId?: number; specialiteNom?: string;
    cycleId?: number; cycleNom?: string;
}

interface SujetItem {
    id: number; titre: string; description: string;
    formateurNom: string; selectionActive: boolean; pris: boolean;
}

interface PageResponse {
    content: ApprenantItem[];
    totalPages: number;
    totalElements: number;
    currentPage: number;
}

const ConfigSelectionSujetsPage = () => {
    const [apprenants, setApprenants] = useState<ApprenantItem[]>([]);
    const [sujets, setSujets] = useState<SujetItem[]>([]);
    const [specialites, setSpecialites] = useState<Specialite[]>([]);
    const [cycles, setCycles] = useState<Cycle[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingSujets, setLoadingSujets] = useState(true);
    const [search, setSearch] = useState('');
    const [specialiteId, setSpecialiteId] = useState<number | undefined>(undefined);
    const [cycleId, setCycleId] = useState<number | undefined>(undefined);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [toggling, setToggling] = useState<number | null>(null);
    const [togglingSujet, setTogglingSujet] = useState<number | null>(null);
    const size = 10;

    const fetchFilters = async () => {
        try {
            const [specRes, cycleRes] = await Promise.all([
                api.get<Specialite[]>('/affectation/specialites'),
                api.get<Cycle[]>('/affectation/cycles')
            ]);
            setSpecialites(specRes.data);
            setCycles(cycleRes.data);
        } catch {}
    };

    const fetchApprenants = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (search) params.set('search', search);
            if (specialiteId !== undefined) params.set('specialiteId', String(specialiteId));
            if (cycleId !== undefined) params.set('cycleId', String(cycleId));
            params.set('page', String(page));
            params.set('size', String(size));
            const res = await api.get<PageResponse>(`/affectation/apprenants-selection/page?${params}`);
            setApprenants(res.data.content);
            setTotalPages(res.data.totalPages);
            setTotalElements(res.data.totalElements);
        } catch {}
        setLoading(false);
    };

    const fetchSujets = async () => {
        setLoadingSujets(true);
        try {
            const res = await api.get<SujetItem[]>('/affectation/sujets-selection');
            setSujets(res.data);
        } catch {}
        setLoadingSujets(false);
    };

    useEffect(() => { fetchFilters(); }, []);

    useEffect(() => {
        fetchApprenants();
    }, [page, search, specialiteId, cycleId]);

    useEffect(() => {
        fetchSujets();
    }, []);

    const handleSearchChange = (val: string) => { setSearch(val); setPage(0); };
    const handleSpecialiteChange = (val: string) => { setSpecialiteId(val ? Number(val) : undefined); setPage(0); };
    const handleCycleChange = (val: string) => { setCycleId(val ? Number(val) : undefined); setPage(0); };

    const handleToggle = async (id: number) => {
        setToggling(id);
        try {
            const res = await api.put<{ id: number; selectionSujetActive: boolean }>(`/affectation/apprenant/${id}/selection-toggle`);
            setApprenants(prev => prev.map(a => a.id === id ? { ...a, selectionSujetActive: res.data.selectionSujetActive } : a));
        } catch {}
        setToggling(null);
    };

    const handleToggleSujet = async (id: number) => {
        setTogglingSujet(id);
        try {
            const res = await api.put<{ id: number; selectionActive: boolean }>(`/affectation/sujets/${id}/selection-toggle`);
            setSujets(prev => prev.map(s => s.id === id ? { ...s, selectionActive: res.data.selectionActive } : s));
        } catch {}
        setTogglingSujet(null);
    };

    const getInitials = (p?: string, n?: string) =>
        `${(p?.[0] || '').toUpperCase()}${(n?.[0] || '').toUpperCase()}`;

    return (
        <div className="space-y-8 animate-fade-in pb-20">
            <div>
                <h2 className="text-3xl font-bold">Configuration Sélection Sujets</h2>
                <p className="text-text-muted">Gérez les permissions des apprenants et la visibilité des sujets.</p>
            </div>

            <div className="glass overflow-hidden">
                <div className="p-6 border-b border-glass-border">
                    <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
                        <BookOpen size={20} className="text-primary" />
                        Sujets
                    </h3>

                    {loadingSujets ? (
                        <div className="flex items-center justify-center py-10">
                            <Loader2 className="w-6 h-6 text-primary animate-spin" />
                        </div>
                    ) : sujets.length === 0 ? (
                        <p className="text-text-muted text-center py-10">Aucun sujet trouvé</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-surface-hover/50 text-text-muted text-xs uppercase tracking-widest">
                                        <th className="py-3 px-6 text-left">Sujet</th>
                                        <th className="py-3 px-4 text-left">Formateur</th>
                                        <th className="py-3 px-4 text-center">Assigné</th>
                                        <th className="py-3 px-4 text-center">Visible</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-glass-border">
                                    {sujets.map(s => (
                                        <tr key={s.id} className="hover:bg-surface-hover/30 transition-colors">
                                            <td className="py-4 px-6">
                                                <span className={`font-semibold ${s.pris ? 'text-text-muted' : 'text-text'}`}>
                                                    {s.titre}
                                                </span>
                                                {s.description && (
                                                    <p className="text-xs text-text-muted mt-0.5 line-clamp-1">{s.description}</p>
                                                )}
                                            </td>
                                            <td className="py-4 px-4 text-sm text-text-muted">{s.formateurNom || '-'}</td>
                                            <td className="py-4 px-4 text-center">
                                                {s.pris ? (
                                                    <Lock size={16} className="inline text-warning" />
                                                ) : (
                                                    <span className="text-xs text-text-muted italic">Non</span>
                                                )}
                                            </td>
                                            <td className="py-4 px-4 text-center">
                                                <button
                                                    onClick={() => handleToggleSujet(s.id)}
                                                    disabled={togglingSujet === s.id}
                                                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                                                        s.selectionActive
                                                            ? 'bg-success/10 text-success hover:bg-success/20'
                                                            : 'bg-surface-hover text-text-muted hover:bg-surface-hover/80'
                                                    }`}
                                                >
                                                    {togglingSujet === s.id ? (
                                                        <Loader2 size={16} className="animate-spin" />
                                                    ) : s.selectionActive ? (
                                                        <ToggleRight size={20} />
                                                    ) : (
                                                        <ToggleLeft size={20} />
                                                    )}
                                                    {s.selectionActive ? 'Activé' : 'Désactivé'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            <div className="glass overflow-hidden">
                <div className="p-6 border-b border-glass-border space-y-4">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                        <Users size={20} className="text-primary" />
                        Apprenants
                    </h3>
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="search-container max-w-xs flex-1 min-w-[200px]">
                            <div className="search-icon"><Search size={18} /></div>
                            <input
                                type="text"
                                placeholder="Rechercher un apprenant..."
                                value={search}
                                onChange={e => handleSearchChange(e.target.value)}
                                className="search-input"
                            />
                        </div>
                        <select
                            value={specialiteId ?? ''}
                            onChange={e => handleSpecialiteChange(e.target.value)}
                            className="px-4 py-2.5 rounded-xl bg-surface border border-glass-border text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 min-w-[160px]"
                        >
                            <option value="">Toutes spécialités</option>
                            {specialites.map(s => (
                                <option key={s.id} value={s.id}>{s.nom}</option>
                            ))}
                        </select>
                        <select
                            value={cycleId ?? ''}
                            onChange={e => handleCycleChange(e.target.value)}
                            className="px-4 py-2.5 rounded-xl bg-surface border border-glass-border text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 min-w-[160px]"
                        >
                            <option value="">Tous cycles</option>
                            {cycles.map(c => (
                                <option key={c.id} value={c.id}>{c.nomCycle}</option>
                            ))}
                        </select>
                    </div>
                    <div className="text-xs text-text-muted">
                        <Filter size={14} className="inline mr-1" />
                        {totalElements} apprenant{totalElements > 1 ? 's' : ''} trouvé{totalElements > 1 ? 's' : ''}
                    </div>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    </div>
                ) : apprenants.length === 0 ? (
                    <div className="py-20 text-center">
                        <Users size={48} className="mx-auto text-text-muted mb-4 opacity-40" />
                        <p className="text-text-muted font-medium">Aucun apprenant trouvé</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-surface-hover/50 text-text-muted text-xs uppercase tracking-widest">
                                    <th className="py-3 px-6 text-left">Apprenant</th>
                                    <th className="py-3 px-4 text-left">Email</th>
                                    <th className="py-3 px-4 text-left">Spécialité</th>
                                    <th className="py-3 px-4 text-left">Cycle</th>
                                    <th className="py-3 px-4 text-center">Sujet</th>
                                    <th className="py-3 px-4 text-center">Sélection</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-glass-border">
                                {apprenants.map(a => (
                                    <tr key={a.id} className="hover:bg-surface-hover/30 transition-colors">
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-primary/20 shrink-0">
                                                    {getInitials(a.prenom, a.nom)}
                                                </div>
                                                <span className="font-bold text-text">{a.prenom} {a.nom}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-4 text-sm text-text-muted">{a.email}</td>
                                        <td className="py-4 px-4 text-sm text-text-muted">{a.specialiteNom ?? '-'}</td>
                                        <td className="py-4 px-4 text-sm text-text-muted">{a.cycleNom ?? '-'}</td>
                                        <td className="py-4 px-4 text-center">
                                            {a.hasSujet ? (
                                                <span className="text-sm text-text font-semibold">{a.sujetTitre}</span>
                                            ) : (
                                                <span className="text-xs text-text-muted italic">Aucun</span>
                                            )}
                                        </td>
                                        <td className="py-4 px-4 text-center">
                                            <button
                                                onClick={() => handleToggle(a.id)}
                                                disabled={toggling === a.id}
                                                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                                                    a.selectionSujetActive
                                                        ? 'bg-success/10 text-success hover:bg-success/20'
                                                        : 'bg-surface-hover text-text-muted hover:bg-surface-hover/80'
                                                }`}
                                            >
                                                {toggling === a.id ? (
                                                    <Loader2 size={16} className="animate-spin" />
                                                ) : a.selectionSujetActive ? (
                                                    <ToggleRight size={20} />
                                                ) : (
                                                    <ToggleLeft size={20} />
                                                )}
                                                {a.selectionSujetActive ? 'Activé' : 'Désactivé'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {totalPages > 1 && (
                            <div className="flex items-center justify-between px-6 py-4 border-t border-glass-border">
                                <span className="text-sm text-text-muted">
                                    Page {page + 1} sur {totalPages}
                                </span>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setPage(p => Math.max(0, p - 1))}
                                        disabled={page === 0}
                                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all bg-surface-hover text-text-muted hover:bg-surface-hover/80 disabled:opacity-30 disabled:cursor-not-allowed"
                                    >
                                        <ChevronLeft size={16} /> Précédent
                                    </button>
                                    {Array.from({ length: totalPages }, (_, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setPage(i)}
                                            className={`w-8 h-8 rounded-lg text-sm font-bold transition-all ${
                                                i === page
                                                    ? 'bg-primary text-white shadow-md shadow-primary/30'
                                                    : 'bg-surface-hover text-text-muted hover:bg-surface-hover/80'
                                            }`}
                                        >
                                            {i + 1}
                                        </button>
                                    ))}
                                    <button
                                        onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                                        disabled={page >= totalPages - 1}
                                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all bg-surface-hover text-text-muted hover:bg-surface-hover/80 disabled:opacity-30 disabled:cursor-not-allowed"
                                    >
                                        Suivant <ChevronRight size={16} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ConfigSelectionSujetsPage;
