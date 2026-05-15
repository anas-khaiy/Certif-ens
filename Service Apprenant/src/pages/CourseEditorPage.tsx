import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
// @ts-ignore
import ImageResize from 'quill-image-resize-module-react';

// Register Quill modules
// @ts-ignore
const Quill = ReactQuill.Quill;
if (typeof window !== 'undefined' && Quill) {
    // Quill 2.0+ compatibility fix for image-resize module
    // The module expects certain constructors on the Quill object
    const Parchment = Quill.import('parchment');
    if (Parchment) {
        // Mock the structure expected by the image-resize module
        if (!Quill.Attributor) {
            (Quill as any).Attributor = {
                Style: Parchment.StyleAttributor || Parchment.Attributor && (Parchment.Attributor as any).Style,
                Attribute: Parchment.AttributeAttributor || Parchment.Attributor && (Parchment.Attributor as any).Attribute
            };
        }
    }

    try {
        Quill.register('modules/imageResize', ImageResize);
    } catch (e) {
        console.warn('Could not register imageResize module:', e);
    }
}

import {
    Save,
    Trash2,
    Plus,
    ChevronRight,
    ChevronDown,
    ChevronLeft,
    Youtube,
    FileText,
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
    UserX,
    Search
} from 'lucide-react';

// --- STYLES INJECTÉS ---
// Map CourseEditor-specific variables to global theme variables
const PAGE_STYLES = `
:root, [data-theme="light"], [data-theme="dark"] {
  --bg-background: var(--background);
  --bg-surface: var(--surface);
  --bg-surface-hover: var(--surface-hover);
  --text-text: var(--text);
  --text-text-muted: var(--text-muted);
  --ce-card-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
}

[data-theme="light"] {
  --ce-card-shadow: 0 4px 20px -5px rgba(0, 0, 0, 0.1);
}

* {
    box-sizing: border-box;
    transition: background-color 0.3s ease, border-color 0.3s ease, color 0.3s ease;
}

.flex { display: flex; }
.flex-col { flex-direction: column; }
.items-center { align-items: center; }
.justify-between { justify-content: space-between; }
.w-full { width: 100%; }
.h-full { height: 100%; }

.bg-background { background-color: var(--bg-background); }
.bg-surface { background-color: var(--bg-surface); }
.bg-surface-hover { background-color: var(--bg-surface-hover); }
.text-text { color: var(--text-text); }
.text-text-muted { color: var(--text-text-muted); }
.text-primary { color: var(--primary); }
.bg-primary { background-color: var(--primary); }
.bg-error { background-color: var(--error); }
.border-glass-border { border-color: var(--glass-border); }

/* Custom Scrollbar */
.custom-scrollbar::-webkit-scrollbar {
  width: 8px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: var(--bg-background);
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: var(--glass-border);
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: var(--text-text-muted);
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fade-in {
  animation: fadeIn 0.4s ease-out forwards;
}

.input {
  background-color: var(--bg-background);
  border: 1px solid var(--glass-border);
  color: var(--text-text);
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
    background-color: var(--bg-surface);
    border: 1px solid var(--glass-border);
    border-radius: 1.5rem;
    box-shadow: var(--ce-card-shadow);
}

.icon-container {
    display: flex;
    align-items: center;
    justify-content: center;
}

/* Base Quill Overrides */
.quill-wrapper {
  background: var(--bg-surface);
  border-radius: 1rem;
  border: 1px solid var(--glass-border);
  resize: vertical;
  overflow: auto;
  min-height: 250px;
  max-height: 800px;
  display: flex;
  flex-direction: column;
  position: relative; /* Ensure z-index context */
}

/* Add resize handle visual indicator */
.quill-wrapper::after {
  content: '';
  position: absolute;
  bottom: 0;
  right: 0;
  width: 16px;
  height: 16px;
  background: linear-gradient(135deg, transparent 50%, var(--text-text-muted) 50%);
  opacity: 0.3;
  pointer-events: none;
  border-bottom-right-radius: 1rem;
}

.quill-wrapper:hover::after {
  opacity: 0.6;
}

.quill-wrapper .quill {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.quill-wrapper .ql-toolbar {
  border: none !important;
  border-bottom: 1px solid var(--glass-border) !important;
  background: var(--bg-background) !important;
  opacity: 0.8;
  flex-shrink: 0;
  position: relative;
  z-index: 10;
}


.quill-wrapper .ql-container {
  border: none !important;
  flex: 1;
  font-family: inherit;
  font-size: 1rem;
  color: var(--text-text) !important;
  overflow-y: auto;
}

.quill-wrapper .ql-editor {
  min-height: 200px;
}

.quill-wrapper .ql-editor.ql-blank::before {
  color: var(--text-text-muted) !important;
  font-style: normal;
  opacity: 0.5;
}

.quill-wrapper .ql-stroke {
  stroke: var(--text-text) !important;
}

.quill-wrapper .ql-fill {
  fill: var(--text-text) !important;
}

.quill-wrapper .ql-picker {
  color: var(--text-text) !important;
}

.quill-wrapper .ql-picker-options {
  background-color: var(--bg-surface) !important;
  border: 1px solid var(--glass-border) !important;
  border-radius: 12px !important;
  padding: 8px !important;
  z-index: 9999 !important;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3) !important;
  position: absolute !important;
}

/* Ensure expanded picker has proper stacking */
.quill-wrapper .ql-picker.ql-expanded {
  z-index: 9999 !important;
}

.quill-wrapper .ql-toolbar .ql-picker.ql-expanded .ql-picker-options {
  z-index: 9999 !important;
  position: absolute !important;
}


/* Picker items - text content */
.quill-wrapper .ql-picker-item {
  color: var(--text-text) !important;
  padding: 6px 12px !important;
  border-radius: 6px !important;
}

.quill-wrapper .ql-picker-item:hover {
  background-color: var(--bg-surface-hover) !important;
}

/* Picker label - the button that opens the dropdown */
.quill-wrapper .ql-picker-label {
  color: var(--text-text) !important;
}

/* For header dropdown - show the text labels */
.quill-wrapper .ql-picker.ql-header .ql-picker-label::before,
.quill-wrapper .ql-picker.ql-header .ql-picker-item::before {
  content: attr(data-value) !important;
  color: var(--text-text) !important;
}

/* Override Quill's default content for header options */
.quill-wrapper .ql-picker.ql-header .ql-picker-label[data-value="1"]::before,
.quill-wrapper .ql-picker.ql-header .ql-picker-item[data-value="1"]::before {
  content: 'Heading 1' !important;
}

.quill-wrapper .ql-picker.ql-header .ql-picker-label[data-value="2"]::before,
.quill-wrapper .ql-picker.ql-header .ql-picker-item[data-value="2"]::before {
  content: 'Heading 2' !important;
}

.quill-wrapper .ql-picker.ql-header .ql-picker-label[data-value="3"]::before,
.quill-wrapper .ql-picker.ql-header .ql-picker-item[data-value="3"]::before {
  content: 'Heading 3' !important;
}

.quill-wrapper .ql-picker.ql-header .ql-picker-label:not([data-value])::before,
.quill-wrapper .ql-picker.ql-header .ql-picker-item:not([data-value])::before {
  content: 'Normal' !important;
}

/* SVG icons in pickers */
.quill-wrapper .ql-picker-label svg .ql-stroke,
.quill-wrapper .ql-picker-item svg .ql-stroke {
  stroke: var(--text-text) !important;
}

.quill-wrapper .ql-picker-label svg .ql-fill,
.quill-wrapper .ql-picker-item svg .ql-fill {
  fill: var(--text-text) !important;
}

/* Fix for alignment dropdown icons */
.quill-wrapper .ql-picker.ql-align .ql-picker-item svg,
.quill-wrapper .ql-picker.ql-align .ql-picker-label svg {
  width: 18px !important;
  height: 18px !important;
  display: block !important;
}

/* Ensure alignment icons are visible */
.quill-wrapper .ql-picker.ql-align .ql-picker-item {
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  min-width: 40px !important;
  min-height: 32px !important;
}

/* Make sure alignment picker shows options ONLY when expanded */
.quill-wrapper .ql-picker.ql-align.ql-expanded .ql-picker-options {
  display: block !important;
}

/* Specific alignment icon visibility */
.quill-wrapper .ql-picker.ql-align .ql-picker-item svg,
.quill-wrapper .ql-picker.ql-align .ql-picker-label svg {
  opacity: 1 !important;
  visibility: visible !important;
}

/* Ensure SVG paths are visible */
.quill-wrapper .ql-picker.ql-align svg line,
.quill-wrapper .ql-picker.ql-align svg polyline,
.quill-wrapper .ql-picker.ql-align svg path {
  stroke: var(--text-text) !important;
  stroke-width: 2 !important;
}


.flex-1 { flex: 1 1 0%; }
.grid { display: grid; }
.gap-4 { gap: 1rem; }
.gap-6 { gap: 1.5rem; }
.gap-8 { gap: 2rem; }
.gap-10 { gap: 2.5rem; }
.md\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.flex-shrink-0 { flex-shrink: 0; }
.max-w-5xl { max-w: 64rem; }
.mx-auto { margin-left: auto; margin-right: auto; }
.space-y-8 > :not([hidden]) ~ :not([hidden]) { margin-top: 2rem; }
.space-y-10 > :not([hidden]) ~ :not([hidden]) { margin-top: 2.5rem; }

@media (min-width: 1024px) {
  .lg\:flex-row { flex-direction: row; }
  .lg\:w-1\/4 { width: 25%; }
}

.backdrop-blur-md {
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
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

// --- Types ---
type QuestionType = 'QCU' | 'QCM' | 'OPEN';

interface Question {
    id: string;
    type: QuestionType;
    text: string;
    options: string[]; // Options possibles (vide si OPEN)
    correctAnswers: number[]; // Indices des bonnes réponses (1 seul pour QCU)
}

interface QuizSettings {
    mode: 'manual' | 'dynamic';
    aiGeneratedCount: number; // How many to generate originally
    totalQuestions: number; // How many to show learner
    qcuCount: number;
    qcmCount: number;
    openCount: number;
    passingScore: number; // Percentage required to pass
    generatedPool?: Question[]; // The hidden bank for this quiz
}

interface Quiz {
    id: string;
    title?: string;
    questions?: Question[];
    settings?: QuizSettings;
}

interface SubSection {
    id: string;
    title: string;
    content: string;
    videoUrl?: string;
    videoUrls?: string[];
    quiz?: Quiz;
}

interface Section {
    id: string;
    title: string;
    subSections: SubSection[];
}

interface Course {
    id: string;
    title: string;
    category: string;
    level: 'Licence' | 'Master';
    semesters: string[];
    prerequisites: string;
    description: string;
    coverImage: string;
    sections: Section[];
    finalExam?: Quiz;
    isPublished?: boolean;
}

interface StudentAnswer {
    questionId: string;
    type: QuestionType;
    learnerAnswer: any; // index for QCU, array for QCM, string for OPEN
    isCorrect?: boolean;
    score?: number; // 0 or 1 for QCU/QCM, 0-20 for OPEN (manual)
    feedback?: string;
}

interface QuizSubmission {
    quizId: string;
    quizTitle: string;
    submittedAt: string;
    answers: StudentAnswer[];
    totalScore?: number;
    status: 'pending' | 'graded';
}

interface EnrolledLearner {
    id: string;
    nom: string;
    prenom: string;
    email: string;
    totalQuizScore: number;
    quizzesSubmitted: number;
    totalQuizzes: number;
    finalExamNote: number | null;
    submissions?: QuizSubmission[];
}

// --- Helpers ---
const generateId = () => Math.random().toString(36).substr(2, 9);

// Mock useCourses Hook
const useCourses = () => {
    const getCourse = (id: string): Course | undefined => {
        if (id === 'new') return undefined;
        return {
            id: id,
            title: 'Introduction au Machine Learning',
            category: 'Informatique',
            level: 'Master',
            semesters: ['S1'],
            prerequisites: '<p>Connaissances en Python et mathématiques de base.</p>',
            description: '<p>Ce cours couvre les fondamentaux de l\'apprentissage automatique...</p>',
            coverImage: '',
            isPublished: true,
            sections: [
                {
                    id: 'sec-1',
                    title: 'Fondamentaux',
                    subSections: [
                        {
                            id: 'sub-1',
                            title: 'Qu\'est-ce que le ML ?',
                            content: '<p>Introduction aux concepts de base.</p>',
                            videoUrls: ['https://youtube.com/watch?v=example'],
                            quiz: {
                                id: 'q1',
                                title: 'Évaluation rapide',
                                questions: [
                                    {
                                        id: 'qu1',
                                        type: 'QCU',
                                        text: 'Quelle est la différence entre IA et ML ?',
                                        options: ['Aucune', 'Le ML est une sous-catégorie', 'L\'IA est une sous-catégorie'],
                                        correctAnswers: [1]
                                    }
                                ]
                            }
                        }
                    ]
                }
            ]
        };
    };

    const addCourse = (course: Course) => console.log('Added:', course);
    const updateCourse = (course: Course) => console.log('Updated:', course);

    return { getCourse, addCourse, updateCourse };
};

// Mock Components
// Editor Component using ReactQuill
const MockQuill: React.FC<{
    value: string;
    onChange: (val: string) => void;
    placeholder?: string;
    className?: string;
}> = ({ value, onChange, placeholder, className }) => {
    const modules = {
        toolbar: [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            [{ 'align': [] }],
            ['link', 'image'],
            ['clean']
        ],
        imageResize: {
            // @ts-ignore
            parchment: Quill.import('parchment'),
            modules: ['Resize', 'DisplaySize', 'Toolbar']
        }
    };

    return (
        <div className={`quill-wrapper ${className}`}>
            <ReactQuill
                theme="snow"
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                modules={modules}
            />
        </div>
    );
};

const ConfirmationModal: React.FC<{
    isOpen: boolean;
    title: string;
    message: string;
    type?: 'danger' | 'success' | 'warning';
    onConfirm: () => void;
    onCancel?: () => void;
}> = ({ isOpen, title, message, type = 'danger', onConfirm, onCancel }) => {
    if (!isOpen) return null;

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

    return ReactDOM.createPortal(
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in m-0" style={{ margin: 0, top: 0, left: 0 }}>
            <div className="bg-surface border border-glass-border p-8 rounded-3xl shadow-2xl max-w-md w-full mx-4 text-center relative overflow-hidden animate-fade-in" style={{ zIndex: 10001, margin: 'auto' }}>
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
                        {type === 'danger' ? 'Supprimer' : type === 'success' ? 'Continuer' : 'D\'accord'}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

// --- NEW QUIZ EDITOR ---
const QuizEditorModal: React.FC<{
    initialQuiz?: Quiz;
    onSave: (quiz: Quiz) => void;
    onClose: () => void;
    maxPoolSize?: number;
    maxSelectionPerType?: number;
    title?: string;
    description?: string;
    isExam?: boolean;
}> = ({ initialQuiz, onSave, onClose, maxPoolSize = 60, maxSelectionPerType = 30, title = "Éditeur de Quiz", description,  }) => {
    const [quizMode, setQuizMode] = useState<'manual' | 'dynamic'>(initialQuiz?.settings?.mode || 'manual');
    const [isGenerating, setIsGenerating] = useState(false);
    const [settings, setSettings] = useState<QuizSettings>(initialQuiz?.settings || {
        mode: 'manual',
        aiGeneratedCount: 10,
        totalQuestions: 5,
        qcuCount: 3,
        qcmCount: 2,
        openCount: 0,
        passingScore: initialQuiz?.settings?.passingScore || 70,
        generatedPool: initialQuiz?.settings?.generatedPool || []
    });

    const [questions, setQuestions] = useState<Question[]>(initialQuiz?.questions || [{
        id: generateId(),
        type: 'QCU',
        text: '',
        options: ['', ''],
        correctAnswers: [0]
    }]);

    const [selectedQuestionId, setSelectedQuestionId] = useState<string>(questions[0]?.id || '');

    // Sélection automatique si l'ID sélectionné n'existe plus ou est vide
    useEffect(() => {
        if ((!selectedQuestionId || !questions.find(q => q.id === selectedQuestionId)) && questions.length > 0) {
            setSelectedQuestionId(questions[0].id);
        }
    }, [questions, selectedQuestionId]);

    const activeQuestion = questions.find(q => q.id === selectedQuestionId);

    const handleGeneratePool = async () => {
        setIsGenerating(true);
        // Simulation of AI Generation
        await new Promise(resolve => setTimeout(resolve, 2500));

        const poolSize = settings.aiGeneratedCount;
        const newPool: Question[] = Array.from({ length: poolSize }).map((_, i) => ({
            id: generateId(),
            type: i % 3 === 0 ? 'QCM' : (i % 3 === 1 ? 'OPEN' : 'QCU'),
            text: `Question générée ${i + 1} basée sur le contenu...`,
            options: i % 3 !== 1 ? ['Option A', 'Option B', 'Option C', 'Option D'] : [],
            correctAnswers: i % 3 === 0 ? [0, 2] : (i % 3 === 2 ? [1] : [])
        }));

        const qcuPool = newPool.filter(q => q.type === 'QCU').length;
        const qcmPool = newPool.filter(q => q.type === 'QCM').length;

        setSettings(prev => ({
            ...prev,
            generatedPool: newPool,
            // Pre-fill distribution with sensible defaults based on pool
            qcuCount: Math.min(3, qcuPool),
            qcmCount: Math.min(2, qcmPool),
            openCount: 0,
            totalQuestions: Math.min(3, qcuPool) + Math.min(2, qcmPool)
        }));
        setIsGenerating(false);
    };

    const handleSave = () => {
        if (quizMode === 'manual') {
            const validQuestions = questions.filter(q => q.text.trim() !== '');
            if (validQuestions.length === 0) {
                alert("Le quiz doit contenir au moins une question valide.");
                return;
            }
            onSave({
                id: initialQuiz?.id || generateId(),
                title: initialQuiz?.title,
                questions: validQuestions,
                settings: { ...settings, mode: 'manual' }
            });
        } else {
            // Dynamic Mode
            if (!settings.generatedPool || settings.generatedPool.length === 0) {
                alert("Veuillez générer un pool de questions avec l'IA d'abord.");
                return;
            }
            if (settings.totalQuestions <= 0) {
                alert("Le nombre total de questions à afficher doit être supérieur à 0.");
                return;
            }
            onSave({
                id: initialQuiz?.id || generateId(),
                title: initialQuiz?.title,
                settings: { ...settings, mode: 'dynamic' }
            });
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

    // --- Options Logic ---

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
            // Ajuster les réponses correctes si nécessaire
            const newCorrects = q.correctAnswers
                .filter(ansIdx => ansIdx !== idx) // Retirer si c'était l'option supprimée
                .map(ansIdx => ansIdx > idx ? ansIdx - 1 : ansIdx); // Décaler les index supérieurs

            // S'assurer qu'il reste une réponse correcte pour QCU/QCM si possible
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
            // QCM: Toggle
            if (newCorrects.includes(idx)) {
                newCorrects = newCorrects.filter(i => i !== idx);
            } else {
                newCorrects.push(idx);
            }
        } else {
            // QCU: Replace
            newCorrects = [idx];
        }
        updateQuestion(qId, { correctAnswers: newCorrects });
    };


    return ReactDOM.createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-4 m-0" style={{ zIndex: 9999, top: 0, left: 0 }}>
            <div className="bg-surface border border-glass-border rounded-3xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col relative overflow-hidden m-auto">

                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-glass-border bg-surface/90">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-primary/10 rounded-xl text-primary"><HelpCircle size={24} /></div>
                            <div>
                                <h3 className="text-xl font-black text-text">{title}</h3>
                                <p className="text-xs text-text-muted">Configurez le mode d'évaluation</p>
                            </div>
                        </div>

                        {/* Mode Selector */}
                        <div className="flex bg-surface-hover p-1 rounded-2xl border border-glass-border">
                            <button
                                onClick={() => setQuizMode('manual')}
                                className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${quizMode === 'manual' ? 'bg-primary text-white shadow-lg' : 'text-text-muted hover:text-text'}`}
                            >
                                Manuel
                            </button>
                            <button
                                onClick={() => setQuizMode('dynamic')}
                                className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${quizMode === 'dynamic' ? 'bg-primary text-white shadow-lg' : 'text-text-muted hover:text-text'}`}
                            >
                                <span className="flex items-center gap-1.5"><Sparkles size={14} /> IA / Dynamique</span>
                            </button>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors"><X size={24} /></button>
                </div>
                {/* Content - Split View */}
                <div className="flex flex-1 overflow-hidden">
                    {quizMode === 'manual' ? (
                        <>
                            {/* Sidebar: Questions List */}
                            <div className="w-64 md:w-80 border-r border-glass-border bg-surface-hover/30 flex flex-col">
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
                            <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar bg-surface">
                                {activeQuestion ? (
                                    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">

                                        {/* Global Rules */}
                                        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                                            <div className="flex items-center gap-4">
                                                <div className="p-3 bg-primary/10 rounded-xl text-primary">
                                                    <CheckCircle2 size={24} />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-text">Règle de passage</h4>
                                                    <p className="text-xs text-text-muted">Définissez le score minimum pour réussir ce quiz</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center bg-surface border border-glass-border rounded-xl px-4 py-2 group-focus-within:border-primary">
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
                                                        onClick={() => updateQuestion(activeQuestion.id, { type: t.type as QuestionType, correctAnswers: [] })}
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
                    ) : (
                        <div className="flex-1 overflow-y-auto p-6 md:p-10 bg-surface custom-scrollbar">
                            <div className="max-w-2xl mx-auto space-y-10 animate-fade-in">
                                <div className="text-center space-y-2">
                                    <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto text-primary mb-4 rotate-3">
                                        <Sparkles size={40} />
                                    </div>
                                    <h4 className="text-2xl font-black">{title}</h4>
                                    <p className="text-text-muted">{description || "L'IA analyse votre contenu pour créer un pool de questions personnalisé."}</p>
                                </div>

                                <div className="grid gap-12">
                                    {/* Step 1: Generation Pool */}
                                    <div className="space-y-6 relative">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-black text-sm">1</div>
                                            <label className="text-sm font-black uppercase tracking-widest text-text">Pool de questions IA</label>
                                        </div>

                                        <div className="bg-background border border-glass-border rounded-3xl p-8 space-y-6 shadow-sm">
                                            <div className="space-y-4">
                                                <label className="text-xs font-bold text-text-muted uppercase">Nombre de questions à générer à partir du contenu</label>
                                                <div className="flex items-center gap-4">
                                                    <input
                                                        type="number"
                                                        value={settings.aiGeneratedCount}
                                                        onChange={(e) => {
                                                            const val = parseInt(e.target.value) || 0;
                                                            setSettings({ ...settings, aiGeneratedCount: Math.min(maxPoolSize, val) });
                                                        }}
                                                        className="flex-1 input h-14 text-xl font-black text-center"
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
                                                <div className="pt-6 border-t border-glass-border flex items-center justify-between animate-fade-in">
                                                    <div className="flex items-center gap-2 text-green-500 font-bold">
                                                        <Check size={20} />
                                                        <span>Pool prêt : {settings.generatedPool.length} questions générées</span>
                                                    </div>
                                                    <button
                                                        onClick={() => setSettings({ ...settings, generatedPool: [] })}
                                                        className="text-xs text-text-muted hover:text-error transition-all underline"
                                                    >
                                                        Réinitialiser le pool
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Step 2: Distribution Settings (Only if pool exists) */}
                                    <div className={`space-y-6 transition-all duration-500 ${!settings.generatedPool || settings.generatedPool.length === 0 ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-black text-sm">2</div>
                                            <label className="text-sm font-black uppercase tracking-widest text-text">Sélection Apprenant (Tirage aléatoire)</label>
                                        </div>

                                        <div className="bg-background border border-glass-border rounded-3xl p-8 space-y-8">
                                            <div className="flex justify-between items-center bg-primary/5 p-4 rounded-2xl border border-primary/10">
                                                <span className="text-sm font-bold text-primary">Total à afficher dans le quiz final</span>
                                                <span className="text-2xl font-black text-primary">{settings.totalQuestions}</span>
                                            </div>

                                            <div className="grid grid-cols-3 gap-6">
                                                {[
                                                    { key: 'qcuCount', label: 'QCU', icon: Circle, color: 'text-blue-500', pool: settings.generatedPool?.filter(q => q.type === 'QCU').length || 0 },
                                                    { key: 'qcmCount', label: 'QCM', icon: CheckSquare, color: 'text-green-500', pool: settings.generatedPool?.filter(q => q.type === 'QCM').length || 0 },
                                                    { key: 'openCount', label: 'Ouvertes', icon: MessageSquare, color: 'text-orange-500', pool: settings.generatedPool?.filter(q => q.type === 'OPEN').length || 0 }
                                                ].map(item => (
                                                    <div key={item.key} className="space-y-3">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-2">
                                                                <item.icon size={14} className={item.color} />
                                                                <span className="text-[10px] font-black uppercase opacity-60">{item.label}</span>
                                                            </div>
                                                            <span className="text-[10px] bg-surface-hover px-2 py-0.5 rounded-full font-bold">Max: {Math.min(item.pool, maxSelectionPerType)}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                onClick={() => {
                                                                    const val = Math.max(0, (settings as any)[item.key] - 1);
                                                                    const newSettings = { ...settings, [item.key]: val };
                                                                    newSettings.totalQuestions = newSettings.qcuCount + newSettings.qcmCount + newSettings.openCount;
                                                                    setSettings(newSettings);
                                                                }}
                                                                className="w-10 h-10 rounded-xl bg-surface-hover flex items-center justify-center hover:bg-primary/10 hover:text-primary transition-all font-black"
                                                            >-</button>
                                                            <span className="flex-1 text-center font-black text-lg">{(settings as any)[item.key]}</span>
                                                            <button
                                                                onClick={() => {
                                                                    const val = Math.min(item.pool, maxSelectionPerType, (settings as any)[item.key] + 1);
                                                                    const newSettings = { ...settings, [item.key]: val };
                                                                    newSettings.totalQuestions = newSettings.qcuCount + newSettings.qcmCount + newSettings.openCount;
                                                                    setSettings(newSettings);
                                                                }}
                                                                className="w-10 h-10 rounded-xl bg-surface-hover flex items-center justify-center hover:bg-primary/10 hover:text-primary transition-all font-black"
                                                            >+</button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-glass-border">
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

                                                <div className="flex items-end text-center md:text-left pb-1">
                                                    <p className="text-[11px] text-text-muted italic leading-relaxed">
                                                        L'apprenant doit obtenir au moins <span className="text-primary font-bold">{settings.passingScore}%</span> pour valider cette étape.
                                                    </p>
                                                </div>
                                            </div>

                                            <p className="text-[11px] text-text-muted text-center italic">
                                                L'IA sélectionnera aléatoirement {settings.totalQuestions} questions parmi les {settings.generatedPool?.length || 0} du pool pour chaque apprenant.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-5 border-t border-glass-border bg-surface/90 flex justify-end gap-3">
                    <button onClick={onClose} className="px-6 py-3 text-sm font-bold text-text-muted hover:bg-white/5 rounded-xl transition-all">
                        Annuler
                    </button>
                    <button onClick={handleSave} className="btn-primary px-8 py-3 rounded-xl text-sm font-bold shadow-lg shadow-primary/20 flex items-center gap-2">
                        <Save size={18} /> Enregistrer le Quiz
                    </button>
                </div>
            </div>
        </div>,
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
            // Simple total score calculation (average of all answers score 0-1 for QCU/QCM and 0-20 mapped for OPEN)
            const total = newSubmissions[activeSubmissionIdx].answers.reduce((acc, a) => {
                if (a.type === 'OPEN') return acc + (a.score || 0) * 5; // map 0-20 to 0-100
                return acc + (a.isCorrect ? 100 : 0);
            }, 0);
            newSubmissions[activeSubmissionIdx].totalScore = Math.round(total / newSubmissions[activeSubmissionIdx].answers.length);
        }

        setSubmissions(newSubmissions);
    };

    const handleSave = () => {
        onUpdateScore(learner.id, submissions);
        onClose();
    };

    return ReactDOM.createPortal(
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in m-0" style={{ margin: 0 }}>
            <div className="bg-surface border border-glass-border rounded-3xl shadow-2xl w-[80vw] h-[80vh] flex flex-col relative overflow-hidden m-auto text-text">
                {/* Header */}
                <div className="p-6 border-b border-glass-border flex justify-between items-center bg-surface/90">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary text-xl font-black">
                            {learner.nom[0]}{learner.prenom[0]}
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-text">Correction : {learner.prenom} {learner.nom}</h3>
                            <p className="text-xs text-text-muted">{learner.email}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors"><X size={24} /></button>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    {/* Sidebar sub list */}
                    <div className="w-80 border-r border-glass-border bg-surface-hover/30 p-4 space-y-3 overflow-y-auto">
                        <label className="text-[10px] font-black uppercase text-text-muted px-2">Quiz Soumis</label>
                        {submissions.length === 0 ? (
                            <div className="p-4 text-center text-xs text-text-muted opacity-50 italic">Aucune soumission</div>
                        ) : (
                            submissions.map((s, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setActiveSubmissionIdx(idx)}
                                    className={`w-full text-left p-4 rounded-2xl border transition-all ${activeSubmissionIdx === idx ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' : 'bg-surface border-glass-border hover:border-primary/30'}`}
                                >
                                    <div className="font-bold text-sm truncate">{s.quizTitle}</div>
                                    <div className="flex justify-between items-center mt-2">
                                        <span className="text-[9px] opacity-70 uppercase font-bold">{s.submittedAt}</span>
                                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-black uppercase ${s.status === 'pending' ? 'bg-orange-500/20 text-orange-400' : 'bg-green-500/20 text-green-400'}`}>
                                            {s.status === 'pending' ? 'À corriger' : 'Corrigé'}
                                        </span>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>

                    {/* Main correction area */}
                    <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-background/50">
                        {submission ? (
                            <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
                                <div className="flex justify-between items-end">
                                    <h4 className="text-2xl font-black">{submission.quizTitle}</h4>
                                    {submission.totalScore !== undefined && (
                                        <div className="text-right">
                                            <div className="text-3xl font-black text-primary">{submission.totalScore}%</div>
                                            <div className="text-[10px] font-bold uppercase text-text-muted">Score Final</div>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-6">
                                    {submission.answers.map((answer, qIdx) => (
                                        <div key={qIdx} className="bg-surface border border-glass-border rounded-2xl p-6 shadow-sm border-l-4" style={{ borderLeftColor: answer.type === 'OPEN' ? (answer.score !== undefined ? 'var(--primary)' : 'var(--orange-500)') : (answer.isCorrect ? 'var(--green-500)' : 'var(--error)') }}>
                                            <div className="flex justify-between items-start mb-4">
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
                                                    <div className="flex items-center gap-4">
                                                        <div className="flex bg-surface-hover p-1 rounded-xl border border-glass-border">
                                                            <button
                                                                onClick={() => handleGradeOpenQuestion(qIdx, 0, false)}
                                                                className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase transition-all ${answer.isCorrect === false ? 'bg-error text-white shadow-lg shadow-error/20' : 'text-text-muted hover:text-error'}`}
                                                            >
                                                                Incorrect
                                                            </button>
                                                            <button
                                                                onClick={() => handleGradeOpenQuestion(qIdx, 20, true)}
                                                                className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase transition-all ${answer.isCorrect === true ? 'bg-green-500 text-white shadow-lg shadow-green-500/20' : 'text-text-muted hover:text-green-500'}`}
                                                            >
                                                                Correct
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            <p className="font-bold mb-4 text-text/90">Réponse de l'élève à la question ouverte</p>

                                            <div className="bg-background/50 rounded-xl p-4 border border-glass-border">
                                                <label className="text-[10px] font-black uppercase text-text-muted mb-2 block">Réponse de l'apprenant :</label>
                                                <div className="text-sm italic font-medium whitespace-pre-wrap">
                                                    {answer.type === 'OPEN' ? answer.learnerAnswer : (
                                                        <span className="font-bold">Choix : {Array.isArray(answer.learnerAnswer) ? answer.learnerAnswer.join(', ') : answer.learnerAnswer}</span>
                                                    )}
                                                </div>
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
                <div className="p-6 border-t border-glass-border bg-surface flex justify-end gap-4">
                    <button onClick={onClose} className="px-6 py-3 font-bold text-text-muted hover:bg-white/5 rounded-xl transition-all">
                        Fermer
                    </button>
                    <button
                        onClick={handleSave}
                        className="btn-primary px-8 py-3 rounded-xl shadow-lg flex items-center gap-2"
                    >
                        <Save size={18} /> Enregistrer la correction
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

// --- Main Page Component ---
const CourseEditorPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { getCourse, addCourse, updateCourse } = useCourses();

    const [course, setCourse] = useState<Course>({
        id: '', title: '', category: '', level: 'Licence', semesters: [], prerequisites: '', description: '', coverImage: '', sections: [], isPublished: false
    });

    const [activeTab, setActiveTab] = useState<'info' | 'content' | 'learners' | 'enrollments'>('info');
    const [expandedSectionId, setExpandedSectionId] = useState<string | null>(null);
    const [selectedSubSectionId, setSelectedSubSectionId] = useState<string | null>(null);
    const [showQuizEditor, setShowQuizEditor] = useState(false);
    const [showFinalExamEditor, setShowFinalExamEditor] = useState(false);
    const [selectedLearnerForCorrection, setSelectedLearnerForCorrection] = useState<EnrolledLearner | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isSaving, setIsSaving] = useState(false);

    const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; title: string; message: string; type?: 'danger' | 'success' | 'warning'; onConfirm: () => void; onCancel?: () => void }>({ isOpen: false, title: '', message: '', onConfirm: () => { } });

    // Mock Learners State
    const [enrolledLearners, setEnrolledLearners] = useState<EnrolledLearner[]>([
        {
            id: 'l1', nom: 'Benani', prenom: 'Amine', email: 'amine@mail.com', totalQuizScore: 85, quizzesSubmitted: 4, totalQuizzes: 5, finalExamNote: 16,
            submissions: [
                {
                    quizId: 'q1', quizTitle: 'Fondamentaux du ML', submittedAt: '2024-02-12', status: 'pending',
                    answers: [
                        { questionId: 'qu1', type: 'QCU', learnerAnswer: 1, isCorrect: true },
                        { questionId: 'qu2', type: 'OPEN', learnerAnswer: 'Le Machine Learning est un champ d\'étude de l\'intelligence artificielle qui se base sur des approches mathématiques et statistiques pour donner aux ordinateurs la capacité d\'apprendre à partir de données.' }
                    ]
                },
                {
                    quizId: 'q2', quizTitle: 'Réseaux de Neurones', submittedAt: '2024-02-14', status: 'pending',
                    answers: [
                        { questionId: 'qu3', type: 'QCM', learnerAnswer: [0, 2], isCorrect: false },
                        { questionId: 'qu4', type: 'OPEN', learnerAnswer: 'La rétropropagation est utilisée pour mettre à jour les poids du réseau en calculant le gradient de la fonction de perte.' }
                    ]
                },
                {
                    quizId: 'q3', quizTitle: 'Statistiques Avancées', submittedAt: '2024-02-10', status: 'graded', totalScore: 90,
                    answers: [
                        { questionId: 'qu5', type: 'QCU', learnerAnswer: 0, isCorrect: true, score: 1 },
                        { questionId: 'qu6', type: 'OPEN', learnerAnswer: 'La loi normale est une distribution de probabilité continue symétrique autour de sa moyenne.', isCorrect: true, score: 20 }
                    ]
                }
            ]
        },
        {
            id: 'l2', nom: 'Alami', prenom: 'Sara', email: 'sara@mail.com', totalQuizScore: 92, quizzesSubmitted: 5, totalQuizzes: 5, finalExamNote: 18,
            submissions: [
                {
                    quizId: 'q4', quizTitle: 'Python pour la Data Science', submittedAt: '2024-02-15', status: 'pending',
                    answers: [
                        { questionId: 'qu7', type: 'QCU', learnerAnswer: 2, isCorrect: true },
                        { questionId: 'qu8', type: 'OPEN', learnerAnswer: 'Pandas est une bibliothèque Python utilisée pour la manipulation et l\'analyse de données.' }
                    ]
                }
            ]
        },
        { id: 'l3', nom: 'Tazi', prenom: 'Karim', email: 'karim@chat.ma', totalQuizScore: 45, quizzesSubmitted: 2, totalQuizzes: 5, finalExamNote: null, submissions: [] },
    ]);

    const [pendingEnrollments, setPendingEnrollments] = useState([
        { id: 'e1', nom: 'Mansouri', prenom: 'Yassine', email: 'yassine@mail.com', date: '2024-02-10' },
        { id: 'e2', nom: 'Ibrahimi', prenom: 'Laila', email: 'laila@mail.com', date: '2024-02-11' },
        { id: 'e3', nom: 'Hassani', prenom: 'Amal', email: 'amal@mail.com', date: '2024-02-12' },
        { id: 'e4', nom: 'Ouazzani', prenom: 'Mehdi', email: 'mehdi@mail.com', date: '2024-02-13' },
        { id: 'e5', nom: 'Filali', prenom: 'Siham', email: 'siham@mail.com', date: '2024-02-14' },
        { id: 'e6', nom: 'Bennour', prenom: 'Younes', email: 'younes@mail.com', date: '2024-02-15' },
        { id: 'e7', nom: 'Amrani', prenom: 'Ghizlane', email: 'ghizlane@mail.com', date: '2024-02-16' },
        { id: 'e8', nom: 'Sadiqi', prenom: 'Reda', email: 'reda@mail.com', date: '2024-02-17' },
    ]);

    const [learnersSearchTerm, setLearnersSearchTerm] = useState('');
    const [learnersCurrentPage, setLearnersCurrentPage] = useState(1);
    const [enrollmentsCurrentPage, setEnrollmentsCurrentPage] = useState(1);
    const itemsPerPage = 6;

    useEffect(() => {
        if (id && id !== 'new') {
            const foundCourse = getCourse(id);
            if (foundCourse) {
                setCourse({ ...foundCourse, sections: foundCourse.sections || [], semesters: foundCourse.semesters || [] });
                if (foundCourse.sections?.length > 0) setExpandedSectionId(foundCourse.sections[0].id);
            }
        } else if (id === 'new' && !course.id) {
            setCourse(prev => ({ ...prev, id: generateId() }));
        }
    }, [id]);

    const openConfirmModal = (title: string, message: string, onConfirm: () => void, type: 'danger' | 'success' | 'warning' = 'danger', onCancel?: () => void) => setConfirmModal({ isOpen: true, title, message, onConfirm, type, onCancel });

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
            id === 'new' ? await addCourse(course) : await updateCourse(course);

            openConfirmModal('Succès !', 'Le cours a été enregistré avec succès.', () => {
                if (id === 'new' && course.id) {
                    navigate(`/courses/${course.id}`, { replace: true });
                }
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
            }, 'success');
        } catch (error) {
            openConfirmModal('Erreur', 'Une erreur est survenue lors de l\'enregistrement.', () => setConfirmModal(prev => ({ ...prev, isOpen: false })), 'danger');
        } finally {
            setIsSaving(false);
        }
    };

    const addSection = () => {
        const newSection: Section = { id: generateId(), title: 'Nouvelle Section', subSections: [] };
        setCourse(prev => ({ ...prev, sections: [...prev.sections, newSection] }));
        setExpandedSectionId(newSection.id);
    };

    const deleteSection = (sectionId: string) => {
        openConfirmModal('Supprimer la section ?', 'Tout le contenu de cette section sera perdu.', () => {
            setCourse(prev => ({ ...prev, sections: prev.sections.filter(s => s.id !== sectionId) }));
            if (expandedSectionId === sectionId) setExpandedSectionId(null);
        }, 'danger', () => setConfirmModal(prev => ({ ...prev, isOpen: false })));
    };

    const addSubSection = (sectionId: string) => {
        const newSubSection: SubSection = { id: generateId(), title: 'Nouvelle Leçon', content: '', videoUrls: [] };
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
        openConfirmModal('Supprimer la leçon ?', 'Cette action est irréversible.', () => {
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
                            <div><label className="text-xs font-bold text-text-muted uppercase tracking-widest mb-2.5 block">Catégorie</label><input type="text" value={course.category} onChange={(e) => setCourse({ ...course, category: e.target.value })} className="w-full input text-lg" placeholder="Ex: Informatique" /></div>
                            <div><label className="text-xs font-bold text-text-muted uppercase tracking-widest mb-2.5 block">Niveau</label><select value={course.level} onChange={(e) => setCourse({ ...course, level: e.target.value as 'Licence' | 'Master', semesters: [] })} className="w-full input text-lg cursor-pointer"><option value="Licence">Licence</option><option value="Master">Master</option></select></div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="grid grid-cols-1 gap-10">
                <div className="bg-surface rounded-3xl p-8 border border-glass-border shadow-lg">
                    <label className="text-xs font-bold text-text-muted uppercase tracking-widest mb-6 block">Semestres concernés</label>
                    <div className="flex flex-wrap gap-4">
                        {(course.level === 'Master' ? ['S1', 'S2', 'S3', 'S4'] : ['S1', 'S2', 'S3', 'S4', 'S5', 'S6']).map(sem => {
                            const isSelected = course.semesters?.includes(sem);
                            return <button key={sem} onClick={() => { const current = course.semesters || []; setCourse({ ...course, semesters: isSelected ? current.filter(s => s !== sem) : [...current, sem] }); }} className={`w-14 h-14 rounded-2xl text-lg font-bold transition-all flex items-center justify-center border-2 ${isSelected ? 'bg-primary text-white border-primary shadow-lg shadow-primary/25 scale-110' : 'bg-surface-hover text-text-muted border-transparent hover:border-primary/30 hover:bg-primary/5 hover:text-primary'}`}>{sem}</button>;
                        })}
                    </div>
                </div>
                <div className="bg-surface rounded-3xl p-8 border border-glass-border shadow-lg">
                    <label className="text-xs font-bold text-text-muted uppercase tracking-widest mb-4 block">Description détaillée</label>
                    <MockQuill value={course.description} onChange={(c) => setCourse({ ...course, description: c })} className="min-h-[300px]" placeholder="Décrivez les objectifs et le contenu du cours..." />
                </div>
                <div className="bg-surface rounded-3xl p-8 border border-glass-border shadow-lg">
                    <label className="text-xs font-bold text-text-muted uppercase tracking-widest mb-4 block">Prérequis</label>
                    <MockQuill value={course.prerequisites} onChange={(c) => setCourse({ ...course, prerequisites: c })} className="min-h-[200px]" placeholder="Connaissances nécessaires..." />
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
                                    <div className="flex-1 min-w-0">
                                        <input value={section.title} onClick={(e) => e.stopPropagation()} onChange={(e) => { const newSections = [...course.sections]; newSections[idx].title = e.target.value; setCourse({ ...course, sections: newSections }); }} className="bg-transparent w-full text-base font-black focus:outline-none focus:text-primary placeholder-text-muted/30 truncate text-text tracking-tight" placeholder="Titre de la section..." />
                                        <div className="flex items-center gap-2 mt-1"><span className="text-[10px] uppercase font-bold text-text-muted px-1.5 py-0.5 bg-surface-hover rounded">Section {idx + 1}</span><span className="text-[10px] font-medium text-text-muted opacity-60">• {section.subSections.length} leçons</span></div>
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
                            <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted px-2 py-1 bg-surface-hover rounded-lg">Optionnel</span>
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
                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 text-green-500 rounded-full text-[10px] font-black uppercase tracking-wider">
                                        <Check size={14} /> Pool: {course.finalExam.settings?.generatedPool?.length || 0} questions
                                    </div>
                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-[10px] font-black uppercase tracking-wider">
                                        <CheckCircle2 size={14} /> Réussite: {course.finalExam.settings?.passingScore || 70}%
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            openConfirmModal(
                                                'Supprimer l\'examen final ?',
                                                'Cette action est irréversible et supprimera toutes les questions de l\'examen.',
                                                () => setCourse({ ...course, finalExam: undefined }),
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
                                        <button onClick={() => { const current = selectedData.subSection.videoUrls || (selectedData.subSection.videoUrl ? [selectedData.subSection.videoUrl] : []); updateSubSection(selectedData.section.id, selectedData.subSection.id, { videoUrls: [...current, ''] }); }} className="btn-primary !py-2 !px-4 !text-xs flex items-center gap-2 transition-all"><Plus size={14} /> Ajouter une vidéo</button>
                                    </div>
                                    <div className="p-6 space-y-6">
                                        {(selectedData.subSection.videoUrls?.length ? selectedData.subSection.videoUrls : (selectedData.subSection.videoUrl ? [selectedData.subSection.videoUrl] : [])).map((url, vIdx) => {
                                            const embedUrl = getYouTubeEmbedUrl(url);
                                            return (
                                                <div key={vIdx} className="space-y-4 animate-fade-in">
                                                    <div className="flex gap-3">
                                                        <div className="relative flex-1">
                                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted"><Youtube size={18} /></div>
                                                            <input type="text" value={url} onChange={(e) => { const currentUrls = selectedData.subSection.videoUrls || (selectedData.subSection.videoUrl ? [selectedData.subSection.videoUrl] : []); const newUrls = [...currentUrls]; newUrls[vIdx] = e.target.value; updateSubSection(selectedData.section.id, selectedData.subSection.id, { videoUrls: newUrls }); }} className="w-full input !pl-12 !py-3 text-base shadow-inner bg-surface-hover/50 focus:bg-surface-hover" placeholder="Collez le lien YouTube ici..." />
                                                        </div>
                                                        <button onClick={() => { const current = selectedData.subSection.videoUrls || (selectedData.subSection.videoUrl ? [selectedData.subSection.videoUrl] : []); const newUrls = current.filter((_, i) => i !== vIdx); updateSubSection(selectedData.section.id, selectedData.subSection.id, { videoUrls: newUrls }); }} className="p-3 text-text-muted hover:text-error hover:bg-error/10 rounded-xl transition-all border border-transparent hover:border-error/20"><X size={20} /></button>
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
                                    <div className="p-4 border-b border-glass-border bg-surface/50 flex items-center gap-2 text-base font-bold text-text"><div className="p-2 bg-primary/10 text-primary rounded-lg"><FileText size={20} /></div>Contenu de la leçon</div>
                                    <div className="p-6 min-h-[400px]"><MockQuill value={selectedData.subSection.content} onChange={(c) => updateSubSection(selectedData.section.id, selectedData.subSection.id, { content: c })} className="h-full min-h-[350px]" placeholder="Rédigez le contenu détaillé de votre leçon..." /></div>
                                </div>
                            </div>
                            <div className="p-6 md:p-8 border-t border-glass-border bg-surface/90 backdrop-blur-xl flex justify-between items-center shadow-2xl rounded-b-3xl">
                                <button onClick={() => setShowQuizEditor(true)} className={`flex items-center gap-3 px-6 py-3 rounded-2xl text-base font-bold transition-all shadow-lg ${selectedData.subSection.quiz ? 'bg-green-500 text-white shadow-green-500/20' : 'bg-primary/10 text-primary hover:bg-primary hover:text-white shadow-primary/10'}`}>
                                    <HelpCircle size={20} />{selectedData.subSection.quiz ? 'Modifier le Quiz' : 'Ajouter un Quiz'}
                                </button>
                                {selectedData.subSection.quiz && <button onClick={() => openConfirmModal('Supprimer le quiz ?', 'Cette action est irréversible et supprimera toutes les questions.', () => updateSubSection(selectedData.section.id, selectedData.subSection.id, { quiz: undefined }))} className="text-sm font-bold text-error hover:bg-error/10 px-4 py-2 rounded-xl transition-all">Supprimer le quiz</button>}
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
                                    <th className="pb-4">Progression Quiz</th>
                                    <th className="pb-4">Score Total</th>
                                    <th className="pb-4">Examen Final</th>
                                    <th className="pb-4 pr-6 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="space-y-4">
                                {currentItems.map((learner) => (
                                    <tr key={learner.id} className="group hover:scale-[1.01] transition-all duration-300">
                                        <td className="bg-surface-hover/30 rounded-l-2xl py-4 pl-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black">
                                                    {learner.nom[0]}{learner.prenom[0]}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-text">{learner.prenom} {learner.nom}</div>
                                                    <div className="text-xs text-text-muted">{learner.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="bg-surface-hover/30 py-4">
                                            <div className="flex flex-col gap-1.5 min-w-[120px]">
                                                <div className="flex justify-between text-[10px] font-bold">
                                                    <span>{learner.quizzesSubmitted}/{learner.totalQuizzes} quiz</span>
                                                    <span className="text-primary">{Math.round((learner.quizzesSubmitted / learner.totalQuizzes) * 100)}%</span>
                                                </div>
                                                <div className="w-full h-1.5 bg-background rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-primary rounded-full transition-all duration-1000"
                                                        style={{ width: `${(learner.quizzesSubmitted / learner.totalQuizzes) * 100}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="bg-surface-hover/30 py-4">
                                            <div className="font-black text-lg text-primary">{learner.totalQuizScore}%</div>
                                            <div className="text-[10px] uppercase font-bold text-text-muted">Moyenne</div>
                                        </td>
                                        <td className="bg-surface-hover/30 py-4">
                                            {learner.finalExamNote !== null ? (
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
                                                onClick={() => setSelectedLearnerForCorrection(learner)}
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
                                        <td colSpan={5} className="py-20 text-center text-text-muted font-bold">Aucun apprenant trouvé</td>
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
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h3 className="text-2xl font-black text-text flex items-center gap-3">
                                <UserPlus size={28} className="text-primary" />
                                Gestion des Inscriptions
                            </h3>
                            <p className="text-sm text-text-muted mt-1">Approuvez ou refusez les demandes d'accès</p>
                        </div>
                        <div className="px-4 py-2 bg-primary/10 text-primary rounded-2xl font-black text-sm border border-primary/20">
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
                                    <div key={env.id} className="group bg-surface-hover/30 border border-glass-border p-5 rounded-2xl flex items-center justify-between transition-all hover:bg-surface-hover/50 hover:border-primary/30">
                                        <div className="flex items-center gap-5">
                                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary text-xl font-black">
                                                {env.nom[0]}
                                            </div>
                                            <div>
                                                <div className="font-black text-lg text-text">{env.prenom} {env.nom}</div>
                                                <div className="flex items-center gap-3 text-sm text-text-muted">
                                                    <span>{env.email}</span>
                                                    <span className="w-1 h-1 bg-text-muted rounded-full opacity-30" />
                                                    <span>Demandé le {new Date(env.date).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => {
                                                    setPendingEnrollments(prev => prev.filter(p => p.id !== env.id));
                                                    openConfirmModal('Inscription Refusée', `La demande de ${env.prenom} ${env.nom} a été rejetée.`, () => setConfirmModal(prev => ({ ...prev, isOpen: false })), 'danger');
                                                }}
                                                className="p-3 text-error hover:bg-error/10 rounded-xl transition-all border border-transparent hover:border-error/20"
                                                title="Refuser"
                                            >
                                                <UserX size={22} />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setPendingEnrollments(prev => prev.filter(p => p.id !== env.id));
                                                    setEnrolledLearners(prev => [...prev, {
                                                        id: env.id,
                                                        nom: env.nom,
                                                        prenom: env.prenom,
                                                        email: env.email,
                                                        totalQuizScore: 0,
                                                        quizzesSubmitted: 0,
                                                        totalQuizzes: 5,
                                                        finalExamNote: null
                                                    }]);
                                                    openConfirmModal('Inscription Acceptée !', `${env.prenom} ${env.nom} peut maintenant accéder au cours.`, () => setConfirmModal(prev => ({ ...prev, isOpen: false })), 'success');
                                                }}
                                                className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-black shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                                            >
                                                <UserCheck size={20} />
                                                Accepter
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

    return (
        <div className="min-h-screen bg-background text-text p-4 md:p-8 animate-fade-in">
            <style>{PAGE_STYLES}</style>
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 bg-surface/60 p-4 rounded-2xl border border-glass-border backdrop-blur-md shadow-xl">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/courses')} className="p-2 hover:bg-white/10 rounded-xl transition-colors text-text"><X size={20} /></button>
                    <div>
                        <h1 className="text-2xl font-black bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">{id === 'new' ? 'Création de cours' : 'Édition du cours'}</h1>
                        <p className="text-xs text-text-muted font-medium mt-0.5">{course.sections.length} sections • {course.sections.reduce((acc, s) => acc + s.subSections.length, 0)} leçons</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex bg-surface-hover rounded-xl p-1 border border-glass-border font-medium">
                        <button onClick={() => setActiveTab('info')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'info' ? 'bg-primary text-white shadow-lg' : 'text-text-muted hover:text-text'}`}>Informations</button>
                        <button onClick={() => setActiveTab('content')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'content' ? 'bg-primary text-white shadow-lg' : 'text-text-muted hover:text-text'}`}>Contenu</button>
                        <button onClick={() => setActiveTab('learners')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'learners' ? 'bg-primary text-white shadow-lg' : 'text-text-muted hover:text-text'}`}>Apprenants</button>
                        <button onClick={() => setActiveTab('enrollments')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'enrollments' ? 'bg-primary text-white shadow-lg' : 'text-text-muted hover:text-text'}`}>Inscriptions</button>
                    </div>
                    {id !== 'new' && (
                        <div className="flex items-center gap-3">
                            <a
                                href={`/courses/${id}/preview`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-text border border-glass-border flex items-center gap-2 font-bold transition-all"
                                title="Voir l'aperçu apprenant (nouvel onglet)"
                            >
                                <Eye size={20} />
                                Aperçu
                            </a>
                            <button
                                onClick={() => setCourse(prev => ({ ...prev, isPublished: !prev.isPublished }))}
                                className={`px-6 py-2.5 rounded-xl flex items-center gap-2 font-bold transition-all border-2 ${course.isPublished
                                    ? 'bg-green-500/10 text-green-500 border-green-500/30 hover:bg-green-500 hover:text-white'
                                    : 'bg-orange-500/10 text-orange-500 border-orange-500/30 hover:bg-orange-500 hover:text-white'
                                    }`}
                            >
                                {course.isPublished ? <Globe size={20} /> : <Lock size={20} />}
                                {course.isPublished ? 'Publié' : 'Brouillon'}
                            </button>
                        </div>
                    )}
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className={`btn-primary px-8 py-2.5 rounded-xl flex items-center gap-2 font-bold shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all text-base ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        <Save size={20} />
                        {isSaving ? 'Enregistrement...' : 'Enregistrer'}
                    </button>
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
                onConfirm={() => {
                    confirmModal.onConfirm();
                    setConfirmModal(prev => ({ ...prev, isOpen: false }));
                }}
                onCancel={confirmModal.onCancel}
            />
            {showQuizEditor && selectedSubSectionId && <QuizEditorModal initialQuiz={getSelectedSubSection()?.subSection.quiz} onSave={(quiz) => { const sel = getSelectedSubSection(); if (sel) updateSubSection(sel.section.id, sel.subSection.id, { quiz }); setShowQuizEditor(false); }} onClose={() => setShowQuizEditor(false)} isExam={false} />}
            {showFinalExamEditor && (
                <QuizEditorModal
                    title="Configuration de l'Examen Final"
                    description="L'IA analyse l'ensemble du cours (toutes les sections et leçons) pour créer une évaluation complète."
                    maxPoolSize={150}
                    maxSelectionPerType={50}
                    initialQuiz={course.finalExam}
                    isExam={true}
                    onSave={(exam) => {
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
