import { useState, useEffect } from 'react';
import { UserCog, Users, GraduationCap, Search, ChevronDown, Loader2, CheckCircle2, AlertCircle, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/api-client';

interface Coordinateur {
    id: number; nom: string; prenom: string; email: string;
}

interface Apprenant {
    id: number; nom: string; prenom: string; email: string;
    specialite?: { id: number; nom: string };
    cycle?: { id: number; nomCycle: string };
}

interface Enseignant {
    id: number; nom: string; prenom: string; email: string;
    specialite?: { id: number; nom: string };
}

const CoordinateurAssignPage = () => {
    const [coordinateurs, setCoordinateurs] = useState<Coordinateur[]>([]);
    const [selectedCoordId, setSelectedCoordId] = useState('');
    const [allApprenants, setAllApprenants] = useState<Apprenant[]>([]);
    const [allEnseignants, setAllEnseignants] = useState<Enseignant[]>([]);
    const [assignedApprenantIds, setAssignedApprenantIds] = useState<Set<number>>(new Set());
    const [assignedEnseignantIds, setAssignedEnseignantIds] = useState<Set<number>>(new Set());
    const [selectedApprenantIds, setSelectedApprenantIds] = useState<Set<number>>(new Set());
    const [selectedEnseignantIds, setSelectedEnseignantIds] = useState<Set<number>>(new Set());

    const [loadingCoord, setLoadingCoord] = useState(true);
    const [loadingData, setLoadingData] = useState(false);
    const [saving, setSaving] = useState(false);

    const [searchApprenant, setSearchApprenant] = useState('');
    const [searchEnseignant, setSearchEnseignant] = useState('');

    const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const showToast = (type: 'success' | 'error', text: string) => {
        setToast({ type, text });
        setTimeout(() => setToast(null), 4000);
    };

    useEffect(() => {
        fetchCoordinateurs();
        fetchAllApprenants();
        fetchAllEnseignants();
    }, []);

    useEffect(() => {
        if (selectedCoordId) {
            fetchAssignedData();
        }
    }, [selectedCoordId]);

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

    const filteredApprenants = allApprenants.filter(a =>
        `${a.prenom} ${a.nom} ${a.email}`.toLowerCase().includes(searchApprenant.toLowerCase())
    );
    const filteredEnseignants = allEnseignants.filter(e =>
        `${e.prenom} ${e.nom} ${e.email}`.toLowerCase().includes(searchEnseignant.toLowerCase())
    );

    const selectedCoord = coordinateurs.find(c => c.id.toString() === selectedCoordId);

    return (
        <div className="space-y-6 animate-fade-in pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold">Affectation Coordinateur</h2>
                    <p className="text-text-muted">Sélectionnez un coordinateur puis les apprenants et formateurs associés.</p>
                </div>
                <div className="flex gap-3">
                    <div className="glass px-4 py-2.5 flex items-center gap-2">
                        <Users size={16} className="text-primary" />
                        <span className="text-sm font-bold text-text">{selectedApprenantIds.size} Apprenant{selectedApprenantIds.size > 1 ? 's' : ''}</span>
                    </div>
                    <div className="glass px-4 py-2.5 flex items-center gap-2">
                        <GraduationCap size={16} className="text-secondary" />
                        <span className="text-sm font-bold text-text">{selectedEnseignantIds.size} Formateur{selectedEnseignantIds.size > 1 ? 's' : ''}</span>
                    </div>
                </div>
            </div>

            <div className="glass p-6 overflow-hidden shadow-xl">
                <div className="flex flex-wrap gap-4 items-end">
                    <div className="flex-1 min-w-[280px]">
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
                    <button
                        onClick={handleSave}
                        disabled={!selectedCoordId || saving}
                        className="primary action-btn px-6 py-3 flex items-center gap-2 font-bold"
                    >
                        {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                        Enregistrer
                    </button>
                </div>
            </div>

            {selectedCoordId && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="glass overflow-hidden shadow-xl">
                        <div className="p-4 border-b border-glass-border flex items-center justify-between">
                            <h3 className="text-lg font-bold flex items-center gap-2">
                                <Users size={18} className="text-primary" />
                                Apprenants
                            </h3>
                            <span className="text-xs text-text-muted">{allApprenants.length} total</span>
                        </div>
                        <div className="p-3 border-b border-glass-border">
                            <div className="search-container">
                                <div className="search-icon"><Search size={16} /></div>
                                <input
                                    type="text"
                                    placeholder="Rechercher un apprenant..."
                                    value={searchApprenant}
                                    onChange={e => setSearchApprenant(e.target.value)}
                                    className="search-input text-sm"
                                />
                            </div>
                        </div>
                        {loadingData ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="w-6 h-6 text-primary animate-spin" />
                            </div>
                        ) : (
                            <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                                {filteredApprenants.length === 0 ? (
                                    <div className="py-8 text-center">
                                        <Users size={32} className="mx-auto text-text-muted mb-2 opacity-40" />
                                        <p className="text-text-muted text-sm">Aucun apprenant trouvé</p>
                                    </div>
                                ) : (
                                    filteredApprenants.map(a => {
                                        const checked = selectedApprenantIds.has(a.id);
                                        const wasAssigned = assignedApprenantIds.has(a.id);
                                        return (
                                            <label
                                                key={a.id}
                                                className={`flex items-center gap-3 px-4 py-3 hover:bg-surface-hover/50 cursor-pointer transition-colors border-b border-glass-border/50 ${checked ? 'bg-primary/5' : ''}`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={checked}
                                                    onChange={() => toggleApprenant(a.id)}
                                                    className="w-4 h-4 rounded accent-primary"
                                                />
                                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-xs shrink-0">
                                                    {(a.prenom?.[0] || '').toUpperCase()}{(a.nom?.[0] || '').toUpperCase()}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-semibold text-sm truncate">{a.prenom} {a.nom}</p>
                                                    <p className="text-xs text-text-muted truncate">{a.email}</p>
                                                </div>
                                                {wasAssigned && (
                                                    <span className="text-xs text-primary font-semibold shrink-0">Assigné</span>
                                                )}
                                            </label>
                                        );
                                    })
                                )}
                            </div>
                        )}
                        <div className="p-3 border-t border-glass-border text-xs text-text-muted flex justify-between">
                            <span>Sélectionnés: {selectedApprenantIds.size}</span>
                            <button
                                onClick={() => setSelectedApprenantIds(new Set(allApprenants.map(a => a.id)))}
                                className="text-primary hover:underline font-semibold"
                            >
                                Tout sélectionner
                            </button>
                        </div>
                    </div>

                    <div className="glass overflow-hidden shadow-xl">
                        <div className="p-4 border-b border-glass-border flex items-center justify-between">
                            <h3 className="text-lg font-bold flex items-center gap-2">
                                <GraduationCap size={18} className="text-secondary" />
                                Formateurs
                            </h3>
                            <span className="text-xs text-text-muted">{allEnseignants.length} total</span>
                        </div>
                        <div className="p-3 border-b border-glass-border">
                            <div className="search-container">
                                <div className="search-icon"><Search size={16} /></div>
                                <input
                                    type="text"
                                    placeholder="Rechercher un formateur..."
                                    value={searchEnseignant}
                                    onChange={e => setSearchEnseignant(e.target.value)}
                                    className="search-input text-sm"
                                />
                            </div>
                        </div>
                        {loadingData ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="w-6 h-6 text-primary animate-spin" />
                            </div>
                        ) : (
                            <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                                {filteredEnseignants.length === 0 ? (
                                    <div className="py-8 text-center">
                                        <GraduationCap size={32} className="mx-auto text-text-muted mb-2 opacity-40" />
                                        <p className="text-text-muted text-sm">Aucun formateur trouvé</p>
                                    </div>
                                ) : (
                                    filteredEnseignants.map(e => {
                                        const checked = selectedEnseignantIds.has(e.id);
                                        const wasAssigned = assignedEnseignantIds.has(e.id);
                                        return (
                                            <label
                                                key={e.id}
                                                className={`flex items-center gap-3 px-4 py-3 hover:bg-surface-hover/50 cursor-pointer transition-colors border-b border-glass-border/50 ${checked ? 'bg-secondary/5' : ''}`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={checked}
                                                    onChange={() => toggleEnseignant(e.id)}
                                                    className="w-4 h-4 rounded accent-secondary"
                                                />
                                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-secondary to-primary flex items-center justify-center text-white font-bold text-xs shrink-0">
                                                    {(e.prenom?.[0] || '').toUpperCase()}{(e.nom?.[0] || '').toUpperCase()}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-semibold text-sm truncate">{e.prenom} {e.nom}</p>
                                                    <p className="text-xs text-text-muted truncate">{e.email}</p>
                                                </div>
                                                {wasAssigned && (
                                                    <span className="text-xs text-secondary font-semibold shrink-0">Assigné</span>
                                                )}
                                            </label>
                                        );
                                    })
                                )}
                            </div>
                        )}
                        <div className="p-3 border-t border-glass-border text-xs text-text-muted flex justify-between">
                            <span>Sélectionnés: {selectedEnseignantIds.size}</span>
                            <button
                                onClick={() => setSelectedEnseignantIds(new Set(allEnseignants.map(e => e.id)))}
                                className="text-secondary hover:underline font-semibold"
                            >
                                Tout sélectionner
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {!selectedCoordId && !loadingCoord && (
                <div className="glass py-16 text-center">
                    <UserCog size={48} className="mx-auto text-text-muted mb-4 opacity-40" />
                    <p className="text-text-muted font-medium">Sélectionnez un coordinateur pour commencer</p>
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