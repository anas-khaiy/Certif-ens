package com.certiflow.formateur.controller;

import com.certiflow.formateur.model.*;
import com.certiflow.formateur.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/formateur/suivi-pfe")
@RequiredArgsConstructor
public class SuiviPfeController {

    private final EnseignantRepository enseignantRepository;
    private final ApprenantRepository apprenantRepository;
    private final DepotPfeRepository depotPfeRepository;
    private final RemarqueDepotRepository remarqueDepotRepository;

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getSuiviPfeApprenants(Authentication authentication) {
        String email = authentication.getName();
        Enseignant enseignant = enseignantRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Enseignant introuvable"));

        Set<Long> seenIds = new HashSet<>();
        List<Map<String, Object>> result = new ArrayList<>();

        // Apprenants where this enseignant is the encadrant
        List<Apprenant> encadres = apprenantRepository.findByEncadrantId(enseignant.getId());
        for (Apprenant a : encadres) {
            if (seenIds.add(a.getId())) {
                result.add(buildApprenantInfo(a, "Encadrant"));
            }
        }

        // Apprenants where this enseignant is examinateur
        List<Apprenant> examinApprenants = apprenantRepository.findByExaminateurId(enseignant.getId());
        for (Apprenant a : examinApprenants) {
            if (seenIds.add(a.getId())) {
                result.add(buildApprenantInfo(a, "Examinateur"));
            }
        }

        // Apprenants where this enseignant is rapporteur
        List<Apprenant> rapportApprenants = apprenantRepository.findByRapporteurId(enseignant.getId());
        for (Apprenant a : rapportApprenants) {
            if (seenIds.add(a.getId())) {
                result.add(buildApprenantInfo(a, "Rapporteur"));
            }
        }

        return ResponseEntity.ok(result);
    }

    @GetMapping("/{apprenantId}/depots")
    public ResponseEntity<Map<String, Object>> getDepotsAndRemarques(@PathVariable Long apprenantId) {
        Apprenant apprenant = apprenantRepository.findById(apprenantId)
                .orElseThrow(() -> new RuntimeException("Apprenant introuvable"));

        Map<String, Object> result = new HashMap<>();
        result.put("apprenantNom", apprenant.getPrenom() + " " + apprenant.getNom());
        result.put("apprenantEmail", apprenant.getEmail());

        if (apprenant.getSujetDetails() != null) {
            Map<String, Object> sujet = new HashMap<>();
            sujet.put("titre", apprenant.getSujetDetails().getTitre());
            sujet.put("description", apprenant.getSujetDetails().getDescription());
            sujet.put("objectifs", apprenant.getSujetDetails().getObjectifs());
            result.put("sujet", sujet);
        }

        result.put("dateSoutenance", apprenant.getDateSoutenance());

        // Encadrant
        if (apprenant.getEncadrant() != null) {
            Enseignant enc = apprenant.getEncadrant();
            Map<String, Object> encMap = new HashMap<>();
            encMap.put("id", enc.getId());
            encMap.put("nom", enc.getNom());
            encMap.put("prenom", enc.getPrenom());
            encMap.put("email", enc.getEmail());
            result.put("encadrant", encMap);
        }

        // Examinateurs
        if (apprenant.getExaminateurs() != null) {
            List<Map<String, Object>> examinateurs = new ArrayList<>();
            for (Enseignant e : apprenant.getExaminateurs()) {
                Map<String, Object> m = new HashMap<>();
                m.put("id", e.getId());
                m.put("nom", e.getNom());
                m.put("prenom", e.getPrenom());
                m.put("email", e.getEmail());
                examinateurs.add(m);
            }
            result.put("examinateurs", examinateurs);
        }

        // Rapporteurs
        if (apprenant.getRapporteurs() != null) {
            List<Map<String, Object>> rapporteurs = new ArrayList<>();
            for (Enseignant r : apprenant.getRapporteurs()) {
                Map<String, Object> m = new HashMap<>();
                m.put("id", r.getId());
                m.put("nom", r.getNom());
                m.put("prenom", r.getPrenom());
                m.put("email", r.getEmail());
                rapporteurs.add(m);
            }
            result.put("rapporteurs", rapporteurs);
        }

        List<DepotPfe> depots = depotPfeRepository.findByApprenantIdOrderByDateDepotDesc(apprenantId);
        List<Map<String, Object>> depotList = new ArrayList<>();

        for (DepotPfe depot : depots) {
            Map<String, Object> depotMap = new HashMap<>();
            depotMap.put("id", depot.getId());
            depotMap.put("typeDepot", depot.getTypeDepot());
            depotMap.put("fichierUrl", depot.getFichierUrl());
            depotMap.put("dateDepot", depot.getDateDepot());
            depotMap.put("statut", depot.getStatut());

            List<RemarqueDepot> remarques = remarqueDepotRepository.findByDepotPfeIdOrderByDateRemarqueDesc(depot.getId());
            List<Map<String, Object>> remarqueList = remarques.stream().map(r -> {
                Map<String, Object> rMap = new HashMap<>();
                rMap.put("id", r.getId());
                rMap.put("commentaire", r.getCommentaire());
                rMap.put("dateRemarque", r.getDateRemarque());
                rMap.put("enseignantNom", r.getEnseignant().getPrenom() + " " + r.getEnseignant().getNom());
                return rMap;
            }).collect(Collectors.toList());

            depotMap.put("remarques", remarqueList);
            depotList.add(depotMap);
        }

        result.put("depots", depotList);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/depots/{depotId}/remarques")
    public ResponseEntity<?> addRemarque(
            @PathVariable Long depotId,
            @RequestBody Map<String, String> body,
            Authentication authentication) {
        String email = authentication.getName();
        Enseignant enseignant = enseignantRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Enseignant introuvable"));

        DepotPfe depot = depotPfeRepository.findById(depotId)
                .orElseThrow(() -> new RuntimeException("Dépôt introuvable"));

        // Seul l'encadrant peut ajouter des remarques sur le 1er dépôt
        if ("DEPOT_1".equals(depot.getTypeDepot())) {
            Apprenant apprenant = depot.getApprenant();
            if (apprenant.getEncadrant() == null || !apprenant.getEncadrant().getId().equals(enseignant.getId())) {
                return ResponseEntity.status(403).body(Map.of("error", "Seul l'encadrant peut ajouter des remarques sur le 1er dépôt"));
            }
        }

        String commentaire = body.get("commentaire");
        if (commentaire == null || commentaire.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Le commentaire ne peut pas être vide"));
        }

        RemarqueDepot remarque = RemarqueDepot.builder()
                .depotPfe(depot)
                .enseignant(enseignant)
                .commentaire(commentaire.trim())
                .dateRemarque(LocalDateTime.now())
                .build();

        remarqueDepotRepository.save(remarque);

        Map<String, Object> response = new HashMap<>();
        response.put("id", remarque.getId());
        response.put("commentaire", remarque.getCommentaire());
        response.put("dateRemarque", remarque.getDateRemarque());
        response.put("enseignantNom", enseignant.getPrenom() + " " + enseignant.getNom());

        return ResponseEntity.ok(response);
    }

    @PostMapping("/depots/{depotId}/valider")
    public ResponseEntity<?> validerDepot(
            @PathVariable Long depotId,
            @RequestBody Map<String, String> body,
            Authentication authentication) {
        String email = authentication.getName();
        Enseignant enseignant = enseignantRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Enseignant introuvable"));

        DepotPfe depot = depotPfeRepository.findById(depotId)
                .orElseThrow(() -> new RuntimeException("Dépôt introuvable"));

        // Seul l'encadrant peut valider/refuser un dépôt
        Apprenant apprenant = depot.getApprenant();
        if (apprenant.getEncadrant() == null || !apprenant.getEncadrant().getId().equals(enseignant.getId())) {
            return ResponseEntity.status(403).body(Map.of("error", "Seul l'encadrant peut valider ou refuser un dépôt"));
        }

        // La validation/refus ne concerne que le DEPOT_1
        if (!"DEPOT_1".equals(depot.getTypeDepot())) {
            return ResponseEntity.status(403).body(Map.of("error", "La validation n'est disponible que pour le 1er dépôt"));
        }

        String action = body.get("action");
        if (action == null || (!action.equals("VALIDER") && !action.equals("REFUSER"))) {
            return ResponseEntity.badRequest().body(Map.of("error", "Action invalide. Utilisez 'VALIDER' ou 'REFUSER'"));
        }

        depot.setStatut(action.equals("VALIDER") ? "VALIDE" : "REFUSE");
        depotPfeRepository.save(depot);

        Map<String, Object> response = new HashMap<>();
        response.put("id", depot.getId());
        response.put("statut", depot.getStatut());

        return ResponseEntity.ok(response);
    }

    private Map<String, Object> buildApprenantInfo(Apprenant apprenant, String role) {
        Map<String, Object> info = new HashMap<>();
        info.put("id", apprenant.getId());
        info.put("nom", apprenant.getNom());
        info.put("prenom", apprenant.getPrenom());
        info.put("email", apprenant.getEmail());
        info.put("photoProfile", apprenant.getPhotoProfile());
        info.put("role", role);
        info.put("dateSoutenance", apprenant.getDateSoutenance());

        if (apprenant.getSpecialite() != null) {
            info.put("specialite", apprenant.getSpecialite().getNom());
        }

        if (apprenant.getSujetDetails() != null) {
            Map<String, Object> sujet = new HashMap<>();
            sujet.put("titre", apprenant.getSujetDetails().getTitre());
            sujet.put("description", apprenant.getSujetDetails().getDescription());
            sujet.put("objectifs", apprenant.getSujetDetails().getObjectifs());
            info.put("sujet", sujet);
        }

        int depotCount = depotPfeRepository.findByApprenantIdOrderByDateDepotDesc(apprenant.getId()).size();
        info.put("depotCount", depotCount);

        return info;
    }
}
