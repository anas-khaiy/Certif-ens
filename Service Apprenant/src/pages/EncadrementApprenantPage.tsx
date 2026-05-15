import React, { useState, useEffect, useCallback } from 'react';
import {
    Calendar, Clock, Flag, CheckCircle2, Circle, PlayCircle,
    AlertTriangle, Upload, MessageSquare, ChevronDown, ChevronUp,
    Target, BarChart2, Loader2, X, Save, Layers,
    TrendingUp, Award, Edit3
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/api-client';

// ─── Types ────────────────────────────────────────────────────────────────────
type TaskStatus = 'not_started' | 'in_progress' | 'completed' | 'blocked' | 'late';
type Priority = 'low' | 'medium' | 'high' | 'critical';

interface Task {
    id: string | number;
    title: string;
    description: string;
    deadline: string;
    estimatedHours: number;
    priority: Priority;
    type: 'sequential' | 'parallel';
    status: TaskStatus;
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
    trainer?: {
        nom: string;
        prenom: string;
    };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const PRIORITY_COLORS: Record<string, string> = {
    low: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    medium: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    high: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    critical: 'bg-red-500/10 text-red-400 border-red-500/20',
};
const PRIORITY_LABELS: Record<string, string> = {
    low: 'Faible', medium: 'Moyen', high: 'Élevé', critical: 'Critique',
};

const STATUS_OPTIONS: { value: TaskStatus; label: string; icon: React.ReactNode; color: string }[] = [
    { value: 'not_started', label: 'Non commencé', icon: <Circle size={15} />, color: 'text-text-muted' },
    { value: 'in_progress', label: 'En cours', icon: <PlayCircle size={15} />, color: 'text-blue-400' },
    { value: 'completed', label: 'Complété', icon: <CheckCircle2 size={15} />, color: 'text-emerald-400' },
    { value: 'blocked', label: 'Bloqué 🚧', icon: <AlertTriangle size={15} />, color: 'text-red-400' },
    { value: 'late', label: 'En retard', icon: <Clock size={15} />, color: 'text-amber-400' },
];

const STATUS_BG: Record<TaskStatus, string> = {
    not_started: 'var(--surface-hover)',
    in_progress: 'rgba(59,130,246,0.08)',
    completed: 'rgba(16,185,129,0.08)',
    blocked: 'rgba(239,68,68,0.08)',
    late: 'rgba(245,158,11,0.08)',
};
const STATUS_BORDER: Record<TaskStatus, string> = {
    not_started: 'var(--glass-border)',
    in_progress: '#3b82f430',
    completed: '#10b98130',
    blocked: '#ef444430',
    late: '#f59e0b30',
};

function getDeadlineStatus(deadline: string, status: TaskStatus) {
    if (!deadline) return null;
    const now = new Date();
    const dl = new Date(deadline);
    const diffMs = dl.getTime() - now.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (status === 'completed') return { label: 'Complété ✓', color: 'text-emerald-400' };
    if (diffMs < 0) return { label: 'En retard !', color: 'text-red-400' };
    if (diffDays === 0) return { label: "Aujourd'hui !", color: 'text-orange-400' };
    if (diffDays <= 2) return { label: `Dans ${diffDays}j`, color: 'text-amber-400' };
    return { label: `Dans ${diffDays}j`, color: 'text-text-muted' };
}

// ─── Gantt Row ────────────────────────────────────────────────────────────────
const GanttRow = ({ task, startDate, totalDays }: { task: Task; startDate: Date; totalDays: number }) => {
    if (!task.deadline) return null;
    const end = new Date(task.deadline);
    const durationMs = task.estimatedHours * 3600 * 1000;
    const start = new Date(end.getTime() - durationMs);
    const totalMs = totalDays * 24 * 3600 * 1000;
    const left = Math.max(0, (start.getTime() - startDate.getTime()) / totalMs) * 100;
    const width = Math.max(2, Math.min(100 - left, (durationMs / totalMs) * 100));

    const barColor: Record<TaskStatus, string> = {
        completed: '#10b981',
        in_progress: '#3b82f6',
        blocked: '#ef4444',
        not_started: '#6366f1',
        late: '#f59e0b',
    };

    return (
        <tr>
            <td style={{ padding: '6px 12px', fontSize: '12px', color: 'var(--text-muted)', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {task.title || '(Sans titre)'}
            </td>
            <td style={{ padding: '6px 8px', position: 'relative' }}>
                <div style={{ position: 'relative', height: '22px', background: 'var(--surface-hover)', borderRadius: '6px', overflow: 'hidden' }}>
                    <div
                        style={{
                            position: 'absolute',
                            left: `${left}%`,
                            width: `${width}%`,
                            height: '100%',
                            background: barColor[task.status],
                            borderRadius: '6px',
                            opacity: 0.85,
                        }}
                        title={`${task.title} — ${task.status}`}
                    />
                </div>
            </td>
        </tr>
    );
};

// ─── TaskActionModal ──────────────────────────────────────────────────────────
interface TaskModalProps {
    task: Task;
    onClose: () => void;
    onSave: (updated: Partial<Task>) => void;
}

const TaskActionModal = ({ task, onClose, onSave }: TaskModalProps) => {
    const [status, setStatus] = useState<TaskStatus>(task.status);
    const [comments, setComments] = useState(task.comments || '');
    const [blockedReason, setBlockedReason] = useState(task.blockedReason || '');
    const [deliverable, setDeliverable] = useState(task.deliverable || '');
    const [deliverableError, setDeliverableError] = useState('');

    const handleSave = () => {
        if (deliverable) {
            const urlPattern = /^(https?:\/\/)?(www\.)?(github\.com|drive\.google\.com|docs\.google\.com)\/.*$/i;
            if (!urlPattern.test(deliverable)) {
                setDeliverableError("Seuls les liens GitHub ou Google Drive/Docs sont acceptés (lien complet requis).");
                return;
            }
        }
        setDeliverableError('');
        onSave({ status, comments, blockedReason: status === 'blocked' ? blockedReason : '', deliverable });
        onClose();
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-overlay"
        >
            <motion.div
                initial={{ scale: 0.9, y: 20, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.9, y: 20, opacity: 0 }}
                className="modal-content"
                style={{ maxWidth: '480px' }}
            >
                <button onClick={onClose} className="modal-close"><X size={20} /></button>

                <h2 className="text-xl font-bold text-text mb-1">{task.title || '(Sans titre)'}</h2>
                {task.description && <p className="text-text-muted text-sm mb-4">{task.description}</p>}

                <div className="flex items-center gap-4 flex-wrap mb-5 text-xs text-text-muted">
                    {task.deadline && (
                        <span className="flex items-center gap-1">
                            <Calendar size={12} />
                            {new Date(task.deadline).toLocaleString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                    )}
                    <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full border font-bold ${PRIORITY_COLORS[task.priority]}`}>
                        <Flag size={10} />{PRIORITY_LABELS[task.priority]}
                    </span>
                </div>

                {/* Status */}
                <div className="form-group">
                    <label className="form-label">Statut de la tâche</label>
                    <div className="grid grid-cols-2 gap-2">
                        {STATUS_OPTIONS.map(opt => (
                            <button
                                key={opt.value}
                                onClick={() => setStatus(opt.value)}
                                className={`flex items-center gap-2 p-3 rounded-xl border text-sm font-bold transition-all ${status === opt.value ? 'border-primary bg-primary/10 text-primary' : 'border-glass-border bg-surface-hover text-text-muted'}`}
                            >
                                <span className={opt.color}>{opt.icon}</span> {opt.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Blocked reason */}
                {status === 'blocked' && (
                    <div className="form-group animate-slide-down">
                        <label className="form-label">Pourquoi est-ce bloqué ?</label>
                        <textarea
                            value={blockedReason}
                            onChange={e => setBlockedReason(e.target.value)}
                            placeholder="Ex: J'attends le retour de mon tuteur..."
                            className="form-input min-h-[80px]"
                        />
                    </div>
                )}

                {/* Deliverable/Link */}
                <div className="form-group">
                    <label className="form-label">Livrable / Lien (Optionnel)</label>
                    <div className="relative">
                        <Upload size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
                        <input
                            type="text"
                            value={deliverable}
                            onChange={e => { setDeliverable(e.target.value); setDeliverableError(''); }}
                            placeholder="Lien vers votre travail (Github, GDrive...)"
                            className={`form-input pl-12 ${deliverableError ? 'border-error bg-error/5' : ''}`}
                        />
                    </div>
                    {deliverableError && <p className="text-error text-xs mt-1 animate-fade-in">{deliverableError}</p>}
                </div>

                {/* Comments */}
                <div className="form-group">
                    <label className="form-label">Observations</label>
                    <textarea
                        value={comments}
                        onChange={e => setComments(e.target.value)}
                        placeholder="Racontez votre progression..."
                        className="form-input min-h-[80px]"
                    />
                </div>

                <button onClick={handleSave} className="primary w-full">
                    <Save size={16} /> Enregistrer
                </button>
            </motion.div>
        </motion.div>
    );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const EncadrementApprenantPage = () => {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'timeline' | 'tasks' | 'gantt'>('tasks');
    const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
    const [collapsedPhases, setCollapsedPhases] = useState<Set<string | number>>(new Set());
    const [taskModal, setTaskModal] = useState<{ planId: string | number; phaseId: string | number; task: Task } | null>(null);

    const saveTask = async (planId: string | number, phaseId: string | number, taskId: string | number, updated: Partial<Task>) => {
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
                        return { ...task, ...updated };
                    })
                };
            })
        };

        try {
            await api.post('/encadrement/save', {
                ...updatedPlan,
                assignedAt: updatedPlan.assignedAt ? updatedPlan.assignedAt.split('.')[0] : null
            });
            const response = await api.get('/encadrement/mine');
            const dataArray = Array.isArray(response.data) ? response.data : [];
            setPlans(dataArray);
            if (selectedPlan?.id === planId) {
                setSelectedPlan(dataArray.find((p: any) => p.id === planId) || null);
            }
        } catch (err) {
            console.error("Error saving task progress:", err);
        }
    };

    const loadPlans = useCallback(async () => {
        try {
            const response = await api.get('/encadrement/mine');
            const dataArray = Array.isArray(response.data) ? response.data : [];
            setPlans(dataArray);
            if (dataArray.length > 0 && !selectedPlan) {
                setSelectedPlan(dataArray[0]);
            }
        } catch (err) {
            console.error("Error loading plans:", err);
        } finally {
            setLoading(false);
        }
    }, [selectedPlan]);

    useEffect(() => {
        loadPlans();
    }, []);

    const togglePhase = (phaseId: string | number) => {
        setCollapsedPhases(prev => {
            const next = new Set(prev);
            const found = Array.from(next).find(id => id.toString() === phaseId.toString());
            if (found !== undefined) {
                next.delete(found);
            } else {
                next.add(phaseId);
            }
            return next;
        });
    };

    // ── Computed stats ────────────────────────────────────────────────────────
    const computeStats = (plan: Plan) => {
        const allTasks = plan.phases.flatMap(p => p.tasks);
        const total = allTasks.length;
        const completed = allTasks.filter(t => t.status === 'completed').length;
        const blocked = allTasks.filter(t => t.status === 'blocked').length;
        const inProgress = allTasks.filter(t => t.status === 'in_progress').length;
        const late = allTasks.filter(t => t.deadline && new Date(t.deadline) < new Date() && t.status !== 'completed').length;
        const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
        
        let totalScore = 0;
        let scoredTasksCount = 0;
        allTasks.forEach(t => {
            if (t.score !== undefined && t.score !== null) {
                totalScore += t.score;
                scoredTasksCount++;
            }
        });
        const averageScore = scoredTasksCount > 0 ? (totalScore / scoredTasksCount).toFixed(1) : '-';

        return { total, completed, blocked, inProgress, late, progress, averageScore };
    };

    // ── Upcoming deadlines ────────────────────────────────────────────────────
    const getUpcoming = (plan: Plan) => {
        const allTasks = plan.phases.flatMap(p => p.tasks);
        return allTasks
            .filter(t => t.deadline && t.status !== 'completed')
            .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
            .slice(0, 5);
    };

    // ── Gantt chart data ──────────────────────────────────────────────────────
    const getGanttRange = (plan: Plan) => {
        const deadlines = plan.phases.flatMap(p => p.tasks).filter(t => t.deadline).map(t => new Date(t.deadline));
        if (deadlines.length === 0) return { startDate: new Date(), totalDays: 14 };
        const minDate = new Date(Math.min(...deadlines.map(d => d.getTime())));
        const maxDate = new Date(Math.max(...deadlines.map(d => d.getTime())));
        minDate.setDate(minDate.getDate() - 2);
        maxDate.setDate(maxDate.getDate() + 2);
        const totalDays = Math.max(7, Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)));
        return { startDate: minDate, totalDays };
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-10 h-10 animate-spin" style={{ color: 'var(--primary)' }} />
            </div>
        );
    }

    if (plans.length === 0) {
        return (
            <div className="space-y-6 animate-fade-in pb-10">
                <div>
                    <h1 className="text-3xl font-bold" style={{ background: 'linear-gradient(135deg, #6366f1, #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        Mon Encadrement
                    </h1>
                    <p className="text-text-muted mt-1">Plans de travail assignés par votre formateur.</p>
                </div>
                <div className="glass p-16 text-center" style={{ borderRadius: '24px' }}>
                    <Target size={60} className="mx-auto mb-4 opacity-20" style={{ color: 'var(--text-muted)' }} />
                    <h3 className="text-xl font-bold text-text">Aucun plan assigné</h3>
                    <p className="text-text-muted text-sm mt-2">Votre formateur n'a pas encore assigné de plan d'encadrement.</p>
                </div>
            </div>
        );
    }

    const plan = selectedPlan || plans[0];
    const stats = computeStats(plan);
    const upcoming = getUpcoming(plan);
    const { startDate, totalDays } = getGanttRange(plan);

    return (
        <div className="space-y-6 animate-fade-in pb-10">
            {/* Page Header */}
            <div>
                <h1 className="text-3xl font-bold" style={{ background: 'linear-gradient(135deg, #6366f1, #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    Mon Encadrement
                </h1>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mt-1">
                    <p className="text-text-muted">Suivez vos tâches et progressez étape par étape.</p>
                    {plan.trainer && (
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-primary/5 border border-primary/10 w-fit">
                            <Edit3 size={14} className="text-primary" />
                            <span className="text-xs font-bold text-text-muted">Encadrant : <span className="text-primary">{plan.trainer.prenom} {plan.trainer.nom}</span></span>
                        </div>
                    )}
                </div>
            </div>

            {/* Plan selector (if multiple) */}
            {plans.length > 1 && (
                <div className="flex gap-2 flex-wrap">
                    {plans.map(p => (
                        <button
                            key={p.id}
                            onClick={() => setSelectedPlan(p)}
                            className={`text-sm font-bold px-4 py-2 rounded-xl border transition-all ${selectedPlan?.id === p.id ? 'border-primary bg-primary/10 text-primary' : 'border-glass-border bg-surface text-text-muted hover:border-primary'}`}
                        >
                            {p.title}
                        </button>
                    ))}
                </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {[
                    { label: 'Progression', value: `${stats.progress}%`, color: '#6366f1', icon: <TrendingUp size={18} /> },
                    { label: 'Complétées', value: stats.completed, color: '#10b981', icon: <Award size={18} /> },
                    { label: 'En cours', value: stats.inProgress, color: '#3b82f6', icon: <PlayCircle size={18} /> },
                    { label: 'Bloquées', value: stats.blocked, color: '#ef4444', icon: <AlertTriangle size={18} /> },
                    { label: 'En retard', value: stats.late, color: '#f59e0b', icon: <Clock size={18} /> },
                    { label: 'Moyenne /20', value: stats.averageScore, color: '#ec4899', icon: <Target size={18} /> },
                ].map(card => (
                    <motion.div
                        key={card.label}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="glass p-4 flex flex-col gap-2"
                        style={{ borderRadius: '16px' }}
                    >
                        <div style={{ color: card.color }}>{card.icon}</div>
                        <p className="text-text-muted text-xs font-bold uppercase tracking-wider">{card.label}</p>
                        <p className="text-2xl font-black" style={{ color: card.color }}>{card.value}</p>
                    </motion.div>
                ))}
            </div>

            {/* Overall progress */}
            <div className="glass p-5" style={{ borderRadius: '20px' }}>
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-3">
                    <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-text font-bold text-xl">{plan.title}</span>
                        {plan.trainer ? (
                            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 animate-fade-in">
                                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                <span className="text-xs font-bold text-primary uppercase tracking-wider">
                                    Encadrant : {plan.trainer.prenom} {plan.trainer.nom}
                                </span>
                            </div>
                        ) : (
                            <span className="text-[10px] text-text-muted italic uppercase tracking-widest opacity-40">
                                (Aucun encadrant assigné)
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                        <div className="text-right hidden sm:block">
                            <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">Progression globale</p>
                            <p className="text-lg font-black" style={{ color: '#6366f1' }}>{stats.progress}%</p>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 font-black text-xs">
                            {stats.progress}%
                        </div>
                    </div>
                </div>
                <div className="h-3 rounded-full overflow-hidden" style={{ background: 'var(--surface-hover)' }}>
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${stats.progress}%` }}
                        transition={{ duration: 1.2, ease: 'easeOut' }}
                        className="h-full rounded-full"
                        style={{ background: 'linear-gradient(90deg, #6366f1, #ec4899)' }}
                    />
                </div>
                <p className="text-xs text-text-muted mt-2">{stats.completed}/{stats.total} tâches complétées</p>
            </div>

            {/* Upcoming deadlines banner */}
            {upcoming.length > 0 && (
                <div className="glass p-4 rounded-2xl border" style={{ borderColor: upcoming.some(t => new Date(t.deadline) < new Date()) ? '#f59e0b40' : '#6366f130' }}>
                    <h3 className="text-sm font-black uppercase tracking-widest mb-3 flex items-center gap-2" style={{ color: '#f59e0b' }}>
                        <Clock size={14} /> Prochaines Échéances
                    </h3>
                    <div className="space-y-2">
                        {upcoming.map(task => {
                            const dl = getDeadlineStatus(task.deadline, task.status);
                            return (
                                <div key={task.id} className="flex items-center justify-between gap-2 flex-wrap">
                                    <span className="text-sm text-text font-medium truncate">{task.title}</span>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <span className="text-xs text-text-muted">
                                            {new Date(task.deadline).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                        {dl && <span className={`text-xs font-bold ${dl.color}`}>{dl.label}</span>}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div className="flex gap-2 flex-wrap">
                {([
                    { key: 'tasks', label: 'Tâches', icon: <Target size={15} /> },
                    { key: 'timeline', label: 'Calendrier', icon: <Calendar size={15} /> },
                    { key: 'gantt', label: 'Gantt', icon: <BarChart2 size={15} /> },
                ] as const).map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`flex items-center gap-2 text-sm font-bold px-4 py-2.5 rounded-xl border transition-all ${activeTab === tab.key ? 'border-primary bg-primary/10 text-primary' : 'border-glass-border bg-surface text-text-muted hover:border-primary'}`}
                    >
                        {tab.icon} {tab.label}
                    </button>
                ))}
            </div>

            {/* ── TAB: Tasks ──────────────────────────────────────────────── */}
            {activeTab === 'tasks' && (
                <div className="space-y-4">
                    {plan.phases.map((phase, phaseIdx) => {
                        const isCollapsed = collapsedPhases.has(phase.id);
                        const phaseDone = phase.tasks.filter(t => t.status === 'completed').length;
                        const phaseTotal = phase.tasks.length;
                        const phaseProgress = phaseTotal > 0 ? Math.round((phaseDone / phaseTotal) * 100) : 0;

                        return (
                            <div key={phase.id} className="glass" style={{ borderRadius: '20px', overflow: 'hidden' }}>
                                <button
                                    onClick={() => togglePhase(phase.id)}
                                    className="w-full flex items-center gap-3 px-6 py-4 text-left transition-all hover:bg-surface-hover"
                                    style={{ borderBottom: isCollapsed ? 'none' : '1px solid var(--glass-border)' }}
                                >
                                    <span className="text-xs font-black uppercase tracking-widest shrink-0" style={{ color: 'var(--primary)' }}>Phase {phaseIdx + 1}</span>
                                    <span className="font-bold text-text flex-1">{phase.title}</span>
                                    <div className="flex items-center gap-3 shrink-0">
                                        <div className="flex items-center gap-2">
                                            <div className="w-20 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--surface-hover)' }}>
                                                <div className="h-full rounded-full" style={{ width: `${phaseProgress}%`, background: 'linear-gradient(90deg,#6366f1,#ec4899)', transition: 'width 0.8s ease' }} />
                                            </div>
                                            <span className="text-xs font-bold" style={{ color: '#6366f1' }}>{phaseProgress}%</span>
                                        </div>
                                        <span className="text-xs text-text-muted">{phaseDone}/{phaseTotal}</span>
                                        {isCollapsed ? <ChevronDown size={16} className="text-text-muted" /> : <ChevronUp size={16} className="text-text-muted" />}
                                    </div>
                                </button>

                                <AnimatePresence>
                                    {!isCollapsed && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="p-4 space-y-3"
                                        >
                                            {phase.tasks.map(task => {
                                                const isLate = !!(task.deadline && new Date(task.deadline) < new Date() && task.status !== 'completed');
                                                const effectiveStatus: TaskStatus = isLate ? 'blocked' : task.status;
                                                const dl = getDeadlineStatus(task.deadline, task.status);
                                                const statusOpt = STATUS_OPTIONS.find(s => s.value === task.status)!;

                                                return (
                                                    <motion.div
                                                        key={task.id}
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        className="p-4 rounded-2xl border transition-all"
                                                        style={{
                                                            background: STATUS_BG[effectiveStatus],
                                                            borderColor: isLate ? '#f59e0b40' : STATUS_BORDER[effectiveStatus],
                                                        }}
                                                    >
                                                        <div className="flex items-start justify-between gap-3 flex-wrap">
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                                                    <span className={`${statusOpt?.color}`}>{statusOpt?.icon}</span>
                                                                    <h4 className="font-bold text-text text-sm">{task.title || '(Sans titre)'}</h4>
                                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${PRIORITY_COLORS[task.priority]}`}>
                                                                        <Flag size={8} className="inline mr-0.5" />{PRIORITY_LABELS[task.priority]}
                                                                    </span>
                                                                    {isLate && <span className="text-[10px] font-black text-orange-400 px-2 py-0.5 rounded-full bg-orange-400/10 border border-orange-400/20">⏰ En retard</span>}
                                                                </div>
                                                                {task.description && (
                                                                    <p className="text-text-muted text-xs mb-2 line-clamp-2">{task.description}</p>
                                                                )}
                                                                <div className="flex items-center gap-3 flex-wrap text-xs text-text-muted">
                                                                    {task.deadline && (
                                                                        <span className={`flex items-center gap-1 ${dl?.color}`}>
                                                                            <Calendar size={11} />
                                                                            {new Date(task.deadline).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                                                            {dl && <span className="font-bold">&nbsp;({dl.label})</span>}
                                                                        </span>
                                                                    )}
                                                                    <span className="flex items-center gap-1">
                                                                        {task.type === 'sequential' ? '→ Séq.' : '⇉ Para.'}
                                                                    </span>
                                                                </div>

                                                                {task.blockedReason && (
                                                                    <div className="mt-2 p-2 rounded-xl text-xs" style={{ background: '#ef444415', color: '#ef4444', border: '1px solid #ef444430' }}>
                                                                        🚧 {task.blockedReason}
                                                                    </div>
                                                                )}
                                                                {task.comments && (
                                                                    <div className="mt-2 p-2 rounded-xl text-xs text-text-muted" style={{ background: 'var(--surface)', border: '1px solid var(--glass-border)' }}>
                                                                        <MessageSquare size={11} className="inline mr-1" />{task.comments}
                                                                    </div>
                                                                )}
                                                                {task.deliverable && (
                                                                    <div className="mt-2 p-2 rounded-xl text-xs text-text-muted" style={{ background: 'var(--surface)', border: '1px solid var(--glass-border)' }}>
                                                                        <Upload size={11} className="inline mr-1" />{task.deliverable}
                                                                    </div>
                                                                )}
                                                                {task.feedback && (
                                                                    <div className="mt-2 p-2 rounded-xl text-xs" style={{ background: '#6366f112', color: '#818cf8', border: '1px solid #6366f130' }}>
                                                                        📝 Feedback: {task.feedback}
                                                                        {task.score !== undefined && <span className="ml-1 font-black"> — Note: {task.score}/20</span>}
                                                                    </div>
                                                                )}
                                                                {task.alertMessage && (
                                                                    <div className="mt-2 p-3 rounded-xl text-xs font-medium relative overflow-hidden" style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca' }}>
                                                                        <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
                                                                        <div className="flex items-start gap-2">
                                                                            <AlertTriangle size={14} className="shrink-0 mt-0.5 text-red-600" />
                                                                            <div>
                                                                                <span className="font-bold block mb-0.5 text-red-700">Alerte du Formateur</span>
                                                                                {task.alertMessage}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {task.status !== 'completed' && (
                                                                <button
                                                                    onClick={() => setTaskModal({ planId: plan.id, phaseId: phase.id, task })}
                                                                    className="secondary text-xs flex items-center gap-1.5 shrink-0"
                                                                >
                                                                    <Edit3 size={13} /> Mettre à jour
                                                                </button>
                                                            )}
                                                        </div>
                                                    </motion.div>
                                                );
                                            })}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ── TAB: Calendar / Timeline ────────────────────────────────── */}
            {activeTab === 'timeline' && (
                <div className="glass p-6" style={{ borderRadius: '20px' }}>
                    <h3 className="text-base font-bold text-text mb-4 flex items-center gap-2">
                        <Calendar size={18} style={{ color: 'var(--primary)' }} /> Vue Calendrier par Phase
                    </h3>
                    {plan.phases.map((phase, phaseIdx) => (
                        <div key={phase.id} className="mb-6">
                            <div className="flex items-center gap-2 mb-3">
                                <span className="text-xs font-black uppercase tracking-widest" style={{ color: 'var(--primary)' }}>Phase {phaseIdx + 1}</span>
                                <span className="font-bold text-text">{phase.title}</span>
                            </div>
                            <div className="space-y-2 ml-4">
                                {[...phase.tasks]
                                    .filter(t => t.deadline)
                                    .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
                                    .map(task => {
                                        const dl = getDeadlineStatus(task.deadline, task.status);
                                        const statusOpt = STATUS_OPTIONS.find(s => s.value === task.status)!;
                                        return (
                                            <div key={task.id} className="flex items-center gap-3 p-3 rounded-xl border" style={{ borderColor: 'var(--glass-border)', background: 'var(--surface-hover)' }}>
                                                <div className="flex flex-col items-center shrink-0 w-14 text-center">
                                                    <span className="text-xs font-black text-text">
                                                        {new Date(task.deadline).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                                                    </span>
                                                    <span className="text-[10px] text-text-muted">
                                                        {new Date(task.deadline).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                                <div className="w-px h-8 shrink-0" style={{ background: 'var(--glass-border)' }} />
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className={statusOpt?.color}>{statusOpt?.icon}</span>
                                                        <span className="text-sm font-bold text-text truncate">{task.title}</span>
                                                    </div>
                                                </div>
                                                {dl && <span className={`text-xs font-bold shrink-0 ${dl.color}`}>{dl.label}</span>}
                                            </div>
                                        );
                                    })}
                                {phase.tasks.filter(t => t.deadline).length === 0 && (
                                    <p className="text-xs text-text-muted ml-2">Aucune deadline définie dans cette phase.</p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ── TAB: Gantt ──────────────────────────────────────────────── */}
            {activeTab === 'gantt' && (
                <div className="glass p-6" style={{ borderRadius: '20px' }}>
                    <h3 className="text-base font-bold text-text mb-4 flex items-center gap-2">
                        <Layers size={18} style={{ color: 'var(--primary)' }} /> Diagramme de Gantt
                    </h3>

                    {/* Legend */}
                    <div className="flex items-center gap-4 mb-4 flex-wrap text-xs text-text-muted">
                        {[
                            { color: '#6366f1', label: 'Non commencé' },
                            { color: '#3b82f6', label: 'En cours' },
                            { color: '#10b981', label: 'Complété' },
                            { color: '#ef4444', label: 'Bloqué' },
                        ].map(leg => (
                            <span key={leg.label} className="flex items-center gap-1.5">
                                <span className="w-3 h-3 rounded-sm" style={{ background: leg.color }} />
                                {leg.label}
                            </span>
                        ))}
                    </div>

                    <div className="overflow-x-auto">
                        {plan.phases.map((phase, phaseIdx) => (
                            <div key={phase.id} className="mb-5">
                                <div className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: 'var(--primary)' }}>
                                    Phase {phaseIdx + 1} — {phase.title}
                                </div>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <colgroup>
                                        <col style={{ width: '170px' }} />
                                        <col style={{ width: 'auto' }} />
                                    </colgroup>
                                    <tbody>
                                        {phase.tasks.filter(t => t.deadline).map(task => (
                                            <GanttRow key={task.id} task={task} startDate={startDate} totalDays={totalDays} />
                                        ))}
                                        {phase.tasks.filter(t => t.deadline).length === 0 && (
                                            <tr>
                                                <td colSpan={2} style={{ padding: '8px 12px', fontSize: '12px', color: 'var(--text-muted)' }}>
                                                    Aucune deadline définie.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        ))}
                    </div>

                    {/* Time ruler labels */}
                    <div className="mt-4 pt-3" style={{ borderTop: '1px solid var(--glass-border)' }}>
                        <div className="flex justify-between text-[10px] text-text-muted">
                            <span>{startDate.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}</span>
                            <span>
                                {new Date(startDate.getTime() + (totalDays / 2) * 24 * 3600 * 1000).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                            </span>
                            <span>
                                {new Date(startDate.getTime() + totalDays * 24 * 3600 * 1000).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* Task Action Modal */}
            <AnimatePresence>
                {taskModal && (
                    <TaskActionModal
                        task={taskModal.task}
                        onClose={() => setTaskModal(null)}
                        onSave={(updated) => saveTask(taskModal.planId, taskModal.phaseId, taskModal.task.id, updated)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default EncadrementApprenantPage;
