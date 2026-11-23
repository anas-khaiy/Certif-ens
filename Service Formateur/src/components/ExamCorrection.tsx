import { useState } from 'react';
import QuestionText from './QuestionText';

export interface ReviewItem {
    question: any;
    answer: any;
    isCorrect: boolean;
    feedback?: string;
    gradedBy?: 'ai' | 'manual';
}

/**
 * Correction détaillée affichée après un examen / quiz supervisé :
 * chaque question avec la réponse de l'étudiant, la bonne réponse et les erreurs.
 */
export default function ExamCorrection({ items }: { items: ReviewItem[] }) {
    const [onlyErrors, setOnlyErrors] = useState(false);
    if (!items || items.length === 0) return null;

    const isAnswered = (it: ReviewItem) => Array.isArray(it.answer) ? it.answer.length > 0 : (typeof it.answer === 'string' ? it.answer.trim().length > 0 : !!it.answer);
    const isPending = (it: ReviewItem) => it.question.type === 'OPEN' && !(it.gradedBy === 'ai');
    const correctCount = items.filter(i => i.isCorrect).length;
    const wrongCount = items.filter(i => !i.isCorrect && !isPending(i)).length;
    const visible = items.map((it, idx) => ({ it, idx })).filter(({ it }) => !onlyErrors || (!it.isCorrect && !isPending(it)));

    return (
        <div className="text-left space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-2xl font-black text-text">Correction détaillée</h3>
                <div className="flex flex-wrap items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-green-600 text-white text-xs font-black">✓ {correctCount} correcte{correctCount > 1 ? 's' : ''}</span>
                    <span className="px-3 py-1 rounded-full bg-red-600 text-white text-xs font-black">✗ {wrongCount} erronée{wrongCount > 1 ? 's' : ''}</span>
                    <button
                        type="button"
                        onClick={() => setOnlyErrors(v => !v)}
                        className={`px-3 py-1 rounded-full text-xs font-black border-2 transition-all ${onlyErrors ? 'bg-primary text-white border-primary' : 'bg-surface text-text border-glass-border hover:border-primary'}`}
                    >
                        {onlyErrors ? 'Afficher toutes les questions' : 'Voir seulement les erreurs'}
                    </button>
                </div>
            </div>

            {visible.length === 0 && (
                <div className="p-6 rounded-2xl bg-surface border-2 border-green-600/40 text-center font-bold text-text">Aucune erreur 🎉</div>
            )}

            {visible.map(({ it, idx }) => {
                const q = it.question;
                const pending = isPending(it);
                const answered = isAnswered(it);
                const status = pending ? 'pending' : it.isCorrect ? 'ok' : 'ko';
                const border = status === 'ok' ? 'border-green-600/60' : status === 'ko' ? 'border-red-600/60' : 'border-orange-500/60';
                const headBg = status === 'ok' ? 'bg-green-600' : status === 'ko' ? 'bg-red-600' : 'bg-orange-500';
                const label = status === 'ok' ? '✓ Correcte' : status === 'ko' ? (answered ? '✗ Incorrecte' : '✗ Non répondue') : 'À corriger par le formateur';
                const selected: string[] = q.type === 'QCM' ? (Array.isArray(it.answer) ? it.answer : []) : (it.answer ? [it.answer] : []);
                const correctOptions: string[] = (q.correctAnswers || []).map((i: number) => q.options?.[i]).filter((x: any) => x !== undefined);

                return (
                    <div key={q.id ?? idx} className={`bg-surface rounded-3xl border-2 ${border} overflow-hidden shadow-md`}>
                        <div className={`flex flex-wrap items-center gap-3 px-5 py-3 text-white ${headBg}`}>
                            <span className="text-xs font-black uppercase tracking-wider">Question {idx + 1}</span>
                            <span className="text-[11px] font-black uppercase opacity-90">{q.type === 'QCM' ? 'Choix multiples' : q.type === 'QCU' ? 'Choix unique' : 'Question ouverte'}</span>
                            <span className="ml-auto text-xs font-black">{label}</span>
                        </div>
                        <div className="p-5 sm:p-6 space-y-4">
                            <QuestionText text={q.text} className="font-bold text-base sm:text-lg leading-relaxed text-text" />

                            {q.type === 'OPEN' ? (
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-xs font-black uppercase text-text-muted mb-1">Votre réponse</p>
                                        <div className="p-4 rounded-xl border-2 border-glass-border bg-background text-sm font-semibold text-text whitespace-pre-wrap break-words">
                                            {answered ? it.answer : <span className="italic text-text-muted">Aucune réponse</span>}
                                        </div>
                                    </div>
                                    {it.feedback && (
                                        <div className="p-4 rounded-xl border-2 border-primary/40 bg-primary/5 text-sm font-semibold text-text">
                                            <span className="font-black text-primary">Commentaire : </span>{it.feedback}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-2.5">
                                    {q.options?.map((opt: string, oIdx: number) => {
                                        const isSel = selected.includes(opt);
                                        const isRight = correctOptions.includes(opt);
                                        let cls = 'border-slate-300 dark:border-slate-600 bg-background text-text';
                                        let tag = '';
                                        let tagCls = '';
                                        if (isSel && isRight) { cls = 'border-green-600 bg-green-600/15 text-text'; tag = '✓ Votre réponse (correcte)'; tagCls = 'bg-green-600 text-white'; }
                                        else if (isSel && !isRight) { cls = 'border-red-600 bg-red-600/15 text-text'; tag = '✗ Votre réponse (erronée)'; tagCls = 'bg-red-600 text-white'; }
                                        else if (!isSel && isRight) { cls = 'border-green-600 border-dashed bg-green-600/5 text-text'; tag = q.type === 'QCM' ? 'Bonne réponse manquée' : 'Bonne réponse'; tagCls = 'bg-green-700 text-white'; }
                                        return (
                                            <div key={oIdx} className={`flex items-center gap-3 p-3 rounded-xl border-2 ${cls}`}>
                                                <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-surface-hover flex items-center justify-center text-xs font-black text-text-muted">{String.fromCharCode(65 + oIdx)}</span>
                                                <span className="flex-1 min-w-0 text-sm font-semibold break-words" style={{ whiteSpace: 'pre-wrap' }}>{opt}</span>
                                                {tag && <span className={`flex-shrink-0 px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${tagCls}`}>{tag}</span>}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
