// ─── Central Server Configuration ────────────────────────────────────────────
// All APIs go through port 80 via nginx path-based routing.
// Works on both localhost (dev) and app25.ens-marrakech.ac.ma (production).

// ── API base URLs (relative paths → always port 80) ──────────────────────────
export const API_ADMIN        = '/api/admin/api/v1';
export const API_FORMATEUR    = '/api/formateur/api/v1';
export const API_APPRENANT    = '/api/apprenant/api/v1';
export const API_COORDINATEUR = '/api/coordinateur/api/v1/coord';

// ── WebSocket (through nginx on port 80) ─────────────────────────────────────
export const WS_APPRENANT   = `ws://${window.location.host}/ws`;
export const WS_LIVEKIT     = `ws://${window.location.host}/livekit`;

// ── Front-end verify URL ──────────────────────────────────────────────────────
export const VERIFY_URL_FORMATEUR = `${window.location.origin}/formateur/verify`;
export const VERIFY_URL_APPRENANT = `${window.location.origin}/verify`;

// ── AI detection service ──────────────────────────────────────────────────────
export const AI_DETECT_URL = '/api/ai/detect';
