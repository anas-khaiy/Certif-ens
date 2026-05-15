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
    Bell,
    Github,
    Link as LinkIcon,
    ArrowUpRight,
    Timer
} from 'lucide-react';
import { createPortal } from 'react-dom';
import * as cocossd from '@tensorflow-models/coco-ssd';
import { useCourses } from '../hooks/useCourses';
import api from '../api/api-client';
import type { Course, Quiz, Question } from '../types';
import { YoloDetector } from '../utils/yoloDetector';
import type { YoloDetection } from '../utils/yoloDetector';
import { API_FORMATEUR, API_APPRENANT, API_ADMIN, WS_APPRENANT, WS_LIVEKIT, AI_DETECT_URL, VERIFY_URL_APPRENANT, VERIFY_URL_FORMATEUR } from '../config';

interface StudentAnswer {
    questionId: string;
    type: 'QCU' | 'QCM' | 'OPEN';
    learnerAnswer: any;
    isCorrect?: boolean;
    score?: number;
    feedback?: string;
}

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
    const [isAgreedToTerms, setIsAgreedToTerms] = useState(false);

    const closeExamSetup = useCallback(() => {
        setShowExamSetup(false);
        setIsCameraRequested(false);
        setIsCameraReady(false);
        if (setupStreamRef.current) {
            setupStreamRef.current.getTracks().forEach(track => track.stop());
            setupStreamRef.current = null;
        }
        setIsAgreedToTerms(false);
    }, []);
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
    const [isTabActive, setIsTabActive] = useState(true);
    const [timeSpentSummary, setTimeSpentSummary] = useState<Record<string, number>>({});

    // States for randomized/sliced quiz questions
    const [activeQuizQuestions, setActiveQuizQuestions] = useState<Question[]>([]);
    const [activeExamQuestions, setActiveExamQuestions] = useState<Question[]>([]);

    // Access control state
    const [accessChecked, setAccessChecked] = useState(false);
    const [hasAccess, setHasAccess] = useState(false);
    const [deadlinePassed, setDeadlinePassed] = useState(false);
    const [tpLink, setTpLink] = useState('');
    const [tpSubmissions, setTpSubmissions] = useState<any[]>([]);
    const [isTpSubmitting, setIsTpSubmitting] = useState(false);
    const [tpError, setTpError] = useState<string | null>(null);

    const sections = course?.sections || [];
    const flatSubSections = sections.flatMap(s => s.subSections || []);
    const activeSubSection = flatSubSections.find(ss => String(ss.id) === String(activeSubSectionId));

    // Apply theme to document
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'dark' ? 'light' : 'dark');
    };

    // Keep Refs in sync with State for the detection interval
    useEffect(() => { examActiveRef.current = isExamActive; }, [isExamActive]);
    useEffect(() => { examSubmittedRef.current = examSubmitted; }, [examSubmitted]);
    useEffect(() => { examFailedRef.current = !!examFailed; }, [examFailed]);

    const scrollToTop = () => {
        scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const scrollTop = e.currentTarget.scrollTop;
        setShowScrollTop(scrollTop > 300);
    };

    // Tab visibility tracking
    useEffect(() => {
        const handleVisibility = () => {
            const active = !document.hidden;
            setIsTabActive(active);
            if (!active) {
                // When leaving tab, we'll trigger a quick sync if needed in the interval
            }
        };
        document.addEventListener('visibilitychange', handleVisibility);
        return () => document.removeEventListener('visibilitychange', handleVisibility);
    }, []);

    const [progressLoaded, setProgressLoaded] = useState(false);

    // Initial data fetch: Course + Progress
    useEffect(() => {
        const initData = async () => {
            if (!id) return;
            try {
                // 1. Fetch Course
                const foundCourse = await getCourse(id);
                if (!foundCourse) {
                    setAccessChecked(true);
                    return;
                }
                setCourse(foundCourse);

                // 2. Check Enrollment Access
                const enrollResponse = await api.get('/enrollments/my');
                const enrollments = enrollResponse.data as any[];
                const accepted = enrollments.some(
                    (e: any) => String(e.course?.id) === String(id) && e.status === 'ACCEPTED'
                );

                if (!accepted) {
                    setHasAccess(false);
                    setAccessChecked(true);
                    return;
                }

                // 3. Load Progress & Quiz Results first to check status
                const [progressRes, quizResultsRes, tpSubmissionsRes] = await Promise.all([
                    api.get(`/progress/${id}`),
                    api.get(`/progress/${id}/quizzes`),
                    api.get(`/progress/${id}/tps`)
                ]);
                
                const progress = progressRes.data;
                const results = quizResultsRes.data as any[];
                setQuizResults(results);
                setTpSubmissions(tpSubmissionsRes.data as any[]);
                
                // Check if either the real final exam or the auto-submitted 'final_exam' result is passed
                const finalExamId = foundCourse.finalExam?.id;
                const hasFinishedCertif = results.some(r => 
                    (String(r.quizId) === 'final_exam' || (finalExamId && String(r.quizId) === String(finalExamId))) && 
                    r.passed
                );

                // 4. Check Deadline (Robust parsing)
                if (foundCourse.deadlineDate) {
                    let deadlineTime: number;
                    const dateStr = String(foundCourse.deadlineDate);
                    
                    if (dateStr.includes('/')) {
                        // Handle DD/MM/YYYY
                        const [d, m, y] = dateStr.split('/').map(Number);
                        deadlineTime = new Date(y, m - 1, d, 23, 59, 59).getTime();
                    } else {
                        // Handle YYYY-MM-DD or ISO
                        deadlineTime = new Date(dateStr.replace(' ', 'T')).getTime();
                    }

                    const now = Date.now();
                    
                    if (isNaN(deadlineTime)) {
                        console.warn("[CoursePreview] Invalid deadline date format:", foundCourse.deadlineDate);
                    } else if (now > deadlineTime && !hasFinishedCertif) {
                        console.warn("[CoursePreview] Access Blocked: Deadline Passed", {
                            deadline: new Date(deadlineTime).toLocaleString(),
                            now: new Date(now).toLocaleString(),
                            hasFinishedCertif
                        });
                        setDeadlinePassed(true);
                        setHasAccess(false);
                        
                        // Auto-record 0 if no attempt exists
                        const hasExamResult = results.some(r => String(r.quizId) === 'final_exam' || (finalExamId && String(r.quizId) === String(finalExamId)));
                        if (!hasExamResult) {
                            api.post(`/progress/${id}/quiz/final_exam`, {
                                score: 0,
                                passed: false,
                                answers: "[]",
                                cheatingReason: "Date limite dépassée"
                            }).catch(err => console.error("Failed to auto-fail exam:", err));
                        }
                        setAccessChecked(true);
                        return;
                    }
                }

                // 4. Load Time Spent Progress
                if (progress.timeSpentPerSection) {
                    try {
                        const parsed = typeof progress.timeSpentPerSection === 'string' 
                            ? JSON.parse(progress.timeSpentPerSection) 
                            : progress.timeSpentPerSection;
                        setTimeSpentSummary(parsed);
                    } catch (e) {
                        console.error("Failed to parse section times:", e);
                    }
                }

                // If we reach here, user has access
                setHasAccess(true);

                // 5. Setup Course Navigation & Progress
                let lastId: string | null = null;
                if (progress.completedSubSectionIds) {
                    const completedIds = progress.completedSubSectionIds.split(',').filter((id: string) => id !== '');
                    setCompletedSubSections(completedIds);
                }

                if (progress.lastSubSectionId) {
                    // Verify if the last ID still exists in the course (could have been deleted/updated)
                    const exists = foundCourse.sections?.some((s: any) =>
                        s.subSections?.some((ss: any) => String(ss.id) === String(progress.lastSubSectionId))
                    );
                    if (exists) {
                        lastId = progress.lastSubSectionId;
                        setActiveSubSectionId(lastId);

                        const section = foundCourse.sections?.find((s: any) =>
                            s.subSections?.some((ss: any) => String(ss.id) === String(lastId))
                        );
                        if (section) setExpandedSections([section.id]);
                    }
                }

                // If no progress yet OR the saved position is now invalid, set first lesson
                if (!lastId && foundCourse.sections && foundCourse.sections.length > 0) {
                    const firstSection = foundCourse.sections[0];
                    setExpandedSections([firstSection.id]);
                    if (firstSection.subSections && firstSection.subSections.length > 0) {
                        setActiveSubSectionId(firstSection.subSections[0].id);
                    }
                }
                // Results already loaded above
                setProgressLoaded(true);
            } catch (err) {
                console.error("Error initializing course data:", err);
                setHasAccess(false);
            } finally {
                setAccessChecked(true);
            }
        };
        initData();
    }, [id, getCourse]);

    // Track progression and save to backend
    useEffect(() => {
        const updateBackendProgress = async () => {
            if (!id || !activeSubSectionId || !progressLoaded) return;

            const isQuiz = !!activeSubSection?.quiz;
            const needsCompletion = !isQuiz && !completedSubSections.some(cid => String(cid) === String(activeSubSectionId));

            try {
                await api.post(`/progress/${id}`, {
                    lastSubSectionId: activeSubSectionId,
                    completedId: needsCompletion ? activeSubSectionId : undefined,
                    timeSpentPerSection: Object.keys(timeSpentRef.current).length > 0 ? JSON.stringify(timeSpentRef.current) : undefined,
                });

                if (needsCompletion) {
                    setCompletedSubSections(prev => [...prev, activeSubSectionId]);
                }
            } catch (err) {
                console.error("Failed to save progress:", err);
            }
        };

        if (activeSubSection) {
            updateBackendProgress();
        }
    }, [activeSubSectionId, activeSubSection, id, progressLoaded]);

    // Helper to parse "2h", "1.5", "30min" to seconds
    const parseMasseHoraireToSeconds = useCallback((masse?: string): number => {
        if (!masse) return 3600; // Default 1 hour
        const cleaned = (masse || "").toLowerCase().trim();
        const num = parseFloat(cleaned.replace(/[^\d.]/g, ''));
        if (isNaN(num)) return 3600;
        
        if (cleaned.includes('min')) return num * 60;
        return num * 3600; // Default to hours
    }, []);

    // Refs to avoid resetting intervals
    const timeSpentRef = useRef<Record<string, number>>(timeSpentSummary);
    
    useEffect(() => {
        timeSpentRef.current = timeSpentSummary;
    }, [timeSpentSummary]);

    // Timer effect
    useEffect(() => {
        if (!course?.timeTrackingEnabled || !isTabActive || !activeSubSectionId || !progressLoaded) return;

        const currentSection = sections.find(s => s.subSections?.some(ss => String(ss.id) === String(activeSubSectionId)));
        if (!currentSection) return;

        const interval = setInterval(() => {
            setTimeSpentSummary(prev => {
                const currentVal = prev[currentSection.id] || 0;
                return { ...prev, [currentSection.id]: currentVal + 1 };
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [course?.timeTrackingEnabled, isTabActive, activeSubSectionId, progressLoaded, sections]);

    // Periodic sync of time spent to backend
    useEffect(() => {
        if (!course?.timeTrackingEnabled || !progressLoaded || !id) return;

        const syncToBackend = async () => {
             const currentSummary = timeSpentRef.current;
             if (Object.keys(currentSummary).length === 0) return;
             try {
                await api.post(`/progress/${id}`, {
                    timeSpentPerSection: JSON.stringify(currentSummary)
                });
            } catch (err) {
                console.error("Failed to sync study time:", err);
            }
        };

        const syncTimer = setInterval(syncToBackend, 15000); // Sync every 15s

        return () => clearInterval(syncTimer);
    }, [id, progressLoaded, course?.timeTrackingEnabled]);

    // Reset transient quiz states and pre-fill TP link when changing sub-sections
    useEffect(() => {
        setQuizAnswers({});
        setQuizSubmitted(false);
        setQuizScore(0);
        setQuizPassError(null);
        
        // Pre-fill TP link if already submitted for this section
        if (activeSubSectionId && tpSubmissions.length > 0) {
            const submission = tpSubmissions.find(s => String(s.subSectionId) === String(activeSubSectionId));
            setTpLink(submission?.submissionLink || '');
        } else {
            setTpLink('');
        }
        setTpError(null);
    }, [activeSubSectionId, tpSubmissions]);

    const handleTpSubmit = async () => {
        if (!id || !activeSubSectionId || !tpLink.trim()) return;
        
        const isGithub = tpLink.toLowerCase().includes('github.com');
        const isDrive = tpLink.toLowerCase().includes('drive.google.com') || tpLink.toLowerCase().includes('docs.google.com');

        if (!isGithub && !isDrive) {
            setTpError("Veuillez fournir un lien GitHub ou Google Drive valide.");
            return;
        }

        setTpError(null);
        setIsTpSubmitting(true);
        try {
            const res = await api.post(`/progress/${id}/tp/${activeSubSectionId}`, { link: tpLink });
            setTpSubmissions(prev => {
                const filtered = prev.filter(s => String(s.subSectionId) !== String(activeSubSectionId));
                return [...filtered, res.data];
            });

            // Mark as completed in backend progress if not already 
            if (!completedSubSections.includes(activeSubSectionId)) {
                await api.post(`/progress/${id}`, {
                    lastSubSectionId: activeSubSectionId,
                    completedId: activeSubSectionId
                });
                setCompletedSubSections(prev => [...prev, activeSubSectionId]);
            }
            // Success alert could go here
        } catch (err) {
            console.error("Failed to submit TP:", err);
        } finally {
            setIsTpSubmitting(false);
        }
    };

    // Handle Quiz Question Selection (Randomization + Slicing)
    useEffect(() => {
        if (activeSubSection?.quiz) {
            const quiz = activeSubSection.quiz;
            let questions = [...(quiz.questions || quiz.settings?.generatedPool || [])];

            if (quiz.settings?.isRandom) {
                questions = questions.sort(() => Math.random() - 0.5);
                if (quiz.settings.totalQuestions && quiz.settings.totalQuestions > 0) {
                    questions = questions.slice(0, quiz.settings.totalQuestions);
                }
            } else if (quiz.settings?.totalQuestions && quiz.settings.totalQuestions > 0) {
                questions = questions.slice(0, quiz.settings.totalQuestions);
            }

            setActiveQuizQuestions(questions);
        } else {
            setActiveQuizQuestions([]);
        }
    }, [activeSubSectionId, activeSubSection?.quiz?.id, retakingQuizIds]);

    // Handle Exam Question Selection
    useEffect(() => {
        if (isExamActive && course?.finalExam) {
            const quiz = course.finalExam;
            let questions = [...(quiz.questions || quiz.settings?.generatedPool || [])];

            if (quiz.settings?.isRandom) {
                questions = questions.sort(() => Math.random() - 0.5);
                if (quiz.settings.totalQuestions && quiz.settings.totalQuestions > 0) {
                    questions = questions.slice(0, quiz.settings.totalQuestions);
                }
            } else if (quiz.settings?.totalQuestions && quiz.settings.totalQuestions > 0) {
                questions = questions.slice(0, quiz.settings.totalQuestions);
            }
            setActiveExamQuestions(questions);
        }
    }, [isExamActive, course?.finalExam?.id]);

    const isSubSectionLocked = (subSectionId: string) => {
        if (!subSectionId) return true;
        const sid = String(subSectionId);

        // ALWAYS UNLOCKED IF:
        // 1. It is the very first lesson
        const idx = flatSubSections.findIndex(ss => String(ss.id) === sid);
        if (idx <= 0) return false;

        // 2. It is already completed
        if (completedSubSections.some(cid => String(cid) === sid)) return false;

        // 3. It is the current active lesson we resumed to
        if (sid === String(activeSubSectionId) && progressLoaded) return false;

        // OTHERWISE, check if all PREVIOUS required items are completed
        for (let i = 0; i < idx; i++) {
            const prevSid = String(flatSubSections[i].id);
            if (!completedSubSections.some(cid => String(cid) === prevSid)) {
                // If a previous item is NOT completed, this one is locked
                return true;
            }
        }
        return false;
    };

    // Handle responsiveness
    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth < 1024;
            setIsMobile(mobile);
            if (!mobile) setIsSidebarOpen(true);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Keep refs in sync so event handlers always have fresh values
    useEffect(() => { examActiveRef.current = isExamActive; }, [isExamActive]);
    useEffect(() => { examSubmittedRef.current = examSubmitted; }, [examSubmitted]);
    useEffect(() => { examFailedRef.current = !!examFailed; }, [examFailed]);

    // Helper: save a 0% failed result to the backend
    const saveFailedExamResult = useCallback((reason?: string) => {
        if (!id) return;
        // Use api.post with auth headers (sendBeacon doesn't carry auth tokens → 403)
        api.post(`/progress/${id}/quiz/final_exam`, {
            score: 0,
            passed: false,
            answers: [],
            cheatingReason: reason || 'Tentative de triche ou abandon détecté'
        }).catch(() => { });
        // Also update local state so the UI reflects the attempt
        setQuizResults(prev => {
            const already = prev.some(r => String(r.quizId) === 'final_exam');
            return already ? prev : [...prev, { quizId: 'final_exam', score: 0, passed: false }];
        });
    }, [id]);

    // --- AI Cheating Detection (Phone) ---
    const startAIDetection = async (triggerCheatingFail: (r: string, imm?: boolean) => void) => {
        if (!videoRef.current || examFailedRef.current) return;
        setIsModelLoading(true);

        try {
            // High resolution for better AI accuracy
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 640, height: 480, facingMode: 'user' }
            });
            if (videoRef.current) videoRef.current.srcObject = stream;

            const model = await cocossd.load();
            setIsModelLoading(false);

            let phoneDetectionBuffer = 0;

            detectionIntervalRef.current = setInterval(async () => {
                // Use Refs to avoid stale closure issues
                if (!videoRef.current || examFailedRef.current || examSubmittedRef.current) return;
                const settings = course?.finalExam?.settings;
                if (settings?.detectPhone === false) return; // Skip if disabled

                try {
                    const predictions = await model.detect(videoRef.current);

                    // Lower threshold to 0.50 for better detection of partial/angled phones
                    const phoneDetected = predictions.some(p =>
                        p.class === 'cell phone' && p.score > 0.50
                    );

                    if (phoneDetected) {
                        phoneDetectionBuffer++;
                        // Immediate detection (0 tolerance)
                        if (phoneDetectionBuffer >= 1) {
                            clearInterval(detectionIntervalRef.current);
                            stopAIDetection();
                            triggerCheatingFail("DÉTECTION IA : Téléphone portable détecté.", true);
                        }
                    } else {
                        phoneDetectionBuffer = 0;
                    }
                } catch (detectErr) {
                    console.error("Detection error:", detectErr);
                }
            }, 1500); // Slightly faster interval for better reactivity
        } catch (err) {
            console.error("AI Detection Setup Failed:", err);
            setIsModelLoading(false);
        }
    };

    const startYoloAIDetection = async (triggerCheatingFail: (r: string, imm?: boolean) => void) => {
        if (!videoRef.current || examFailedRef.current) return;
        setIsModelLoading(true);

        try {
            // Use standard 640x480 resolution (more compatible)
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 640, height: 480, facingMode: 'user' }
            });
            if (videoRef.current) videoRef.current.srcObject = stream;

            const detector = new YoloDetector();
            // Point to the local model
            await detector.loadModel('/models/yolov8n.onnx');
            setIsModelLoading(false);

            let phoneDetectionBuffer = 0;

            const detectFrame = async () => {
                // Stop loop if exam state changes
                if (!examActiveRef.current || examFailedRef.current || examSubmittedRef.current || !videoRef.current) {
                    return;
                }
                const settings = course?.finalExam?.settings;
                if (settings?.detectPhone === false) {
                  // Schedule next frame to keep loop going if settings change
                  if (examActiveRef.current && !examFailedRef.current && !examSubmittedRef.current) {
                      detectionIntervalRef.current = setTimeout(detectFrame, 1000);
                  }
                  return;
                }

                try {
                    const predictions: YoloDetection[] = await detector.detect(videoRef.current);

                    if (predictions.length > 0) {
                        console.log("🔍 YOLO Raw Predictions:", predictions.map(p => `${p.class} (${Math.round(p.score * 100)}%)`));
                    }

                    // Sensitivity: 0.25 (match internal 0.20)
                    const phoneDetected = predictions.some((p: YoloDetection) =>
                        p.class === 'cell phone' && p.score > 0.25
                    );

                    if (phoneDetected) {
                        phoneDetectionBuffer++;
                        if (phoneDetectionBuffer >= 1) {
                            console.warn("⚠️ YOLO: Phone detected. Triggering immediate fail.");
                            stopAIDetection();
                            triggerCheatingFail("DÉTECTION YOLO : Téléphone portable détecté.", true);
                            return;
                        }
                    } else {
                        phoneDetectionBuffer = 0;
                    }
                } catch (detectErr) {
                    console.error("YOLO detection error:", detectErr);
                }

                // Schedule next frame only if still active
                if (examActiveRef.current && !examFailedRef.current && !examSubmittedRef.current) {
                    detectionIntervalRef.current = setTimeout(detectFrame, 1000);
                }
            };

            detectFrame();
        } catch (err) {
            console.error("YOLO Setup Failed:", err);
            setIsModelLoading(false);
            // Fallback to TFJS if YOLO fails to load
            setDetectionEngine('tfjs');
        }
    };

    const startPythonAIDetection = async (triggerCheatingFail: (r: string, imm?: boolean) => void) => {
        if (!videoRef.current || examFailedRef.current) return;
        setIsModelLoading(true);

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 640, height: 480, facingMode: 'user' }
            });
            if (videoRef.current) videoRef.current.srcObject = stream;

            setIsModelLoading(false);
            const canvas = document.createElement('canvas');
            canvas.width = 640;
            canvas.height = 480;
            const ctx = canvas.getContext('2d');

            let phoneDetectionBuffer = 0;

            const detectFrame = async () => {
                if (!examActiveRef.current || examFailedRef.current || examSubmittedRef.current || !videoRef.current) return;

                try {
                    if (ctx && videoRef.current) {
                        ctx.drawImage(videoRef.current, 0, 0, 640, 480);
                        canvas.toBlob(async (blob) => {
                            if (!blob) return;

                            const formData = new FormData();
                            formData.append('file', blob, 'frame.jpg');

                            try {
                                const response = await fetch(`${AI_DETECT_URL}`, {
                                    method: 'POST',
                                    body: formData
                                });
                                const data = await response.json();
                                const settings = course?.finalExam?.settings;

                                // Filter detections based on settings
                                const isPhoneCheat = data.phone_detected && settings?.detectPhone !== false;
                                const isMultiplePersonsCheat = data.multiple_persons_detected && settings?.detectMultiplePersons !== false;
                                const isLookingAwayCheat = data.looking_away_detected && settings?.detectLookingAway !== false;
                                
                                // Forbidden object: check detections that are flagged as cheat, but EXCLUDE phones/people/gaze
                                // because they have their own specific toggles.
                                const isForbiddenObjectCheat = settings?.detectForbiddenObjects !== false && 
                                    (data.detections || []).some((d: any) => 
                                        d.is_triche && 
                                        !d.class.toLowerCase().includes('phone') && 
                                        !d.class.toLowerCase().includes('mobile') &&
                                        !d.class.includes('PERSONNES') &&
                                        !d.class.includes('REGARD DÉTOURNÉ')
                                    );

                                // Filter detections to display correct colors based on settings
                                const displayDetections = (data.detections || []).map((d: any) => {
                                    let shouldBeCheat = d.is_triche;
                                    const c = d.class || "";
                                    
                                    if (c.toLowerCase().includes('phone') || c.toLowerCase().includes('mobile')) {
                                        shouldBeCheat = settings?.detectPhone !== false;
                                    } else if (c.includes('PERSONNES')) {
                                        shouldBeCheat = settings?.detectMultiplePersons !== false;
                                    } else if (c.includes('REGARD DÉTOURNÉ')) {
                                        shouldBeCheat = settings?.detectLookingAway !== false;
                                    } else if (d.is_triche) {
                                        shouldBeCheat = settings?.detectForbiddenObjects !== false;
                                    }

                                    return {
                                        ...d,
                                        is_triche: shouldBeCheat,
                                        color: shouldBeCheat ? 'red' : 'blue',
                                        // Update the label if it was previously flagged as triche but is now OK
                                        class: (d.is_triche && !shouldBeCheat) ? c.replace('❌ TRICHE :', '✅ OK :').replace('TRICHE : ', '') : c
                                    };
                                });

                                if (isPhoneCheat || isMultiplePersonsCheat || isForbiddenObjectCheat || isLookingAwayCheat) {
                                    phoneDetectionBuffer++;
                                    // Set detections first so UI shows the red boxes
                                    setPythonDetections(displayDetections);

                                    if (phoneDetectionBuffer >= 1) {
                                        let reason = "DÉTECTION SERVEUR : Tentative de triche détectée.";
                                        if (isPhoneCheat) reason = "DÉTECTION SERVEUR : Téléphone portable détecté.";
                                        else if (isMultiplePersonsCheat) reason = "DÉTECTION SERVEUR : Plusieurs personnes détectées.";
                                        else if (isLookingAwayCheat) reason = "DÉTECTION SERVEUR : Regard détourné (Attention suspecte).";
                                        else if (isForbiddenObjectCheat) reason = "DÉTECTION SERVEUR : Objet interdit détecté.";

                                        // Delay increased to 1.5s so the student sees the red box "Caught!" proof clearly
                                        setTimeout(() => {
                                            stopAIDetection();
                                            triggerCheatingFail(reason, true);
                                        }, 1500);
                                        return;
                                    }
                                } else {
                                    phoneDetectionBuffer = 0;
                                    setPythonDetections(displayDetections);
                                }
                            } catch (err) {
                                console.error("Python AI Server unreachable:", err);
                                setPythonDetections([]);
                            }
                        }, 'image/jpeg', 0.7);
                    }
                } catch (err) {
                    console.error("Python frame capture error:", err);
                }

                if (examActiveRef.current && !examFailedRef.current && !examSubmittedRef.current) {
                    detectionIntervalRef.current = setTimeout(detectFrame, 1000); // Faster interval (1s)
                }
            };

            detectFrame();
        } catch (err) {
            console.error("Python AI Setup Failed:", err);
            setIsModelLoading(false);
            setDetectionEngine('tfjs');
        }
    };

    const stopAIDetection = () => {
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
    };

    const triggerCheatingFailAction = useCallback((reason: string) => {
        // 'immediate' is used by the wrapper triggerCheatingFail to bypass grace periods
        saveFailedExamResult(reason);
        setExamFailed({ reason });
        examFailedRef.current = true; // FORCE IMMEDIATE REF UPDATE to stop all loops
        stopAIDetection(); // Immediately stop camera on cheat detection
        try { document.exitFullscreen(); } catch (_) { }
    }, [saveFailedExamResult]);

    useEffect(() => {
        const settings = course?.finalExam?.settings;
        if (isExamActive && settings?.isAiDetectionEnabled && !examSubmittedRef.current && !examFailedRef.current) {
            if (detectionEngine === 'yolo') {
                startYoloAIDetection(triggerCheatingFailAction);
            } else if (detectionEngine === 'python') {
                startPythonAIDetection(triggerCheatingFailAction);
            } else {
                startAIDetection(triggerCheatingFailAction);
            }
        } else {
            stopAIDetection();
        }
        return () => stopAIDetection();
    }, [isExamActive, triggerCheatingFailAction, detectionEngine]);

    // Cleanup Setup Camera Stream
    useEffect(() => {
        if (!showExamSetup) {
            if (setupStreamRef.current) {
                setupStreamRef.current.getTracks().forEach(track => track.stop());
                setupStreamRef.current = null;
            }
        }
    }, [showExamSetup]);

    // Exam Anti-Cheat System
    useEffect(() => {
        if (!isExamActive || examSubmitted || !!examFailed) return;
        const settings = course?.finalExam?.settings;

        // Initial check for fullscreen status
        const currentFsElement = document.fullscreenElement || (document as any).webkitFullscreenElement || (document as any).mozFullScreenElement || (document as any).msFullscreenElement;
        if (currentFsElement) {
            hasEnteredFullscreenRef.current = true;
        }

        // 2-second grace period for blur/resize to allow the browser fullscreen prompt
        let armed = false;
        const armTimer = setTimeout(() => { armed = true; }, 2000);

        const triggerCheatingFail = (reason: string, immediate: boolean = false) => {
            if (!armed && !immediate) return;
            triggerCheatingFailAction(reason);
        };

        // 1. Tab switch (Visibility change) - Immediate
        const handleVisibilityChange = () => {
            if (settings?.detectTabSwitch === false) return;
            const isHidden = document.hidden || (document as any).webkitHidden || (document as any).mozHidden || (document as any).msHidden;
            if (isHidden) {
                triggerCheatingFail("TENTATIVE DE TRICHE : Changement d'onglet détecté.", true);
            }
        };

        // 2. Window blur (Alt-Tab, window focus loss)
        const handleBlur = () => {
            if (settings?.detectWindowBlur === false) return;
            triggerCheatingFail("TENTATIVE DE TRICHE : Sortie de la fenêtre détectée.");
        };

        // 3. Fullscreen exit
        const handleFullscreenChange = () => {
            const fsElement = document.fullscreenElement || (document as any).webkitFullscreenElement || (document as any).mozFullScreenElement || (document as any).msFullscreenElement;
            if (fsElement) {
                hasEnteredFullscreenRef.current = true;
            } else if (hasEnteredFullscreenRef.current && settings?.detectFullscreenExit !== false) {
                triggerCheatingFail("TENTATIVE DE TRICHE : Sortie du mode plein écran détectée.", true);
            }
        };

        // 4. Window resize (e.g. split screen)
        const handleResize = () => {
            if (settings?.detectWindowBlur === false) return;
            triggerCheatingFail("TENTATIVE DE TRICHE : Redimensionnement de la fenêtre détecté.");
        };

        // 5. Page reload / Close
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            saveFailedExamResult("TENTATIVE DE TRICHE : Rechargement ou fermeture de la page pendant l'examen.");
            const msg = "L'examen est en cours. Si vous quittez, votre score sera 0%.";
            e.preventDefault();
            e.returnValue = msg;
            return msg;
        };

        // 6. Back button navigation
        window.history.pushState({ lock: true }, '');
        const handlePopState = () => {
            triggerCheatingFail("TENTATIVE DE TRICHE : Navigation arrière détectée.", true);
        };

        const preventDefault = (e: Event) => e.preventDefault();

        // Attach listeners
        document.addEventListener('visibilitychange', handleVisibilityChange);
        document.addEventListener('webkitvisibilitychange', handleVisibilityChange);
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
        document.addEventListener('mozfullscreenchange', handleFullscreenChange);
        document.addEventListener('MSFullscreenChange', handleFullscreenChange);
        window.addEventListener('blur', handleBlur);
        window.addEventListener('resize', handleResize);
        window.addEventListener('beforeunload', handleBeforeUnload);
        window.addEventListener('popstate', handlePopState);
        document.addEventListener('contextmenu', preventDefault);
        document.addEventListener('copy', preventDefault);
        document.addEventListener('cut', preventDefault);
        document.addEventListener('paste', preventDefault);

        return () => {
            clearTimeout(armTimer);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            document.removeEventListener('webkitvisibilitychange', handleVisibilityChange);
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
            document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
            document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
            window.removeEventListener('blur', handleBlur);
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('beforeunload', handleBeforeUnload);
            window.removeEventListener('popstate', handlePopState);
            document.removeEventListener('contextmenu', preventDefault);
            document.removeEventListener('copy', preventDefault);
            document.removeEventListener('cut', preventDefault);
            document.removeEventListener('paste', preventDefault);
        };
    }, [isExamActive, examSubmitted, examFailed, saveFailedExamResult, triggerCheatingFailAction]);

    // Exam Timer
    useEffect(() => {
        if (!isExamActive || examSubmitted || examFailed) return;

        const interval = setInterval(() => {
            setExamTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(interval);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [isExamActive, examSubmitted, examFailed]);

    // Handle timer end
    useEffect(() => {
        if (isExamActive && examTimeLeft === 0 && !examSubmitted && !examFailed) {
            triggerCheatingFailAction("Temps écoulé.");
        }
    }, [examTimeLeft, isExamActive, examSubmitted, examFailed, triggerCheatingFailAction]);



    const toggleSection = (sectionId: string) => {
        setExpandedSections(prev =>
            prev.includes(sectionId) ? prev.filter(id => id !== sectionId) : [...prev, sectionId]
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


    const getYouTubeEmbedUrl = (url: string) => {
        if (!url) return null;
        const regExp = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?|shorts|live)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
        const match = url.match(regExp);
        return match ? `https://www.youtube.com/embed/${match[1]}` : null;
    };

    const handleAnswerQuiz = (questionId: string, answer: any) => {
        setQuizAnswers(prev => ({ ...prev, [questionId]: answer }));
    };

    const handleSubmitQuiz = (quiz: Quiz) => {
        let score = 0;
        const questions = isExamActive ? activeExamQuestions : activeQuizQuestions;
        const answersData: StudentAnswer[] = [];

        questions.forEach(q => {
            const currentAnswers = isExamActive ? examAnswers : quizAnswers;
            const answer = currentAnswers[q.id];
            let isCorrect = false;

            if (q.type === 'QCU') {
                const correctIdx = q.correctAnswers[0];
                const correctOption = q.options[correctIdx];
                isCorrect = answer === correctOption;
                if (isCorrect) score++;

                // For QCU, store the index of the answer for consistency
                const answerIndex = q.options.indexOf(answer);
                answersData.push({
                    questionId: q.id,
                    type: 'QCU',
                    learnerAnswer: answerIndex !== -1 ? answerIndex : answer,
                    isCorrect
                });
            } else if (q.type === 'QCM') {
                const correctOptions = q.correctAnswers.map(idx => q.options[idx]);
                const answerArray = Array.isArray(answer) ? answer : [];
                isCorrect = correctOptions.length === answerArray.length && correctOptions.every(opt => answerArray.includes(opt));
                if (isCorrect) score++;

                // For QCM, store indices of answers
                const answerIndices = (answerArray as any[]).map(ans => q.options.indexOf(ans)).filter(idx => idx !== -1);
                answersData.push({
                    questionId: q.id,
                    type: 'QCM',
                    learnerAnswer: answerIndices,
                    isCorrect
                });
            } else if (q.type === 'OPEN') {
                isCorrect = answer && answer.trim().length > 0;
                if (isCorrect) score++;
                answersData.push({
                    questionId: q.id,
                    type: 'OPEN',
                    learnerAnswer: answer || "",
                    isCorrect
                });
            }
        });

        const passingScorePercent = quiz.settings?.passingScore || 70;
        const totalQuestions = questions.length;
        const userScorePercent = totalQuestions > 0 ? (score / totalQuestions) * 100 : 0;
        const roundedUserScore = Math.round(userScorePercent);

        // Special case: If quiz has OPEN questions, allow passing without constraint
        const hasOpenQuestions = questions.some(q => q.type === 'OPEN');
        const isPassed = hasOpenQuestions || (totalQuestions > 0 && roundedUserScore >= passingScorePercent);

        if (isExamActive) {
            setExamResult({ score, total: totalQuestions });
            setExamSubmitted(true);

            // Persist Final Exam Result
            if (id) {
                api.post(`/progress/${id}/quiz/final_exam`, {
                    score: roundedUserScore,
                    passed: isPassed,
                    answers: answersData
                }).then(() => {
                    setQuizResults(prev => {
                        const already = prev.some(r => String(r.quizId) === 'final_exam');
                        return already ? prev : [...prev, { quizId: 'final_exam', score: roundedUserScore, passed: isPassed }];
                    });
                }).catch(err => console.error("Failed to save exam result:", err));
            }
        } else {
            setQuizScore(score);
            setQuizSubmitted(true);

            // Persist regular quiz result
            if (id && activeSubSection?.quiz) {
                const quizId = activeSubSection.quiz.id || 'default';
                api.post(`/progress/${id}/quiz/${quizId}`, {
                    score: roundedUserScore,
                    passed: isPassed,
                    answers: answersData
                })
                    .then(res => {
                        // Update local quiz results state
                        setQuizResults(prev => [...prev, res.data]);
                    })
                    .catch(err => console.error("Failed to save quiz result:", err));
            }

            if (isPassed) {
                if (activeSubSectionId && !completedSubSections.includes(activeSubSectionId)) {
                    setCompletedSubSections(prev => [...prev, activeSubSectionId]);
                    // Update progress in backend too
                    api.post(`/progress/${id}`, {
                        completedId: activeSubSectionId
                    }).catch(err => console.error("Failed to update progress after quiz:", err));
                }
                setQuizPassError(null);
            } else {
                setQuizPassError(`Score requis: ${passingScorePercent}% | Votre score: ${roundedUserScore}%`);
            }
        }
    };

    const startExam = async () => {
        const alreadyAttempted = quizResults.some(r => String(r.quizId) === 'final_exam');
        if (alreadyAttempted) return;

        setShowExamSetup(false);
        setIsCameraRequested(false);
        setExamAnswers({});
        setExamSubmitted(false);
        setExamFailed(null);
        setViolationCount(0);
        setViolationWarning(null);
        hasEnteredFullscreenRef.current = false;
        const limit = course?.finalExam?.settings?.timeLimit ?? 60;
        setExamTimeLeft(limit * 60);
        setIsExamActive(true);

        // Request fullscreen with all vendor prefixes
        const el = document.documentElement as any;
        try {
            if (el.requestFullscreen) {
                await el.requestFullscreen();
            } else if (el.webkitRequestFullscreen) {
                await el.webkitRequestFullscreen();
            } else if (el.mozRequestFullScreen) {
                await el.mozRequestFullScreen();
            } else if (el.msRequestFullscreen) {
                await el.msRequestFullscreen();
            }
        } catch (e: any) {
            console.error("Fullscreen error:", e);
        }
    };

    const handleAnswerExam = (questionId: string, answer: any) => {
        setExamAnswers(prev => ({ ...prev, [questionId]: answer }));
    };



    // Show spinner while checking access
    if (!accessChecked) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-background gap-4">
                <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                <p className="text-text-muted font-bold">Vérification de l'accès...</p>
            </div>
        );
    }

    // Access denied screen
    if (!hasAccess) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center bg-background">
                <div className="w-24 h-24 bg-error/10 rounded-full flex items-center justify-center mb-6">
                    <Shield size={48} className="text-error" />
                </div>
                <h2 className="text-3xl font-black mb-3 text-text">
                    {deadlinePassed ? "Cours Expiré" : "Accès non autorisé"}
                </h2>
                <p className="text-text-muted mb-2 max-w-md">
                    {deadlinePassed 
                        ? `La date limite pour terminer ce cours (${new Date(course?.deadlineDate!).toLocaleDateString()}) est dépassée.`
                        : "Vous devez être inscrit et accepté pour accéder à ce cours."}
                </p>
                <p className="text-text-muted/60 text-sm mb-8 max-w-md">
                    {deadlinePassed 
                        ? "Veuillez contacter votre formateur pour plus d'informations."
                        : "Si vous avez envoyé une demande d'inscription, veuillez attendre que le formateur l'accepte."}
                </p>
                <button
                    onClick={() => navigate('/courses')}
                    className="px-8 py-3 bg-primary text-white rounded-xl font-bold flex items-center gap-2 transition-all hover:scale-105 shadow-lg shadow-primary/25"
                >
                    <ArrowLeft size={20} /> Retour aux cours
                </button>
            </div>
        );
    }

    if (!course) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center bg-background">
                <div className="w-16 h-16 bg-surface-hover rounded-full flex items-center justify-center mb-4 text-primary">
                    <BookOpen size={32} />
                </div>
                <h2 className="text-2xl font-bold mb-2">Cours non trouvé</h2>
                <p className="text-text-muted mb-6">Le cours demandé n'est pas disponible.</p>
                <button onClick={() => navigate('/courses')} className="px-6 py-2.5 bg-primary text-white rounded-xl font-bold flex items-center gap-2 transition-all hover:scale-105">
                    <ArrowLeft size={20} /> Retour aux cours
                </button>
            </div>
        );
    }

    return (
        <>
            <div className="flex h-screen bg-background overflow-hidden relative font-sans text-text">
                {/* Sidebar Toggle Button */}
                <button
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className={`fixed top-4 z-[60] p-2 bg-surface border border-glass-border rounded-xl text-primary flex items-center justify-center shadow-xl transition-all duration-300 active:scale-95 ${isSidebarOpen
                        ? 'left-[240px] sm:left-[280px] lg:left-[290px]'
                        : 'left-4'
                        }`}
                >
                    <ChevronLeft
                        size={20}
                        className={`transition-transform duration-500 ${!isSidebarOpen ? 'rotate-180' : ''}`}
                    />
                </button>

                {isMobile && isSidebarOpen && (
                    <div className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />
                )}

                {/* Sidebar */}
                <aside className={`fixed inset-y-0 left-0 z-50 w-[280px] sm:w-80 bg-surface border-r border-glass-border transform transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                    <div className="flex flex-col h-full overflow-hidden">
                        <div className="p-6 border-b border-glass-border bg-surface/50">
                            <div className="flex items-center justify-between gap-4 mb-6">
                                <button
                                    onClick={() => navigate('/courses')}
                                    className="flex items-center gap-2 group/back"
                                    title="Retour aux cours"
                                >
                                    <div className="w-10 h-10 flex items-center justify-center bg-surface-hover/80 hover:bg-primary text-text hover:text-white rounded-xl transition-all duration-300 shadow-sm border border-glass-border">
                                        <ArrowLeft size={20} />
                                    </div>
                                    <span className="text-xs font-black uppercase tracking-tight text-text-muted group-hover/back:text-primary transition-colors">Retour</span>
                                </button>
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-lg border border-primary/20">
                                    <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
                                    <span className="text-[10px] font-black uppercase text-primary tracking-widest">Cours</span>
                                </div>
                            </div>
                            <h2 className="font-black text-xl line-clamp-2 leading-tight tracking-tight text-text text-left">{course?.title}</h2>
                            {course?.deadlineDate && (
                                <div className="mt-3 flex items-center gap-2 px-3 py-1.5 bg-white border border-amber-500/20 rounded-lg shadow-sm">
                                    <Clock size={12} className="text-amber-500" />
                                    <span className="text-[10px] font-black uppercase text-amber-500 tracking-wider">
                                        Date Limite: {new Date(course.deadlineDate).toLocaleDateString()}
                                    </span>
                                </div>
                            )}
                            {course?.reminderDays && (
                                <div className="mt-2 flex items-center gap-2 px-3 py-1.5 bg-white border border-primary/20 rounded-lg shadow-sm">
                                    <Bell size={12} className="text-primary" />
                                    <span className="text-[10px] font-black uppercase text-primary tracking-wider">
                                        Rappel: Tous les {course.reminderDays} {course.reminderDays > 1 ? 'jours' : 'jour'}
                                    </span>
                                </div>
                            )}
                            {course?.timeTrackingEnabled && (
                                <div className="mt-2 flex items-center justify-between px-3 py-1.5 bg-primary/5 border border-primary/20 rounded-lg shadow-sm group">
                                    <div className="flex items-center gap-2">
                                        <Timer size={12} className="text-primary animate-pulse" />
                                        <span className="text-[10px] font-black uppercase text-text tracking-wider">
                                            Temps de présence
                                        </span>
                                    </div>
                                    <div className="text-[10px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                                        {Math.floor(Object.values(timeSpentSummary).reduce((a, b) => a + b, 0) / 60)} min
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4 flex flex-col items-stretch">
                            {sections.map((section, idx) => (
                                <div key={section.id} className="space-y-2">
                                    <button
                                        onClick={() => toggleSection(section.id)}
                                        className="w-full flex items-center justify-between p-4 rounded-xl hover:bg-surface-hover/50 transition-all font-bold text-sm text-left group gap-4"
                                    >
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            <div className="w-8 h-8 rounded-lg bg-surface-hover flex items-center justify-center text-xs font-black flex-shrink-0 group-hover:bg-primary/20 group-hover:text-primary transition-colors">{idx + 1}</div>
                                            <div className="flex flex-col truncate flex-1 min-w-0">
                                                <span className="truncate flex-1">{section.title}</span>
                                                <div className="flex items-center justify-between w-full pr-2">
                                                    <span className="text-[10px] font-medium text-primary flex items-center gap-1 mt-0.5">
                                                        <Clock size={10} /> {section.masseHoraire ? (section.masseHoraire.toLowerCase().includes('h') || section.masseHoraire.toLowerCase().includes('min') ? section.masseHoraire : `${section.masseHoraire}h`) : "1h"}
                                                    </span>
                                                    {course?.timeTrackingEnabled && (
                                                        <span className={`text-[10px] font-bold flex items-center gap-1 ${timeSpentSummary[section.id] >= parseMasseHoraireToSeconds(section.masseHoraire) ? 'text-success' : 'text-primary animate-pulse'}`}>
                                                            <Timer size={10} /> {Math.floor((timeSpentSummary[section.id] || 0) / 60)} min
                                                        </span>
                                                    )}
                                                </div>
                                                {course?.timeTrackingEnabled && (
                                                    <div className="w-full h-1 bg-surface-hover rounded-full mt-1.5 overflow-hidden border border-glass-border">
                                                        <div 
                                                            className={`h-full transition-all duration-1000 ${timeSpentSummary[section.id] >= parseMasseHoraireToSeconds(section.masseHoraire) ? 'bg-success' : 'bg-primary'}`}
                                                            style={{ width: `${Math.min(100, ((timeSpentSummary[section.id] || 0) / Math.max(1, parseMasseHoraireToSeconds(section.masseHoraire))) * 100)}%` }}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <ChevronDown size={16} className={`flex-shrink-0 transition-transform ${expandedSections.includes(section.id) ? 'rotate-180' : ''}`} />
                                    </button>

                                    {expandedSections.includes(section.id) && (
                                        <div className="pl-11 space-y-1">
                                            {(section.subSections || []).map((sub, sIdx) => {
                                                const isActive = activeSubSectionId !== null && String(activeSubSectionId) === String(sub.id);
                                                const isLocked = isSubSectionLocked(String(sub.id));
                                                const isCompleted = completedSubSections.some(cid => String(cid) === String(sub.id));

                                                return (
                                                    <button
                                                        key={sub.id}
                                                        disabled={isLocked}
                                                        onClick={() => {
                                                            goToSubSection(sub.id);
                                                            if (isMobile) setIsSidebarOpen(false);
                                                        }}
                                                        className={`w-full flex items-center justify-start gap-3 p-3 rounded-lg text-sm transition-all text-left ${isActive
                                                            ? 'bg-primary/10 text-primary font-bold'
                                                            : isLocked
                                                                ? 'opacity-40 cursor-not-allowed'
                                                                : 'text-text-muted hover:text-text hover:bg-surface-hover/30'
                                                            }`}
                                                    >
                                                        <div className="flex-shrink-0 relative">
                                                            {isLocked ? (
                                                                <Lock size={12} className="opacity-50" />
                                                            ) : isCompleted ? (
                                                                <div className="relative">
                                                                    <CheckCircle size={14} className="text-success" />
                                                                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-success rounded-full border border-white shadow-sm"></div>
                                                                </div>
                                                            ) : isActive ? (
                                                                <div className="w-3.5 h-3.5 rounded-full bg-primary animate-pulse flex items-center justify-center">
                                                                    <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                                                                </div>
                                                            ) : (
                                                                sub.videoUrl || (sub.videoUrls && sub.videoUrls.length > 0) ? <PlayCircle size={14} /> : <FileText size={14} />
                                                            )}
                                                        </div>
                                                        <span className="truncate flex-1">{sub.title || `Leçon ${sIdx + 1}`}</span>
                                                        {sub.quiz && quizResults.some(r => String(r.quizId) === String(sub.quiz?.id)) && (() => {
                                                            const results = quizResults.filter(r => String(r.quizId) === String(sub.quiz?.id));
                                                            const best = Math.max(...results.map(r => r.score || 0));
                                                            const percent = best;
                                                            return (
                                                                <div className="flex items-center gap-1 px-1.5 py-0.5 bg-success/10 text-success rounded text-[10px] font-black shrink-0">
                                                                    <Trophy size={8} />
                                                                    {percent}%
                                                                </div>
                                                            );
                                                        })()}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Sidebar Exam Footer */}
                        {course?.finalExam && course?.examEnabled !== false && (
                            <div className="p-4 border-t border-glass-border bg-surface shadow-[0_-10px_30px_rgba(0,0,0,0.05)] relative z-10">
                                {(() => {
                                    const examResult = quizResults.find(r => String(r.quizId) === 'final_exam');
                                    const isCompleted = !!examResult;

                                    return (
                                        <button
                                            onClick={() => {
                                                if (!isCompleted) {
                                                    const settings = course.finalExam?.settings;
                                                    setShowExamSetup(true);
                                                    if (settings?.isAiDetectionEnabled) {
                                                        setDetectionEngine('python');
                                                    }
                                                    if (isMobile) setIsSidebarOpen(false);
                                                }
                                            }}
                                            disabled={isCompleted}
                                            className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 group/exam ${isCompleted
                                                ? (examResult?.passed ? 'bg-success/5 border-success/20' : 'bg-error/5 border-error/20') + ' cursor-default opacity-80'
                                                : deadlinePassed ? 'bg-error/5 border-error/20 cursor-not-allowed opacity-60' : 'bg-primary/5 border border-primary/20 hover:border-primary/40 hover:bg-primary/10 transition-all duration-300 group/exam'
                                                }`}
                                        >
                                            <div className={`flex-shrink-0 w-12 h-12 rounded-xl shadow-lg flex items-center justify-center transition-transform ${isCompleted 
                                                ? (examResult?.passed ? 'bg-success text-white shadow-success/20' : 'bg-error text-white shadow-error/20') 
                                                : 'bg-primary text-white shadow-primary/20 group-hover/exam:scale-110'
                                                }`}>
                                                {isCompleted ? (examResult?.passed ? <CheckCircle size={24} /> : <X size={24} />) : <Shield size={24} />}
                                            </div>
                                            <div className="flex-1 min-w-0 text-left">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className={`text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${isCompleted 
                                                        ? (examResult?.passed ? 'bg-success/10 text-success' : 'bg-error/10 text-error') 
                                                        : 'bg-primary/10 text-primary'
                                                        }`}>
                                                        {isCompleted ? (examResult?.passed ? 'Complété' : 'Échoué') : 'Certifiant'}
                                                    </span>
                                                </div>
                                                <h4 className={`font-black text-sm truncate ${isCompleted ? (examResult?.passed ? 'text-text/70' : 'text-error/70') : 'text-text'}`}>
                                                    {isCompleted ? (examResult?.passed ? 'Examen Déjà Passé' : 'Examen Échoué') : (deadlinePassed ? 'Examen Expiré' : 'Examen Final')}
                                                </h4>
                                                <div className="flex items-center gap-3 mt-1 opacity-70">
                                                    <div className={`flex items-center gap-1 text-[10px] font-bold ${isCompleted ? (examResult?.passed ? 'text-success' : 'text-error') : ''}`}>
                                                        {isCompleted ? (
                                                            <>Note: {examResult.score}%</>
                                                        ) : (
                                                            <>
                                                                <Clock size={10} />
                                                                <span>{course?.finalExam?.settings?.timeLimit ?? 60} min</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            {!isCompleted && (
                                                <div className="flex-shrink-0 text-primary opacity-0 group-hover/exam:opacity-100 transition-all -translate-x-2 group-hover/exam:translate-x-0">
                                                    <ChevronRight size={18} />
                                                </div>
                                            )}
                                        </button>
                                    );
                                })()}
                            </div>
                        )}
                    </div>
                </aside>

                {/* Main Content Area */}
                <main className={`flex-1 flex flex-col h-full relative overflow-hidden bg-background transition-all duration-300 ${isSidebarOpen ? 'lg:ml-80' : 'ml-0'}`}>
                    <div className="flex-1 overflow-y-auto custom-scrollbar" ref={scrollRef} onScroll={handleScroll}>
                        {!activeSubSection ? (
                            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center min-h-full max-w-2xl mx-auto">
                                {(() => {
                                    const examResult = quizResults.find(r => String(r.quizId) === 'final_exam');
                                    const isCompleted = !!examResult;

                                    if (course?.finalExam && course?.examEnabled !== false) {
                                        return (
                                            <div className="bg-surface border border-glass-border rounded-[2.5rem] p-10 sm:p-16 shadow-2xl relative overflow-hidden group w-full animate-fade-in">
                                                {/* Decorative Background */}
                                                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:bg-primary/10 transition-colors duration-700" />
                                                <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl group-hover:bg-primary/20 transition-colors duration-700" />

                                                <div className="relative z-10 flex flex-col items-center gap-8">
                                                    <div className={`w-24 h-24 rounded-3xl flex items-center justify-center shadow-2xl transition-transform duration-500 group-hover:scale-110 ${isCompleted 
                                                        ? (examResult?.passed ? 'bg-success text-white shadow-success/30' : 'bg-error text-white shadow-error/30') 
                                                        : 'bg-primary text-white shadow-primary/30'
                                                        }`}>
                                                        {isCompleted ? (examResult?.passed ? <Trophy size={48} className="animate-bounce-slow" /> : <AlertTriangle size={48} />) : <Shield size={48} />}
                                                    </div>

                                                    <div className="space-y-4">
                                                        <div className="flex flex-col items-center gap-2">
                                                            <span className={`text-xs font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full ${isCompleted 
                                                                ? (examResult?.passed ? 'bg-success/10 text-success' : 'bg-error/10 text-error') 
                                                                : 'bg-primary/10 text-primary'
                                                                }`}>
                                                                {isCompleted ? (examResult?.passed ? 'Certification Validée' : 'Certification Échouée') : 'Étape Finale'}
                                                            </span>
                                                            <h1 className="text-3xl sm:text-4xl font-black tracking-tight">{course.finalExam.title || "Examen Final de Certification"}</h1>
                                                        </div>
                                                        <p className="text-text-muted text-lg max-w-md mx-auto font-medium">
                                                            {isCompleted
                                                                ? (examResult?.passed 
                                                                    ? "Félicitations ! Vous avez brillamment réussi l'examen de ce cours. Votre certificat est disponible dans votre espace personnel."
                                                                    : deadlinePassed 
                                                                        ? `La date limite (${new Date(course.deadlineDate!).toLocaleDateString()}) est dépassée. Vous n'avez pas validé la certification à temps.`
                                                                        : "Malheureusement, vous n'avez pas atteint le score requis pour valider cette certification.")
                                                                : "Vous avez complété le parcours pédagogique. Il ne vous reste plus qu'à valider vos acquis pour obtenir votre certificat."}
                                                        </p>
                                                    </div>

                                                    <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center mt-4">
                                                        {!isCompleted && !deadlinePassed && (
                                                            <button
                                                                onClick={() => {
                                                                    const settings = course.finalExam?.settings;
                                                                    setShowExamSetup(true);
                                                                    if (settings?.isAiDetectionEnabled) {
                                                                        setDetectionEngine('python');
                                                                    }
                                                                }}
                                                                className="w-full sm:w-auto btn-primary px-10 py-5 rounded-2xl text-lg font-bold shadow-2xl shadow-primary/30 flex items-center justify-center gap-3 hover:scale-105 active:scale-95 transition-all"
                                                            >
                                                                <Play size={24} /> Commencer l'examen
                                                            </button>
                                                        )}
                                                        {isCompleted && (
                                                            <div className="flex flex-col items-center gap-4">
                                                                <div className={`px-8 py-4 rounded-2xl font-black text-xl flex items-center gap-4 shadow-sm border ${examResult?.passed 
                                                                    ? 'bg-success/10 border-success/20 text-success' 
                                                                    : 'bg-error/10 border-error/20 text-error'}`}>
                                                                    Note obtenue: {examResult.score}%
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    }

                                    return (
                                        <>
                                            <BookOpen size={48} className="text-primary/20 mb-4 animate-pulse" />
                                            <h3 className="text-xl font-bold">Sélectionnez une leçon</h3>
                                            <p className="text-text-muted mt-2">Choisissez un chapitre dans la barre latérale pour commencer ou reprendre votre apprentissage.</p>
                                        </>
                                    );
                                })()}
                            </div>
                        ) : (
                            <div className="p-6 md:p-12 pb-32 animate-fade-in flex flex-col items-center">
                                <div className="w-full max-w-4xl space-y-10">
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest"><Clock size={14} /> Leçon active</div>
                                        <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">{activeSubSection.title}</h1>
                                    </div>

                                    {(activeSubSection.videoUrl || (activeSubSection.videoUrls && activeSubSection.videoUrls.length > 0)) && (
                                        <div className="grid grid-cols-1 gap-6">
                                            {(activeSubSection.videoUrls?.length ? activeSubSection.videoUrls : [activeSubSection.videoUrl!]).map((url, vIdx) => {
                                                const embedUrl = getYouTubeEmbedUrl(url);
                                                return embedUrl && (
                                                    <div key={vIdx} className="aspect-video rounded-3xl overflow-hidden shadow-2xl border border-glass-border bg-black">
                                                        <iframe src={embedUrl} className="w-full h-full" allowFullScreen title={`Video ${vIdx + 1}`} />
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {activeSubSection.content && activeSubSection.content.replace(/<[^>]*>/g, '').trim().length > 0 || activeSubSection.content?.includes('<img') || activeSubSection.content?.includes('<iframe') ? (
                                        <div className="bg-surface border border-glass-border rounded-[2.5rem] shadow-xl overflow-hidden min-h-[100px]">
                                            <div className="p-8 sm:p-12 text-text rich-content-area" dangerouslySetInnerHTML={{ __html: activeSubSection.content }} />
                                        </div>
                                    ) : null}

                                    {activeSubSection.isTp && (
                                        <div className="bg-surface border border-glass-border rounded-[2.5rem] p-8 sm:p-12 shadow-xl space-y-8 animate-fade-in text-text">
                                            <div className="flex items-center gap-4">
                                                <div className="p-4 bg-primary/10 text-primary rounded-2xl">
                                                    <FileText size={32} />
                                                </div>
                                                <div>
                                                    <h2 className="text-2xl font-black">Travaux Pratiques</h2>
                                                    <p className="text-text-muted font-bold text-sm">Soumettez votre travail pour cette leçon.</p>
                                                </div>
                                            </div>

                                            <div className="space-y-6">
                                                <div className="p-6 bg-background rounded-2xl border border-glass-border">
                                                    <p className="font-bold text-lg mb-4">{activeSubSection.tpPrompt || "Veuillez soumettre le lien de votre projet (GitHub, Google Drive, etc.)"}</p>
                                                    
                                                    {(() => {
                                                        const submission = tpSubmissions.find(s => String(s.subSectionId) === String(activeSubSectionId));
                                                        return (
                                                            <div className="space-y-4">
                                                                <div className="flex flex-col sm:flex-row gap-3">
                                                                    <div className="flex-1 relative group">
                                                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors">
                                                                            {tpLink.includes('github') ? <Github size={20} /> : <LinkIcon size={20} />}
                                                                        </div>
                                                                        <input 
                                                                            type="text" 
                                                                            className={`w-full pl-12 pr-4 py-4 rounded-xl bg-surface border-2 ${tpError ? 'border-error/50 bg-error/5' : 'border-glass-border'} focus:border-primary focus:bg-primary/5 transition-all outline-none font-bold`}
                                                                            placeholder="https://github.com/... ou https://drive.google.com/..."
                                                                            value={tpLink}
                                                                            onChange={(e) => {
                                                                                setTpLink(e.target.value);
                                                                                if (tpError) setTpError(null);
                                                                            }}
                                                                        />
                                                                    </div>
                                                                    <button 
                                                                        onClick={handleTpSubmit}
                                                                        disabled={isTpSubmitting || !tpLink.trim()}
                                                                        className="px-8 py-4 bg-primary text-white rounded-xl font-black shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale disabled:scale-100"
                                                                    >
                                                                        {isTpSubmitting ? 'Envoi...' : (submission ? 'Mettre à jour' : 'Soumettre')}
                                                                    </button>
                                                                </div>

                                                                {tpError && (
                                                                    <p className="text-error text-xs font-bold animate-shake px-2">{tpError}</p>
                                                                )}

                                                                {submission && (
                                                                    <div className="flex items-center gap-3 p-4 bg-success/5 border border-success/20 rounded-xl text-success animate-fade-in shadow-sm">
                                                                        <CheckCircle size={20} className="shrink-0" />
                                                                        <div>
                                                                            <p className="text-xs font-black uppercase text-success/80 tracking-wider">Travail Soumis</p>
                                                                            <a 
                                                                                href={submission.submissionLink.startsWith('http') ? submission.submissionLink : `https://${submission.submissionLink}`} 
                                                                                target="_blank" 
                                                                                rel="noopener noreferrer"
                                                                                className="text-sm font-bold underline flex items-center gap-1 hover:text-success-light transition-colors"
                                                                            >
                                                                                Voir ma soumission <ArrowUpRight size={14} />
                                                                            </a>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })()}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {activeSubSection.quiz && (
                                        <div className="bg-primary/5 border border-primary/20 rounded-3xl p-6 sm:p-10 shadow-inner relative overflow-hidden text-text">
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                                                <div className="flex items-center gap-4">
                                                    <div className="p-3 bg-primary text-white rounded-2xl shadow-lg shadow-primary/20"><HelpCircle size={24} /></div>
                                                    <div>
                                                        <h2 className="text-xl sm:text-2xl font-black leading-tight">{activeSubSection.quiz.title || "Vérification des acquis"}</h2>
                                                    </div>
                                                </div>
                                            </div>

                                            {(() => {
                                                const bestResult = activeSubSection.quiz?.id ? quizResults
                                                    .filter(r => String(r.quizId) === String(activeSubSection.quiz?.id))
                                                    .sort((a, b) => b.score - a.score)[0] : null;

                                                const isRetaking = activeSubSection.quiz?.id && retakingQuizIds.includes(String(activeSubSection.quiz.id));

                                                if (!quizSubmitted && bestResult && !isRetaking) {
                                                    return (
                                                        <div className="text-left py-10 bg-surface/50 rounded-2xl border border-glass-border p-8 animate-fade-in">
                                                            <div className="flex items-center gap-4 mb-6">
                                                                <div className="p-3 bg-success/10 text-success rounded-xl">
                                                                    <Trophy size={32} />
                                                                </div>
                                                                <div>
                                                                    <h3 className="text-2xl font-black">Quiz déjà complété</h3>
                                                                    <p className="text-text-muted font-bold text-sm">Vous avez déjà tenté ce quiz précédemment.</p>
                                                                </div>
                                                            </div>

                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                                                                <div className="p-5 rounded-2xl bg-surface border border-glass-border shadow-sm">
                                                                    <p className="text-[10px] font-black uppercase text-text-muted tracking-widest mb-1">Meilleur Score</p>
                                                                    <p className="text-3xl font-black text-primary">{Math.round(bestResult.score)}%</p>
                                                                    <p className="text-sm font-bold text-text-muted">(Meilleure tentative)</p>
                                                                </div>
                                                                <div className="p-5 rounded-2xl bg-surface border border-glass-border shadow-sm">
                                                                    <p className="text-[10px] font-black uppercase text-text-muted tracking-widest mb-1">Statut</p>
                                                                    {bestResult.passed ? (
                                                                        <p className="text-lg font-black text-success flex items-center gap-2 mt-1.5"><CheckCircle size={20} /> RÉUSSI</p>
                                                                    ) : (
                                                                        <p className="text-lg font-black text-error flex items-center gap-2 mt-1.5"><AlertTriangle size={20} /> ÉCHOUÉ</p>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            <button
                                                                onClick={() => activeSubSection.quiz?.id && setRetakingQuizIds(prev => [...prev, String(activeSubSection.quiz?.id)])}
                                                                className="px-8 py-3.5 bg-primary text-white rounded-xl font-bold shadow-lg flex items-center gap-2 hover:bg-primary-hover transition-all"
                                                            >
                                                                <PlayCircle size={18} /> Recommencer le quiz
                                                            </button>
                                                        </div>
                                                    );
                                                }

                                                return !quizSubmitted ? (
                                                    <div className="space-y-8 relative z-10">
                                                        {activeQuizQuestions.map((q, qIdx) => (
                                                            <div key={q.id} className="space-y-4">
                                                                <div className="flex gap-3">
                                                                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">{qIdx + 1}</span>
                                                                    <h3 className="font-bold text-lg">{q.text}</h3>
                                                                </div>
                                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-0 sm:pl-9">
                                                                    {q.type === 'OPEN' ? (
                                                                        <textarea className="w-full input sm:col-span-2 min-h-[100px]" placeholder="Votre réponse..." value={quizAnswers[q.id] || ''} onChange={(e) => handleAnswerQuiz(q.id, e.target.value)} />
                                                                    ) : (
                                                                        q.options?.map((opt, oIdx) => {
                                                                            const isSelected = q.type === 'QCM' ? (quizAnswers[q.id] || []).includes(opt) : quizAnswers[q.id] === opt;
                                                                            return (
                                                                                <button
                                                                                    key={oIdx}
                                                                                    onClick={() => {
                                                                                        if (q.type === 'QCM') {
                                                                                            const current = quizAnswers[q.id] || [];
                                                                                            handleAnswerQuiz(q.id, current.includes(opt) ? current.filter((i: string) => i !== opt) : [...current, opt]);
                                                                                        } else {
                                                                                            handleAnswerQuiz(q.id, opt);
                                                                                        }
                                                                                    }}
                                                                                    className={`p-5 rounded-2xl border-2 transition-all text-left text-sm font-bold flex items-center justify-between group-option ${isSelected
                                                                                        ? 'border-primary bg-primary/10 text-primary shadow-lg shadow-primary/5'
                                                                                        : 'border-glass-border bg-surface hover:border-primary/30 hover:bg-primary/5 text-text'
                                                                                        }`}
                                                                                >
                                                                                    <span>{opt}</span>
                                                                                    {isSelected && (
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
                                                        <button
                                                            onClick={() => activeSubSection.quiz && handleSubmitQuiz(activeSubSection.quiz)}
                                                            disabled={Object.keys(quizAnswers).length === 0}
                                                            className="px-10 py-3.5 bg-primary text-white rounded-xl font-bold shadow-lg"
                                                        >
                                                            Valider mes réponses
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="text-left py-10 bg-surface/50 rounded-2xl border border-glass-border p-8">
                                                        <Trophy size={64} className="text-primary ml-0 mb-4" />
                                                        <h3 className="text-2xl font-black mb-2">Quiz Terminé !</h3>
                                                        <div className="space-y-1 mb-4">
                                                            <p className="text-lg font-bold">Score obtenu : <span className="text-primary">{Math.round((quizScore / (activeQuizQuestions.length || 1)) * 100)}%</span> <span className="text-sm text-text-muted">({quizScore} / {activeQuizQuestions.length})</span></p>
                                                            {(() => {
                                                                const results = quizResults.filter(r => String(r.quizId) === String(activeSubSection.quiz?.id));
                                                                if (results.length > 0) {
                                                                    const bestPercent = Math.max(...results.map(r => r.score || 0));
                                                                    return <p className="text-sm font-bold text-success/80 flex items-center gap-2"><Trophy size={14} /> Votre meilleur score historique : {Math.round(bestPercent)}%</p>;
                                                                }
                                                                return null;
                                                            })()}
                                                        </div>

                                                        {quizPassError ? (
                                                            <div className="mt-4 p-4 bg-error/10 border border-error/20 rounded-xl flex items-center gap-3 text-error animate-fade-in shadow-sm">
                                                                <AlertTriangle size={20} className="shrink-0" />
                                                                <div>
                                                                    <p className="text-sm font-black uppercase text-error/80">Échec de validation</p>
                                                                    <p className="text-xs font-bold leading-tight">{quizPassError}</p>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="mt-4 p-4 bg-success/10 border border-success/20 rounded-xl flex items-center gap-3 text-success animate-fade-in shadow-sm">
                                                                <CheckCircle size={20} className="shrink-0" />
                                                                <div>
                                                                    <p className="text-sm font-black uppercase text-success/80">Leçon Validée !</p>
                                                                    <p className="text-xs font-bold leading-tight">Vous pouvez maintenant passer à la leçon suivante.</p>
                                                                </div>
                                                            </div>
                                                        )}

                                                        <button
                                                            onClick={() => {
                                                                setQuizSubmitted(false);
                                                                setQuizAnswers({});
                                                                setQuizPassError(null);
                                                                if (activeSubSection.quiz?.id) {
                                                                    setRetakingQuizIds(prev => [...prev, String(activeSubSection.quiz?.id)]);
                                                                }
                                                            }}
                                                            className="mt-6 text-sm font-black text-primary hover:underline flex items-center gap-2"
                                                        >
                                                            <Trophy size={14} /> Recommencer le test
                                                        </button>
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    )}

                                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-10 border-t border-glass-border">
                                        <button
                                            onClick={() => {
                                                const idx = flatSubSections.findIndex(ss => ss.id === activeSubSectionId);
                                                if (idx > 0) goToSubSection(flatSubSections[idx - 1].id);
                                            }}
                                            disabled={flatSubSections.findIndex(ss => ss.id === activeSubSectionId) <= 0}
                                            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-surface border border-glass-border text-text-muted font-bold transition-all disabled:opacity-30"
                                        >
                                            <ChevronLeft size={20} /> Précédent
                                        </button>
                                        <button
                                            onClick={() => {
                                                const idx = flatSubSections.findIndex(ss => ss.id === activeSubSectionId);
                                                if (idx < flatSubSections.length - 1) {
                                                    const nextId = flatSubSections[idx + 1].id;
                                                    goToSubSection(nextId);
                                                }
                                            }}
                                            disabled={
                                                !activeSubSectionId ||
                                                flatSubSections.findIndex(ss => ss.id === activeSubSectionId) >= flatSubSections.length - 1 ||
                                                !completedSubSections.includes(activeSubSectionId)
                                            }
                                            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 bg-primary text-white rounded-xl font-bold shadow-lg disabled:opacity-30 disabled:grayscale transition-all"
                                        >
                                            Suivant <ChevronRight size={20} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </main>

                <div className="fixed bottom-6 right-6 z-[60] flex flex-col gap-3">
                    <button onClick={scrollToTop} className={`p-4 bg-surface border border-glass-border rounded-2xl text-primary shadow-2xl transition-all ${showScrollTop ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}><ChevronUp size={24} /></button>
                    <button onClick={toggleTheme} className="p-4 bg-primary text-white rounded-2xl shadow-lg transition-all">{theme === 'dark' ? <Sun size={24} /> : <Moon size={24} />}</button>
                </div>

                {showExamSetup && createPortal(
                    <div className="fixed inset-0 z-[1000] bg-black/95 backdrop-blur-xl flex items-center justify-center p-0 sm:p-6 overflow-y-auto">
                        <div className={`w-full h-full sm:h-auto ${course?.finalExam?.settings?.isAiDetectionEnabled ? 'max-w-5xl' : 'max-w-xl'} bg-surface sm:rounded-[3rem] border-x border-glass-border shadow-[0_0_100px_rgba(0,0,0,0.5)] overflow-x-hidden animate-slide-up flex flex-col lg:flex-row min-h-screen sm:min-h-[500px] relative`}>
                            {/* Close Button */}
                            <button
                                onClick={closeExamSetup}
                                className="absolute top-6 right-6 z-50 p-3 bg-white/5 hover:bg-white/10 text-white/50 hover:text-white rounded-2xl transition-all border border-white/10"
                            >
                                <X size={20} />
                            </button>

                            {/* Left: Camera Verification Section - Only visible if AI needed */}
                            {course?.finalExam?.settings?.isAiDetectionEnabled && (
                                <div className="w-full lg:w-[45%] p-6 sm:p-12 bg-black flex flex-col items-center justify-center relative border-b lg:border-b-0 lg:border-r border-white/10">
                                    <div className="absolute top-6 left-6 flex items-center gap-3">
                                        <div className={`w-2 h-2 rounded-full ${isCameraReady ? 'bg-success animate-pulse' : 'bg-amber-500'}`} />
                                        <span className="text-[9px] font-black uppercase text-white/50 tracking-[0.2em] leading-none">Sécurité Bio-Visuelle</span>
                                    </div>

                                    {!isCameraRequested ? (
                                        <div className="text-center py-6 sm:py-10">
                                            <div className="w-16 h-16 sm:w-24 sm:h-24 bg-primary/10 rounded-2xl sm:rounded-[2.5rem] flex items-center justify-center mx-auto mb-4 sm:mb-8 border border-primary/20 shadow-inner">
                                                <Camera size={32} className="text-primary sm:w-[44px] sm:h-[44px]" />
                                            </div>
                                            <h3 className="text-white text-xl sm:text-2xl font-black mb-2 sm:mb-4">Caméra Requise</h3>
                                            <p className="text-white/50 text-xs sm:text-sm font-medium leading-relaxed mb-6 sm:mb-10 max-w-[240px] sm:max-w-[280px] mx-auto">
                                                L'accès à votre caméra est impératif pour la surveillance IA.
                                            </p>
                                            <button
                                                onClick={() => setIsCameraRequested(true)}
                                                className="px-8 py-4 bg-primary text-white font-black rounded-xl sm:rounded-2xl shadow-2xl shadow-primary/40 hover:scale-105 active:scale-95 transition-all text-xs uppercase tracking-wider"
                                            >
                                                Activer
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="w-full flex flex-col justify-center py-4 sm:py-6">
                                            <div className="w-full aspect-[4/3] sm:aspect-video rounded-2xl sm:rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-surface/5 flex items-center justify-center relative group mb-4 sm:mb-6">
                                                <video
                                                    ref={(el) => {
                                                        if (el && !el.srcObject) {
                                                            navigator.mediaDevices.getUserMedia({ video: true })
                                                                .then(stream => {
                                                                    el.srcObject = stream;
                                                                    setupStreamRef.current = stream;
                                                                    setIsCameraReady(true);
                                                                    setCameraError(null);
                                                                })
                                                                .catch(err => {
                                                                    console.error("Camera access error:", err);
                                                                    setIsCameraReady(false);
                                                                    setCameraError("Caméra inaccessible.");
                                                                });
                                                        }
                                                    }}
                                                    autoPlay
                                                    playsInline
                                                    muted
                                                    className="w-full h-full object-cover"
                                                />
                                                {cameraError && (
                                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 bg-black/90 backdrop-blur-sm">
                                                        <AlertTriangle size={32} className="text-amber-500 mb-4" />
                                                        <p className="text-white text-[10px] font-black leading-tight mb-4">{cameraError}</p>
                                                        <button
                                                            onClick={() => setIsCameraRequested(false)}
                                                            className="px-4 py-2 border border-primary/30 text-primary text-[10px] font-black rounded-lg hover:bg-primary/10 transition-all uppercase tracking-widest"
                                                        >
                                                            Réessayer
                                                        </button>
                                                    </div>
                                                )}
                                                {isCameraReady && (
                                                    <div className="absolute bottom-3 left-3 right-3 py-2 px-3 bg-success/20 backdrop-blur-md border border-success/30 rounded-xl flex items-center justify-center gap-2">
                                                        <CheckCircle size={14} className="text-success" />
                                                        <span className="text-[10px] font-black text-white uppercase">Flux validé</span>
                                                    </div>
                                                )}
                                            </div>
                                            <p className="text-white/30 text-[9px] font-bold text-center uppercase tracking-[0.2em] hidden sm:block">Votre image reste locale et sécurisée</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Right: Rules & Final Action Section */}
                            <div className={`w-full ${course?.finalExam?.settings?.isAiDetectionEnabled ? 'lg:w-[55%]' : 'w-full'} p-6 sm:p-16 flex flex-col justify-between text-text bg-surface relative`}>
                                <div>
                                    <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-10">
                                        <div className="p-3 sm:p-4 bg-primary/10 text-primary rounded-2xl shadow-inner border border-primary/10"><Shield size={24} className="sm:w-8 sm:h-8" /></div>
                                        <div>
                                            <h2 className="text-2xl sm:text-4xl font-black tracking-tight leading-none mb-1 sm:mb-2">Prêt pour l'examen ?</h2>
                                            <p className="text-xs sm:text-sm text-text-muted font-bold tracking-tight">Vérifiez les conditions avant de continuer.</p>
                                        </div>
                                    </div>

                                    {/* Premium Rules Row */}
                                    <div className="flex flex-wrap justify-center sm:justify-start gap-2 sm:gap-3 mb-6 sm:mb-8">
                                        <div className="px-3 py-1.5 sm:px-4 sm:py-2 bg-primary/5 border border-primary/10 rounded-xl flex items-center gap-2">
                                            <Maximize size={12} className="text-primary sm:w-3.5 sm:h-3.5" />
                                            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-primary">Plein Écran</span>
                                        </div>
                                        <div className="px-3 py-1.5 sm:px-4 sm:py-2 bg-primary/5 border border-primary/10 rounded-xl flex items-center gap-2">
                                            <Monitor size={12} className="text-primary sm:w-3.5 sm:h-3.5" />
                                            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-primary">{course?.finalExam?.settings?.isAiDetectionEnabled ? 'Surveillance IA' : 'Sans Caméra'}</span>
                                        </div>
                                        <div className="px-3 py-1.5 sm:px-4 sm:py-2 bg-primary/5 border border-primary/10 rounded-xl flex items-center gap-2">
                                            <Clock size={12} className="text-primary sm:w-3.5 sm:h-3.5" />
                                            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-primary">{course?.finalExam?.settings?.timeLimit || 60} min</span>
                                        </div>
                                    </div>

                                    {/* Smart Specification View */}
                                    <div className="mb-6 sm:mb-8 overflow-hidden rounded-2xl sm:rounded-3xl border border-glass-border bg-surface/30 shadow-inner">
                                        <div className="px-5 py-3 bg-primary/5 border-b border-glass-border flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <BarChart3 size={14} className="text-primary sm:w-4 sm:h-4" />
                                                <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-primary">Répartition</span>
                                            </div>
                                            <span className="text-[8px] sm:text-[9px] font-bold text-text-muted uppercase">Objectifs par chapitre</span>
                                        </div>

                                        <div className="p-0">
                                            {(() => {
                                                const parseMH = (str?: string) => {
                                                    if (!str) return 1;
                                                    const val = parseFloat(str.replace(/[^\d.]/g, '').replace(',', '.'));
                                                    return val > 0 ? val : 1;
                                                };
                                                const sectionsWithWeight = (course?.sections || []).filter(s => s.subSections?.some(ss => ss.quiz?.questions?.length || ss.quiz?.settings?.generatedPool?.length));
                                                const totalMH = sectionsWithWeight.reduce((sum, s) => sum + parseMH(s.masseHoraire), 0);
                                                const totalQuestions = course?.finalExam?.settings?.totalQuestions || 20;

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

                                                if (items.length === 0) {
                                                    return <div className="py-8 text-center text-text-muted text-[10px] sm:text-xs font-bold uppercase italic opacity-60">Aucun chapitre avec quiz détecté</div>;
                                                }

                                                let currentTotal = items.reduce((sum, item) => sum + item.floor, 0);
                                                const remaining = totalQuestions - currentTotal;
                                                if (remaining > 0) {
                                                    const sortedByRemainder = [...items].map((item, index) => ({ ...item, originalIndex: index })).sort((a, b) => b.remainder - a.remainder);
                                                    const toDistribute = Math.min(remaining, sortedByRemainder.length);
                                                    for (let i = 0; i < toDistribute; i++) {
                                                        items[sortedByRemainder[i].originalIndex].floor += 1;
                                                    }
                                                }

                                                return (
                                                    <div className="divide-y divide-glass-border/10">
                                                        {/* Mobile View: Cards */}
                                                        <div className="sm:hidden flex flex-col p-4 gap-3">
                                                            {items.map(item => (
                                                                <div key={item.section.id} className="flex flex-col gap-1 p-3 bg-background/50 rounded-xl border border-glass-border/50">
                                                                    <p className="text-[10px] font-black text-text/80 truncate">{item.section.title}</p>
                                                                    <div className="flex justify-between items-center">
                                                                        <span className="text-[9px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded-full">{Math.round(item.weight)}% du parcours</span>
                                                                        <span className="text-xs font-black text-text">{item.floor} <small className="text-[8px] opacity-60 uppercase">Questions</small></span>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>

                                                        {/* Desktop View: Table */}
                                                        <table className="hidden sm:table w-full text-left border-collapse">
                                                            <thead>
                                                                <tr className="bg-surface/50 text-[9px] font-black uppercase tracking-widest text-text-muted/60 border-b border-glass-border/30">
                                                                    <th className="py-3 pl-6">Chapitre</th>
                                                                    <th className="py-3 text-right">Poids</th>
                                                                    <th className="py-3 text-right pr-6">Nb. Questions</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-glass-border/10">
                                                                {items.map(item => (
                                                                    <tr key={item.section.id} className="text-[11px] font-bold text-text hover:bg-primary/5 transition-colors">
                                                                        <td className="py-3 pl-6 truncate max-w-[200px]" title={item.section.title}>{item.section.title}</td>
                                                                        <td className="py-3 text-right text-primary font-black">{Math.round(item.weight)}%</td>
                                                                        <td className="py-3 text-right pr-6 font-black text-xs">{item.floor}</td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                            <tfoot className="bg-primary/5 border-t border-glass-border">
                                                                <tr className="text-[11px] font-black text-primary">
                                                                    <td className="py-3 pl-6 uppercase tracking-wider text-[9px]">Total de l'examen</td>
                                                                    <td className="py-3 text-right">100%</td>
                                                                    <td className="py-3 text-right pr-6 text-xs">{totalQuestions} pts</td>
                                                                </tr>
                                                            </tfoot>
                                                        </table>
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <label className="p-4 sm:p-5 bg-primary/5 rounded-2xl sm:rounded-3xl border border-primary/10 flex items-start gap-4 cursor-pointer hover:bg-primary/10 transition-colors group/terms">
                                        <div className="relative flex items-center mt-0.5">
                                            <input 
                                                type="checkbox" 
                                                checked={isAgreedToTerms}
                                                onChange={(e) => setIsAgreedToTerms(e.target.checked)}
                                                className="peer h-4 w-4 sm:h-5 sm:w-5 cursor-pointer appearance-none rounded-md border-2 border-primary/30 transition-all checked:bg-primary checked:border-primary focus:outline-none"
                                            />
                                            <Check size={12} className="sm:w-[14px] sm:h-[14px] absolute left-0.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" />
                                        </div>
                                        <p className="text-[9px] sm:text-[11px] font-bold leading-normal text-text-muted group-hover/terms:text-text transition-colors">
                                            {course?.finalExam?.settings?.isAiDetectionEnabled 
                                                ? <>Je certifie avoir lu les consignes. J'accepte l'utilisation de ma <strong className="text-primary">caméra pour la surveillance</strong> et je valide l'intégrité de cet examen.</>
                                                : <>Je certifie avoir lu les consignes. J'accepte le règlement de l'épreuve et les mesures <strong className="text-primary">anti-triche</strong>.</>
                                            }
                                        </p>
                                    </label>
                                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-2 mb-4 sm:mb-0">
                                        <button
                                            onClick={closeExamSetup}
                                            className="flex-1 py-4 sm:py-5 text-xs sm:text-sm font-black text-text-muted hover:text-text hover:bg-surface-variant rounded-xl sm:rounded-2xl transition-all border border-glass-border sm:border-0"
                                        >
                                            Annuler
                                        </button>
                                        <button
                                            onClick={() => {
                                                const settings = course?.finalExam?.settings;
                                                const needsCamera = settings?.isAiDetectionEnabled;
                                                if ((!needsCamera || isCameraReady) && isAgreedToTerms) startExam();
                                            }}
                                            disabled={(course?.finalExam?.settings?.isAiDetectionEnabled && !isCameraReady) || !isAgreedToTerms}
                                            className="flex-[2] btn-primary py-4 sm:py-5 rounded-xl sm:rounded-2xl text-base sm:text-lg font-black shadow-2xl flex items-center justify-center gap-3 transition-all disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed group active:scale-95"
                                        >
                                            Lancer <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform sm:w-[22px] sm:h-[22px]" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>,
                    document.body
                )}

                {
                    isExamActive && createPortal(
                        <div
                            className="fixed inset-0 z-[100] bg-background flex flex-col animate-fade-in select-none exam-mode"
                            onContextMenu={(e) => e.preventDefault()}
                            style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
                        >
                            {/* Violation Warning Banner */}
                            {violationWarning && (
                                <div className="fixed top-0 inset-x-0 z-[200] bg-[#f59e0b] text-white px-6 py-4 flex items-center justify-center gap-3 font-black text-base shadow-[0_10px_40px_rgba(0,0,0,0.3)] animate-bounce">
                                    <AlertTriangle size={24} className="animate-pulse" />
                                    {violationWarning}
                                </div>
                            )}

                            <div className="bg-surface border-b border-glass-border p-4 flex justify-between items-center bg-error/5 text-text">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-error/20 text-error rounded-lg"><Shield size={20} /></div>
                                    <div>
                                        <h3 className="text-sm font-black uppercase tracking-wider text-error">Mode Examen Sécurisé Actif</h3>
                                        <p className="text-[10px] text-text-muted">Infractions: <span className="text-error font-black">{violationCount}/3</span> | Toute sortie de la fenêtre annulera l'examen.</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-6">
                                    <div className="flex items-center bg-surface border border-glass-border rounded-2xl px-5 py-3 shadow-xl backdrop-blur-md">
                                        <Clock size={24} className={`mr-3 ${examTimeLeft < 300 ? 'text-error' : 'text-primary'}`} />
                                        <div className="flex flex-col items-start leading-none">
                                            <span className="text-[10px] uppercase font-black text-text-muted mb-1 tracking-widest">Temps restant</span>
                                            <span className={`font-black text-2xl tabular-nums ${examTimeLeft < 300 ? 'text-error animate-pulse' : 'text-primary'}`}>
                                                {Math.floor(examTimeLeft / 60)}:{(examTimeLeft % 60).toString().padStart(2, '0')}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-12 text-text">
                                <div className="max-w-3xl mx-auto space-y-12 pb-20">
                                    {!examSubmitted && !examFailed ? (
                                        <>
                                            <div className="text-center space-y-4">
                                                <h1 className="text-4xl font-black">{course?.finalExam?.title || "Examen Final"}</h1>
                                                <p className="text-text-muted">Répondez à toutes les questions pour valider votre certification.</p>
                                            </div>

                                            {/* AI Video Monitoring Preview */}
                                            {course?.finalExam?.settings?.isAiDetectionEnabled && (
                                                <>
                                                    <div className="fixed top-20 left-2 lg:top-28 lg:left-auto lg:right-6 z-[100] group pointer-events-auto transition-all duration-500 translate-x-0 opacity-100">
                                                        <div className={`relative w-24 h-20 lg:w-80 lg:h-60 rounded-2xl lg:rounded-3xl overflow-hidden border-2 lg:border-4 shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all duration-300 ${isModelLoading ? 'border-amber-500/50' : 'border-primary/50'} bg-black`}>
                                                            <video
                                                                ref={videoRef}
                                                                autoPlay
                                                                playsInline
                                                                muted
                                                                className="w-full h-full object-cover"
                                                            />
                                                            {isModelLoading && (
                                                                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-center p-2">
                                                                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin mb-2" />
                                                                    <span className="text-[6px] lg:text-[8px] font-black text-white uppercase tracking-widest">IA : Chargement...</span>
                                                                </div>
                                                            )}
                                                            <div className="absolute bottom-1 lg:bottom-2 left-1 lg:left-2 right-1 lg:right-2 flex items-center justify-between px-1 lg:px-2 py-0.5 lg:py-1 bg-black/60 backdrop-blur-md rounded-lg border border-white/10">
                                                                <div className="flex items-center gap-1.5">
                                                                    <div className={`w-1 lg:w-1.5 h-1 lg:h-1.5 rounded-full animate-pulse bg-success`} />
                                                                    <span className="text-[6px] lg:text-[8px] font-black text-white uppercase tracking-widest">
                                                                        {isMobile ? 'IA ACTIVE' : 'Surveillance IA Active'}
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            {/* Bounding Boxes (Python Server Mode Only) */}
                                                            {detectionEngine === 'python' && pythonDetections.map((det: any, idx: number) => {
                                                                const [x1, y1, x2, y2] = det.bbox;
                                                                const left = (x1 / 640) * 100;
                                                                const top = (y1 / 480) * 100;
                                                                const width = ((x2 - x1) / 640) * 100;
                                                                const height = ((y2 - y1) / 480) * 100;
                                                                const isTriche = det.color === 'red' || det.is_triche || det.class.toLowerCase().includes('phone') || det.class.toLowerCase().includes('triche');
                                                                const isPerson = det.class === 'person' || det.class === 'personne';
                                                                const boxColor = isTriche ? 'border-red-600 bg-red-500/30' : 'border-primary/60 bg-primary/5';
                                                                const labelBg = isTriche ? 'bg-red-600' : 'bg-primary';

                                                                return (
                                                                    <div
                                                                        key={idx}
                                                                        className={`absolute border-2 ${boxColor} ${isTriche ? 'animate-pulse' : ''} pointer-events-none rounded transition-all duration-300`}
                                                                        style={{
                                                                            left: `${left}%`,
                                                                            top: `${top}%`,
                                                                            width: `${width}%`,
                                                                            height: `${height}%`,
                                                                            zIndex: 50
                                                                        }}
                                                                    >
                                                                        <div className={`absolute top-0 transform -translate-y-full px-1.5 py-0.5 ${labelBg} text-white text-[7px] font-black uppercase rounded-t tracking-widest`}>
                                                                            {isTriche ? `TRICHE : ${det.class.toUpperCase()}` : isPerson ? 'Étudiant' : det.class.toUpperCase()}
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                </>
                                            )}
                                            <div className="space-y-12">
                                                {activeExamQuestions.map((q, qIdx) => (
                                                    <div key={q.id} className="space-y-6 bg-surface p-8 rounded-3xl border border-glass-border shadow-sm">
                                                        <div className="flex gap-4">
                                                            <span className="flex-shrink-0 w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black text-lg">{qIdx + 1}</span>
                                                            <h3 className="font-extrabold text-xl leading-snug">{q.text}</h3>
                                                        </div>
                                                        <div className="grid grid-cols-1 gap-3 pl-14">
                                                            {q.type === 'OPEN' ? (
                                                                <textarea className="w-full input min-h-[150px] text-base" placeholder="Rédigez votre réponse ici..." value={examAnswers[q.id] || ''} onChange={(e) => handleAnswerExam(q.id, e.target.value)} />
                                                            ) : (
                                                                q.options?.map((opt, oIdx) => {
                                                                    const isSelected = q.type === 'QCM' ? (examAnswers[q.id] || []).includes(opt) : examAnswers[q.id] === opt;
                                                                    return (
                                                                        <button
                                                                            key={oIdx}
                                                                            onClick={() => {
                                                                                if (q.type === 'QCM') {
                                                                                    const current = examAnswers[q.id] || [];
                                                                                    handleAnswerExam(q.id, current.includes(opt) ? current.filter((i: string) => i !== opt) : [...current, opt]);
                                                                                } else {
                                                                                    handleAnswerExam(q.id, opt);
                                                                                }
                                                                            }}
                                                                            className={`p-4 rounded-xl border-2 transition-all text-left text-base font-bold ${isSelected ? 'border-primary bg-primary/10 text-primary shadow-lg shadow-primary/10' : 'border-glass-border bg-background hover:border-primary/30'}`}
                                                                        >
                                                                            <div className="flex items-center gap-3">
                                                                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-primary bg-primary' : 'border-glass-border'}`}>{isSelected && <div className="w-2 h-2 bg-white rounded-full" />}</div>
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
                                            <div className="flex justify-center"><button onClick={() => course?.finalExam && handleSubmitQuiz(course.finalExam)} className="px-16 py-5 bg-primary text-white rounded-2xl font-black text-xl shadow-2xl">Soumettre l'Examen</button></div>
                                        </>
                                    ) : examFailed ? (
                                        <div className="max-w-md mx-auto mt-20 p-10 bg-surface rounded-[2.5rem] border border-error/30 text-center shadow-2xl">
                                            <div className="w-24 h-24 bg-error/10 text-error rounded-3xl flex items-center justify-center mx-auto mb-6">
                                                <AlertTriangle size={48} />
                                            </div>
                                            <h2 className="text-3xl font-black text-error mb-2">Tentative Enregistrée — Échec</h2>
                                            <p className="text-text-muted mb-2 text-base font-medium leading-relaxed">{examFailed.reason}</p>
                                            <p className="text-text-muted/60 text-sm mb-8">Votre tentative a été enregistrée avec un score de 0%. L'examen ne peut être passé qu'une seule fois.</p>
                                            <button
                                                onClick={() => {
                                                    setIsExamActive(false);
                                                    setExamFailed(null);
                                                    try { document.exitFullscreen(); } catch (_) { }
                                                }}
                                                className="w-full py-4 bg-error text-white font-black rounded-2xl transition-all hover:bg-error/80"
                                            >
                                                Fermer
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="max-w-2xl mx-auto mt-20 p-12 bg-surface rounded-[3rem] border border-glass-border text-center shadow-2xl relative overflow-hidden text-text">
                                            <div className="absolute top-0 inset-x-0 h-2 bg-primary"></div>
                                            <div className="w-28 h-28 bg-primary/10 text-primary rounded-[2rem] flex items-center justify-center mx-auto mb-8 animate-bounce"><CheckCircle size={56} /></div>
                                            <h2 className="text-4xl font-black mb-4">Examen Terminé</h2>
                                            <div className="py-6 mb-8 rounded-3xl bg-primary/5 border border-primary/10">
                                                <p className="text-text-muted font-bold uppercase tracking-widest text-xs mb-1">Votre Note Finale</p>
                                                <div className="text-6xl font-black text-primary">{Math.round((examResult?.score || 0) / (examResult?.total || 1) * 100)}%</div>
                                                <p className="text-sm font-bold text-text-muted mt-2">{examResult?.score} / {examResult?.total} réponses correctes</p>
                                            </div>
                                            <p className="text-text-muted mb-10 text-lg">Vos résultats ont été transmis à l'administration.</p>
                                            <button onClick={() => { setIsExamActive(false); setExamSubmitted(false); try { document.exitFullscreen(); } catch (e) { } }} className="btn-primary w-full py-5 rounded-2xl text-xl font-black shadow-xl">Terminer et quitter</button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>,
                        document.body
                    )
                }

                <style>{`
                .rich-content-area {
                    font-size: 1.125rem;
                    line-height: 1.8;
                    overflow-wrap: break-word;
                    word-break: break-word;
                }
                .rich-content-area h1 { font-size: 2.5rem; font-weight: 900; margin-bottom: 2rem; color: var(--text); border-bottom: 2px solid var(--primary); padding-bottom: 0.5rem; }
                .rich-content-area h2 { font-size: 2rem; font-weight: 800; margin-bottom: 1.5rem; margin-top: 3rem; color: var(--text); }
                .rich-content-area h3 { font-size: 1.5rem; font-weight: 700; margin-bottom: 1.25rem; margin-top: 2.5rem; color: var(--text); }
                .rich-content-area p { margin-bottom: 1.5rem; }
                .rich-content-area ul, .rich-content-area ol { margin-left: 1.5rem; margin-bottom: 2rem; list-style-position: outside; }
                .rich-content-area li { margin-bottom: 0.75rem; }
                .rich-content-area strong { color: var(--text); font-weight: 800; }
                
                .rich-content-area img { 
                    max-width: 100%;
                    height: auto;
                    border-radius: 1.5rem; 
                    margin: 3rem auto; 
                    display: block;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.2); 
                }

                .rich-content-area .ql-align-center { text-align: center; }
                .rich-content-area .ql-align-right { text-align: right; }
                .rich-content-area .ql-align-justify { text-align: justify; }
                .rich-content-area .ql-video { 
                    width: 100%; 
                    aspect-ratio: 16 / 9; 
                    border-radius: 1.5rem; 
                    margin: 3rem 0; 
                    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
                }
                
                @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
                .animate-fade-in { animation: fadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
                
                .group-option:hover { transform: translateY(-2px); }
                .group-option:active { transform: scale(0.98); }

                /* Exam mode: prevent text selection and drag */
                .exam-mode, .exam-mode * {
                    user-select: none !important;
                    -webkit-user-select: none !important;
                    -moz-user-select: none !important;
                    pointer-events: auto;
                    -webkit-touch-callout: none;
                }
            `}</style>
            </div>
        </>
    );
};

export default CoursePreviewPage;
