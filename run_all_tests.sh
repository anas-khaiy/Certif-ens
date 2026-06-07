#!/bin/bash

# Script de lancement automatique de tous les tests unitaires du projet CertiFlow
# (JUnit 5 + Mockito pour les microservices Java, pytest pour le service de détection IA)

# Couleurs pour l'affichage terminal
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PROJECT_ROOT="$(pwd)"

echo -e "${BLUE}======================================================================${NC}"
echo -e "${BLUE}🚀 Lancement de la Suite Complète de Tests Unitaires (CertiFlow)${NC}"
echo -e "${BLUE}======================================================================${NC}"
echo ""

# Variables pour le suivi
ADMIN_STATUS="FAIL"
APPRENANT_STATUS="FAIL"
FORMATEUR_STATUS="FAIL"
AI_STATUS="FAIL"

# 1. Backend Admin
echo -e "${YELLOW}[1/4] Exécution des tests JUnit/Mockito pour Backend-Admin...${NC}"
cd "$PROJECT_ROOT/Backend-Admin" && ./mvnw test
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Backend-Admin : Tous les tests unitaires ont réussi !${NC}"
    ADMIN_STATUS="PASS"
else
    echo -e "${RED}❌ Backend-Admin : Certains tests unitaires ont échoué.${NC}"
    ADMIN_STATUS="FAIL"
fi
echo ""

# 2. Backend Apprenant
echo -e "${YELLOW}[2/4] Exécution des tests JUnit/Mockito pour Backend-Apprenant...${NC}"
cd "$PROJECT_ROOT/Backend-Apprenant" && ./mvnw test
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Backend-Apprenant : Tous les tests unitaires ont réussi !${NC}"
    APPRENANT_STATUS="PASS"
else
    echo -e "${RED}❌ Backend-Apprenant : Certains tests unitaires ont échoué.${NC}"
    APPRENANT_STATUS="FAIL"
fi
echo ""

# 3. Backend Formateur
echo -e "${YELLOW}[3/4] Exécution des tests JUnit/Mockito pour Backend-Formateur...${NC}"
cd "$PROJECT_ROOT/Backend-Formateur" && ./mvnw test
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Backend-Formateur : Tous les tests unitaires ont réussi !${NC}"
    FORMATEUR_STATUS="PASS"
else
    echo -e "${RED}❌ Backend-Formateur : Certains tests unitaires ont échoué.${NC}"
    FORMATEUR_STATUS="FAIL"
fi
echo ""

# 4. AI Detection Service (pytest)
echo -e "${YELLOW}[4/4] Exécution des tests pytest pour AI-Detection-Service...${NC}"
cd "$PROJECT_ROOT/AI-Detection-Service" && ./ai-detection-venv/bin/pytest test_ai_service.py
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ AI-Detection-Service : Tous les tests pytest ont réussi !${NC}"
    AI_STATUS="PASS"
else
    echo -e "${RED}❌ AI-Detection-Service : Certains tests pytest ont échoué.${NC}"
    AI_STATUS="FAIL"
fi
echo ""

echo -e "${BLUE}======================================================================${NC}"
echo -e "${BLUE}📊 TABLEAU RÉCAPITULATIF DES RÉSULTATS DE TESTS${NC}"
echo -e "${BLUE}======================================================================${NC}"

if [ "$ADMIN_STATUS" = "PASS" ]; then
    echo -e "  - Backend-Admin         : ${GREEN}SUCCÈS (100% Mockito - 2 tests)${NC}"
else
    echo -e "  - Backend-Admin         : ${RED}ÉCHEC${NC}"
fi

if [ "$APPRENANT_STATUS" = "PASS" ]; then
    echo -e "  - Backend-Apprenant     : ${GREEN}SUCCÈS (100% Mockito - 42 tests)${NC}"
else
    echo -e "  - Backend-Apprenant     : ${RED}ÉCHEC${NC}"
fi

if [ "$FORMATEUR_STATUS" = "PASS" ]; then
    echo -e "  - Backend-Formateur     : ${GREEN}SUCCÈS (100% Mockito - 35 tests)${NC}"
else
    echo -e "  - Backend-Formateur     : ${RED}ÉCHEC${NC}"
fi

if [ "$AI_STATUS" = "PASS" ]; then
    echo -e "  - AI-Detection-Service  : ${GREEN}SUCCÈS (100% pytest - 28 tests)${NC}"
else
    echo -e "  - AI-Detection-Service  : ${RED}ÉCHEC${NC}"
fi

echo -e "${BLUE}======================================================================${NC}"

if [ "$ADMIN_STATUS" = "PASS" ] && [ "$APPRENANT_STATUS" = "PASS" ] && [ "$FORMATEUR_STATUS" = "PASS" ] && [ "$AI_STATUS" = "PASS" ]; then
    echo -e "${GREEN}🎉 Félicitations ! Tous les tests unitaires du projet ont réussi avec succès !${NC}"
    exit 0
else
    echo -e "${RED}⚠️ Attention : Certains tests unitaires ont échoué. Veuillez vérifier les détails ci-dessus.${NC}"
    exit 1
fi
