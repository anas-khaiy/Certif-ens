import React from 'react';

/**
 * Affiche l'énoncé d'une question en conservant les retours à la ligne et l'indentation.
 *  - les blocs ```langage ... ``` sont affichés comme du code (police monospace, indentation conservée) ;
 *  - le `code` entre apostrophes inversées est affiché en ligne ;
 *  - les <br>, <pre><code>…</code></pre> et &nbsp; saisis dans un fichier importé sont aussi compris ;
 *  - tout le reste est du texte brut : aucun HTML n'est interprété (sécurisé).
 */
const decodeEntities = (s: string) =>
    s.replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');

export const normalizeQuestionText = (raw: string): string => {
    let t = String(raw ?? '');
    // <pre><code>…</code></pre> ou <pre>…</pre>  →  bloc ```
    t = t.replace(/<pre[^>]*>\s*(?:<code[^>]*>)?([\s\S]*?)(?:<\/code>)?\s*<\/pre>/gi, (_m, code) => '\n```\n' + decodeEntities(String(code).replace(/<br\s*\/?>/gi, '\n')).replace(/^\n+|\n+$/g, '') + '\n```\n');
    // <br> et paragraphes  →  retours à la ligne
    t = t.replace(/<br\s*\/?>/gi, '\n').replace(/<\/p>\s*<p[^>]*>/gi, '\n\n').replace(/<\/?p[^>]*>/gi, '');
    t = t.replace(/&nbsp;/gi, ' ');
    return t;
};

const renderInline = (line: string, keyPrefix: string): React.ReactNode[] => {
    // `code` en ligne
    return line.split(/(`[^`\n]+`)/g).map((part, i) =>
        part.startsWith('`') && part.endsWith('`') && part.length > 2
            ? <code key={`${keyPrefix}-${i}`} className="px-1.5 py-0.5 rounded bg-surface-hover border border-glass-border font-mono text-[0.9em]">{part.slice(1, -1)}</code>
            : <React.Fragment key={`${keyPrefix}-${i}`}>{part}</React.Fragment>
    );
};

interface Props {
    text: string;
    className?: string;
}

const QuestionText: React.FC<Props> = ({ text, className }) => {
    const normalized = normalizeQuestionText(text);
    const segments: { code: boolean; lang?: string; value: string }[] = [];
    const re = /```([a-zA-Z0-9_+-]*)[ \t]*\r?\n?([\s\S]*?)```/g;
    let last = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(normalized)) !== null) {
        if (m.index > last) segments.push({ code: false, value: normalized.slice(last, m.index) });
        segments.push({ code: true, lang: m[1] || undefined, value: m[2].replace(/\n+$/, '') });
        last = m.index + m[0].length;
    }
    if (last < normalized.length) segments.push({ code: false, value: normalized.slice(last) });

    return (
        <div className={className}>
            {segments.map((seg, i) =>
                seg.code ? (
                    <pre key={i} className="my-3 p-4 rounded-xl bg-black/80 text-green-200 text-sm font-mono overflow-x-auto" style={{ whiteSpace: 'pre', tabSize: 4 }}>
                        <code>{seg.value}</code>
                    </pre>
                ) : (
                    <div key={i} style={{ whiteSpace: 'pre-wrap' }}>{renderInline(seg.value.replace(/^\n+|\n+$/g, ''), `t${i}`)}</div>
                )
            )}
        </div>
    );
};

export default QuestionText;
