import {
    Users,
    GraduationCap,
    TrendingUp,
    Award,
    Star,
    ChevronLeft,
    ChevronRight,
    Filter,
    BookOpen
} from 'lucide-react';
import { useState, useEffect } from 'react';
import {
    AreaChart,
    Area,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend
} from 'recharts';
import api from '../api/api-client';

const LearnersStatsPage = () => {
    const [data, setData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedSpecialty, setSelectedSpecialty] = useState('');
    const itemsPerPage = 5;

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await api.get('/stats/learners');
                setData(response.data);
            } catch (error) {
                console.error("Failed to fetch learners stats", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchStats();
    }, []);

    const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b'];

    if (isLoading) {
        return (
            <div className="h-[60vh] flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    const enrollmentData = data?.enrollmentData || [];
    const levelData = data?.levelData || [];
    const genderData = data?.genderData || [];
    const coursesBySpec = data?.coursesBySpec || [];
    const topLearners = data?.topLearners || [];

    // Filter Logic
    const filteredTopLearners = topLearners.filter((l: any) =>
        selectedSpecialty === '' || l.speciality === selectedSpecialty
    );

    const specialties = data?.allSpecialties || Array.from(new Set(topLearners.map((l: any) => l.speciality).filter(Boolean)));

    // Pagination Logic
    const totalPages = Math.ceil(filteredTopLearners.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentItems = filteredTopLearners.slice(startIndex, endIndex);

    // Smart Pagination Range
    const getPages = () => {
        const pages: (number | string)[] = [];
        const showMax = 7;

        if (totalPages <= showMax) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            // Always show first page
            pages.push(1);

            if (currentPage > 3) {
                pages.push('...');
            }

            // Window around current page
            const start = Math.max(2, currentPage - 1);
            const end = Math.min(totalPages - 1, currentPage + 1);

            for (let i = start; i <= end; i++) {
                if (!pages.includes(i)) pages.push(i);
            }

            if (currentPage < totalPages - 2) {
                pages.push('...');
            }

            // Always show last page
            if (!pages.includes(totalPages)) {
                pages.push(totalPages);
            }
        }
        return pages;
    };

    return (
        <div className="space-y-8 animate-fade-in pb-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold">Statistiques des Apprenants</h2>
                    <p className="text-text-muted">Vue d'ensemble et analyse de la communauté étudiante.</p>
                </div>
                <div className="p-3 bg-primary/10 text-primary rounded-xl">
                    <GraduationCap size={24} />
                </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass p-6 flex flex-col gap-2">
                    <div className="flex justify-between items-start">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                            <Users size={20} />
                        </div>
                    </div>
                    <div>
                        <p className="text-text-muted text-xs">Total Inscrits</p>
                        <h3 className="text-2xl font-bold">{data?.totalLearners || 0}</h3>
                    </div>
                </div>


                <div className="glass p-6 flex flex-col gap-2">
                    <div className="flex justify-between items-start">
                        <div className="p-2 rounded-lg bg-secondary/10 text-secondary">
                            <Award size={20} />
                        </div>
                    </div>
                    <div>
                        <p className="text-text-muted text-xs">Taux de Certification</p>
                        <h3 className="text-2xl font-bold">{data?.certificationRate || 0}%</h3>
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="space-y-6">
                {/* Evolution Chart (Full Width) */}
                <div className="glass p-6" style={{ marginTop: '30px' }}>
                    <h4 className="text-lg font-semibold mb-6 flex items-center gap-2">
                        <TrendingUp size={20} className="text-primary" />
                        Évolution des Apprenants

                    </h4>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={enrollmentData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Area type="monotone" dataKey="students" name="Total Apprenants" stroke="#6366f1" fillOpacity={1} fill="url(#colorStudents)" />

                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" style={{ marginTop: '30px' }}>
                    {/* Distribution Learners Chart */}
                    <div className="glass p-6">
                        <h4 className="text-lg font-semibold mb-6 flex items-center gap-2">
                            <Users size={20} className="text-secondary" />
                            Répartition par Spécialité
                        </h4>
                        <div className="h-64 relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={levelData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {levelData.map((_: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                                        itemStyle={{ color: '#fff' }}
                                    />
                                    <Legend
                                        layout="horizontal"
                                        verticalAlign="bottom"
                                        align="center"
                                        wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="chart-center-text">
                                <span className="value">{data?.totalLearners || 0}</span>
                                <span className="label">Total</span>
                            </div>
                        </div>
                    </div>

                    {/* Gender Distribution Chart */}
                    <div className="glass p-6">
                        <h4 className="text-lg font-semibold mb-6 flex items-center gap-2">
                            <Users size={20} className="text-primary" />
                            Répartition par Sexe
                        </h4>
                        <div className="h-64 relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={genderData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {genderData.map((item: any, index: number) => (
                                            <Cell 
                                                key={`cell-${index}`} 
                                                fill={item.name.toLowerCase() === 'femme' ? '#f472b6' : item.name.toLowerCase() === 'homme' ? '#3b82f6' : '#94a3b8'} 
                                            />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                                        itemStyle={{ color: '#fff' }}
                                    />
                                    <Legend verticalAlign="bottom" height={36}/>
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Courses by Specialty Bar Chart */}
                    <div className="glass p-6">
                        <h4 className="text-lg font-semibold mb-6 flex items-center gap-2">
                            <BookOpen size={20} className="text-success" />
                            Cours par Spécialité
                        </h4>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={coursesBySpec} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                                    <Tooltip
                                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                                        itemStyle={{ color: '#fff' }}
                                    />
                                    <Bar dataKey="value" name="Nombre de cours" radius={[4, 4, 0, 0]}>
                                        {coursesBySpec.map((_: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>

            {/* Top Students Table */}
            <div className="glass bg-surface overflow-hidden shadow-xl" style={{ marginTop: '30px' }}>
                <div className="p-6 border-b border-glass-border flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                    <h4 className="text-lg font-semibold flex items-center gap-2">
                        <Star size={20} className="text-warning" />
                        Top Apprenants (Performance)
                    </h4>

                    <div className="flex flex-col md:flex-row gap-4 w-full lg:w-auto">
                        <div className="relative flex items-center group min-w-[220px]">
                            <select
                                className="filter-select text-sm h-[44px] w-full"
                                value={selectedSpecialty}
                                onChange={(e) => {
                                    setSelectedSpecialty(e.target.value);
                                    setCurrentPage(1);
                                }}
                            >
                                <option value="">Toutes les spécialités</option>
                                {specialties.map((s: any) => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                            <Filter size={18} className="absolute left-4 text-primary z-20 pointer-events-none" />
                            <ChevronRight size={16} className="absolute right-4 text-text-muted rotate-90 z-20 pointer-events-none group-hover:text-text transition-colors" />
                        </div>
                    </div>

                    <p className="text-xs text-text-muted italic hidden xl:block">Basé sur les cours complétés</p>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-surface-hover/50 text-text-muted text-xs uppercase tracking-widest">
                                <th className="text-left p-4">Apprenant</th>
                                <th className="text-left p-4">Spécialité</th>
                                <th className="text-center p-4">Cours Complétés</th>
                                <th className="text-center p-4">Progrès Moyen</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-glass-border">
                            {currentItems.map((learner: any, index: number) => (
                                <tr key={index} className="hover:bg-surface-hover/30 transition-colors">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-surface-hover flex items-center justify-center text-sm font-bold border border-glass-border text-primary">
                                                {learner.avatar}
                                            </div>
                                            <span className="font-bold text-text">{learner.name}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-text-muted">{learner.speciality}</td>
                                    <td className="p-4 text-center font-semibold text-text">{learner.courses}</td>
                                    <td className="p-4 text-center">
                                        <div className="flex flex-col items-center">
                                            <span className="text-success font-bold">{learner.score}%</span>
                                            <div className="w-16 h-1 w-full bg-surface-hover rounded-full mt-1 overflow-hidden">
                                                <div className="h-full bg-success" style={{ width: `${learner.score}%` }}></div>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                <div className="pagination border-t border-glass-border bg-surface-hover/10 px-6 py-4 flex items-center justify-between">
                    <div className="pagination-info">
                        Affichage <span className="text-text font-bold">{filteredTopLearners.length > 0 ? startIndex + 1 : 0}</span> à <span className="text-text font-bold">{Math.min(endIndex, filteredTopLearners.length)}</span> sur <span className="text-text font-bold">{filteredTopLearners.length}</span> apprenants
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="w-10 h-10 p-0 rounded-xl bg-background border border-glass-border text-text-muted hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-all icon-container"
                        >
                            <ChevronLeft size={20} />
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
                        <button
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="w-10 h-10 p-0 rounded-xl bg-background border border-glass-border text-text-muted hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-all icon-container"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LearnersStatsPage;
