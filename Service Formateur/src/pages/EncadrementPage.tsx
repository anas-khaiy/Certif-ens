import React, { useState, useEffect } from 'react';
import {
    Users, Plus, ChevronRight, Search, Loader2, Calendar, Clock,
    Flag, Trash2, Edit3, Save, X, ChevronDown, ChevronUp,
    CheckCircle2, Circle, AlertTriangle, PlayCircle, GripVertical,
    ArrowLeft, Target, Layers, BarChart2, Send, Upload, ChevronLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/api-client';
import { useNavigate } from 'react-router';

// ─── Types ───────────────────────────────────────────────────────────────────
interface Apprenant {
    id: number;
    nom: string;
    prenom: string;
    email: string;
    photoProfile?: string;
    specialite?: string;
}

interface Task {
    id: string | number;
    title: string;
    description: string;
    deadline: string;
    estimatedHours: number;
    priority: 'low' | 'medium' | 'high' | 'critical';
    type: 'sequential' | 'parallel';
    status: 'not_started' | 'in_progress' | 'completed' | 'blocked' | 'late';
    score?: number;
    feedback?: string;
    deliverable?: string;
    comments?: string;
    blockedReason?: string;
    alertMessage?: string;
}

interface Phase {
    id: string | number;
    title: string;
    tasks: Task[];
    collapsed: boolean;
}

interface Plan {
    id: string | number;
    title: string;
    description: string;
    apprenantId: number;
    phases: Phase[];
    createdAt: string;
    assignedAt?: string;
    overallProgress: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const PRIORITY_COLORS: Record<string, string> = {
    low: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    medium: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    high: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    critical: 'bg-red-500/10 text-red-400 border-red-500/20',
};

const PRIORITY_LABELS: Record<string, string> = {
    low: 'Faible', medium: 'Moyen', high: 'Élevé', critical: 'Critique'
};

const STATUS_CONFIG: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
    not_started: { icon: <Circle size={14} />, color: 'text-text-muted', label: 'Non commencé' },
    in_progress: { icon: <PlayCircle size={14} />, color: 'text-blue-400', label: 'En cours' },
    completed: { icon: <CheckCircle2 size={14} />, color: 'text-emerald-400', label: 'Complété' },
    blocked: { icon: <AlertTriangle size={14} />, color: 'text-red-400', label: 'Bloqué' },
    late: { icon: <Clock size={14} />, color: 'text-orange-400', label: 'En retard' },
};

const uid = () => 'temp-' + Math.random().toString(36).slice(2, 10);

const defaultTask = (): Task => ({
    id: uid(), title: '', description: '', deadline: '',
    estimatedHours: 1, priority: 'medium', type: 'sequential',
    status: 'not_started',
});

const defaultPhase = (n: number): Phase => ({
    id: uid(), title: `Phase ${n}`, tasks: [defaultTask()], collapsed: false,
});

// ─── EncadrementPage ──────────────────────────────────────────────────────────
const EncadrementPage = () => {
    const navigate = useNavigate();
    // Step: 'select' | 'plan_list' | 'plan_editor' | 'monitor'
    const [step, setStep] = useState<'select' | 'plan_list' | 'plan_editor' | 'monitor'>('select');
    const [apprenants, setApprenants] = useState<Apprenant[]>([]);
    const [loadingApprenants, setLoadingApprenants] = useState(true);
    const [search, setSearch] = useState('');
    const [specialiteFilter, setSpecialiteFilter] = useState('ALL');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 9;
    const [selectedApprenant, setSelectedApprenant] = useState<Apprenant | null>(null);
    const [targetApprenants, setTargetApprenants] = useState<Apprenant[]>([]);

    // Plans (local state simulating persistence)
    const [plans, setPlans] = useState<Plan[]>([]);
    const [monitorPlan, setMonitorPlan] = useState<Plan | null>(null);

    // Plan editor state
    const [planTitle, setPlanTitle] = useState('');
    const [planDesc, setPlanDesc] = useState('');
    const [phases, setPhases] = useState<Phase[]>([defaultPhase(1)]);
    const [saving, setSaving] = useState(false);
    const [editingPlanId, setEditingPlanId] = useState<string | number | null>(null);

    // Feedback modal
    const [feedbackModal, setFeedbackModal] = useState<{ planId: string | number; phaseId: string | number; taskId: string | number } | null>(null);
    const [feedbackText, setFeedbackText] = useState('');
    const [feedbackScore, setFeedbackScore] = useState<number | undefined>(undefined);
    const [alertText, setAlertText] = useState('');
    const [feedbackAction, setFeedbackAction] = useState<'approve' | 'revision'>('approve');

    useEffect(() => {
        const fetchApprenants = async () => {
            try {
                // Fetch apprenants enrolled in this formateur's courses
                const response = await api.get('/dashboard/learner-statistics');
                const data: any[] = response.data || [];
                
                // Fetch enrollments to get specialities
                let specialiteMap: Record<string, string> = {};
                try {
                    const enrollResponse = await api.get('/enrollments');
                    enrollResponse.data.forEach((e: any) => {
                        if (e.apprenant && e.apprenant.email && e.apprenant.specialite) {
                            specialiteMap[e.apprenant.email] = e.apprenant.specialite.nom || e.apprenant.specialite;
                        }
                    });
                } catch (err) {
                    console.error("Error fetching specialites from enrollments:", err);
                }

                const mapped: Apprenant[] = data.map((a: any) => ({
                    id: a.id,
                    nom: (a.name || '').split(' ').slice(1).join(' ') || a.name,
                    prenom: (a.name || '').split(' ')[0] || '',
                    email: a.email || '',
                    photoProfile: a.photoProfile,
                    specialite: specialiteMap[a.email] || a.specialite?.nom || a.specialite || '',
                }));
                setApprenants(mapped);
            } catch {
                setApprenants([]);
            } finally {
                setLoadingApprenants(false);
            }
        };

        const fetchPlans = async () => {
            try {
                const response = await api.get('/encadrement/trainer');
                setPlans(Array.isArray(response.data) ? response.data : []);
            } catch (err) {
                console.error("Error fetching plans:", err);
            }
        };

        fetchApprenants();
        fetchPlans();
    }, []);

    const filteredApprenants = apprenants.filter(a => {
        const matchesSearch = `${a.prenom} ${a.nom}`.toLowerCase().includes(search.toLowerCase()) ||
                              a.email.toLowerCase().includes(search.toLowerCase());
        const matchesSpecialite = specialiteFilter === 'ALL' || a.specialite === specialiteFilter;
        return matchesSearch && matchesSpecialite;
    });

    const specialites = Array.from(new Set(apprenants.map(a => a.specialite).filter(s => s && s.trim() !== ''))) as string[];

    useEffect(() => {
        setCurrentPage(1);
    }, [search, specialiteFilter]);

    const totalPages = Math.ceil(filteredApprenants.length / itemsPerPage);
    const displayedApprenants = filteredApprenants.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const getPageNumbers = () => {
        const pages = [];
        if (totalPages <= 5) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            if (currentPage <= 3) {
                pages.push(1, 2, 3, 4, '...', totalPages);
            } else if (currentPage >= totalPages - 2) {
                pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
            } else {
                pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
            }
        }
        return pages;
    };

    const apprenantPlans = selectedApprenant
        ? plans.filter(p => p.apprenantId === selectedApprenant.id)
        : [];

    // ── Plan editor helpers ───────────────────────────────────────────────────
    const openNewPlan = () => {
        setPlanTitle(''); setPlanDesc('');
        setPhases([defaultPhase(1)]);
        setEditingPlanId(null);
        setTargetApprenants(selectedApprenant ? [selectedApprenant] : []);
        setStep('plan_editor');
    };

    const openEditPlan = (plan: Plan) => {
        setPlanTitle(plan.title);
        setPlanDesc(plan.description);
        setPhases(JSON.parse(JSON.stringify(plan.phases)));
        setEditingPlanId(plan.id);
        const appr = apprenants.find(a => a.id === plan.apprenantId);
        setTargetApprenants(appr ? [appr] : []);
        setStep('plan_editor');
    };

    const addPhase = () => {
        setPhases(prev => [...prev, defaultPhase(prev.length + 1)]);
    };

    const removePhase = (phaseId: string | number) => {
        setPhases(prev => prev.filter(p => p.id.toString() !== phaseId.toString()));
    };

    const togglePhaseCollapse = (phaseId: string | number) => {
        setPhases(prev => prev.map(p => p.id.toString() === phaseId.toString() ? { ...p, collapsed: !p.collapsed } : p));
    };

    const updatePhaseTitle = (phaseId: string | number, title: string) => {
        setPhases(prev => prev.map(p => p.id.toString() === phaseId.toString() ? { ...p, title } : p));
    };

    const addTask = (phaseId: string | number) => {
        setPhases(prev => prev.map(p =>
            p.id.toString() === phaseId.toString() ? { ...p, tasks: [...p.tasks, defaultTask()] } : p
        ));
    };

    const removeTask = (phaseId: string | number, taskId: string | number) => {
        setPhases(prev => prev.map(p =>
            p.id.toString() === phaseId.toString() ? { ...p, tasks: p.tasks.filter(t => t.id.toString() !== taskId.toString()) } : p
        ));
    };

    const updateTask = (phaseId: string | number, taskId: string | number, field: keyof Task, value: any) => {
        setPhases(prev => prev.map(p =>
            p.id.toString() === phaseId.toString() ? {
                ...p, tasks: p.tasks.map(t => t.id.toString() === taskId.toString() ? { ...t, [field]: value } : t)
            } : p
        ));
    };

    const stripTempIds = (obj: any): any => {
        if (Array.isArray(obj)) return obj.map(stripTempIds);
        if (obj !== null && typeof obj === 'object') {
            const newObj: any = {};
            for (const key in obj) {
                // Remove temp or null IDs
                if (key === 'id' && (obj[key] === null || (typeof obj[key] === 'string' && obj[key].includes('temp')))) {
                    continue;
                }
                // Remove UI-only fields
                if (key === 'collapsed' || key === 'monitorPlan') {
                    continue;
                }
                newObj[key] = stripTempIds(obj[key]);
            }
            return newObj;
        }
        return obj;
    };

    const savePlan = async () => {
        if (!planTitle.trim() || targetApprenants.length === 0 || !selectedApprenant) return;
        setSaving(true);

        const now = new Date().toISOString().split('.')[0];
        const totalTasks = phases.reduce((acc, p) => acc + p.tasks.length, 0);
        const completedTasks = phases.reduce((acc, p) => acc + p.tasks.filter(t => t.status === 'completed').length, 0);
        const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        try {
            for (const targetApp of targetApprenants) {
                const planId = (editingPlanId && targetApprenants.length === 1 && targetApp.id === selectedApprenant?.id) ? editingPlanId : null;

                const planData: any = {
                    id: planId,
                    title: planTitle,
                    description: planDesc,
                    apprenantId: targetApp.id,
                    phases: phases.map((p, idx) => ({
                        ...p,
                        orderIndex: idx,
                        tasks: p.tasks.map(t => ({ ...t }))
                    })),
                    overallProgress: progress,
                    assignedAt: now
                };

                const cleanData = stripTempIds(planData);
                await api.post('/encadrement/save', cleanData);
            }
            
            // Refetch or update local state
            const updatedResponse = await api.get('/encadrement/trainer');
            setPlans(Array.isArray(updatedResponse.data) ? updatedResponse.data : []);
            
            setStep('plan_list');
        } catch (err) {
            console.error("Error saving plan:", err);
            alert("Erreur lors de l'enregistrement du plan.");
        } finally {
            setSaving(false);
        }
    };

    const deletePlan = async (planId: string | number) => {
        if (!window.confirm("Supprimer ce plan ?")) return;
        try {
            await api.delete(`/encadrement/${planId}`);
            setPlans(prev => prev.filter(p => p.id.toString() !== planId.toString()));
        } catch (err) {
            console.error("Error deleting plan:", err);
        }
    };

    const assignPlan = async (plan: Plan) => {
        try {
            const updated = { ...plan, assignedAt: new Date().toISOString() };
            await api.post('/encadrement/save', stripTempIds(updated));
            const updatedResponse = await api.get('/encadrement/trainer');
            setPlans(Array.isArray(updatedResponse.data) ? updatedResponse.data : []);
            alert(`Plan "${plan.title}" assigné !`);
        } catch (err) {
            console.error("Error assigning plan:", err);
        }
    };

    const openFeedback = (planId: string | number, phaseId: string | number, taskId: string | number) => {
        setFeedbackModal({ planId, phaseId, taskId });
        const plan = plans.find(p => p.id.toString() === planId.toString());
        const phase = plan?.phases.find(ph => ph.id.toString() === phaseId.toString());
        const task = phase?.tasks.find(t => t.id.toString() === taskId.toString());
        setFeedbackText(task?.feedback || '');
        setFeedbackScore(task?.score);
        setAlertText(task?.alertMessage || '');
        setFeedbackAction('approve');
    };

    const submitFeedback = async () => {
        if (!feedbackModal) return;
        const { planId, phaseId, taskId } = feedbackModal;
        
        const plan = plans.find(p => p.id.toString() === planId.toString());
        if (!plan) return;

        const updatedPlan = {
            ...plan,
            phases: plan.phases.map(phase => {
                if (phase.id.toString() !== phaseId.toString()) return phase;
                return {
                    ...phase,
                    tasks: phase.tasks.map(task => {
                        if (task.id.toString() !== taskId.toString()) return task;
                        return {
                            ...task,
                            feedback: feedbackText,
                            score: feedbackScore,
                            alertMessage: alertText,
                            status: (feedbackAction === 'approve' ? 'completed' : 'in_progress') as any,
                        };
                    })
                };
            })
        };

        try {
            await api.post('/encadrement/save', stripTempIds(updatedPlan));
            const updatedResponse = await api.get('/encadrement/trainer');
            setPlans(Array.isArray(updatedResponse.data) ? updatedResponse.data : []);
            setFeedbackModal(null);
        } catch (err) {
            console.error("Error submitting feedback:", err);
        }
    };

    const getInitials = (a: Apprenant) =>
        `${(a.prenom || '?')[0]}${(a.nom || '?')[0]}`.toUpperCase();

    // ─────────────────────────────────────────────────────────────────────────
    // RENDER: Select Apprenant
    // ─────────────────────────────────────────────────────────────────────────
    if (step === 'select') {
        return (
            <div className="space-y-8 animate-fade-in pb-10">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                        <h1 className="text-3xl font-bold" style={{ background: 'linear-gradient(135deg, #6366f1, #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            Encadrement Structuré
                        </h1>
                        <p className="text-text-muted mt-1">Sélectionnez un apprenant pour créer ou gérer un plan d'encadrement.</p>
                    </div>
                    <button onClick={() => navigate('/encadrement-statistics')} className="primary flex items-center gap-2">
                        <BarChart2 size={18} /> Voir les Statistiques
                    </button>
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
                            value={specialiteFilter}
                            onChange={(e) => setSpecialiteFilter(e.target.value)}
                            className="form-input appearance-none w-full font-bold"
                        >
                            <option value="ALL">Toutes les spécialités</option>
                            {specialites.map(spec => (
                                <option key={spec} value={spec}>{spec}</option>
                            ))}
                        </select>
                        <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                    </div>
                </div>

                {loadingApprenants ? (
                    <div className="flex items-center justify-center min-h-[200px]">
                        <Loader2 className="w-10 h-10 text-primary animate-spin" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {displayedApprenants.map(a => {
                            const planCount = plans.filter(p => p.apprenantId === a.id).length;
                            return (
                                <motion.div
                                    key={a.id}
                                    initial={{ opacity: 0, y: 16 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    whileHover={{ scale: 1.02 }}
                                    onClick={() => { setSelectedApprenant(a); setStep('plan_list'); }}
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
                                                <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(99,102,241,0.12)', color: '#818cf8' }}>
                                                    {planCount} plan{planCount !== 1 ? 's' : ''}
                                                </span>
                                                {a.specialite && a.specialite.trim() !== '' && (
                                                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-surface-hover border border-glass-border text-text-muted mt-1">
                                                        {a.specialite}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <ChevronRight size={20} className="text-text-muted group-hover:text-primary transition-colors shrink-0" />
                                    </div>
                                </motion.div>
                            );
                        })}
                        {displayedApprenants.length === 0 && (
                            <div className="col-span-3 glass p-12 text-center" style={{ borderRadius: '20px' }}>
                                <Users size={48} className="mx-auto text-text-muted mb-4 opacity-20" />
                                <h3 className="text-lg font-bold">Aucun apprenant trouvé</h3>
                                <p className="text-text-muted text-sm mt-1">Aucun apprenant n'est inscrit dans vos cours.</p>
                            </div>
                        )}
                    </div>
                )}

                {!loadingApprenants && totalPages > 1 && (
                    <div className="flex items-center justify-start gap-4 pt-6">
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface border border-glass-border text-text-muted hover:text-primary disabled:opacity-20 transition-all shadow-sm"
                            >
                                <ChevronLeft size={20} style={{ minWidth: '20px', minHeight: '20px', display: 'block' }} strokeWidth={2.5} />
                            </button>
                            <div className="flex gap-1">
                                {getPageNumbers().map((page, index) => (
                                    page === '...' ? (
                                        <span key={`dots-${index}`} className="w-10 h-10 flex items-center justify-center text-text-muted font-bold tracking-widest text-xs">...</span>
                                    ) : (
                                        <button
                                            key={`page-${page}`}
                                            onClick={() => setCurrentPage(page as number)}
                                            className={`w-10 h-10 rounded-xl font-bold transition-all text-xs border ${currentPage === page ? 'bg-primary text-white border-primary shadow-lg' : 'bg-surface border-glass-border text-text-muted hover:border-primary hover:text-primary'}`}
                                        >
                                            {page}
                                        </button>
                                    )
                                ))}
                            </div>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface border border-glass-border text-text-muted hover:text-primary disabled:opacity-20 transition-all shadow-sm"
                            >
                                <ChevronRight size={20} style={{ minWidth: '20px', minHeight: '20px', display: 'block' }} strokeWidth={2.5} />
                            </button>
                        </div>
                        <span className="text-xs text-text-muted font-bold">
                            Page {currentPage} / {totalPages}
                        </span>
                    </div>
                )}
            </div>
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // RENDER: Plan List
    // ─────────────────────────────────────────────────────────────────────────
    if (step === 'plan_list' && selectedApprenant) {
        return (
            <div className="space-y-8 animate-fade-in pb-10">
                {/* Header */}
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setStep('select')} className="secondary p-2 rounded-xl">
                            <ArrowLeft size={20} />
                        </button>
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center font-black text-primary border border-primary/10 shrink-0">
                            {getInitials(selectedApprenant)}
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-text">{selectedApprenant.prenom} {selectedApprenant.nom}</h1>
                            <p className="text-text-muted text-sm">{selectedApprenant.email}</p>
                        </div>
                    </div>
                    <button onClick={openNewPlan} className="primary flex items-center gap-2">
                        <Plus size={18} /> Nouveau Plan
                    </button>
                </div>

                {/* Plans */}
                {apprenantPlans.length === 0 ? (
                    <div className="glass p-16 text-center" style={{ borderRadius: '20px' }}>
                        <Target size={56} className="mx-auto text-text-muted mb-4 opacity-20" />
                        <h3 className="text-xl font-bold text-text">Aucun plan d'encadrement</h3>
                        <p className="text-text-muted text-sm mt-2 mb-6">Créez un premier plan structuré pour accompagner cet apprenant.</p>
                        <button onClick={openNewPlan} className="primary">
                            <Plus size={18} /> Créer un Plan
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {apprenantPlans.map(plan => {
                            const totalTasks = plan.phases.reduce((acc, p) => acc + p.tasks.length, 0);
                            const completedTasks = plan.phases.reduce((acc, p) => acc + p.tasks.filter(t => t.status === 'completed').length, 0);
                            const blockedTasks = plan.phases.reduce((acc, p) => acc + p.tasks.filter(t => t.status === 'blocked').length, 0);
                            const lateTasks = plan.phases.reduce((acc, p) => acc + p.tasks.filter(t => t.status === 'late' || (t.deadline && new Date(t.deadline) < new Date() && t.status !== 'completed')).length, 0);
                            const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

                            return (
                                <motion.div
                                    key={plan.id}
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="glass p-6"
                                    style={{ borderRadius: '20px' }}
                                >
                                    <div className="flex items-start justify-between gap-4 flex-wrap">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 mb-1">
                                                <h2 className="text-lg font-bold text-text truncate">{plan.title}</h2>
                                                {plan.assignedAt && (
                                                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary shrink-0">Assigné</span>
                                                )}
                                            </div>
                                            {plan.description && <p className="text-text-muted text-sm mb-3 line-clamp-2">{plan.description}</p>}
                                            <div className="flex items-center gap-4 flex-wrap text-xs text-text-muted mb-4">
                                                <span className="flex items-center gap-1"><Layers size={13} /> {plan.phases.length} phases</span>
                                                <span className="flex items-center gap-1"><Target size={13} /> {totalTasks} tâches</span>
                                                <span className="flex items-center gap-1 text-emerald-400"><CheckCircle2 size={13} /> {completedTasks} complétées</span>
                                                {blockedTasks > 0 && <span className="flex items-center gap-1 text-red-400"><AlertTriangle size={13} /> {blockedTasks} bloquées</span>}
                                                {lateTasks > 0 && <span className="flex items-center gap-1 text-orange-400"><Clock size={13} /> {lateTasks} en retard</span>}
                                            </div>

                                            {/* Progress bar */}
                                            <div className="space-y-1">
                                                <div className="flex justify-between text-xs font-bold text-text-muted">
                                                    <span>Progression</span>
                                                    <span style={{ color: '#6366f1' }}>{progress}%</span>
                                                </div>
                                                <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--surface-hover)' }}>
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${progress}%` }}
                                                        transition={{ duration: 1, ease: 'easeOut' }}
                                                        className="h-full rounded-full"
                                                        style={{ background: 'linear-gradient(90deg, #6366f1, #ec4899)' }}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 shrink-0">
                                            <button
                                                onClick={() => { setMonitorPlan(plan); setStep('monitor'); }}
                                                className="secondary flex items-center gap-1.5 text-sm"
                                            >
                                                <BarChart2 size={15} /> Suivi
                                            </button>
                                            <button
                                                onClick={() => openEditPlan(plan)}
                                                className="secondary flex items-center gap-1.5 text-sm"
                                            >
                                                <Edit3 size={15} /> Modifier
                                            </button>
                                            {!plan.assignedAt && (
                                                <button
                                                    onClick={() => assignPlan(plan)}
                                                    className="primary flex items-center gap-1.5 text-sm"
                                                >
                                                    <Send size={15} /> Assigner
                                                </button>
                                            )}
                                            <button
                                                onClick={() => deletePlan(plan.id)}
                                                className="p-2 rounded-xl text-text-muted hover:text-red-400 hover:bg-red-500/10 transition-all"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // RENDER: Plan Editor
    // ─────────────────────────────────────────────────────────────────────────
    if (step === 'plan_editor' && selectedApprenant) {
        return (
            <div className="space-y-6 animate-fade-in pb-10">
                {/* Header */}
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setStep('plan_list')} className="secondary p-2 rounded-xl">
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-text">
                                {editingPlanId ? 'Modifier le Plan' : 'Nouveau Plan d\'Encadrement'}
                            </h1>
                            {!editingPlanId && targetApprenants.length > 1 ? (
                                <p className="text-text-muted text-sm">Pour {targetApprenants.length} apprenants</p>
                            ) : (
                                <p className="text-text-muted text-sm">Pour {selectedApprenant.prenom} {selectedApprenant.nom}</p>
                            )}
                        </div>
                    </div>
                    <button onClick={savePlan} disabled={saving} className="primary flex items-center gap-2">
                        {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        {saving ? 'Enregistrement...' : 'Enregistrer le Plan'}
                    </button>
                </div>

                {/* Plan Info */}
                <div className="glass p-6 space-y-4" style={{ borderRadius: '20px' }}>
                    <h2 className="font-bold text-text flex items-center gap-2"><Target size={18} className="text-primary" /> Informations du Plan</h2>
                    
                    {!editingPlanId && (
                        <div className="form-group pb-4 border-b" style={{ borderColor: 'var(--glass-border)' }}>
                            <label className="form-label font-bold text-primary mb-2 block">Apprenants ciblés *</label>
                            <div className="flex flex-wrap gap-2 mb-3">
                                {targetApprenants.map(app => (
                                    <span key={app.id} className="flex items-center gap-1 bg-primary/10 text-primary px-3 py-1.5 rounded-full text-sm font-bold border border-primary/20">
                                        {app.prenom} {app.nom}
                                        {targetApprenants.length > 1 && (
                                            <button onClick={() => setTargetApprenants(prev => prev.filter(a => a.id !== app.id))} className="text-primary hover:text-red-500 hover:bg-red-500/10 rounded-full p-0.5 ml-1 transition-all"><X size={14}/></button>
                                        )}
                                    </span>
                                ))}
                            </div>
                            <div className="relative max-w-sm">
                                <select
                                    className="form-input text-sm font-medium w-full appearance-none bg-surface"
                                    onChange={(e) => {
                                        const app = apprenants.find(a => a.id.toString() === e.target.value);
                                        if (app && !targetApprenants.find(a => a.id === app.id)) {
                                            setTargetApprenants(prev => [...prev, app]);
                                        }
                                        e.target.value = "";
                                    }}
                                    defaultValue=""
                                >
                                    <option value="" disabled>+ Ajouter un autre apprenant...</option>
                                    {apprenants.filter(app => !targetApprenants.find(t => t.id === app.id)).map(app => (
                                        <option key={app.id} value={app.id}>{app.prenom} {app.nom} ({app.specialite || 'Sans spécialité'})</option>
                                    ))}
                                </select>
                                <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                            </div>
                        </div>
                    )}
                    <div className="form-group">
                        <label className="form-label">Titre du Plan *</label>
                        <input className="form-input" placeholder="Ex: Module React Avancé – Projet Final" value={planTitle} onChange={e => setPlanTitle(e.target.value)} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Description</label>
                        <textarea className="form-input" rows={2} placeholder="Objectifs, ressources, contexte..." value={planDesc} onChange={e => setPlanDesc(e.target.value)} style={{ resize: 'vertical' }} />
                    </div>
                </div>

                {/* Phases */}
                <div className="space-y-4">
                    {phases.map((phase, phaseIdx) => (
                        <motion.div
                            key={phase.id}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="glass"
                            style={{ borderRadius: '20px', overflow: 'hidden' }}
                        >
                            {/* Phase Header */}
                            <div className="flex items-center gap-3 px-6 py-4 border-b" style={{ borderColor: 'var(--glass-border)' }}>
                                <GripVertical size={18} className="text-text-muted shrink-0" />
                                <span className="text-xs font-black text-primary uppercase tracking-widest shrink-0">Phase {phaseIdx + 1}</span>
                                <input
                                    className="flex-1 bg-transparent text-text font-bold text-base outline-none border-b border-transparent focus:border-primary transition-all placeholder:text-text-muted"
                                    placeholder="Titre de la phase..."
                                    value={phase.title}
                                    onChange={e => updatePhaseTitle(phase.id, e.target.value)}
                                />
                                <button onClick={() => togglePhaseCollapse(phase.id)} className="p-1.5 rounded-lg text-text-muted hover:text-text hover:bg-surface-hover transition-all icon-container">
                                    {phase.collapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
                                </button>
                                <button onClick={() => removePhase(phase.id)} className="p-1.5 rounded-lg text-text-muted hover:text-red-400 hover:bg-red-500/10 transition-all icon-container">
                                    <Trash2 size={16} />
                                </button>
                            </div>

                            {/* Tasks */}
                            <AnimatePresence>
                                {!phase.collapsed && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="p-6 space-y-4"
                                    >
                                        {phase.tasks.map((task, taskIdx) => (
                                            <div key={task.id} className="p-4 rounded-2xl border" style={{ background: 'var(--surface-hover)', borderColor: 'var(--glass-border)' }}>
                                                <div className="flex items-center gap-2 mb-3">
                                                    <span className="text-xs font-black text-text-muted">Tâche {taskIdx + 1}</span>
                                                    <div className="h-px flex-1" style={{ background: 'var(--glass-border)' }} />
                                                    <button onClick={() => removeTask(phase.id, task.id)} className="p-1 rounded-lg text-text-muted hover:text-red-400 hover:bg-red-500/10 transition-all icon-container">
                                                        <X size={14} />
                                                    </button>
                                                </div>

                                                <div className="grid grid-cols-1 gap-3">
                                                    <input
                                                        className="form-input text-sm"
                                                        placeholder="Titre de la tâche..."
                                                        value={task.title}
                                                        onChange={e => updateTask(phase.id, task.id, 'title', e.target.value)}
                                                    />
                                                    <textarea
                                                        className="form-input text-sm"
                                                        rows={2}
                                                        placeholder="Description, ressources, liens..."
                                                        value={task.description}
                                                        onChange={e => updateTask(phase.id, task.id, 'description', e.target.value)}
                                                        style={{ resize: 'vertical' }}
                                                    />

                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div>
                                                            <label className="form-label">Deadline</label>
                                                            <input
                                                                type="datetime-local"
                                                                className="form-input text-sm"
                                                                value={task.deadline}
                                                                onChange={e => updateTask(phase.id, task.id, 'deadline', e.target.value)}
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="form-label">Priorité</label>
                                                            <select
                                                                className="form-input text-sm"
                                                                value={task.priority}
                                                                onChange={e => updateTask(phase.id, task.id, 'priority', e.target.value)}
                                                            >
                                                                <option value="low">Faible</option>
                                                                <option value="medium">Moyen</option>
                                                                <option value="high">Élevé</option>
                                                                <option value="critical">Critique</option>
                                                            </select>
                                                        </div>
                                                    </div>

                                                    {/* Priority badge preview */}
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${PRIORITY_COLORS[task.priority]}`}>
                                                            <Flag size={10} className="inline mr-1" />{PRIORITY_LABELS[task.priority]}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        <button onClick={() => addTask(phase.id)} className="secondary w-full text-sm">
                                            <Plus size={16} /> Ajouter une Tâche
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    ))}

                    <button onClick={addPhase} className="secondary w-full">
                        <Plus size={18} /> Ajouter une Phase
                    </button>
                </div>
            </div>
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // RENDER: Monitor / Suivi
    // ─────────────────────────────────────────────────────────────────────────
    if (step === 'monitor' && monitorPlan && selectedApprenant) {
        const plan = plans.find(p => p.id === monitorPlan.id) || monitorPlan;
        const totalTasks = plan.phases.reduce((acc, p) => acc + p.tasks.length, 0);
        const completedTasks = plan.phases.reduce((acc, p) => acc + p.tasks.filter(t => t.status === 'completed').length, 0);
        const blockedTasks = plan.phases.reduce((acc, p) => acc + p.tasks.filter(t => t.status === 'blocked').length, 0);
        const lateTasks = plan.phases.reduce((acc, p) => acc + p.tasks.filter(t => t.deadline && new Date(t.deadline) < new Date() && t.status !== 'completed').length, 0);
        const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        let totalScore = 0;
        let scoredTasksCount = 0;
        plan.phases.forEach(p => {
            p.tasks.forEach(t => {
                if (t.score !== undefined && t.score !== null) {
                    totalScore += t.score;
                    scoredTasksCount++;
                }
            });
        });
        const averageScore = scoredTasksCount > 0 ? (totalScore / scoredTasksCount).toFixed(1) : '-';

        return (
            <div className="space-y-6 animate-fade-in pb-10">
                {/* Header */}
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                        <button onClick={() => { setStep('plan_list'); setMonitorPlan(null); }} className="secondary p-2 rounded-xl">
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-text">Suivi — {plan.title}</h1>
                            <p className="text-text-muted text-sm">{selectedApprenant.prenom} {selectedApprenant.nom}</p>
                        </div>
                    </div>
                    <button onClick={() => openEditPlan(plan)} className="secondary flex items-center gap-2">
                        <Edit3 size={16} /> Modifier le Plan
                    </button>
                </div>

                {/* Stats cards */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {[
                        { label: 'Progression', value: `${progress}%`, color: '#6366f1', icon: <BarChart2 size={20} /> },
                        { label: 'Complétées', value: completedTasks, color: '#10b981', icon: <CheckCircle2 size={20} /> },
                        { label: 'Bloquées', value: blockedTasks, color: '#ef4444', icon: <AlertTriangle size={20} /> },
                        { label: 'En retard', value: lateTasks, color: '#f59e0b', icon: <Clock size={20} /> },
                        { label: 'Moyenne /20', value: averageScore, color: '#ec4899', icon: <Target size={20} /> },
                    ].map(card => (
                        <motion.div
                            key={card.label}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="glass p-5 flex flex-col gap-3"
                            style={{ borderRadius: '16px' }}
                        >
                            <div className="p-2 rounded-xl w-fit" style={{ background: `${card.color}18`, color: card.color }}>
                                {card.icon}
                            </div>
                            <div>
                                <p className="text-text-muted text-xs font-bold uppercase tracking-wider">{card.label}</p>
                                <h3 className="text-2xl font-black mt-0.5" style={{ color: card.color }}>{card.value}</h3>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Overall progress bar */}
                <div className="glass p-6" style={{ borderRadius: '20px' }}>
                    <div className="flex justify-between text-sm font-bold mb-3">
                        <span className="text-text">Progression globale</span>
                        <span style={{ color: '#6366f1' }}>{progress}%</span>
                    </div>
                    <div className="h-3 rounded-full overflow-hidden" style={{ background: 'var(--surface-hover)' }}>
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 1.2, ease: 'easeOut' }}
                            className="h-full rounded-full"
                            style={{ background: 'linear-gradient(90deg, #6366f1, #ec4899)' }}
                        />
                    </div>
                    <div className="flex justify-between text-xs text-text-muted mt-2">
                        <span>{completedTasks}/{totalTasks} tâches complétées</span>
                        <span>Plan: {plan.title}</span>
                    </div>
                </div>

                {/* Phases & Tasks */}
                <div className="space-y-4">
                    {plan.phases.map((phase, phaseIdx) => (
                        <div key={phase.id} className="glass" style={{ borderRadius: '20px', overflow: 'hidden' }}>
                            <div className="flex items-center gap-3 px-6 py-4" style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                <span className="text-xs font-black text-primary uppercase tracking-widest">Phase {phaseIdx + 1}</span>
                                <span className="font-bold text-text">{phase.title}</span>
                                <div className="flex-1" />
                                <span className="text-xs text-text-muted">{phase.tasks.filter(t => t.status === 'completed').length}/{phase.tasks.length} tâches</span>
                            </div>
                            <div className="p-4 space-y-3">
                                {phase.tasks.map(task => {
                                    const isLate = !!(task.deadline && new Date(task.deadline) < new Date() && task.status !== 'completed');
                                    const effectiveStatus = isLate ? 'late' : task.status;
                                    const cfg = STATUS_CONFIG[effectiveStatus] || STATUS_CONFIG.not_started;
                                    return (
                                        <div
                                            key={task.id}
                                            className="p-4 rounded-2xl border"
                                            style={{ background: 'var(--surface-hover)', borderColor: effectiveStatus === 'blocked' ? '#ef444430' : effectiveStatus === 'late' ? '#f59e0b30' : 'var(--glass-border)' }}
                                        >
                                            <div className="flex items-start justify-between gap-3 flex-wrap">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                        <span className={cfg.color}>{cfg.icon}</span>
                                                        <h4 className="font-bold text-text text-sm">{task.title || '(Sans titre)'}</h4>
                                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${PRIORITY_COLORS[task.priority]}`}>
                                                            {PRIORITY_LABELS[task.priority]}
                                                        </span>
                                                        <span className={`text-xs font-bold ${cfg.color}`}>{cfg.label}</span>
                                                    </div>
                                                    {task.description && <p className="text-text-muted text-xs mb-2 line-clamp-2">{task.description}</p>}
                                                    <div className="flex items-center gap-4 text-xs text-text-muted flex-wrap">
                                                        {task.deadline && (
                                                            <span className={`flex items-center gap-1 ${isLate ? 'text-orange-400' : ''}`}>
                                                                <Calendar size={12} />
                                                                {new Date(task.deadline).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {task.blockedReason && (
                                                        <div className="mt-2 p-2 rounded-xl text-xs" style={{ background: '#ef444415', color: '#ef4444', border: '1px solid #ef444430' }}>
                                                            <AlertTriangle size={12} className="inline mr-1" />
                                                            {task.blockedReason}
                                                        </div>
                                                    )}
                                                    {task.comments && (
                                                        <div className="mt-2 p-2 rounded-xl text-xs text-text-muted" style={{ background: 'var(--surface)', border: '1px solid var(--glass-border)' }}>
                                                            💬 {task.comments}
                                                        </div>
                                                    )}
                                                    {task.feedback && (
                                                        <div className="mt-2 p-2 rounded-xl text-xs" style={{ background: '#6366f115', color: '#818cf8', border: '1px solid #6366f130' }}>
                                                            📝 Feedback: {task.feedback} {task.score !== undefined && `— Note: ${task.score}/20`}
                                                        </div>
                                                    )}
                                                    {task.deliverable && (
                                                        <div className="mt-2 p-2 rounded-xl text-xs" style={{ background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0' }}>
                                                            <Upload size={12} className="inline mr-1" />
                                                            <span className="font-bold">Livrable soumis : </span>
                                                            <a href={task.deliverable.startsWith('http') ? task.deliverable : `https://${task.deliverable}`} target="_blank" rel="noopener noreferrer" className="underline hover:text-emerald-800">
                                                                {task.deliverable}
                                                            </a>
                                                        </div>
                                                    )}
                                                    {task.alertMessage && (
                                                        <div className="mt-2 p-3 rounded-xl text-xs font-medium relative overflow-hidden" style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca' }}>
                                                            <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
                                                            <div className="flex items-start gap-2">
                                                                <AlertTriangle size={14} className="shrink-0 mt-0.5 text-red-600" />
                                                                <div>
                                                                    <span className="font-bold block mb-0.5 text-red-700">Alerte envoyée</span>
                                                                    {task.alertMessage}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex flex-col gap-2 shrink-0">
                                                    <button
                                                        onClick={() => openFeedback(plan.id, phase.id, task.id)}
                                                        className="secondary text-xs flex items-center gap-1.5 justify-center w-full min-w-[140px]"
                                                    >
                                                        <Edit3 size={13} /> {task.alertMessage ? 'Gérer Alerte / Note' : 'Évaluer / Alerter'}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Feedback Modal */}
                <AnimatePresence>
                    {feedbackModal && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="modal-overlay"
                        >
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                                className="modal-content"
                            >
                                <button onClick={() => setFeedbackModal(null)} className="modal-close">
                                    <X size={20} />
                                </button>
                                <h2 className="text-xl font-bold text-text mb-1">Feedback et Alertes</h2>
                                <p className="text-text-muted text-sm mb-6">Évaluez le travail ou envoyez une alerte urgente.</p>

                                <div className="form-group">
                                    <label className="form-label text-red-600 flex items-center gap-2"><AlertTriangle size={14}/> Alerte Urgente (Visible par l'apprenant)</label>
                                    <textarea className="form-input border-red-200 focus:border-red-500" style={{ background: alertText ? '#fef2f2' : '', color: alertText ? '#b91c1c' : '' }} rows={2} placeholder="Saisissez une alerte si l'apprenant est bloqué ou en retard..." value={alertText} onChange={e => setAlertText(e.target.value)} />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Feedback (Évaluation)</label>
                                    <textarea className="form-input" rows={4} placeholder="Commentaires, axes d'amélioration..." value={feedbackText} onChange={e => setFeedbackText(e.target.value)} />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Note (optionnel)</label>
                                    <input type="number" min="0" max="20" className="form-input" placeholder="Score /20" value={feedbackScore ?? ''} onChange={e => setFeedbackScore(e.target.value ? parseInt(e.target.value) : undefined)} />
                                </div>

                                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                    <label className="form-label">Décision</label>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => setFeedbackAction('approve')}
                                            className={`flex-1 ${feedbackAction === 'approve' ? 'primary' : 'secondary'}`}
                                        >
                                            <CheckCircle2 size={16} /> Approuver
                                        </button>
                                        <button
                                            onClick={() => setFeedbackAction('revision')}
                                            className={`flex-1 ${feedbackAction === 'revision' ? 'primary' : 'secondary'}`}
                                        >
                                            <Edit3 size={16} /> Révision
                                        </button>
                                    </div>
                                </div>

                                <button onClick={submitFeedback} className="primary w-full">
                                    <Save size={16} /> Soumettre le Feedback
                                </button>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    }

    return null;
};

export default EncadrementPage;
