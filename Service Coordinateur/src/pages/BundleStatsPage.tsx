import {
    Award,
    Clock,
    TrendingUp,
    FileText,
    ChevronLeft,
    ChevronRight,
    Briefcase,
    Users
} from 'lucide-react';
import { useState, useEffect } from 'react';
import {
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend,
    LineChart,
    Line
} from 'recharts';
import api from '../api/api-client';

const BundleStatsPage = () => {
    const [data, setData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedBundle, setSelectedBundle] = useState('All');
    const itemsPerPage = 5;

    const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await api.get('/stats/bundles');
                setData(response.data);
            } catch (error) {
                console.error("Failed to fetch bundle stats", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (isLoading) {
        return (
            <div className="h-[60vh] flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    const monthlyData = data?.monthlyData || [];
    const distributionData = data?.distributionData || [];
    const recentEnrollments = data?.recentEnrollments || [];

    const allBundles = Array.from(new Set(recentEnrollments.map((item: any) => item.bundleTitle)));
    const filteredEnrollments = selectedBundle === 'All' 
        ? recentEnrollments 
        : recentEnrollments.filter((item: any) => item.bundleTitle === selectedBundle);

    // Pagination Logic
    const totalPages = Math.ceil(filteredEnrollments.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentItems = filteredEnrollments.slice(startIndex, endIndex);

    const getPages = () => {
        const pages: (number | string)[] = [];
        const showMax = 7;
        if (totalPages <= showMax) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            pages.push(1);
            if (currentPage > 3) pages.push('...');
            const start = Math.max(2, currentPage - 1);
            const end = Math.min(totalPages - 1, currentPage + 1);
            for (let i = start; i <= end; i++) {
                if (!pages.includes(i)) pages.push(i);
            }
            if (currentPage < totalPages - 2) pages.push('...');
            if (!pages.includes(totalPages)) pages.push(totalPages);
        }
        return pages;
    };

    return (
        <div className="space-y-8 animate-fade-in pb-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold">Statistiques des Parcours</h2>
                    <p className="text-text-muted">Aperçu global de l'engagement et de la complétion des bundles.</p>
                </div>
                <div className="p-3 bg-primary/10 text-primary rounded-xl">
                    <Briefcase size={24} />
                </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="glass p-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-primary/10 text-primary">
                            <Briefcase size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-text-muted">Total Parcours</p>
                            <h3 className="text-2xl font-bold">{data?.totalBundles || 0}</h3>
                        </div>
                    </div>
                </div>
                <div className="glass p-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-success/10 text-success">
                            <Users size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-text-muted">Inscriptions</p>
                            <h3 className="text-2xl font-bold">{data?.totalEnrollments || 0}</h3>
                        </div>
                    </div>
                </div>
                <div className="glass p-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-indigo/10 text-indigo-500">
                            <Award size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-text-muted">Certifiés</p>
                            <h3 className="text-2xl font-bold">{data?.totalCompletions || 0}</h3>
                        </div>
                    </div>
                </div>
                <div className="glass p-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-warning/10 text-warning">
                            <TrendingUp size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-text-muted">Progression Moy.</p>
                            <h3 className="text-2xl font-bold">{data?.avgProgress || 0}%</h3>
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" style={{ marginTop: 30 }}>
                {/* Evolution Mensuelle */}
                <div className="glass p-6">
                    <h4 className="text-lg font-semibold mb-6 flex items-center gap-2">
                        <TrendingUp size={20} className="text-primary" />
                        Flux des Inscriptions & Certifications
                    </h4>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={monthlyData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Line type="monotone" dataKey="enrollments" stroke="#6366f1" strokeWidth={3} dot={{ r: 4, fill: '#6366f1' }} name="Inscriptions" />
                                <Line type="monotone" dataKey="completions" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981' }} name="Certifications" />
                                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Distribution par Spécialité */}
                <div className="glass p-6">
                    <h4 className="text-lg font-semibold mb-6 flex items-center gap-2">
                        <FileText size={20} className="text-secondary" />
                        Répartition par Spécialité
                    </h4>
                    <div className="h-80 relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={distributionData}
                                    cx="40%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {distributionData.map((_: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Legend
                                    layout="vertical"
                                    verticalAlign="middle"
                                    align="right"
                                    wrapperStyle={{ fontSize: '12px', paddingLeft: '20px' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Recent Enrollments Table */}
            <div className="glass overflow-hidden shadow-xl" style={{ marginTop: 30 }}>
                <div className="p-6 border-b border-glass-border flex justify-between items-center bg-surface">
                    <h4 className="text-lg font-semibold flex items-center gap-2">
                        <Clock size={20} className="text-primary" />
                        Dernières Inscriptions aux Parcours
                    </h4>
                    <select
                        value={selectedBundle}
                        onChange={(e) => {
                            setSelectedBundle(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="bg-background border border-glass-border rounded-xl px-4 py-2 text-text text-sm focus:outline-none focus:border-primary"
                    >
                        <option value="All">Tous les parcours</option>
                        {allBundles.map((title: any, i: number) => (
                            <option key={i} value={title}>{title}</option>
                        ))}
                    </select>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-surface-hover/50 text-text-muted text-xs uppercase tracking-widest">
                                <th className="text-left p-4">Utilisateur</th>
                                <th className="text-left p-4">Parcours</th>
                                <th className="text-center p-4">Date</th>
                                <th className="text-center p-4">Progression</th>
                                <th className="text-center p-4">Statut</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-glass-border">
                            {currentItems.length > 0 ? (
                                currentItems.map((item: any, idx: number) => (
                                    <tr key={idx} className="hover:bg-surface-hover/30 transition-colors">
                                        <td className="p-4 font-bold text-text">{item.userName}</td>
                                        <td className="p-4 text-text-muted">{item.bundleTitle}</td>
                                        <td className="p-4 text-center text-text-muted">
                                            {item.date ? new Date(item.date).toLocaleDateString('fr-FR') : '-'}
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <div className="w-16 h-1.5 bg-background rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-primary"
                                                        style={{ width: `${item.progress}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs font-bold text-primary">{Math.round(item.progress)}%</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className={`tag ${item.status === 'ACCEPTED' ? 'bg-success/20 text-success border-success/20' : 'bg-warning/20 text-warning border-warning/20'}`}>
                                                {item.status === 'ACCEPTED' ? 'Admis' : 'En attente'}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="p-10 text-center text-text-muted">Aucune inscription récente trouvée.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                <div className="pagination border-t border-glass-border bg-surface-hover/10 px-6 py-4 flex items-center justify-between">
                    <div className="pagination-info">
                        Affichage <span className="text-text font-bold">{filteredEnrollments.length > 0 ? startIndex + 1 : 0}</span> à <span className="text-text font-bold">{Math.min(endIndex, filteredEnrollments.length)}</span> sur <span className="text-text font-bold">{filteredEnrollments.length}</span> inscriptions
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="w-10 h-10 p-0 rounded-xl bg-background border border-glass-border text-text-muted hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-all icon-container">
                            <ChevronLeft size={18} />
                        </button>
                        <div className="flex gap-1.5">
                            {getPages().map((page, i) => (
                                page === '...' ? (
                                    <div key={i} className="w-10 h-10 flex items-center justify-center text-text-muted font-bold select-none cursor-default">
                                        ...
                                    </div>
                                ) : (
                                    <button
                                        key={i}
                                        onClick={() => setCurrentPage(Number(page))}
                                        className={`w-10 h-10 p-0 rounded-xl font-bold transition-all ${currentPage === page
                                            ? 'bg-primary text-white shadow-lg shadow-indigo-500/30'
                                            : 'bg-background border border-glass-border text-text-muted hover:border-primary hover:text-primary'}`}
                                    >
                                        {page}
                                    </button>
                                )
                            ))}
                        </div>
                        <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="w-10 h-10 p-0 rounded-xl bg-background border border-glass-border text-text-muted hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-all icon-container">
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BundleStatsPage;
