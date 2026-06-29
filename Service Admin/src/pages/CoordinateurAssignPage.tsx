import { useState, useEffect } from 'react';
import {
    Search,
    ChevronLeft,
    ChevronRight,
    Loader2,
    CheckCircle2,
    AlertCircle,
    UserCog,
    ChevronDown,
    Users,
    GraduationCap,
    Save
} from 'lucide-react';
import api from '../api/api-client';

interface Coordinateur {
    id: number; nom: string; prenom: string; email: string;
}
interface Specialite { id: number; nom: string; }
interface Cycle { id: number; nomCycle: string; }
interface Apprenant {
    id: number; nom: string; prenom: string; email: string;
    specialite?: Specialite; cycle?: Cycle;
}
interface Enseignant {
    id: number; nom: string; prenom: string; email: string;
    specialite?: Specialite;
}

const CoordinateurAssignPage = () => {
    const [coordinateurs, setCoordinateurs] = useState<Coordinateur[]>([]);
    const [selectedCoordId, setSelectedCoordId] = useState('');
    const [allApprenants, setAllApprenants] = useState<Apprenant[]>([]);
    const [allEnseignants, setAllEnseignants] = useState<Enseignant[]>([]);
    const [specialites, setSpecialites] = useState<Specialite[]>([]);
    const [cycles, setCycles] = useState<Cycle[]>([]);
    const [assignedApprenantIds, setAssignedApprenantIds] = useState<Set<number>>(new Set());
    const [assignedEnseignantIds, setAssignedEnseignantIds] = useState<Set<number>>(new Set());
    const [selectedApprenantIds, setSelectedApprenantIds] = useState<Set<number>>(new Set());
    const [selectedEnseignantIds, setSelectedEnseignantIds] = useState<Set<number>>(new Set());

    const [loadingCoord, setLoadingCoord] = useState(true);
    const [loadingData, setLoadingData] = useState(false);
    const [saving, setSaving] = useState(false);

    const [searchApprenant, setSearchApprenant] = useState('');
    const [specFilterApprenant, setSpecFilterApprenant] = useState('');
    const [cycleFilterApprenant, setCycleFilterApprenant] = useState('');
    const [pageApprenant, setPageApprenant] = useState(1);

    const [searchEnseignant, setSearchEnseignant] = useState('');
    const [specFilterEnseignant, setSpecFilterEnseignant] = useState('');
    const [pageEnseignant, setPageEnseignant] = useState(1);

    const [tab, setTab] = useState<'apprenants' | 'enseignants'>('apprenants');
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        fetchCoordinateurs();
        fetchAllApprenants();
        fetchAllEnseignants();
        fetchSpecialites();
        fetchCycles();
    }, []);

    useEffect(() => {
        if (selectedCoordId) fetchAssignedData();
    }, [selectedCoordId]);

    useEffect(() => { setPageApprenant(1); }, [searchApprenant, specFilterApprenant, cycleFilterApprenant]);
    useEffect(() => { setPageEnseignant(1); }, [searchEnseignant, specFilterEnseignant]);

    const fetchCoordinateurs = async () => {
        try {
            const res = await api.get<Coordinateur[]>('/coordinateurs');
            setCoordinateurs(res.data || []);
        } catch { }
        setLoadingCoord(false);
    };

    const fetchAllApprenants = async () => {
        try {
            const res = await api.get<Apprenant[]>('/apprenants');
            setAllApprenants(res.data || []);
        } catch { }
    };

    const fetchAllEnseignants = async () => {
        try {
            const res = await api.get<Enseignant[]>('/enseignants');
            setAllEnseignants(res.data || []);
        } catch { }
    };

    const fetchSpecialites = async () => {
        try {
            const res = await api.get<Specialite[]>('/specialites');
            setSpecialites(res.data || []);
        } catch { }
    };

    const fetchCycles = async () => {
        try {
            const res = await api.get<Cycle[]>('/cycles');
            setCycles(res.data || []);
        } catch { }
    };

    const fetchAssignedData = async () => {
        setLoadingData(true);
        try {
            const [appRes, ensRes] = await Promise.all([
                api.get<Apprenant[]>(`/coordinateurs/${selectedCoordId}/apprenants`),
                api.get<Enseignant[]>(`/coordinateurs/${selectedCoordId}/enseignants`)
            ]);
            const appIds = new Set(appRes.data.map(a => a.id));
            const ensIds = new Set(ensRes.data.map(e => e.id));
            setAssignedApprenantIds(appIds);
            setAssignedEnseignantIds(ensIds);
            setSelectedApprenantIds(appIds);
            setSelectedEnseignantIds(ensIds);
        } catch { }
        setLoadingData(false);
    };

    const toggleApprenant = (id: number) => {
        setSelectedApprenantIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    const toggleEnseignant = (id: number) => {
        setSelectedEnseignantIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    const handleSave = async () => {
        if (!selectedCoordId) return;
        setSaving(true);
        try {
            await Promise.all([
                api.put(`/coordinateurs/${selectedCoordId}/assign-apprenants`, Array.from(selectedApprenantIds)),
                api.put(`/coordinateurs/${selectedCoordId}/assign-enseignants`, Array.from(selectedEnseignantIds))
            ]);
            setMessage({ type: 'success', text: 'Affectations enregistrées avec succès' });
        } catch {
            setMessage({ type: 'error', text: "Erreur lors de l'enregistrement" });
        }
        setSaving(false);
    };

    const filteredApprenants = allApprenants.filter(a => {
        const matchSearch = `${a.prenom} ${a.nom} ${a.email}`.toLowerCase().includes(searchApprenant.toLowerCase());
        const matchSpec = specFilterApprenant ? a.specialite?.id?.toString() === specFilterApprenant : true;
        const matchCycle = cycleFilterApprenant ? a.cycle?.id?.toString() === cycleFilterApprenant : true;
        return matchSearch && matchSpec && matchCycle;
    });

    const filteredEnseignants = allEnseignants.filter(e => {
        const matchSearch = `${e.prenom} ${e.nom} ${e.email}`.toLowerCase().includes(searchEnseignant.toLowerCase());
        const matchSpec = specFilterEnseignant ? e.specialite?.id?.toString() === specFilterEnseignant : true;
        return matchSearch && matchSpec;
    });

    const totalApprenantPages = Math.ceil(filteredApprenants.length / itemsPerPage);
    const paginatedApprenants = filteredApprenants.slice(
        (pageApprenant - 1) * itemsPerPage, pageApprenant * itemsPerPage
    );

    const totalEnseignantPages = Math.ceil(filteredEnseignants.length / itemsPerPage);
    const paginatedEnseignants = filteredEnseignants.slice(
        (pageEnseignant - 1) * itemsPerPage, pageEnseignant * itemsPerPage
    );

    const getPages = (totalPages: number, currentPage: number) => {
        const pages: (number | string)[] = [];
        const showMax = 5;
        if (totalPages <= showMax) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            pages.push(1);
            if (currentPage > 3) pages.push('...');
            const start = Math.max(2, currentPage - 1);
            const end = Math.min(totalPages - 1, currentPage + 1);
            for (let i = start; i <= end; i++) { if (!pages.includes(i)) pages.push(i); }
            if (currentPage < totalPages - 2) pages.push('...');
            pages.push(totalPages);
        }
        return pages;
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold">Affectation Coordinateur</h2>
                <p className="text-text-muted" style={{ marginBottom: 15 }}>Sélectionnez un coordinateur, puis assignez-lui des apprenants et formateurs.</p>
            </div>

            {message && (
                <div
                    className={`p-4 rounded-xl flex items-center justify-between ${
                        message.type === 'success'
                            ? 'bg-primary/10 text-primary border border-primary/20'
                            : 'bg-error/10 text-error border border-error/20'
                    }`}
                >
                    <div className="flex items-center gap-2 font-bold">
                        {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                        {message.text}
                    </div>
                    <button onClick={() => setMessage(null)} className="hover:opacity-70">
                        <AlertCircle size={18} className="opacity-0" />
                    </button>
                </div>
            )}

            <div className="glass overflow-hidden shadow-xl">
                <div className="p-6 border-b border-glass-border flex flex-col lg:flex-row items-start lg:items-center gap-4">
                    <div className="flex-1 w-full">
                        <div className="relative max-w-md">
                            <select
                                value={selectedCoordId}
                                onChange={e => setSelectedCoordId(e.target.value)}
                                className="form-input appearance-none w-full font-bold bg-surface text-base py-3"
                                disabled={loadingCoord}
                            >
                                <option value="">-- Choisir un coordinateur --</option>
                                {coordinateurs.map(c => (
                                    <option key={c.id} value={c.id.toString()}>{c.prenom} {c.nom} ({c.email})</option>
                                ))}
                            </select>
                            <ChevronDown size={20} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 text-sm bg-primary/10 text-primary px-3 py-2 rounded-xl font-bold">
                            <Users size={16} /> {selectedApprenantIds.size}
                        </div>
                        <div className="flex items-center gap-2 text-sm bg-secondary/10 text-secondary px-3 py-2 rounded-xl font-bold">
                            <GraduationCap size={16} /> {selectedEnseignantIds.size}
                        </div>
                        <button
                            onClick={handleSave}
                            disabled={!selectedCoordId || saving}
                            className="primary action-btn px-5 py-2.5 flex items-center gap-2 font-bold disabled:opacity-50"
                        >
                            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                            Enregistrer
                        </button>
                    </div>
                </div>
            </div>

            {selectedCoordId && (
                <>
                    <div className="flex gap-3 my-6">
                        <button
                            className={`action-btn px-6 py-3 font-bold flex items-center gap-2 text-sm transition-all ${
                                tab === 'apprenants' ? 'primary shadow-lg shadow-primary/20' : 'bg-background border border-glass-border text-text-muted hover:border-primary hover:text-primary'
                            }`}
                            onClick={() => setTab('apprenants')}
                        >
                            <Users size={18} /> Apprenants
                        </button>
                        <button
                            className={`action-btn px-6 py-3 font-bold flex items-center gap-2 text-sm transition-all ${
                                tab === 'enseignants' ? 'primary shadow-lg shadow-primary/20' : 'bg-background border border-glass-border text-text-muted hover:border-primary hover:text-primary'
                            }`}
                            onClick={() => setTab('enseignants')}
                        >
                            <GraduationCap size={18} /> Formateurs
                        </button>
                    </div>

                    <div className="glass overflow-hidden shadow-xl">
                        <div className="p-6 border-b border-glass-border flex flex-col lg:flex-row items-start lg:items-center gap-4">
                            <div className="search-container flex-1">
                                <div className="search-icon"><Search size={18} /></div>
                                <input
                                    type="text"
                                    placeholder={tab === 'apprenants' ? "Rechercher un apprenant..." : "Rechercher un formateur..."}
                                    className="search-input"
                                    value={tab === 'apprenants' ? searchApprenant : searchEnseignant}
                                    onChange={e => {
                                        if (tab === 'apprenants') setSearchApprenant(e.target.value);
                                        else setSearchEnseignant(e.target.value);
                                    }}
                                />
                            </div>
                            {tab === 'apprenants' && (
                                <>
                                    <div className="relative min-w-[160px]">
                                        <select
                                            value={specFilterApprenant}
                                            onChange={e => setSpecFilterApprenant(e.target.value)}
                                            className="form-input appearance-none w-full font-bold bg-surface text-sm"
                                        >
                                            <option value="">Toutes spécialités</option>
                                            {specialites.map(s => (
                                                <option key={s.id} value={s.id.toString()}>{s.nom}</option>
                                            ))}
                                        </select>
                                        <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                                    </div>
                                    <div className="relative min-w-[160px]">
                                        <select
                                            value={cycleFilterApprenant}
                                            onChange={e => setCycleFilterApprenant(e.target.value)}
                                            className="form-input appearance-none w-full font-bold bg-surface text-sm"
                                        >
                                            <option value="">Tous cycles</option>
                                            {cycles.map(c => (
                                                <option key={c.id} value={c.id.toString()}>{c.nomCycle}</option>
                                            ))}
                                        </select>
                                        <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                                    </div>
                                </>
                            )}
                            {tab === 'enseignants' && (
                                <div className="relative min-w-[160px]">
                                    <select
                                        value={specFilterEnseignant}
                                        onChange={e => setSpecFilterEnseignant(e.target.value)}
                                        className="form-input appearance-none w-full font-bold bg-surface text-sm"
                                    >
                                        <option value="">Toutes spécialités</option>
                                        {specialites.map(s => (
                                            <option key={s.id} value={s.id.toString()}>{s.nom}</option>
                                        ))}
                                    </select>
                                    <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                                </div>
                            )}
                            <div className="flex items-center gap-2 text-sm text-text-muted">
                                <span>Afficher</span>
                            <select
                                className="bg-background border border-glass-border rounded-lg px-2 py-1 focus:outline-none focus:border-primary"
                                value={itemsPerPage}
                                onChange={e => { setItemsPerPage(Number(e.target.value)); if (tab === 'apprenants') setPageApprenant(1); else setPageEnseignant(1); }}
                            >
                                <option value={10}>10</option>
                                <option value={50}>50</option>
                                <option value={100}>100</option>
                            </select>
                                <span>par page</span>
                            </div>
                        </div>

                        {loadingData ? (
                            <div className="h-[40vh] flex items-center justify-center">
                                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                            </div>
                        ) : tab === 'apprenants' ? (
                            <>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="bg-surface-hover/50 text-text-muted text-xs uppercase tracking-widest">
                                                <th className="w-12 text-center">
                                                    <input
                                                        type="checkbox"
                                                        className="w-4 h-4 rounded border-glass-border bg-background cursor-pointer"
                                                        checked={paginatedApprenants.length > 0 && paginatedApprenants.every(a => selectedApprenantIds.has(a.id))}
                                                        onChange={() => {
                                                            const all = new Set(paginatedApprenants.map(a => a.id));
                                                            setSelectedApprenantIds(prev => {
                                                                const allSelected = paginatedApprenants.every(a => prev.has(a.id));
                                                                if (allSelected) {
                                                                    const next = new Set(prev);
                                                                    all.forEach(id => next.delete(id));
                                                                    return next;
                                                                }
                                                                return new Set([...prev, ...all]);
                                                            });
                                                        }}
                                                    />
                                                </th>
                                                <th>Nom & Prénom</th>
                                                <th>Email</th>
                                                <th>Spécialité</th>
                                                <th>Cycle</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-glass-border">
                                            {paginatedApprenants.length > 0 ? paginatedApprenants.map(a => {
                                                const checked = selectedApprenantIds.has(a.id);
                                                return (
                                                    <tr
                                                        key={a.id}
                                                        className={`hover:bg-surface-hover/30 transition-colors cursor-pointer ${checked ? 'bg-primary/5' : ''}`}
                                                        onClick={() => toggleApprenant(a.id)}
                                                    >
                                                        <td className="text-center">
                                                            <input
                                                                type="checkbox"
                                                                className="w-4 h-4 rounded border-glass-border bg-background cursor-pointer"
                                                                checked={checked}
                                                                onChange={() => toggleApprenant(a.id)}
                                                            />
                                                        </td>
                                                        <td className="font-bold text-text capitalize">{a.prenom} {a.nom}</td>
                                                        <td className="text-text-muted">{a.email}</td>
                                                        <td>{a.specialite?.nom || <span className="text-text-muted">—</span>}</td>
                                                        <td>{a.cycle?.nomCycle || <span className="text-text-muted">—</span>}</td>
                                                    </tr>
                                                );
                                            }) : (
                                                <tr>
                                                    <td colSpan={5} className="py-20 text-text-muted font-medium text-center">Aucun apprenant trouvé</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                                {totalApprenantPages > 1 && (
                                    <div className="pagination border-t border-glass-border bg-surface-hover/10 px-6 py-4 flex items-center justify-between">
                                        <div className="pagination-info">
                                            Affichage <span className="text-text font-bold">{(pageApprenant - 1) * itemsPerPage + 1}</span> à <span className="text-text font-bold">{Math.min(pageApprenant * itemsPerPage, filteredApprenants.length)}</span> sur <span className="text-text font-bold">{filteredApprenants.length}</span> apprenants
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => setPageApprenant(p => Math.max(1, p - 1))} disabled={pageApprenant === 1} className="w-10 h-10 p-0 rounded-xl bg-background border border-glass-border text-text-muted hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-all icon-container">
                                                <ChevronLeft size={18} />
                                            </button>
                                            <div className="flex gap-1.5">
                                                {getPages(totalApprenantPages, pageApprenant).map((page, i) => (
                                                    page === '...' ? (
                                                        <div key={i} className="w-10 h-10 flex items-center justify-center text-text-muted font-bold select-none cursor-default">...</div>
                                                    ) : (
                                                        <button
                                                            key={i}
                                                            onClick={() => setPageApprenant(Number(page))}
                                                            className={`w-10 h-10 p-0 rounded-xl font-bold transition-all ${pageApprenant === page ? 'bg-primary text-white shadow-lg shadow-indigo-500/30' : 'bg-background border border-glass-border text-text-muted hover:border-primary hover:text-primary'}`}
                                                        >
                                                            {page}
                                                        </button>
                                                    )
                                                ))}
                                            </div>
                                            <button onClick={() => setPageApprenant(p => Math.min(totalApprenantPages, p + 1))} disabled={pageApprenant === totalApprenantPages} className="w-10 h-10 p-0 rounded-xl bg-background border border-glass-border text-text-muted hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-all icon-container">
                                                <ChevronRight size={18} />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="bg-surface-hover/50 text-text-muted text-xs uppercase tracking-widest">
                                                <th className="w-12 text-center">
                                                    <input
                                                        type="checkbox"
                                                        className="w-4 h-4 rounded border-glass-border bg-background cursor-pointer"
                                                        checked={paginatedEnseignants.length > 0 && paginatedEnseignants.every(e => selectedEnseignantIds.has(e.id))}
                                                        onChange={() => {
                                                            const all = new Set(paginatedEnseignants.map(e => e.id));
                                                            setSelectedEnseignantIds(prev => {
                                                                const allSelected = paginatedEnseignants.every(e => prev.has(e.id));
                                                                if (allSelected) {
                                                                    const next = new Set(prev);
                                                                    all.forEach(id => next.delete(id));
                                                                    return next;
                                                                }
                                                                return new Set([...prev, ...all]);
                                                            });
                                                        }}
                                                    />
                                                </th>
                                                <th>Nom & Prénom</th>
                                                <th>Email</th>
                                                <th>Spécialité</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-glass-border">
                                            {paginatedEnseignants.length > 0 ? paginatedEnseignants.map(e => {
                                                const checked = selectedEnseignantIds.has(e.id);
                                                return (
                                                    <tr
                                                        key={e.id}
                                                        className={`hover:bg-surface-hover/30 transition-colors cursor-pointer ${checked ? 'bg-primary/5' : ''}`}
                                                        onClick={() => toggleEnseignant(e.id)}
                                                    >
                                                        <td className="text-center">
                                                            <input
                                                                type="checkbox"
                                                                className="w-4 h-4 rounded border-glass-border bg-background cursor-pointer"
                                                                checked={checked}
                                                                onChange={() => toggleEnseignant(e.id)}
                                                            />
                                                        </td>
                                                        <td className="font-bold text-text capitalize">{e.prenom} {e.nom}</td>
                                                        <td className="text-text-muted">{e.email}</td>
                                                        <td>{e.specialite?.nom || <span className="text-text-muted">—</span>}</td>
                                                    </tr>
                                                );
                                            }) : (
                                                <tr>
                                                    <td colSpan={4} className="py-20 text-text-muted font-medium text-center">Aucun formateur trouvé</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                                {totalEnseignantPages > 1 && (
                                    <div className="pagination border-t border-glass-border bg-surface-hover/10 px-6 py-4 flex items-center justify-between">
                                        <div className="pagination-info">
                                            Affichage <span className="text-text font-bold">{(pageEnseignant - 1) * itemsPerPage + 1}</span> à <span className="text-text font-bold">{Math.min(pageEnseignant * itemsPerPage, filteredEnseignants.length)}</span> sur <span className="text-text font-bold">{filteredEnseignants.length}</span> formateurs
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => setPageEnseignant(p => Math.max(1, p - 1))} disabled={pageEnseignant === 1} className="w-10 h-10 p-0 rounded-xl bg-background border border-glass-border text-text-muted hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-all icon-container">
                                                <ChevronLeft size={18} />
                                            </button>
                                            <div className="flex gap-1.5">
                                                {getPages(totalEnseignantPages, pageEnseignant).map((page, i) => (
                                                    page === '...' ? (
                                                        <div key={i} className="w-10 h-10 flex items-center justify-center text-text-muted font-bold select-none cursor-default">...</div>
                                                    ) : (
                                                        <button
                                                            key={i}
                                                            onClick={() => setPageEnseignant(Number(page))}
                                                            className={`w-10 h-10 p-0 rounded-xl font-bold transition-all ${pageEnseignant === page ? 'bg-primary text-white shadow-lg shadow-indigo-500/30' : 'bg-background border border-glass-border text-text-muted hover:border-primary hover:text-primary'}`}
                                                        >
                                                            {page}
                                                        </button>
                                                    )
                                                ))}
                                            </div>
                                            <button onClick={() => setPageEnseignant(p => Math.min(totalEnseignantPages, p + 1))} disabled={pageEnseignant === totalEnseignantPages} className="w-10 h-10 p-0 rounded-xl bg-background border border-glass-border text-text-muted hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-all icon-container">
                                                <ChevronRight size={18} />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </>
            )}

            {!selectedCoordId && !loadingCoord && (
                <div className="glass py-20 text-center">
                    <UserCog size={52} className="mx-auto text-text-muted mb-4 opacity-40" />
                    <p className="text-text-muted font-medium text-lg">Sélectionnez un coordinateur pour commencer</p>
                </div>
            )}
        </div>
    );
};

export default CoordinateurAssignPage;