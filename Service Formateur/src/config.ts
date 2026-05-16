// ─── Central Server Configuration ────────────────────────────────────────────
// Change SERVER_HOST to switch between environments (localhost, IP, domain…)

export const SERVER_HOST = 'certif.fun';

// ── API base URLs (Via Nginx HTTPS Proxy) ──────────────────────────────────
export const API_FORMATEUR = `https://${SERVER_HOST}:5444/api/v1`;
export const API_APPRENANT = `https://${SERVER_HOST}:5445/api/v1`;
export const API_ADMIN = `https://${SERVER_HOST}:5443/api/v1`;

// ── WebSocket ─────────────────────────────────────────────────────────────────
export const WS_APPRENANT = `wss://${SERVER_HOST}:5445/ws`;
export const WS_LIVEKIT = `https://${SERVER_HOST}:5447`;

// ── Front-end verify URL (used in certificate share links) ───────────────────
// These point to the Apprenant FRONTEND app (port 443 = default HTTPS, no port needed)
// because /verify/:id is a React route, NOT a backend API route.
export const VERIFY_URL_FORMATEUR = `https://${SERVER_HOST}/verify`;
export const VERIFY_URL_APPRENANT = `https://${SERVER_HOST}/verify`;

// ── AI detection service ──────────────────────────────────────────────────────
export const AI_DETECT_URL = `https://${SERVER_HOST}:5446/detect`;
