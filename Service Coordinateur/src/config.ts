// ─── Central Server Configuration ────────────────────────────────────────────
// Change SERVER_HOST to switch between environments (localhost, IP, domain…)

export const SERVER_HOST = 'localhost';

// ── API base URLs (via Nginx proxy) ─────────────────────────
export const API_FORMATEUR = `http://${SERVER_HOST}:85/api/v1`;
export const API_APPRENANT = `http://${SERVER_HOST}:86/api/v1`;
export const API_ADMIN = `http://${SERVER_HOST}:84/api/v1`;
export const API_COORDINATEUR = `http://${SERVER_HOST}:89/api/v1/coord`;

// ── WebSocket ─────────────────────────────────────────────────────────────────
export const WS_APPRENANT = `ws://${SERVER_HOST}:86/ws`;
export const WS_LIVEKIT = `http://${SERVER_HOST}:88`;

// ── Front-end verify URL (used in certificate share links) ───────────────────
export const VERIFY_URL_FORMATEUR = `http://${SERVER_HOST}:82/verify`;
export const VERIFY_URL_APPRENANT = `http://${SERVER_HOST}:80/verify`;

// ── AI detection service ──────────────────────────────────────────────────────
export const AI_DETECT_URL = `http://${SERVER_HOST}:88/detect`;
