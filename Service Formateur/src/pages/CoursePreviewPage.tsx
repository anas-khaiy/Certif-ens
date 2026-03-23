import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    ChevronUp,
    FileText,
    HelpCircle,
    PlayCircle,
    ArrowLeft,
    Clock,
    BookOpen,
    Trophy,
    Sun,
    Moon,
    Shield,
    AlertTriangle,
    CheckCircle,
    Lock,
    Play,
    Maximize,
    Monitor,
    Camera,
    Check,
    X,
    BarChart3,
    Bell
} from 'lucide-react';
import { createPortal } from 'react-dom';
import * as cocossd from '@tensorflow-models/coco-ssd';
import { useCourses } from '../hooks/useCourses';
import api from '../api/api-client';
import type { Course, Quiz, Question } from '../types';
import { YoloDetector } from '../utils/yoloDetector';
import type { YoloDetection } from '../utils/yoloDetector';

const CoursePreviewPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { getCourse } = useCourses();

    const [course, setCourse] = useState<Course | null>(null);
    const [activeSubSectionId, setActiveSubSectionId] = useState<string | null>(null);
    const [expandedSections, setExpandedSections] = useState<string[]>([]);
    const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 1024);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

    const [quizAnswers, setQuizAnswers] = useState<Record<string, any>>({});
    const [quizSubmitted, setQuizSubmitted] = useState(false);
    const [quizScore, setQuizScore] = useState(0);
    const [showScrollTop, setShowScrollTop] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const [theme, setTheme] = useState<'dark' | 'light'>(() => {
        return (localStorage.getItem('theme') as 'dark' | 'light') || 'dark';
    });

    const [isExamActive, setIsExamActive] = useState(false);
    const [examTimeLeft, setExamTimeLeft] = useState(3600);
    const [examFailed, setExamFailed] = useState<{ reason: string } | null>(null);
    const [examSubmitted, setExamSubmitted] = useState(false);
    const [examResult, setExamResult] = useState<{ score: number; total: number } | null>(null);
    const [examAnswers, setExamAnswers] = useState<Record<string, any>>({});
    const [showExamSetup, setShowExamSetup] = useState(false);
    const [isCameraRequested, setIsCameraRequested] = useState(false);
    const [isCameraReady, setIsCameraReady] = useState(false);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [detectionEngine, setDetectionEngine] = useState<'tfjs' | 'yolo' | 'python'>('tfjs');

    const [completedSubSections, setCompletedSubSections] = useState<string[]>([]);
    const [quizResults, setQuizResults] = useState<any[]>([]);
    const [quizPassError, setQuizPassError] = useState<string | null>(null);
    const [retakingQuizIds, setRetakingQuizIds] = useState<string[]>([]);
    const [violationCount, setViolationCount] = useState(0);
    const [violationWarning, setViolationWarning] = useState<string | null>(null);
    const examActiveRef = useRef(false);
    const examSubmittedRef = useRef(false);
    const examFailedRef = useRef(false);
    const hasEnteredFullscreenRef = useRef(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const setupStreamRef = useRef<MediaStream | null>(null);
    const [isModelLoading, setIsModelLoading] = useState(false);
    const detectionIntervalRef = useRef<any>(null);
    const [pythonDetections, setPythonDetections] = useState<any[]>([]);

    const [activeQuizQuestions, setActiveQuizQuestions] = useState<Question[]>([]);
    const [activeExamQuestions, setActiveExamQuestions] = useState<Question[]>([]);

    const sections = course?.sections || [];
    const flatSubSections = sections.flatMap(s => s.subSections || []);
    const activeSubSection = flatSubSections.find(ss => String(ss.id) === String(activeSubSectionId));

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

    const toggleSection = (sectionId: string) => {
        setExpandedSections(prev =>
            prev.includes(sectionId)
                ? prev.filter(id => id !== sectionId)
                : [...prev, sectionId]
        );
    };

    const goToSubSection = (subSectionId: string) => {
        setActiveSubSectionId(subSectionId);
        const section = sections.find(s => s.subSections.some(ss => ss.id === subSectionId));
        if (section && !expandedSections.includes(section.id)) {
            setExpandedSections(prev => [...prev, section.id]);
        }
        scrollToTop();
    };

    useEffect(() => {
        const initData = async () => {
            if (!id) return;
            const foundCourse = await getCourse(id);
            if (foundCourse) {
                setCourse(foundCourse);
                if (foundCourse.sections && foundCourse.sections.length > 0) {
                    const firstSection = foundCourse.sections[0];
                    setExpandedSections([firstSection.id]);
                    if (firstSection.subSections && firstSection.subSections.length > 0) {
                        setActiveSubSectionId(firstSection.subSections[0].id);
                    }
                }
            }
        };
        initData();
    }, [id, getCourse]);

    useEffect(() => {
        if (activeSubSection && !activeSubSection.quiz) {
            if (activeSubSectionId && !completedSubSections.includes(activeSubSectionId)) {
                setCompletedSubSections(prev => [...prev, activeSubSectionId]);
            }
        }
    }, [activeSubSectionId, activeSubSection]);

    useEffect(() => {
        setQuizAnswers({});
        setQuizSubmitted(false);
        setQuizScore(0);
        setQuizPassError(null);
    }, [activeSubSectionId]);

    useEffect(() => {
        if (activeSubSection?.quiz) {
            const quiz = activeSubSection.quiz;
            let questions = [...(quiz.questions || quiz.settings?.generatedPool || [])];
            if (quiz.settings?.isRandom) {
                questions = questions.sort(() => Math.random() - 0.5);
            }
            if (quiz.settings?.totalQuestions && quiz.settings.totalQuestions > 0) {
                questions = questions.slice(0, quiz.settings.totalQuestions);
            }
            setActiveQuizQuestions(questions);
        } else {
            setActiveQuizQuestions([]);
        }
    }, [activeSubSectionId, activeSubSection?.quiz?.id, retakingQuizIds]);

    useEffect(() => {
        if (isExamActive && course?.finalExam) {
            const quiz = course.finalExam;
            let questions = [...(quiz.questions || quiz.settings?.generatedPool || [])];
            if (quiz.settings?.isRandom) {
                questions = questions.sort(() => Math.random() - 0.5);
            }
            if (quiz.settings?.totalQuestions && quiz.settings.totalQuestions > 0) {
                questions = questions.slice(0, quiz.settings.totalQuestions);
            }
            setActiveExamQuestions(questions);
        }
    }, [isExamActive, course?.finalExam?.id]);


    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth < 1024;
            setIsMobile(mobile);
            if (!mobile) setIsSidebarOpen(true);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const scrollToTop = () => scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => setShowScrollTop(e.currentTarget.scrollTop > 300);

    const closeExamSetup = useCallback(() => {
        setShowExamSetup(false);
        setIsCameraRequested(false);
        setIsCameraReady(false);
        if (setupStreamRef.current) {
            setupStreamRef.current.getTracks().forEach(track => track.stop());
            setupStreamRef.current = null;
        }
    }, []);

    const stopAIDetection = useCallback(() => {
        if (detectionIntervalRef.current) {
            clearTimeout(detectionIntervalRef.current);
            clearInterval(detectionIntervalRef.current);
        }
        detectionIntervalRef.current = null;
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
    }, []);

    const triggerCheatingFailAction = useCallback((reason: string, immediate: boolean = false) => {
        if (!immediate && violationCount < 2) {
            setViolationCount(prev => prev + 1);
            setViolationWarning(`ATTENTION : ${reason} (${violationCount + 1}/3)`);
            setTimeout(() => setViolationWarning(null), 3000);
            return;
        }
        setExamFailed({ reason });
        examFailedRef.current = true;
        stopAIDetection();
        try { document.exitFullscreen(); } catch (_) { }
    }, [stopAIDetection, violationCount]);

    useEffect(() => { examActiveRef.current = isExamActive; }, [isExamActive]);
    useEffect(() => { examSubmittedRef.current = examSubmitted; }, [examSubmitted]);
    useEffect(() => { examFailedRef.current = !!examFailed; }, [examFailed]);

    const startAIDetection = async (triggerFail: (r: string) => void) => {
        if (!videoRef.current || examFailedRef.current) return;
        setIsModelLoading(true);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
            if (videoRef.current) videoRef.current.srcObject = stream;
            const model = await cocossd.load();
            setIsModelLoading(false);
            detectionIntervalRef.current = setInterval(async () => {
                if (!videoRef.current || examFailedRef.current || examSubmittedRef.current) return;
                const predictions = await model.detect(videoRef.current);
                if (predictions.some(p => p.class === 'cell phone' && p.score > 0.5)) {
                    triggerFail("DÉTECTION IA : Téléphone portable détecté.");
                }
            }, 2000);
        } catch (e) { setIsModelLoading(false); }
    };

    const startYoloAIDetection = async (triggerFail: (r: string) => void) => {
        if (!videoRef.current || examFailedRef.current) return;
        setIsModelLoading(true);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
            if (videoRef.current) videoRef.current.srcObject = stream;
            const detector = new YoloDetector();
            await detector.loadModel('/models/yolov8n.onnx');
            setIsModelLoading(false);
            const detectFrame = async () => {
                if (!examActiveRef.current || examFailedRef.current || examSubmittedRef.current || !videoRef.current) return;
                const predictions = await detector.detect(videoRef.current);
                if (predictions.some(p => p.class === 'cell phone' && p.score > 0.25)) {
                    triggerFail("DÉTECTION YOLO : Téléphone portable détecté.");
                    return;
                }
                detectionIntervalRef.current = setTimeout(detectFrame, 1500);
            };
            detectFrame();
        } catch (e) { setIsModelLoading(false); setDetectionEngine('tfjs'); }
    };

    const startPythonAIDetection = async (triggerFail: (r: string) => void) => {
        if (!videoRef.current || examFailedRef.current) return;
        setIsModelLoading(true);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
            if (videoRef.current) videoRef.current.srcObject = stream;
            setIsModelLoading(false);
            const canvas = document.createElement('canvas');
            canvas.width = 640; canvas.height = 480;
            const ctx = canvas.getContext('2d');
            const detectFrame = async () => {
                if (!examActiveRef.current || examFailedRef.current || examSubmittedRef.current || !videoRef.current || !ctx) return;
                ctx.drawImage(videoRef.current, 0, 0, 640, 480);
                canvas.toBlob(async (blob) => {
                    if (!blob) return;
                    const formData = new FormData();
                    formData.append('file', blob, 'frame.jpg');
                    try {
                        const res = await fetch('http://localhost:8000/detect', { method: 'POST', body: formData });
                        const data = await res.json();
                        setPythonDetections(data.detections || []);
                        if (data.phone_detected || data.multiple_persons_detected || data.forbidden_object_detected) {
                            triggerFail("DÉTECTION SERVEUR : Tentative de triche détectée.");
                        }
                    } catch (e) { }
                }, 'image/jpeg', 0.7);
                detectionIntervalRef.current = setTimeout(detectFrame, 2000);
            };
            detectFrame();
        } catch (e) { setIsModelLoading(false); setDetectionEngine('tfjs'); }
    };

    useEffect(() => {
        const settings = course?.finalExam?.settings;
        if (isExamActive && settings?.isAiDetectionEnabled && !examSubmittedRef.current && !examFailedRef.current) {
            if (detectionEngine === 'yolo') startYoloAIDetection(triggerCheatingFailAction);
            else if (detectionEngine === 'python') startPythonAIDetection(triggerCheatingFailAction);
            else startAIDetection(triggerCheatingFailAction);
        } else stopAIDetection();
        return () => stopAIDetection();
    }, [isExamActive, triggerCheatingFailAction, detectionEngine, course?.finalExam?.settings?.isAiDetectionEnabled, stopAIDetection]);

    useEffect(() => {
        if (!isExamActive || examSubmitted || !!examFailed) return;
        const prevent = (e: Event) => e.preventDefault();
        const handleVisibility = () => { if (document.hidden) triggerCheatingFailAction("Triche : Changement d'onglet."); };
        const handleBlur = () => triggerCheatingFailAction("Triche : Sortie de fenêtre.");
        const handleFullscreen = () => { if (!document.fullscreenElement && hasEnteredFullscreenRef.current) triggerCheatingFailAction("Triche : Sortie plein écran."); else if (document.fullscreenElement) hasEnteredFullscreenRef.current = true; };
        
        document.addEventListener('visibilitychange', handleVisibility);
        window.addEventListener('blur', handleBlur);
        document.addEventListener('fullscreenchange', handleFullscreen);
        document.addEventListener('contextmenu', prevent);
        document.addEventListener('copy', prevent);
        document.addEventListener('cut', prevent);
        document.addEventListener('paste', prevent);
        return () => {
            document.removeEventListener('visibilitychange', handleVisibility);
            window.removeEventListener('blur', handleBlur);
            document.removeEventListener('fullscreenchange', handleFullscreen);
            document.removeEventListener('contextmenu', prevent);
            document.removeEventListener('copy', prevent);
            document.removeEventListener('cut', prevent);
            document.removeEventListener('paste', prevent);
        };
    }, [isExamActive, examSubmitted, examFailed, triggerCheatingFailAction]);

    useEffect(() => {
        if (!isExamActive || examSubmitted || examFailed) return;
        const timer = setInterval(() => {
            setExamTimeLeft(prev => {
                if (prev <= 1) { triggerCheatingFailAction("Temps écoulé."); clearInterval(timer); return 0; }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [isExamActive, examSubmitted, examFailed, triggerCheatingFailAction]);

    const handleAnswerQuiz = (qId: string, ans: any) => setQuizAnswers(p => ({ ...p, [qId]: ans }));
    const handleAnswerExam = (qId: string, ans: any) => setExamAnswers(p => ({ ...p, [qId]: ans }));

    const handleSubmitQuiz = (quiz: Quiz) => {
        const questions = isExamActive ? activeExamQuestions : activeQuizQuestions;
        let score = 0;
        questions.forEach(q => {
            const ans = isExamActive ? examAnswers[q.id] : quizAnswers[q.id];
            if (q.type === 'QCU') { if (ans === q.options[q.correctAnswers[0]]) score++; }
            else if (q.type === 'QCM') {
                const corrects = q.correctAnswers.map(i => q.options[i]);
                const ansArr = Array.isArray(ans) ? ans : [];
                if (corrects.length === ansArr.length && corrects.every(c => ansArr.includes(c))) score++;
            } else if (q.type === 'OPEN' && ans?.trim()) score++;
        });

        const total = questions.length;
        const percent = total > 0 ? (score / total) * 100 : 0;
        const roundedScore = Math.round(percent);

        if (isExamActive) { 
            setExamResult({ score, total }); 
            setExamSubmitted(true);
            setQuizResults(prev => [...prev.filter(r => r.quizId !== 'final_exam'), { quizId: 'final_exam', score: roundedScore, passed: roundedScore >= (quiz.settings?.passingScore || 70) }]);
        }
        else {
            setQuizScore(score); 
            setQuizSubmitted(true);
            const passing = quiz.settings?.passingScore || 70;
            const isPassed = percent >= passing || questions.some(q => q.type === 'OPEN');
            
            if (isPassed) {
                if (activeSubSectionId && !completedSubSections.includes(activeSubSectionId)) setCompletedSubSections(p => [...p, activeSubSectionId]);
                setQuizPassError(null);
            } else setQuizPassError(`Score requis: ${passing}% | Votre score: ${Math.round(percent)}%`);
            
            setQuizResults(prev => [...prev.filter(r => r.quizId !== (quiz.id || 'default')), { quizId: quiz.id || 'default', score: roundedScore, passed: isPassed }]);
        }
    };

    const getYouTubeEmbedUrl = (url: string) => {
        if (!url) return null;
        const regExp = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?|shorts|live)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
        const match = url.match(regExp);
        return match ? `https://www.youtube.com/embed/${match[1]}` : null;
    };

    const startExam = async () => {
        setShowExamSetup(false);
        setIsCameraRequested(false);
        setExamAnswers({});
        setExamSubmitted(false);
        setExamFailed(null);
        hasEnteredFullscreenRef.current = false;
        const limit = course?.finalExam?.settings?.timeLimit ?? 60;
        setExamTimeLeft(limit * 60);
        setIsExamActive(true);

        const el = document.documentElement as any;
        try {
            if (el.requestFullscreen) await el.requestFullscreen();
            else if (el.webkitRequestFullscreen) await el.webkitRequestFullscreen();
        } catch (e) { console.error("Fullscreen error:", e); }
    };

    if (!course) return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center bg-background">
            <BookOpen size={48} className="text-primary mb-4" />
            <h2 className="text-2xl font-bold">Cours non trouvé</h2>
            <button onClick={() => navigate('/courses')} className="mt-4 px-6 py-2 bg-primary text-white rounded-xl font-bold flex items-center gap-2 transition-all hover:scale-105"><ArrowLeft size={20} /> Retour</button>
        </div>
    );

    return (
        <div className="flex h-screen bg-background overflow-hidden relative font-sans text-text">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className={`fixed top-4 z-[60] p-2 bg-surface border border-glass-border rounded-xl text-primary flex items-center justify-center shadow-xl transition-all duration-300 active:scale-95 ${isSidebarOpen ? 'left-[290px]' : 'left-4'}`}><ChevronLeft size={20} className={!isSidebarOpen ? 'rotate-180' : ''}/></button>

            {isMobile && isSidebarOpen && <div className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />}

            <aside className={`fixed inset-y-0 left-0 z-50 w-[280px] sm:w-80 bg-surface border-r border-glass-border transform transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="flex flex-col h-full overflow-hidden">
                    <div className="p-6 border-b border-glass-border bg-surface/50">
                        <div className="flex items-center justify-between gap-4 mb-6">
                            <button onClick={() => navigate('/courses')} className="flex items-center gap-2 group/back">
                                <div className="w-10 h-10 flex items-center justify-center bg-surface-hover/80 hover:bg-primary text-text hover:text-white rounded-xl transition-all"><ArrowLeft size={20} /></div>
                                <span className="text-xs font-black uppercase text-text-muted group-hover/back:text-primary">Retour</span>
                            </button>
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-lg border border-primary/20"><span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse"/><span className="text-[10px] font-black uppercase text-primary">Aperçu Formateur</span></div>
                        </div>
                        <h2 className="font-black text-xl line-clamp-2 text-text text-left">{course.title}</h2>
                        {course.deadlineDate && (
                            <div className="mt-3 flex items-center gap-2 px-3 py-1.5 bg-white border border-amber-500/20 rounded-lg shadow-sm">
                                <Clock size={12} className="text-amber-500" />
                                <span className="text-[10px] font-black uppercase text-amber-500 tracking-wider">
                                    Date Limite: {new Date(course.deadlineDate).toLocaleDateString()}
                                </span>
                            </div>
                        )}
                        {course.reminderDays && (
                            <div className="mt-2 flex items-center gap-2 px-3 py-1.5 bg-white border border-primary/20 rounded-lg shadow-sm">
                                <Bell size={12} className="text-primary" />
                                <span className="text-[10px] font-black uppercase text-primary tracking-wider">
                                    Rappel: Tous les {course.reminderDays} {course.reminderDays > 1 ? 'jours' : 'jour'}
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
                        {sections.map((section, idx) => (
                            <div key={section.id} className="space-y-2">
                                <button onClick={() => toggleSection(section.id)} className="w-full flex items-center justify-between p-4 rounded-xl hover:bg-surface-hover/50 transition-all font-bold text-sm text-left gap-4">
                                    <div className="flex items-center gap-3 truncate">
                                        <div className="w-8 h-8 rounded-lg bg-surface-hover flex items-center justify-center text-xs font-black shrink-0">{idx + 1}</div>
                                            <div className="flex flex-col truncate">
                                                <span className="truncate">{section.title}</span>
                                                <span className="text-[10px] font-medium text-primary flex items-center gap-1 mt-0.5">
                                                    <Clock size={10} /> {section.masseHoraire ? (section.masseHoraire.toLowerCase().includes('h') ? section.masseHoraire : `${section.masseHoraire}h`) : "1h"}
                                                </span>
                                            </div>
                                    </div>
                                    <ChevronDown size={16} className={`shrink-0 transition-transform ${expandedSections.includes(section.id) ? 'rotate-180' : ''}`}/>
                                </button>
                                {expandedSections.includes(section.id) && (
                                    <div className="pl-11 space-y-1">
                                        {section.subSections?.map((sub, sIdx) => {
                                            const isActive = activeSubSectionId === sub.id;
                                            const isCompleted = completedSubSections.includes(sub.id);
                                            return (
                                                <button key={sub.id} onClick={() => { goToSubSection(sub.id); if (isMobile) setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 p-3 rounded-lg text-sm text-left transition-all ${isActive ? 'bg-primary/10 text-primary font-bold' : 'text-text-muted hover:bg-surface-hover/30'}`}>
                                                    <div className="shrink-0">{isCompleted ? <CheckCircle size={14} className="text-success" /> : (sub.videoUrl || sub.videoUrls?.length ? <PlayCircle size={14} /> : <FileText size={14} />)}</div>
                                                    <span className="truncate flex-1">{sub.title || `Leçon ${sIdx + 1}`}</span>
                                                    {sub.quiz && quizResults.some(r => String(r.quizId) === String(sub.quiz?.id)) && (
                                                        <div className="flex items-center gap-1 px-1.5 py-0.5 bg-success/10 text-success rounded text-[10px] font-black shrink-0">
                                                            <Trophy size={8} /> {quizResults.find(r => String(r.quizId) === String(sub.quiz?.id))?.score}%
                                                        </div>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {course.finalExam && (
                        <div className="p-4 border-t border-glass-border bg-surface">
                            {(() => {
                                const examRes = quizResults.find(r => r.quizId === 'final_exam');
                                const isDone = !!examRes;
                                return (
                                    <button onClick={() => { if(!isDone) setShowExamSetup(true); }} disabled={isDone} className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all group/exam ${isDone ? 'bg-success/5 border-success/20' : 'bg-primary/5 border border-primary/20 hover:bg-primary/10'}`}>
                                        <div className={`w-12 h-12 rounded-xl shadow-lg flex items-center justify-center transition-transform ${isDone ? 'bg-success text-white' : 'bg-primary text-white group-hover/exam:scale-110'}`}>{isDone ? <CheckCircle size={24} /> : <Shield size={24} />}</div>
                                        <div className="flex-1 text-left">
                                            <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${isDone ? 'bg-success/10 text-success' : 'bg-primary/10 text-primary'}`}>{isDone ? 'Complété' : 'Certifiant'}</span>
                                            <h4 className={`font-black text-sm truncate ${isDone ? 'text-text/70' : 'text-text'}`}>Examen Final</h4>
                                            {isDone && <p className="text-[10px] font-bold text-success">Note: {examRes.score}%</p>}
                                        </div>
                                        {!isDone && <ChevronRight size={18} className="text-primary" />}
                                    </button>
                                );
                            })()}
                        </div>
                    )}
                </div>
            </aside>

            <main className={`flex-1 flex flex-col h-full relative overflow-hidden bg-background transition-all duration-300 ${isSidebarOpen ? 'lg:ml-80' : 'ml-0'}`}>
                <div className="flex-1 overflow-y-auto custom-scrollbar" ref={scrollRef} onScroll={handleScroll}>
                    {!activeSubSection ? (
                        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center min-h-full max-w-2xl mx-auto">
                            {course.finalExam ? (
                                <div className="bg-surface border border-glass-border rounded-[2.5rem] p-10 sm:p-16 shadow-2xl relative overflow-hidden group w-full animate-fade-in">
                                    <div className="relative z-10 flex flex-col items-center gap-8">
                                        <div className="w-24 h-24 rounded-3xl bg-primary text-white flex items-center justify-center shadow-2xl transition-transform group-hover:scale-110"><Shield size={48} /></div>
                                        <div className="space-y-4">
                                            <span className="text-xs font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full bg-primary/10 text-primary">Aperçu Examen</span>
                                            <h1 className="text-3xl sm:text-4xl font-black tracking-tight">{course.finalExam.title || "Examen Final"}</h1>
                                            <p className="text-text-muted text-lg max-w-md mx-auto font-medium">Testez l'expérience de l'examen final tel que l'apprenant le verra.</p>
                                        </div>
                                        <button onClick={() => setShowExamSetup(true)} className="px-10 py-5 bg-primary text-white rounded-2xl text-lg font-bold shadow-2xl flex items-center gap-3 hover:scale-105 transition-all"><Play size={24} /> Lancer l'examen</button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <BookOpen size={48} className="text-primary/20 mb-4 animate-pulse" />
                                    <h3 className="text-xl font-bold">Sélectionnez une leçon</h3>
                                </>
                            )}
                        </div>
                    ) : (
                        <div className="p-6 md:p-12 pb-32 animate-fade-in flex flex-col items-center">
                            <div className="w-full max-w-4xl space-y-10">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest"><Clock size={14} /> Leçon active</div>
                                    <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">{activeSubSection.title}</h1>
                                </div>

                                {(activeSubSection.videoUrl || activeSubSection.videoUrls?.length) && (
                                    <div className="grid grid-cols-1 gap-6">
                                        {(activeSubSection.videoUrls?.length ? activeSubSection.videoUrls : [activeSubSection.videoUrl!]).map((url, vIdx) => {
                                            const embed = getYouTubeEmbedUrl(url);
                                            return embed && <div key={vIdx} className="aspect-video rounded-3xl overflow-hidden shadow-2xl border border-glass-border bg-black"><iframe src={embed} className="w-full h-full" allowFullScreen title="Video"/></div>;
                                        })}
                                    </div>
                                )}

                                {activeSubSection.content && <div className="bg-surface border border-glass-border rounded-[2.5rem] shadow-xl overflow-hidden p-8 sm:p-12 text-text rich-content-area" dangerouslySetInnerHTML={{ __html: activeSubSection.content }} />}

                                {activeSubSection.quiz && (
                                    <div className="bg-primary/5 border border-primary/20 rounded-3xl p-6 sm:p-10 shadow-inner text-text">
                                        <div className="flex items-center gap-4 mb-8">
                                            <div className="p-3 bg-primary text-white rounded-2xl shadow-lg shadow-primary/20"><HelpCircle size={24} /></div>
                                            <h2 className="text-xl sm:text-2xl font-black">{activeSubSection.quiz.title || "Quiz"}</h2>
                                        </div>
                                        
                                        {(() => {
                                            const best = quizResults.find(r => r.quizId === activeSubSection.quiz?.id);
                                            const isRetaking = activeSubSection.quiz?.id && retakingQuizIds.includes(String(activeSubSection.quiz.id));

                                            if (!quizSubmitted && best && !isRetaking) return (
                                                <div className="text-left py-10 bg-surface/50 rounded-2xl border p-8">
                                                    <Trophy size={48} className="text-success mb-4" />
                                                    <h3 className="text-2xl font-black mb-2">Quiz complété (Aperçu)</h3>
                                                    <p className="text-lg font-bold mb-6">Meilleur score : <span className="text-primary">{best.score}%</span></p>
                                                    <button onClick={() => setRetakingQuizIds(p => [...p, String(activeSubSection.quiz?.id)])} className="px-8 py-3 bg-primary text-white rounded-xl font-bold">Recommencer</button>
                                                </div>
                                            );

                                            return !quizSubmitted ? (
                                                <div className="space-y-8">
                                                    {activeQuizQuestions.map((q, qIdx) => (
                                                        <div key={q.id} className="space-y-4">
                                                            <div className="flex gap-3"><span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">{qIdx + 1}</span><h3 className="font-bold text-lg">{q.text}</h3></div>
                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-9">
                                                                {q.type === 'OPEN' ? (
                                                                    <textarea className="w-full input sm:col-span-2 min-h-[100px]" placeholder="Réponse..." value={quizAnswers[q.id] || ''} onChange={(e) => handleAnswerQuiz(q.id, e.target.value)} />
                                                                ) : (
                                                                    q.options?.map((opt, oIdx) => {
                                                                        const sel = q.type === 'QCM' ? (quizAnswers[q.id] || []).includes(opt) : quizAnswers[q.id] === opt;
                                                                        return (
                                                                            <button
                                                                                key={oIdx}
                                                                                onClick={() => q.type === 'QCM' ? handleAnswerQuiz(q.id, (quizAnswers[q.id] || []).includes(opt) ? quizAnswers[q.id].filter((i:any)=>i!==opt) : [...(quizAnswers[q.id]||[]), opt]) : handleAnswerQuiz(q.id, opt)}
                                                                                className={`p-5 rounded-2xl border-2 transition-all text-left text-sm font-bold flex items-center justify-between group-option ${sel ? 'border-primary bg-primary/10 text-primary shadow-lg shadow-primary/5' : 'border-glass-border bg-surface hover:border-primary/30 hover:bg-primary/5 text-text'}`}
                                                                            >
                                                                                <span>{opt}</span>
                                                                                {sel && (
                                                                                    <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center animate-fade-in shadow-lg shadow-primary/20">
                                                                                        <CheckCircle size={14} className="text-white" />
                                                                                    </div>
                                                                                )}
                                                                            </button>
                                                                        );
                                                                    })
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                    <button onClick={() => activeSubSection.quiz && handleSubmitQuiz(activeSubSection.quiz)} disabled={!Object.keys(quizAnswers).length} className="px-10 py-3.5 bg-primary text-white rounded-xl font-bold shadow-lg">Valider</button>
                                                </div>
                                            ) : (
                                                <div className="text-center py-10 bg-surface/50 rounded-2xl border p-8">
                                                    <Trophy size={64} className="text-primary mx-auto mb-4" />
                                                    <h3 className="text-2xl font-black mb-2">Terminé !</h3>
                                                    <p className="text-lg font-bold">Score : <span className="text-primary">{Math.round((quizScore / activeQuizQuestions.length) * 100)}%</span></p>
                                                    {quizPassError ? <div className="mt-4 p-4 bg-error/10 text-error rounded-xl flex items-center gap-2 justify-center"><AlertTriangle size={20}/> {quizPassError}</div> : <div className="mt-4 p-4 bg-success/10 text-success rounded-xl">Leçon Validée !</div>}
                                                    <button onClick={() => {setQuizSubmitted(false); setQuizAnswers({}); setRetakingQuizIds(p => [...p, String(activeSubSection.quiz?.id)]);}} className="mt-6 text-primary font-black flex items-center gap-2 mx-auto"><Trophy size={14} /> Recommencer</button>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                )}

                                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-10 border-t border-glass-border">
                                    <button onClick={() => {const idx = flatSubSections.findIndex(ss=>ss.id===activeSubSectionId); if(idx>0) goToSubSection(flatSubSections[idx-1].id); }} disabled={flatSubSections.findIndex(ss=>ss.id===activeSubSectionId)<=0} className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-surface border font-bold disabled:opacity-30"><ChevronLeft size={20}/> Précédent</button>
                                    <button onClick={() => {const idx = flatSubSections.findIndex(ss=>ss.id===activeSubSectionId); if(idx < flatSubSections.length-1) goToSubSection(flatSubSections[idx+1].id); }} disabled={!activeSubSectionId || flatSubSections.findIndex(ss=>ss.id===activeSubSectionId)>=flatSubSections.length-1} className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 bg-primary text-white rounded-xl font-bold shadow-lg disabled:opacity-30">Suivant <ChevronRight size={20}/></button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            <div className="fixed bottom-6 right-6 z-[60] flex flex-col gap-3">
                <button onClick={scrollToTop} className={`p-4 bg-surface border border-glass-border rounded-2xl text-primary shadow-2xl transition-all ${showScrollTop ? 'opacity-100' : 'opacity-0'}`}><ChevronUp size={24}/></button>
                <button onClick={toggleTheme} className="p-4 bg-primary text-white rounded-2xl shadow-lg transition-all">{theme === 'dark' ? <Sun size={24}/> : <Moon size={24}/>}</button>
            </div>

            {showExamSetup && createPortal(
                <div className="fixed inset-0 z-[1000] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4">
                    <div className={`w-full ${course.finalExam?.settings?.isAiDetectionEnabled ? 'max-w-4xl' : 'max-w-md'} bg-surface rounded-[2rem] border border-glass-border shadow-2xl overflow-hidden flex flex-col lg:flex-row relative group`}>
                        <button onClick={closeExamSetup} className="absolute top-6 right-6 z-50 p-3 bg-white/5 hover:bg-white/10 text-white/50 hover:text-white rounded-2xl border border-white/10 transition-all"><X size={20}/></button>
                        
                        {/* Left: Security Preview Section */}
                        {course.finalExam?.settings?.isAiDetectionEnabled && (
                            <div className="w-full lg:w-[45%] p-8 sm:p-12 bg-black flex flex-col items-center justify-center relative border-r border-white/5">
                                <div className="absolute top-8 left-8 flex items-center gap-3">
                                    <div className={`w-2 h-2 rounded-full ${isCameraReady ? 'bg-success animate-pulse' : 'bg-amber-500'}`} />
                                    <span className="text-[10px] font-black uppercase text-white/50 tracking-[0.2em]">Sécurité Bio-Visuelle</span>
                                </div>

                                {!isCameraRequested ? (
                                    <div className="text-center py-10">
                                        <div className="w-24 h-24 bg-primary/10 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 border border-primary/20 shadow-inner">
                                            <Camera size={44} className="text-primary" />
                                        </div>
                                        <h3 className="text-white text-2xl font-black mb-4">Caméra Requise</h3>
                                        <p className="text-white/50 text-sm font-medium leading-relaxed mb-10 max-w-[280px] mx-auto">
                                            Testez l'activation de la surveillance IA comme un apprenant.
                                        </p>
                                        <button onClick={() => setIsCameraRequested(true)} className="px-10 py-5 bg-primary text-white font-black rounded-2xl shadow-2xl hover:scale-105 active:scale-95 transition-all text-sm uppercase tracking-wider">Activer la Caméra</button>
                                    </div>
                                ) : (
                                    <div className="w-full h-full flex flex-col justify-center py-6">
                                        <div className="w-full aspect-video rounded-3xl overflow-hidden border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] bg-surface/5 flex items-center justify-center relative group mb-6">
                                            <video ref={(el) => { if (el && !el.srcObject) navigator.mediaDevices.getUserMedia({ video: true }).then(s => { el.srcObject = s; setupStreamRef.current = s; setIsCameraReady(true); }); }} autoPlay playsInline muted className="w-full h-full object-cover" />
                                            {isCameraReady && (
                                                <div className="absolute bottom-4 left-4 right-4 py-3 px-4 bg-success/20 backdrop-blur-md border border-success/30 rounded-2xl flex items-center justify-center gap-2">
                                                    <CheckCircle size={16} className="text-success" />
                                                    <span className="text-[11px] font-black text-white uppercase">Flux vidéo validé</span>
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-white/30 text-[10px] font-bold text-center uppercase tracking-[0.2em]">Aperçu de la surveillance formateur</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Right: Rules & Final Action Section */}
                        <div className={`w-full ${course.finalExam?.settings?.isAiDetectionEnabled ? 'lg:w-[55%]' : 'w-full'} p-10 sm:p-16 flex flex-col justify-between text-text bg-surface relative shadow-2xl`}>
                            <div>
                                <div className="flex items-center gap-4 mb-10">
                                    <div className="p-4 bg-primary/10 text-primary rounded-2xl shadow-inner border border-primary/10"><Shield size={32} /></div>
                                    <div>
                                        <h2 className="text-4xl font-black tracking-tight leading-none mb-2">Aperçu Examen</h2>
                                        <p className="text-sm text-text-muted font-bold tracking-tight">Configuration telle qu'elle apparaîtra à l'élève.</p>
                                    </div>
                                </div>

                                {/* Premium Rules Row - Right Aligned Style */}
                                <div className="flex flex-col items-end gap-3 mb-8">
                                    <div className="flex flex-wrap justify-end gap-3">
                                        <div className="px-4 py-2 bg-primary/10 border border-primary/20 rounded-xl flex items-center gap-2 shadow-sm">
                                            <Maximize size={14} className="text-primary" />
                                            <span className="text-[10px] font-black uppercase tracking-wider text-primary">Plein Écran</span>
                                        </div>
                                        <div className="px-4 py-2 bg-primary/10 border border-primary/20 rounded-xl flex items-center gap-2 shadow-sm">
                                            <Monitor size={14} className="text-primary" />
                                            <span className="text-[10px] font-black uppercase tracking-wider text-primary">{course.finalExam?.settings?.isAiDetectionEnabled ? 'Surveillance IA' : 'Sans Caméra'}</span>
                                        </div>
                                        <div className="px-4 py-2 bg-primary/10 border border-primary/20 rounded-xl flex items-center gap-2 shadow-sm">
                                            <Clock size={14} className="text-primary" />
                                            <span className="text-[10px] font-black uppercase tracking-wider text-primary">{course.finalExam?.settings?.timeLimit || 60} Minutes</span>
                                        </div>
                                    </div>
                                    <div className="w-24 h-1 bg-gradient-to-l from-primary to-transparent rounded-full opacity-30 mt-1" />
                                </div>

                                {/* Condensed Table de Spécification - Right Aligned Labels */}
                                <div className="mb-8 overflow-hidden rounded-3xl border border-glass-border bg-surface/30 shadow-inner">
                                    <div className="px-6 py-3 bg-primary/5 border-b border-glass-border flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <BarChart3 size={16} className="text-primary" />
                                            <span className="text-[11px] font-black uppercase tracking-[0.15em] text-primary">Répartition</span>
                                        </div>
                                        <span className="text-[9px] font-bold text-text-muted uppercase">Objectifs calculés</span>
                                    </div>
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-surface/50 text-[9px] font-black uppercase tracking-widest text-text-muted/60 border-b border-glass-border/30">
                                                <th className="py-3 pl-6">Chapitre</th>
                                                <th className="py-3 text-right">Poids</th>
                                                <th className="py-3 text-right pr-6">Nb. Questions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-glass-border/10">
                                            {(() => {
                                                const parseMH = (str?: string) => {
                                                    if (!str) return 1;
                                                    const val = parseFloat(str.replace(/[^\d.]/g, '').replace(',', '.'));
                                                    return val > 0 ? val : 1;
                                                };
                                                const sectionsWithWeight = (course?.sections || []).filter(s => s.subSections?.some(ss => ss.quiz?.questions?.length || ss.quiz?.settings?.generatedPool?.length));
                                                const totalMH = sectionsWithWeight.reduce((sum, s) => sum + parseMH(s.masseHoraire), 0);
                                                const totalQuestions = course?.finalExam?.settings?.totalQuestions || 20;

                                                // 1. Calculate ideal counts and floors
                                                const items = sectionsWithWeight.map(section => {
                                                    const mh = parseMH(section.masseHoraire);
                                                    const ideal = totalMH > 0 ? (mh / totalMH) * totalQuestions : 0;
                                                    return {
                                                        section,
                                                        ideal,
                                                        floor: Math.floor(ideal),
                                                        remainder: ideal - Math.floor(ideal),
                                                        weight: totalMH > 0 ? (mh / totalMH) * 100 : 0
                                                    };
                                                });

                                                // 2. Distribute remaining questions using Largest Remainder Method (Hamilton)
                                                let currentTotal = items.reduce((sum, item) => sum + item.floor, 0);
                                                const remaining = totalQuestions - currentTotal;

                                                if (remaining > 0) {
                                                    const sortedByRemainder = [...items]
                                                        .map((item, index) => ({ ...item, originalIndex: index }))
                                                        .sort((a, b) => b.remainder - a.remainder || a.originalIndex - b.originalIndex);

                                                    for (let i = 0; i < remaining; i++) {
                                                        const targetIndex = sortedByRemainder[i].originalIndex;
                                                        items[targetIndex].floor += 1;
                                                    }
                                                }

                                                return items.map(item => (
                                                    <tr key={item.section.id} className="text-[11px] font-bold text-text hover:bg-primary/5 transition-colors">
                                                        <td className="py-3 pl-6 truncate max-w-[140px]" title={item.section.title}>{item.section.title}</td>
                                                        <td className="py-3 text-right text-primary font-black">{Math.round(item.weight)}%</td>
                                                        <td className="py-3 text-right pr-6 font-black text-xs">{item.floor}</td>
                                                    </tr>
                                                ));
                                            })()}
                                        </tbody>
                                        <tfoot className="bg-primary/5 border-t border-glass-border">
                                            <tr className="text-[11px] font-black text-primary">
                                                <td className="py-3 pl-6 uppercase tracking-wider text-[9px]">Total & Bilan</td>
                                                <td className="py-3 text-right">100%</td>
                                                <td className="py-3 text-right pr-6 text-xs">{course?.finalExam?.settings?.totalQuestions || 20}</td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4">
                                <button onClick={closeExamSetup} className="flex-1 py-5 text-sm font-black text-text-muted hover:text-text hover:bg-surface-variant rounded-2xl transition-all">Annuler</button>
                                <button 
                                    onClick={() => {if(!course.finalExam?.settings?.isAiDetectionEnabled || isCameraReady) startExam(); }} 
                                    disabled={course.finalExam?.settings?.isAiDetectionEnabled && !isCameraReady} 
                                    className="flex-[2] btn-primary py-5 rounded-2xl text-lg font-black shadow-2xl flex items-center justify-center gap-3 transition-all disabled:opacity-30 disabled:grayscale group active:scale-95"
                                >
                                    Lancer l'aperçu <ChevronRight size={22} className="group-hover:translate-x-1 transition-transform" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>, document.body
            )}

            {isExamActive && createPortal(
                <div className="fixed inset-0 z-[100] bg-background flex flex-col select-none exam-mode" onContextMenu={e=>e.preventDefault()}>
                    {violationWarning && (
                        <div className="fixed top-0 inset-x-0 z-[200] bg-amber-500 text-white px-6 py-4 flex items-center justify-center gap-3 font-black shadow-xl animate-bounce">
                            <AlertTriangle size={24} /> {violationWarning}
                        </div>
                    )}
                    <div className="bg-error/5 border-b border-glass-border p-4 flex justify-between items-center text-text">
                        <div className="flex items-center gap-3">
                            <Shield size={20} className="text-error" />
                            <div><h3 className="text-sm font-black uppercase text-error tracking-wider">Aperçu Sécurisé</h3><p className="text-[10px] text-text-muted">Infractions: <span className="text-error font-black">{violationCount}/3</span> | Test des mécanismes anti-triche.</p></div>
                        </div>
                        <div className="flex items-center bg-surface border rounded-2xl px-5 py-3 shadow-xl">
                            <Clock size={24} className={`mr-3 ${examTimeLeft < 300 ? 'text-error animate-pulse' : 'text-primary'}`} />
                            <div className="flex flex-col"><span className="text-[10px] uppercase font-black text-text-muted tracking-widest">Temps</span><span className="font-black text-2xl tabular-nums">{Math.floor(examTimeLeft / 60)}:{(examTimeLeft % 60).toString().padStart(2, '0')}</span></div>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-12">
                        <div className="max-w-3xl mx-auto space-y-12 pb-20">
                            {!examSubmitted && !examFailed ? (
                                <>
                                    <div className="text-center"><h1 className="text-4xl font-black mb-2">{course.finalExam?.title || "Examen Final"}</h1><p className="text-text-muted">Aperçu Formateur</p></div>
                                    {isExamActive && course.finalExam?.settings?.isAiDetectionEnabled && (
                                        <div className="fixed top-28 right-6 z-[100] w-64 h-48 rounded-2xl overflow-hidden border-2 border-primary/50 shadow-2xl bg-black">
                                            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                                            {isModelLoading && <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-[10px] text-white">CHARGEMENT IA...</div>}
                                            {detectionEngine === 'python' && pythonDetections.map((d, i) => {
                                                const [x1, y1, x2, y2] = d.bbox;
                                                return <div key={i} className={`absolute border-2 ${d.is_triche ? 'border-red-500 bg-red-500/20' : 'border-primary/50'}`} style={{left:`${x1/6.4}%`, top:`${y1/4.8}%`, width:`${(x2-x1)/6.4}%`, height:`${(y2-y1)/4.8}%`}}> <div className="absolute top-0 bg-primary text-[8px] text-white px-1">{d.class}</div></div>;
                                            })}
                                        </div>
                                    )}
                                    <div className="space-y-12">
                                        {activeExamQuestions.map((q, qIdx) => (
                                            <div key={q.id} className="bg-surface p-8 rounded-3xl border shadow-sm space-y-6">
                                                <div className="flex gap-4"><span className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black text-lg">{qIdx + 1}</span><h3 className="font-extrabold text-xl leading-snug">{q.text}</h3></div>
                                                <div className="grid grid-cols-1 gap-3 pl-14">
                                                    {q.type === 'OPEN' ? (
                                                        <textarea className="w-full input min-h-[150px] text-base" placeholder="Rédigez votre réponse ici..." value={examAnswers[q.id] || ''} onChange={e=>handleAnswerExam(q.id, e.target.value)} />
                                                    ) : (
                                                        q.options?.map((opt, oIdx) => {
                                                            const sel = q.type === 'QCM' ? (examAnswers[q.id] || []).includes(opt) : examAnswers[q.id] === opt;
                                                            return (
                                                                <button
                                                                    key={oIdx}
                                                                    onClick={() => q.type === 'QCM' ? handleAnswerExam(q.id, (examAnswers[q.id] || []).includes(opt) ? examAnswers[q.id].filter((i:any)=>i!==opt) : [...(examAnswers[q.id]||[]), opt]) : handleAnswerExam(q.id, opt)}
                                                                    className={`p-4 rounded-xl border-2 transition-all text-left text-base font-bold ${sel ? 'border-primary bg-primary/10 text-primary shadow-lg shadow-primary/10' : 'border-glass-border bg-background hover:border-primary/30'}`}
                                                                >
                                                                    <div className="flex items-center gap-3">
                                                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${sel ? 'border-primary bg-primary' : 'border-glass-border'}`}>{sel && <div className="w-2 h-2 bg-white rounded-full" />}</div>
                                                                        {opt}
                                                                    </div>
                                                                </button>
                                                            );
                                                        })
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex justify-center"><button onClick={() => course.finalExam && handleSubmitQuiz(course.finalExam)} className="px-16 py-5 bg-primary text-white rounded-2xl font-black text-xl shadow-2xl">Soumettre</button></div>
                                </>
                            ) : examFailed ? (
                                <div className="max-w-md mx-auto mt-20 p-10 bg-surface rounded-[2rem] border border-error/30 text-center shadow-xl">
                                    <AlertTriangle size={48} className="text-error mx-auto mb-4" />
                                    <h2 className="text-3xl font-black text-error mb-2">Examen Interrompu</h2>
                                    <p className="text-text-muted mb-8">{examFailed.reason}</p>
                                    <button onClick={() => { setIsExamActive(false); setExamFailed(null); try { document.exitFullscreen(); } catch (_) { } }} className="w-full py-4 bg-error text-white font-black rounded-2xl">Fermer</button>
                                </div>
                            ) : (
                                <div className="max-w-2xl mx-auto mt-20 p-12 bg-surface rounded-[3rem] text-center shadow-2xl border relative">
                                    <CheckCircle size={56} className="text-primary mx-auto mb-8 animate-bounce" />
                                    <h2 className="text-4xl font-black mb-4">Terminé</h2>
                                    <div className="py-6 mb-8 rounded-3xl bg-primary/5">
                                        <p className="text-text-muted text-xs uppercase font-black mb-1">Note de l'aperçu</p>
                                        <div className="text-6xl font-black text-primary">{Math.round((examResult?.score || 0) / (examResult?.total || 1) * 100)}%</div>
                                    </div>
                                    <button onClick={() => { setIsExamActive(false); setExamSubmitted(false); try { document.exitFullscreen(); } catch (_) { } }} className="w-full bg-primary text-white py-5 rounded-2xl text-xl font-black">Quitter</button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>, document.body
            )}

            <style>{`
                .rich-content-area { font-size: 1.125rem; line-height: 1.8; overflow-wrap: break-word; }
                .rich-content-area h1 { font-size: 2.5rem; font-weight: 900; margin-bottom: 2rem; border-bottom: 2px solid var(--primary); padding-bottom: 0.5rem; }
                .rich-content-area img { max-width: 100%; height: auto; border-radius: 1.5rem; margin: 2rem auto; display: block; box-shadow: 0 20px 40px rgba(0,0,0,0.1); }
                .rich-content-area .ql-video { width: 100%; aspect-ratio: 16/9; border-radius: 1.5rem; margin: 2rem 0; }
                .exam-mode { user-select: none !important; -webkit-user-select: none !important; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                .animate-fade-in { animation: fadeIn 0.5s ease-out forwards; }
                .group-option:hover { transform: translateY(-2px); }
                .group-option:active { transform: scale(0.98); }
            `}</style>
        </div>
    );
};

export default CoursePreviewPage;
