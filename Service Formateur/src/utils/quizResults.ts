/**
 * Plusieurs tentatives : on retient la MEILLEURE par quiz
 * (note la plus haute, à égalité une tentative réussie, puis la plus récente).
 */
export const isBetterAttempt = (a: any, b: any): boolean => {
    const sa = Number(a?.score) || 0;
    const sb = Number(b?.score) || 0;
    if (sa !== sb) return sa > sb;
    const pa = a?.passed ? 1 : 0;
    const pb = b?.passed ? 1 : 0;
    if (pa !== pb) return pa > pb;
    return String(a?.attemptedAt || '') > String(b?.attemptedAt || '');
};

export const bestQuizResult = (results: any[] | undefined | null, quizId: string): any | undefined => {
    let best: any | undefined;
    for (const r of results || []) {
        if (String(r?.quizId) !== String(quizId)) continue;
        if (!best || isBetterAttempt(r, best)) best = r;
    }
    return best;
};
