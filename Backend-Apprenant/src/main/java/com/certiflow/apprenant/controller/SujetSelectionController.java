package com.certiflow.apprenant.controller;

import com.certiflow.apprenant.model.Apprenant;
import com.certiflow.apprenant.model.Enseignant;
import com.certiflow.apprenant.model.Sujet;
import com.certiflow.apprenant.repository.ApprenantRepository;
import com.certiflow.apprenant.repository.EnseignantRepository;
import com.certiflow.apprenant.repository.SujetRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.transaction.annotation.Transactional;

@RestController
@RequestMapping("/api/v1/apprenant/sujets")
public class SujetSelectionController {

    private final SujetRepository sujetRepository;
    private final ApprenantRepository apprenantRepository;
    private final EnseignantRepository enseignantRepository;

    public SujetSelectionController(SujetRepository sujetRepository,
                                     ApprenantRepository apprenantRepository,
                                     EnseignantRepository enseignantRepository) {
        this.sujetRepository = sujetRepository;
        this.apprenantRepository = apprenantRepository;
        this.enseignantRepository = enseignantRepository;
    }

    @GetMapping("/disponibles")
    @Transactional(readOnly = true)
    public ResponseEntity<List<Map<String, Object>>> getSujetsDisponibles() {
        Apprenant current = getCurrentApprenant();
        if (!current.isSelectionSujetActive()) {
            return ResponseEntity.ok(List.of());
        }
        List<Sujet> sujets = sujetRepository.findByCoordinateurId(current.getCoordinateurId());
        List<Map<String, Object>> result = sujets.stream()
            .map(s -> {
                boolean pris = s.getApprenant() != null && !s.getApprenant().getId().equals(current.getId());
                Map<String, Object> map = new HashMap<>();
                map.put("id", s.getId());
                map.put("titre", s.getTitre());
                map.put("description", s.getDescription() != null ? s.getDescription() : "");
                map.put("objectifs", s.getObjectifs() != null ? s.getObjectifs() : List.of());
                map.put("pris", pris);
                map.put("formateur", s.getFormateur() != null
                    ? Map.of("id", s.getFormateur().getId(), "nom", s.getFormateur().getNom(), "prenom", s.getFormateur().getPrenom())
                    : null);
                return map;
            })
            .toList();
        return ResponseEntity.ok(result);
    }

    @PostMapping("/choisir/{sujetId}")
    public ResponseEntity<Map<String, Object>> choisirSujet(@PathVariable Long sujetId) {
        Apprenant current = getCurrentApprenant();
        if (!current.isSelectionSujetActive()) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Vous n'êtes pas autorisé à choisir un sujet"));
        }
        if (current.getSujetDetails() != null) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Vous avez déjà un sujet assigné"));
        }

        Sujet sujet = sujetRepository.findById(sujetId)
                .orElseThrow(() -> new RuntimeException("Sujet non trouvé"));

        if (sujet.getApprenant() != null) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Ce sujet est déjà pris par un autre apprenant"));
        }

        sujet.setApprenant(current);
        sujetRepository.save(sujet);

        current.setSujetDetails(sujet);
        if (sujet.getFormateur() != null) {
            current.setEncadrant(sujet.getFormateur());
        }
        apprenantRepository.save(current);

        return ResponseEntity.ok(Map.of(
            "success", true,
            "message", "Sujet choisi avec succès",
            "sujet", Map.of("id", sujet.getId(), "titre", sujet.getTitre()),
            "encadrant", sujet.getFormateur() != null
                ? Map.of("id", sujet.getFormateur().getId(), "nom", sujet.getFormateur().getNom(), "prenom", sujet.getFormateur().getPrenom())
                : null
        ));
    }

    @GetMapping("/mon-sujet")
    public ResponseEntity<Map<String, Object>> getMonSujet() {
        Apprenant current = getCurrentApprenant();
        if (current.getSujetDetails() == null) {
            return ResponseEntity.ok(Map.of("hasSujet", false));
        }
        Sujet sujet = current.getSujetDetails();
        return ResponseEntity.ok(Map.of(
            "hasSujet", true,
            "sujet", Map.of("id", sujet.getId(), "titre", sujet.getTitre(), "description", sujet.getDescription() != null ? sujet.getDescription() : ""),
            "encadrant", sujet.getFormateur() != null
                ? Map.of("id", sujet.getFormateur().getId(), "nom", sujet.getFormateur().getNom(), "prenom", sujet.getFormateur().getPrenom())
                : null
        ));
    }

    private Apprenant getCurrentApprenant() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();
        return apprenantRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Apprenant non trouvé"));
    }
}
