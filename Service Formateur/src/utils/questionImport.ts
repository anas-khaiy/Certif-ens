import type { Question } from '../types';

export interface ParsedImport {
    questions: Question[];
    errors: string[];
}

const LETTERS = 'ABCDEFGHIJKL';
const MAX_OPTIONS = 8;
const newId = () => Math.random().toString(36).substr(2, 9);

const stripAccents = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '');
const normKey = (k: string) => stripAccents(String(k)).toLowerCase().replace(/[\s_\-]/g, '');

// ─── Exemples & modèles ─────────────────────────────────────────────────────────

export const JSON_EXAMPLE = `{
  "questions": [
    {
      "type": "QCU",
      "text": "Quelle est la capitale du Maroc ?",
      "options": ["Casablanca", "Rabat", "Marrakech", "Fès"],
      "correct": "B"
    },
    {
      "type": "QCM",
      "text": "Quels langages sont typés dynamiquement ?",
      "options": ["Python", "Java", "JavaScript", "C"],
      "correct": ["A", "C"]
    }
  ]
}`;

export const CSV_EXAMPLE = [
    'type;question;option1;option2;option3;option4;correct',
    'QCU;Quelle est la capitale du Maroc ?;Casablanca;Rabat;Marrakech;Fès;B',
    'QCM;Quels langages sont typés dynamiquement ?;Python;Java;JavaScript;C;A|C',
    'QCU;"Que renvoie ce code ?\\n```python\\nimport numpy as np\\na = np.array([1, 2, 3])\\nprint(type(a))\\n```";<class \'numpy.ndarray\'>;<class \'list\'>;<class \'int\'>;<class \'tuple\'>;A',
].join('\n');

/** Exemple JSON d'une question contenant du code sur plusieurs lignes. */
export const JSON_CODE_EXAMPLE = [
    '{',
    '  "type": "QCU",',
    '  "text": "Que renvoie ce code ?\\n\\n```python\\nimport numpy as np\\n\\na = np.array([1, 2, 3])\\nfor x in a:\\n    print(x * 2)\\n```",',
    '  "options": ["<class \'numpy.ndarray\'>", "[2, 4, 6]", "2 4 6 (une valeur par ligne)", "Une erreur"],',
    '  "correct": "C"',
    '}',
].join('\n');

const downloadBlob = (content: BlobPart, filename: string, mime: string) => {
    const url = URL.createObjectURL(new Blob([content], { type: mime }));
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
};

export const downloadTemplate = (kind: 'json' | 'csv') => {
    if (kind === 'json') {
        downloadBlob(JSON_EXAMPLE, 'modele_questions.json', 'application/json');
    } else if (kind === 'csv') {
        // BOM UTF-8 : Excel affiche correctement les accents
        downloadBlob('﻿' + CSV_EXAMPLE, 'modele_questions.csv', 'text/csv;charset=utf-8');
    }
};

// ─── Normalisation d'une question ────────────────────────────────────────────────

const toTokens = (raw: any): string[] => {
    if (raw === undefined || raw === null || raw === '') return [];
    if (Array.isArray(raw)) return raw.flatMap(toTokens);
    return String(raw).split(/[|;,+]/).map(t => t.trim()).filter(Boolean);
};

/** Convertit une valeur « bonne réponse » en indices 0-based, ou null si invalide. */
const resolveCorrect = (raw: any, options: string[], numbersAreZeroBased: boolean): number[] | null => {
    const tokens = toTokens(raw);
    if (tokens.length === 0) return null;
    const result: number[] = [];
    for (const tok of tokens) {
        let idx = -1;
        if (/^[A-La-l]$/.test(tok)) {
            idx = LETTERS.indexOf(tok.toUpperCase());
        } else if (/^\d+$/.test(tok)) {
            idx = parseInt(tok, 10) - (numbersAreZeroBased ? 0 : 1);
        } else {
            idx = options.findIndex(o => o.trim().toLowerCase() === tok.toLowerCase());
        }
        if (idx < 0 || idx >= options.length) return null;
        if (!result.includes(idx)) result.push(idx);
    }
    return result.sort((a, b) => a - b);
};

/** Construit une question à partir d'un objet « souple » (JSON ou ligne de tableau). */
const buildQuestion = (obj: Record<string, any>, label: string, errors: string[]): Question | null => {
    // Clés insensibles à la casse / aux accents / séparateurs
    const map: Record<string, any> = {};
    Object.keys(obj).forEach(k => { map[normKey(k)] = obj[k]; });
    const pick = (...keys: string[]) => {
        for (const k of keys) if (map[k] !== undefined && map[k] !== '') return map[k];
        return undefined;
    };

    const text = String(pick('text', 'question', 'enonce', 'intitule', 'titre') ?? '').trim();
    if (!text) { errors.push(`${label} : énoncé de la question manquant.`); return null; }

    // Options : tableau, ou colonnes option1..option8 / choix1.. / a, b, c...
    let options: string[] = [];
    const rawOptions = pick('options', 'choices', 'choix', 'propositions', 'reponses');
    if (Array.isArray(rawOptions)) {
        options = rawOptions.map(o => String(o ?? '').trim());
    } else {
        for (let i = 1; i <= MAX_OPTIONS; i++) {
            const v = pick(`option${i}`, `choix${i}`, `proposition${i}`, `reponse${i}`, `option${LETTERS[i - 1].toLowerCase()}`);
            options.push(v === undefined ? '' : String(v).trim());
        }
    }
    options = options.filter(o => o !== '');
    if (options.length < 2) { errors.push(`${label} : au moins 2 options sont nécessaires.`); return null; }
    if (options.length > MAX_OPTIONS) options = options.slice(0, MAX_OPTIONS);

    // Type
    const typeRaw = String(pick('type') ?? '').trim().toUpperCase();
    if (typeRaw === 'OPEN' || typeRaw === 'OUVERTE' || typeRaw === 'QO') {
        errors.push(`${label} : les questions ouvertes ne sont pas supportées par l'import (QCU et QCM uniquement).`);
        return null;
    }
    if (typeRaw && typeRaw !== 'QCU' && typeRaw !== 'QCM') {
        errors.push(`${label} : type « ${typeRaw} » inconnu (utilisez QCU ou QCM).`);
        return null;
    }

    // Bonnes réponses : "correctAnswers" (numérique) = indices à partir de 0 (format interne), "correct" = lettres A, B, C…
    const zeroBased = map['correctanswers'] !== undefined && map['correct'] === undefined;
    const rawCorrect = pick('correct', 'correctanswers', 'correctanswer', 'reponse', 'bonnereponse', 'bonnesreponses', 'answer', 'answers');
    const corrects = resolveCorrect(rawCorrect, options, zeroBased);
    if (!corrects) { errors.push(`${label} : bonne(s) réponse(s) manquante(s) ou invalide(s) (utilisez les lettres A, B, C…).`); return null; }

    const type: 'QCU' | 'QCM' = typeRaw ? (typeRaw as 'QCU' | 'QCM') : (corrects.length > 1 ? 'QCM' : 'QCU');
    if (type === 'QCU' && corrects.length !== 1) { errors.push(`${label} : une question QCU doit avoir exactement une bonne réponse.`); return null; }

    return { id: newId(), type, text, options, correctAnswers: corrects };
};

// ─── Lecteurs de fichiers ────────────────────────────────────────────────────────

const parseJson = (text: string): ParsedImport => {
    const errors: string[] = [];
    let data: any;
    try { data = JSON.parse(text.replace(/^﻿/, '')); }
    catch (e: any) { return { questions: [], errors: [`Fichier JSON invalide : ${e.message}`] }; }
    const list = Array.isArray(data) ? data : (Array.isArray(data?.questions) ? data.questions : null);
    if (!list) return { questions: [], errors: ['Format JSON non reconnu : attendu un tableau de questions, ou un objet { "questions": [ ... ] }.'] };
    const questions: Question[] = [];
    list.forEach((item: any, i: number) => {
        if (!item || typeof item !== 'object') { errors.push(`Question ${i + 1} : format invalide.`); return; }
        const q = buildQuestion(item, `Question ${i + 1}`, errors);
        if (q) questions.push(q);
    });
    return { questions, errors };
};

/** Lecteur CSV simple : gère les guillemets et les séparateurs ; , ou tabulation. */
const parseCsvRows = (text: string): string[][] => {
    const clean = text.replace(/^﻿/, '');
    const firstLine = clean.split(/\r?\n/)[0] || '';
    const counts: Record<string, number> = { ';': 0, ',': 0, '\t': 0 };
    for (const ch of firstLine) if (ch in counts) counts[ch]++;
    const delim = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];

    const rows: string[][] = [];
    let row: string[] = [];
    let field = '';
    let inQuotes = false;
    for (let i = 0; i < clean.length; i++) {
        const c = clean[i];
        if (inQuotes) {
            if (c === '"' && clean[i + 1] === '"') { field += '"'; i++; }
            else if (c === '"') inQuotes = false;
            else field += c;
        } else if (c === '"') inQuotes = true;
        else if (c === delim) { row.push(field); field = ''; }
        else if (c === '\n' || c === '\r') {
            if (c === '\r' && clean[i + 1] === '\n') i++;
            row.push(field); field = '';
            if (row.some(f => f.trim() !== '')) rows.push(row);
            row = [];
        } else field += c;
    }
    row.push(field);
    if (row.some(f => f.trim() !== '')) rows.push(row);
    return rows;
};

const rowsToQuestions = (rows: any[][], unescapeNewlines = false): ParsedImport => {
    if (rows.length < 2) return { questions: [], errors: ['Le fichier doit contenir une ligne d\'en-tête puis au moins une question.'] };
    const header = rows[0].map(h => String(h ?? ''));
    const errors: string[] = [];
    const questions: Question[] = [];
    rows.slice(1).forEach((r, i) => {
        if (!r.some(v => String(v ?? '').trim() !== '')) return;
        const obj: Record<string, any> = {};
        header.forEach((h, c) => {
            if (!h) return;
            const v = r[c] ?? '';
            // Dans un CSV, \n tapé à la main = retour à la ligne
            obj[h] = unescapeNewlines && typeof v === 'string' ? v.replace(/\\n/g, '\n') : v;
        });
        const q = buildQuestion(obj, `Ligne ${i + 2}`, errors);
        if (q) questions.push(q);
    });
    return { questions, errors };
};

export const parseQuestionFile = async (file: File): Promise<ParsedImport> => {
    const name = file.name.toLowerCase();
    try {
        if (name.endsWith('.json')) return parseJson(await file.text());
        if (name.endsWith('.csv') || name.endsWith('.txt') || name.endsWith('.tsv')) return rowsToQuestions(parseCsvRows(await file.text()), true);
        return { questions: [], errors: ['Format non supporté. Utilisez un fichier .json ou .csv.'] };
    } catch (e: any) {
        return { questions: [], errors: [`Impossible de lire le fichier : ${e?.message || e}`] };
    }
};
