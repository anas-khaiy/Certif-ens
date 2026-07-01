package com.certiflow.coordinateur.controller;

import com.certiflow.coordinateur.model.*;
import com.certiflow.coordinateur.repository.*;
import com.certiflow.coordinateur.service.EmailService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/coord/rapports")
public class RapportController {

    private final ApprenantRepository apprenantRepository;
    private final CoordinateurRepository coordinateurRepository;
    private final DepotPfeRepository depotPfeRepository;
    private final EnvoiRapportRepository envoiRapportRepository;
    private final EmailService emailService;

    public RapportController(ApprenantRepository apprenantRepository,
                             CoordinateurRepository coordinateurRepository,
                             DepotPfeRepository depotPfeRepository,
                             EnvoiRapportRepository envoiRapportRepository,
                             EmailService emailService) {
        this.apprenantRepository = apprenantRepository;
        this.coordinateurRepository = coordinateurRepository;
        this.depotPfeRepository = depotPfeRepository;
        this.envoiRapportRepository = envoiRapportRepository;
        this.emailService = emailService;
    }

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getAllRapports() {
        Long coordinateurId = getCurrentCoordinateurId();
        List<Apprenant> apprenants = apprenantRepository.findByCoordinateurId(coordinateurId);

        List<Map<String, Object>> result = new ArrayList<>();
        for (Apprenant a : apprenants) {
            List<DepotPfe> depots = depotPfeRepository.findByApprenantId(a.getId());
            List<EnvoiRapport> envois = envoiRapportRepository.findByApprenantId(a.getId());

            Map<String, Object> apprenantData = new HashMap<>();
            apprenantData.put("id", a.getId());
            apprenantData.put("nom", a.getNom());
            apprenantData.put("prenom", a.getPrenom());
            apprenantData.put("email", a.getEmail());
            apprenantData.put("specialite", a.getSpecialite() != null ? a.getSpecialite().getNom() : null);
            apprenantData.put("cycle", a.getCycle() != null ? a.getCycle().getNomCycle() : null);
            apprenantData.put("sujetTitre", a.getSujetDetails() != null ? a.getSujetDetails().getTitre() : null);
            apprenantData.put("encadrant", a.getEncadrant() != null
                    ? a.getEncadrant().getPrenom() + " " + a.getEncadrant().getNom() : null);
            apprenantData.put("examinateurs", a.getExaminateurs().stream()
                    .map(e -> Map.of("nom", e.getPrenom() + " " + e.getNom(), "email", e.getEmail() != null ? e.getEmail() : ""))
                    .toList());
            apprenantData.put("rapporteurs", a.getRapporteurs().stream()
                    .map(r -> Map.of("nom", r.getPrenom() + " " + r.getNom(), "email", r.getEmail() != null ? r.getEmail() : ""))
                    .toList());
            apprenantData.put("examinateursExternes", a.getExaminateursExternes().stream()
                    .map(e -> Map.of("nom", e.getPrenom() + " " + e.getNom(), "email", e.getEmail() != null ? e.getEmail() : ""))
                    .toList());
            apprenantData.put("rapporteursExternes", a.getRapporteursExternes().stream()
                    .map(r -> Map.of("nom", r.getPrenom() + " " + r.getNom(), "email", r.getEmail() != null ? r.getEmail() : ""))
                    .toList());

            List<Map<String, Object>> depotList = depots.stream().map(d -> {
                Map<String, Object> map = new HashMap<>();
                map.put("type", d.getTypeDepot());
                map.put("fichierUrl", d.getFichierUrl());
                map.put("dateDepot", d.getDateDepot().toString());
                return map;
            }).collect(Collectors.toList());
            apprenantData.put("depots", depotList);

            Map<String, String> envoisMap = new HashMap<>();
            for (EnvoiRapport e : envois) {
                envoisMap.put(e.getTypeDepot(), e.getDateEnvoi().toString());
            }
            apprenantData.put("envois", envoisMap);

            result.add(apprenantData);
        }
        return ResponseEntity.ok(result);
    }

    @PostMapping("/envoyer/{apprenantId}/{typeDepot}")
    public ResponseEntity<Map<String, Object>> envoyerRapport(
            @PathVariable Long apprenantId,
            @PathVariable String typeDepot,
            @RequestBody(required = false) List<String> targetEmails) {
        Long coordinateurId = getCurrentCoordinateurId();
        Apprenant apprenant = apprenantRepository.findById(apprenantId)
                .orElseThrow(() -> new RuntimeException("Apprenant non trouvé"));

        if (apprenant.getCoordinateur() == null || !apprenant.getCoordinateur().getId().equals(coordinateurId)) {
            throw new RuntimeException("Accès non autorisé à cet apprenant");
        }

        DepotPfe depot = depotPfeRepository.findByApprenantIdAndTypeDepot(apprenantId, typeDepot)
                .orElseThrow(() -> new RuntimeException("Aucun dépôt trouvé pour ce type"));

        // Collect all possible recipients with their emails
        Map<String, String> allRecipients = new LinkedHashMap<>();
        for (Enseignant e : apprenant.getExaminateurs()) {
            if (e.getEmail() != null && !e.getEmail().isBlank())
                allRecipients.put(e.getEmail(), e.getPrenom() + " " + e.getNom());
        }
        for (Enseignant r : apprenant.getRapporteurs()) {
            if (r.getEmail() != null && !r.getEmail().isBlank())
                allRecipients.put(r.getEmail(), r.getPrenom() + " " + r.getNom());
        }
        for (MembreExterne m : apprenant.getExaminateursExternes()) {
            if (m.getEmail() != null && !m.getEmail().isBlank())
                allRecipients.put(m.getEmail(), m.getPrenom() + " " + m.getNom());
        }
        for (MembreExterne m : apprenant.getRapporteursExternes()) {
            if (m.getEmail() != null && !m.getEmail().isBlank())
                allRecipients.put(m.getEmail(), m.getPrenom() + " " + m.getNom());
        }

        // Filter by selected emails if provided, otherwise send to all
        List<String> recipients;
        if (targetEmails != null && !targetEmails.isEmpty()) {
            recipients = targetEmails.stream()
                    .filter(allRecipients::containsKey)
                    .collect(Collectors.toList());
        } else {
            recipients = new ArrayList<>(allRecipients.keySet());
        }

        if (recipients.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Aucun destinataire sélectionné"
            ));
        }

        String depotLabel = switch (typeDepot) {
            case "DEPOT_1" -> "Dépôt 1";
            case "DEPOT_2" -> "Dépôt 2";
            case "FINAL" -> "Dépôt Final";
            default -> typeDepot;
        };

        String downloadLink = "http://localhost:9093/api/v1/mon-pfe/download/" + depot.getFichierUrl();

        for (String email : recipients) {
            try {
                emailService.sendReportEmail(email, apprenant.getPrenom() + " " + apprenant.getNom(),
                        depotLabel, downloadLink);
            } catch (Exception ex) {
                // Continue sending to others
            }
        }

        // Record or update the send
        EnvoiRapport envoi = envoiRapportRepository.findByApprenantIdAndTypeDepot(apprenantId, typeDepot)
                .orElse(EnvoiRapport.builder()
                        .apprenant(apprenant)
                        .typeDepot(typeDepot)
                        .build());
        envoi.setDateEnvoi(LocalDateTime.now());
        envoiRapportRepository.save(envoi);

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Rapport envoyé à " + recipients.size() + " destinataire(s)"
        ));
    }

    @GetMapping("/depots")
    public ResponseEntity<List<Map<String, Object>>> getAllDepots() {
        Long coordinateurId = getCurrentCoordinateurId();
        List<Apprenant> apprenants = apprenantRepository.findByCoordinateurId(coordinateurId);
        List<Map<String, Object>> result = new ArrayList<>();
        for (Apprenant a : apprenants) {
            List<DepotPfe> depots = depotPfeRepository.findByApprenantId(a.getId());
            for (DepotPfe d : depots) {
                Map<String, Object> map = new HashMap<>();
                map.put("apprenantId", a.getId());
                map.put("apprenantNom", a.getPrenom() + " " + a.getNom());
                map.put("typeDepot", d.getTypeDepot());
                map.put("fichierUrl", d.getFichierUrl());
                map.put("dateDepot", d.getDateDepot().toString());
                result.add(map);
            }
        }
        return ResponseEntity.ok(result);
    }

    private Long getCurrentCoordinateurId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        Coordinateur coordinateur = coordinateurRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Coordinateur non trouvé"));
        return coordinateur.getId();
    }
}
