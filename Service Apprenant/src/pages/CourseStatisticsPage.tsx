import React, { useState } from 'react';
import {
    Users,
    BookOpen,
    TrendingUp,
    Award,
    ChevronRight,
    ChevronLeft,
    ArrowUpRight,
    ArrowDownRight
} from 'lucide-react';
import { useCourses } from '../hooks/useCourses';

const StatCard = ({ title, value, icon, trend, isPositive }: any) => (
    <div className="glass p-6 rounded-2xl border border-glass-border hover:border-primary/50 transition-all group">
        <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-surface-hover rounded-xl text-primary group-hover:scale-110 transition-transform flex items-center justify-center">
                {icon}
            </div>
            <div className={`flex items-center gap-1 text-xs font-bold ${isPositive ? 'text-success' : 'text-error'}`}>
                {trend}
                {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            </div>
        </div>
        <div>
            <p className="text-text-muted text-sm font-medium">{title}</p>
            <h3 className="text-3xl font-bold mt-1 text-text">{value}</h3>
        </div>
    </div>
);

const CourseStatisticsPage: React.FC = () => {
    const { courses } = useCourses();

    // Course Engagement Pagination
    const [coursesPage, setCoursesPage] = useState(1);
    const coursesPerPage = 5;

    // Top Learners Pagination
    const [learnersPage, setLearnersPage] = useState(1);
    const learnersPerPage = 4;

    const mockStats = [
        { name: 'Introduction à l\'IA', learners: 145, progress: 85, success: 92 },
        { name: 'Deep Learning Master', learners: 89, progress: 45, success: 78 },
        { name: 'Python pour la Data', learners: 210, progress: 65, success: 88 },
        { name: 'React Architecture', learners: 120, progress: 95, success: 94 },
        { name: 'UI/UX Design Basics', learners: 175, progress: 70, success: 85 },
        { name: 'Machine Learning Fundamentals', learners: 130, progress: 55, success: 82 },
        { name: 'TypeScript Avancé', learners: 190, progress: 80, success: 90 },
        { name: 'Node.js Backend Essentials', learners: 115, progress: 60, success: 84 },
    ];

    const mockLearners = [
        { name: 'Anas Ben', xp: '2.4k XP', coursesCount: 4, avatar: 'AB' },
        { name: 'Sara Lami', xp: '1.9k XP', coursesCount: 3, avatar: 'SL' },
        { name: 'Karim Tazi', xp: '1.5k XP', coursesCount: 2, avatar: 'KT' },
        { name: 'Youssef Alami', xp: '1.2k XP', coursesCount: 5, avatar: 'YA' },
        { name: 'Mehdi Sabri', xp: '1.1k XP', coursesCount: 1, avatar: 'MS' },
        { name: 'Inas El', xp: '950 XP', coursesCount: 2, avatar: 'IE' },
        { name: 'Nabil H.', xp: '800 XP', coursesCount: 3, avatar: 'NH' },
        { name: 'Zineb K.', xp: '750 XP', coursesCount: 4, avatar: 'ZK' },
    ];

    const totalCoursePages = Math.ceil(mockStats.length / coursesPerPage);
    const displayedCourses = mockStats.slice((coursesPage - 1) * coursesPerPage, coursesPage * coursesPerPage);

    const totalLearnerPages = Math.ceil(mockLearners.length / learnersPerPage);
    const displayedLearners = mockLearners.slice((learnersPage - 1) * learnersPerPage, learnersPage * learnersPerPage);

    return (
        <div className="space-y-8 pb-10">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    Statistiques des Cours
                </h1>
                <p className="text-text-muted mt-1 font-medium">
                    Analyse détaillée des performances de vos cours et de l'engagement des apprenants.
                </p>
            </div>

            {/* Global Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Apprenants"
                    value="1,284"
                    icon={<Users size={24} />}
                    trend="+12%"
                    isPositive={true}
                />
                <StatCard
                    title="Cours Actifs"
                    value={courses.length}
                    icon={<BookOpen size={24} />}
                    trend="+2"
                    isPositive={true}
                />
                <StatCard
                    title="Taux d'Engagement"
                    value="76%"
                    icon={<TrendingUp size={24} />}
                    trend="+5%"
                    isPositive={true}
                />
                <StatCard
                    title="Certifications"
                    value="432"
                    icon={<Award size={24} />}
                    trend="-3%"
                    isPositive={false}
                />
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Courses Table Section */}
                <div className="lg:col-span-2 space-y-6">
                    <h2 className="text-xl font-bold text-text">Engagement par Cours</h2>

                    <div className="glass overflow-hidden rounded-3xl border border-glass-border flex flex-col">
                        <div className="overflow-x-auto min-h-[420px]">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-surface-hover/50 border-b border-glass-border">
                                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-text-muted">Cours</th>
                                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-text-muted text-center">Apprenants</th>
                                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-text-muted">Progression</th>
                                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-text-muted text-right">Réussite</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-glass-border">
                                    {displayedCourses.map((stat, i) => (
                                        <tr key={i} className="hover:bg-surface-hover/30 transition-colors group h-[76px]">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                                                        {stat.name.charAt(0)}
                                                    </div>
                                                    <span className="font-bold text-text group-hover:text-primary transition-colors text-sm">{stat.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center font-bold text-base text-text">{stat.learners}</td>
                                            <td className="px-6 py-4">
                                                <div className="w-full max-w-[100px] space-y-1.5">
                                                    <div className="flex justify-between text-[10px] font-bold text-text-muted">
                                                        <span>{stat.progress}%</span>
                                                    </div>
                                                    <div className="h-1 bg-surface-hover rounded-full overflow-hidden">
                                                        <div className="h-full bg-primary" style={{ width: `${stat.progress}%` }} />
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="px-2.5 py-1 bg-success/10 text-success border border-success/20 rounded-lg text-[10px] font-bold uppercase">
                                                    {stat.success}%
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Courses Pagination Controls */}
                        <div className="px-6 py-4 bg-surface-hover/30 border-t border-glass-border flex items-center justify-start gap-4">
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setCoursesPage(p => Math.max(1, p - 1))}
                                    disabled={coursesPage === 1}
                                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface border border-glass-border text-text-muted hover:text-primary disabled:opacity-20 transition-all font-bold"
                                    aria-label="Previous page"
                                >
                                    <ChevronLeft size={20} style={{ minWidth: '20px', minHeight: '20px', display: 'block' }} strokeWidth={2.5} />
                                </button>
                                <div className="flex gap-1">
                                    {[...Array(totalCoursePages)].map((_, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setCoursesPage(i + 1)}
                                            className={`w-10 h-10 rounded-xl font-bold transition-all text-xs border ${coursesPage === i + 1 ? 'bg-primary text-white border-primary shadow-lg' : 'bg-surface border-glass-border text-text-muted hover:border-primary hover:text-primary'}`}
                                        >
                                            {i + 1}
                                        </button>
                                    ))}
                                </div>
                                <button
                                    onClick={() => setCoursesPage(p => Math.min(totalCoursePages, p + 1))}
                                    disabled={coursesPage === totalCoursePages}
                                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface border border-glass-border text-text-muted hover:text-primary disabled:opacity-20 transition-all font-bold"
                                    aria-label="Next page"
                                >
                                    <ChevronRight size={20} style={{ minWidth: '20px', minHeight: '20px', display: 'block' }} strokeWidth={2.5} />
                                </button>
                            </div>
                            <span className="text-xs text-text-muted font-bold ml-2">
                                Page {coursesPage} / {totalCoursePages}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Top Learners List Section */}
                <div className="space-y-6">
                    <h2 className="text-xl font-bold text-text">Top Apprenants</h2>
                    <div className="glass p-6 rounded-3xl border border-glass-border flex flex-col h-full min-h-[500px]">
                        <div className="flex-1 space-y-6">
                            {displayedLearners.map((student, i) => (
                                <div
                                    key={i}
                                    className="flex items-center justify-between group h-[64px]"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center font-bold text-primary border border-primary/10 text-sm">
                                            {student.avatar}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-sm text-text">{student.name}</h4>
                                            <p className="text-[10px] text-text-muted font-medium">{student.coursesCount} cours complétés</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-xs font-bold text-primary bg-primary/5 px-2 py-1 rounded-lg border border-primary/10">{student.xp}</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Learners Pagination */}
                        <div className="mt-8 pt-6 border-t border-glass-border flex items-center justify-start gap-3">
                            <button
                                onClick={() => setLearnersPage(p => Math.max(1, p - 1))}
                                disabled={learnersPage === 1}
                                className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface border border-glass-border text-text-muted hover:text-primary disabled:opacity-20 transition-all font-bold"
                                aria-label="Previous learners"
                            >
                                <ChevronLeft size={20} style={{ minWidth: '20px', minHeight: '20px', display: 'block' }} strokeWidth={2.5} />
                            </button>
                            <div className="flex gap-1">
                                {[...Array(totalLearnerPages)].map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setLearnersPage(i + 1)}
                                        className={`w-9 h-9 rounded-xl font-bold transition-all text-xs border ${learnersPage === i + 1 ? 'bg-primary text-white border-primary shadow-lg' : 'bg-surface border-glass-border text-text-muted hover:border-primary hover:text-primary'}`}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={() => setLearnersPage(p => Math.min(totalLearnerPages, p + 1))}
                                disabled={learnersPage === totalLearnerPages}
                                className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface border border-glass-border text-text-muted hover:text-primary disabled:opacity-20 transition-all font-bold"
                                aria-label="Next learners"
                            >
                                <ChevronRight size={20} style={{ minWidth: '20px', minHeight: '20px', display: 'block' }} strokeWidth={2.5} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CourseStatisticsPage;
