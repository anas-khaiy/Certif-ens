/**
 * Supprime les caractères Unicode invisibles que les LLM insèrent
 * parfois dans le HTML (zero-width, bidi controls, soft hyphens, etc.)
 * et les styles inline qui forcent la césure des mots.
 * On garde \n, \r, \t pour ne pas casser les blocs <pre>.
 */
const INVISIBLE_CHARS = /[\p{Cc}\p{Cf}]/gu;

const KEEP_CODES = new Set([0x09, 0x0a, 0x0d]); // tab, LF, CR

const stripInvisible = (html: string): string =>
    html.replace(INVISIBLE_CHARS, (ch) => (KEEP_CODES.has(ch.charCodeAt(0)) ? ch : ''));

const BAD_INLINE_STYLE = /(?:word-break|overflow-wrap|word-wrap)\s*:\s*[^;"']+[;]?/gi;

const cleanStyleAttr = (html: string): string =>
    html.replace(/style\s*=\s*"([^"]*)"/gi, (_, styles: string) => {
        const cleaned = styles.replace(BAD_INLINE_STYLE, '').trim().replace(/\s{2,}/g, ' ');
        return cleaned ? `style="${cleaned}"` : '';
    });

/**
 * Recolleur de mots scindés par un tiret ou un soft-hyphen suivi d'un retour à la ligne
 * (ex: "autom-\nated" -> "automated", "trigge-<br>ring" -> "triggering", "autom-</p><p>ated" -> "automated").
 * Préserve les blocs <pre> pour ne pas altérer le code source.
 */
const rejoinHyphenatedWords = (html: string): string => {
    if (!html) return '';
    const parts = html.split(/(<pre[\s\S]*?<\/pre>)/gi);
    return parts.map((part, index) => {
        if (index % 2 === 1) return part; // Conserver les blocs de code intacts
        return part
            // Mots avec tiret ou soft-hyphen (\u00ad) suivi d'un saut de ligne (\n, <br>, </p><p>)
            .replace(/([\p{L}]{2,})[-\u00ad]\s*(?:<br\s*\/?>|\r?\n|<\/p>\s*<p[^>]*>|<\/div>\s*<div[^>]*>)+\s*([\p{L}]{2,})/gu, '$1$2')
            // Mots coupés après une apostrophe (ex: d'<br>apprentissage -> d'apprentissage)
            .replace(/([\p{L}]['’])\s*(?:<br\s*\/?>|\r?\n|<\/p>\s*<p[^>]*>|<\/div>\s*<div[^>]*>)+\s*([\p{L}]+)/giu, '$1$2')
            // Entité HTML &shy; suivie d'un saut de ligne
            .replace(/([\p{L}]{2,})&shy;\s*(?:<br\s*\/?>|\r?\n|<\/p>\s*<p[^>]*>|<\/div>\s*<div[^>]*>)+\s*([\p{L}]{2,})/giu, '$1$2')
            // Supprimer les soft-hyphens orphelins
            .replace(/&shy;|\u00ad/gi, '');
    }).join('');
};

/**
 * Remplace les espaces insécables (&nbsp; et \u00a0) par des espaces normaux
 * afin de permettre au navigateur de faire les retours à la ligne entre les mots,
 * évitant ainsi que toute la phrase soit vue comme un seul mot géant découpé en plein milieu.
 */
const normalizeSpaces = (html: string): string => {
    if (!html) return '';
    const parts = html.split(/(<pre[\s\S]*?<\/pre>)/gi);
    return parts.map((part, index) => {
        if (index % 2 === 1) return part; // Conserver les blocs de code intacts
        return part.replace(/&nbsp;|\u00a0/gu, ' ');
    }).join('');
};

/**
 * Normalise les listes Quill (Quill 2 utilise <ol><li data-list="bullet"> pour les puces)
 * en balises HTML standard <ul><li> et <ol><li> afin qu'elles soient parfaitement reconnues
 * par le navigateur et affichent les puces et numéros.
 */
const cleanQuillLists = (html: string): string => {
    if (!html) return '';
    const parts = html.split(/(<pre[\s\S]*?<\/pre>)/gi);
    return parts.map((part, index) => {
        if (index % 2 === 1) return part; // Conserver les blocs de code intacts

        let res = part;
        // Supprimer les spans de support visuel interne à Quill s'ils existent
        res = res.replace(/<span\s+class="ql-ui"[^>]*><\/span>/gi, '');

        // Convertir les <ol> qui contiennent data-list="bullet" en <ul>
        res = res.replace(/<ol\b([^>]*)>([\s\S]*?)<\/ol>/gi, (match, attrs, inner) => {
            if (/data-list=["']bullet["']/i.test(inner)) {
                const cleanedInner = inner.replace(/\s*data-list=["']bullet["']/gi, '');
                return `<ul${attrs}>${cleanedInner}</ul>`;
            }
            const cleanedInner = inner.replace(/\s*data-list=["']ordered["']/gi, '');
            return `<ol${attrs}>${cleanedInner}</ol>`;
        });

        return res;
    }).join('');
};

export const sanitizeRichHtml = (html: string): string =>
    cleanStyleAttr(stripInvisible(normalizeSpaces(rejoinHyphenatedWords(cleanQuillLists(html || '')))));
