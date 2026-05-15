import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, AlertCircle, Save, HelpCircle, FileText, CheckCircle2, ChevronDown, ChevronUp, CheckCircle } from 'lucide-react';
import type { Quiz, Question } from '../../types';
import ConfirmationModal from '../ConfirmationModal';

interface QuizEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (quiz: Quiz) => void;
    initialQuiz?: Quiz;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

const QuizEditorModal: React.FC<QuizEditorModalProps> = ({ isOpen, onClose, onSave, initialQuiz }) => {
    const [quiz, setQuiz] = useState<Quiz>({
        id: generateId(),
        title: '',
        questions: []
    });

    const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);

    // Confirmation Modal State
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
    }>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { }
    });

    const openConfirmModal = (title: string, message: string, onConfirm: () => void) => {
        setConfirmModal({
            isOpen: true,
            title,
            message,
            onConfirm
        });
    };

    const closeConfirmModal = () => {
        setConfirmModal({ ...confirmModal, isOpen: false });
    };

    useEffect(() => {
        if (isOpen) {
            const initial = initialQuiz || {
                id: generateId(),
                title: '',
                questions: []
            };
            setQuiz({
                ...initial,
                questions: initial.questions || []
            });
            if (initial.questions && initial.questions.length > 0) {
                setExpandedQuestion(initial.questions[0].id);
            }
        }
    }, [isOpen, initialQuiz]);

    const addQuestion = () => {
        const newQuestion: Question = {
            id: generateId(),
            text: '',
            type: 'QCU',
            options: ['', ''],
            correctAnswers: [0]
        };
        const updatedQuiz = {
            ...quiz,
            questions: [...(quiz.questions || []), newQuestion]
        };
        setQuiz(updatedQuiz);
        setExpandedQuestion(newQuestion.id);
    };

    const updateQuestion = (qId: string, updates: Partial<Question>) => {
        setQuiz({
            ...quiz,
            questions: (quiz.questions || []).map(q => q.id === qId ? { ...q, ...updates } as Question : q)
        });
    };

    const removeQuestion = (qId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        openConfirmModal(
            'Supprimer la question ?',
            'Êtes-vous sûr de vouloir supprimer cette question ?',
            () => {
                setQuiz(prev => ({
                    ...prev,
                    questions: (prev.questions || []).filter(q => q.id !== qId)
                }));
                if (expandedQuestion === qId) {
                    setExpandedQuestion(null);
                }
            }
        );
    };

    const handleOptionChange = (qId: string, optIdx: number, value: string) => {
        const question = (quiz.questions || []).find(q => q.id === qId);
        if (!question) return;

        const newOptions = [...(question.options || [])];
        newOptions[optIdx] = value;

        updateQuestion(qId, { options: newOptions });
    };

    const toggleCorrectOption = (qId: string, optIdx: number) => {
        const question = (quiz.questions || []).find(q => q.id === qId);
        if (!question) return;

        if (question.type === 'QCU') {
            updateQuestion(qId, { correctAnswers: [optIdx] });
        } else if (question.type === 'QCM') {
            const currentCorrect = Array.isArray(question.correctAnswers) ? question.correctAnswers : [];
            if (currentCorrect.includes(optIdx)) {
                updateQuestion(qId, { correctAnswers: currentCorrect.filter(i => i !== optIdx) });
            } else {
                updateQuestion(qId, { correctAnswers: [...currentCorrect, optIdx] });
            }
        }
    };

    if (!isOpen) return null;

    const questions = quiz.questions || [];

    return (
        <div className="w-full relative">
            <div className="bg-surface border border-glass-border w-full rounded-2xl shadow-xl flex flex-col overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-glass-border flex justify-between items-center bg-surface/50 backdrop-blur-md sticky top-0 z-10">
                    <div className="flex-1 text-center">
                        <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent flex items-center gap-2 justify-center">
                            <HelpCircle className="text-primary" /> Éditeur de Quiz
                        </h2>
                        <p className="text-sm text-text-muted mt-1">Créez des évaluations interactives.</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-surface-hover hover:text-error rounded-xl transition-all duration-200 flex-shrink-0">
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 lg:p-8 space-y-8">
                    {/* Basic Info */}
                    <div className="bg-surface/30 p-6 rounded-2xl border border-glass-border space-y-4">
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-bold text-text-muted uppercase tracking-wider">Titre du Quiz</label>
                            <input
                                type="text"
                                value={quiz.title || ''}
                                onChange={(e) => setQuiz({ ...quiz, title: e.target.value })}
                                className="input w-full text-lg font-semibold"
                                placeholder="Ex: Évaluation finale - Module 1"
                                autoFocus
                            />
                        </div>
                    </div>

                    {/* Questions List */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-end mb-2">
                            <h3 className="font-bold text-lg text-text flex items-center gap-2">
                                <FileText size={20} className="text-secondary" />
                                Questions ({questions.length})
                            </h3>
                            <button
                                onClick={addQuestion}
                                className="btn-primary px-4 py-2 text-sm rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all flex items-center gap-2"
                            >
                                <Plus size={18} /> Ajouter
                            </button>
                        </div>

                        {questions.length === 0 ? (
                            <div className="text-center py-16 border-2 border-dashed border-glass-border rounded-2xl bg-surface/20 flex flex-col items-center justify-center text-text-muted gap-4">
                                <div className="w-16 h-16 rounded-full bg-surface-hover flex items-center justify-center">
                                    <AlertCircle className="opacity-50" size={32} />
                                </div>
                                <div>
                                    <p className="font-medium text-lg">Aucune question ajoutée</p>
                                    <p className="text-sm opacity-70">Cliquez sur "Ajouter" pour commencer.</p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {questions.map((q, idx) => (
                                    <div
                                        key={q.id}
                                        className={`rounded-2xl border transition-all duration-300 overflow-hidden ${expandedQuestion === q.id
                                            ? 'bg-surface border-primary/50 shadow-lg ring-1 ring-primary/20'
                                            : 'bg-surface/40 border-glass-border hover:bg-surface-hover/50'
                                            }`}
                                    >
                                        {/* Question Header */}
                                        <div
                                            className="p-4 flex items-center justify-between cursor-pointer select-none"
                                            onClick={() => setExpandedQuestion(expandedQuestion === q.id ? null : q.id)}
                                        >
                                            <div className="flex items-center gap-4 flex-1 overflow-hidden">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${expandedQuestion === q.id ? 'bg-primary text-white' : 'bg-surface-hover text-text-muted'
                                                    }`}>
                                                    {idx + 1}
                                                </div>
                                                <span className={`font-medium truncate ${!q.text ? 'text-text-muted italic' : ''}`}>
                                                    {q.text || 'Nouvelle question...'}
                                                </span>
                                                <span className="text-xs px-2 py-1 rounded-full bg-surface-hover border border-glass-border text-text-muted whitespace-nowrap hidden sm:inline-block">
                                                    {q.type === 'QCU' && 'Choix Unique'}
                                                    {q.type === 'QCM' && 'Choix Multiple'}
                                                    {q.type === 'OPEN' && 'Question Ouverte'}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 ml-4">
                                                <button
                                                    onClick={(e) => removeQuestion(q.id, e)}
                                                    className="p-2 text-text-muted hover:text-error hover:bg-error/10 rounded-lg transition-colors"
                                                    title="Supprimer la question"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                                {expandedQuestion === q.id ? <ChevronUp size={20} className="text-text-muted" /> : <ChevronDown size={20} className="text-text-muted" />}
                                            </div>
                                        </div>

                                        {/* Question Details (Expanded) */}
                                        {expandedQuestion === q.id && (
                                            <div className="p-6 border-t border-glass-border bg-surface/30 animate-fade-in space-y-6">
                                                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                                    <div className="md:col-span-3 space-y-2">
                                                        <label className="text-xs font-bold text-text-muted uppercase">Énoncé de la question</label>
                                                        <input
                                                            type="text"
                                                            value={q.text}
                                                            onChange={(e) => updateQuestion(q.id, { text: e.target.value })}
                                                            className="input w-full"
                                                            placeholder="Posez votre question ici..."
                                                            autoFocus
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-xs font-bold text-text-muted uppercase">Type de réponse</label>
                                                        <select
                                                            value={q.type}
                                                            onChange={(e) => updateQuestion(q.id, {
                                                                type: e.target.value as any,
                                                                options: q.type === 'OPEN' ? ['', ''] : (q.options || ['', '']),
                                                                correctAnswers: e.target.value === 'OPEN' ? [] : [0]
                                                            })}
                                                            className="input w-full bg-surface"
                                                        >
                                                            <option value="QCU">Choix Unique</option>
                                                            <option value="QCM">Choix Multiple</option>
                                                            <option value="OPEN">Question Ouverte</option>
                                                        </select>
                                                    </div>
                                                </div>

                                                {/* Options Editor */}
                                                {(q.type === 'QCU' || q.type === 'QCM') && (
                                                    <div className="space-y-3">
                                                        <div className="flex justify-between items-center">
                                                            <label className="text-xs font-bold text-text-muted uppercase flex items-center gap-2">
                                                                Options de réponse
                                                            </label>
                                                            <span className="text-xs text-primary bg-primary/10 px-2 py-1 rounded-lg">
                                                                Cochez l'icône à gauche pour définir la bonne réponse
                                                            </span>
                                                        </div>

                                                        <div className="grid gap-3">
                                                            {q.options?.map((opt, optIdx) => (
                                                                <div key={optIdx} className="flex items-center gap-3 group">
                                                                    <button
                                                                        onClick={() => toggleCorrectOption(q.id, optIdx)}
                                                                        className={`p-2 rounded-full transition-all duration-200 ${q.correctAnswers.includes(optIdx)
                                                                            ? 'text-success bg-success/10 scale-110'
                                                                            : 'text-text-muted hover:text-text hover:bg-surface-hover'
                                                                            }`}
                                                                        title={
                                                                            q.correctAnswers.includes(optIdx)
                                                                                ? "C'est la bonne réponse"
                                                                                : "Marquer comme bonne réponse"
                                                                        }
                                                                    >
                                                                        {q.correctAnswers.includes(optIdx)
                                                                            ? <CheckCircle2 size={28} fill="currentColor" className="text-success" />
                                                                            : <CheckCircle size={28} />
                                                                        }
                                                                    </button>

                                                                    <div className="flex-1 relative">
                                                                        <input
                                                                            type="text"
                                                                            value={opt}
                                                                            onChange={(e) => handleOptionChange(q.id, optIdx, e.target.value)}
                                                                            className={`input w-full pl-4 pr-10 ${q.correctAnswers.includes(optIdx) ? 'border-success/50 bg-success/5' : ''}`}
                                                                            placeholder={`Option ${optIdx + 1}`}
                                                                        />
                                                                    </div>

                                                                    <button
                                                                        onClick={() => {
                                                                            const newOptions = q.options?.filter((_, i) => i !== optIdx);
                                                                            const newCorrects = q.correctAnswers
                                                                                .filter(i => i !== optIdx)
                                                                                .map(i => i > optIdx ? i - 1 : i);
                                                                            updateQuestion(q.id, {
                                                                                options: newOptions,
                                                                                correctAnswers: newCorrects.length > 0 ? newCorrects : [0]
                                                                            });
                                                                        }}
                                                                        className="p-2 text-text-muted hover:text-error hover:bg-error/10 rounded-lg opacity-100 transition-all"
                                                                        title="Supprimer l'option"
                                                                    >
                                                                        <X size={18} />
                                                                    </button>
                                                                </div>
                                                            ))}
                                                        </div>

                                                        <button
                                                            onClick={() => updateQuestion(q.id, { options: [...(q.options || []), ''] })}
                                                            className="flex items-center gap-2 text-primary hover:bg-primary/10 px-4 py-2 rounded-xl transition-colors text-sm font-semibold w-full justify-center border border-dashed border-primary/30 hover:border-primary mt-2"
                                                        >
                                                            <Plus size={16} /> Ajouter une option
                                                        </button>
                                                    </div>
                                                )}

                                                {q.type === 'OPEN' && (
                                                    <div className="bg-surface-hover/30 p-4 rounded-xl border border-dashed border-glass-border text-center text-text-muted text-sm">
                                                        <FileText className="mx-auto mb-2 opacity-50" size={24} />
                                                        <p>Les questions ouvertes nécessitent une correction manuelle par le formateur.</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-glass-border bg-surface/50 backdrop-blur-md flex justify-between items-center sm:flex-row flex-col-reverse gap-4">
                    <div className="text-sm text-text-muted hidden sm:block">
                        <span className="font-bold text-primary">{questions.length}</span> questions au total
                    </div>
                    <div className="flex gap-4 w-full sm:w-auto">
                        <button
                            onClick={onClose}
                            className="flex-1 sm:flex-none px-6 py-3 rounded-xl border border-glass-border text-text font-semibold transition-all hover:bg-surface-hover hover:border-text-muted/50"
                        >
                            Annuler
                        </button>
                        <button
                            onClick={() => {
                                if (!quiz.title?.trim()) {
                                    alert("Veuillez donner un titre au quiz.");
                                    return;
                                }
                                if (questions.length === 0) {
                                    openConfirmModal(
                                        'Quiz vide',
                                        "Ce quiz n'a pas de questions. Voulez-vous vraiment l'enregistrer ?",
                                        () => onSave(quiz)
                                    );
                                } else {
                                    onSave(quiz);
                                }
                            }}
                            className="flex-1 sm:flex-none bg-primary hover:bg-primary-hover text-white px-8 py-3 rounded-xl shadow-xl shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-1 transition-all flex items-center justify-center gap-2 font-bold"
                        >
                            <Save size={20} /> Enregistrer
                        </button>
                    </div>
                </div>
            </div>

            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                onClose={closeConfirmModal}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
            />
        </div>
    );
};

export default QuizEditorModal;
