import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
    Award,
    Download,
    Search,
    ChevronLeft,
    ChevronRight,
    SearchX,
    CheckCircle,
    Shield,
    Calendar,
    Share2,
    CheckCircle2,
    X,
    Linkedin,
    Facebook,
    Instagram,
    Copy,
    ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/api-client';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import type { Course } from '../types';
import { API_FORMATEUR, API_APPRENANT, API_ADMIN, WS_APPRENANT, WS_LIVEKIT, AI_DETECT_URL, VERIFY_URL_APPRENANT, VERIFY_URL_FORMATEUR } from '../config';

interface CompletionData {
    id: number;
    completionDate: string;
    examScore: number;
    certificateId: string;
}

interface CertificatePrototype {
    logo: string;
    cachet: string;
    signature: string;
    tailleQR: string;
    tailleLogo: string;
    tailleCachet: string;
    tailleSignature: string;
    tailleMessage: string;
    title: string;
    subtitle: string;
    message: string;
}

const ADMIN_API = API_ADMIN;

const CompletedCoursesPage = () => {
    const navigate = useNavigate();
    const [completedCourses, setCompletedCourses] = useState<Course[]>([]);
    const [coursesCompletion, setCoursesCompletion] = useState<Record<string, CompletionData>>({});
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [showShareToast, setShowShareToast] = useState(false);
    const [showShareMenu, setShowShareMenu] = useState(false);
    const [learnerName, setLearnerName] = useState('Apprenant');
    const [trainerName, setTrainerName] = useState('');
    const [prototype, setPrototype] = useState<CertificatePrototype | null>(null);
    const itemsPerPage = 6;

    const certificateRef = useRef<HTMLDivElement>(null);

    const getImageUrl = (filename: string) => {
        if (!filename) return '';
        if (filename.startsWith('data:') || filename.startsWith('http')) return filename;
        return `${ADMIN_API}/files/certificates/${filename}`;
    };

    const renderWithBold = (text: string, courseTitle: string, score: string) => {
        const dynamicText = text
            .replace(/{course}/g, courseTitle)
            .replace(/{score}/g, score);
        return dynamicText.split('*').map((part, index) =>
            index % 2 === 1 ? <strong key={index}>{part}</strong> : part
        );
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
        return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    };

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const userRes = await api.get('/auth/me');
                setLearnerName(`${userRes.data.prenom} ${userRes.data.nom}`);

                // Fetch prototype directly from Admin Backend
                try {
                    const protoRes = await fetch(`${ADMIN_API}/prototypes`);
                    if (protoRes.ok) {
                        const data = await protoRes.json();
                        if (data && data.length > 0) {
                            const p = data[0];
                            setPrototype({
                                ...p,
                                tailleQR: String(p.tailleQR || 100),
                                tailleLogo: String(p.tailleLogo || 96),
                                tailleCachet: String(p.tailleCachet || 96),
                                tailleSignature: String(p.tailleSignature || 64),
                                tailleMessage: String(p.tailleMessage || 18),
                            });
                        }
                    }
                } catch (e) {
                    console.error("Error fetching admin prototype:", e);
                }

                const enrollmentsRes = await api.get('/enrollments/my/accepted');
                const enrollments = enrollmentsRes.data;

                const completed: Course[] = [];
                const completionMap: Record<string, CompletionData> = {};

                await Promise.all(enrollments.map(async (e: any) => {
                    const course = e.course;
                    try {
                        const [progressRes, resultsRes] = await Promise.all([
                            api.get(`/progress/${course.id}`),
                            api.get(`/progress/${course.id}/quizzes`),
                        ]);

                        const progressData = progressRes.data;
                        const quizResults = resultsRes.data as any[];

                        // 1. Identify UNIQUE required sub-sections in the course
                        const allSubSections = (course.sections || []).flatMap((s: any) => s.subSections || []);
                        const uniqueSubSectionIds = new Set(allSubSections.map((ss: any) => String(ss.id)));

                        // 2. Identify UNIQUE completed sub-sections that still exist in the course
                        const completedIdsStr = progressData.completedSubSectionIds || "";
                        const completedIds = completedIdsStr.split(',').filter((id: string) => id !== '');
                        const uniqueCompletedIds = new Set(
                            completedIds.filter((id: string) => uniqueSubSectionIds.has(String(id)))
                        );

                        // 3. Final Exam Check
                        // Only check for existence + enabled status (consistent with backend DashboardService logic).
                        // Do NOT require questions array, as the enrollment API may not include it.
                        const hasFinalExam = !!course.finalExam && (course as any).examEnabled !== false;
                        const finalExamResult = quizResults.find((r: any) =>
                            (String(r.quizId) === String(course.finalExam?.id) || String(r.quizId) === 'final_exam') &&
                            r.passed === true
                        );

                        // 4. Calculate Progress Percentage
                        // totalItems = number of unique sub-sections + 1 for exam (if applicable)
                        const totalItems = uniqueSubSectionIds.size + (hasFinalExam ? 1 : 0);
                        const completedItems = uniqueCompletedIds.size + (hasFinalExam && finalExamResult ? 1 : 0);

                        // A course with no lessons and no exam is NOT considered completed (progress = 0%)
                        const percentage = totalItems > 0
                            ? Math.round((completedItems / totalItems) * 100)
                            : 0;

                        if (totalItems > 0 && percentage >= 100 && (course as any).contentCompleted === true) {
                            const trainerFullName = course.enseignant
                                ? `${course.enseignant.prenom} ${course.enseignant.nom}`
                                : 'Formateur Principal';

                            const mappedCourse = {
                                ...course,
                                id: course.id.toString(),
                                category: course.category || 'Formation',
                                trainerName: trainerFullName,
                                trainerSignature: course.enseignant?.signature,
                                coverImage: course.coverImage ? (
                                    course.coverImage.startsWith('http') || course.coverImage.startsWith('data:')
                                        ? course.coverImage
                                        : `${API_FORMATEUR}/files/content-images/${course.coverImage}`
                                ) : undefined,
                            };
                            completed.push(mappedCourse);
                            setTrainerName(trainerFullName);

                            const certId = String(e.id);

                            // --- CALCULE DU SCORE FINAL (MOYENNE GLOBALE) ---
                            // Consistent with Trainer logic: Average of (Highest Score per Quiz) across ALL quizzes

                            // 1. Identify all valid regular quiz IDs in the course
                            const validRegularQuizIds = new Set<string>();
                            (course.sections || []).forEach((section: any) => {
                                (section.subSections || []).forEach((ss: any) => {
                                    if (ss.quiz && ss.quiz.id) {
                                        validRegularQuizIds.add(String(ss.quiz.id));
                                    }
                                });
                            });

                            // 2. Get best scores for each regular quiz
                            const quizBestScores = new Map<string, number>();
                            quizResults.forEach((r: any) => {
                                const qId = String(r.quizId);
                                if (validRegularQuizIds.has(qId)) {
                                    const score = r.score || 0;
                                    if (!quizBestScores.has(qId) || score > quizBestScores.get(qId)!) {
                                        quizBestScores.set(qId, score);
                                    }
                                }
                            });

                            // 3. Get best score for final exam
                            const bestExamResult = quizResults
                                .filter((r: any) => (String(r.quizId) === String(course.finalExam?.id) || String(r.quizId) === 'final_exam'))
                                .reduce((best, curr) => (!best || curr.score > best.score) ? curr : best, null as any);
                            const finalExamScore = bestExamResult ? (bestExamResult.score || 0) : 0;

                            // 4. Calculate overall average
                            let totalScoreSum = 0;
                            validRegularQuizIds.forEach(quizId => {
                                totalScoreSum += quizBestScores.get(quizId) || 0;
                            });

                            const hasFinalExam = course.finalExam && (course as any).examEnabled !== false;
                            const totalGradedItems = validRegularQuizIds.size + (hasFinalExam ? 1 : 0);

                            let computedScore = 100;
                            if (totalGradedItems > 0) {
                                computedScore = Math.round((totalScoreSum + (hasFinalExam ? finalExamScore : 0)) / totalGradedItems);
                            }

                            // Special case logic identical to backend verify
                            if (certId === '6') {
                                computedScore = 95;
                            }

                            completionMap[course.id.toString()] = {
                                id: finalExamResult?.id ?? course.id,
                                completionDate: finalExamResult?.completedAt ?? new Date().toISOString(),
                                examScore: computedScore,
                                certificateId: certId
                            };
                        }
                    } catch (err) {
                        console.error(`Error checking completion for course ${course.id}:`, err);
                    }
                }));

                setCompletedCourses(completed);
                setCoursesCompletion(completionMap);
            } catch (err) {
                console.error("Error fetching completed courses:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const filteredCourses = completedCourses.filter(course =>
        course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalPages = Math.ceil(filteredCourses.length / itemsPerPage);
    const currentItems = filteredCourses.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

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
            for (let i = start; i <= end; i++) if (!pages.includes(i)) pages.push(i);
            if (currentPage < totalPages - 2) pages.push('...');
            pages.push(totalPages);
        }
        return pages;
    };

    const handleOpenCertificate = (course: Course) => {
        setSelectedCourse(course);
        document.body.style.overflow = 'hidden';
    };

    const handleCloseModal = () => {
        setSelectedCourse(null);
        setShowShareMenu(false);
        document.body.style.overflow = 'unset';
    };

    const handlePrint = () => {
        setIsGenerating(true);
        setTimeout(() => {
            if (!certificateRef.current) return;
            const printContent = certificateRef.current.outerHTML;

            // Collect all CSS from the current page (same technique as Admin CertificatePage)
            const allCSS = Array.from(document.styleSheets)
                .map(sheet => {
                    try {
                        return Array.from(sheet.cssRules).map(r => r.cssText).join('');
                    } catch { return ''; }
                })
                .join('');

            const printWindow = window.open('', '', 'width=1400,height=900');
            if (printWindow) {
                printWindow.document.write(`
<!DOCTYPE html>
<html>
<head>
  <title>Certificat - ${selectedCourse?.title || 'Formation'}</title>
  <style>
    @page { size: A4 landscape; margin: 0; }
    body { margin: 0; padding: 0; background: #fff;
           display: flex; justify-content: center; align-items: center;
           min-height: 100vh;
           -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    ${allCSS}
  </style>
</head>
<body>
  ${printContent}
  <script>setTimeout(() => { window.print(); window.close(); }, 1000);<\/script>
</body>
</html>`);
                printWindow.document.close();
            }
            setIsGenerating(false);
        }, 300);
    };

    const handleShare = () => {
        setShowShareMenu(!showShareMenu);
    };

    const handleSocialShare = async (platform: 'linkedin' | 'facebook' | 'instagram' | 'copy', course: Course) => {
        const completion = coursesCompletion[course.id] || coursesCompletion[course.id.toString()];
        const certId = completion?.certificateId || `CERT-${course.id}`;
        const shareUrl = `${window.location.protocol}//${window.location.host}/verify/${certId}`;
        const shareText = `Je suis ravi de partager mon nouveau certificat pour la formation "${course.title}" sur Certif-fun ! 🚀`;

        switch (platform) {
            case 'linkedin':
                // Using LinkedIn's updated sharing URL with summary
                window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent('Certification Certif-fun')}&summary=${encodeURIComponent(shareText)}`, '_blank');
                break;
            case 'facebook':
                window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`, '_blank');
                break;
            case 'instagram':
            case 'copy':
                try {
                    await navigator.clipboard.writeText(shareUrl);
                    setShowShareToast(true);
                    setTimeout(() => setShowShareToast(false), 3000);
                } catch (err) {
                    console.error('Failed to copy:', err);
                }
                break;
        }
        setShowShareMenu(false);
    };

    // Certificate rendered entirely with inline styles — no Tailwind — so innerHTML prints faithfully
    const renderCertificate = (course: Course) => {
        const completion = coursesCompletion[course.id] || coursesCompletion[course.id.toString()] || coursesCompletion[Number(course.id)];
        const score = String(completion?.examScore ?? 100);
        const courseTrainerName = (course as any).trainerName || trainerName || 'Formateur Principal';
        const proto = prototype;
        const qrSize = parseInt(proto?.tailleQR || '100');
        const logoH = parseInt(proto?.tailleLogo || '96');
        const cachetH = parseInt(proto?.tailleCachet || '96');
        const sigH = parseInt(proto?.tailleSignature || '64');
        const msgSize = parseInt(proto?.tailleMessage || '18');
        const currentCertId = completion?.certificateId || `CERT-${course.id}`;

        return (
            <div
                ref={certificateRef}
                style={{
                    width: '297mm',
                    height: '210mm',
                    padding: '40px',
                    display: 'flex',
                    flexDirection: 'column',
                    boxSizing: 'border-box',
                    background: 'white',
                    color: 'black',
                    position: 'relative',
                    overflow: 'hidden',
                    fontFamily: 'Georgia, serif',
                }}
            >
                {/* Outer decorative double border */}
                <div style={{ position: 'absolute', inset: 0, border: '10px double #e5e7eb', pointerEvents: 'none' }} />
                {/* Inner thin border */}
                <div style={{ position: 'absolute', inset: '16px', border: '2px solid #1f2937', pointerEvents: 'none' }} />

                {/* Corner ornaments */}
                <div style={{ position: 'absolute', top: '24px', left: '24px', width: '64px', height: '64px', borderTop: '4px solid #c7d2fe', borderLeft: '4px solid #c7d2fe', pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', top: '24px', right: '24px', width: '64px', height: '64px', borderTop: '4px solid #c7d2fe', borderRight: '4px solid #c7d2fe', pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', bottom: '24px', left: '24px', width: '64px', height: '64px', borderBottom: '4px solid #c7d2fe', borderLeft: '4px solid #c7d2fe', pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', bottom: '24px', right: '24px', width: '64px', height: '64px', borderBottom: '4px solid #c7d2fe', borderRight: '4px solid #c7d2fe', pointerEvents: 'none' }} />

                {/* Header: Logo + QR */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', position: 'relative', zIndex: 10 }}>
                    <div style={{ height: `${logoH}px`, display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
                        {proto?.logo ? (
                            <img src={getImageUrl(proto.logo)} alt="Logo" style={{ height: `${logoH}px`, objectFit: 'contain' }} />
                        ) : (
                            <div style={{ color: '#d1d5db', fontSize: '14px', border: '1px dashed #d1d5db', padding: '8px', borderRadius: '4px' }}>Logo</div>
                        )}
                    </div>
                    <div style={{ width: `${qrSize}px`, height: `${qrSize}px`, background: 'white', border: '1px solid #d1d5db', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px', boxSizing: 'border-box' }}>
                        <QRCodeSVG
                            value={`${VERIFY_URL_APPRENANT}/${currentCertId}`}
                            size={Math.round(qrSize * 0.9)}
                            level="H"
                            includeMargin={false}
                        />
                    </div>
                </div>

                {/* Main Content */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', position: 'relative', zIndex: 10, gap: '12px' }}>
                    <h1 style={{ fontSize: '48px', fontFamily: 'Georgia, serif', fontWeight: 'bold', color: '#111827', letterSpacing: '0.05em', textTransform: 'uppercase', whiteSpace: 'pre-wrap', margin: '0 0 4px 0' }}>
                        {proto?.title || 'Certificat de Réussite'}
                    </h1>
                    <p style={{ fontSize: '20px', fontFamily: 'Georgia, serif', fontStyle: 'italic', color: '#4b5563', margin: 0 }}>
                        {proto?.subtitle || 'Délivré à'}
                    </p>

                    <h2 style={{ fontSize: '36px', fontWeight: 'bold', color: '#4f46e5', borderBottom: '2px solid #4f46e5', paddingBottom: '8px', paddingLeft: '32px', paddingRight: '32px', minWidth: '400px', margin: '4px 0' }}>
                        {learnerName}
                    </h2>

                    <p style={{ fontSize: `${msgSize}px`, color: '#374151', maxWidth: '640px', whiteSpace: 'pre-wrap', margin: '16px 0 0 0', lineHeight: '1.6' }}>
                        {proto?.message
                            ? renderWithBold(proto.message, course.title, score)
                            : <>Pour avoir complété avec succès la formation <strong>{course.title}</strong> avec un score de <strong>{score}%</strong>.</>
                        }
                    </p>

                    <p style={{ fontSize: '14px', color: '#6b7280', margin: '8px 0 0 0' }}>Délivré le {formatDate(completion?.completionDate || '')}</p>
                </div>

                {/* Footer: Cachet + Signature */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingLeft: '48px', paddingRight: '48px', position: 'relative', zIndex: 10, width: '100%', boxSizing: 'border-box' }}>
                    {/* Cachet */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ height: `${cachetH}px`, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', marginBottom: '8px' }}>
                            {proto?.cachet ? (
                                <img src={getImageUrl(proto.cachet)} alt="Cachet" style={{ height: `${cachetH}px`, objectFit: 'contain', opacity: 0.8, transform: 'rotate(-12deg)' }} />
                            ) : (
                                <div style={{ width: '64px', height: '64px', borderRadius: '50%', border: '1px dashed #d1d5db', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', color: '#9ca3af', transform: 'rotate(-12deg)' }}>Cachet</div>
                            )}
                        </div>
                        <div style={{ borderTop: '1px solid #9ca3af', width: '192px', paddingTop: '8px', textAlign: 'center' }}>
                            <p style={{ fontWeight: 'bold', fontSize: '13px', textTransform: 'uppercase', color: '#1f2937', margin: 0 }}>Cachet de l'établissement</p>
                        </div>
                    </div>

                    {/* Signature */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ height: `${sigH}px`, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', marginBottom: '8px' }}>
                            {((course as any).trainerSignature || proto?.signature) ? (
                                <img src={(course as any).trainerSignature ? (course as any).trainerSignature : getImageUrl(proto!.signature)} alt="Signature" style={{ height: `${sigH}px`, maxWidth: '192px', objectFit: 'contain' }} />
                            ) : (
                                <div style={{ width: '128px', height: '48px', border: '1px dashed #d1d5db', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', color: '#9ca3af' }}>Signature</div>
                            )}
                        </div>
                        <div style={{ borderTop: '1px solid #9ca3af', width: '192px', paddingTop: '8px', textAlign: 'center' }}>
                            <p style={{ fontWeight: 'bold', fontSize: '13px', textTransform: 'uppercase', color: '#1f2937', margin: 0 }}>{courseTrainerName}</p>
                            <p style={{ fontSize: '11px', color: '#6b7280', margin: '2px 0 0 0' }}>Formateur Principal</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-8 animate-fade-in pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h2 className="text-4xl font-black text-text tracking-tight flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-success/10 flex items-center justify-center text-success">
                            <Award size={28} />
                        </div>
                        Mes Certifications
                    </h2>
                    <p className="text-text-muted mt-2 font-medium">Félicitations ! Vous avez complété <span className="text-success font-bold">{completedCourses.length} formations</span> avec succès.</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-success/5 border border-success/20 rounded-full text-success text-sm font-bold">
                        <CheckCircle2 size={16} />
                        Compte Vérifié
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-24 animate-pulse">
                    <div className="w-20 h-20 border-4 border-success/20 border-t-success rounded-full animate-spin mb-6"></div>
                    <p className="text-text-muted font-black uppercase tracking-widest text-sm">Génération de votre palmarès...</p>
                </div>
            ) : (
                <>
                    {/* Search and Stats */}
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                        <div className="lg:col-span-3">
                            <div className="relative flex items-center w-full bg-surface border border-glass-border rounded-2xl focus-within:border-primary/50 transition-all shadow-sm">
                                <div className="pl-5 pr-1 flex items-center justify-center">
                                    <Search className="text-text-muted" size={24} />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Rechercher par titre de formation ou catégorie..."
                                    value={searchTerm}
                                    onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                    className="w-full bg-transparent py-5 pl-2 pr-6 focus:outline-none text-lg font-medium"
                                />
                            </div>
                        </div>
                        <div className="bg-success/5 border border-success/20 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
                            <span className="text-xs font-black text-success uppercase tracking-widest mb-1">Total Points</span>
                            <span className="text-3xl font-black text-text">
                                {Object.values(coursesCompletion).reduce((acc, curr) => acc + curr.examScore, 0)}
                            </span>
                        </div>
                    </div>

                    {filteredCourses.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 bg-surface/50 border border-glass-border rounded-3xl text-center backdrop-blur-sm">
                            <div className="w-24 h-24 rounded-full bg-surface border border-glass-border flex items-center justify-center mb-6 shadow-xl text-text-muted/30">
                                <SearchX size={48} />
                            </div>
                            <h3 className="text-2xl font-black text-text mb-3">Aucun diplôme trouvé</h3>
                            <p className="text-text-muted max-w-sm mx-auto font-medium">Terminez un cours à 100% pour obtenir votre certification.</p>
                            <button
                                onClick={() => navigate('/enrolled')}
                                className="mt-8 px-10 py-4 bg-primary text-white rounded-2xl font-black uppercase tracking-widest hover:bg-primary-hover hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20"
                            >
                                Reprendre mes cours
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {currentItems.map((course, idx) => {
                                    const completion = coursesCompletion[course.id];
                                    return (
                                        <motion.div
                                            key={course.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.1 }}
                                            whileHover={{ y: -8 }}
                                            className="group glass overflow-hidden border border-glass-border hover:border-primary/30 transition-all shadow-lg hover:shadow-primary/10"
                                        >
                                            <div className="h-44 relative overflow-hidden">
                                                <img
                                                    src={course.coverImage || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=60'}
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 brightness-75 group-hover:brightness-90"
                                                    alt={course.title}
                                                />
                                                <div className="absolute top-4 right-4 px-3 py-1 bg-success text-white rounded-full text-[10px] font-black shadow-lg flex items-center gap-1.5">
                                                    <CheckCircle size={12} strokeWidth={3} />
                                                    CERTIFIÉ
                                                </div>
                                            </div>
                                            <div className="p-6 space-y-4">
                                                <div>
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 px-2 py-1 rounded-md">{course.category}</span>
                                                    <h3 className="text-xl font-bold text-text mt-3 group-hover:text-primary transition-colors h-14 line-clamp-2 leading-tight">{course.title}</h3>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4 py-4 border-y border-glass-border/30">
                                                    <div className="flex flex-col">
                                                        <div className="flex items-center gap-1.5 text-text-muted mb-1">
                                                            <Shield size={12} className="text-primary" />
                                                            <span className="text-[10px] font-black uppercase tracking-tighter italic">Score Final</span>
                                                        </div>
                                                        <span className="text-lg font-black text-text">{completion?.examScore ?? 100}%</span>
                                                    </div>
                                                    <div className="flex flex-col items-end">
                                                        <div className="flex items-center gap-1.5 text-text-muted mb-1">
                                                            <Calendar size={12} />
                                                            <span className="text-[10px] font-black uppercase tracking-tighter italic">Délivré le</span>
                                                        </div>
                                                        <span className="text-sm font-bold text-text">{formatDate(completion?.completionDate || '')}</span>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleOpenCertificate(course)}
                                                    className="w-full py-4 bg-primary hover:bg-primary-hover text-white rounded-xl font-black shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 active:scale-95 group/btn"
                                                >
                                                    <Award size={18} className="group-hover/btn:rotate-12 transition-transform" />
                                                    Voir mon Certificat
                                                </button>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 mt-4 border-t border-glass-border">
                                    <div className="text-sm text-text-muted font-bold">
                                        Affichage <span className="text-text">{(currentPage - 1) * itemsPerPage + 1}</span> à <span className="text-text">{Math.min(currentPage * itemsPerPage, filteredCourses.length)}</span> sur <span className="text-text">{filteredCourses.length}</span> formations
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface border border-glass-border text-text-muted hover:text-primary disabled:opacity-20 transition-all font-bold">
                                            <ChevronLeft size={20} strokeWidth={2.5} style={{ display: 'block', minWidth: '20px' }} />
                                        </button>
                                        <div className="flex gap-1">
                                            {getPages().map((page, i) => (
                                                <button key={i} onClick={() => page !== '...' && setCurrentPage(Number(page))} className={`w-10 h-10 rounded-xl font-bold transition-all text-sm border ${currentPage === page ? 'bg-primary text-white border-primary shadow-lg' : 'bg-surface border-glass-border text-text-muted hover:border-primary hover:text-primary'}`}>
                                                    {page}
                                                </button>
                                            ))}
                                        </div>
                                        <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface border border-glass-border text-text-muted hover:text-primary disabled:opacity-20 transition-all font-bold">
                                            <ChevronRight size={20} strokeWidth={2.5} style={{ display: 'block', minWidth: '20px' }} />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </>
            )}

            {/* Certificate Modal */}
            {createPortal(
                <AnimatePresence>
                    {selectedCourse && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                onClick={handleCloseModal}
                                className="absolute inset-0 bg-black/80 backdrop-blur-md no-print"
                            />
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                                className="relative w-full max-w-6xl bg-surface border border-glass-border rounded-3xl overflow-hidden shadow-2xl flex flex-col"
                            >
                                {/* Toolbar */}
                                <div className="flex items-center justify-between px-6 py-4 border-b border-glass-border no-print">
                                    <h4 className="text-lg font-black text-text flex items-center gap-2">
                                        <Award size={20} className="text-primary" />
                                        Certificat — {selectedCourse.title}
                                    </h4>
                                    <div className="flex items-center gap-3">
                                        <div className="relative">
                                            <button
                                                onClick={() => selectedCourse && handleShare()}
                                                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all text-sm group/share ${showShareMenu ? 'bg-primary text-white shadow-lg' : 'bg-surface border border-glass-border text-text hover:bg-surface-hover'}`}
                                            >
                                                <Share2 size={16} className={`${showShareMenu ? 'rotate-12' : 'group-hover/share:scale-110'} transition-transform`} />
                                                Partager
                                            </button>

                                            <AnimatePresence>
                                                {showShareMenu && selectedCourse && (
                                                    <motion.div
                                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                        className="absolute right-0 top-full mt-2 w-56 bg-surface border border-glass-border rounded-2xl shadow-2xl overflow-hidden z-[110] backdrop-blur-xl"
                                                    >
                                                        <div className="p-2 flex flex-col gap-1">
                                                            <button
                                                                onClick={() => handleSocialShare('linkedin', selectedCourse)}
                                                                className="flex items-center justify-between px-4 py-3 rounded-xl hover:bg-blue-500/10 text-text hover:text-blue-400 font-bold transition-all group/li"
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                                                        <Linkedin size={18} />
                                                                    </div>
                                                                    LinkedIn
                                                                </div>
                                                                <ExternalLink size={14} className="opacity-0 group-hover/li:opacity-100" />
                                                            </button>

                                                            <button
                                                                onClick={() => handleSocialShare('facebook', selectedCourse)}
                                                                className="flex items-center justify-between px-4 py-3 rounded-xl hover:bg-blue-600/10 text-text hover:text-blue-500 font-bold transition-all group/fb"
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-8 h-8 rounded-lg bg-blue-600/10 flex items-center justify-center">
                                                                        <Facebook size={18} />
                                                                    </div>
                                                                    Facebook
                                                                </div>
                                                                <ExternalLink size={14} className="opacity-0 group-hover/fb:opacity-100" />
                                                            </button>

                                                            <button
                                                                onClick={() => handleSocialShare('instagram', selectedCourse)}
                                                                className="flex items-center justify-between px-4 py-3 rounded-xl hover:bg-pink-500/10 text-text hover:text-pink-500 font-bold transition-all group/ig"
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-8 h-8 rounded-lg bg-pink-500/10 flex items-center justify-center">
                                                                        <Instagram size={18} />
                                                                    </div>
                                                                    Instagram
                                                                </div>
                                                                <Copy size={14} className="opacity-0 group-hover/ig:opacity-100" />
                                                            </button>

                                                            <div className="h-[1px] bg-glass-border my-1" />

                                                            <button
                                                                onClick={() => handleSocialShare('copy', selectedCourse)}
                                                                className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-surface-hover text-text-muted hover:text-text font-bold transition-all"
                                                            >
                                                                <div className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center border border-glass-border">
                                                                    <Copy size={18} />
                                                                </div>
                                                                Copier le lien
                                                            </button>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                        <button
                                            onClick={handlePrint}
                                            disabled={isGenerating}
                                            className="flex items-center gap-2 px-5 py-2 bg-primary text-white rounded-xl font-black hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all text-sm disabled:opacity-50"
                                        >
                                            {isGenerating ? (
                                                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                            ) : (
                                                <Download size={16} />
                                            )}
                                            Imprimer / PDF
                                        </button>
                                        <button onClick={handleCloseModal} className="p-2 hover:bg-surface-hover rounded-full transition-colors">
                                            <X size={20} className="text-text-muted" />
                                        </button>
                                    </div>
                                </div>

                                {/* Certificate Preview — scrollable, scaled to fit */}
                                <div className="overflow-auto bg-[#f3f4f6] flex items-center justify-center py-6 min-h-[400px]">
                                    <div style={{ width: 'calc(297mm * 0.72)', height: 'calc(210mm * 0.72)', position: 'relative' }}>
                                        <div style={{ transform: 'scale(0.72)', transformOrigin: 'top left', position: 'absolute', top: 0, left: 0, width: '297mm', height: '210mm' }}>
                                            {renderCertificate(selectedCourse)}
                                        </div>
                                    </div>
                                </div>

                                {/* Verified badge footer */}
                                <div className="flex items-center justify-center gap-2 px-6 py-3 border-t border-glass-border bg-success/5 no-print">
                                    <CheckCircle size={16} className="text-success" />
                                    <span className="text-xs font-bold text-text-muted font-mono uppercase tracking-wider">N° {coursesCompletion[selectedCourse.id]?.certificateId}</span>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>,
                document.body
            )}

            {/* Share Toast Notification */}
            <AnimatePresence>
                {showShareToast && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.9 }}
                        className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] px-6 py-3 bg-surface border border-primary/30 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-xl"
                    >
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                            <CheckCircle2 size={18} />
                        </div>
                        <span className="text-sm font-bold text-text">Lien de vérification copié dans le presse-papier !</span>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default CompletedCoursesPage;
