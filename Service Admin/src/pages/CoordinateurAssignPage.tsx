import { useState, useEffect } from 'react';
import { UserCog, Users, GraduationCap, Search, ChevronDown, ChevronLeft, ChevronRight, Loader2, CheckCircle2, AlertCircle, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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

const ITEMS_PER_PAGE = 12;

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

    const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const showToast = (type: 'success' | 'error', text: string) => {
        setToast({ type, text });
        setTimeout(() => setToast(null), 4000);
    };

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
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const toggleEnseignant = (id: number) => {
        setSelectedEnseignantIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
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
            showToast('success', 'Affectations enregistrées avec succès');
        } catch {
            showToast('error', "Erreur lors de l'enregistrement");
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

    const totalApprenantPages = Math.ceil(filteredApprenants.length / ITEMS_PER_PAGE);
    const paginatedApprenants = filteredApprenants.slice(
        (pageApprenant - 1) * ITEMS_PER_PAGE,
        pageApprenant * ITEMS_PER_PAGE
    );

    const totalEnseignantPages = Math.ceil(filteredEnseignants.length / ITEMS_PER_PAGE);
    const paginatedEnseignants = filteredEnseignants.slice(
        (pageEnseignant - 1) * ITEMS_PER_PAGE,
        pageEnseignant * ITEMS_PER_PAGE
    );

    const selectedCoord = coordinateurs.find(c => c.id.toString() === selectedCoordId);

    const Pagination = ({ page, totalPages, setPage }: { page: number; totalPages: number; setPage: (p: number) => void }) => {
        if (totalPages <= 1) return null;
        return (
            <div className="flex items-center justify-center gap-1 px-4 py-3 border-t border-glass-border">
                <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="action-btn text-xs px-2 py-1.5 disabled:opacity-40"
                >
                    <ChevronLeft size={14} />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
                    .map((p, idx, arr) => (
                        <span key={p} className="flex items-center gap-0">
                            {idx > 0 && arr[idx - 1] !== p - 1 && <span className="text-text-muted px-1">...</span>}
                            <button
                                onClick={() => setPage(p)}
                                className={`action-btn text-xs px-3 py-1.5 ${p === page ? 'primary' : ''}`}
                            >
                                {p}
                            </button>
                        </span>
                    ))}
                <button
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                    className="action-btn text-xs px-2 py-1.5 disabled:opacity-40"
                >
                    <ChevronRight size={14} />
                </button>
            </div>
        );
    };

    return (
        <div className="space-y-6 animate-fade-in pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold">Affectation Coordinateur</h2>
                    <p className="text-text-muted">Sélectionnez un coordinateur, puis assignez-lui des apprenants et formateurs.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="glass px-4 py-2 flex items-center gap-2">
                        <Users size={16} className="text-primary" />
                        <span className="text-sm font-bold">{selectedApprenantIds.size}</span>
                    </div>
                    <div className="glass px-4 py-2 flex items-center gap-2">
                        <GraduationCap size={16} className="text-secondary" />
                        <span className="text-sm font-bold">{selectedEnseignantIds.size}</span>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={!selectedCoordId || saving}
                        className="primary action-btn px-5 py-2 flex items-center gap-2 font-bold"
                    >
                        {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        Enregistrer
                    </button>
                </div>
            </div>

            <div className="glass p-5 shadow-xl">
                <div className="relative min-w-[280px] max-w-md">
                    <label className="block text-xs font-bold text-text-muted uppercase tracking-widest mb-2">Coordinateur</label>
                    <div className="relative">
                        <select
                            value={selectedCoordId}
                            onChange={e => { setSelectedCoordId(e.target.value); }}
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
            </div>

            {selectedCoord && (
                <>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setTab('apprenants')}
                            className={`action-btn px-6 py-3 font-bold flex items-center gap-2 text-base ${tab === 'apprenants' ? 'primary' : ''}`}
                        >
                            <Users size={18} />
                            Apprenants
                        </button>
                        <button
                            onClick={() => setTab('enseignants')}
                            className={`action-btn px-6 py-3 font-bold flex items-center gap-2 text-base ${tab === 'enseignants' ? 'primary' : ''}`}
                        >
                            <GraduationCap size={18} />
                            Formateurs
                        </button>
                    </div>

                    <AnimatePresence mode="wait">
                        {tab === 'apprenants' && (
                            <motion.div key="apprenants" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="glass overflow-hidden shadow-xl">
                                <div className="p-4 border-b border-glass-border flex items-center justify-between">
                                    <h3 className="text-lg font-bold flex items-center gap-2">
                                        <Users size={18} className="text-primary" />
                                        Apprenants
                                    </h3>
                                    <span className="text-xs text-text-muted">{filteredApprenants.length} sur {allApprenants.length}</span>
                                </div>

                                <div className="p-4 border-b border-glass-border">
                                    <div className="flex flex-wrap gap-3">
                                        <div className="search-container flex-1 min-w-[180px]">
                                            <div className="search-icon"><Search size={16} /></div>
                                            <input
                                                type="text"
                                                placeholder="Rechercher..."
                                                value={searchApprenant}
                                                onChange={e => setSearchApprenant(e.target.value)}
                                                className="search-input text-sm"
                                            />
                                        </div>
                                        <div className="relative min-w-[150px]">
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
                                            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                                        </div>
                                        <div className="relative min-w-[150px]">
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
                                            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                                        </div>
                                        <button
                                            onClick={() => {
                                                const all = new Set(filteredApprenants.map(a => a.id));
                                                setSelectedApprenantIds(prev => prev.size === all.size && [...prev].every(id => all.has(id)) ? new Set() : all);
                                            }}
                                            className="secondary action-btn text-sm px-4"
                                        >
                                            {selectedApprenantIds.size === filteredApprenants.length && filteredApprenants.length > 0 ? 'Tout désélect.' : 'Tout sélect.'}
                                        </button>
                                    </div>
                                </div>

                                {loadingData ? (
                                    <div className="flex items-center justify-center py-16">
                                        <Loader2 className="w-6 h-6 text-primary animate-spin" />
                                    </div>
                                ) : paginatedApprenants.length === 0 ? (
                                    <div className="py-16 text-center">
                                        <Users size={40} className="mx-auto text-text-muted mb-3 opacity-40" />
                                        <p className="text-text-muted font-medium">Aucun apprenant trouvé</p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="divide-y divide-glass-border">
                                            {paginatedApprenants.map(a => {
                                                const checked = selectedApprenantIds.has(a.id);
                                                const wasAssigned = assignedApprenantIds.has(a.id);
                                                return (
                                                    <label
                                                        key={a.id}
                                                        className={`flex items-center gap-4 px-5 py-4 hover:bg-surface-hover/50 cursor-pointer transition-colors ${checked ? 'bg-primary/5' : ''}`}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={checked}
                                                            onChange={() => toggleApprenant(a.id)}
                                                            className="w-4 h-4 rounded accent-primary"
                                                        />
                                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-lg shadow-primary/20">
                                                            {(a.prenom?.[0] || '').toUpperCase()}{(a.nom?.[0] || '').toUpperCase()}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-bold text-sm">{a.prenom} {a.nom}</p>
                                                            <p className="text-xs text-text-muted truncate">{a.email}</p>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            {a.specialite && <span className="tag tag-licence text-xs">{a.specialite.nom}</span>}
                                                            {a.cycle && <span className="tag tag-master text-xs">{a.cycle.nomCycle}</span>}
                                                            {wasAssigned && <CheckCircle2 size={14} className="text-primary shrink-0" />}
                                                        </div>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                        <Pagination page={pageApprenant} totalPages={totalApprenantPages} setPage={setPageApprenant} />
                                    </>
                                )}
                            </motion.div>
                        )}

                        {tab === 'enseignants' && (
                            <motion.div key="enseignants" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="glass overflow-hidden shadow-xl">
                                <div className="p-4 border-b border-glass-border flex items-center justify-between">
                                    <h3 className="text-lg font-bold flex items-center gap-2">
                                        <GraduationCap size={18} className="text-secondary" />
                                        Formateurs
                                    </h3>
                                    <span className="text-xs text-text-muted">{filteredEnseignants.length} sur {allEnseignants.length}</span>
                                </div>

                                <div className="p-4 border-b border-glass-border">
                                    <div className="flex flex-wrap gap-3">
                                        <div className="search-container flex-1 min-w-[180px]">
                                            <div className="search-icon"><Search size={16} /></div>
                                            <input
                                                type="text"
                                                placeholder="Rechercher..."
                                                value={searchEnseignant}
                                                onChange={e => setSearchEnseignant(e.target.value)}
                                                className="search-input text-sm"
                                            />
                                        </div>
                                        <div className="relative min-w-[150px]">
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
                                            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                                        </div>
                                        <button
                                            onClick={() => {
                                                const all = new Set(filteredEnseignants.map(e => e.id));
                                                setSelectedEnseignantIds(prev => prev.size === all.size && [...prev].every(id => all.has(id)) ? new Set() : all);
                                            }}
                                            className="secondary action-btn text-sm px-4"
                                        >
                                            {selectedEnseignantIds.size === filteredEnseignants.length && filteredEnseignants.length > 0 ? 'Tout désélect.' : 'Tout sélect.'}
                                        </button>
                                    </div>
                                </div>

                                {loadingData ? (
                                    <div className="flex items-center justify-center py-16">
                                        <Loader2 className="w-6 h-6 text-primary animate-spin" />
                                    </div>
                                ) : paginatedEnseignants.length === 0 ? (
                                    <div className="py-16 text-center">
                                        <GraduationCap size={40} className="mx-auto text-text-muted mb-3 opacity-40" />
                                        <p className="text-text-muted font-medium">Aucun formateur trouvé</p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="divide-y divide-glass-border">
                                            {paginatedEnseignants.map(e => {
                                                const checked = selectedEnseignantIds.has(e.id);
                                                const wasAssigned = assignedEnseignantIds.has(e.id);
                                                return (
                                                    <label
                                                        key={e.id}
                                                        className={`flex items-center gap-4 px-5 py-4 hover:bg-surface-hover/50 cursor-pointer transition-colors ${checked ? 'bg-secondary/5' : ''}`}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={checked}
                                                            onChange={() => toggleEnseignant(e.id)}
                                                            className="w-4 h-4 rounded accent-secondary"
                                                        />
                                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-secondary to-primary flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-lg shadow-secondary/20">
                                                            {(e.prenom?.[0] || '').toUpperCase()}{(e.nom?.[0] || '').toUpperCase()}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-bold text-sm">{e.prenom} {e.nom}</p>
                                                            <p className="text-xs text-text-muted truncate">{e.email}</p>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            {e.specialite && <span className="tag tag-licence text-xs">{e.specialite.nom}</span>}
                                                            {wasAssigned && <CheckCircle2 size={14} className="text-secondary shrink-0" />}
                                                        </div>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                        <Pagination page={pageEnseignant} totalPages={totalEnseignantPages} setPage={setPageEnseignant} />
                                    </>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </>
            )}

            {!selectedCoordId && !loadingCoord && (
                <div className="glass py-20 text-center">
                    <UserCog size={52} className="mx-auto text-text-muted mb-4 opacity-40" />
                    <p className="text-text-muted font-medium text-lg">Sélectionnez un coordinateur pour commencer</p>
                </div>
            )}

            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50 }}
                        className={`fixed bottom-6 right-6 z-[60] px-5 py-3 rounded-xl border shadow-xl flex items-center gap-3 ${
                            toast.type === 'success'
                                ? 'bg-success/10 border-success/20 text-success'
                                : 'bg-error/10 border-error/20 text-error'
                        }`}
                        style={{ backdropFilter: 'blur(12px)' }}
                    >
                        {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                        <span className="text-sm font-semibold">{toast.text}</span>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default CoordinateurAssignPage;