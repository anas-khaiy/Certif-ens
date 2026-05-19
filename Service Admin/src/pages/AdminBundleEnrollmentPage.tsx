import React, { useState, useEffect } from 'react';
import {
    CheckCircle,
    XCircle,
    Search,
    ArrowLeft,
    TrendingUp,
    Briefcase,
    Mail,
    Calendar,
    Award,
    Sparkles,
    Loader2,
    ChevronLeft,
    ChevronRight,
    Filter
} from 'lucide-react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { API_FORMATEUR, API_APPRENANT, API_ADMIN, WS_APPRENANT, WS_LIVEKIT, AI_DETECT_URL, VERIFY_URL_APPRENANT, VERIFY_URL_FORMATEUR } from '../config';

// Dedicated axios instance for the Formateur backend (port 8081).
// Does NOT share the admin api-client interceptor, so a 401 from 8081
// will never trigger the admin logout flow.
const formateurApi = axios.create({
    baseURL: API_FORMATEUR,
    withCredentials: true,
});
formateurApi.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

interface BundleEnrollment {
    id: number;
    bundleId: number;
    enseignant?: {
        id: number;
        nom: string;
        prenom: string;
        email: string;
        photoProfile: string;
        specialite?: { nom: string; }
    };
    apprenant?: {
        id: number;
        nom: string;
        prenom: string;
        email: string;
        photoProfile: string;
    };
    status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
    enrolledAt: string;
    completedAt?: string;
    progress?: number;
}

const AdminBundleEnrollmentPage: React.FC = () => {
    const [enrollments, setEnrollments] = useState<BundleEnrollment[]>([]);
    const [bundles, setBundles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'ACCEPTED' | 'REJECTED'>('ALL');
    const [selectedBundleId, setSelectedBundleId] = useState<number | 'ALL'>('ALL');

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(8);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [enrollRes, bundlesRes] = await Promise.all([
                formateurApi.get('/bundles/admin/enrollments'),
                formateurApi.get('/bundles')
            ]);

            const enrollmentsWithProgress = await Promise.all(enrollRes.data.map(async (enc: BundleEnrollment) => {
                if (enc.status === 'ACCEPTED') {
                    try {
                        const progRes = await formateurApi.get(`/bundles/admin/enrollments/${enc.id}/progress`);
                        return { ...enc, progress: progRes.data.progress };
                    } catch { return { ...enc, progress: 0 }; }
                }
                return enc;
            }));

            setEnrollments(enrollmentsWithProgress);
            setBundles(bundlesRes.data);
            setError(null);
        } catch (err) {
            console.error(err);
            setError("Erreur fatale. Impossible de charger les inscriptions.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handleStatusUpdate = async (enrollmentId: number, status: string) => {
        try {
            await formateurApi.patch(`/bundles/admin/enrollments/${enrollmentId}/status?status=${status}`);
            await fetchData();
        } catch (err) { alert("Erreur lors de la mise à jour du statut."); }
    };

    const getBundleTitle = (id: number) => {
        return bundles.find(b => b.id === id)?.title || `Parcours #${id}`;
    };

    const filteredEnrollments = enrollments.filter(e => {
        const user = e.apprenant || e.enseignant;
        if (!user) return false;
        
        const fullName = `${user.prenom} ${user.nom}`.toLowerCase();
        const matchesSearch = fullName.includes(searchQuery.toLowerCase()) ||
                             user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                             getBundleTitle(e.bundleId).toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'ALL' || e.status === statusFilter;
        const matchesBundle = selectedBundleId === 'ALL' || e.bundleId === selectedBundleId;
        
        return matchesSearch && matchesStatus && matchesBundle;
    });

    // Pagination logic
    const totalPages = Math.ceil(filteredEnrollments.length / itemsPerPage);
    const paginatedEnrollments = filteredEnrollments.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, statusFilter, selectedBundleId]);

    const getPages = () => {
        const pages: (number | string)[] = [];
        const showMax = 5;
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
            pages.push(totalPages);
        }
        return pages;
    };

    const stats = [
        { label: "En attente", value: enrollments.filter(e => e.status === 'PENDING').length, color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
        { label: "Acceptés",  value: enrollments.filter(e => e.status === 'ACCEPTED').length, color: "#6366f1", bg: "rgba(99,102,241,0.1)" },
        { label: "Terminés",  value: enrollments.filter(e => e.completedAt).length,            color: "#22c55e", bg: "rgba(34,197,94,0.1)" },
        { label: "Global",    value: enrollments.length,                                        color: "var(--text)", bg: "rgba(99,102,241,0.05)" }
    ];

    return (
        <div className="abe-root">
            {/* ── Hero / Stats Banner ── */}
            <div className="abe-hero">
                {/* ambient blobs */}
                <div className="abe-blob abe-blob-1" />
                <div className="abe-blob abe-blob-2" />

                <div className="abe-hero-inner">
                    {/* Left: title block */}
                    <div className="abe-title-block">
                        <div className="abe-title-row">
                            <button className="abe-back-btn" onClick={() => window.history.back()} title="Retour">
                                <ArrowLeft size={18} strokeWidth={3} />
                            </button>
                            <span className="abe-badge">
                                <Sparkles size={13} className="abe-badge-icon" />
                                Gestion des Inscriptions
                            </span>
                        </div>
                        <h1 className="abe-heading">
                            Validez les <span className="abe-heading-accent">Aspirations</span>.<br />
                            Suivez le Succès.
                        </h1>
                        <p className="abe-subheading">
                            Monitorez l'évolution des formateurs certifiés à travers vos programmes thématiques de haute voltige.
                        </p>
                    </div>

                    {/* Right: stat cards */}
                    <div className="abe-stats-grid">
                        {stats.map((s, i) => (
                            <div key={i} className="abe-stat-card" style={{ "--stat-accent": s.color, "--stat-bg": s.bg } as React.CSSProperties}>
                                <span className="abe-stat-value" style={{ color: s.color }}>{s.value}</span>
                                <span className="abe-stat-label">{s.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Search & filters */}
                <div className="abe-controls">
                    <div className="abe-search-wrap">
                        <Search className="abe-search-icon" size={18} />
                        <input
                            type="text"
                            placeholder="Rechercher une identité, un parcours ou un e-mail..."
                            className="abe-search-input"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="abe-filter-tabs">
                        {(['ALL', 'PENDING', 'ACCEPTED', 'REJECTED'] as const).map(s => (
                            <button
                                key={s}
                                onClick={() => setStatusFilter(s)}
                                className={`abe-filter-btn${statusFilter === s ? ' active' : ''}`}
                            >
                                {s === 'ALL' ? 'Toutes' : s === 'PENDING' ? 'En Attente' : s === 'ACCEPTED' ? 'Admis' : 'Refusés'}
                            </button>
                        ))}
                    </div>

                    <div className="abe-bundle-select-wrap">
                        <Filter className="abe-filter-icon" size={16} />
                        <select 
                            className="abe-bundle-select"
                            value={selectedBundleId}
                            onChange={(e) => setSelectedBundleId(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
                        >
                            <option value="ALL">Tous les parcours</option>
                            {bundles.map(b => (
                                <option key={b.id} value={b.id}>{b.title}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* ── List ── */}
            {error && (
                <div className="abe-error">
                    <span>{error}</span>
                </div>
            )}

            {loading ? (
                <div className="abe-loading">
                    <Loader2 className="abe-spinner" size={52} strokeWidth={2.5} />
                    <p className="abe-loading-text">Synchronisation des données…</p>
                </div>
            ) : filteredEnrollments.length === 0 ? (
                <div className="abe-empty">
                    <TrendingUp size={60} className="abe-empty-icon" />
                    <h3 className="abe-empty-title">Le calme avant la tempête.</h3>
                    <p className="abe-empty-sub">Aucune demande ne correspond à vos filtres actuels.</p>
                </div>
            ) : (
                <div className="abe-list-container">
                    <div className="abe-list">
                        <AnimatePresence mode="popLayout">
                            {paginatedEnrollments.map((enc, idx) => (
                            <motion.div
                                key={enc.id}
                                initial={{ opacity: 0, x: -24, scale: 0.98 }}
                                animate={{ opacity: 1, x: 0, scale: 1 }}
                                exit={{ opacity: 0, x: 24, scale: 0.96 }}
                                transition={{ delay: idx * 0.04, duration: 0.38, ease: [0.23, 1, 0.32, 1] }}
                                className="abe-card"
                            >
                                {/* status strip */}
                                <div className={`abe-strip ${enc.status === 'ACCEPTED' ? 'success' : enc.status === 'REJECTED' ? 'error' : 'pending'}`} />

                                <div className="abe-card-inner">
                                    {/* User Profile */}
                                    <div className="abe-trainer">
                                        <div className="abe-avatar-wrap">
                                            <div className="abe-avatar-glow" />
                                            <div className="abe-avatar">
                                                <img
                                                    src={`${API_FORMATEUR}/files/profiles/${(enc.apprenant?.photoProfile || enc.enseignant?.photoProfile) || 'default.png'}`}
                                                    alt={enc.apprenant?.nom || enc.enseignant?.nom}
                                                    onError={(e) => (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${(enc.apprenant?.prenom || enc.enseignant?.prenom) || 'User'}+${(enc.apprenant?.nom || enc.enseignant?.nom) || ''}&background=6366f1&color=fff`}
                                                />
                                            </div>
                                        </div>
                                        <div className="abe-trainer-info">
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <h4 className="abe-trainer-name">{(enc.apprenant?.prenom || enc.enseignant?.prenom)} {(enc.apprenant?.nom || enc.enseignant?.nom)}</h4>
                                                <span className={`abe-type-badge ${enc.apprenant ? 'learner' : 'trainer'}`}>
                                                    {enc.apprenant ? 'Apprenant' : 'Formateur'}
                                                </span>
                                            </div>
                                            <div className="abe-trainer-email">
                                                <Mail size={11} className="abe-inline-icon" />
                                                {(enc.apprenant?.email || enc.enseignant?.email)}
                                            </div>
                                            <div className="abe-trainer-spec">
                                                {enc.enseignant ? (enc.enseignant.specialite?.nom || 'Sans Spécialité') : 'Apprenant externe'}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Bundle Info */}
                                    <div className="abe-bundle-panel">
                                        <div className="abe-bundle-label">
                                            <Briefcase size={11} className="abe-inline-icon" /> Projet Thématique
                                        </div>
                                        <h5 className="abe-bundle-title">{getBundleTitle(enc.bundleId)}</h5>
                                        <div className="abe-bundle-date">
                                            <Calendar size={11} />
                                            {new Date(enc.enrolledAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </div>
                                    </div>

                                    {/* Progress / Status */}
                                    <div className="abe-progress-block">
                                        {enc.status === 'ACCEPTED' ? (
                                            <div className="abe-progress-wrap">
                                                <div className="abe-progress-header">
                                                    <span>Évolution d'Expertise</span>
                                                    <span className="abe-progress-pct">{Math.round(enc.progress || 0)}%</span>
                                                </div>
                                                <div className="abe-progress-track">
                                                    <motion.div
                                                        className="abe-progress-fill"
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${enc.progress || 0}%` }}
                                                        transition={{ duration: 0.7, ease: 'easeOut' }}
                                                    />
                                                </div>
                                                {enc.completedAt && (
                                                    <div className="abe-certified">
                                                        <Award size={13} strokeWidth={3} />
                                                        Expertise Validée
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className={`abe-status-badge ${enc.status === 'PENDING' ? 'pending' : 'error'}`}>
                                                {enc.status === 'PENDING' ? 'En attente' : 'Accès Refusé'}
                                            </div>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="abe-actions">
                                        {enc.status === 'PENDING' ? (
                                            <div className="abe-action-pair">
                                                <button
                                                    className="abe-action-btn accept"
                                                    onClick={() => handleStatusUpdate(enc.id, 'ACCEPTED')}
                                                    title="Admettre l'expert"
                                                >
                                                    <CheckCircle size={20} strokeWidth={2.5} />
                                                </button>
                                                <button
                                                    className="abe-action-btn reject"
                                                    onClick={() => handleStatusUpdate(enc.id, 'REJECTED')}
                                                    title="Refuser l'admission"
                                                >
                                                    <XCircle size={20} strokeWidth={2.5} />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="abe-action-pair">
                                                <a
                                                    href={`mailto:${enc.apprenant?.email || enc.enseignant?.email}`}
                                                    className="abe-action-btn mail"
                                                    title="Envoyer un e-mail"
                                                >
                                                    <Mail size={18} />
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="abe-pagination">
                        <div className="abe-pagination-info">
                            <span>{(currentPage - 1) * itemsPerPage + 1}</span> - <span>{Math.min(currentPage * itemsPerPage, filteredEnrollments.length)}</span> sur <span>{filteredEnrollments.length}</span> inscriptions
                        </div>

                        <div className="abe-pagination-controls">
                            <div className="abe-pagination-size">
                                <span>Par page</span>
                                <select 
                                    className="abe-pagination-size-select"
                                    value={itemsPerPage}
                                    onChange={(e) => {
                                        setItemsPerPage(Number(e.target.value));
                                        setCurrentPage(1);
                                    }}
                                >
                                    <option value={4}>4</option>
                                    <option value={8}>8</option>
                                    <option value={12}>12</option>
                                    <option value={16}>16</option>
                                </select>
                            </div>

                            <button 
                                className="abe-pagination-btn"
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            >
                                <ChevronLeft size={18} />
                            </button>

                            <div className="abe-pagination-numbers">
                                {getPages().map((p, i) => (
                                    p === '...' ? (
                                        <div key={i} className="abe-pagination-ellipsis">...</div>
                                    ) : (
                                        <button
                                            key={i}
                                            className={`abe-pagination-number ${currentPage === p ? 'active' : ''}`}
                                            onClick={() => typeof p === 'number' && setCurrentPage(p)}
                                        >
                                            {p}
                                        </button>
                                    )
                                ))}
                            </div>

                            <button 
                                className="abe-pagination-btn"
                                disabled={currentPage === totalPages}
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
            )}

            {/* ── Scoped styles ── */}
            <style>{`
                /* ─── Root ─────────────────────────────── */
                .abe-root {
                    display: flex;
                    flex-direction: column;
                    gap: 2rem;
                    padding-bottom: 6rem;
                    animation: abeFadeIn .4s ease both;
                }
                @keyframes abeFadeIn { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:none; } }

                /* ─── Hero ──────────────────────────────── */
                .abe-hero {
                    position: relative;
                    overflow: hidden;
                    background: var(--surface);
                    border: 1px solid var(--glass-border);
                    border-radius: 40px;
                    padding: 3rem 3.5rem;
                    box-shadow: 0 24px 80px rgba(0,0,0,.06);
                }
                .abe-blob {
                    position: absolute;
                    border-radius: 50%;
                    pointer-events: none;
                    filter: blur(90px);
                }
                .abe-blob-1 {
                    width: 380px; height: 380px;
                    background: var(--primary);
                    opacity: .04;
                    top: -120px; left: -100px;
                }
                .abe-blob-2 {
                    width: 260px; height: 260px;
                    background: var(--accent, #a78bfa);
                    opacity: .04;
                    bottom: -80px; right: -60px;
                }
                .abe-hero-inner {
                    position: relative;
                    z-index: 2;
                    display: flex;
                    flex-wrap: wrap;
                    gap: 2.5rem;
                    justify-content: space-between;
                    align-items: center;
                }

                /* title */
                .abe-title-block { flex: 1; min-width: 260px; }
                .abe-title-row {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    margin-bottom: 1.25rem;
                }
                .abe-back-btn {
                    display: flex; align-items: center; justify-content: center;
                    width: 42px; height: 42px;
                    background: var(--background);
                    border: 1px solid var(--glass-border);
                    border-radius: 14px;
                    color: var(--primary);
                    cursor: pointer;
                    transition: background .2s, color .2s, transform .15s;
                    flex-shrink: 0;
                }
                .abe-back-btn:hover { background: var(--primary); color: #fff; transform: scale(1.06); }
                .abe-back-btn:active { transform: scale(.94); }

                .abe-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: .4rem;
                    padding: .35rem .9rem;
                    background: rgba(99,102,241,.1);
                    border-radius: 12px;
                    color: var(--primary);
                    font-size: .68rem;
                    font-weight: 900;
                    letter-spacing: .18em;
                    text-transform: uppercase;
                }
                .abe-badge-icon { animation: abePulse 2s ease-in-out infinite; }
                @keyframes abePulse { 0%,100%{opacity:1} 50%{opacity:.4} }

                .abe-heading {
                    font-size: clamp(1.8rem, 3vw, 2.8rem);
                    font-weight: 900;
                    line-height: 1.12;
                    letter-spacing: -.03em;
                    color: var(--text);
                    margin: 0 0 .9rem;
                }
                .abe-heading-accent { color: var(--secondary, #f59e0b); }
                .abe-subheading {
                    font-size: .95rem;
                    color: var(--text-muted);
                    opacity: .65;
                    font-style: italic;
                    line-height: 1.65;
                    max-width: 440px;
                    margin: 0;
                }

                /* stats grid */
                .abe-stats-grid {
                    display: grid;
                    grid-template-columns: repeat(2, minmax(120px, 1fr));
                    gap: .9rem;
                }
                .abe-stat-card {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 1.4rem 1rem;
                    background: var(--stat-bg);
                    border: 1px solid var(--glass-border);
                    border-radius: 24px;
                    transition: transform .2s, box-shadow .2s;
                }
                .abe-stat-card:hover { transform: translateY(-3px) scale(1.03); box-shadow: 0 12px 30px rgba(0,0,0,.06); }
                .abe-stat-value { font-size: 1.7rem; font-weight: 900; }
                .abe-stat-label {
                    font-size: .62rem;
                    font-weight: 900;
                    letter-spacing: .18em;
                    text-transform: uppercase;
                    color: var(--text-muted);
                    opacity: .5;
                    margin-top: .3rem;
                }

                /* controls */
                .abe-controls {
                    position: relative;
                    z-index: 3;
                    margin-top: 2.5rem;
                    display: flex;
                    flex-wrap: wrap;
                    gap: .9rem;
                    align-items: center;
                }
                .abe-search-wrap {
                    position: relative;
                    flex: 1;
                    min-width: 220px;
                }
                .abe-search-icon {
                    position: absolute;
                    left: 1.1rem;
                    top: 50%;
                    transform: translateY(-50%);
                    color: var(--primary);
                    pointer-events: none;
                }
                .abe-search-input {
                    width: 100%;
                    padding: 1rem 1.2rem 1rem 3rem;
                    background: var(--background);
                    border: 1px solid var(--glass-border);
                    border-radius: 20px;
                    font-size: .875rem;
                    font-weight: 600;
                    color: var(--text);
                    outline: none;
                    transition: border-color .2s, box-shadow .2s;
                    box-sizing: border-box;
                }
                .abe-search-input::placeholder { color: var(--text-muted); opacity: .4; }
                .abe-search-input:focus { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(99,102,241,.12); }

                .abe-filter-tabs { display: flex; gap: .5rem; flex-wrap: wrap; }
                .abe-filter-btn {
                    padding: .55rem 1.1rem;
                    border-radius: 14px;
                    border: 1px solid var(--glass-border);
                    background: rgba(99,102,241,.04);
                    color: var(--text-muted);
                    font-size: .65rem;
                    font-weight: 900;
                    letter-spacing: .14em;
                    text-transform: uppercase;
                    cursor: pointer;
                    white-space: nowrap;
                    transition: all .2s;
                }
                .abe-filter-btn:hover { border-color: rgba(99,102,241,.3); background: var(--surface); color: var(--text); }
                .abe-filter-btn.active {
                    background: var(--primary);
                    color: #fff;
                    border-color: var(--primary);
                    box-shadow: 0 4px 16px rgba(99,102,241,.25);
                    transform: scale(1.04);
                }

                /* ─── Feedback states ───────────────────── */
                .abe-error {
                    padding: 1rem 1.5rem;
                    background: rgba(239,68,68,.08);
                    border: 1px solid rgba(239,68,68,.2);
                    border-radius: 16px;
                    color: #ef4444;
                    font-weight: 700;
                    font-size: .9rem;
                }
                .abe-loading {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 1rem;
                    padding: 6rem 0;
                }
                .abe-spinner {
                    color: var(--primary);
                    animation: abeRotate 1s linear infinite;
                }
                @keyframes abeRotate { to { transform: rotate(360deg); } }
                .abe-loading-text {
                    font-size: .65rem;
                    font-weight: 900;
                    letter-spacing: .3em;
                    text-transform: uppercase;
                    color: var(--primary);
                    opacity: .4;
                    animation: abePulse 1.5s ease-in-out infinite;
                }

                .abe-empty {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 1rem;
                    padding: 6rem 3rem;
                    border: 2px dashed var(--glass-border);
                    border-radius: 40px;
                    text-align: center;
                }
                .abe-empty-icon { color: var(--text-muted); opacity: .18; }
                .abe-empty-title { font-size: 1.5rem; font-weight: 900; color: var(--text); margin: 0; }
                .abe-empty-sub { color: var(--text-muted); opacity: .55; font-weight: 600; margin: 0; }

                /* ─── Card list ─────────────────────────── */
                .abe-list { display: flex; flex-direction: column; gap: 1rem; }

                .abe-card {
                    position: relative;
                    background: var(--surface);
                    border: 1px solid var(--glass-border);
                    border-radius: 28px;
                    overflow: hidden;
                    transition: box-shadow .35s, border-color .35s, background .35s;
                }
                .abe-card:hover {
                    box-shadow: 0 16px 50px rgba(0,0,0,.08);
                    border-color: rgba(99,102,241,.3);
                    background: var(--surface-hover, var(--surface));
                }

                /* strip */
                .abe-strip {
                    position: absolute;
                    left: 0; top: 0; bottom: 0;
                    width: 5px;
                    transition: width .35s;
                    border-radius: 28px 0 0 28px;
                }
                .abe-card:hover .abe-strip { width: 8px; }
                .abe-strip.success { background: #22c55e; box-shadow: 6px 0 20px rgba(34,197,94,.15); }
                .abe-strip.error   { background: #ef4444; box-shadow: 6px 0 20px rgba(239,68,68,.15); }
                .abe-strip.pending { background: #f59e0b; box-shadow: 6px 0 20px rgba(245,158,11,.15); }

                .abe-card-inner {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 1.5rem;
                    align-items: center;
                    padding: 1.6rem 1.6rem 1.6rem 2rem;
                }

                /* trainer */
                .abe-trainer {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    min-width: 230px;
                    flex: 1.2;
                }
                .abe-avatar-wrap { position: relative; flex-shrink: 0; }
                .abe-avatar-glow {
                    position: absolute;
                    inset: -4px;
                    background: linear-gradient(135deg, var(--primary), var(--accent, #a78bfa));
                    border-radius: 18px;
                    opacity: .12;
                    transition: opacity .3s;
                }
                .abe-card:hover .abe-avatar-glow { opacity: .4; }
                .abe-avatar {
                    position: relative;
                    width: 56px; height: 56px;
                    border-radius: 16px;
                    overflow: hidden;
                    border: 2px solid rgba(255,255,255,.08);
                    box-shadow: 0 8px 24px rgba(0,0,0,.12);
                }
                .abe-avatar img { width: 100%; height: 100%; object-fit: cover; transition: transform .4s; }
                .abe-card:hover .abe-avatar img { transform: scale(1.1); }

                .abe-trainer-info { display: flex; flex-direction: column; gap: .25rem; }
                .abe-trainer-name {
                    font-size: 1.05rem;
                    font-weight: 900;
                    color: var(--text);
                    margin: 0;
                    transition: color .2s;
                    letter-spacing: -.02em;
                }
                .abe-card:hover .abe-trainer-name { color: var(--primary); }
                .abe-trainer-email {
                    display: flex;
                    align-items: center;
                    gap: .35rem;
                    font-size: .7rem;
                    font-weight: 800;
                    letter-spacing: .06em;
                    text-transform: uppercase;
                    color: var(--text-muted);
                }
                .abe-trainer-spec {
                    font-size: .62rem;
                    font-weight: 900;
                    letter-spacing: .12em;
                    text-transform: uppercase;
                    color: var(--primary);
                    opacity: .5;
                }
                .abe-inline-icon { color: var(--primary); flex-shrink: 0; }

                /* bundle panel */
                .abe-bundle-panel {
                    flex: 1;
                    min-width: 190px;
                    background: rgba(99,102,241,.04);
                    border: 1px solid var(--glass-border);
                    border-radius: 18px;
                    padding: 1rem 1.3rem;
                    transition: border-color .3s;
                }
                .abe-card:hover .abe-bundle-panel { border-color: rgba(99,102,241,.18); }
                .abe-bundle-label {
                    display: flex;
                    align-items: center;
                    gap: .35rem;
                    font-size: .62rem;
                    font-weight: 900;
                    letter-spacing: .15em;
                    text-transform: uppercase;
                    color: var(--text-muted);
                    margin-bottom: .5rem;
                }
                .abe-bundle-title {
                    font-size: .875rem;
                    font-weight: 700;
                    color: var(--text);
                    margin: 0 0 .6rem;
                    opacity: .8;
                    overflow: hidden;
                    display: -webkit-box;
                    -webkit-line-clamp: 1;
                    -webkit-box-orient: vertical;
                }
                .abe-bundle-date {
                    display: flex;
                    align-items: center;
                    gap: .3rem;
                    font-size: .65rem;
                    font-weight: 900;
                    letter-spacing: .1em;
                    text-transform: uppercase;
                    color: var(--text-muted);
                    opacity: .45;
                }

                /* progress */
                .abe-progress-block { flex: 1; min-width: 180px; }
                .abe-progress-wrap { display: flex; flex-direction: column; gap: .6rem; }
                .abe-progress-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    font-size: .65rem;
                    font-weight: 900;
                    letter-spacing: .12em;
                    text-transform: uppercase;
                    color: var(--text-muted);
                }
                .abe-progress-pct { color: var(--primary); }
                .abe-progress-track {
                    height: 7px;
                    background: var(--background);
                    border: 1px solid var(--glass-border);
                    border-radius: 99px;
                    overflow: hidden;
                    padding: 1px;
                }
                .abe-progress-fill {
                    height: 100%;
                    background: linear-gradient(90deg, var(--primary) 0%, #f59e0b 60%, var(--accent, #a78bfa) 100%);
                    border-radius: 99px;
                    box-shadow: 0 0 12px rgba(99,102,241,.25);
                }
                .abe-certified {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: .4rem;
                    font-size: .65rem;
                    font-weight: 900;
                    letter-spacing: .14em;
                    text-transform: uppercase;
                    color: #22c55e;
                    padding: .4rem .8rem;
                    background: rgba(34,197,94,.06);
                    border: 1px solid rgba(34,197,94,.15);
                    border-radius: 10px;
                    animation: abePulse 2s ease-in-out infinite;
                }

                .abe-status-badge {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    padding: .5rem 1.1rem;
                    border-radius: 14px;
                    font-size: .65rem;
                    font-weight: 900;
                    letter-spacing: .16em;
                    text-transform: uppercase;
                    border: 1px solid;
                }
                .abe-status-badge.pending {
                    background: rgba(245,158,11,.06);
                    border-color: rgba(245,158,11,.2);
                    color: #f59e0b;
                }
                .abe-status-badge.error {
                    background: rgba(239,68,68,.06);
                    border-color: rgba(239,68,68,.2);
                    color: #ef4444;
                }

                /* actions */
                .abe-actions { flex-shrink: 0; }
                .abe-action-pair { display: flex; gap: .65rem; align-items: center; }
                .abe-action-btn {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 48px; height: 48px;
                    border-radius: 14px;
                    border: 1px solid;
                    cursor: pointer;
                    text-decoration: none;
                    transition: background .2s, color .2s, transform .15s, box-shadow .2s;
                    flex-shrink: 0;
                }
                .abe-action-btn:hover { transform: scale(1.1); }
                .abe-action-btn:active { transform: scale(.93); }
                .abe-action-btn.accept {
                    background: rgba(34,197,94,.08);
                    border-color: rgba(34,197,94,.25);
                    color: #22c55e;
                }

                .abe-type-badge {
                    font-size: 0.55rem;
                    font-weight: 900;
                    text-transform: uppercase;
                    padding: 0.15rem 0.5rem;
                    border-radius: 6px;
                    letter-spacing: 0.05em;
                }
                .abe-type-badge.trainer {
                    background: rgba(99,102,241,0.1);
                    color: var(--primary);
                    border: 1px solid rgba(99,102,241,0.2);
                }
                .abe-type-badge.learner {
                    background: rgba(167,139,250,0.1);
                    color: #a78bfa;
                    border: 1px solid rgba(167,139,250,0.2);
                }
                .abe-action-btn.accept:hover {
                    background: #22c55e;
                    color: #fff;
                    box-shadow: 0 8px 24px rgba(34,197,94,.2);
                }
                .abe-action-btn.reject {
                    background: rgba(239,68,68,.08);
                    border-color: rgba(239,68,68,.25);
                    color: #ef4444;
                }
                .abe-action-btn.reject:hover {
                    background: #ef4444;
                    color: #fff;
                    box-shadow: 0 8px 24px rgba(239,68,68,.2);
                }
                .abe-action-btn.reset {
                    background: var(--background);
                    border-color: var(--glass-border);
                    color: var(--text-muted);
                    opacity: .5;
                }
                .abe-action-btn.reset:hover {
                    color: #f59e0b;
                    border-color: rgba(245,158,11,.35);
                    opacity: 1;
                }
                .abe-action-btn.mail {
                    background: var(--background);
                    border-color: var(--glass-border);
                    color: var(--text-muted);
                }
                .abe-action-btn.mail:hover {
                    color: var(--primary);
                    border-color: rgba(99,102,241,.35);
                }

                /* ─── Bundle select ──────────────────── */
                .abe-bundle-select-wrap {
                    position: relative;
                    min-width: 180px;
                }
                .abe-filter-icon {
                    position: absolute;
                    left: 0.9rem;
                    top: 50%;
                    transform: translateY(-50%);
                    color: var(--primary);
                    pointer-events: none;
                }
                .abe-bundle-select {
                    appearance: none;
                    background: rgba(99,102,241,.04);
                    border: 1px solid var(--glass-border);
                    border-radius: 14px;
                    padding: .475rem 2rem .475rem 2.4rem;
                    font-size: .65rem;
                    font-weight: 800;
                    letter-spacing: .05em;
                    color: var(--text-muted);
                    cursor: pointer;
                    width: 100%;
                    outline: none;
                    transition: all .2s;
                    max-width: 250px;
                }
                .abe-bundle-select:hover { border-color: rgba(99,102,241,.37); background: var(--surface); color: var(--text); }
                .abe-bundle-select:focus { border-color: var(--primary); }

                /* ─── Pagination ────────────────────── */
                .abe-pagination {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-top: 2rem;
                    padding: 1.5rem 2rem;
                    background: var(--surface);
                    border: 1px solid var(--glass-border);
                    border-radius: 30px;
                    box-shadow: 0 10px 40px rgba(0,0,0,.04);
                }
                .abe-pagination-info { font-size: 0.8rem; font-weight: 600; color: var(--text-muted); }
                .abe-pagination-info span { color: var(--text); font-weight: 800; }
                .abe-pagination-controls { display: flex; align-items: center; gap: 0.75rem; }
                
                .abe-pagination-size {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-size: 0.7rem;
                    font-weight: 800;
                    color: var(--text-muted);
                    margin-right: 0.5rem;
                }
                .abe-pagination-size-select {
                    background: var(--background);
                    border: 1px solid var(--glass-border);
                    border-radius: 8px;
                    padding: 0.2rem 0.4rem;
                    outline: none;
                    font-weight: 900;
                    color: var(--text);
                }

                .abe-pagination-btn {
                    width: 2.25rem; height: 2.25rem;
                    display: flex; align-items: center; justify-content: center;
                    background: var(--background);
                    border: 1px solid var(--glass-border);
                    border-radius: 10px;
                    color: var(--text-muted);
                    cursor: pointer;
                    transition: all .2s;
                    padding: 0;
                }
                .abe-pagination-btn:hover:not(:disabled) { border-color: var(--primary); color: var(--primary); background: rgba(99,102,241,0.05); }
                .abe-pagination-btn:disabled { opacity: 0.3; cursor: not-allowed; }

                .abe-pagination-numbers { display: flex; gap: 0.35rem; }
                .abe-pagination-number {
                    width: 2.25rem; height: 2.25rem;
                    display: flex; align-items: center; justify-content: center;
                    background: var(--background);
                    border: 1px solid var(--glass-border);
                    border-radius: 10px;
                    color: var(--text-muted);
                    font-size: 0.8rem;
                    font-weight: 800;
                    cursor: pointer;
                    transition: all .2s;
                }
                .abe-pagination-number:hover { border-color: var(--primary); color: var(--primary); }
                .abe-pagination-number.active { background: var(--primary); border-color: var(--primary); color: #fff; box-shadow: 0 4px 12px rgba(99,102,241,0.2); }
                .abe-pagination-ellipsis { width: 2rem; text-align: center; color: var(--text-muted); font-weight: 800; }
            `}</style>
        </div>
    );
};

export default AdminBundleEnrollmentPage;
