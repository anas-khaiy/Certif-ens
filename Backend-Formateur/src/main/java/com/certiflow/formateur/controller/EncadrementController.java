package com.certiflow.formateur.controller;

import com.certiflow.formateur.model.Apprenant;
import com.certiflow.formateur.model.EncadrementPlan;
import com.certiflow.formateur.model.Enseignant;
import com.certiflow.formateur.repository.ApprenantRepository;
import com.certiflow.formateur.repository.EnseignantRepository;
import com.certiflow.formateur.service.EncadrementService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/encadrement")
@RequiredArgsConstructor
public class EncadrementController {

    private final EncadrementService encadrementService;
    private final ApprenantRepository apprenantRepository;
    private final EnseignantRepository enseignantRepository;

    @GetMapping("/trainer")
    public ResponseEntity<List<EncadrementPlan>> getTrainerPlans(Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) return ResponseEntity.status(401).build();
        return ResponseEntity.ok(encadrementService.getPlansByTrainer(auth.getName()));
    }

    @PostMapping("/save")
    public ResponseEntity<EncadrementPlan> savePlan(@RequestBody EncadrementPlan plan, Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) return ResponseEntity.status(401).build();
        return ResponseEntity.ok(encadrementService.savePlan(plan, auth.getName()));
    }

    @DeleteMapping("/{planId}")
    public ResponseEntity<Void> deletePlan(@PathVariable Long planId, Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) return ResponseEntity.status(401).build();
        encadrementService.deletePlan(planId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/apprenants")
    public ResponseEntity<List<Map<String, Object>>> getMyApprenants(Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) return ResponseEntity.status(401).build();
        Enseignant formateur = enseignantRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("Formateur non trouvé"));
        List<Apprenant> apprenants = apprenantRepository.findByEncadrantId(formateur.getId());
        List<Map<String, Object>> result = apprenants.stream()
            .map(a -> Map.<String, Object>of(
                "id", a.getId(),
                "nom", a.getNom(),
                "prenom", a.getPrenom(),
                "email", a.getEmail(),
                "photoProfile", a.getPhotoProfile(),
                "specialite", a.getSpecialite() != null ? Map.of("nom", a.getSpecialite().getNom()) : null
            ))
            .toList();
        return ResponseEntity.ok(result);
    }
}
