// ─── Central Server Configuration ────────────────────────────────────────────
// Change SERVER_HOST to switch between environments (192.168.20.25, IP, domain…)

export const SERVER_HOST = '192.168.20.25';

// ── API base URLs (Direct to Spring Boot backends, no Nginx proxy) ─────────
export const API_FORMATEUR = `http://${SERVER_HOST}:9092/api/v1`;
export const API_APPRENANT = `http://${SERVER_HOST}:9093/api/v1`;
export const API_ADMIN = `http://${SERVER_HOST}:9091/api/v1`;

// ── WebSocket ─────────────────────────────────────────────────────────────────
export const WS_APPRENANT = `ws://${SERVER_HOST}:9093/ws`;
export const WS_LIVEKIT = `http://${SERVER_HOST}:7880`;

// ── Front-end verify URL (used in certificate share links) ───────────────────
export const VERIFY_URL_FORMATEUR = `http://${SERVER_HOST}:6175/verify`;
export const VERIFY_URL_APPRENANT = `http://${SERVER_HOST}:6175/verify`;

// ── AI detection service ──────────────────────────────────────────────────────
export const AI_DETECT_URL = `http://${SERVER_HOST}:8000/detect`;
