import { CheckCircle, AlertTriangle, Clock } from 'lucide-react';

interface Props {
    /** Note sur 20 déjà formatée */
    scoreOn20: string | number;
    percent: number;
    correct?: number;
    total?: number;
    /** true = réussi, false = échoué, null/undefined = non affiché */
    passed?: boolean | null;
    /** correction manuelle en attente */
    pending?: boolean;
    finishLabel?: string;
    onFinish: () => void;
}

/** Bandeau de score + bouton « Terminer », affiché en haut et en bas des résultats. */
export default function QuizResultBar({ scoreOn20, percent, correct, total, passed, pending, finishLabel = 'Terminer', onFinish }: Props) {
    const tone = pending ? 'border-orange-500' : passed === false ? 'border-red-600' : 'border-green-600';
    return (
        <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-surface border-2 ${tone} shadow-md text-left`}>
            <div className="flex items-center gap-4 min-w-0">
                <div className="text-4xl font-black text-primary whitespace-nowrap">{scoreOn20}<span className="text-xl text-text-muted">/20</span></div>
                <div className="min-w-0">
                    <p className="text-sm font-black text-text">{percent}%{typeof correct === 'number' && typeof total === 'number' ? ` · ${correct} / ${total} correctes` : ''}</p>
                    {pending ? (
                        <p className="text-xs font-black uppercase text-orange-500 flex items-center gap-1"><Clock size={12} /> En attente de correction</p>
                    ) : passed === true ? (
                        <p className="text-xs font-black uppercase text-green-600 flex items-center gap-1"><CheckCircle size={12} /> Réussi</p>
                    ) : passed === false ? (
                        <p className="text-xs font-black uppercase text-red-600 flex items-center gap-1"><AlertTriangle size={12} /> Non réussi</p>
                    ) : null}
                </div>
            </div>
            <button type="button" onClick={onFinish} className="px-8 py-3 bg-primary text-white rounded-xl font-black shadow-lg hover:bg-primary-hover transition-all whitespace-nowrap">
                {finishLabel}
            </button>
        </div>
    );
}
