package com.certiflow.formateur.controller;

import com.certiflow.formateur.model.Sujet;
import com.certiflow.formateur.model.SujetPropositionConfig;
import com.certiflow.formateur.service.FormateurSujetService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/sujets")
public class FormateurSujetController {

    private final FormateurSujetService formateurSujetService;

    public FormateurSujetController(FormateurSujetService formateurSujetService) {
        this.formateurSujetService = formateurSujetService;
    }

    @GetMapping("/config")
    public ResponseEntity<SujetPropositionConfig> getConfig(Authentication authentication) {
        SujetPropositionConfig config = formateurSujetService.getConfigForFormateur(authentication.getName());
        return ResponseEntity.ok(config);
    }

    @GetMapping("/mes-propositions")
    public ResponseEntity<List<Sujet>> getMesPropositions(Authentication authentication) {
        List<Sujet> sujets = formateurSujetService.getProposedSujets(authentication.getName());
        return ResponseEntity.ok(sujets);
    }

    @PostMapping
    public ResponseEntity<?> proposeSujet(
            Authentication authentication,
            @RequestBody SujetRequest request) {
        try {
            Sujet saved = formateurSujetService.proposeSujet(
                    authentication.getName(),
                    request.getTitre(),
                    request.getDescription(),
                    request.getObjectifs()
            );
            return ResponseEntity.ok(saved);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    public static class SujetRequest {
        private String titre;
        private String description;
        private List<String> objectifs;

        public String getTitre() { return titre; }
        public void setTitre(String titre) { this.titre = titre; }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        public List<String> getObjectifs() { return objectifs; }
        public void setObjectifs(List<String> objectifs) { this.objectifs = objectifs; }
    }
}
