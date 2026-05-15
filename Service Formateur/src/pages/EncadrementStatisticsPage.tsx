import React, { useState, useEffect } from 'react';
import {
    Target, BarChart2, CheckCircle2, Clock, 
    AlertTriangle, Loader2, ArrowLeft, TrendingUp, Users, TrendingDown,
    Activity
} from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../api/api-client';
import { useNavigate } from 'react-router';

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
    status: 'not_started' | 'in_progress' | 'completed' | 'blocked' | 'late';
    deadline?: string;
}

interface Phase {
    id: string | number;
    title: string;
    tasks: Task[];
}

interface Plan {
    id: string | number;
    title: string;
    apprenantId: number;
    phases: Phase[];
    overallProgress: number;
}

const EncadrementStatisticsPage = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [plans, setPlans] = useState<Plan[]>([]);
    const [apprenants, setApprenants] = useState<Apprenant[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch plans
                const plansRes = await api.get('/encadrement/trainer');
                const fetchedPlans = Array.isArray(plansRes.data) ? plansRes.data : [];
                setPlans(fetchedPlans);

                // Fetch Apprenants
                const statsRes = await api.get('/dashboard/learner-statistics');
                const rawApprenants = statsRes.data || [];
                
                // Fetch enrollments to get specialite (optional, mainly for display)
                let specialiteMap: Record<string, string> = {};
                try {
                    const enrollResp = await api.get('/enrollments');
                    enrollResp.data.forEach((e: any) => {
                        if (e.apprenant && e.apprenant.email && e.apprenant.specialite) {
                            specialiteMap[e.apprenant.email] = e.apprenant.specialite.nom || e.apprenant.specialite;
                        }
                    });
                } catch { /* ignore */ }

                const mappedApprenants = rawApprenants.map((a: any) => ({
                    id: a.id,
                    nom: (a.name || '').split(' ').slice(1).join(' ') || a.name,
                    prenom: (a.name || '').split(' ')[0] || '',
                    email: a.email || '',
                    photoProfile: a.photoProfile,
                    specialite: specialiteMap[a.email] || a.specialite?.nom || a.specialite || '',
                }));
                setApprenants(mappedApprenants);

            } catch (err) {
                console.error("Erreur lors de la récupération des statistiques:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Statistics Calculations
    const totalPlans = plans.length;
    let avgProgress = 0;
    let totalTasks = 0;
    let completedTasks = 0;
    let blockedTasks = 0;
    let lateTasks = 0;
    let inProgressTasks = 0;

    // Build Learner map for performance
    const learnerStats: Record<number, { total: number; completed: number; blocked: number; late: number }> = {};

    plans.forEach(plan => {
        avgProgress += plan.overallProgress;
        
        if (!learnerStats[plan.apprenantId]) {
            learnerStats[plan.apprenantId] = { total: 0, completed: 0, blocked: 0, late: 0 };
        }

        plan.phases.forEach(phase => {
            phase.tasks.forEach(task => {
                totalTasks++;
                learnerStats[plan.apprenantId].total++;
                
                const isLate = !!(task.deadline && new Date(task.deadline) < new Date() && task.status !== 'completed');
                const effectiveStatus = isLate ? 'late' : task.status;

                if (effectiveStatus === 'completed') {
                    completedTasks++;
                    learnerStats[plan.apprenantId].completed++;
                } else if (effectiveStatus === 'blocked') {
                    blockedTasks++;
                    learnerStats[plan.apprenantId].blocked++;
                } else if (effectiveStatus === 'late') {
                    lateTasks++;
                    learnerStats[plan.apprenantId].late++;
                } else if (task.status === 'in_progress') {
                    inProgressTasks++;
                }
            });
        });
    });

    if (totalPlans > 0) {
        avgProgress = Math.round(avgProgress / totalPlans);
    }

    // Identité des apprenants
    const getApprenant = (id: number) => apprenants.find(a => a.id === id);

    // Calcul des tops et flops
    const learnersWithRates = Object.keys(learnerStats).map(idStr => {
        const id = parseInt(idStr);
        const st = learnerStats[id];
        return {
            id,
            compRate: st.total > 0 ? (st.completed / st.total) * 100 : 0,
            issuesCount: st.blocked + st.late,
            ...st
        };
    });

    // Top performers (higher compRate, fewer issues)
    const topPerformers = [...learnersWithRates].sort((a, b) => b.compRate - a.compRate).slice(0, 3);
    
    // Strugglers (highest issues Count)
    const strugglers = [...learnersWithRates].filter(l => l.issuesCount > 0).sort((a, b) => b.issuesCount - a.issuesCount).slice(0, 3);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in pb-12">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/encadrement')} className="secondary p-2 rounded-xl">
                        <ArrowLeft size={20} />
                    </button>
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center font-black text-primary border border-primary/10 shrink-0">
                        <BarChart2 size={24} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-text bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                            Statistiques d'Encadrement
                        </h1>
                        <p className="text-text-muted mt-1 font-medium">Analyse globale des plans d'action et progression des apprenants.</p>
                    </div>
                </div>
            </div>

            {/* Global KPIs Container */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Plans Actifs', value: totalPlans, icon: <Target size={24} />, color: '#8b5cf6', bgColor: 'rgba(139, 92, 246, 0.1)' },
                    { label: 'Progression Moyenne', value: `${avgProgress}%`, icon: <Activity size={24} />, color: '#06b6d4', bgColor: 'rgba(6, 182, 212, 0.1)' },
                    { label: 'Tâches Complétées', value: completedTasks, icon: <CheckCircle2 size={24} />, color: '#10b981', bgColor: 'rgba(16, 185, 129, 0.1)' },
                    { label: 'Alertes (Bloquées / Retard)', value: blockedTasks + lateTasks, icon: <AlertTriangle size={24} />, color: '#ef4444', bgColor: 'rgba(239, 68, 68, 0.1)' }
                ].map((kpi, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="glass p-6 flex flex-col justify-between relative overflow-hidden"
                        style={{ borderRadius: '24px' }}
                    >
                        <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full blur-2xl opacity-20" style={{ background: kpi.color }} />
                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <div className="p-3 rounded-2xl" style={{ backgroundColor: kpi.bgColor, color: kpi.color }}>
                                {kpi.icon}
                            </div>
                        </div>
                        <div className="relative z-10">
                            <h3 className="text-3xl font-black text-text mb-1">{kpi.value}</h3>
                            <p className="text-xs font-bold text-text-muted uppercase tracking-wider">{kpi.label}</p>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Task Breakdown Pipeline */}
            <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="glass p-8"
                style={{ borderRadius: '24px' }}
            >
                <div className="flex items-center gap-3 mb-6">
                    <Layers size={20} className="text-primary" />
                    <h2 className="text-xl font-bold text-text">Répartition globale des tâches</h2>
                </div>
                
                {totalTasks === 0 ? (
                    <div className="text-center py-6 text-text-muted">Aucune tâche trouvée dans les plans actuels.</div>
                ) : (
                    <div className="space-y-6">
                        <div className="h-4 rounded-full overflow-hidden flex" style={{ background: 'var(--surface-hover)' }}>
                            <motion.div
                                initial={{ flexGrow: 0 }}
                                animate={{ flexGrow: completedTasks / totalTasks }}
                                className="bg-emerald-400 h-full"
                                title={`Complétées : ${completedTasks}`}
                            />
                            <motion.div
                                initial={{ flexGrow: 0 }}
                                animate={{ flexGrow: inProgressTasks / totalTasks }}
                                className="bg-blue-400 h-full"
                                title={`En cours : ${inProgressTasks}`}
                            />
                            <motion.div
                                initial={{ flexGrow: 0 }}
                                animate={{ flexGrow: lateTasks / totalTasks }}
                                className="bg-orange-400 h-full"
                                title={`En retard : ${lateTasks}`}
                            />
                            <motion.div
                                initial={{ flexGrow: 0 }}
                                animate={{ flexGrow: blockedTasks / totalTasks }}
                                className="bg-red-400 h-full"
                                title={`Bloquées : ${blockedTasks}`}
                            />
                            <motion.div
                                initial={{ flexGrow: 0 }}
                                animate={{ flexGrow: (totalTasks - completedTasks - inProgressTasks - lateTasks - blockedTasks) / totalTasks }}
                                className="bg-gray-400/30 h-full"
                            />
                        </div>
                        <div className="flex flex-wrap gap-4 items-center justify-between text-xs font-bold">
                            <span className="flex items-center gap-2 text-text"><div className="w-3 h-3 rounded-full bg-emerald-400" />Complétées ({completedTasks})</span>
                            <span className="flex items-center gap-2 text-text"><div className="w-3 h-3 rounded-full bg-blue-400" />En cours ({inProgressTasks})</span>
                            <span className="flex items-center gap-2 text-text"><div className="w-3 h-3 rounded-full bg-orange-400" />En retard ({lateTasks})</span>
                            <span className="flex items-center gap-2 text-text"><div className="w-3 h-3 rounded-full bg-red-400" />Bloquées ({blockedTasks})</span>
                            <span className="flex items-center gap-2 text-text"><div className="w-3 h-3 rounded-full bg-gray-400/30" />À venir</span>
                        </div>
                    </div>
                )}
            </motion.div>

            {/* Learner Insights Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Performers */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className="glass p-6"
                    style={{ borderRadius: '24px' }}
                >
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
                            <TrendingUp size={20} />
                        </div>
                        <h2 className="text-lg font-bold text-text">Apprenants Performants</h2>
                    </div>
                    {topPerformers.length === 0 ? (
                        <p className="text-sm text-text-muted text-center py-4">Pas de données suffisantes.</p>
                    ) : (
                        <div className="space-y-4">
                            {topPerformers.map((learner, idx) => {
                                const app = getApprenant(learner.id);
                                if (!app) return null;
                                return (
                                    <div key={learner.id} className="flex items-center gap-4 p-4 rounded-2xl bg-surface-hover/50 border border-glass-border">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400/20 to-primary/20 flex items-center justify-center font-black text-emerald-500 shrink-0 border border-emerald-500/20">
                                            #{idx + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-bold text-text truncate">{app.prenom} {app.nom}</h4>
                                            <p className="text-xs text-emerald-400">{Math.round(learner.compRate)}% du plan complété</p>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="text-sm font-black text-text">{learner.completed} <span className="text-xs text-text-muted font-normal">tâches</span></p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </motion.div>

                {/* Struggling Learners */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                    className="glass p-6"
                    style={{ borderRadius: '24px' }}
                >
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 rounded-xl bg-red-500/10 text-red-500">
                            <TrendingDown size={20} />
                        </div>
                        <h2 className="text-lg font-bold text-text">Tâches Critiques (Alertes)</h2>
                    </div>
                    {strugglers.length === 0 ? (
                        <p className="text-sm text-text-muted text-center py-4">Aucune alerte pour l'instant ! 🎉</p>
                    ) : (
                        <div className="space-y-4">
                            {strugglers.map((learner) => {
                                const app = getApprenant(learner.id);
                                if (!app) return null;
                                return (
                                    <div key={learner.id} className="flex items-center gap-4 p-4 rounded-2xl bg-surface-hover/50 border border-red-500/10">
                                        <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500 shrink-0 border border-red-500/20">
                                            <AlertTriangle size={18} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-bold text-text truncate">{app.prenom} {app.nom}</h4>
                                            <div className="flex items-center gap-2 mt-1">
                                                {learner.blocked > 0 && <span className="text-[10px] px-2 py-0.5 rounded-md bg-red-500/10 text-red-500 font-bold">{learner.blocked} bloquées</span>}
                                                {learner.late > 0 && <span className="text-[10px] px-2 py-0.5 rounded-md bg-orange-500/10 text-orange-500 font-bold">{learner.late} en retard</span>}
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
};

// Quick polyfill for missing icon import directly inside file block to avoid rewriting everything. 
const Layers = ({ size, className }: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 12 12 17 22 12"></polyline><polyline points="2 17 12 22 22 17"></polyline></svg>
);

export default EncadrementStatisticsPage;
