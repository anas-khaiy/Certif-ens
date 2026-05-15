import {
    TrendingUp,
    BarChart2,
    Activity,
    Users,
    BookOpen
} from 'lucide-react';
import { useState, useEffect } from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    LineChart,
    Line
} from 'recharts';
import api from '../api/api-client';

const AnalyticsPage = () => {
    const [data, setData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);



    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const response = await api.get('/stats/analytics');
                setData(response.data);
            } catch (error) {
                console.error("Failed to fetch analytics stats", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchAnalytics();
    }, []);

    if (isLoading) {
        return (
            <div className="h-[60vh] flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    const specialityData = data?.specialityData || [];
    const monthlyProgressData = data?.monthlyProgressData || [];

    return (
        <div className="space-y-8 animate-fade-in pb-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold">Analyses et Taux de Réussite</h2>
                    <p className="text-text-muted">Statistiques détaillées sur la performance des apprenants.</p>
                </div>
                <div className="p-3 bg-primary/10 text-primary rounded-xl">
                    <TrendingUp size={24} />
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass p-6 flex flex-col gap-4">
                    <div className="flex justify-between items-start">
                        <div className="p-3 rounded-xl bg-success/10 text-success">
                            <Activity size={24} />
                        </div>
                    </div>
                    <div>
                        <p className="text-text-muted text-sm">Taux de Réussite Global</p>
                        <h3 className="text-3xl font-bold mt-1">{data?.globalSuccessRate || 0}%</h3>
                    </div>
                    <div className="w-full bg-surface-hover rounded-full h-1.5 mt-2 overflow-hidden">
                        <div className="bg-success h-1.5 rounded-full transition-all duration-1000" style={{ width: `${data?.globalSuccessRate || 0}%` }}></div>
                    </div>
                </div>

                <div className="glass p-6 flex flex-col gap-4">
                    <div className="flex justify-between items-start">
                        <div className="p-3 rounded-xl bg-primary/10 text-primary">
                            <Users size={24} />
                        </div>
                    </div>
                    <div>
                        <p className="text-text-muted text-sm">Apprenants Certifiés</p>
                        <h3 className="text-3xl font-bold mt-1">{data?.totalCertified || 0}</h3>
                    </div>
                    <div className="w-full bg-surface-hover rounded-full h-1.5 mt-2 overflow-hidden">
                        <div className="bg-primary h-1.5 rounded-full transition-all duration-1000" style={{ width: '100%' }}></div>
                    </div>
                </div>

                <div className="glass p-6 flex flex-col gap-4">
                    <div className="flex justify-between items-start">
                        <div className="p-3 rounded-xl bg-secondary/10 text-secondary">
                            <BookOpen size={24} />
                        </div>
                    </div>
                    <div>
                        <p className="text-text-muted text-sm">Moyenne Générale</p>
                        <h3 className="text-3xl font-bold mt-1">
                            {((data?.generalAverage || 0) * 0.2).toFixed(1)}/20
                        </h3>
                    </div>
                    <div className="w-full bg-surface-hover rounded-full h-1.5 mt-2 overflow-hidden">
                        <div className="bg-secondary h-1.5 rounded-full transition-all duration-1000" style={{ width: `${data?.generalAverage || 0}%` }}></div>
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" style={{ marginTop: "30px" }}>

                {/* Taux de réussite par filière */}
                <div className="glass p-6">
                    <h4 className="text-lg font-semibold mb-6 flex items-center gap-2">
                        <BarChart2 size={20} className="text-primary" />
                        Taux de réussite par Spécialité (%)
                    </h4>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={specialityData} layout="vertical" margin={{ left: 40 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={true} vertical={false} />
                                <XAxis type="number" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
                                <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} width={100} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                                    itemStyle={{ color: '#fff' }}
                                    cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                                />
                                <Bar dataKey="success" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Evolution Mensuelle */}
                <div className="glass p-6">
                    <h4 className="text-lg font-semibold mb-6 flex items-center gap-2">
                        <TrendingUp size={20} className="text-secondary" />
                        Évolution du Taux de Réussite
                    </h4>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={monthlyProgressData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Line type="monotone" dataKey="rate" stroke="#ec4899" strokeWidth={3} dot={{ r: 4, fill: '#ec4899' }} activeDot={{ r: 6 }} name="Taux %" />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsPage;
