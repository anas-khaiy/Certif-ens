import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate } from 'react-router';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

const Q = (ReactQuill as any).Quill;
if (Q) {
    const Parchment = Q.import('parchment');
    const ImageWidth = new Parchment.StyleAttributor('width', 'width', { scope: Parchment.Scope.INLINE });
    const ImageHeight = new Parchment.StyleAttributor('height', 'height', { scope: Parchment.Scope.INLINE });
    Q.register(ImageWidth, true);
    Q.register(ImageHeight, true);
}

import { useCourses } from '../hooks/useCourses';
import type { BackendSpecialite, Course, Formation, Question, Quiz, QuizSettings, Section, SubSection } from '../types';
import api from '../api/api-client';
import { API_FORMATEUR, API_APPRENANT, API_ADMIN, WS_APPRENANT, WS_LIVEKIT, AI_DETECT_URL, VERIFY_URL_APPRENANT, VERIFY_URL_FORMATEUR } from '../config';
import {
    BookOpen,
    ArrowLeft,
    Save,
    Trash2,
    Plus,
    ChevronRight,
    ChevronDown,
    ChevronLeft,
    Youtube,
    FileText,
    PlayCircle,
    HelpCircle,
    Upload,
    X,
    Layout,
    Type,
    Video,
    CheckSquare,
    Sparkles,
    Circle,
    MessageSquare,
    Check,
    Globe,
    Lock,
    AlertCircle,
    CheckCircle2,
    Eye,
    Users,
    UserPlus,
    UserCheck,
    Search,
    Clock,
    Bell,
    Shield,
    GraduationCap,
    Library,
    RefreshCw,
    AlertTriangle,
    BarChart3,
    Github,
    Link as LinkIcon,
    ArrowUpRight,
    Timer,
    Briefcase
} from 'lucide-react';

// --- STYLES INJECTÉS ---
// Map CourseEditor-specific variables to global theme variables
const PAGE_STYLES = `
:root, [data-theme="light"], [data-theme="dark"] {
  --ce-card-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
}

[data-theme="light"] {
  --ce-card-shadow: 0 4px 20px -5px rgba(0, 0, 0, 0.1);
}

* {
    box-sizing: border-box;
}

.ce-card-shadow {
    box-shadow: var(--ce-card-shadow);
}

/* Custom Scrollbar */
.custom-scrollbar::-webkit-scrollbar {
  width: 8px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: var(--background);
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: var(--glass-border);
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: var(--text-muted);
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fade-in {
  animation: fadeIn 0.4s ease-out forwards;
}

.input {
  background-color: var(--background);
  border: 1px solid var(--glass-border);
  color: var(--text);
  padding: 0.75rem 1.25rem;
  border-radius: 0.75rem;
  outline: none;
}
.input:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
}

.btn-primary {
  background-color: var(--primary);
  color: white;
  border-radius: 0.75rem;
  padding: 0.75rem 1.5rem;
  font-weight: 600;
  border: none;
}
.btn-primary:hover {
  background-color: var(--primary-hover);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.card {
    background-color: var(--surface);
    border: 1px solid var(--glass-border);
    border-radius: 1.5rem;
    box-shadow: var(--ce-card-shadow);
}

.icon-container {
    display: flex;
    align-items: center;
    justify-content: center;
}

/* Quill Wrapper Structure */
.quill-wrapper {
  background: var(--surface);
  border-radius: 1rem;
  border: 1px solid var(--glass-border);
  overflow: hidden;
  min-height: 300px;
  display: flex;
  flex-direction: column;
}

.quill-wrapper .quill {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.quill-wrapper .ql-container {
  border: none !important;
  flex: 1;
  font-family: inherit;
  color: var(--text) !important;
}

.quill-wrapper .ql-editor {
  min-height: 200px;
}

.quill-wrapper .ql-toolbar {
  border: none !important;
  border-bottom: 1px solid var(--glass-border) !important;
  background: var(--background) !important;
  padding: 12px !important;
  border-radius: 1rem 1rem 0 0;
}

/* Fix Quill toolbar icons visibility */
.quill-wrapper .ql-stroke {
  stroke: var(--text) !important;
  stroke-width: 2px !important;
}

.quill-wrapper .ql-fill {
  fill: var(--text) !important;
}

.quill-wrapper .ql-picker {
  color: var(--text) !important;
}

.quill-wrapper .ql-picker-options {
  background-color: var(--surface) !important;
  border-color: var(--glass-border) !important;
  border-radius: 0.5rem;
}

.quill-wrapper .ql-active .ql-stroke {
  stroke: var(--primary) !important;
}

.quill-wrapper .ql-active .ql-fill {
  fill: var(--primary) !important;
}

.modal-overlay {
    position: fixed;
    inset: 0 !important;
    top: 0 !important;
    left: 0 !important;
    margin: 0 !important;
    width: 100vw !important;
    height: 100vh !important;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(4px);
    padding: 1rem;
    z-index: 10000;
}
`;

// --- Helpers ---
const generateId = () => `temp-${Math.random().toString(36).substr(2, 9)}`;

// Map raw cheating reason strings to short user-friendly labels + icons
const parseCheatingReason = (reason: string): { icon: string; label: string; color: string } => {
    const r = reason.toLowerCase();
    if (r.includes('onglet') || r.includes('visib'))
        return { icon: '🪟', label: 'Changement d\'onglet', color: 'orange' };
    if (r.includes('fenêtre') || r.includes('fenetre') || r.includes('blur') || r.includes('focus'))
        return { icon: '↗️', label: 'Sortie de fenêtre', color: 'orange' };
    if (r.includes('plein écran') || r.includes('fullscreen'))
        return { icon: '⛶', label: 'Quitte plein écran', color: 'red' };
    if (r.includes('redimension') || r.includes('resize'))
        return { icon: '📐', label: 'Redimensionnement', color: 'orange' };
    if (r.includes('navigation') || r.includes('retour') || r.includes('popstate'))
        return { icon: '⬅️', label: 'Navigation arrière', color: 'red' };
    if (r.includes('rechargement') || r.includes('fermeture') || r.includes('unload'))
        return { icon: '🔄', label: 'Fermeture de page', color: 'red' };
    return { icon: '🚫', label: 'Activité suspecte', color: 'red' };
};
const isTempId = (id: any) => !id || (typeof id === 'string' && (id.startsWith('temp-') || id === 'new'));

const stripTempIds = (obj: any): any => {
    if (Array.isArray(obj)) return obj.map(stripTempIds);
    if (obj !== null && typeof obj === 'object') {
        const newObj: any = {};
        for (const key in obj) {
            if (key === 'id' && isTempId(obj[key])) continue;
            newObj[key] = stripTempIds(obj[key]);
        }
        return newObj;
    }
    return obj;
};

interface StudentAnswer {
    questionId: string;
    type: 'QCU' | 'QCM' | 'OPEN';
    learnerAnswer: any; // index for QCU, array for QCM, string for OPEN
    isCorrect?: boolean;
    score?: number; // 0 or 1 for QCU/QCM, 0-20 for OPEN (manual)
    feedback?: string;
}

interface QuizSubmission {
    id?: string;
    quizId: string;
    quizTitle: string;
    submittedAt: string;
    answers: StudentAnswer[];
    totalScore?: number;
    status: 'pending' | 'graded';
    cheatingReason?: string | null;
}

interface EnrolledLearner {
    id: string;
    nom: string;
    prenom: string;
    email: string;
    totalQuizScore: number;
    quizzesSubmitted: number;
    totalQuizzes: number;
    sectionsCompleted: number;
    totalSections: number;
    finalExamNote: number | null;
    specialite?: string;
    cheatingReason?: string | null;
    submissions?: QuizSubmission[];
    tpSubmissions?: any[];
    totalTimeSpentSec?: number;
}



// Editor Component using ReactQuill — uses Base64 locally for instant preview.
// Images are uploaded to the server (and Base64 replaced with URLs) at save time.
// IMPORTANT: modules must be defined outside or memoized with NO dependencies,
// and onChange is stored in a ref to prevent ReactQuill from remounting on each parent re-render.

const MockQuill: React.FC<{
    value: string;
    onChange: (val: string) => void;
    placeholder?: string;
    className?: string;
    hideImages?: boolean;
}> = React.memo(({ value, onChange, placeholder, className, hideImages }) => {
    // Memoize modules so ReactQuill doesn't re-render unless hideImages changes
    const modules = React.useMemo(() => {
        const toolbar: any[] = [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            [{ 'align': [] }],
            ['link'],
            ['clean']
        ];
        if (!hideImages) {
            // Add image to the same group as link
            toolbar[4].push('image');
        }
        return { toolbar };
    }, [hideImages]);

    // Keep latest onChange in ref — avoids stale closures and never triggers re-renders
    const onChangeRef = React.useRef(onChange);
    React.useLayoutEffect(() => { onChangeRef.current = onChange; });

    // Track the last value we received from the PARENT so we can distinguish
    // "user typed something" vs "parent updated value prop" (the latter must NOT
    // re-fire onChange, because that causes the infinite setState loop).
    const lastExternalValue = React.useRef(value);
    React.useEffect(() => { lastExternalValue.current = value; }, [value]);

    const handleChange = React.useCallback((newVal: string) => {
        // Only propagate to parent if value actually changed from user input
        if (newVal !== lastExternalValue.current) {
            lastExternalValue.current = newVal;
            onChangeRef.current(newVal);
        }
    }, []);

    // ── Image Resize Overlay ─────────────────────────────────────────────────
    const wrapperRef = React.useRef<HTMLDivElement>(null);
    const [selectedImg, setSelectedImg] = React.useState<HTMLImageElement | null>(null);
    const [imgRect, setImgRect] = React.useState<DOMRect | null>(null);
    const dragStateRef = React.useRef<{
        startX: number; startW: number; handle: string; img: HTMLImageElement;
    } | null>(null);

    // Re-compute overlay position (called on scroll/resize too)
    const updateRect = React.useCallback((img: HTMLImageElement) => {
        setImgRect(img.getBoundingClientRect());
    }, []);

    // Click inside editor — detect image click
    const handleEditorClick = React.useCallback((e: MouseEvent) => {
        const target = e.target as HTMLElement;
        if (target.tagName === 'IMG') {
            const img = target as HTMLImageElement;
            setSelectedImg(img);
            updateRect(img);
        } else {
            setSelectedImg(null);
            setImgRect(null);
        }
    }, [updateRect]);

    // Attach / detach listener on the ql-editor div
    React.useEffect(() => {
        const wrapper = wrapperRef.current;
        if (!wrapper) return;
        // ql-editor is rendered by ReactQuill inside our wrapper
        const attach = () => {
            const editor = wrapper.querySelector('.ql-editor');
            if (editor) {
                editor.addEventListener('click', handleEditorClick as EventListener);
                return () => editor.removeEventListener('click', handleEditorClick as EventListener);
            }
        };
        // Wait a tick for ReactQuill to render
        const timeout = setTimeout(() => {
            const cleanup = attach();
            return cleanup;
        }, 150);
        return () => {
            clearTimeout(timeout);
            // Since we can't easily return the cleanup from inside setTimeout's effect, 
            // we'll just rely on the next effect run or unmount.
            // For a production component we'd manage this more strictly with a ref for the editor.
        };
    }, [handleEditorClick]);

    // Keep overlay in sync when window scrolls or resizes
    React.useEffect(() => {
        if (!selectedImg) return;
        const update = () => updateRect(selectedImg);
        window.addEventListener('scroll', update, true);
        window.addEventListener('resize', update);
        return () => {
            window.removeEventListener('scroll', update, true);
            window.removeEventListener('resize', update);
        };
    }, [selectedImg, updateRect]);

    // ── Drag-to-resize logic ────────────────────────────────────────────────
    const startDrag = React.useCallback((e: React.MouseEvent, handle: string) => {
        if (!selectedImg) return;
        e.preventDefault();
        e.stopPropagation();
        dragStateRef.current = {
            startX: e.clientX,
            startW: selectedImg.offsetWidth || selectedImg.naturalWidth,
            handle,
            img: selectedImg,
        };

        const onMouseMove = (mv: MouseEvent) => {
            const ds = dragStateRef.current;
            if (!ds) return;
            const delta = mv.clientX - ds.startX;
            const newW = Math.max(40, (ds.handle === 'nw' || ds.handle === 'sw')
                ? ds.startW - delta
                : ds.startW + delta);

            // Set both style and attribute for maximum compatibility
            ds.img.style.width = `${newW}px`;
            ds.img.style.height = 'auto';
            ds.img.setAttribute('width', newW.toString());
            ds.img.removeAttribute('height'); // Ensure aspect ratio is maintained

            updateRect(ds.img);
        };

        const onMouseUp = () => {
            const ds = dragStateRef.current;
            dragStateRef.current = null;
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);

            // CRITICAL: Manually trigger onChange with the updated HTML
            if (ds && wrapperRef.current) {
                const editor = wrapperRef.current.querySelector('.ql-editor');
                if (editor) {
                    const html = editor.innerHTML;
                    lastExternalValue.current = html;
                    onChangeRef.current(html);
                }
            }
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    }, [selectedImg, updateRect]);

    // Render overlay via portal so it sits above everything (fixed positioning)
    const HANDLE_SIZE = 10;
    const handles = [
        { id: 'nw', style: { top: -HANDLE_SIZE / 2, left: -HANDLE_SIZE / 2, cursor: 'nw-resize' } },
        { id: 'ne', style: { top: -HANDLE_SIZE / 2, right: -HANDLE_SIZE / 2, cursor: 'ne-resize' } },
        { id: 'sw', style: { bottom: -HANDLE_SIZE / 2, left: -HANDLE_SIZE / 2, cursor: 'sw-resize' } },
        { id: 'se', style: { bottom: -HANDLE_SIZE / 2, right: -HANDLE_SIZE / 2, cursor: 'se-resize' } },
    ];

    const overlay = selectedImg && imgRect ? createPortal(
        <div
            style={{
                position: 'fixed',
                top: imgRect.top,
                left: imgRect.left,
                width: imgRect.width,
                height: imgRect.height,
                outline: '2px solid #6366f1',
                pointerEvents: 'none',
                zIndex: 9999,
                boxSizing: 'border-box',
            }}
        >
            {handles.map(h => (
                <div
                    key={h.id}
                    onMouseDown={(e) => startDrag(e, h.id)}
                    style={{
                        position: 'absolute',
                        width: HANDLE_SIZE,
                        height: HANDLE_SIZE,
                        background: '#6366f1',
                        border: '2px solid #fff',
                        borderRadius: 2,
                        pointerEvents: 'all',
                        ...h.style,
                    }}
                />
            ))}
        </div>,
        document.body
    ) : null;
    // ────────────────────────────────────────────────────────────────────────

    return (
        <div ref={wrapperRef} className={`quill-wrapper ${className}`}>
            <ReactQuill
                theme="snow"
                value={value}
                onChange={handleChange}
                placeholder={placeholder}
                modules={modules}
            />
            {overlay}
        </div>
    );
});

const ConfirmationModal: React.FC<{
    isOpen: boolean;
    title: string;
    message: string;
    type?: 'danger' | 'success' | 'warning';
    confirmText?: string;
    onConfirm: () => void;
    onCancel?: () => void;
    onClose?: () => void;
}> = ({ isOpen, title, message, type = 'danger', confirmText, onConfirm, onCancel, onClose }) => {
    if (!isOpen) return null;

    const handleClose = onClose || onCancel || (() => { });

    const getIcon = () => {
        switch (type) {
            case 'success': return <CheckCircle2 size={40} className="text-green-500" />;
            case 'warning': return <AlertCircle size={40} className="text-orange-500" />;
            default: return <Trash2 size={40} className="text-error" />;
        }
    };

    const getBgColor = () => {
        switch (type) {
            case 'success': return 'bg-green-500/10';
            case 'warning': return 'bg-orange-500/10';
            default: return 'bg-error/10';
        }
    };

    const getConfirmBtnColor = () => {
        switch (type) {
            case 'success': return 'bg-green-500 hover:bg-green-600 shadow-green-500/20';
            case 'warning': return 'bg-orange-500 hover:bg-orange-600 shadow-orange-500/20';
            default: return 'bg-error hover:bg-error/80 shadow-error/20';
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in m-0" style={{ margin: 0, top: 0, left: 0 }} onClick={handleClose}>
            <div className="bg-surface border border-glass-border p-8 rounded-3xl shadow-2xl max-w-md w-full mx-4 text-center relative overflow-hidden animate-fade-in" style={{ zIndex: 10001, margin: 'auto' }} onClick={(e) => e.stopPropagation()}>
                <div className={`w-20 h-20 ${getBgColor()} rounded-full flex items-center justify-center mx-auto mb-4`}>
                    {getIcon()}
                </div>
                <h3 className="text-2xl font-bold mb-2 text-text">{title}</h3>
                <p className="text-text-muted mb-6">{message}</p>
                <div className="flex gap-4">
                    {onCancel && (
                        <button
                            onClick={onCancel}
                            className="flex-1 px-6 py-3 rounded-xl bg-surface border border-glass-border font-bold hover:bg-surface-hover transition-all text-text"
                        >
                            Annuler
                        </button>
                    )}
                    <button
                        onClick={onConfirm}
                        className={`flex-1 px-6 py-3 rounded-xl text-white font-bold shadow-lg transition-all ${getConfirmBtnColor()}`}
                    >
                        {confirmText || (type === 'danger' ? 'Supprimer' : type === 'success' ? 'Continuer' : 'D\'accord')}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

const stripHtml = (html: string) => {
    if (!html) return "";
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || "";
};

// --- NEW QUIZ EDITOR ---
const QuizEditorModal: React.FC<{
    initialQuiz?: Quiz | null;
    onSave: (quiz: Quiz) => void;
    onClose: () => void;
    maxPoolSize?: number;
    title?: string;
    description?: string;
    isExam?: boolean;
    lessonContent?: string;
    courseSections?: Section[];
    openConfirmModal?: (title: string, message: string, onConfirm: () => void, type?: 'danger' | 'success' | 'warning', onCancel?: () => void, confirmText?: string) => void;
    closeConfirmModal?: () => void;
}> = ({ initialQuiz, onSave, onClose, maxPoolSize = 60, title = "Éditeur de Quiz", description, isExam = false, lessonContent = "", courseSections = [], openConfirmModal, closeConfirmModal }) => {
    const [quizMode, setQuizMode] = useState<'manual' | 'dynamic' | 'settings'>(initialQuiz?.settings?.mode || 'manual');
    const [isGenerating, setIsGenerating] = useState(false);
    const [settings, setSettings] = useState<QuizSettings>(() => {
        const baseSettings = initialQuiz?.settings || {
            mode: 'manual',
            aiGeneratedCount: 10,
            totalQuestions: 5,
            qcuCount: 3,
            qcmCount: 2,
            openCount: 0,
            passingScore: 70,
            timeLimit: 60,
            generatedPool: [],
            isAiDetectionEnabled: false,
            aiDetectionType: 'backend',
            isRandom: false,
            detectPhone: true,
            detectMultiplePersons: true,
            detectForbiddenObjects: true,
            detectLookingAway: true,
            detectTabSwitch: true,
            detectFullscreenExit: true,
            detectWindowBlur: true,
            detectSound: true
        };
        // Ensure mode is set if missing from initial settings
        if (!baseSettings.mode) {
            baseSettings.mode = initialQuiz?.questions && initialQuiz.questions.length > 0 ? 'manual' : 'manual';
        }

        if ((baseSettings.mode === 'dynamic' || isExam) && initialQuiz?.questions && (!baseSettings.generatedPool || baseSettings.generatedPool.length === 0)) {
            baseSettings.generatedPool = initialQuiz.questions;
            baseSettings.totalQuestions = Math.min(baseSettings.totalQuestions || 5, initialQuiz.questions.length);
        }

        return baseSettings as QuizSettings;
    });

    const [questions, setQuestions] = useState<Question[]>(initialQuiz?.questions || [{
        id: generateId(),
        type: 'QCU',
        text: '',
        options: ['', ''],
        correctAnswers: [0]
    }]);

    // Table de Spécification States
    const [targetTotalQuestions, setTargetTotalQuestions] = useState<number>(settings.totalQuestions || 20);
    const [sectionQuestionsCount, setSectionQuestionsCount] = useState<{ [key: string]: number }>({});
    
    // Parse masseHoraire to number (e.g. "10h" -> 10, "1.5" -> 1.5)
    // Defaults to 1 if empty or 0 to ensure weighted distribution
    const parseMasseHoraire = (str?: string) => {
        if (!str || str.trim() === "") return 1;
        const val = parseFloat(str.replace(/[^\d.]/g, '').replace(',', '.'));
        return (val && val > 0) ? val : 1;
    };

    // Helper: count available questions in a section
    const getAvailableQuestionsInSection = (sectionId: string) => {
        const section = courseSections.find(s => s.id === sectionId);
        if (!section) return 0;
        let count = 0;
        const seen = new Set(); // Prevent duplicates within same section
        section.subSections?.forEach(ss => {
            const processQ = (q: Question) => {
                const k = q.id || q.text;
                if (!seen.has(k)) { seen.add(k); count++; }
            };
            if (ss.quiz?.questions) ss.quiz.questions.forEach(processQ);
            if (ss.quiz?.settings?.generatedPool) ss.quiz.settings.generatedPool.forEach(processQ);
        });
        return count;
    };
    
    // Total weight only for sections actually containing questions
    const activeTotalMasseHoraire = useMemo(() => {
        return courseSections.reduce((sum, section) => {
            if (getAvailableQuestionsInSection(section.id) === 0) return sum;
            return sum + parseMasseHoraire(section.masseHoraire);
        }, 0);
    }, [courseSections]);

    // Calculate initial distribution using the Largest Remainder Method for precise total matching
    useEffect(() => {
        if (isExam && activeTotalMasseHoraire > 0) {
            const counts: { [key: string]: number } = {};
            
            // Collect availability and filter eligible sections
            const availabilityMap: { [key: string]: number } = {};
            courseSections.forEach(s => {
                const av = getAvailableQuestionsInSection(s.id);
                availabilityMap[s.id] = av;
                counts[s.id] = 0; // Pre-fill
            });

            const eligibleSections = courseSections.filter(s => availabilityMap[s.id] > 0);
            const totalAvailable = Object.values(availabilityMap).reduce((a, b) => a + b, 0);
            
            // Cap the target if it exceeds what exists in the entire course
            const actualTarget = Math.min(targetTotalQuestions, totalAvailable);
            let remainingQuestions = actualTarget;

            // First pass: floor distribution with local caps
            const remainders: { id: string, remainder: number, available: number }[] = [];
            
            eligibleSections.forEach(section => {
                const weight = parseMasseHoraire(section.masseHoraire) / activeTotalMasseHoraire;
                const exact = actualTarget * weight;
                let floor = Math.floor(exact);
                
                // Safety cap per section
                if (floor > availabilityMap[section.id]) floor = availabilityMap[section.id];
                
                counts[section.id] = floor;
                remainingQuestions -= floor;
                remainders.push({ 
                    id: section.id, 
                    remainder: exact - floor, 
                    available: availabilityMap[section.id] 
                });
            });
            
            // Second pass: distribute the remaining questions with availability check
            while (remainingQuestions > 0) {
                 // Sort by highest remainder among sections that still have room
                 const roomSections = remainders
                    .filter(r => counts[r.id] < r.available)
                    .sort((a, b) => b.remainder - a.remainder);
                 
                 if (roomSections.length === 0) break; // No room left anywhere

                 counts[roomSections[0].id]++;
                 remainingQuestions--;
                 // Decrease remainder so it doesn't stay at top priority if many questions are being redistributed
                 roomSections[0].remainder -= 1; 
            }
            
            setSectionQuestionsCount(counts);

            // Sync total if capped
            if (targetTotalQuestions > totalAvailable) {
                setTargetTotalQuestions(totalAvailable);
            }
            
            // Sync settings
            if (settings.totalQuestions !== actualTarget) {
               setSettings(s => ({...s, totalQuestions: actualTarget}));
            }
        } else if (isExam) {
            // No sections have questions? Reset counts.
            const emptyCounts: { [key: string]: number } = {};
            courseSections.forEach(s => emptyCounts[s.id] = 0);
            setSectionQuestionsCount(emptyCounts);
        }
    }, [isExam, activeTotalMasseHoraire, targetTotalQuestions, courseSections]);



    // Action: Generate final exam pool based on Specification Table
    const handleGenerateSpecPool = () => {
        let newPool: Question[] = [];
        let errors: string[] = [];

        courseSections.forEach(section => {
            const target = sectionQuestionsCount[section.id] || 0;
            if (target === 0) return;

            // Collect all unique questions from this section
            let sectionQs: Question[] = [];
            const seen = new Set();
            section.subSections?.forEach(ss => {
                const processQ = (q: Question) => {
                    const k = q.id || q.text;
                    if (!seen.has(k)) { seen.add(k); sectionQs.push({...q, id: generateId()}); }
                };
                if (ss.quiz?.questions) ss.quiz.questions.forEach(processQ);
                if (ss.quiz?.settings?.generatedPool) ss.quiz.settings.generatedPool.forEach(processQ);
            });

            if (sectionQs.length < target) {
                errors.push(`• La section "${section.title}" demande ${target} questions, mais n'en possède que ${sectionQs.length}.`);
                newPool.push(...sectionQs); // Add whatever is available
            } else {
                // Shuffle array and slice the targets
                const shuffled = [...sectionQs].sort(() => 0.5 - Math.random());
                newPool.push(...shuffled.slice(0, target));
            }
        });

        if (errors.length > 0) {
            if (openConfirmModal) {
                openConfirmModal('Questions insuffisantes', `Des questions manquent pour respecter parfaitement la table de spécifications :\n\n${errors.join('\n')}\n\nLe pool a été généré avec toutes les questions disponibles pour ces chapitres.`, () => closeConfirmModal?.(), 'warning');
            } else {
                alert(`Questions insuffisantes:\n\n${errors.join('\n')}`);
            }
        }

        setSettings(prev => ({ ...prev, generatedPool: newPool, totalQuestions: newPool.length }));
    };

    const [aiTopic, setAiTopic] = useState<string>(() => {
        if (isExam) return title || "";
        // Extract raw text from HTML content and normalize spaces
        const rawText = stripHtml(lessonContent).replace(/\s+/g, ' ').trim();
        return rawText || title || "";
    });


    const [selectedQuestionId, setSelectedQuestionId] = useState<string>(questions[0]?.id || '');

    useEffect(() => {
        if ((!selectedQuestionId || !questions.find(q => q.id === selectedQuestionId)) && questions.length > 0) {
            setSelectedQuestionId(questions[0].id);
        }
    }, [questions, selectedQuestionId]);

    const activeQuestion = questions.find(q => q.id === selectedQuestionId);

    const handleGeneratePool = async () => {
        if (aiTopic.trim().length === 0) {
            if (openConfirmModal) {
                openConfirmModal('Sujet requis', "Veuillez saisir un sujet pour la génération.", () => closeConfirmModal?.(), 'warning');
            } else {
                alert("Veuillez saisir un sujet pour la génération.");
            }
            return;
        }

        setIsGenerating(true);
        try {
            const response = await api.post('/ai/generate-quiz', {
                topic: stripHtml(aiTopic).trim(),
                count: settings.aiGeneratedCount
            });

            // L'API renvoie du JSON. On gère les différents formats possibles (Array ou Object)
            let rawData = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;

            let questionsArray: any[] = [];
            if (Array.isArray(rawData)) {
                questionsArray = rawData;
            } else if (rawData && typeof rawData === 'object') {
                // First, check if the backend returned an explicit error object
                if (rawData.error) {
                    throw new Error(`Erreur Service AI : ${rawData.error}`);
                }

                // 1. Check if it's an object with a 'questions' or 'quiz' array
                if (Array.isArray(rawData.questions)) {
                    questionsArray = rawData.questions;
                } else if (Array.isArray(rawData.quiz)) {
                    questionsArray = rawData.quiz;
                }
                // ... rest of logic
                else if ((rawData.text || rawData.question || rawData.enonce) && Array.isArray(rawData.options || rawData.choices)) {
                    questionsArray = [rawData];
                }
                else {
                    const firstArrayKey = Object.keys(rawData).find(key => Array.isArray(rawData[key]) && rawData[key].length > 0);
                    if (firstArrayKey) {
                        questionsArray = rawData[firstArrayKey];
                    } else {
                        throw new Error("L'IA n'a pas renvoyé de questions au format attendu.");
                    }
                }
            } else {
                throw new Error("Réponse de l'IA invalide.");
            }

            // FILTER: ensure we only process objects that look like questions
            questionsArray = questionsArray.filter(q => q && typeof q === 'object');

            const newPool: Question[] = questionsArray.map((q: any) => {
                // Robust key detection for different AI hallucination variants
                const questionText = q.text || q.question || q.enonce || q.titre || q.label || q.q || "Question sans texte";
                const questionOptions = q.options || q.choices || q.reponses || q.propositions || q.answers || ["Option 1", "Option 2"];

                // For correctAnswers, check if it's already an array, or a single value, or a string
                let questionCorrects = Array.isArray(q.correctAnswers) ? q.correctAnswers :
                    (q.correctAnswer !== undefined ? [q.correctAnswer] :
                        (q.correct !== undefined ? [q.correct] : [0]));

                const normalizedCorrects = questionCorrects.map((v: any) => parseInt(v) || 0);

                // Determine the type strictly based on the number of correct answers if it's not an OPEN question
                let questionType = q.type || 'QCU';
                if (questionType !== 'OPEN') {
                    questionType = normalizedCorrects.length > 1 ? 'QCM' : 'QCU';
                }

                return {
                    id: generateId(),
                    type: questionType,
                    text: stripHtml(String(questionText || "")),
                    options: Array.isArray(questionOptions) ? questionOptions.map((opt: any) => stripHtml(String(opt))) : ["Option 1", "Option 2"],
                    correctAnswers: normalizedCorrects
                };
            });

            setSettings(prev => ({
                ...prev,
                generatedPool: newPool,
                qcuCount: 0,
                qcmCount: 0,
                openCount: 0,
                totalQuestions: Math.min(5, newPool.length)
            }));
        } catch (error) {
            console.error("AI Generation failed:", error);
            if (openConfirmModal) {
                openConfirmModal('Erreur de génération', "Erreur lors de la génération par l'IA. Vérifiez qu'Ollama est bien lancé sur votre machine.", () => closeConfirmModal?.(), 'danger');
            } else {
                alert("Erreur lors de la génération par l'IA. Vérifiez qu'Ollama est bien lancé sur votre machine.");
            }
        } finally {
            setIsGenerating(false);
        }
    };

    const updateQuestion = (id: string, updates: Partial<Question>) => {
        setQuestions(prev => prev.map(q => q.id === id ? { ...q, ...updates } : q));
    };

    const addQuestion = () => {
        const newQ: Question = {
            id: generateId(),
            type: 'QCU',
            text: '',
            options: ['', ''],
            correctAnswers: [0]
        };
        setQuestions([...questions, newQ]);
        setSelectedQuestionId(newQ.id);
    };

    const removeQuestion = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (questions.length === 1) {
            alert("Le quiz doit avoir au moins une question.");
            return;
        }
        const newQuestions = questions.filter(q => q.id !== id);
        setQuestions(newQuestions);
    };

    const addOption = (qId: string) => {
        const q = questions.find(qu => qu.id === qId);
        if (q) {
            updateQuestion(qId, { options: [...q.options, ''] });
        }
    };

    const removeOption = (qId: string, idx: number) => {
        const q = questions.find(qu => qu.id === qId);
        if (q && q.options.length > 1) {
            const newOptions = q.options.filter((_, i) => i !== idx);
            const newCorrects = q.correctAnswers
                .filter(ansIdx => ansIdx !== idx)
                .map(ansIdx => ansIdx > idx ? ansIdx - 1 : ansIdx);

            if (newCorrects.length === 0 && newOptions.length > 0 && q.type !== 'OPEN') {
                newCorrects.push(0);
            }
            updateQuestion(qId, { options: newOptions, correctAnswers: newCorrects });
        }
    };

    const updateOptionText = (qId: string, idx: number, text: string) => {
        const q = questions.find(qu => qu.id === qId);
        if (q) {
            const newOptions = [...q.options];
            newOptions[idx] = text;
            updateQuestion(qId, { options: newOptions });
        }
    };

    const toggleCorrectAnswer = (qId: string, idx: number, isMulti: boolean) => {
        const q = questions.find(qu => qu.id === qId);
        if (!q) return;

        let newCorrects = [...q.correctAnswers];
        if (isMulti) {
            if (newCorrects.includes(idx)) {
                newCorrects = newCorrects.filter(i => i !== idx);
            } else {
                newCorrects.push(idx);
            }
        } else {
            newCorrects = [idx];
        }
        updateQuestion(qId, { correctAnswers: newCorrects });
    };

    const handleSave = () => {
        console.log("Saving quiz...", { quizMode, totalQuestions: settings.totalQuestions });

        // On prépare les settings sans le pool (qui est une donnée temporaire de travail)
        // pour éviter que le backend ne rejette un champ inconnu
        const { generatedPool, ...cleanSettings } = settings;

        if (settings.mode === 'manual') {
            const validQuestions = questions.filter(q => q.text.trim() !== '');
            if (validQuestions.length === 0) {
                if (openConfirmModal) {
                    openConfirmModal('Quiz vide', "Le quiz doit contenir au moins une question valide.", () => closeConfirmModal?.(), 'warning');
                } else {
                    alert("Le quiz doit contenir au moins une question valide.");
                }
                return;
            }
            onSave({
                id: initialQuiz?.id || undefined as any,
                title: initialQuiz?.title || title || "Quiz",
                questions: validQuestions,
                settings: { ...cleanSettings, mode: 'manual' }
            });
        } else {
            if (!settings.generatedPool || settings.generatedPool.length === 0) {
                if (openConfirmModal) {
                    openConfirmModal('Pool vide', "Veuillez générer un pool de questions avec l'IA d'abord.", () => closeConfirmModal?.(), 'warning');
                } else {
                    alert("Veuillez générer un pool de questions avec l'IA d'abord.");
                }
                return;
            }
            if (settings.totalQuestions <= 0) {
                if (openConfirmModal) {
                    openConfirmModal('Configuration invalide', "Le nombre total de questions à afficher doit être supérieur à 0.", () => closeConfirmModal?.(), 'warning');
                } else {
                    alert("Le nombre total de questions à afficher doit être supérieur à 0.");
                }
                return;
            }
            onSave({
                id: initialQuiz?.id || undefined as any,
                title: initialQuiz?.title || title || "Quiz",
                questions: settings.generatedPool, // Le pool devient les questions permanentes du quiz
                settings: { ...cleanSettings, mode: 'dynamic' }
            });
        }
    };


    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-2 sm:p-4 m-0" style={{ zIndex: 9999, top: 0, left: 0 }}>
            <div className="bg-surface border border-glass-border rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-5xl max-h-[95vh] sm:max-h-[90vh] flex flex-col relative overflow-hidden m-auto">

                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 p-3 sm:p-6 border-b border-glass-border bg-surface/90">
                    <div className="flex items-center justify-between sm:justify-start gap-3 sm:gap-6 w-full sm:w-auto">
                        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                            <div className="p-2 sm:p-3 bg-primary/10 rounded-xl text-primary flex-shrink-0"><HelpCircle size={20} className="sm:w-6 sm:h-6" /></div>
                            <div className="min-w-0">
                                <h3 className="text-base sm:text-xl font-black text-text truncate">{title}</h3>
                                <p className="text-xs text-text-muted hidden sm:block">Configurez le mode d'évaluation</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors flex-shrink-0 sm:hidden"><X size={20} /></button>
                    </div>

                    {/* Mode Selector */}
                    <div className="flex items-center gap-3">
                        <div className="flex bg-surface-hover p-1 rounded-xl sm:rounded-2xl border border-glass-border w-full sm:w-auto">
                            <button
                                onClick={() => {
                                    setQuizMode('manual');
                                    setSettings(prev => ({ ...prev, mode: 'manual' }));
                                }}
                                className={`flex-1 sm:flex-none px-3 sm:px-5 py-2 rounded-lg sm:rounded-xl text-xs font-bold transition-all ${quizMode === 'manual' ? 'bg-primary text-white shadow-lg' : 'text-text-muted hover:text-text'}`}
                            >
                                Manuel
                            </button>
                            <button
                                onClick={() => {
                                    setQuizMode('dynamic');
                                    setSettings(prev => ({ ...prev, mode: 'dynamic' }));
                                }}
                                className={`flex-1 sm:flex-none px-3 sm:px-5 py-2 rounded-lg sm:rounded-xl text-xs font-bold transition-all ${quizMode === 'dynamic' ? 'bg-primary text-white shadow-lg' : 'text-text-muted hover:text-text'}`}
                            >
                                <span className="flex items-center gap-1.5 justify-center">
                                    {isExam ? <Library size={14} /> : <Sparkles size={14} />}
                                    <span className="hidden xs:inline">{isExam ? "" : "IA / "}</span> {isExam ? "Pool du Cours" : "Dynamique"}
                                </span>
                            </button>
                            <button
                                onClick={() => setQuizMode('settings')}
                                className={`flex-1 sm:flex-none px-3 sm:px-5 py-2 rounded-lg sm:rounded-xl text-xs font-bold transition-all ${quizMode === 'settings' ? 'bg-primary text-white shadow-lg' : 'text-text-muted hover:text-text'}`}
                            >
                                <span className="flex items-center gap-1.5 justify-center"><Layout size={14} /> Configuration</span>
                            </button>
                        </div>
                        <button onClick={onClose} className="hidden sm:block p-2 hover:bg-white/10 rounded-xl transition-colors flex-shrink-0"><X size={24} /></button>
                    </div>
                </div>
                {/* Content - Split View */}
                <div className="flex flex-1 overflow-hidden">
                    {quizMode === 'manual' ? (
                        <>
                            {/* Sidebar: Questions List */}
                            <div className="w-48 sm:w-64 md:w-80 border-r border-glass-border bg-surface-hover/30 flex flex-col">
                                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                                    {questions.map((q, idx) => (
                                        <div
                                            key={q.id}
                                            onClick={() => setSelectedQuestionId(q.id)}
                                            className={`group p-4 rounded-xl cursor-pointer border transition-all relative ${selectedQuestionId === q.id
                                                ? 'bg-surface border-primary shadow-lg'
                                                : 'bg-transparent border-transparent hover:bg-white/5'
                                                }`}
                                        >
                                            <div className="flex justify-between items-start mb-1">
                                                <span className={`text-xs font-bold uppercase tracking-wider ${selectedQuestionId === q.id ? 'text-primary' : 'text-text-muted'}`}>
                                                    Question {idx + 1}
                                                </span>
                                                <button
                                                    onClick={(e) => removeQuestion(e, q.id)}
                                                    className="opacity-0 group-hover:opacity-100 p-1 text-text-muted hover:text-error transition-all"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                            <p className="text-sm font-medium truncate opacity-90">
                                                {q.text || <span className="italic opacity-50">Nouvelle question...</span>}
                                            </p>
                                            <div className="mt-2 flex gap-2">
                                                <span className="text-[10px] px-2 py-0.5 rounded bg-surface-hover text-text-muted border border-glass-border">
                                                    {q.type === 'QCU' ? 'Choix Unique' : q.type === 'QCM' ? 'Choix Multiples' : 'Ouverte'}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="p-4 border-t border-glass-border bg-surface/50">
                                    <button
                                        onClick={addQuestion}
                                        className="w-full py-3 flex items-center justify-center gap-2 border-2 border-dashed border-glass-border rounded-xl text-text-muted hover:text-primary hover:border-primary/50 hover:bg-primary/5 transition-all font-bold text-sm"
                                    >
                                        <Plus size={16} /> Ajouter une question
                                    </button>
                                </div>
                            </div>

                            {/* Main Editor Area */}
                            <div className="flex-1 overflow-y-auto p-3 sm:p-6 md:p-10 custom-scrollbar bg-surface">
                                {activeQuestion ? (
                                    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">

                                        {/* Global Rules */}
                                        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 flex items-center justify-between gap-6">
                                            <div className="flex items-center gap-4">
                                                <div className="p-3 bg-primary/10 rounded-xl text-primary">
                                                    <Shield size={24} />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-text text-sm">Paramètres globaux</h4>
                                                    <p className="text-[10px] text-text-muted">Définissez les règles de ce quiz</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-6">
                                                <div className="flex flex-col items-center">
                                                    <label className="text-[10px] font-black uppercase opacity-60 mb-2">Score (%)</label>
                                                    <div className="flex items-center bg-surface border border-glass-border rounded-xl px-4 py-2 group-focus-within:border-primary shadow-sm">
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            max="100"
                                                            value={settings.passingScore}
                                                            onChange={(e) => {
                                                                const val = parseInt(e.target.value) || 0;
                                                                setSettings({ ...settings, passingScore: Math.min(100, Math.max(0, val)) });
                                                            }}
                                                            className="w-12 bg-transparent text-lg font-black text-center focus:outline-none"
                                                        />
                                                        <span className="font-bold text-text-muted">%</span>
                                                    </div>
                                                </div>
                                                {isExam && (
                                                    <div className="flex flex-col items-center border-l border-glass-border pl-6">
                                                        <label className="text-[10px] font-black uppercase opacity-60 mb-2">Durée (min)</label>
                                                        <div className="flex items-center bg-surface border border-glass-border rounded-xl px-4 py-2 group-focus-within:border-primary shadow-sm">
                                                            <Clock size={16} className="text-text-muted mr-2" />
                                                            <input
                                                                type="number"
                                                                min="1"
                                                                value={settings.timeLimit || 60}
                                                                onChange={(e) => {
                                                                    const val = parseInt(e.target.value) || 1;
                                                                    setSettings({ ...settings, timeLimit: Math.max(1, val) });
                                                                }}
                                                                className="w-12 bg-transparent text-lg font-black text-center focus:outline-none"
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Question Configuration */}
                                        <div className="space-y-4">
                                            <label className="text-xs font-bold text-text-muted uppercase tracking-widest">Type de question</label>
                                            <div className="grid grid-cols-3 gap-4">
                                                {[
                                                    { type: 'QCU', label: 'QCU', icon: Circle, desc: 'Choix unique' },
                                                    { type: 'QCM', label: 'QCM', icon: CheckSquare, desc: 'Choix multiples' },
                                                    { type: 'OPEN', label: 'Ouverte', icon: MessageSquare, desc: 'Texte libre' }
                                                ].map((t) => (
                                                    <button
                                                        key={t.type}
                                                        onClick={() => updateQuestion(activeQuestion.id, { type: t.type as 'QCU' | 'QCM' | 'OPEN', correctAnswers: [] })}
                                                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${activeQuestion.type === t.type
                                                            ? 'border-primary bg-primary/5 text-primary'
                                                            : 'border-glass-border bg-surface hover:border-primary/30 text-text-muted hover:text-text'
                                                            }`}
                                                    >
                                                        <t.icon size={24} />
                                                        <div className="text-center">
                                                            <span className="block font-bold text-sm">{t.label}</span>
                                                            <span className="block text-[10px] opacity-70">{t.desc}</span>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-text-muted uppercase tracking-widest">Énoncé de la question</label>
                                            <textarea
                                                value={activeQuestion.text}
                                                onChange={(e) => updateQuestion(activeQuestion.id, { text: e.target.value })}
                                                className="w-full input min-h-[100px] text-lg font-medium p-4 resize-y"
                                                placeholder="Posez votre question ici..."
                                            />
                                        </div>

                                        {/* Options Editor (Only for QCU/QCM) */}
                                        {activeQuestion.type !== 'OPEN' && (
                                            <div className="space-y-4 pt-4 border-t border-glass-border">
                                                <div className="flex justify-between items-end">
                                                    <label className="text-xs font-bold text-text-muted uppercase tracking-widest">
                                                        Réponses possibles <span className="opacity-50 lowercase font-normal ml-1">(Cochez les bonnes réponses)</span>
                                                    </label>
                                                </div>

                                                <div className="space-y-3">
                                                    {activeQuestion.options.map((opt, idx) => {
                                                        const isCorrect = activeQuestion.correctAnswers.includes(idx);
                                                        return (
                                                            <div key={idx} className="flex items-center gap-3 group animate-fade-in">
                                                                <button
                                                                    onClick={() => toggleCorrectAnswer(activeQuestion.id, idx, activeQuestion.type === 'QCM')}
                                                                    className={`p-3 rounded-xl border-2 transition-all ${isCorrect
                                                                        ? 'bg-green-500 border-green-500 text-white'
                                                                        : 'bg-surface border-glass-border text-text-muted hover:border-primary/50'
                                                                        }`}
                                                                    title={isCorrect ? "Réponse correcte" : "Marquer comme correcte"}
                                                                >
                                                                    {activeQuestion.type === 'QCM' ? <Check size={16} /> : <div className={`w-4 h-4 rounded-full border-2 ${isCorrect ? 'border-white bg-white' : 'border-current'}`} />}
                                                                </button>

                                                                <div className="flex-1 relative">
                                                                    <input
                                                                        value={opt}
                                                                        onChange={(e) => updateOptionText(activeQuestion.id, idx, e.target.value)}
                                                                        className={`w-full input py-3 pr-10 transition-colors ${isCorrect ? 'border-green-500/50 bg-green-500/5' : ''}`}
                                                                        placeholder={`Réponse ${idx + 1}`}
                                                                    />
                                                                </div>

                                                                <button
                                                                    onClick={() => removeOption(activeQuestion.id, idx)}
                                                                    className="p-3 text-text-muted hover:text-error hover:bg-error/10 rounded-xl transition-all opacity-0 group-hover:opacity-100 disabled:opacity-0"
                                                                    disabled={activeQuestion.options.length <= 1}
                                                                >
                                                                    <Trash2 size={18} />
                                                                </button>
                                                            </div>
                                                        );
                                                    })}
                                                </div>

                                                <button
                                                    onClick={() => addOption(activeQuestion.id)}
                                                    className="text-sm font-bold text-primary hover:bg-primary/10 px-4 py-2 rounded-lg transition-all flex items-center gap-2 mt-2"
                                                >
                                                    <Plus size={16} /> Ajouter une option
                                                </button>
                                            </div>
                                        )}

                                        {activeQuestion.type === 'OPEN' && (
                                            <div className="p-8 bg-surface-hover/30 rounded-2xl border-2 border-dashed border-glass-border flex flex-col items-center justify-center text-center text-text-muted">
                                                <MessageSquare size={32} className="mb-3 opacity-50" />
                                                <p className="font-medium">Réponse libre</p>
                                                <p className="text-xs opacity-70 mt-1">L'apprenant devra saisir une réponse textuelle.</p>
                                            </div>
                                        )}

                                    </div>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-text-muted opacity-50">
                                        <HelpCircle size={48} className="mb-4" />
                                        <p>Sélectionnez une question à éditer</p>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : quizMode === 'dynamic' ? (
                        <div className="flex-1 overflow-y-auto p-6 md:p-10 bg-surface custom-scrollbar">
                            <div className="max-w-2xl mx-auto space-y-10 animate-fade-in">
                                <div className="text-center space-y-2">
                                    <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto text-primary mb-4 rotate-3">
                                        {isExam ? <Library size={40} /> : <Sparkles size={40} />}
                                    </div>
                                    <h4 className="text-2xl font-black">{isExam ? "Pool Questions du Cours" : title}</h4>
                                    <p className="text-text-muted">
                                        {isExam
                                            ? "Composez votre examen à partir des questions déjà créées dans vos leçons."
                                            : (description || "L'IA analyse votre contenu pour créer un pool de questions personnalisé.")}
                                    </p>
                                </div>

                                <div className="grid gap-12">
                                    {isExam ? (
                                        <div className="space-y-6 relative">
                                            <div className="bg-background border border-glass-border rounded-3xl p-8 shadow-sm">
                                                <div className="space-y-2 mb-8 text-center">
                                                    <h4 className="text-xl font-black text-text flex items-center justify-center gap-3">
                                                        <BarChart3 size={24} className="text-primary" />
                                                        Tableau de Spécifications
                                                    </h4>
                                                    <p className="text-sm text-text-muted">Équilibrez votre examen en pondérant le volume de questions depuis la masse horaire de chaque chapitre.</p>
                                                </div>

                                                {/* Global Target */}
                                                <div className="flex flex-col sm:flex-row items-center justify-between p-6 bg-surface/50 border border-glass-border rounded-2xl mb-8 gap-6">
                                                    <div>
                                                        <h5 className="font-bold text-text mb-1 flex items-center gap-2">
                                                            <CheckSquare size={16} className="text-primary" />
                                                            Total des questions attendues
                                                        </h5>
                                                        <p className="text-xs text-text-muted">L'algorithme suggérera une répartition basée sur ce volume total.</p>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <input 
                                                            type="number" 
                                                            value={targetTotalQuestions}
                                                            onChange={(e) => setTargetTotalQuestions(Math.max(1, parseInt(e.target.value) || 1))}
                                                            className="w-24 form-input h-12 text-center text-xl font-black text-text border-primary/20 bg-background shadow-inner outline-none relative z-10"
                                                            min="1"
                                                        />
                                                    </div>
                                                </div>

                                                {/* Specification Table */}
                                                <div className="overflow-x-auto mb-8 bg-surface/20 rounded-2xl border border-glass-border/50">
                                                    <table className="w-full text-left border-collapse">
                                                        <thead>
                                                            <tr className="border-b border-glass-border/50 text-[10px] uppercase font-black tracking-widest text-text-muted bg-surface/50">
                                                                <th className="py-4 pl-4 font-bold">Chapitre (Section)</th>
                                                                <th className="py-4 text-center font-bold">Masse Horaire</th>
                                                                <th className="py-4 text-center font-bold">Poids (%)</th>
                                                                <th className="py-4 text-center font-bold">Questions<br/>(Demandé / Disponible)</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-glass-border/30">
                                                            {courseSections.map(section => {
                                                                const mh = parseMasseHoraire(section.masseHoraire);
                                                                const available = getAvailableQuestionsInSection(section.id);
                                                                const weight = (activeTotalMasseHoraire > 0 && available > 0) ? (mh / activeTotalMasseHoraire) * 100 : 0;
                                                                const currentCount = sectionQuestionsCount[section.id] || 0;
                                                                
                                                                return (
                                                                    <tr key={section.id} className="hover:bg-surface/30 transition-colors">
                                                                        <td className="py-4 pl-4">
                                                                            <span className="font-bold text-sm text-text block truncate max-w-[200px]" title={section.title}>{section.title}</span>
                                                                        </td>
                                                                        <td className="py-4 text-center">
                                                                            <span className="text-xs font-semibold px-2 py-1 bg-primary/10 text-primary rounded-md">{section.masseHoraire || '0h'}</span>
                                                                        </td>
                                                                        <td className="py-4 text-center">
                                                                            <span className="text-xs font-bold text-text-muted">{weight.toFixed(0)}%</span>
                                                                        </td>
                                                                        <td className="py-4 text-center border-l border-glass-border/30 bg-surface/10">
                                                                            <div className="flex flex-col items-center gap-1">
                                                                                <span className={`text-sm font-black ${currentCount > available ? 'text-error' : 'text-text'}`}>
                                                                                    {currentCount}
                                                                                </span>
                                                                                <span className={`text-[10px] font-bold ${currentCount > available ? 'text-error' : 'text-text-muted opacity-60'}`}>sur {available} dispo.</span>
                                                                            </div>
                                                                        </td>
                                                                    </tr>
                                                                );
                                                            })}
                                                        </tbody>
                                                        <tfoot>
                                                            <tr className="border-t-2 border-glass-border bg-surface/20">
                                                                <td className="py-4 pl-4 font-black text-xs text-text uppercase tracking-wider">Total & Bilan</td>
                                                                <td className="py-4 text-center font-black text-sm text-primary">{activeTotalMasseHoraire}h</td>
                                                                <td className="py-4 text-center font-black text-sm text-text-muted">100%</td>
                                                                <td className="py-4 text-center border-l border-glass-border/30 bg-surface/30">
                                                                    <span className={`text-lg font-black ${Object.values(sectionQuestionsCount).reduce((a, b) => a + b, 0) !== targetTotalQuestions ? 'text-warning' : 'text-success'}`}>
                                                                        {Object.values(sectionQuestionsCount).reduce((a, b) => a + b, 0)}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        </tfoot>
                                                    </table>
                                                </div>

                                                <button
                                                    onClick={handleGenerateSpecPool}
                                                    className="w-full btn-primary h-14 rounded-2xl font-black shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3"
                                                >
                                                    <RefreshCw size={20} />
                                                    Générer le pool en suivant la table
                                                </button>

                                                {(settings.generatedPool && settings.generatedPool.length > 0) ? (
                                                    <div className="pt-6 mt-6 border-t border-glass-border animate-fade-in text-center">
                                                        <div className="flex items-center justify-center gap-2 text-green-500 font-bold text-sm bg-green-500/5 py-3 rounded-xl border border-green-500/20">
                                                            <CheckCircle2 size={18} />
                                                            <span>Examen généré ({settings.generatedPool.length} questions prêtes)</span>
                                                        </div>
                                                        <button
                                                            onClick={() => setSettings({ ...settings, generatedPool: [] })}
                                                            className="text-[10px] text-text-muted hover:text-error transition-all underline mt-3 opacity-60"
                                                        >
                                                            Vider l'examen généré
                                                        </button>
                                                    </div>
                                                ) : null}

                                            </div>
                                            <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10">
                                                <p className="text-[10px] text-primary font-bold text-center leading-relaxed">
                                                    ASTUCE : Les questions sont sélectionnées aléatoirement dans chaque chapitre en respectant vos quantités exactes. <br />
                                                    Les questions manuelles s'y ajouteront. Confirmez le nombre "final" affiché aux apprenants dans l'onglet Configuration.
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-6 relative">
                                            <div className="bg-background border border-glass-border rounded-3xl p-8 space-y-6 shadow-sm">
                                                <div className="space-y-3">
                                                    <label className="text-xs font-bold text-text-muted uppercase flex items-center gap-2">
                                                        <Type size={14} className="text-primary" /> Sujet ou thème pour l'IA
                                                    </label>
                                                    <textarea
                                                        value={aiTopic}
                                                        onChange={(e) => setAiTopic(e.target.value)}
                                                        placeholder="L'IA utilisera ce contenu pour générer les questions..."
                                                        className="w-full input min-h-[120px] py-4 text-sm font-medium custom-scrollbar"
                                                    />
                                                    <p className="text-[10px] text-text-muted italic">Plus le sujet est précis, meilleures seront les questions générées par Mistral-Nemo.</p>
                                                </div>
                                                <div className="space-y-4 pt-4 border-t border-glass-border">
                                                    <label className="text-xs font-bold text-text-muted uppercase">Nombre de questions à générer</label>
                                                    <div className="flex items-center gap-4">
                                                        <input
                                                            type="number"
                                                            value={settings.aiGeneratedCount}
                                                            onChange={(e) => {
                                                                const val = parseInt(e.target.value) || 0;
                                                                setSettings({ ...settings, aiGeneratedCount: Math.min(maxPoolSize, val) });
                                                            }}
                                                            className="flex-1 form-input h-14 text-xl font-black text-center text-text border-primary/20 bg-background outline-none relative z-10"
                                                            min="1"
                                                            max={maxPoolSize}
                                                        />
                                                        <button
                                                            onClick={handleGeneratePool}
                                                            disabled={isGenerating}
                                                            className={`px-8 h-14 rounded-2xl font-black shadow-lg transition-all flex items-center gap-3 ${isGenerating ? 'bg-surface-hover text-text-muted cursor-not-allowed' : 'bg-primary text-white hover:scale-105 active:scale-95 shadow-primary/20'}`}
                                                        >
                                                            {isGenerating ? (
                                                                <>
                                                                    <div className="w-5 h-5 border-2 border-text-muted border-t-transparent rounded-full animate-spin"></div>
                                                                    Analyse en cours...
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Sparkles size={20} />
                                                                    Lancer la génération
                                                                </>
                                                            )}
                                                        </button>
                                                    </div>
                                                </div>
                                                {settings.generatedPool && settings.generatedPool.length > 0 && (
                                                    <div className="pt-6 border-t border-glass-border animate-fade-in flex items-center justify-between">
                                                        <div className="flex items-center gap-2 text-green-500 font-bold text-sm">
                                                            <CheckCircle2 size={18} />
                                                            <span>Pool prêt : {settings.generatedPool.length} questions</span>
                                                        </div>
                                                        <button
                                                            onClick={() => setSettings({ ...settings, generatedPool: [] })}
                                                            className="text-xs text-text-muted hover:text-error transition-all underline"
                                                        >
                                                            Effacer
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                {settings.generatedPool && settings.generatedPool.length > 0 && (
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between mt-8 pt-8 border-t border-glass-border">
                                            <div className="flex items-center gap-3">
                                                <span className="text-sm font-bold text-text-muted uppercase tracking-widest flex items-center justify-center gap-2">
                                                    <CheckSquare size={16} className="text-primary" /> Questions générées
                                                </span>
                                                <span className="bg-primary/20 text-primary px-3 py-1 rounded-lg text-xs font-black">
                                                    {settings.generatedPool.length}
                                                </span>
                                            </div>
                                            <button
                                                onClick={() => setSettings({ ...settings, generatedPool: [] })}
                                                className="text-xs text-text-muted hover:text-error transition-all underline"
                                            >
                                                Tout effacer
                                            </button>
                                        </div>

                                        {/* Questions Preview List */}
                                        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                            {settings.generatedPool.map((q, qIdx) => (
                                                <div key={q.id} className="bg-surface-hover/50 border border-glass-border rounded-2xl p-4 group relative hover:border-primary/30 transition-all">
                                                    <button
                                                        onClick={() => {
                                                            const newPool = settings.generatedPool?.filter((_, i) => i !== qIdx);
                                                            setSettings({ ...settings, generatedPool: newPool });
                                                        }}
                                                        className="absolute top-4 right-4 p-2 text-text-muted hover:text-error opacity-0 group-hover:opacity-100 transition-all"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>

                                                    <div className="flex items-center gap-3 mb-2">
                                                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-primary/10 text-primary uppercase">
                                                            {q.type}
                                                        </span>
                                                        <span className="text-xs font-bold text-text-muted">Question {qIdx + 1}</span>
                                                    </div>

                                                    <p className="text-sm font-semibold text-text mb-3 pr-8">{q.text}</p>

                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                        {q.options.map((opt, optIdx) => {
                                                            const isCorrect = q.correctAnswers.includes(optIdx);
                                                            return (
                                                                <div key={optIdx} className={`text-[11px] p-2 rounded-lg border flex items-center gap-2 ${isCorrect ? 'bg-green-500/10 border-green-500/30 text-green-500' : 'bg-background/50 border-glass-border text-text-muted'}`}>
                                                                    {isCorrect ? <CheckCircle2 size={12} /> : <Circle size={12} className="opacity-30" />}
                                                                    <span className="truncate">{opt}</span>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Step 2: Distribution Settings (Only if pool exists) */}
                                <div className={`space-y-6 transition-all duration-500 pt-8 ${!settings.generatedPool || settings.generatedPool.length === 0 ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-black text-sm">2</div>
                                        <label className="text-sm font-black uppercase tracking-widest text-text">Sélection Apprenant (Tirage aléatoire)</label>
                                    </div>

                                    <div className="bg-background border border-glass-border rounded-3xl p-8 space-y-8">
                                        <div className="flex flex-col items-center justify-center p-8 bg-primary/5 rounded-3xl border border-primary/10 space-y-4">
                                            <span className="text-sm font-bold text-primary uppercase tracking-widest text-center">Nombre de questions que l'apprenant verra</span>
                                            <div className="flex items-center gap-8">
                                                <button
                                                    onClick={() => {
                                                        const val = Math.max(1, settings.totalQuestions - 1);
                                                        setSettings({ ...settings, totalQuestions: val });
                                                    }}
                                                    className="w-14 h-14 rounded-2xl bg-surface border border-glass-border flex items-center justify-center hover:bg-primary hover:text-white transition-all shadow-lg active:scale-90"
                                                >
                                                    <ChevronLeft size={24} strokeWidth={3} />
                                                </button>

                                                <div className="text-center">
                                                    <span className="text-6xl font-black text-primary tabular-nums tracking-tighter">{settings.totalQuestions}</span>
                                                    <p className="text-[10px] text-text-muted font-bold mt-1 uppercase opacity-60">Questions sélectionnées</p>
                                                </div>

                                                <button
                                                    onClick={() => {
                                                        const val = Math.min(settings.generatedPool?.length || 0, settings.totalQuestions + 1);
                                                        setSettings({ ...settings, totalQuestions: val });
                                                    }}
                                                    className="w-14 h-14 rounded-2xl bg-surface border border-glass-border flex items-center justify-center hover:bg-primary hover:text-white transition-all shadow-lg active:scale-90"
                                                >
                                                    <ChevronRight size={24} strokeWidth={3} />
                                                </button>
                                            </div>

                                            <div className="pt-4 flex items-center gap-2 text-[11px] text-text-muted italic">
                                                <Sparkles size={12} className="text-primary" />
                                                <span>Un mélange de QCU et QCM sera tiré au sort parmi les {settings.generatedPool?.length} questions du pool.</span>
                                            </div>
                                        </div>

                                        <div className={`grid grid-cols-1 ${isExam ? 'md:grid-cols-2' : ''} gap-6 pt-4 border-t border-glass-border`}>
                                            <div className="space-y-3">
                                                <label className="text-[10px] font-black uppercase opacity-60 flex items-center gap-2">
                                                    <CheckCircle2 size={12} className="text-primary" />
                                                    Score de passage (%)
                                                </label>
                                                <div className="flex items-center gap-3">
                                                    <button
                                                        onClick={() => setSettings({ ...settings, passingScore: Math.max(0, settings.passingScore - 5) })}
                                                        className="w-10 h-10 rounded-xl bg-surface-hover flex items-center justify-center hover:bg-primary/10 hover:text-primary transition-all font-black"
                                                    >-</button>
                                                    <div className="flex-1 bg-surface border border-glass-border h-12 rounded-xl flex items-center justify-center font-black text-lg">
                                                        {settings.passingScore}%
                                                    </div>
                                                    <button
                                                        onClick={() => setSettings({ ...settings, passingScore: Math.min(100, settings.passingScore + 5) })}
                                                        className="w-10 h-10 rounded-xl bg-surface-hover flex items-center justify-center hover:bg-primary/10 hover:text-primary transition-all font-black"
                                                    >+</button>
                                                </div>
                                            </div>

                                            {isExam && (
                                                <div className="space-y-3">
                                                    <label className="text-[10px] font-black uppercase opacity-60 flex items-center gap-2">
                                                        <Clock size={12} className="text-primary" />
                                                        Durée de l'épreuve (min)
                                                    </label>
                                                    <div className="flex items-center gap-3">
                                                        <button
                                                            onClick={() => setSettings({ ...settings, timeLimit: Math.max(1, (settings.timeLimit || 60) - 5) })}
                                                            className="w-10 h-10 rounded-xl bg-surface-hover flex items-center justify-center hover:bg-primary/10 hover:text-primary transition-all font-black"
                                                        >-</button>
                                                        <div className="flex-1 bg-surface border border-glass-border h-12 rounded-xl flex items-center justify-center font-black text-lg">
                                                            {settings.timeLimit ?? 60} min
                                                        </div>
                                                        <button
                                                            onClick={() => setSettings({ ...settings, timeLimit: (settings.timeLimit || 60) + 5 })}
                                                            className="w-10 h-10 rounded-xl bg-surface-hover flex items-center justify-center hover:bg-primary/10 hover:text-primary transition-all font-black"
                                                        >+</button>
                                                </div>
                                            </div>
                                            )}
                                        </div>

                                        <p className="text-[11px] text-text-muted text-center italic">
                                            L'IA sélectionnera aléatoirement {settings.totalQuestions} questions parmi les {settings.generatedPool?.length || 0} du pool pour chaque apprenant.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 overflow-y-auto p-6 md:p-10 bg-surface custom-scrollbar">
                            <div className="max-w-2xl mx-auto space-y-12 animate-fade-in">
                                <div className="text-center space-y-2">
                                    <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto text-primary mb-4 rotate-3">
                                        <Layout size={40} />
                                    </div>
                                    <h4 className="text-2xl font-black text-text">Configuration Globale</h4>
                                    <p className="text-text-muted">Paramètres généraux du quiz pour l'apprenant.</p>
                                </div>

                                <div className="grid gap-8">
                                    {/* Random Selection Toggle */}
                                    <div className="bg-background border border-glass-border rounded-3xl p-8 space-y-6 shadow-sm">
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-1">
                                                <h5 className="font-black text-text flex items-center gap-2 text-lg">
                                                    <Sparkles size={18} className="text-primary" /> Tirage Aléatoire
                                                </h5>
                                                <p className="text-xs text-text-muted font-bold opacity-70">
                                                    Si activé, chaque apprenant verra un ensemble différent de questions piochées au sort.
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => setSettings({ ...settings, isRandom: !settings.isRandom })}
                                                className={`w-14 h-8 rounded-full relative transition-all duration-300 ${settings.isRandom ? 'bg-primary shadow-lg shadow-primary/20' : 'bg-surface-hover border border-glass-border'}`}
                                            >
                                                <div className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-md transition-all duration-300 ${settings.isRandom ? 'left-7' : 'left-1'}`} />
                                            </button>
                                        </div>

                                        {(settings.isRandom || settings.mode === 'dynamic') && (
                                            <div className="pt-6 border-t border-glass-border space-y-6 animate-fade-in">
                                                <div className="space-y-4">
                                                    <label className="text-[10px] font-black uppercase opacity-60 flex items-center gap-2 text-center justify-center">
                                                        <CheckSquare size={12} className="text-primary" />
                                                        Nombre de questions à afficher par session
                                                    </label>
                                                    <div className="flex items-center justify-center gap-6">
                                                        <button
                                                            onClick={() => setSettings({ ...settings, totalQuestions: Math.max(1, settings.totalQuestions - 1) })}
                                                            className="w-14 h-14 rounded-2xl bg-surface border border-glass-border flex items-center justify-center hover:bg-error hover:text-white transition-all shadow-lg active:scale-90"
                                                        >
                                                            <ChevronLeft size={24} strokeWidth={3} />
                                                        </button>
                                                        <div className="flex flex-col items-center min-w-[100px]">
                                                            <div className="text-5xl font-black text-primary tabular-nums tracking-tighter line-height-1 mb-1">
                                                                {settings.totalQuestions}
                                                            </div>
                                                            <div className="text-[10px] font-black uppercase text-text-muted opacity-40">Questions</div>
                                                        </div>
                                                        <button
                                                            onClick={() => {
                                                                const poolSize = (settings.mode === 'manual' ? questions.length : settings.generatedPool?.length) || 0;
                                                                const val = Math.min(poolSize, settings.totalQuestions + 1);
                                                                setSettings({ ...settings, totalQuestions: val });
                                                            }}
                                                            className="w-14 h-14 rounded-2xl bg-surface border border-glass-border flex items-center justify-center hover:bg-primary hover:text-white transition-all shadow-lg active:scale-90"
                                                        >
                                                            <ChevronRight size={24} strokeWidth={3} />
                                                        </button>
                                                    </div>
                                                    <p className="text-[10px] text-center text-text-muted italic opacity-60">
                                                        Pool actuel : {(settings.mode === 'manual' ? questions.length : settings.generatedPool?.length) || 0} questions disponibles.
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className={`grid grid-cols-1 ${isExam ? 'md:grid-cols-2' : ''} gap-8`}>
                                        <div className="bg-background border border-glass-border rounded-3xl p-8 space-y-4 shadow-sm">
                                            <label className="text-[10px] font-black uppercase opacity-60 flex items-center gap-2">
                                                <CheckCircle2 size={12} className="text-primary" />
                                                Seuil de Réussite (%)
                                            </label>
                                            <div className="flex items-center gap-4">
                                                <button
                                                    onClick={() => setSettings({ ...settings, passingScore: Math.max(0, settings.passingScore - 5) })}
                                                    className="w-12 h-12 rounded-2xl bg-surface-hover flex items-center justify-center hover:bg-primary/10 hover:text-primary transition-all font-black border border-glass-border"
                                                >-</button>
                                                <div className="flex-1 text-center font-black text-2xl">{settings.passingScore}%</div>
                                                <button
                                                    onClick={() => setSettings({ ...settings, passingScore: Math.min(100, settings.passingScore + 5) })}
                                                    className="w-12 h-12 rounded-2xl bg-surface-hover flex items-center justify-center hover:bg-primary/10 hover:text-primary transition-all font-black border border-glass-border"
                                                >+</button>
                                            </div>
                                        </div>

                                        {isExam && (
                                            <div className="bg-background border border-glass-border rounded-3xl p-8 space-y-4 shadow-sm">
                                                <label className="text-[10px] font-black uppercase opacity-60 flex items-center gap-2">
                                                    <Clock size={12} className="text-primary" />
                                                    Limite de Temps (min)
                                                </label>
                                                <div className="flex items-center gap-4">
                                                    <button
                                                        onClick={() => setSettings({ ...settings, timeLimit: Math.max(1, (settings.timeLimit || 60) - 5) })}
                                                        className="w-12 h-12 rounded-2xl bg-surface-hover flex items-center justify-center hover:bg-primary/10 hover:text-primary transition-all font-black border border-glass-border"
                                                    >-</button>
                                                    <div className="flex-1 text-center font-black text-2xl">{settings.timeLimit ?? 60} min</div>
                                                    <button
                                                        onClick={() => setSettings({ ...settings, timeLimit: (settings.timeLimit || 60) + 5 })}
                                                        className="w-12 h-12 rounded-2xl bg-surface-hover flex items-center justify-center hover:bg-primary/10 hover:text-primary transition-all font-black border border-glass-border"
                                                    >+</button>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* AI Detection Settings */}
                                    {isExam && (
                                        <div className="bg-background border border-glass-border rounded-3xl p-8 space-y-6 shadow-sm">
                                            <div className="flex items-center justify-between">
                                                <div className="space-y-1">
                                                    <h5 className="font-black text-text flex items-center gap-2 text-lg">
                                                        <Shield size={18} className="text-primary" /> Surveillance par IA (Caméra)
                                                    </h5>
                                                    <p className="text-xs text-text-muted font-bold opacity-70">
                                                        Si activé, l'apprenant doit obligatoirement utiliser sa caméra.
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() => setSettings({ ...settings, isAiDetectionEnabled: !settings.isAiDetectionEnabled, aiDetectionType: 'backend' })}
                                                    className={`w-14 h-8 flex items-center rounded p-1 cursor-pointer transition-all duration-400 shrink-0 border ${settings.isAiDetectionEnabled ? 'bg-gradient-to-r from-blue-500 to-indigo-600 border-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'bg-surface-hover border-glass-border shadow-inner'}`}
                                                >
                                                    <div className={`bg-white w-6 h-6 rounded-sm shadow border border-white/20 transform transition-transform duration-400 ${settings.isAiDetectionEnabled ? 'translate-x-6' : 'translate-x-0 opacity-40'}`} />
                                                </button>
                                            </div>

                                            {/* Granular Cheating Controls - shown when AI detection is enabled */}
                                            {settings.isAiDetectionEnabled && (
                                                <div className="space-y-4 pt-4 border-t border-glass-border/50 animate-fade-in">
                                                    <p className="text-xs font-black uppercase text-text-muted tracking-widest">Contrôles de détection (IA Caméra)</p>
                                                    
                                                    {[
                                                        { key: 'detectPhone' as const, icon: '📱', label: 'Téléphone portable', desc: 'Détecter les téléphones via la caméra' },
                                                        { key: 'detectMultiplePersons' as const, icon: '👥', label: 'Plusieurs personnes', desc: 'Détecter la présence de plus d\'une personne' },
                                                        { key: 'detectForbiddenObjects' as const, icon: '🚫', label: 'Objets interdits', desc: 'Détecter livres, tablettes, écrans, etc.' },
                                                        { key: 'detectLookingAway' as const, icon: '👀', label: 'Regard détourné', desc: 'Détecter quand l\'apprenant ne regarde pas l\'écran' },
                                                        { key: 'detectSound' as const, icon: '🎙️', label: 'Détection sonore', desc: 'Détecter la parole ou bruit continu' },
                                                    ].map(item => (
                                                        <div key={item.key} className="flex items-center justify-between p-3 bg-surface/50 rounded-xl border border-glass-border/50 hover:border-primary/20 transition-all">
                                                            <div className="flex items-center gap-3">
                                                                <span className="text-lg">{item.icon}</span>
                                                                <div>
                                                                    <p className="text-sm font-bold text-text">{item.label}</p>
                                                                    <p className="text-[10px] text-text-muted font-medium">{item.desc}</p>
                                                                </div>
                                                            </div>
                                                            <button
                                                                onClick={() => setSettings({ ...settings, [item.key]: !settings[item.key] })}
                                                                className={`w-12 h-6 flex items-center rounded p-1 cursor-pointer transition-all duration-300 shrink-0 border ${settings[item.key] !== false ? 'bg-gradient-to-r from-emerald-500 to-teal-500 border-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.4)]' : 'bg-surface border-glass-border shadow-inner'}`}
                                                            >
                                                                <div className={`bg-white w-4 h-4 rounded-sm shadow-sm transform transition-transform duration-300 ${settings[item.key] !== false ? 'translate-x-6' : 'translate-x-0 opacity-40'}`} />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Identity Verification Settings */}
                                            <div className="space-y-4 pt-4 border-t border-glass-border/50">
                                                <p className="text-xs font-black uppercase text-text-muted tracking-widest">Vérification d'identité</p>
                                                
                                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                                    {[
                                                        { key: 'none' as const, icon: '🔓', label: 'Aucune', desc: 'Pas de scan' },
                                                        { key: 'qr_only' as const, icon: '📱', label: 'QR Code', desc: 'Code QR uniquement' },
                                                        { key: 'face_check' as const, icon: '👤', label: 'QR + Visage', desc: 'QR, Carte et Visage' },
                                                    ].map(mode => (
                                                        <button
                                                            key={mode.key}
                                                            onClick={() => setSettings({ ...settings, verificationMode: mode.key })}
                                                            className={`p-4 rounded-xl border flex flex-col items-center text-center gap-2 transition-all ${
                                                                (settings.verificationMode || 'none') === mode.key
                                                                    ? 'bg-primary/10 border-primary text-primary shadow-lg shadow-primary/10'
                                                                    : 'bg-surface/50 border-glass-border/50 text-text-muted hover:border-primary/30'
                                                            }`}
                                                        >
                                                            <span className="text-2xl">{mode.icon}</span>
                                                            <span className="font-bold text-[11px]">{mode.label}</span>
                                                            <span className="text-[9px] opacity-70">{mode.desc}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Browser-level Anti-Cheat Controls (always visible) */}
                                            <div className="space-y-4 pt-4 border-t border-glass-border/50">
                                                <p className="text-xs font-black uppercase text-text-muted tracking-widest">Contrôles anti-triche (Navigateur)</p>
                                                
                                                {[
                                                    { key: 'detectTabSwitch' as const, icon: '🔄', label: 'Changement d\'onglet', desc: 'Bloquer le passage à un autre onglet' },
                                                    { key: 'detectFullscreenExit' as const, icon: '🖥️', label: 'Sortie plein écran', desc: 'Bloquer la sortie du mode plein écran' },
                                                    { key: 'detectWindowBlur' as const, icon: '🪟', label: 'Sortie de fenêtre', desc: 'Bloquer Alt-Tab et la perte de focus' },
                                                ].map(item => (
                                                    <div key={item.key} className="flex items-center justify-between p-3 bg-surface/50 rounded-xl border border-glass-border/50 hover:border-primary/20 transition-all">
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-lg">{item.icon}</span>
                                                            <div>
                                                                <p className="text-sm font-bold text-text">{item.label}</p>
                                                                <p className="text-[10px] text-text-muted font-medium">{item.desc}</p>
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => setSettings({ ...settings, [item.key]: !settings[item.key] })}
                                                            className={`w-12 h-6 flex items-center rounded p-1 cursor-pointer transition-all duration-300 shrink-0 border ${settings[item.key] !== false ? 'bg-gradient-to-r from-emerald-500 to-teal-500 border-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.4)]' : 'bg-surface border-glass-border shadow-inner'}`}
                                                        >
                                                            <div className={`bg-white w-4 h-4 rounded-sm shadow-sm transform transition-transform duration-300 ${settings[item.key] !== false ? 'translate-x-6' : 'translate-x-0 opacity-40'}`} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                < div className="p-3 sm:p-5 border-t border-glass-border bg-surface/90 flex flex-col sm:flex-row justify-end gap-2 sm:gap-3" >
                    <button onClick={onClose} className="w-full sm:w-auto px-6 py-3 text-sm font-bold text-text-muted hover:bg-white/5 rounded-xl transition-all">
                        Annuler
                    </button>
                    <button onClick={handleSave} className="w-full sm:w-auto btn-primary px-8 py-3 rounded-xl text-sm font-bold shadow-lg shadow-primary/20 flex items-center justify-center gap-2">
                        <Save size={18} /> Enregistrer le Quiz
                    </button>
                </div >
            </div >
        </div >,
        document.body
    );
};

// --- TRAINER CORRECTION MODAL ---
const TrainerCorrectionModal: React.FC<{
    learner: EnrolledLearner;
    onClose: () => void;
    onUpdateScore: (learnerId: string, updatedSubmissions: QuizSubmission[]) => void;
}> = ({ learner, onClose, onUpdateScore }) => {
    const [activeSubmissionIdx, setActiveSubmissionIdx] = useState(0);
    const [submissions, setSubmissions] = useState<QuizSubmission[]>(learner.submissions || []);

    const submission = submissions[activeSubmissionIdx];

    const handleGradeOpenQuestion = (questionIdx: number, score: number, isCorrect: boolean) => {
        const newSubmissions = [...submissions];
        newSubmissions[activeSubmissionIdx].answers[questionIdx].score = score;
        newSubmissions[activeSubmissionIdx].answers[questionIdx].isCorrect = isCorrect;

        // Auto-mark as graded if all scores are present
        const allGraded = newSubmissions[activeSubmissionIdx].answers.every(a => a.type !== 'OPEN' || a.score !== undefined);
        if (allGraded) {
            newSubmissions[activeSubmissionIdx].status = 'graded';
            const total = newSubmissions[activeSubmissionIdx].answers.reduce((acc, a) => {
                if (a.type === 'OPEN') return acc + (a.score || 0) * 5;
                return acc + (a.isCorrect ? 100 : 0);
            }, 0);
            newSubmissions[activeSubmissionIdx].totalScore = Math.round(total / newSubmissions[activeSubmissionIdx].answers.length);
        }

        setSubmissions(newSubmissions);
    };

    const handleUpdateFeedback = (questionIdx: number, feedback: string) => {
        const newSubmissions = [...submissions];
        newSubmissions[activeSubmissionIdx].answers[questionIdx].feedback = feedback;
        setSubmissions(newSubmissions);
    };

    const handleSave = () => {
        onUpdateScore(learner.id, submissions);
        onClose();
    };

    return createPortal(
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in m-0" style={{ margin: 0 }}>
            <div className="bg-surface border border-glass-border rounded-3xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col relative overflow-hidden m-auto text-text">
                {/* Header */}
                <div className="p-4 sm:p-6 border-b border-glass-border flex flex-col sm:flex-row justify-between items-start sm:items-center bg-surface/90 gap-4">
                    <div className="flex items-center gap-3 sm:gap-4 w-full">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary text-lg sm:text-xl font-black shrink-0">
                            {learner.nom[0]}{learner.prenom[0]}
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
                                <h3 className="text-lg sm:text-xl font-black text-text truncate">{learner.prenom} {learner.nom}</h3>
                                {submission && (
                                    <div className="flex items-center gap-1 text-primary overflow-hidden">
                                        <ChevronRight size={16} className="text-text-muted hidden sm:block" />
                                        <h4 className="text-base sm:text-lg font-bold truncate">{submission.quizTitle}</h4>
                                    </div>
                                )}
                            </div>
                            <p className="text-[10px] sm:text-xs text-text-muted truncate">{learner.email}</p>
                        </div>
                        <button onClick={onClose} className="sm:hidden p-2 hover:bg-white/10 rounded-xl transition-colors shrink-0"><X size={20} /></button>
                    </div>
                    <button onClick={onClose} className="hidden sm:block p-2 hover:bg-white/10 rounded-xl transition-colors"><X size={24} /></button>
                </div>

                <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
                    {/* Sidebar sub list */}
                    <div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-glass-border bg-surface-hover/30 p-3 sm:p-4 space-y-3 overflow-y-auto max-h-[150px] md:max-h-none">
                        <label className="text-[10px] font-black uppercase text-text-muted px-2">Quiz Soumis</label>
                        {submissions.length === 0 ? (
                            <div className="p-4 text-center text-xs text-text-muted opacity-50 italic">Aucune soumission</div>
                        ) : (
                            <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0">
                                {submissions.map((s, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setActiveSubmissionIdx(idx)}
                                        className={`shrink-0 md:shrink-1 w-[200px] md:w-full text-left p-3 sm:p-4 rounded-xl sm:rounded-2xl border transition-all ${activeSubmissionIdx === idx ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' : 'bg-surface border-glass-border hover:border-primary/30'}`}
                                    >
                                        <div className="font-bold text-xs sm:text-sm truncate">{s.quizTitle}</div>
                                        <div className="flex justify-between items-center mt-2">
                                            <span className="text-[9px] opacity-70 uppercase font-bold">{s.submittedAt}</span>
                                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-black uppercase ${s.status === 'pending' ? 'bg-orange-500/20 text-orange-400' : 'bg-green-500/20 text-green-400'}`}>
                                                {s.status === 'pending' ? 'À corriger' : 'Corrigé'}
                                            </span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Main correction area */}
                    <div className="flex-1 overflow-y-auto p-4 sm:p-8 custom-scrollbar bg-background/50">
                        {submission ? (
                            <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-3">
                                    <h4 className="text-xl sm:text-2xl font-black">{submission.quizTitle}</h4>
                                    {submission.totalScore !== undefined && (
                                        <div className="text-left sm:text-right">
                                            <div className="text-2xl sm:text-3xl font-black text-primary">{submission.totalScore}%</div>
                                            <div className="text-[10px] font-bold uppercase text-text-muted">Score Final</div>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-6">
                                    {submission.answers.map((answer, qIdx) => (
                                        <div key={qIdx} className="bg-surface border border-glass-border rounded-2xl p-4 sm:p-6 shadow-sm border-l-4" style={{ borderLeftColor: answer.type === 'OPEN' ? (answer.score !== undefined ? 'var(--primary)' : 'var(--orange-500)') : (answer.isCorrect ? 'var(--green-500)' : 'var(--error)') }}>
                                            <div className="flex flex-col xs:flex-row xs:justify-between xs:items-start mb-4 gap-3">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-black uppercase text-text-muted">Question {qIdx + 1}</span>
                                                    <span className="text-[10px] px-2 py-0.5 bg-surface-hover rounded font-bold">{answer.type}</span>
                                                </div>
                                                {answer.type !== 'OPEN' ? (
                                                    <div className={`flex items-center gap-1.5 text-xs font-black uppercase ${answer.isCorrect ? 'text-green-500' : 'text-error'}`}>
                                                        {answer.isCorrect ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                                                        {answer.isCorrect ? 'Correct' : 'Incorrect'}
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex flex-1 sm:flex-none gap-2 p-1 bg-surface-hover rounded-xl border border-glass-border">
                                                            <button
                                                                onClick={() => handleGradeOpenQuestion(qIdx, 20, true)}
                                                                className={`flex-1 flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg text-[10px] sm:text-xs font-bold transition-all ${answer.isCorrect === true ? 'bg-green-500 text-white shadow-lg shadow-green-500/20' : 'text-green-500 hover:bg-green-500/10'}`}
                                                            >
                                                                <Check size={14} className="sm:w-4 sm:h-4" />
                                                                Valider
                                                            </button>
                                                            <button
                                                                onClick={() => handleGradeOpenQuestion(qIdx, 0, false)}
                                                                className={`flex-1 flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg text-[10px] sm:text-xs font-bold transition-all ${answer.isCorrect === false ? 'bg-error text-white shadow-lg shadow-error/20' : 'text-error hover:bg-error/10'}`}
                                                            >
                                                                <AlertCircle size={14} className="sm:w-4 sm:h-4" />
                                                                Invalider
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="space-y-4">
                                                <div className="bg-background/50 rounded-xl p-4 border border-glass-border">
                                                    <label className="text-[10px] font-black uppercase text-text-muted mb-2 block">Réponse de l'apprenant :</label>
                                                    <div className="text-sm italic font-medium whitespace-pre-wrap">
                                                        {answer.type === 'OPEN' ? answer.learnerAnswer : (
                                                            <span className="font-bold">Choix : {Array.isArray(answer.learnerAnswer) ? answer.learnerAnswer.join(', ') : answer.learnerAnswer}</span>
                                                        )}
                                                    </div>
                                                </div>

                                                {answer.type === 'OPEN' && (
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black uppercase text-text-muted">Feedback de l'instructeur</label>
                                                        <textarea
                                                            value={answer.feedback || ''}
                                                            onChange={(e) => handleUpdateFeedback(qIdx, e.target.value)}
                                                            placeholder="Ajouter un commentaire sur cette réponse..."
                                                            className="w-full bg-background border border-glass-border rounded-xl p-4 text-sm outline-none focus:border-primary transition-all min-h-[100px] resize-none"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-text-muted opacity-50">
                                <Search size={48} className="mb-4" />
                                <p>Sélectionnez une soumission à corriger</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 sm:p-6 border-t border-glass-border bg-surface flex flex-col sm:flex-row justify-end gap-2 sm:gap-4">
                    <button onClick={onClose} className="w-full sm:w-auto px-6 py-3 font-bold text-text-muted hover:bg-white/5 rounded-xl transition-all text-xs sm:text-sm order-2 sm:order-1">
                        Annuler
                    </button>
                    <button
                        onClick={handleSave}
                        className="w-full sm:w-auto px-8 py-3 bg-primary text-white rounded-xl font-black shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all text-xs sm:text-sm order-1 sm:order-2"
                    >
                        Terminer la correction
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

// --- Main Page Component ---
const CourseEditorPage: React.FC = () => {
    const { id: rawId } = useParams<{ id: string }>();
    const id = rawId?.startsWith(':') ? rawId.substring(1) : rawId;
    const navigate = useNavigate();
    const { getCourse, addCourse, updateCourse } = useCourses();

    const [course, setCourse] = useState<Course>({
        id: '', title: '', specialiteId: undefined, level: 'Licence', formations: [], semesters: [], prerequisites: '', description: '', coverImage: '', sections: [], published: false, deadlineDate: '', reminderDays: undefined, timeTrackingEnabled: false
    });
    const [specialites, setSpecialites] = useState<BackendSpecialite[]>([]);
    const [availableFormations, setAvailableFormations] = useState<Formation[]>([]);

    const [activeTab, setActiveTab] = useState<'info' | 'content' | 'learners' | 'enrollments'>('info');
    const [expandedSectionId, setExpandedSectionId] = useState<string | null>(null);
    const [selectedSubSectionId, setSelectedSubSectionId] = useState<string | null>(null);
    const [showQuizEditor, setShowQuizEditor] = useState(false);
    const [showFinalExamEditor, setShowFinalExamEditor] = useState(false);
    const [showAiContentModal, setShowAiContentModal] = useState(false);
    const [aiContentPrompt, setAiContentPrompt] = useState('');
    const [aiContentLoading, setAiContentLoading] = useState(false);
    const [aiContentError, setAiContentError] = useState('');
    const [selectedLearnerForCorrection, setSelectedLearnerForCorrection] = useState<EnrolledLearner | null>(null);
    const [detailedLearnerId, setDetailedLearnerId] = useState<string | null>(null);
    const [enseignantEmails, setEnseignantEmails] = useState<Set<string>>(new Set());
    const [showQuizListInDetails, setShowQuizListInDetails] = useState(false);
    const [selectedSubmissionIndex, setSelectedSubmissionIndex] = useState<number | null>(0);
    const [detailedTab, setDetailedTab] = useState<'quizzes' | 'tps'>('quizzes');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoadingCourse, setIsLoadingCourse] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);

    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        type?: 'danger' | 'success' | 'warning';
        confirmText?: string;
        onConfirm: () => void;
        onCancel?: () => void
    }>({ isOpen: false, title: '', message: '', onConfirm: () => { } });

    // Real Learners State (loaded from API)
    const [enrolledLearners, setEnrolledLearners] = useState<EnrolledLearner[]>([]);
    const [pendingEnrollments, setPendingEnrollments] = useState<{ id: string; nom: string; prenom: string; email: string; date: string; specialite?: string }[]>([]);

    const [learnersSearchTerm, setLearnersSearchTerm] = useState('');
    const [learnersCurrentPage, setLearnersCurrentPage] = useState(1);
    const [enrollmentsCurrentPage, setEnrollmentsCurrentPage] = useState(1);
    const itemsPerPage = 6;

    // Correction logic for open-ended questions
    const handleGradeOpenQuestion = async (learnerId: string, submissionIdx: number, questionIdx: number, isCorrect: boolean) => {
        // 1. Find target data first
        const learner = enrolledLearners.find(l => l.id === learnerId);
        if (!learner || !learner.submissions) return;

        const sub = learner.submissions[submissionIdx];
        if (!sub || !sub.id) return;

        const submissionId = sub.id;

        // 2. Prepare updated data
        const updatedAnswers = [...sub.answers];
        updatedAnswers[questionIdx] = {
            ...updatedAnswers[questionIdx],
            isCorrect,
            score: isCorrect ? 100 : 0
        };

        // Recalculate quiz total score
        const totalScoreSum = updatedAnswers.reduce((acc: number, a: StudentAnswer) => {
            const qScore = a.isCorrect ? 100 : 0;
            return acc + qScore;
        }, 0);
        const newTotalScore = Math.round(totalScoreSum / updatedAnswers.length);
        const isPassed = newTotalScore >= 70;

        // 3. Update local UI state
        setEnrolledLearners(prev => prev.map(l => {
            if (l.id !== learnerId) return l;

            const newSubmissions = [...(l.submissions || [])];
            newSubmissions[submissionIdx] = {
                ...sub,
                answers: updatedAnswers,
                totalScore: newTotalScore,
                status: 'graded' as const
            };

            // Recalculate stats correctly
            const regularQuizzes = newSubmissions.filter(s => s.quizId !== 'final_exam');
            const totalScoreSum = regularQuizzes.reduce((acc, s) => acc + (s.totalScore || 0), 0);

            // Note: totalQuizzes is the count of all required quizzes in the course
            const totalQuizzesCount = l.totalQuizzes || 1;
            const updatedAvgScore = Math.round(totalScoreSum / totalQuizzesCount);

            // Find best exam result
            const examSub = newSubmissions.find(s => s.quizId === 'final_exam');
            const updatedFinalExamNote = examSub ? (examSub.totalScore! * 20) / 100 : l.finalExamNote;

            return {
                ...l,
                submissions: newSubmissions,
                totalQuizScore: updatedAvgScore,
                finalExamNote: updatedFinalExamNote
            };
        }));

        // 4. Persist to backend
        try {
            await api.put(`/courses/${id}/quiz-results/${submissionId}`, {
                score: newTotalScore,
                passed: isPassed,
                answers: JSON.stringify(updatedAnswers)
            });
            console.log(`Correction saved for submission ${submissionId}`);
        } catch (err) {
            console.error("Failed to save quiz correction:", err);
        }
    };

    // Fetch specialites and formations from backend on mount
    useEffect(() => {
        api.get<BackendSpecialite[]>('/specialites')
            .then(res => setSpecialites(res.data))
            .catch(() => { });

        api.get<Formation[]>('/formations')
            .then(res => setAvailableFormations(res.data))
            .catch(() => { });

        // Identifie les formateurs parmi les apprenants
        api.get('/enseignants')
            .then(res => {
                const emails = new Set<string>();
                res.data.forEach((e: any) => {
                    if (e.email) emails.add(e.email.toLowerCase());
                });
                setEnseignantEmails(emails);
            })
            .catch(err => console.error('Error fetching enseignants:', err));
    }, []);

    // Fetch pending enrollments for this course
    const fetchCourseEnrollments = async (courseId: string, currentCourse?: Course) => {
        if (!courseId || courseId === 'new') return;
        try {
            const [enrollmentsRes, resultsRes, progressRes, tpsRes] = await Promise.all([
                api.get('/enrollments'),
                api.get(`/courses/${courseId}/quiz-results`),
                api.get(`/courses/${courseId}/progress`),
                api.get(`/courses/${courseId}/tps`)
            ]).catch(err => {
                console.error('Error fetching data:', err);
                return [{ data: [] }, { data: [] }, { data: [] }, { data: [] }];
            });

            const allEnrollments = enrollmentsRes.data as any[];
            const quizResults = resultsRes.data as any[];
            const allProgress = progressRes.data as any[];
            const allTps = tpsRes.data as any[];

            const courseToUse = currentCourse || course;

            // Extract valid quiz IDs from the current course structure 
            const validQuizIds = new Set<string>();
            courseToUse.sections?.forEach((section: any) => {
                section.subSections?.forEach((ss: any) => {
                    // Check if the subsection has a quiz and that quiz has an ID
                    if (ss.quiz && ss.quiz.id) {
                        validQuizIds.add(String(ss.quiz.id));
                    }
                });
            });

            // Include final exam if it exists
            if (courseToUse.finalExam) {
                validQuizIds.add('final_exam');
            }

            const totalQuizzesNum = validQuizIds.size;

            // Filter only enrollments for this specific course that are PENDING
            const pending = allEnrollments
                .filter((e: any) => String(e.course?.id) === String(courseId) && e.status === 'PENDING')
                .map((e: any) => ({
                    id: String(e.id),
                    nom: e.apprenant?.nom || '',
                    prenom: e.apprenant?.prenom || '',
                    email: e.apprenant?.email || '',
                    date: e.requestedAt || '',
                    specialite: e.apprenant?.specialite?.nom || 'Non spécifiée'
                }));
            setPendingEnrollments(pending);

            // Also load accepted learners for this course
            const accepted = allEnrollments
                .filter((e: any) => String(e.course?.id) === String(courseId) && e.status === 'ACCEPTED')
                .map((e: any) => {
                    const learnerId = String(e.apprenant?.id);
                    const learnerResults = quizResults.filter(r => String(r.apprenantId) === learnerId);
                    // Only count results for quizzes/exams that actually exist in the course now
                    const relevantResults = learnerResults.filter(r => validQuizIds.has(String(r.quizId)));

                    // Group results by quizId and keep the best score
                    const quizBestScores = new Map<string, number>();
                    relevantResults.forEach(r => {
                        const score = r.score || 0;
                        if (!quizBestScores.has(r.quizId) || score > quizBestScores.get(r.quizId)!) {
                            quizBestScores.set(r.quizId, score);
                        }
                    });

                    const quizzesSubmitted = quizBestScores.size;

                    // The average should be over the TOTAL number of quizzes in the course,
                    // treating unsubmitted quizzes as 0.
                    let totalScoreSum = 0;
                    validQuizIds.forEach(quizId => {
                        totalScoreSum += quizBestScores.get(quizId) || 0;
                    });

                    const avgScore = totalQuizzesNum > 0
                        ? Math.round(totalScoreSum / totalQuizzesNum)
                        : 0;

                    // Get the highest score for final_exam if there are multiple attempts
                    const bestExamResult = learnerResults
                        .filter(r => r.quizId === 'final_exam')
                        .reduce((best, curr) => (!best || curr.score > best.score) ? curr : best, null as any);

                    const finalExamNote = bestExamResult ? (bestExamResult.score * 20) / 100 : null;
                    const cheatingReason = bestExamResult?.cheatingReason || null;

                    const allSubmissions = learnerResults.map(r => {
                        let quizTitle = r.quizId === 'final_exam' ? 'Examen Final' : 'Quiz';
                        courseToUse.sections?.forEach((s: any) => {
                            s.subSections?.forEach((ss: any) => {
                                if (ss.quiz && String(ss.quiz.id) === String(r.quizId)) {
                                    quizTitle = ss.title || ss.quiz.title || 'Quiz';
                                }
                            });
                        });

                        let answers: StudentAnswer[] = [];
                        if (r.answers) {
                            try {
                                answers = typeof r.answers === 'string' ? JSON.parse(r.answers) : r.answers;
                            } catch (e) {
                                console.error("Failed to parse answers:", e);
                            }
                        }

                        return {
                            id: String(r.id),
                            quizId: String(r.quizId),
                            quizTitle,
                            submittedAt: r.attemptedAt ? new Date(r.attemptedAt).toLocaleString('fr-FR') : 'Date inconnue',
                            answers,
                            totalScore: r.score,
                            status: 'graded' as const,
                            cheatingReason: r.cheatingReason
                        };
                    });

                    // Group submissions by quizId and keep only the highest score for each
                    const bestByQuiz = new Map<string, any>();

                    allSubmissions.forEach(sub => {
                        const quizId = sub.quizId;
                        const existing = bestByQuiz.get(quizId);

                        if (!existing || (sub.totalScore ?? 0) > (existing.totalScore ?? 0)) {
                            bestByQuiz.set(quizId, sub);
                        } else if ((sub.totalScore ?? 0) === (existing.totalScore ?? 0)) {
                            // If scores are equal, keep the most recent one
                            const subDate = new Date(sub.submittedAt).getTime();
                            const existingDate = new Date(existing.submittedAt).getTime();
                            if (!isNaN(subDate) && !isNaN(existingDate) && subDate > existingDate) {
                                bestByQuiz.set(quizId, sub);
                            }
                        }
                    });

                    const submissions = Array.from(bestByQuiz.values()).sort((a, b) => {
                        // Optional: Sort by quiz title or ID if helpful
                        return a.quizTitle.localeCompare(b.quizTitle);
                    });

                    // Calculated section progress
                    const learnerProgress = allProgress.find(p => String(p.apprenantId) === learnerId);
                    const completedIds = learnerProgress?.completedSubSectionIds
                        ? learnerProgress.completedSubSectionIds.split(',').filter((id: string) => id !== '')
                        : [];
                    
                    // Count unique valid completed subsections
                    const validCompletedCount = completedIds.filter((cid: string) => {
                        return courseToUse.sections?.some(s => s.subSections?.some(ss => String(ss.id) === String(cid)));
                    }).length;

                    const totalSubSectionsCount = courseToUse.sections?.reduce((acc, s) => acc + (s.subSections?.length || 0), 0) || 0;

                    // TP Submissions for this learner
                    const learnerTps = allTps.filter(tp => String(tp.apprenantId) === learnerId).map(tp => {
                        let subSectionTitle = 'Leçon inconnue';
                        courseToUse.sections?.forEach((s: any) => {
                            s.subSections?.forEach((ss: any) => {
                                if (String(ss.id) === String(tp.subSectionId)) {
                                    subSectionTitle = ss.title;
                                }
                            });
                        });
                        return {
                            ...tp,
                            subSectionTitle
                        };
                    });
                    
                    let totalTimeSec = 0;
                    if (learnerProgress?.timeSpentPerSection) {
                        try {
                            const parsed = typeof learnerProgress.timeSpentPerSection === 'string'
                                ? JSON.parse(learnerProgress.timeSpentPerSection)
                                : learnerProgress.timeSpentPerSection;
                            Object.values(parsed).forEach(time => {
                                if (typeof time === 'number') totalTimeSec += time;
                            });
                        } catch(e) {}
                    }
                    

                    return {
                        id: learnerId,
                        nom: e.apprenant?.nom || '',
                        prenom: e.apprenant?.prenom || '',
                        email: e.apprenant?.email || '',
                        totalQuizScore: avgScore,
                        quizzesSubmitted: quizzesSubmitted,
                        totalQuizzes: totalQuizzesNum,
                        sectionsCompleted: validCompletedCount,
                        totalSections: totalSubSectionsCount,
                        finalExamNote: finalExamNote,
                        specialite: e.apprenant?.specialite?.nom || 'Non spécifiée',
                        cheatingReason: cheatingReason,
                        submissions: submissions,
                        tpSubmissions: learnerTps,
                        totalTimeSpentSec: totalTimeSec
                    };
                });
            setEnrolledLearners(accepted);
        } catch (err) {
            console.error('Failed to load course enrollments:', err);
        }
    };

    useEffect(() => {
        const load = async () => {
            if (!id || id === 'new') {
                if (id === 'new' && !course.title) {
                    setCourse(prev => ({ ...prev, id: '' }));
                }
                return;
            }

            setIsLoadingCourse(true);
            setLoadError(null);
            try {
                const foundCourse = await getCourse(id);
                if (foundCourse) {
                    const normalizedCourse = { 
                        ...foundCourse, 
                        sections: foundCourse.sections || [], 
                        semesters: foundCourse.semesters || [], 
                        formations: foundCourse.formations || [] 
                    };
                    setCourse(normalizedCourse);
                    if (normalizedCourse.sections?.length > 0) {
                        setExpandedSectionId(normalizedCourse.sections[0].id);
                    }
                    // Load real enrollments for this course
                    await fetchCourseEnrollments(id, normalizedCourse);
                } else {
                    setLoadError("Cours non trouvé");
                }
            } catch (err) {
                console.error("Error loading course:", err);
                setLoadError("Erreur lors du chargement du cours");
            } finally {
                setIsLoadingCourse(false);
            }
        };
        load();
    }, [id, getCourse]);

    const openConfirmModal = (
        title: string,
        message: string,
        onConfirm: () => void,
        type: 'danger' | 'success' | 'warning' = 'danger',
        onCancel?: () => void,
        confirmText?: string
    ) => setConfirmModal({ isOpen: true, title, message, onConfirm, type, onCancel, confirmText });

    const getSelectedSubSection = () => {
        if (!selectedSubSectionId) return null;
        for (const section of course.sections) {
            const sub = section.subSections.find(ss => ss.id === selectedSubSectionId);
            if (sub) return { section, subSection: sub };
        }
        return null;
    };

    const getYouTubeEmbedUrl = (url: string) => {
        if (!url) return null;
        const regExp = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?|shorts|live)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
        const match = url.match(regExp);
        return match ? `https://www.youtube.com/embed/${match[1]}` : null;
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setCourse({ ...course, coverImage: reader.result as string });
            reader.readAsDataURL(file);
        }
    };

    const handleSave = async () => {
        if (isSaving) return;
        if (!course.title.trim()) {
            openConfirmModal('Attention', 'Le titre du cours est requis pour enregistrer.', () => setConfirmModal(prev => ({ ...prev, isOpen: false })), 'warning');
            return;
        }

        setIsSaving(true);
        try {
            // ---------- Upload any Base64 images in lesson content ----------
            // Walk through all sub-section content, find <img src="data:..."> tags,
            // upload each image to the server, and replace the Base64 with a URL.
            const uploadBase64ImagesInHtml = async (html: string): Promise<string> => {
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
                const imgs = Array.from(doc.querySelectorAll('img[src^="data:"]'));
                for (const img of imgs) {
                    const src = img.getAttribute('src')!;
                    // Convert dataURL to Blob
                    const [header, b64] = src.split(',');
                    const mime = header.match(/:(.*?);/)?.[1] ?? 'image/png';
                    const byteChars = atob(b64);
                    const byteArr = new Uint8Array(byteChars.length);
                    for (let i = 0; i < byteChars.length; i++) byteArr[i] = byteChars.charCodeAt(i);
                    const blob = new Blob([byteArr], { type: mime });
                    const ext = mime.split('/')[1] ?? 'png';
                    const file = new File([blob], `editor-image.${ext}`, { type: mime });

                    const formData = new FormData();
                    formData.append('file', file);
                    const token = localStorage.getItem('token');
                    const res = await fetch(`${API_FORMATEUR}/files/content-images/upload`, {
                        method: 'POST',
                        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
                        body: formData,
                    });
                    if (res.ok) {
                        const { url, filename } = await res.json() as { url: string, filename?: string };
                        const finalUrl = filename ? `${API_FORMATEUR}/files/content-images/${filename}` : url;
                        img.setAttribute('src', finalUrl);
                    }
                }
                // Serialize back to HTML string (body inner content only)
                return doc.body.innerHTML;
            };

            // Process all sub-section content fields
            const processedCourse = {
                ...course,
                description: course.description ? await uploadBase64ImagesInHtml(course.description) : course.description,
                prerequisites: course.prerequisites ? await uploadBase64ImagesInHtml(course.prerequisites) : course.prerequisites,
                sections: await Promise.all(course.sections.map(async (section, sIdx) => ({
                    ...section,
                    orderIndex: sIdx,
                    subSections: await Promise.all(section.subSections.map(async (ss, ssIdx) => ({
                        ...ss,
                        orderIndex: ssIdx,
                        content: ss.content ? await uploadBase64ImagesInHtml(ss.content) : ss.content,
                    })))
                })))
            };
            // -----------------------------------------------------------------

            // Determine if this is a new course or an update
            const currentId = (id && id !== 'new') ? id : course.id;
            const isNew = id === 'new' || !currentId || currentId === '';

            console.log("DEBUG: rawId:", rawId, "id:", id, "course.id:", course.id, "resolvedId:", currentId, "isNew:", isNew);

            const courseToSave = stripTempIds(processedCourse);

            if (isNew) {
                console.log("Saving: ACTION = CREATE (POST)");
                const savedCourse = await addCourse(courseToSave);
                // Update URL to prevent creating duplicates on subsequent saves
                if (savedCourse && savedCourse.id) {
                    setCourse({ ...savedCourse, sections: savedCourse.sections || [], semesters: savedCourse.semesters || [], formations: savedCourse.formations || [] });
                    navigate(`/courses/${savedCourse.id}`, { replace: true });
                }
            } else {
                console.log("Saving: ACTION = UPDATE (PUT), ID =", currentId);
                const updated = await updateCourse({ ...courseToSave, id: currentId });
                if (updated) {
                    const normalized = { ...updated, sections: updated.sections || [], semesters: updated.semesters || [], formations: updated.formations || [] };
                    setCourse(normalized);
                    fetchCourseEnrollments(currentId, normalized);
                }
            }

            openConfirmModal('Succès !', 'Le cours a été enregistré avec succès.', () => {
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
            }, 'success', undefined, 'Continuer');
        } catch (error) {
            openConfirmModal('Erreur', 'Une erreur est survenue lors de l\'enregistrement.', () => setConfirmModal(prev => ({ ...prev, isOpen: false })), 'danger');
        } finally {
            setIsSaving(false);
        }
    };

    const addSection = () => {
        const newSection: Section = { id: generateId(), title: 'Nouvelle Section', subSections: [], orderIndex: Infinity, masseHoraire: '1' };
        setCourse(prev => ({ ...prev, sections: [...prev.sections, newSection] }));
        setExpandedSectionId(newSection.id);
    };

    const deleteSection = (sectionId: string) => {
        const sectionToDelete = course.sections.find(s => s.id === sectionId);
        openConfirmModal('Supprimer la section ?', 'Tout le contenu de cette section sera perdu, ainsi que les réponses des apprenants aux quiz de cette section.', async () => {
            // Delete quiz results for all quizzes in this section
            if (id && id !== 'new' && sectionToDelete) {
                for (const ss of sectionToDelete.subSections) {
                    if (ss.quiz?.id) {
                        try {
                            await api.delete(`/courses/${id}/quiz-results/${ss.quiz.id}`);
                        } catch (err) {
                            console.error(`Failed to delete quiz results for quiz ${ss.quiz.id}:`, err);
                        }
                    }
                }
            }
            setCourse(prev => ({ ...prev, sections: prev.sections.filter(s => s.id !== sectionId) }));
            if (expandedSectionId === sectionId) setExpandedSectionId(null);
        }, 'danger', () => setConfirmModal(prev => ({ ...prev, isOpen: false })));
    };

    const addSubSection = (sectionId: string) => {
        const newSubSection: SubSection = { 
            id: generateId(), 
            title: 'Nouvelle Leçon', 
            content: '', 
            videoUrls: [], 
            orderIndex: Infinity,
            isTp: false,
            tpPrompt: ''
        };
        setCourse(prev => ({ ...prev, sections: prev.sections.map(s => s.id === sectionId ? { ...s, subSections: [...s.subSections, newSubSection] } : s) }));
        setSelectedSubSectionId(newSubSection.id);
        setActiveTab('content');
    };

    const updateSubSection = (sectionId: string, subSectionId: string, updates: Partial<SubSection>) => {
        setCourse(prev => ({
            ...prev,
            sections: prev.sections.map(s => {
                if (s.id !== sectionId) return s;
                return { ...s, subSections: s.subSections.map(ss => ss.id === subSectionId ? { ...ss, ...updates } : ss) };
            })
        }));
    };

    const deleteSubSection = (sectionId: string, subSectionId: string) => {
        const section = course.sections.find(s => s.id === sectionId);
        const subSectionToDelete = section?.subSections.find(ss => ss.id === subSectionId);

        openConfirmModal('Supprimer la leçon ?', 'Cette action supprimera également les réponses des apprenants si cette leçon contient un quiz.', async () => {
            // Delete quiz results if it was a quiz
            if (id && id !== 'new' && subSectionToDelete?.quiz?.id) {
                try {
                    await api.delete(`/courses/${id}/quiz-results/${subSectionToDelete.quiz.id}`);
                } catch (err) {
                    console.error(`Failed to delete quiz results for quiz ${subSectionToDelete.quiz.id}:`, err);
                }
            }
            setCourse(prev => ({ ...prev, sections: prev.sections.map(s => s.id === sectionId ? { ...s, subSections: s.subSections.filter(ss => ss.id !== subSectionId) } : s) }));
            if (selectedSubSectionId === subSectionId) setSelectedSubSectionId(null);
        }, 'danger', () => setConfirmModal(prev => ({ ...prev, isOpen: false })));
    };

    const renderInfoTab = () => (
        <div className="max-w-5xl mx-auto space-y-10 animate-fade-in pb-20 pt-4">
            <div className="bg-surface rounded-3xl p-8 border border-glass-border shadow-xl">
                <div className="flex justify-between items-center mb-8">
                    <h3 className="text-2xl font-bold flex items-center gap-3 text-text"><Layout size={28} className="text-primary" />Présentation du cours</h3>
                </div>
                <div className="flex flex-col lg:flex-row gap-10">
                    <div className="w-full lg:w-1/4 max-w-[280px] flex-shrink-0">
                        <div className="relative w-full aspect-video rounded-2xl overflow-hidden border-2 border-dashed border-glass-border group cursor-pointer hover:border-primary transition-all bg-surface-hover/30 flex items-center justify-center" onClick={() => fileInputRef.current?.click()}>
                            {course.coverImage ? (
                                <><img src={course.coverImage} alt="Cover" className="w-full h-full object-cover" /><div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold text-lg"><Upload size={24} className="mr-3" /> Changer</div></>
                            ) : (
                                <div className="flex flex-col items-center justify-center text-text-muted group-hover:text-primary transition-colors p-4 text-center"><div className="p-3 bg-primary/10 rounded-full mb-3"><Upload size={24} /></div><span className="text-sm font-bold">Couverture</span></div>
                            )}
                            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                        </div>
                    </div>
                    <div className="flex-1 space-y-8">
                        <div><label className="text-xs font-bold text-text-muted uppercase tracking-widest mb-2.5 block">Titre du cours</label><input type="text" value={course.title} onChange={(e) => setCourse({ ...course, title: e.target.value })} className="w-full input text-2xl font-bold py-4" placeholder="Ex: Introduction au Machine Learning" /></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <label className="text-xs font-bold text-text-muted uppercase tracking-widest mb-2.5 block">Spécialité</label>
                                <select
                                    value={course.specialiteId ?? ''}
                                    onChange={(e) => setCourse({ ...course, specialiteId: e.target.value ? Number(e.target.value) : undefined })}
                                    className="w-full input text-lg cursor-pointer"
                                >
                                    <option value="">-- Toutes spécialités --</option>
                                    {specialites.map(s => (
                                        <option key={s.id} value={s.id}>{s.nom.charAt(0).toUpperCase() + s.nom.slice(1)}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-text-muted uppercase tracking-widest mb-2.5 block">Niveau</label>
                                <select value={course.level} onChange={(e) => setCourse({ ...course, level: e.target.value as 'Licence' | 'Master' | 'Libre', semesters: [] })} className="w-full input text-lg cursor-pointer">
                                    <option value="Licence">Licence</option>
                                    <option value="Master">Master</option>
                                    <option value="Libre">Libre (Tout le monde)</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-text-muted uppercase tracking-widest mb-2.5 flex items-start gap-2 min-h-[32px]">
                                    <Clock size={14} className="text-primary shrink-0 mt-0.5" />
                                    <span>Date limite de complétion (Optionnel)</span>
                                </label>
                                <input 
                                    type="date" 
                                    value={course.deadlineDate ? course.deadlineDate.split('T')[0] : ''} 
                                    onChange={(e) => setCourse({ ...course, deadlineDate: e.target.value ? `${e.target.value}T23:59:59` : '' })} 
                                    min={new Date().toISOString().split('T')[0]}
                                    className="w-full input text-lg cursor-pointer"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-text-muted uppercase tracking-widest mb-2.5 flex items-start gap-2 min-h-[32px]">
                                    <Bell size={14} className="text-primary shrink-0 mt-0.5" />
                                    <span>Fréquence rappel (Jours)</span>
                                </label>
                                <input 
                                    type="number" 
                                    value={course.reminderDays !== undefined ? course.reminderDays : ''} 
                                    onChange={(e) => setCourse({ ...course, reminderDays: e.target.value ? parseInt(e.target.value) : undefined })} 
                                    placeholder="Ex: 1 pour chaque jour"
                                    min="0"
                                    className="w-full input text-lg"
                                />
                            </div>
                            <div className="lg:col-span-1">
                                <label className="text-xs font-bold text-text-muted uppercase tracking-widest mb-2.5 flex items-start gap-2 min-h-[32px]">
                                    <Clock size={14} className="text-primary shrink-0 mt-0.5" />
                                    <span>Exigence de temps (Optionnel)</span>
                                </label>
                                <button
                                    type="button"
                                    onClick={() => setCourse({ ...course, timeTrackingEnabled: !course.timeTrackingEnabled })}
                                    className={`w-full p-3.5 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between group ${course.timeTrackingEnabled ? 'bg-primary/10 border-primary text-primary' : 'bg-surface-hover/30 border-glass-border text-text-muted hover:border-primary/30'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <Timer size={20} className={course.timeTrackingEnabled ? 'text-primary' : 'text-text-muted group-hover:text-primary'} />
                                        <span className="font-bold text-sm">Compteur de présence</span>
                                    </div>
                                    <div className={`w-10 h-5 rounded-full relative transition-all duration-300 ${course.timeTrackingEnabled ? 'bg-primary' : 'bg-surface-hover'}`}>
                                        <div className={`absolute top-1 w-3 h-3 rounded-full bg-white shadow-md transition-all ${course.timeTrackingEnabled ? 'left-6' : 'left-1'}`} />
                                    </div>
                                </button>
                                <p className="text-[10px] text-text-muted mt-2 px-1">Arrête le décompte si l'apprenant quitte l'onglet.</p>
                            </div>
                        </div>
                        <div className="pt-4">
                            <label className="text-xs font-bold text-text-muted uppercase tracking-widest mb-4 block">Formations concernées</label>
                            <div className="flex flex-wrap gap-4">
                                {availableFormations.map((formation) => {
                                    const isSelected = course.formations?.some(f => f.id === formation.id);
                                    return (
                                        <button
                                            key={formation.id}
                                            type="button"
                                            onClick={() => {
                                                const currentFormations = course.formations || [];
                                                const newFormations = isSelected
                                                    ? currentFormations.filter(f => f.id !== formation.id)
                                                    : [...currentFormations, formation];
                                                setCourse({ ...course, formations: newFormations });
                                            }}
                                            className={`flex-1 min-w-[200px] flex items-center justify-center gap-3 p-4 rounded-2xl border-2 transition-all font-bold ${isSelected
                                                ? 'bg-primary/10 border-primary text-primary shadow-lg shadow-primary/10'
                                                : 'bg-surface-hover/30 border-glass-border text-text-muted hover:border-primary/30 hover:text-primary'
                                                }`}
                                        >
                                            <RefreshCw size={18} />
                                            {formation.nom}
                                        </button>
                                    );
                                })}
                                {availableFormations.length === 0 && (
                                    <p className="text-sm text-text-muted italic">Aucune formation disponible. Configurez-les dans le tableau de bord Admin.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="grid grid-cols-1 gap-10">
                {course.level !== 'Libre' && (
                    <div className="bg-surface rounded-3xl p-8 border border-glass-border shadow-lg">
                        <label className="text-xs font-bold text-text-muted uppercase tracking-widest mb-6 block">Semestres concernés</label>
                        <div className="flex flex-wrap gap-4">
                            {(course.level === 'Master' ? ['S1', 'S2', 'S3', 'S4'] : ['S1', 'S2', 'S3', 'S4', 'S5', 'S6']).map(sem => {
                                const isSelected = course.semesters?.includes(sem);
                                return <button key={sem} onClick={() => { const current = course.semesters || []; setCourse({ ...course, semesters: isSelected ? current.filter(s => s !== sem) : [...current, sem] }); }} className={`w-14 h-14 rounded-2xl text-lg font-bold transition-all flex items-center justify-center border-2 ${isSelected ? 'bg-primary text-white border-primary shadow-lg shadow-primary/25 scale-110' : 'bg-surface-hover text-text-muted border-transparent hover:border-primary/30 hover:bg-primary/5 hover:text-primary'}`}>{sem}</button>;
                            })}
                        </div>
                    </div>
                )}
                {course.level === 'Libre' && (
                    <div className="bg-primary/5 rounded-3xl p-6 border border-primary/20 shadow-lg flex items-center gap-4">
                        <div className="p-3 bg-primary/10 rounded-2xl text-primary flex-shrink-0">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                        </div>
                        <div>
                            <p className="font-bold text-primary text-base">Cours ouvert à tous</p>
                            <p className="text-sm text-text-muted mt-0.5">Ce cours est accessible à tous les apprenants, quel que soit leur niveau ou semestre.</p>
                        </div>
                    </div>
                )}
                <div className="bg-surface rounded-3xl p-8 border border-glass-border shadow-lg">
                    <label className="text-xs font-bold text-text-muted uppercase tracking-widest mb-4 block">Description détaillée</label>
                    <MockQuill hideImages={true} value={course.description} onChange={(c) => setCourse({ ...course, description: c })} className="min-h-[300px]" placeholder="Décrivez les objectifs et le contenu du cours..." />
                </div>
                <div className="bg-surface rounded-3xl p-8 border border-glass-border shadow-lg">
                    <label className="text-xs font-bold text-text-muted uppercase tracking-widest mb-4 block">Prérequis</label>
                    <MockQuill hideImages={true} value={course.prerequisites} onChange={(c) => setCourse({ ...course, prerequisites: c })} className="min-h-[200px]" placeholder="Connaissances nécessaires..." />
                </div>
            </div>
        </div>
    );

    const renderContentTab = () => {
        const selectedData = getSelectedSubSection();
        return (
            <div className="flex flex-col gap-10 items-stretch max-w-5xl mx-auto pb-20 pt-4">
                <div className="w-full flex flex-col bg-surface rounded-3xl border border-glass-border overflow-hidden shadow-xl animate-fade-in" style={{ animationDelay: '0.1s' }}>
                    <div className="p-6 md:p-8 border-b border-glass-border flex justify-between items-center bg-surface/90 backdrop-blur-xl z-10">
                        <h3 className="text-2xl font-bold flex items-center gap-3 text-text"><Layout size={28} className="text-primary" />Structure du cours</h3>
                        <button onClick={addSection} className="w-14 h-14 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-xl transition-all flex items-center justify-center shadow-lg shadow-primary/10 border-2 border-primary/30 hover:border-primary" title="Ajouter une section"><Plus size={28} strokeWidth={3} className="flex-shrink-0" /></button>
                    </div>
                    <div className="p-6 md:p-8 space-y-4 bg-surface-hover/30">
                        {course.sections.length === 0 && <div className="flex flex-col items-center justify-center py-20 text-text-muted opacity-40"><Plus size={48} className="mb-4 text-primary/50" /><p className="font-bold">Aucune section</p><p className="text-xs">Commencez par en ajouter une</p></div>}
                        {course.sections.map((section, idx) => (
                            <div key={section.id || `section-${idx}`} className="card !rounded-2xl border border-glass-border overflow-hidden bg-surface group/section">
                                <div className={`flex items-center p-4 cursor-pointer transition-all ${expandedSectionId === section.id ? 'bg-primary/5' : 'hover:bg-surface-hover/50'}`} onClick={() => setExpandedSectionId(expandedSectionId === section.id ? null : section.id)}>
                                    <div className={`mr-3 transition-all ${expandedSectionId === section.id ? 'text-primary scale-110' : 'text-text-muted'}`}>{expandedSectionId === section.id ? <ChevronDown size={20} /> : <ChevronRight size={20} />}</div>
                                    <div className="flex-1 min-w-0 flex flex-col gap-1">
                                        <div className="flex items-center gap-2">
                                            <input value={section.title} onClick={(e) => e.stopPropagation()} onChange={(e) => { const newSections = [...course.sections]; newSections[idx].title = e.target.value; setCourse({ ...course, sections: newSections }); }} className="bg-transparent flex-1 text-base font-black focus:outline-none focus:text-primary placeholder-text-muted/30 truncate text-text tracking-tight" placeholder="Titre de la section..." />
                                            <div className="flex items-center gap-1.5 bg-surface-hover/50 rounded-lg px-3 py-1.5 border border-glass-border focus-within:border-primary/50 transition-all group/masse" onClick={(e) => e.stopPropagation()}>
                                                <Clock size={14} className="text-text-muted group-focus-within/masse:text-primary transition-colors" />
                                                <input value={section.masseHoraire || ""} onChange={(e) => { const newSections = [...course.sections]; newSections[idx].masseHoraire = e.target.value; setCourse({ ...course, sections: newSections }); }} className="bg-transparent w-24 text-xs font-bold focus:outline-none placeholder-text-muted/50 text-primary" placeholder="1" title="Volume horaire" />
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] uppercase font-bold text-text-muted px-1.5 py-0.5 bg-surface-hover rounded">Section {idx + 1}</span>
                                            <span className="text-[10px] font-medium text-text-muted opacity-60">• {section.subSections.length} leçons</span>
                                        </div>
                                    </div>
                                    <button onClick={(e) => { e.stopPropagation(); deleteSection(section.id); }} className="opacity-0 group-hover/section:opacity-100 p-2 text-text-muted hover:text-error hover:bg-error/10 rounded-xl transition-all" title="Supprimer la section"><Trash2 size={16} /></button>
                                </div>
                                {expandedSectionId === section.id && (
                                    <div className="px-3 pb-3 space-y-2 bg-surface-hover/30">
                                        <div className="border-t border-glass-border/50 mb-2" />
                                        {section.subSections.map((sub, sIdx) => {
                                            const isSelected = selectedSubSectionId === sub.id;
                                            return (
                                                <div key={sub.id || `sub-${sIdx}`} onClick={() => setSelectedSubSectionId(sub.id)} className={`group/sub flex items-center gap-4 p-3 rounded-xl cursor-pointer transition-all border ${isSelected ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-[1.02] z-10' : 'bg-surface border-glass-border text-text-muted hover:border-primary/50 hover:text-text hover:shadow-md'}`}>
                                                    <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${isSelected ? 'bg-white/20' : 'bg-surface-hover text-text-muted'}`}>{sub.videoUrl || (sub.videoUrls && sub.videoUrls.length > 0) ? <Youtube size={16} /> : <FileText size={16} />}</div>
                                                    <div className="flex-1 min-w-0"><p className={`text-sm font-bold truncate ${isSelected ? 'text-white' : 'text-text'}`}>{sub.title || `Leçon ${sIdx + 1}`}</p>{sub.quiz && <div className="flex items-center gap-1 mt-0.5"><div className="w-1.5 h-1.5 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]" /><span className="text-[9px] font-black uppercase opacity-60">Quiz actif</span></div>}</div>
                                                    <button onClick={(e) => { e.stopPropagation(); deleteSubSection(section.id, sub.id); }} className={`opacity-0 group-hover/sub:opacity-100 p-1.5 rounded-lg transition-all ${isSelected ? 'text-white/80 hover:bg-white/20 hover:text-white' : 'text-text-muted hover:bg-error/10 hover:text-error'}`}><Trash2 size={14} /></button>
                                                </div>
                                            );
                                        })}
                                        <button onClick={() => addSubSection(section.id)} className="w-full mt-2 py-3 text-xs font-bold text-text-muted hover:text-primary border-2 border-dashed border-glass-border hover:border-primary/30 rounded-xl transition-all flex items-center justify-center gap-2 bg-surface/50 hover:bg-primary/5"><Plus size={14} /> Ajouter une leçon</button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Examen Final Section */}
                    <div className="mt-8 p-6 border-t border-glass-border">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="text-lg font-black flex items-center gap-3 text-primary"><HelpCircle size={22} /> Examen Final</h4>
                            <div className="flex items-center gap-3">
                                <label className="flex items-center cursor-pointer">
                                    <div className="relative">
                                        <input
                                            type="checkbox"
                                            className="sr-only"
                                            checked={course.examEnabled !== false}
                                            onChange={(e) => setCourse({ ...course, examEnabled: e.target.checked })}
                                        />
                                        <div className={`block w-10 h-6 rounded-full transition-colors ${course.examEnabled !== false ? 'bg-primary' : 'bg-surface-hover border border-glass-border'}`}></div>
                                        <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${course.examEnabled !== false ? 'transform translate-x-4' : ''}`}></div>
                                    </div>
                                    <div className="ml-3 text-xs font-bold text-text-muted hidden sm:block">
                                        {course.examEnabled !== false ? 'Activé' : 'Désactivé'}
                                    </div>
                                </label>
                                <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted px-2 py-1 bg-surface-hover rounded-lg">Optionnel</span>
                            </div>
                        </div>

                        <div
                            onClick={() => {
                                setSelectedSubSectionId(null);
                                setShowFinalExamEditor(true);
                            }}
                            className={`group p-6 rounded-3xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center text-center gap-4 ${course.finalExam
                                ? 'bg-primary/5 border-primary/30 hover:border-primary/50 text-text'
                                : 'bg-surface border-glass-border hover:border-primary/30 text-text-muted'}`}
                        >
                            <div className={`p-4 rounded-2xl transition-all ${course.finalExam ? 'bg-primary text-white scale-110 shadow-lg' : 'bg-surface-hover group-hover:bg-primary/10 group-hover:text-primary'}`}>
                                <Sparkles size={32} />
                            </div>
                            <div>
                                <h5 className="font-black text-base">{course.finalExam ? 'Éditer l\'examen final' : 'Configurer l\'examen final'}</h5>
                                <p className="text-xs opacity-70 mt-1 max-w-xs">{course.finalExam
                                    ? `Examen configuré avec ${course.finalExam.settings?.totalQuestions || 0} questions`
                                    : 'Créez une évaluation globale pour valider l\'ensemble du cours.'}
                                </p>
                            </div>

                            {course.finalExam && (
                                <div className="flex gap-4 mt-2">
                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-[10px] font-black uppercase tracking-wider">
                                        <CheckCircle2 size={14} /> Réussite: {course.finalExam.settings?.passingScore ?? 70}%
                                        <Clock size={14} className="ml-2" /> {course.finalExam.settings?.timeLimit ?? 60} min
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            openConfirmModal(
                                                'Supprimer l\'examen final ?',
                                                'Cette action est irréversible et supprimera toutes les questions de l\'examen.',
                                                async () => {
                                                    if (id && id !== 'new') {
                                                        try {
                                                            const token = localStorage.getItem('token');
                                                            // Use progress reset endpoint which is better for this
                                                            await fetch(`${API_APPRENANT}/progress/${id}/quiz/final_exam`, {
                                                                method: 'DELETE',
                                                                headers: token ? { 'Authorization': `Bearer ${token}` } : {}
                                                            });
                                                            // Also keep the backup endpoint call just in case
                                                            await fetch(`${API_APPRENANT}/courses/${id}/exam-results/final_exam`, {
                                                                method: 'DELETE',
                                                                headers: token ? { 'Authorization': `Bearer ${token}` } : {}
                                                            });
                                                        } catch (err) {
                                                            console.error("Failed to delete exam results:", err);
                                                        }
                                                    }
                                                    setCourse({ ...course, finalExam: null });
                                                },
                                                'danger'
                                            );
                                        }}
                                        className="p-1.5 text-text-muted hover:text-error transition-all"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="w-full bg-surface rounded-3xl border border-glass-border shadow-xl flex flex-col min-h-[500px] animate-fade-in" style={{ animationDelay: '0.2s' }}>
                    {selectedData ? (
                        <>
                            <div className="p-6 md:p-8 border-b border-glass-border bg-surface/50 rounded-t-3xl">
                                <div className="flex items-start gap-4">
                                    <div className="mt-1 p-2.5 bg-primary/10 rounded-xl text-primary"><Type size={28} /></div>
                                    <div className="flex-1">
                                        <label className="text-xs font-bold text-text-muted uppercase tracking-widest mb-1.5 block">Titre de la leçon</label>
                                        <input value={selectedData.subSection.title} onChange={(e) => updateSubSection(selectedData.section.id, selectedData.subSection.id, { title: e.target.value })} className="w-full bg-transparent text-2xl font-bold text-text focus:outline-none placeholder-text-muted/30" placeholder="Titre de la leçon..." />
                                    </div>
                                </div>
                            </div>
                            <div className="flex-1 p-6 md:p-8 space-y-8">
                                <div className="card !rounded-2xl overflow-hidden border border-glass-border bg-surface-hover/30">
                                    <div className="p-4 border-b border-glass-border bg-surface/50 flex justify-between items-center group/vidheader">
                                        <div className="flex items-center gap-2 text-base font-bold text-text"><div className="p-2 bg-red-500/10 text-red-500 rounded-lg"><Video size={20} /></div>Ressources Vidéo</div>
                                        <button
                                            onClick={() => {
                                                setCourse(prev => ({
                                                    ...prev,
                                                    sections: prev.sections.map(s => {
                                                        if (s.id !== selectedData.section.id) return s;
                                                        return {
                                                            ...s,
                                                            subSections: s.subSections.map(ss => {
                                                                if (ss.id !== selectedData.subSection.id) return ss;
                                                                const current = ss.videoUrls?.length ? ss.videoUrls : (ss.videoUrl ? [ss.videoUrl] : []);
                                                                return { ...ss, videoUrls: [...current, ''] };
                                                            })
                                                        };
                                                    })
                                                }));
                                            }}
                                            className="btn-primary !py-2 !px-4 !text-xs flex items-center gap-2 transition-all"
                                        ><Plus size={14} /> Ajouter une vidéo</button>
                                    </div>
                                    <div className="p-6 space-y-6">
                                        {(selectedData.subSection.videoUrls?.length ? selectedData.subSection.videoUrls : (selectedData.subSection.videoUrl ? [selectedData.subSection.videoUrl] : [])).map((url, vIdx) => {
                                            const embedUrl = getYouTubeEmbedUrl(url);
                                            return (
                                                <div key={vIdx} className="space-y-4 animate-fade-in">
                                                    <div className="flex gap-3">
                                                        <div className="relative flex-1">
                                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted"><Youtube size={18} /></div>
                                                            <input
                                                                type="text"
                                                                value={url}
                                                                onChange={(e) => {
                                                                    const newVal = e.target.value;
                                                                    setCourse(prev => ({
                                                                        ...prev,
                                                                        sections: prev.sections.map(s => {
                                                                            if (s.id !== selectedData.section.id) return s;
                                                                            return {
                                                                                ...s,
                                                                                subSections: s.subSections.map(ss => {
                                                                                    if (ss.id !== selectedData.subSection.id) return ss;
                                                                                    const currentUrls = ss.videoUrls?.length ? ss.videoUrls : (ss.videoUrl ? [ss.videoUrl] : []);
                                                                                    const newUrls = [...currentUrls];
                                                                                    newUrls[vIdx] = newVal;
                                                                                    return { ...ss, videoUrls: newUrls };
                                                                                })
                                                                            };
                                                                        })
                                                                    }));
                                                                }}
                                                                className="w-full input !pl-12 !py-3 text-base shadow-inner bg-surface-hover/50 focus:bg-surface-hover"
                                                                placeholder="Collez le lien YouTube ici..."
                                                            />
                                                        </div>
                                                        <button
                                                            onClick={() => {
                                                                setCourse(prev => ({
                                                                    ...prev,
                                                                    sections: prev.sections.map(s => {
                                                                        if (s.id !== selectedData.section.id) return s;
                                                                        return {
                                                                            ...s,
                                                                            subSections: s.subSections.map(ss => {
                                                                                if (ss.id !== selectedData.subSection.id) return ss;
                                                                                const current = ss.videoUrls?.length ? ss.videoUrls : (ss.videoUrl ? [ss.videoUrl] : []);
                                                                                return { ...ss, videoUrls: current.filter((_, i) => i !== vIdx) };
                                                                            })
                                                                        };
                                                                    })
                                                                }));
                                                            }}
                                                            className="p-3 text-text-muted hover:text-error hover:bg-error/10 rounded-xl transition-all border border-transparent hover:border-error/20"
                                                        ><X size={20} /></button>
                                                    </div>
                                                    {embedUrl ? (
                                                        <div className="relative aspect-video rounded-2xl overflow-hidden border border-glass-border shadow-2xl animate-fade-in max-w-2xl mx-auto">
                                                            <iframe src={embedUrl} className="absolute inset-0 w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen title="YouTube Preview" />
                                                        </div>
                                                    ) : url ? (
                                                        <div className="text-center text-xs text-error p-2 bg-error/5 rounded-lg">Lien YouTube invalide</div>
                                                    ) : null}
                                                </div>
                                            );
                                        })}
                                        {(!selectedData.subSection.videoUrls?.length && !selectedData.subSection.videoUrl) && <div className="flex flex-col items-center justify-center py-12 text-text-muted border-2 border-dashed border-glass-border rounded-2xl opacity-40"><div className="mb-4 p-4 bg-white/5 rounded-full"><Video size={32} /></div><p className="font-medium">Aucune vidéo associée à cette leçon</p><p className="text-xs mt-1">Ajoutez un lien pour illustrer votre cours</p></div>}
                                    </div>
                                </div>
                                <div className="card !rounded-2xl overflow-hidden border border-glass-border">
                                    <div className="p-4 border-b border-glass-border bg-surface/50 flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2 text-base font-bold text-text">
                                            <div className="p-2 bg-primary/10 text-primary rounded-lg"><FileText size={20} /></div>
                                            Contenu de la leçon
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setShowAiContentModal(true)}
                                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-500 to-primary text-white rounded-xl text-xs font-black shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                                            title="Générer le contenu avec l'IA"
                                        >
                                            <Sparkles size={15} strokeWidth={2.5} />
                                            Générer avec l'IA
                                        </button>
                                    </div>
                                    <div className="p-6 min-h-[400px]">
                                        <MockQuill
                                            key={selectedData.subSection.id}
                                            value={selectedData.subSection.content}
                                            onChange={(c) => updateSubSection(selectedData.section.id, selectedData.subSection.id, { content: c })}
                                            className="h-full min-h-[350px]"
                                            placeholder="Rédigez le contenu détaillé de votre leçon..."
                                        />
                                    </div>
                                    </div>
                                </div>

                                {/* AI Content Generation Modal — rendered via portal to cover full viewport */}
                                {showAiContentModal && createPortal(
                                    <div
                                        className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in"
                                        onClick={() => { if (!aiContentLoading) { setShowAiContentModal(false); setAiContentPrompt(''); setAiContentError(''); } }}
                                    >
                                        <div
                                            className="relative w-full max-w-lg bg-surface border border-glass-border rounded-3xl shadow-2xl overflow-hidden animate-fade-in"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            {/* Decorative glow blobs */}
                                            <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full pointer-events-none opacity-50" style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 70%)' }} />
                                            <div className="absolute -bottom-12 -left-12 w-40 h-40 rounded-full pointer-events-none opacity-50" style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)' }} />

                                            <div className="relative p-8 space-y-5">
                                                {/* Header */}
                                                <div className="flex items-start justify-between">
                                                    <div className="flex items-center gap-4">
                                                        <div className="p-3 rounded-2xl text-white flex-shrink-0" style={{ background: 'linear-gradient(135deg, #7c3aed, #6366f1)', boxShadow: '0 8px 20px rgba(99,102,241,0.35)' }}>
                                                            <Sparkles size={22} strokeWidth={2} />
                                                        </div>
                                                        <div>
                                                            <h3 className="text-xl font-black text-text tracking-tight">Mistral-Nemo AI</h3>
                                                            <p className="text-xs font-bold text-primary uppercase tracking-widest mt-0.5">Génération de contenu</p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => { if (!aiContentLoading) { setShowAiContentModal(false); setAiContentPrompt(''); setAiContentError(''); } }}
                                                        className="p-2 rounded-xl text-text-muted hover:bg-surface-hover hover:text-text transition-all border border-glass-border shadow-sm"
                                                    >
                                                        <X size={16} strokeWidth={2.5} />
                                                    </button>
                                                </div>

                                                {/* Textarea */}
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-text-muted uppercase tracking-widest block px-1">
                                                        Décrivez votre leçon
                                                    </label>
                                                    <textarea
                                                        autoFocus
                                                        value={aiContentPrompt}
                                                        onChange={(e) => setAiContentPrompt(e.target.value)}
                                                        className="w-full bg-background border border-glass-border focus:border-primary/50 focus:ring-4 focus:ring-primary/5 rounded-2xl p-4 text-sm font-medium text-text placeholder-text-muted/40 focus:outline-none transition-all resize-none min-h-[140px] cursor-text"
                                                        placeholder="Ex: Introduction aux concepts fondamentaux de Java avec des exemples pratiques..."
                                                        disabled={aiContentLoading}
                                                    />
                                                    <div className="flex justify-between items-center px-1">
                                                        <p className="text-[10px] text-text-muted font-bold opacity-60">Ctrl + Entrée pour générer</p>
                                                    </div>
                                                </div>

                                                {/* Error State */}
                                                {aiContentError && (
                                                    <div className="flex items-center gap-3 px-4 py-3 bg-error/10 border border-error/20 rounded-xl animate-shake">
                                                        <div className="text-error"><AlertCircle size={14} /></div>
                                                        <span className="text-xs font-bold text-error leading-tight">{aiContentError}</span>
                                                    </div>
                                                )}

                                                {/* Loading bar */}
                                                {aiContentLoading && (
                                                    <div className="flex items-center gap-3 px-4 py-3 bg-primary/5 border border-primary/10 rounded-xl">
                                                        <div className="w-4 h-4 rounded-full border-2 border-primary/30 border-t-primary animate-spin flex-shrink-0" />
                                                        <span className="text-xs font-bold text-primary animate-pulse">Mistral-Nemo analyse votre demande...</span>
                                                    </div>
                                                )}

                                                {/* Actions */}
                                                <div className="flex gap-3 pt-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => { setShowAiContentModal(false); setAiContentPrompt(''); setAiContentError(''); }}
                                                        disabled={aiContentLoading}
                                                        className="flex-1 py-3.5 rounded-2xl border border-glass-border text-text-muted font-bold text-sm hover:bg-surface-hover hover:text-text transition-all disabled:opacity-40"
                                                    >
                                                        Annuler
                                                    </button>
                                                    <button
                                                        type="button"
                                                        disabled={aiContentLoading || !aiContentPrompt.trim()}
                                                        onClick={async () => {
                                                            if (!aiContentPrompt.trim()) return;
                                                            setAiContentLoading(true);
                                                            setAiContentError('');
                                                            try {
                                                                const res = await fetch(`${API_FORMATEUR}/ai/generate-content`, {
                                                                    method: 'POST',
                                                                    headers: {
                                                                        'Content-Type': 'application/json',
                                                                        ...(localStorage.getItem('token') ? { 'Authorization': `Bearer ${localStorage.getItem('token')}` } : {})
                                                                    },
                                                                    body: JSON.stringify({ prompt: aiContentPrompt })
                                                                });
                                                                if (!res.ok) throw new Error(`Erreur ${res.status}`);
                                                                const html = await res.text();
                                                                const currentContent = selectedData?.subSection?.content || '';
                                                                updateSubSection(selectedData!.section!.id, selectedData!.subSection!.id, { content: currentContent ? currentContent + html : html });
                                                                setShowAiContentModal(false);
                                                                setAiContentPrompt('');
                                                            } catch (err: any) {
                                                                setAiContentError("Impossible de contacter l'IA : " + (err.message || "Erreur inconnue"));
                                                            } finally {
                                                                setAiContentLoading(false);
                                                            }
                                                        }}
                                                        className="flex-[2] py-3.5 rounded-2xl text-white font-black text-sm flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                                                        style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #6366f1 60%, #818cf8 100%)', boxShadow: aiContentLoading || !aiContentPrompt.trim() ? 'none' : '0 12px 24px rgba(99,102,241,0.3)' }}
                                                    >
                                                        {aiContentLoading
                                                            ? <><div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Génération...</>
                                                            : <><Sparkles size={16} strokeWidth={2.5} /> Générer le contenu</>
                                                        }
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>,
                                    document.body
                                )}

                            <div className="p-6 md:p-8 border-t border-glass-border bg-surface/90 backdrop-blur-xl flex flex-col gap-6 shadow-2xl rounded-b-3xl">
                                <div className="flex flex-wrap items-center justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <button 
                                            onClick={() => setShowQuizEditor(true)} 
                                            className={`flex items-center gap-3 px-6 py-3 rounded-2xl text-base font-bold transition-all shadow-lg ${selectedData.subSection.quiz ? 'bg-green-500 text-white shadow-green-500/20' : 'bg-primary/10 text-primary hover:bg-primary hover:text-white shadow-primary/10'}`}
                                        >
                                            <HelpCircle size={20} />{selectedData.subSection.quiz ? 'Modifier le Quiz' : 'Ajouter un Quiz'}
                                        </button>

                                        <button 
                                            onClick={() => updateSubSection(selectedData.section!.id, selectedData.subSection!.id, { 
                                                isTp: !selectedData.subSection!.isTp,
                                                tpPrompt: selectedData.subSection!.tpPrompt || ''
                                            })}
                                            className={`flex items-center gap-3 px-6 py-3 rounded-2xl text-base font-bold transition-all shadow-lg ${selectedData.subSection!.isTp ? 'bg-cyan-500 text-white shadow-cyan-500/20' : 'bg-cyan-500/10 text-cyan-600 hover:bg-cyan-500 hover:text-white shadow-cyan-500/10'}`}
                                        >
                                            <FileText size={20} />{selectedData.subSection!.isTp ? 'Mode TP Activé' : 'Activer Mode TP'}
                                        </button>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {selectedData.subSection.quiz && (
                                            <button
                                                onClick={() => openConfirmModal('Supprimer le quiz ?', 'Cette action est irréversible et supprimera toutes les questions.', () => updateSubSection(selectedData.section.id, selectedData.subSection.id, { quiz: undefined }))}
                                                className="text-sm font-bold text-error hover:bg-error/10 px-4 py-2 rounded-xl transition-all"
                                            >
                                                Supprimer le quiz
                                            </button>
                                        )}
                                        {selectedData.subSection.isTp && (
                                            <button
                                                onClick={() => updateSubSection(selectedData.section!.id, selectedData.subSection!.id, { isTp: false, tpPrompt: '' })}
                                                className="text-sm font-bold text-error hover:bg-error/10 px-4 py-2 rounded-xl transition-all"
                                            >
                                                Désactiver TP
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {selectedData.subSection.isTp && (
                                    <div className="space-y-3 animate-fade-in">
                                        <label className="text-xs font-black uppercase tracking-widest text-text-muted px-1">Consigne du Travail Pratique</label>
                                        <textarea 
                                            value={selectedData.subSection.tpPrompt || ''} 
                                            onChange={(e) => updateSubSection(selectedData.section.id, selectedData.subSection.id, { tpPrompt: e.target.value })}
                                            className="w-full bg-background border border-glass-border rounded-2xl p-4 text-sm font-bold focus:outline-none focus:border-cyan-500 transition-all min-h-[80px]"
                                            placeholder="Ex: Veuillez soumettre le lien GitHub de votre projet final sur les API REST..."
                                        />
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-text-muted opacity-50 py-20"><div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4"><Layout size={32} /></div><p className="text-lg font-medium">Sélectionnez une leçon</p><p className="text-sm">ou créez une nouvelle section pour commencer</p></div>
                    )}
                </div>
            </div>
        );
    };

    const renderLearnersTab = () => {
        const filtered = enrolledLearners.filter(l =>
            l.nom.toLowerCase().includes(learnersSearchTerm.toLowerCase()) ||
            l.prenom.toLowerCase().includes(learnersSearchTerm.toLowerCase()) ||
            l.email.toLowerCase().includes(learnersSearchTerm.toLowerCase())
        );

        const totalPages = Math.ceil(filtered.length / itemsPerPage);
        const currentItems = filtered.slice(
            (learnersCurrentPage - 1) * itemsPerPage,
            learnersCurrentPage * itemsPerPage
        );

        const getPages = () => {
            const pages = [];
            const showMax = 5;
            if (totalPages <= showMax) {
                for (let i = 1; i <= totalPages; i++) pages.push(i);
            } else {
                pages.push(1);
                if (learnersCurrentPage > 3) pages.push('...');
                const start = Math.max(2, learnersCurrentPage - 1);
                const end = Math.min(totalPages - 1, learnersCurrentPage + 1);
                for (let i = start; i <= end; i++) {
                    if (!pages.includes(i)) pages.push(i);
                }
                if (learnersCurrentPage < totalPages - 2) pages.push('...');
                pages.push(totalPages);
            }
            return pages;
        };

        if (detailedLearnerId) {
            const learner = enrolledLearners.find(l => l.id === detailedLearnerId);
            if (!learner) return null;

            return (
                <div className="max-w-6xl mx-auto space-y-8 animate-fade-in pb-20 pt-4 px-4 sm:px-0">
                    {/* Back Link */}
                    <button
                        onClick={() => { setDetailedLearnerId(null); setShowQuizListInDetails(false); }}
                        className="flex items-center gap-2 text-text-muted hover:text-primary transition-colors font-bold text-sm mb-4 group"
                    >
                        <div className="w-8 h-8 rounded-full bg-background border border-glass-border flex items-center justify-center group-hover:border-primary/30 group-hover:bg-primary/5 transition-all">
                            <ChevronLeft size={18} />
                        </div>
                        Retour à la liste
                    </button>

                    {/* Learner Profile Integrated Header */}
                    <div className="bg-surface rounded-[2rem] p-6 sm:p-8 border border-glass-border shadow-xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-bl-[80px] -mr-16 -mt-16 group-hover:bg-primary/10 transition-all duration-700"></div>
                        <div className="relative flex flex-col md:flex-row items-center gap-6 md:gap-8">
                            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary text-2xl sm:text-3xl font-black shadow-inner border border-primary/10 shrink-0">
                                {learner.nom[0]}{learner.prenom[0]}
                            </div>
                            <div className="flex-1 text-center md:text-left space-y-3">
                                <div>
                                    <h2 className="text-2xl sm:text-3xl font-black text-text tracking-tight">{learner.prenom} {learner.nom}</h2>
                                    <p className="text-text-muted font-bold tracking-wide text-xs mt-0.5">{learner.email}</p>
                                </div>
                                <div className="flex flex-wrap justify-center md:justify-start gap-3">
                                    <div className="px-4 py-2 rounded-2xl bg-background/50 border border-glass-border backdrop-blur-sm">
                                        <div className="text-[9px] uppercase font-black text-text-muted mb-0.5 tracking-widest">Moyenne</div>
                                        <div className="text-xl font-black text-primary">{learner.totalQuizScore}%</div>
                                    </div>
                                    <div className="px-4 py-2 rounded-2xl bg-background/50 border border-glass-border backdrop-blur-sm">
                                        <div className="text-[9px] uppercase font-black text-text-muted mb-0.5 tracking-widest">Leçons</div>
                                        <div className="text-xl font-black text-text">{learner.sectionsCompleted} <span className="text-xs opacity-30">/ {learner.totalSections}</span></div>
                                    </div>
                                    <div className="px-4 py-2 rounded-2xl bg-background/50 border border-glass-border backdrop-blur-sm">
                                        <div className="text-[9px] uppercase font-black text-text-muted mb-0.5 tracking-widest">Quiz</div>
                                        <div className="text-xl font-black text-text">{learner.quizzesSubmitted} <span className="text-xs opacity-30">/ {learner.totalQuizzes}</span></div>
                                    </div>
                                    <div className="px-4 py-2 rounded-2xl bg-background/50 border border-glass-border backdrop-blur-sm">
                                        <div className="text-[9px] uppercase font-black text-text-muted mb-0.5 tracking-widest">Examen</div>
                                        {learner.cheatingReason ? (() => {
                                            const cheat = parseCheatingReason(learner.cheatingReason!);
                                            const textColor = cheat.color === 'orange' ? 'text-orange-500' : 'text-red-500';
                                            return (
                                                <div className="flex flex-col gap-1 mt-1">
                                                    <div className={`text-xl font-black ${textColor}`}>{learner.finalExamNote ?? 0}/20</div>
                                                    <div title={learner.cheatingReason} className="flex items-center gap-1 cursor-help">
                                                        <span style={{fontSize: '11px'}}>{cheat.icon}</span>
                                                        <span className={`text-[9px] font-black ${textColor} uppercase leading-tight`}>{cheat.label}</span>
                                                    </div>
                                                </div>
                                            );
                                        })() : (
                                            <div className={`text-xl font-black ${learner.finalExamNote !== null ? 'text-green-500' : 'text-text-muted opacity-30'}`}>
                                                {learner.finalExamNote !== null ? `${learner.finalExamNote}/20` : '—'}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col gap-2 w-full md:w-auto">
                                {!showQuizListInDetails ? (
                                    <button
                                        onClick={() => setShowQuizListInDetails(true)}
                                        className="px-6 py-4 bg-primary text-white rounded-xl font-black shadow-lg shadow-primary/30 hover:scale-[1.02] hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group/btn text-sm"
                                    >
                                        <CheckSquare size={18} className="group-hover/btn:scale-110 transition-transform" />
                                        Vérifier Évaluations
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => setShowQuizListInDetails(false)}
                                        className="px-6 py-4 bg-surface border-2 border-primary/20 text-primary rounded-xl font-black hover:bg-primary/5 transition-all flex items-center justify-center gap-2 text-sm"
                                    >
                                        Masquer la vérification
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Quizzes & TPs List & Details Section */}
                    {showQuizListInDetails && (
                        <div className="animate-fade-in lg:mt-6 space-y-4">
                            {/* Detailed View Tabs */}
                            <div className="flex bg-surface/50 p-1.5 rounded-2xl border border-glass-border w-fit">
                                <button
                                    onClick={() => setDetailedTab('quizzes')}
                                    className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${detailedTab === 'quizzes' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-text-muted hover:text-primary hover:bg-primary/5'}`}
                                >
                                    <GraduationCap size={16} /> parcours Quiz
                                </button>
                                <button
                                    onClick={() => setDetailedTab('tps')}
                                    className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${detailedTab === 'tps' ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/20' : 'text-text-muted hover:text-cyan-500 hover:bg-cyan-500/5'}`}
                                >
                                    <FileText size={16} /> Travaux Pratiques
                                </button>
                            </div>

                            <div className="bg-surface rounded-[1.5rem] border border-glass-border shadow-xl overflow-hidden flex flex-col lg:flex-row min-h-[450px] max-h-[750px]">
                                {detailedTab === 'quizzes' ? (
                                    <>
                                        {/* Left Sidebar: Quiz List */}
                                        <div className="lg:w-72 border-r border-glass-border bg-background/30 backdrop-blur-md flex flex-col">
                                            <div className="p-5 border-b border-glass-border bg-surface/50">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <div className="p-2 bg-primary/10 rounded-xl">
                                                        <GraduationCap size={16} className="text-primary" />
                                                    </div>
                                                    <h3 className="font-black text-text tracking-tight uppercase text-[10px]">Parcours Quiz</h3>
                                                </div>
                                                <p className="text-[10px] text-text-muted font-bold tracking-widest uppercase opacity-60">Tentatives ({learner.submissions?.length || 0})</p>
                                            </div>

                                            <div className="flex-1 overflow-y-auto p-3 space-y-1.5 custom-scrollbar">
                                                {learner.submissions?.map((sub: any, sIdx: number) => {
                                                    const isActive = selectedSubmissionIndex === sIdx;
                                                    return (
                                                        <button
                                                            key={sIdx}
                                                            onClick={() => setSelectedSubmissionIndex(sIdx)}
                                                            className={`w-full text-left px-4 py-3.5 rounded-2xl transition-all duration-300 group relative ${isActive
                                                                ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02]'
                                                                : 'hover:bg-primary/5 text-text border border-transparent hover:border-primary/10'
                                                                }`}
                                                        >
                                                            <div className="flex flex-col gap-0.5">
                                                                <span className={`font-black text-[11px] tracking-tight truncate ${isActive ? 'text-white' : 'text-text'}`}>
                                                                    {sub.quizTitle}
                                                                </span>
                                                                <div className="flex items-center justify-between mt-1">
                                                                    <span className={`text-[9px] font-bold ${isActive ? 'text-white/70' : 'text-text-muted'}`}>
                                                                        {sub.submittedAt.split(',')[0]}
                                                                    </span>
                                                                    <div className="flex items-center gap-1.5">
                                                                        {sub.cheatingReason && (
                                                                            <div title={sub.cheatingReason} className={`p-1 rounded-md ${isActive ? 'bg-white/20 text-white' : 'bg-red-500/10 text-red-500'}`}>
                                                                                <AlertTriangle size={10} />
                                                                            </div>
                                                                        )}
                                                                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${isActive
                                                                            ? 'bg-white/20 text-white'
                                                                            : 'bg-primary/10 text-primary'
                                                                            }`}>
                                                                            {(sub.totalScore ?? 0)}%
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* Right Content: Quiz Details */}
                                        <div className="flex-1 bg-surface flex flex-col overflow-hidden">
                                            {selectedSubmissionIndex !== null && learner.submissions?.[selectedSubmissionIndex] ? (() => {
                                                const sub = learner.submissions[selectedSubmissionIndex];
                                                const allQuestions = [
                                                    ...(course.finalExam?.questions || []),
                                                    ...course.sections.flatMap((s: any) => s.subSections.flatMap((ss: any) => ss.quiz?.questions || []))
                                                ];

                                                return (
                                                    <>
                                                        {/* Details Header */}
                                                        <div className="p-6 border-b border-glass-border bg-gradient-to-r from-primary/5 to-transparent flex flex-wrap items-center justify-between gap-4">
                                                            <div>
                                                                <div className="flex items-center gap-2 mb-0.5">
                                                                    <div className="px-2 py-0.5 rounded-full bg-green-500/10 text-green-600 text-[9px] font-black uppercase tracking-wider">
                                                                        Meilleure Tentative
                                                                    </div>
                                                                    <div className="text-[10px] text-text-muted font-bold">{sub.submittedAt}</div>
                                                                </div>
                                                                <h4 className="text-xl font-black text-text tracking-tight uppercase">{sub.quizTitle}</h4>
                                                            </div>
                                                            <div className="flex items-center gap-4">
                                                                <div className="text-center bg-background/40 backdrop-blur-sm border border-glass-border px-4 py-2 rounded-2xl">
                                                                    <div className="text-[9px] font-black text-text-muted uppercase tracking-widest">Score Final</div>
                                                                    <div className={`text-3xl font-black ${(sub.totalScore ?? 0) >= 50 ? 'text-green-500' : 'text-error'}`}>{sub.totalScore ?? 0}%</div>
                                                                </div>
                                                                <div className={`p-4 rounded-2xl ${(sub.totalScore ?? 0) >= 50 ? 'bg-green-500/10 text-green-500' : 'bg-error/10 text-error'} shadow-inner`}>
                                                                    {(sub.totalScore ?? 0) >= 50 ? <CheckCircle2 size={32} /> : <AlertTriangle size={32} />}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Cheating Reason Banner */}
                                                        {sub.cheatingReason && (
                                                            <div className="mx-6 mt-4 p-4 rounded-xl border border-error/30 bg-error/10 flex items-start gap-4 animate-fade-in shadow-inner">
                                                                <div className="p-2 bg-error rounded-lg text-white">
                                                                    <AlertTriangle size={20} />
                                                                </div>
                                                                <div className="flex-1">
                                                                    <h5 className="font-bold text-error uppercase tracking-widest text-xs mb-1">Motif de l'échec automatique</h5>
                                                                    <p className="text-sm font-medium text-text">{sub.cheatingReason}</p>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Questions List */}
                                                        <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar bg-background/5">
                                                            {sub.answers?.map((ans: any, aIdx: number) => {
                                                                const question = allQuestions.find(q => String(q.id) === String(ans.questionId));
                                                                const isOpen = ans.type === 'OPEN';

                                                                return (
                                                                    <div key={aIdx} className="bg-surface rounded-2xl p-4 border border-glass-border shadow-sm group/q hover:border-primary/20 transition-all">
                                                                        <div className="flex items-start gap-4">
                                                                            <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center text-[10px] font-black text-primary shrink-0 mt-0.5">
                                                                                {aIdx + 1}
                                                                            </div>

                                                                            <div className="flex-1 space-y-3">
                                                                                <h5 className="text-[13px] font-bold text-text leading-snug tracking-tight">
                                                                                    {question?.text ?? <span className="text-text-muted italic opacity-50">Référence question #{ans.questionId} manquante</span>}
                                                                                </h5>

                                                                                <div className="space-y-1.5">
                                                                                    {isOpen ? (
                                                                                        <div className="space-y-2">
                                                                                            <div className="p-3 bg-primary/5 rounded-xl text-xs text-text leading-relaxed font-medium italic border border-primary/10">
                                                                                                {ans.learnerAnswer || "Pas de réponse fournie."}
                                                                                            </div>
                                                                                            <div className="flex items-center gap-2">
                                                                                                <button
                                                                                                    onClick={() => handleGradeOpenQuestion(learner.id, selectedSubmissionIndex!, aIdx, true)}
                                                                                                    className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all flex items-center gap-1.5 border ${ans.isCorrect === true
                                                                                                        ? 'bg-green-500 text-white border-green-600 shadow-md shadow-green-500/20'
                                                                                                        : 'bg-surface border-glass-border text-green-600 hover:bg-green-500/5'
                                                                                                        }`}
                                                                                                >
                                                                                                    <Check size={12} className={ans.isCorrect === true ? "stroke-[3px]" : ""} />
                                                                                                    {ans.isCorrect === true ? 'Validé' : 'Valider'}
                                                                                                </button>
                                                                                                <button
                                                                                                    onClick={() => handleGradeOpenQuestion(learner.id, selectedSubmissionIndex!, aIdx, false)}
                                                                                                    className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all flex items-center gap-1.5 border ${ans.isCorrect === false
                                                                                                        ? 'bg-red-500 text-white border-red-600 shadow-md shadow-red-500/20'
                                                                                                        : 'bg-surface border-glass-border text-red-600 hover:bg-red-500/5'
                                                                                                        }`}
                                                                                                >
                                                                                                    <X size={12} className={ans.isCorrect === false ? "stroke-[3px]" : ""} />
                                                                                                    {ans.isCorrect === false ? 'Refusé' : 'Invalider'}
                                                                                                </button>
                                                                                            </div>
                                                                                        </div>
                                                                                    ) : (
                                                                                        <div className="flex flex-wrap gap-2">
                                                                                            {question?.options?.map((opt: string, oIdx: number) => {
                                                                                                const isSelected = ans.type === 'QCU'
                                                                                                    ? Number(ans.learnerAnswer) === oIdx
                                                                                                    : (Array.isArray(ans.learnerAnswer) && ans.learnerAnswer.map(Number).includes(oIdx));
                                                                                                const isCorrectOpt = question.correctAnswers?.includes(oIdx);

                                                                                                if (!isSelected && !isCorrectOpt) return null;

                                                                                                return (
                                                                                                    <div
                                                                                                        key={oIdx}
                                                                                                        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[11px] border-2 transition-all ${isSelected && isCorrectOpt
                                                                                                            ? 'bg-green-500/10 border-green-500/30 text-green-700'
                                                                                                            : isSelected && !isCorrectOpt
                                                                                                                ? 'bg-red-500/10 border-red-500/30 text-red-600'
                                                                                                                : 'bg-green-500/5 border-green-500/20 text-green-600'
                                                                                                            }`}
                                                                                                    >
                                                                                                        {isSelected && isCorrectOpt && <Check size={12} className="stroke-[3px]" />}
                                                                                                        {isSelected && !isCorrectOpt && <X size={12} className="stroke-[3px]" />}
                                                                                                        {!isSelected && isCorrectOpt && <CheckCircle2 size={12} />}
                                                                                                        <span className="font-bold">{opt}</span>
                                                                                                        <span className="opacity-40 font-black uppercase text-[8px] ml-1">
                                                                                                            {isSelected ? 'Choisi' : 'Vraie'}
                                                                                                        </span>
                                                                                                    </div>
                                                                                                );
                                                                                            })}
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </>
                                                );
                                            })() : (
                                                <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-4">
                                                    <div className="w-20 h-20 bg-primary/5 rounded-[2rem] flex items-center justify-center text-primary/20 animate-pulse">
                                                        <GraduationCap size={40} />
                                                    </div>
                                                    <div className="max-w-xs">
                                                        <h4 className="text-lg font-black text-text tracking-tight">Analyse des Évaluations</h4>
                                                        <p className="text-xs text-text-muted font-medium">Sélectionnez une tentative dans la liste de gauche pour consulter le rapport détaillé.</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </>
                                ) : (
                                    /* TP Submissions View */
                                    <div className="flex-1 flex flex-col bg-background/30">
                                        <div className="p-6 border-b border-glass-border bg-gradient-to-r from-cyan-500/5 to-transparent flex items-center justify-between">
                                            <div>
                                                <h4 className="text-xl font-black text-text tracking-tight uppercase">Travaux Pratiques Soumis</h4>
                                                <p className="text-xs text-text-muted font-bold uppercase tracking-widest mt-0.5">Documents et liens de l'apprenant ({learner.tpSubmissions?.length || 0})</p>
                                            </div>
                                            <div className="p-3 bg-cyan-500/10 text-cyan-500 rounded-2xl shadow-inner">
                                                <FileText size={24} />
                                            </div>
                                        </div>
                                        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-4 custom-scrollbar">
                                            {learner.tpSubmissions && learner.tpSubmissions.length > 0 ? (
                                                learner.tpSubmissions.map((tp: any, tIdx: number) => (
                                                    <div key={tIdx} className="bg-surface border border-glass-border p-6 rounded-[2rem] shadow-sm hover:scale-[1.01] transition-all group animate-fade-in" style={{ animationDelay: `${tIdx * 0.1}s` }}>
                                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                                                            <div className="flex items-center gap-5">
                                                                <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center shrink-0 shadow-inner group-hover:bg-cyan-500 group-hover:text-white transition-colors duration-500">
                                                                    <FileText size={28} />
                                                                </div>
                                                                <div>
                                                                    <div className="text-[10px] font-black text-cyan-600/60 uppercase tracking-widest mb-0.5">Leçon</div>
                                                                    <h5 className="text-lg font-black text-text tracking-tight">{tp.subSectionTitle}</h5>
                                                                    <div className="text-[10px] text-text-muted font-bold mt-1">
                                                                        Soumis le {new Date(tp.submissionDate).toLocaleString('fr-FR')}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-3">
                                                                <a 
                                                                    href={tp.submissionLink.startsWith('http') ? tp.submissionLink : `https://${tp.submissionLink}`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="flex items-center gap-2 px-6 py-3.5 bg-background border border-glass-border text-text hover:text-cyan-500 hover:border-cyan-500/30 rounded-xl transition-all font-black text-sm group/link shadow-sm"
                                                                >
                                                                    {tp.submissionLink.toLowerCase().includes('github') ? <Github size={18} /> : <LinkIcon size={18} />}
                                                                    <span>Ouvrir la soumission</span>
                                                                    <ArrowUpRight size={16} className="group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
                                                                </a>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="flex flex-col items-center justify-center py-24 text-center opacity-30">
                                                    <div className="w-20 h-20 bg-cyan-500/10 rounded-full flex items-center justify-center mb-6 text-cyan-500"><FileText size={40} /></div>
                                                    <h4 className="text-xl font-black mb-1">Aucun TP soumis</h4>
                                                    <p className="max-w-xs font-bold text-sm text-center">L'apprenant n'a pas encore soumis de travaux pratiques pour ce cours.</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            );
        }

        return (
            <div className="max-w-6xl mx-auto space-y-8 animate-fade-in pb-20 pt-4">
                <div className="bg-surface rounded-3xl p-8 border border-glass-border shadow-xl">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                        <div>
                            <h3 className="text-2xl font-black text-text flex items-center gap-3">
                                <Users size={28} className="text-primary" />
                                Suivi des Apprenants
                            </h3>
                            <p className="text-sm text-text-muted mt-1">Gérez et suivez la progression de vos élèves</p>
                        </div>
                        <div className="relative w-full md:w-72">
                            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
                            <input
                                type="text"
                                placeholder="Rechercher un apprenant..."
                                className="w-full input !pl-12 py-2.5 text-sm"
                                value={learnersSearchTerm}
                                onChange={(e) => {
                                    setLearnersSearchTerm(e.target.value);
                                    setLearnersCurrentPage(1);
                                }}
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-separate border-spacing-y-2">
                            <thead>
                                <tr className="text-text-muted uppercase text-[10px] font-black tracking-widest px-4">
                                    <th className="pb-4 pl-6">Apprenant</th>
                                    <th className="pb-4">Progression Contenu</th>
                                    <th className="pb-4">Progression Quiz</th>
                                    <th className="pb-4">Score Total</th>
                                    <th className="pb-4">Temps Passé</th>
                                    <th className="pb-4">Examen Final</th>
                                    <th className="pb-4 pr-6 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="space-y-4">
                                {currentItems.map((learner) => (
                                    <tr
                                        key={learner.id}
                                        onClick={() => setDetailedLearnerId(learner.id)}
                                        className="group hover:scale-[1.01] transition-all duration-300 cursor-pointer"
                                    >
                                        <td className="bg-surface-hover/30 rounded-l-2xl py-4 pl-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black">
                                                    {learner.nom[0]}{learner.prenom[0]}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-text leading-tight flex items-center gap-2">
                                                        {learner.prenom} {learner.nom}
                                                        {enseignantEmails.has((learner.email || '').toLowerCase()) && (
                                                            <div className="group relative flex items-center justify-center bg-primary/10 w-5 h-5 rounded-md cursor-help">
                                                                <Briefcase size={12} className="text-primary" />
                                                                <span className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-surface border border-glass-border px-2 py-1 rounded-lg text-[10px] text-text-muted opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-lg">
                                                                    Formateur
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <div className="text-[10px] text-text-muted font-medium">{learner.email}</div>
                                                        <div className="text-[10px] text-primary font-black uppercase tracking-wider">{learner.specialite}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="bg-surface-hover/30 py-4">
                                            <div className="flex flex-col gap-1.5 min-w-[120px]">
                                                <div className="flex justify-between text-[10px] font-bold">
                                                    <span>{learner.sectionsCompleted}/{learner.totalSections} leçons</span>
                                                    <span className="text-primary">{learner.totalSections > 0 ? Math.round((learner.sectionsCompleted / learner.totalSections) * 100) : 0}%</span>
                                                </div>
                                                <div className="w-full h-1.5 bg-background rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-blue-500 rounded-full transition-all duration-1000"
                                                        style={{ width: `${learner.totalSections > 0 ? (learner.sectionsCompleted / learner.totalSections) * 100 : 0}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="bg-surface-hover/30 py-4">
                                            <div className="flex flex-col gap-1.5 min-w-[120px]">
                                                <div className="flex justify-between text-[10px] font-bold">
                                                    <span>{learner.quizzesSubmitted}/{learner.totalQuizzes} quiz</span>
                                                    <span className="text-primary">{learner.totalQuizzes > 0 ? Math.round((learner.quizzesSubmitted / learner.totalQuizzes) * 100) : 0}%</span>
                                                </div>
                                                <div className="w-full h-1.5 bg-background rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-primary rounded-full transition-all duration-1000"
                                                        style={{ width: `${learner.totalQuizzes > 0 ? (learner.quizzesSubmitted / learner.totalQuizzes) * 100 : 0}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="bg-surface-hover/30 py-4">
                                            <div className="font-black text-lg text-primary">{learner.totalQuizScore}%</div>
                                            <div className="text-[10px] uppercase font-bold text-text-muted">Moyenne</div>
                                        </td>
                                        <td className="bg-surface-hover/30 py-4">
                                            <div className="flex items-center gap-1.5 font-bold text-text text-lg">
                                                <Timer size={16} className="text-primary mt-0.5" /> 
                                                <span>{Math.floor((learner.totalTimeSpentSec || 0) / 60)} min</span>
                                            </div>
                                            <div className="text-[10px] uppercase font-bold text-text-muted mt-1">Présence</div>
                                        </td>
                                        <td className="bg-surface-hover/30 py-4">
                                            {learner.cheatingReason ? (() => {
                                                const cheat = parseCheatingReason(learner.cheatingReason);
                                                const borderColor = cheat.color === 'orange' ? 'border-orange-500/30' : 'border-red-500/30';
                                                const bgColor = cheat.color === 'orange' ? 'bg-orange-500/10' : 'bg-red-500/10';
                                                const textColor = cheat.color === 'orange' ? 'text-orange-500' : 'text-red-500';
                                                return (
                                                    <div className="flex flex-col gap-1.5">
                                                        <div className="flex items-center gap-2">
                                                            <div className={`w-9 h-9 rounded-lg ${bgColor} ${textColor} flex items-center justify-center font-black text-sm`}>
                                                                {learner.finalExamNote ?? 0}
                                                            </div>
                                                            <span className="text-[10px] font-bold text-text-muted">/ 20</span>
                                                        </div>
                                                        <div
                                                            title={learner.cheatingReason}
                                                            className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg ${bgColor} border ${borderColor} cursor-help w-fit max-w-[160px]`}
                                                        >
                                                            <span style={{fontSize: '11px'}}>{cheat.icon}</span>
                                                            <span className={`text-[9px] font-black ${textColor} uppercase tracking-wide leading-tight`}>{cheat.label}</span>
                                                        </div>
                                                    </div>
                                                );
                                            })() : learner.finalExamNote !== null ? (
                                                <div className="flex items-center gap-2">
                                                    <div className="w-9 h-9 rounded-lg bg-green-500/10 text-green-500 flex items-center justify-center font-black">
                                                        {learner.finalExamNote}
                                                    </div>
                                                    <span className="text-[10px] font-bold text-text-muted">/ 20</span>
                                                </div>
                                            ) : (
                                                <div className="px-3 py-1 rounded-full bg-gray-500/10 text-gray-500 text-[10px] font-black uppercase w-fit">
                                                    Non passé
                                                </div>
                                            )}
                                        </td>
                                        <td className="bg-surface-hover/30 rounded-r-2xl py-4 pr-6 text-right">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setDetailedLearnerId(learner.id);
                                                    setShowQuizListInDetails(true);
                                                }}
                                                className="p-2 text-text-muted hover:text-primary transition-colors hover:bg-primary/10 rounded-lg flex items-center gap-2 ml-auto"
                                            >
                                                <Eye size={18} />
                                                <span className="text-xs font-bold">Corriger</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {currentItems.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="py-20 text-center text-text-muted font-bold">Aucun apprenant trouvé</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {totalPages > 1 && (
                        <div className="mt-8 pt-8 border-t border-glass-border flex items-center justify-between">
                            <div className="text-xs text-text-muted font-bold">
                                Affichage <span className="text-text">{(learnersCurrentPage - 1) * itemsPerPage + 1}</span> à <span className="text-text">{Math.min(learnersCurrentPage * itemsPerPage, filtered.length)}</span> sur <span className="text-text">{filtered.length}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setLearnersCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={learnersCurrentPage === 1}
                                    className="w-10 h-10 p-0 rounded-xl bg-background border border-glass-border text-text-muted hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center overflow-hidden"
                                    style={{ gap: 0 }}
                                >
                                    <ChevronLeft size={18} className="shrink-0" />
                                </button>
                                <div className="flex gap-1">
                                    {getPages().map((page, i) => (
                                        page === '...' ? (
                                            <div key={`dots-${i}`} className="w-10 h-10 flex items-center justify-center text-text-muted font-bold">...</div>
                                        ) : (
                                            <button
                                                key={`page-${page}`}
                                                onClick={() => setLearnersCurrentPage(Number(page))}
                                                className={`w-10 h-10 p-0 rounded-xl font-bold transition-all ${learnersCurrentPage === page ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-background border border-glass-border text-text-muted hover:border-primary hover:text-primary'}`}
                                            >
                                                {page}
                                            </button>
                                        )
                                    ))}
                                </div>
                                <button
                                    onClick={() => setLearnersCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={learnersCurrentPage === totalPages}
                                    className="w-10 h-10 p-0 rounded-xl bg-background border border-glass-border text-text-muted hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center overflow-hidden"
                                    style={{ gap: 0 }}
                                >
                                    <ChevronRight size={18} className="shrink-0" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const renderEnrollmentsTab = () => {
        const totalPages = Math.ceil(pendingEnrollments.length / itemsPerPage);
        const currentItems = pendingEnrollments.slice(
            (enrollmentsCurrentPage - 1) * itemsPerPage,
            enrollmentsCurrentPage * itemsPerPage
        );

        const getPages = () => {
            const pages = [];
            const showMax = 5;
            if (totalPages <= showMax) {
                for (let i = 1; i <= totalPages; i++) pages.push(i);
            } else {
                pages.push(1);
                if (enrollmentsCurrentPage > 3) pages.push('...');
                const start = Math.max(2, enrollmentsCurrentPage - 1);
                const end = Math.min(totalPages - 1, enrollmentsCurrentPage + 1);
                for (let i = start; i <= end; i++) {
                    if (!pages.includes(i)) pages.push(i);
                }
                if (enrollmentsCurrentPage < totalPages - 2) pages.push('...');
                pages.push(totalPages);
            }
            return pages;
        };

        return (
            <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-20 pt-4">
                <div className="bg-surface rounded-3xl p-8 border border-glass-border shadow-xl">
                    <div className="flex flex-col sm:justify-between sm:flex-row sm:items-center mb-8 gap-4">
                        <div>
                            <h3 className="text-xl sm:text-2xl font-black text-text flex items-center gap-3">
                                <UserPlus size={24} className="text-primary sm:w-7 sm:h-7" />
                                Gestion des Inscriptions
                            </h3>
                            <p className="text-xs sm:text-sm text-text-muted mt-1">Approuvez ou refusez les demandes d'accès</p>
                        </div>
                        <div className="inline-flex self-start px-4 py-2 bg-primary/10 text-primary rounded-2xl font-black text-xs sm:text-sm border border-primary/20">
                            {pendingEnrollments.length} Demandes en attente
                        </div>
                    </div>

                    <div className="space-y-4">
                        {pendingEnrollments.length === 0 ? (
                            <div className="py-20 text-center bg-surface-hover/20 rounded-2xl border-2 border-dashed border-glass-border">
                                <div className="w-16 h-16 bg-surface-hover rounded-full flex items-center justify-center mx-auto mb-4 text-text-muted">
                                    <UserCheck size={32} />
                                </div>
                                <p className="font-bold text-text-muted">Aucune demande d'inscription pour le moment</p>
                            </div>
                        ) : (
                            <>
                                {currentItems.map((env) => (
                                    <div key={env.id} className="bg-surface-hover/30 border border-glass-border p-4 sm:p-5 rounded-2xl flex items-center justify-between gap-4 transition-all hover:bg-surface-hover/50 hover:border-primary/30">
                                        <div className="flex items-center gap-4 sm:gap-5 flex-1 min-w-0">
                                            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-600 text-lg sm:text-xl font-black shrink-0">
                                                {env.prenom[0]}{env.nom[0]}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="font-black text-base sm:text-lg text-text leading-tight sm:truncate">{env.prenom} {env.nom}</div>
                                                <div className="flex flex-col gap-0.5 mb-1">
                                                    <div className="text-[10px] text-primary font-black uppercase tracking-widest">{env.specialite}</div>
                                                </div>
                                                <div className="flex flex-col xs:flex-row xs:items-center gap-1 xs:gap-3 text-xs sm:text-sm text-text-muted">
                                                    <span className="sm:truncate">{env.email}</span>
                                                    <span className="hidden xs:block w-1 h-1 bg-text-muted rounded-full opacity-30" />
                                                    <span className="whitespace-nowrap">Le {env.date ? new Date(env.date).toLocaleDateString() : 'Non définie'}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                                            <button
                                                onClick={async () => {
                                                    try {
                                                        await api.put(`/enrollments/${env.id}/reject`);
                                                        setPendingEnrollments(prev => prev.filter(p => p.id !== env.id));
                                                        openConfirmModal('Inscription Refusée', `La demande de ${env.prenom} ${env.nom} a été rejetée.`, () => setConfirmModal(prev => ({ ...prev, isOpen: false })), 'danger');
                                                    } catch (err) {
                                                        console.error('Error rejecting enrollment:', err);
                                                        openConfirmModal('Erreur', 'Impossible de refuser la demande. Veuillez réessayer.', () => setConfirmModal(prev => ({ ...prev, isOpen: false })), 'danger');
                                                    }
                                                }}
                                                className="p-3 text-error hover:bg-error/10 rounded-xl transition-all border border-transparent hover:border-error/20"
                                                title="Refuser"
                                            >
                                                <Trash2 size={20} className="sm:w-[22px] sm:h-[22px]" />
                                            </button>
                                            <button
                                                onClick={async () => {
                                                    try {
                                                        await api.put(`/enrollments/${env.id}/accept`);
                                                        setPendingEnrollments(prev => prev.filter(p => p.id !== env.id));
                                                        setEnrolledLearners(prev => [...prev, {
                                                            id: env.id,
                                                            nom: env.nom,
                                                            prenom: env.prenom,
                                                            email: env.email,
                                                            totalQuizScore: 0,
                                                            quizzesSubmitted: 0,
                                                            totalQuizzes: course.sections.reduce((acc, s) => acc + (s.subSections.reduce((qAcc, ss) => qAcc + (ss.quiz ? 1 : 0), 0)), 0) + (course.finalExam ? 1 : 0),
                                                            sectionsCompleted: 0,
                                                            totalSections: course.sections.reduce((acc, s) => acc + s.subSections.length, 0),
                                                            finalExamNote: null,
                                                            submissions: []
                                                        }]);
                                                        openConfirmModal('Inscription Acceptée !', `${env.prenom} ${env.nom} peut maintenant accéder au cours.`, () => setConfirmModal(prev => ({ ...prev, isOpen: false })), 'success');
                                                    } catch (err) {
                                                        console.error('Error accepting enrollment:', err);
                                                        openConfirmModal('Erreur', 'Impossible d\'accepter la demande. Veuillez réessayer.', () => setConfirmModal(prev => ({ ...prev, isOpen: false })), 'danger');
                                                    }
                                                }}
                                                className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-primary text-white rounded-xl font-black shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all text-xs sm:text-sm"
                                            >
                                                <UserCheck size={18} className="sm:w-5 sm:h-5" />
                                                <span className="hidden xs:block">Accepter</span>
                                                <span className="xs:hidden">OK</span>
                                            </button>
                                        </div>
                                    </div>
                                ))}

                                {totalPages > 1 && (
                                    <div className="mt-8 pt-8 border-t border-glass-border flex items-center justify-between">
                                        <div className="text-xs text-text-muted font-bold">
                                            Affichage <span className="text-text">{(enrollmentsCurrentPage - 1) * itemsPerPage + 1}</span> à <span className="text-text">{Math.min(enrollmentsCurrentPage * itemsPerPage, pendingEnrollments.length)}</span> sur <span className="text-text">{pendingEnrollments.length}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => setEnrollmentsCurrentPage(p => Math.max(1, p - 1))}
                                                disabled={enrollmentsCurrentPage === 1}
                                                className="w-10 h-10 p-0 rounded-xl bg-background border border-glass-border text-text-muted hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center overflow-hidden"
                                                style={{ gap: 0 }}
                                            >
                                                <ChevronLeft size={18} className="shrink-0" />
                                            </button>
                                            <div className="flex gap-1">
                                                {getPages().map((page, i) => (
                                                    page === '...' ? (
                                                        <div key={`dots-e-${i}`} className="w-10 h-10 flex items-center justify-center text-text-muted font-bold">...</div>
                                                    ) : (
                                                        <button
                                                            key={`page-e-${page}`}
                                                            onClick={() => setEnrollmentsCurrentPage(Number(page))}
                                                            className={`w-10 h-10 p-0 rounded-xl font-bold transition-all ${enrollmentsCurrentPage === page ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-background border border-glass-border text-text-muted hover:border-primary hover:text-primary'}`}
                                                        >
                                                            {page}
                                                        </button>
                                                    )
                                                ))}
                                            </div>
                                            <button
                                                onClick={() => setEnrollmentsCurrentPage(p => Math.min(totalPages, p + 1))}
                                                disabled={enrollmentsCurrentPage === totalPages}
                                                className="w-10 h-10 p-0 rounded-xl bg-background border border-glass-border text-text-muted hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center overflow-hidden"
                                                style={{ gap: 0 }}
                                            >
                                                <ChevronRight size={18} className="shrink-0" />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    if (isLoadingCourse && !course.id) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-background text-text transition-colors">
                <style>{PAGE_STYLES}</style>
                <div className="relative">
                    <div className="w-20 h-20 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                    <BookOpen size={30} className="absolute inset-0 m-auto text-primary animate-pulse" />
                </div>
                <h3 className="mt-6 text-xl font-bold tracking-tight">Chargement du cours...</h3>
                <p className="text-text-muted text-sm mt-2">Veuillez patienter pendant la récupération des données.</p>
            </div>
        );
    }

    if (loadError && !course.id) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-background text-text p-6">
                <style>{PAGE_STYLES}</style>
                <div className="w-20 h-20 bg-error/10 text-error rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-error/10">
                    <AlertCircle size={40} />
                </div>
                <h3 className="text-2xl font-black mb-2 tracking-tight">Oups ! {loadError}</h3>
                <p className="text-text-muted text-center max-w-md mb-8">Nous n'avons pas pu charger ce cours. Vérifiez votre connexion ou l'existence du cours.</p>
                <button 
                    onClick={() => navigate('/courses')}
                    className="flex items-center gap-2 px-8 py-3 bg-primary text-white rounded-2xl font-black shadow-lg shadow-primary/25 hover:scale-105 transition-all"
                >
                    <ArrowLeft size={20} />
                    Retour à la liste
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen text-text p-4 md:p-8 animate-fade-in">
            <style>{PAGE_STYLES}</style>
            <div className="flex flex-col gap-4 mb-8 bg-surface/60 p-4 rounded-2xl border border-glass-border backdrop-blur-md shadow-xl">
                {/* Top Row: Title and Close */}
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                        <button onClick={() => navigate('/courses')} className="p-2 hover:bg-white/10 rounded-xl transition-colors text-text flex-shrink-0"><X size={20} /></button>
                        <div className="min-w-0">
                            <h1 className="text-xl md:text-2xl font-black bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent truncate">{id === 'new' ? 'Création de cours' : 'Édition du cours'}</h1>
                            <p className="text-xs text-text-muted font-medium mt-0.5">{course.sections.length} sections • {course.sections.reduce((acc, s) => acc + s.subSections.length, 0)} leçons</p>
                        </div>
                    </div>
                </div>

                {/* Second Row: Tabs and Action Buttons */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-wrap">
                    {/* Tabs */}
                    <div className="flex bg-surface-hover rounded-xl p-1 border border-glass-border font-medium overflow-x-auto">
                        <button onClick={() => setActiveTab('info')} className={`px-3 md:px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${activeTab === 'info' ? 'bg-primary text-white shadow-lg' : 'text-text-muted hover:text-text'}`}>Informations</button>
                        <button onClick={() => setActiveTab('content')} className={`px-3 md:px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${activeTab === 'content' ? 'bg-primary text-white shadow-lg' : 'text-text-muted hover:text-text'}`}>Contenu</button>
                        <button onClick={() => setActiveTab('learners')} className={`px-3 md:px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${activeTab === 'learners' ? 'bg-primary text-white shadow-lg' : 'text-text-muted hover:text-text'}`}>Apprenants</button>
                        <button onClick={() => setActiveTab('enrollments')} className={`px-3 md:px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${activeTab === 'enrollments' ? 'bg-primary text-white shadow-lg' : 'text-text-muted hover:text-text'}`}>Inscriptions</button>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 flex-wrap sm:ml-auto">
                        {id !== 'new' && (
                            <>
                                <a
                                    href={`/courses/${id}/preview`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-text border border-glass-border flex items-center gap-2 font-bold transition-all text-sm"
                                    title="Voir l'aperçu apprenant (nouvel onglet)"
                                >
                                    <Eye size={18} />
                                    <span className="hidden sm:inline">Aperçu</span>
                                </a>
                                <button
                                    onClick={() => setCourse(prev => ({ ...prev, published: !prev.published }))}
                                    className={`px-4 py-2.5 rounded-xl flex items-center gap-2 font-bold transition-all border-2 text-sm ${course.published
                                        ? 'bg-green-500/10 text-green-500 border-green-500/30 hover:bg-green-500 hover:text-white'
                                        : 'bg-orange-500/10 text-orange-500 border-orange-500/30 hover:bg-orange-500 hover:text-white'
                                        }`}
                                >
                                    {course.published ? <Globe size={18} /> : <Lock size={18} />}
                                    <span className="hidden sm:inline">{course.published ? 'Publié' : 'Brouillon'}</span>
                                </button>
                                <button
                                    onClick={() => setCourse(prev => ({ ...prev, contentCompleted: !(prev as any).contentCompleted }))}
                                    className={`px-4 py-2.5 rounded-xl flex items-center gap-2 font-bold transition-all border-2 text-sm ${(course as any).contentCompleted
                                        ? 'bg-blue-500/10 text-blue-500 border-blue-500/30 hover:bg-blue-500 hover:text-white'
                                        : 'bg-purple-500/10 text-purple-500 border-purple-500/30 hover:bg-purple-500 hover:text-white'
                                        }`}
                                    title="Marquer le contenu comme terminé pour autoriser les certificats"
                                >
                                    {(course as any).contentCompleted ? <CheckCircle2 size={18} /> : <FileText size={18} />}
                                    <span className="hidden sm:inline">{(course as any).contentCompleted ? 'Contenu Terminé' : 'En Création'}</span>
                                </button>
                            </>
                        )}
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className={`btn-primary px-5 md:px-8 py-2.5 rounded-xl flex items-center gap-2 font-bold shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all text-sm md:text-base ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <Save size={18} />
                            <span className="hidden sm:inline">
                                {isSaving ? 'Enregistrement...' : 'Enregistrer'}
                            </span>
                        </button>
                    </div>
                </div>
            </div>
            <div className="relative" key={activeTab}>
                {activeTab === 'info' && renderInfoTab()}
                {activeTab === 'content' && renderContentTab()}
                {activeTab === 'learners' && renderLearnersTab()}
                {activeTab === 'enrollments' && renderEnrollmentsTab()}
            </div>
            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                title={confirmModal.title}
                message={confirmModal.message}
                type={confirmModal.type}
                confirmText={confirmModal.confirmText}
                onConfirm={() => {
                    confirmModal.onConfirm();
                    setConfirmModal(prev => ({ ...prev, isOpen: false }));
                }}
                onCancel={confirmModal.onCancel}
                onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
            />
            {showQuizEditor && selectedSubSectionId && (
                <QuizEditorModal
                    initialQuiz={getSelectedSubSection()?.subSection.quiz}
                    lessonContent={getSelectedSubSection()?.subSection.content}
                    onSave={(quiz) => {
                        const sel = getSelectedSubSection();
                        if (sel) updateSubSection(sel.section.id, sel.subSection.id, { quiz });
                        setShowQuizEditor(false);
                    }}
                    onClose={() => setShowQuizEditor(false)}
                    openConfirmModal={openConfirmModal}
                    closeConfirmModal={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                    isExam={false}
                />
            )}
            {showFinalExamEditor && (
                <QuizEditorModal
                    title="Configuration de l'Examen Final"
                    description="Cet examen sera équilibré automatiquement en fonction du poids horaire de chaque chapitre."
                    maxPoolSize={300}
                    initialQuiz={course.finalExam}
                    isExam={true}
                    openConfirmModal={openConfirmModal}
                    closeConfirmModal={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                    courseSections={course.sections}
                    onSave={(exam) => {
                        // Automatic reset of results when a new exam is generated/saved
                        if (course.finalExam && id && id !== 'new') {
                             const token = localStorage.getItem('token');
                             fetch(`${API_APPRENANT}/progress/${id}/quiz/final_exam`, {
                                 method: 'DELETE',
                                 headers: token ? { 'Authorization': `Bearer ${token}` } : {}
                             }).catch(() => {});
                        }
                        setCourse({ ...course, finalExam: exam });
                        setShowFinalExamEditor(false);
                    }}
                    onClose={() => setShowFinalExamEditor(false)}
                />
            )}
            {selectedLearnerForCorrection && (
                <TrainerCorrectionModal
                    learner={selectedLearnerForCorrection}
                    onClose={() => setSelectedLearnerForCorrection(null)}
                    onUpdateScore={(learnerId, updatedSubmissions) => {
                        setEnrolledLearners(prev => prev.map(l => {
                            if (l.id !== learnerId) return l;
                            const submitted = updatedSubmissions.length;
                            const avgScore = updatedSubmissions.reduce((acc, s) => acc + (s.totalScore || 0), 0) / (submitted || 1);
                            return {
                                ...l,
                                submissions: updatedSubmissions,
                                quizzesSubmitted: submitted,
                                totalQuizScore: Math.round(avgScore)
                            };
                        }));
                    }}
                />
            )}
        </div>
    );
};

export default CourseEditorPage;
