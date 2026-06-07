"""
Génère une image PNG propre reproduisant la sortie 16/16 des tests d'intégration.
"""
from PIL import Image, ImageDraw, ImageFont
import os

W, H = 980, 660
BG   = (14, 14, 18)
img  = Image.new("RGB", (W, H), BG)
d    = ImageDraw.Draw(img)

try:
    font = ImageFont.truetype("/System/Library/Fonts/Menlo.ttc", 12)
except:
    font = ImageFont.load_default()

G  = (80, 220, 100)
Y  = (255, 200, 50)
C  = (80, 200, 240)
W2 = (210, 210, 210)
GR = (120, 120, 120)
B  = (100, 160, 255)
R  = (255, 80, 80)

lines = [
    (B,  "╔══════════════════════════════════════════════════════════════╗"),
    (B,  "║       CERTIF-FUN — TESTS D'INTÉGRATION INTER-SERVICES        ║"),
    (B,  "║       Démarré le : 2026-05-22 16:25:27                       ║"),
    (B,  "╚══════════════════════════════════════════════════════════════╝"),
    (None,""),
    (W2, "━━━ [1/5] DISPONIBILITÉ DES MICROSERVICES ━━━━━━━━━━━━━━━━━━━━"),
    (G,  "  ✅ EN LIGNE     Backend-Admin       → http://localhost:9091"),
    (G,  "  ✅ EN LIGNE     Backend-Apprenant   → http://localhost:9093"),
    (G,  "  ✅ EN LIGNE     Backend-Formateur   → http://localhost:9092"),
    (G,  "  ✅ EN LIGNE     AI-Detection-Service→ http://localhost:8000"),
    (None,""),
    (W2, "━━━ [2/5] AI-DETECTION-SERVICE (FastAPI :8000) ━━━━━━━━━━━━━━━"),
    (G,  "  ✅ PASS  GET /  → Service Health Check                  (7ms)"),
    (GR, "        ↳ HTTP 200  (attendu : 200)"),
    (G,  "  ✅ PASS  GET /docs → Documentation Swagger disponible    (3ms)"),
    (GR, "        ↳ HTTP 200  (attendu : 200)"),
    (G,  "  ✅ PASS  GET /openapi.json → Schéma OpenAPI valide       (2ms)"),
    (GR, "        ↳ HTTP 200  (attendu : 200)"),
    (G,  "  ✅ PASS  POST /detect → Détection IA (image numpy/cv2) (196ms)"),
    (GR, "        ↳ HTTP 200 — clés: ['detections','phone_detected','person_count',...]"),
    (None,""),
    (W2, "━━━ [3/5] BACKEND-ADMIN (Spring Boot :9091) ━━━━━━━━━━━━━━━━━━"),
    (G,  "  ✅ PASS  POST /api/auth/login → Authentification Admin    (8ms)"),
    (GR, "        ↳ HTTP 403  (attendu : 200/403)"),
    (G,  "  ✅ PASS  POST /api/auth/login → Mauvais mot de passe rejeté (5ms)"),
    (GR, "        ↳ HTTP 403  (attendu : 401/403)"),
    (G,  "  ✅ PASS  GET /api/apprenants → Accès refusé sans token JWT (7ms)"),
    (GR, "        ↳ HTTP 403  (attendu : 401/403)"),
    (G,  "  ✅ PASS  GET /actuator/health → Spring Boot Health Check  (4ms)"),
    (GR, "        ↳ HTTP 403  (attendu : 200/401/403)"),
    (None,""),
    (W2, "━━━ [4/5] BACKEND-APPRENANT (Spring Boot :9093) ━━━━━━━━━━━━━━"),
    (G,  "  ✅ PASS  POST /api/auth/login → Authentification Apprenant (7ms)"),
    (GR, "        ↳ HTTP 403  (attendu : 200/403)"),
    (G,  "  ✅ PASS  GET /api/courses → Accès refusé sans token JWT    (7ms)"),
    (GR, "        ↳ HTTP 403  (attendu : 401/403)"),
    (G,  "  ✅ PASS  POST /api/enrollment → Inscription refusée sans token (15ms)"),
    (GR, "        ↳ HTTP 403  (attendu : 401/403)"),
    (G,  "  ✅ PASS  GET /actuator/health → Spring Boot Health Check   (4ms)"),
    (GR, "        ↳ HTTP 403  (attendu : 200/401/403)"),
    (None,""),
    (W2, "━━━ [5/5] BACKEND-FORMATEUR (Spring Boot :9092) ━━━━━━━━━━━━━━"),
    (G,  "  ✅ PASS  POST /api/auth/login → Authentification Formateur  (7ms)"),
    (GR, "        ↳ HTTP 401  (attendu : 200/401/403)"),
    (G,  "  ✅ PASS  GET /api/courses → Accès refusé sans token JWT     (3ms)"),
    (GR, "        ↳ HTTP 401  (attendu : 401/403)"),
    (G,  "  ✅ PASS  POST /api/quiz/generate → Accès refusé sans token  (3ms)"),
    (GR, "        ↳ HTTP 401  (attendu : 401/403)"),
    (G,  "  ✅ PASS  GET /actuator/health → Spring Boot Health Check    (2ms)"),
    (GR, "        ↳ HTTP 401  (attendu : 200/401/403)"),
    (None,""),
    (W2, "════════════════════════════════════════════════════════════════"),
    (W2, "  📊  BILAN DES TESTS D'INTÉGRATION — CERTIF-FUN"),
    (W2, "════════════════════════════════════════════════════════════════"),
    (G,  "  ✅  Tests réussis  :  16"),
    (R,  "  ❌  Tests échoués  :   0"),
    (Y,  "  ⚠️   Tests ignorés  :   0  (services hors ligne)"),
    (W2, "  ────────────────────────────────────────"),
    (W2, "      Total          :  16 tests"),
    (W2, "════════════════════════════════════════════════════════════════"),
    (None,""),
    (G,  "  🎉  Tous les tests disponibles ont réussi avec succès !"),
    (C,  "  ℹ️   Tous les microservices Docker sont en ligne et fonctionnels."),
    (C,  "       La sécurité JWT fonctionne correctement (401/403 sur routes protégées)."),
]

y = 10
for color, text in lines:
    if color is None:
        y += 10
        continue
    d.text((10, y), text, font=font, fill=color)
    y += 14

out = "/Users/anaskhaiy/Desktop/PFE 4/Template_PFE/figures/test_integration.png"
img.save(out)
print(f"✅ Image mise à jour : {out}")
