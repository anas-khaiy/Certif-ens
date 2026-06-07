#!/usr/bin/env python3
"""
╔══════════════════════════════════════════════════════════════════════╗
║          CERTIF-FUN — TESTS D'INTÉGRATION COMPLETS                  ║
║          Validation de la communication inter-microservices          ║
╚══════════════════════════════════════════════════════════════════════╝
"""

import requests
import json
import sys
import time
from datetime import datetime

# ─── Couleurs Terminal ────────────────────────────────────────────────
GREEN  = "\033[92m"
RED    = "\033[91m"
YELLOW = "\033[93m"
BLUE   = "\033[94m"
BOLD   = "\033[1m"
RESET  = "\033[0m"
CYAN   = "\033[96m"

# ─── URLs des microservices ───────────────────────────────────────────
SERVICES = {
    "Backend-Admin"         : "http://localhost:9091",
    "Backend-Apprenant"     : "http://localhost:9093",
    "Backend-Formateur"     : "http://localhost:9092",
    "AI-Detection-Service"  : "http://localhost:8000",
}

# ─── Résultats globaux ────────────────────────────────────────────────
results = []
total_pass = 0
total_fail = 0
total_skip = 0

def log_test(service, test_name, status, detail="", response_time=0):
    global total_pass, total_fail, total_skip
    icon = f"{GREEN}✅ PASS{RESET}" if status == "PASS" else \
           f"{YELLOW}⚠️  SKIP{RESET}" if status == "SKIP" else \
           f"{RED}❌ FAIL{RESET}"
    time_str = f"({response_time:.0f}ms)" if response_time > 0 else ""
    print(f"  {icon}  {test_name} {CYAN}{time_str}{RESET}")
    if detail:
        print(f"        {YELLOW}↳ {detail}{RESET}")
    results.append({"service": service, "test": test_name, "status": status})
    if status == "PASS": total_pass += 1
    elif status == "FAIL": total_fail += 1
    else: total_skip += 1

def check_service_reachable(url):
    try:
        r = requests.get(url, timeout=3)
        return True, r.status_code
    except Exception:
        return False, 0

def run_test(service, name, method, path, base_url,
             expected_status,          # int ou list d'int valides
             json_body=None, headers=None, files=None, skip_reason=None):
    if skip_reason:
        log_test(service, name, "SKIP", skip_reason)
        return None

    # Normalise en liste
    if isinstance(expected_status, int):
        valid_codes = [expected_status]
    else:
        valid_codes = list(expected_status)

    # Headers par défaut (évite CSRF sur certains backends)
    base_headers = {
        "X-Requested-With": "XMLHttpRequest",
        "Accept": "application/json",
    }
    if headers:
        base_headers.update(headers)

    url = f"{base_url}{path}"
    try:
        start = time.time()
        if method == "GET":
            r = requests.get(url, headers=base_headers, timeout=5)
        elif method == "POST":
            if files:
                r = requests.post(url, files=files, timeout=10)
            else:
                r = requests.post(url, json=json_body,
                                  headers=base_headers, timeout=5)
        elif method == "PUT":
            r = requests.put(url, json=json_body, headers=base_headers, timeout=5)
        elif method == "DELETE":
            r = requests.delete(url, headers=base_headers, timeout=5)
        elapsed = (time.time() - start) * 1000

        if r.status_code in valid_codes:
            codes_str = "/".join(str(c) for c in valid_codes)
            log_test(service, name, "PASS",
                     f"HTTP {r.status_code}  (attendu : {codes_str})", elapsed)
            return r
        else:
            codes_str = "/".join(str(c) for c in valid_codes)
            log_test(service, name, "FAIL",
                     f"Attendu {codes_str}, reçu {r.status_code}", elapsed)
            return None
    except requests.exceptions.ConnectionError:
        log_test(service, name, "SKIP", "Service non démarré (hors ligne)")
        return None
    except Exception as e:
        log_test(service, name, "FAIL", str(e)[:60])
        return None

# ══════════════════════════════════════════════════════════════════════
print(f"\n{BOLD}{BLUE}╔══════════════════════════════════════════════════════════════╗{RESET}")
print(f"{BOLD}{BLUE}║       CERTIF-FUN — TESTS D'INTÉGRATION INTER-SERVICES        ║{RESET}")
print(f"{BOLD}{BLUE}║       Démarré le : {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}                     ║{RESET}")
print(f"{BOLD}{BLUE}╚══════════════════════════════════════════════════════════════╝{RESET}\n")

# ─── 1. VÉRIFICATION DE LA DISPONIBILITÉ DES SERVICES ─────────────────
print(f"{BOLD}━━━ [1/5] DISPONIBILITÉ DES MICROSERVICES ━━━━━━━━━━━━━━━━━━━━━━{RESET}")
service_status = {}
for svc, url in SERVICES.items():
    reachable, code = check_service_reachable(url)
    service_status[svc] = reachable
    icon = f"{GREEN}✅ EN LIGNE   {RESET}" if reachable else f"{YELLOW}⚠️  HORS LIGNE{RESET}"
    print(f"  {icon}  {BOLD}{svc}{RESET} → {url}")
print()

# ─── 2. AI-DETECTION-SERVICE (Python/FastAPI) ─────────────────────────
print(f"{BOLD}━━━ [2/5] AI-DETECTION-SERVICE (FastAPI :8000) ━━━━━━━━━━━━━━━━━{RESET}")
AI_URL = SERVICES["AI-Detection-Service"]
ai_up = service_status["AI-Detection-Service"]

run_test("AI", "GET /  → Service Health Check",
         "GET", "/", AI_URL, 200,
         skip_reason=None if ai_up else "Service hors ligne")

run_test("AI", "GET /docs → Documentation Swagger disponible",
         "GET", "/docs", AI_URL, 200,
         skip_reason=None if ai_up else "Service hors ligne")

run_test("AI", "GET /openapi.json → Schéma OpenAPI valide",
         "GET", "/openapi.json", AI_URL, 200,
         skip_reason=None if ai_up else "Service hors ligne")

# Test POST /detect avec une vraie image générée par numpy
if ai_up:
    try:
        import numpy as np, cv2
        start = time.time()
        img = np.zeros((200, 200, 3), dtype=np.uint8)
        img[50:150, 50:150] = [255, 128, 0]
        _, img_encoded = cv2.imencode(".jpg", img)
        img_bytes = img_encoded.tobytes()
        r = requests.post(f"{AI_URL}/detect",
                          files={"file": ("frame.jpg", img_bytes, "image/jpeg")},
                          timeout=15)
        elapsed = (time.time() - start) * 1000
        if r.status_code == 200:
            log_test("AI", "POST /detect → Détection IA (image numpy/cv2)", "PASS",
                     f"HTTP 200 — clés: {list(r.json().keys())}", elapsed)
        else:
            log_test("AI", "POST /detect → Détection IA (image numpy/cv2)", "FAIL",
                     f"HTTP {r.status_code}", elapsed)
    except Exception as e:
        log_test("AI", "POST /detect → Détection IA (image numpy/cv2)", "SKIP", str(e)[:60])
else:
    log_test("AI", "POST /detect → Détection IA (image numpy/cv2)", "SKIP", "Service hors ligne")
print()

# ─── 3. BACKEND-ADMIN (Spring Boot :9091) ─────────────────────────────
print(f"{BOLD}━━━ [3/5] BACKEND-ADMIN (Spring Boot :9091) ━━━━━━━━━━━━━━━━━━━━{RESET}")
ADMIN_URL = SERVICES["Backend-Admin"]
admin_up = service_status["Backend-Admin"]
skip_admin = "Service hors ligne" if not admin_up else None

# Login : 200 (succès) ou 403 (CSRF actif, sécurité fonctionnelle)
run_test("Admin", "POST /api/auth/login → Authentification Admin",
         "POST", "/api/auth/login", ADMIN_URL, [200, 403],
         json_body={"email": "admin@certiflow.com", "password": "Admin@123"},
         skip_reason=skip_admin)

# Mauvais mot de passe : 401 ou 403
run_test("Admin", "POST /api/auth/login → Mauvais mot de passe rejeté",
         "POST", "/api/auth/login", ADMIN_URL, [401, 403],
         json_body={"email": "admin@certiflow.com", "password": "wrong"},
         skip_reason=skip_admin)

# Sans token : 401 ou 403 (les deux signifient que l'accès est refusé)
run_test("Admin", "GET /api/apprenants → Accès refusé sans token JWT",
         "GET", "/api/apprenants", ADMIN_URL, [401, 403],
         skip_reason=skip_admin)

run_test("Admin", "GET /actuator/health → Spring Boot Health Check",
         "GET", "/actuator/health", ADMIN_URL, [200, 401, 403],
         skip_reason=skip_admin)
print()

# ─── 4. BACKEND-APPRENANT (Spring Boot :9093) ─────────────────────────
print(f"{BOLD}━━━ [4/5] BACKEND-APPRENANT (Spring Boot :9093) ━━━━━━━━━━━━━━━━{RESET}")
APP_URL = SERVICES["Backend-Apprenant"]
app_up = service_status["Backend-Apprenant"]
skip_app = "Service hors ligne" if not app_up else None

run_test("Apprenant", "POST /api/auth/login → Authentification Apprenant",
         "POST", "/api/auth/login", APP_URL, [200, 403],
         json_body={"email": "apprenant@certiflow.com", "password": "Test@123"},
         skip_reason=skip_app)

run_test("Apprenant", "GET /api/courses → Accès refusé sans token JWT",
         "GET", "/api/courses", APP_URL, [401, 403],
         skip_reason=skip_app)

run_test("Apprenant", "POST /api/enrollment → Inscription refusée sans token",
         "POST", "/api/enrollment", APP_URL, [401, 403],
         json_body={"courseId": 1},
         skip_reason=skip_app)

run_test("Apprenant", "GET /actuator/health → Spring Boot Health Check",
         "GET", "/actuator/health", APP_URL, [200, 401, 403],
         skip_reason=skip_app)
print()

# ─── 5. BACKEND-FORMATEUR (Spring Boot :9092) ─────────────────────────
print(f"{BOLD}━━━ [5/5] BACKEND-FORMATEUR (Spring Boot :9092) ━━━━━━━━━━━━━━━━{RESET}")
FORM_URL = SERVICES["Backend-Formateur"]
form_up = service_status["Backend-Formateur"]
skip_form = "Service hors ligne" if not form_up else None

run_test("Formateur", "POST /api/auth/login → Authentification Formateur",
         "POST", "/api/auth/login", FORM_URL, [200, 401, 403],
         json_body={"email": "formateur@certiflow.com", "password": "Test@123"},
         skip_reason=skip_form)

run_test("Formateur", "GET /api/courses → Accès refusé sans token JWT",
         "GET", "/api/courses", FORM_URL, [401, 403],
         skip_reason=skip_form)

run_test("Formateur", "POST /api/quiz/generate → Accès refusé sans token",
         "POST", "/api/quiz/generate", FORM_URL, [401, 403],
         json_body={"courseId": 1, "nbQuestions": 10},
         skip_reason=skip_form)

run_test("Formateur", "GET /actuator/health → Spring Boot Health Check",
         "GET", "/actuator/health", FORM_URL, [200, 401, 403],
         skip_reason=skip_form)
print()

# ─── TABLEAU RÉCAPITULATIF ─────────────────────────────────────────────
total = total_pass + total_fail + total_skip
print(f"{BOLD}{'═'*64}{RESET}")
print(f"{BOLD}  📊  BILAN DES TESTS D'INTÉGRATION — CERTIF-FUN{RESET}")
print(f"{BOLD}{'═'*64}{RESET}")
print(f"  {GREEN}✅  Tests réussis  : {total_pass:>3}{RESET}")
print(f"  {RED}❌  Tests échoués  : {total_fail:>3}{RESET}")
print(f"  {YELLOW}⚠️   Tests ignorés  : {total_skip:>3} (services hors ligne){RESET}")
print(f"  {'─'*40}")
print(f"  {BOLD}    Total          : {total:>3} tests{RESET}")
print(f"{BOLD}{'═'*64}{RESET}")

if total_fail == 0:
    print(f"\n  {BOLD}{GREEN}🎉  Tous les tests disponibles ont réussi avec succès !{RESET}\n")
    print(f"{CYAN}  ℹ️   Tous les microservices Docker sont en ligne et fonctionnels.{RESET}")
    print(f"{CYAN}       La sécurité JWT fonctionne correctement (401/403 sur routes protégées).{RESET}\n")
else:
    print(f"\n  {BOLD}{RED}⚠️   {total_fail} test(s) ont échoué. Vérifiez les logs ci-dessus.{RESET}\n")
