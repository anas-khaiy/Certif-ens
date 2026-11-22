import React, { useRef, useState } from 'react';
import { X, FileUp, Download, CheckCircle2, AlertCircle, FileJson, FileText } from 'lucide-react';
import QuestionText from './QuestionText';
import type { Question } from '../types';
import { parseQuestionFile, downloadTemplate, JSON_EXAMPLE, CSV_EXAMPLE, JSON_CODE_EXAMPLE, type ParsedImport } from '../utils/questionImport';

interface Props {
    existingQuestions: Question[];
    onImport: (questions: Question[]) => void;
    onClose: () => void;
}

/** Panneau d'import de questions QCU / QCM depuis un fichier JSON, CSV ou Excel. */
const QuestionFileImportPanel: React.FC<Props> = ({ existingQuestions, onImport, onClose }) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [fileName, setFileName] = useState('');
    const [result, setResult] = useState<ParsedImport | null>(null);
    const [loading, setLoading] = useState(false);
    const [tab, setTab] = useState<'json' | 'csv'>('json');

    const existingTexts = new Set(existingQuestions.map(q => (q.text || '').trim().toLowerCase()));
    const newQuestions = (result?.questions || []).filter(q => !existingTexts.has(q.text.trim().toLowerCase()));
    const duplicates = (result?.questions.length || 0) - newQuestions.length;

    const handleFile = async (file?: File) => {
        if (!file) return;
        setLoading(true);
        setFileName(file.name);
        setResult(await parseQuestionFile(file));
        setLoading(false);
        if (inputRef.current) inputRef.current.value = '';
    };

    return (
        <div className="absolute inset-0 z-30 bg-surface flex flex-col animate-fade-in">
            <div className="flex items-center justify-between gap-3 p-4 sm:p-6 border-b border-glass-border">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="p-3 bg-primary/10 rounded-xl text-primary"><FileUp size={22} /></div>
                    <div className="min-w-0">
                        <h3 className="text-lg font-black truncate">Importer des questions depuis un fichier</h3>
                        <p className="text-xs text-text-muted">QCU et QCM — formats JSON ou CSV.</p>
                    </div>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl"><X size={22} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 custom-scrollbar">
                {/* Mode d'emploi */}
                <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 space-y-3">
                    <h4 className="font-bold text-primary">Comment préparer votre fichier</h4>
                    <ol className="list-decimal pl-5 text-sm space-y-1 text-text">
                        <li>Téléchargez un modèle ci-dessous (JSON ou CSV).</li>
                        <li>Remplacez les exemples par vos questions, une question par entrée.</li>
                        <li>Importez le fichier : un aperçu s'affiche avant l'ajout au quiz.</li>
                    </ol>
                    <ul className="text-xs text-text-muted space-y-1 pl-1">
                        <li>• <b>type</b> : <code>QCU</code> (une seule bonne réponse) ou <code>QCM</code> (plusieurs). Facultatif : déduit du nombre de bonnes réponses.</li>
                        <li>• <b>text</b> (JSON) / <b>question</b> (CSV) : l'énoncé.</li>
                        <li>• <b>options</b> : de 2 à 8 choix. CSV : colonnes <code>option1</code>, <code>option2</code>…</li>
                        <li>• <b>correct</b> : la ou les lettres des bonnes réponses (<code>A</code> = 1re option, <code>B</code> = 2e…). Plusieurs : <code>["A","C"]</code> en JSON, <code>A|C</code> en CSV.</li>
                        <li>• Les questions ouvertes ne sont pas importables ici.</li>
                    </ul>
                    <div className="flex flex-wrap gap-2 pt-1">
                        <button onClick={() => downloadTemplate('json')} className="px-3 py-2 rounded-lg border border-glass-border text-xs font-bold hover:bg-surface-hover flex items-center gap-2"><FileJson size={14} /> Modèle JSON <Download size={12} /></button>
                        <button onClick={() => downloadTemplate('csv')} className="px-3 py-2 rounded-lg border border-glass-border text-xs font-bold hover:bg-surface-hover flex items-center gap-2"><FileText size={14} /> Modèle CSV <Download size={12} /></button>
                    </div>
                </div>

                {/* Retours à la ligne et code */}
                <div className="rounded-2xl border border-secondary/30 bg-secondary/5 p-5 space-y-3">
                    <h4 className="font-bold text-secondary">Questions avec plusieurs lignes ou du code (Python, NumPy…)</h4>
                    <ul className="text-xs text-text space-y-1.5 pl-1">
                        <li>• <b>Retour à la ligne</b> : écrivez <code>\n</code> dans le texte (JSON et CSV). Pour une ligne vide, mettez <code>\n\n</code>.</li>
                        <li>• <b>Code</b> : entourez-le de trois apostrophes inversées : <code>```python</code> au début et <code>```</code> à la fin. L'indentation est conservée (utilisez des espaces, par exemple 4 après un <code>for</code>).</li>
                        <li>• <b>Code dans une phrase</b> : mettez-le entre une seule apostrophe inversée, par exemple <code>`np.array`</code>.</li>
                        <li>• <b>Guillemets</b> : en JSON, écrivez <code>\"</code> pour un guillemet « " » dans le texte. Les apostrophes ' n'ont rien de spécial. En CSV, doublez-les (<code>""</code>) et entourez la cellule de guillemets.</li>
                        <li>• <b>Barre oblique inverse</b> : en JSON, écrivez <code>\\</code> pour afficher un « \ ».</li>
                        <li>• <b>Options</b> : <code>&lt;class 'numpy.ndarray'&gt;</code> s'écrit tel quel dans <b>options</b> et s'affiche correctement. Pas besoin de HTML ni de <code>&amp;lt;</code>.</li>
                        <li>• N'utilisez <b>pas</b> de balises HTML (<code>&lt;br&gt;</code>, <code>&lt;pre&gt;</code>) : préférez <code>\n</code> et les blocs <code>```</code>.</li>
                    </ul>
                    <p className="text-xs font-bold text-text-muted">Exemple JSON d'une question avec code :</p>
                    <pre className="text-xs p-4 rounded-xl bg-surface-hover border border-glass-border overflow-x-auto text-text">{JSON_CODE_EXAMPLE}</pre>
                    <p className="text-xs font-bold text-text-muted">Ce que verra l'apprenant :</p>
                    <div className="p-4 rounded-xl border border-glass-border bg-surface">
                        <QuestionText text={JSON.parse(JSON_CODE_EXAMPLE).text} className="font-semibold text-sm" />
                    </div>
                </div>

                {/* Exemples */}
                <div>
                    <div className="flex gap-2 mb-2">
                        {(['json', 'csv'] as const).map(t => (
                            <button key={t} onClick={() => setTab(t)} className={`px-4 py-1.5 rounded-lg text-xs font-bold ${tab === t ? 'bg-primary text-white' : 'bg-surface-hover text-text-muted'}`}>
                                Exemple {t.toUpperCase()}
                            </button>
                        ))}
                    </div>
                    <pre className="text-xs p-4 rounded-xl bg-surface-hover border border-glass-border overflow-x-auto text-text">{tab === 'json' ? JSON_EXAMPLE : CSV_EXAMPLE}</pre>
                    {tab === 'csv' && <p className="text-[11px] text-text-muted mt-1">Séparateur <code>;</code>, <code>,</code> ou tabulation. Enregistrez le fichier en CSV (UTF-8).</p>}
                </div>

                {/* Choix du fichier */}
                <div>
                    <input ref={inputRef} type="file" accept=".json,.csv,.tsv,.txt" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
                    <button onClick={() => inputRef.current?.click()} className="w-full py-5 flex items-center justify-center gap-3 border-2 border-dashed border-primary/40 rounded-2xl text-primary font-bold hover:bg-primary/5 transition-all">
                        <FileUp size={20} /> {fileName ? `Fichier : ${fileName} (cliquer pour changer)` : 'Choisir un fichier à importer'}
                    </button>
                </div>

                {loading && <p className="text-sm text-text-muted">Lecture du fichier…</p>}

                {/* Résultat */}
                {result && !loading && (
                    <div className="space-y-4">
                        {result.errors.length > 0 && (
                            <div className="rounded-xl border border-error/30 bg-error/5 p-4">
                                <p className="font-bold text-error flex items-center gap-2 text-sm"><AlertCircle size={16} /> {result.errors.length} problème(s) détecté(s)</p>
                                <ul className="mt-2 text-xs text-text space-y-1 max-h-40 overflow-y-auto">
                                    {result.errors.map((e, i) => <li key={i}>• {e}</li>)}
                                </ul>
                            </div>
                        )}
                        {result.questions.length > 0 && (
                            <div>
                                <p className="font-bold text-success flex items-center gap-2 text-sm mb-2"><CheckCircle2 size={16} /> {result.questions.length} question(s) valide(s){duplicates > 0 ? ` — ${duplicates} déjà présente(s) dans le quiz (ignorée(s))` : ''}</p>
                                <div className="space-y-2">
                                    {result.questions.map((q, i) => (
                                        <div key={q.id} className={`p-3 rounded-xl border border-glass-border ${existingTexts.has(q.text.trim().toLowerCase()) ? 'opacity-50' : ''}`}>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-[10px] px-2 py-0.5 rounded bg-surface-hover text-text-muted border border-glass-border">{q.type === 'QCU' ? 'Choix Unique' : 'Choix Multiples'}</span>
                                                <span className="text-[10px] text-text-muted">#{i + 1}</span>
                                            </div>
                                            <QuestionText text={q.text} className="text-sm font-semibold" />
                                            <ul className="mt-1 space-y-0.5">
                                                {q.options.map((o, oi) => (
                                                    <li key={oi} className={`text-xs ${q.correctAnswers.includes(oi) ? 'text-success font-bold' : 'text-text-muted'}`}>{String.fromCharCode(65 + oi)}. {o}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="p-4 sm:p-6 border-t border-glass-border flex items-center justify-between gap-3">
                <span className="text-sm text-text-muted"><span className="font-bold text-primary">{newQuestions.length}</span> question(s) à ajouter</span>
                <div className="flex gap-3">
                    <button onClick={onClose} className="px-5 py-2.5 rounded-xl border border-glass-border font-semibold hover:bg-surface-hover">Annuler</button>
                    <button
                        onClick={() => onImport(newQuestions)}
                        disabled={newQuestions.length === 0}
                        className="px-6 py-2.5 rounded-xl bg-primary text-white font-bold disabled:opacity-40 flex items-center gap-2"
                    >
                        <FileUp size={18} /> Ajouter au quiz
                    </button>
                </div>
            </div>
        </div>
    );
};

export default QuestionFileImportPanel;
