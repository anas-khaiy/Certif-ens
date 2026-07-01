package com.certiflow.coordinateur.controller;

import com.certiflow.coordinateur.model.Coordinateur;
import com.certiflow.coordinateur.repository.ApprenantRepository;
import com.certiflow.coordinateur.repository.CoordinateurRepository;
import com.certiflow.coordinateur.repository.EnseignantRepository;
import com.certiflow.coordinateur.repository.SujetRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/coord/dashboard")
public class DashboardController {

    private final ApprenantRepository apprenantRepository;
    private final EnseignantRepository enseignantRepository;
    private final SujetRepository sujetRepository;
    private final CoordinateurRepository coordinateurRepository;

    public DashboardController(ApprenantRepository apprenantRepository,
                               EnseignantRepository enseignantRepository,
                               SujetRepository sujetRepository,
                               CoordinateurRepository coordinateurRepository) {
        this.apprenantRepository = apprenantRepository;
        this.enseignantRepository = enseignantRepository;
        this.sujetRepository = sujetRepository;
        this.coordinateurRepository = coordinateurRepository;
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        Long coordinateurId = getCurrentCoordinateurId();

        long totalFormateurs = enseignantRepository.findAllEnseignantsByCoordinateurId(coordinateurId).size();
        long totalApprenants = apprenantRepository.countByCoordinateurIdOrUnclaimed(coordinateurId);
        long nombreExaminateur = apprenantRepository.countDistinctExaminateursByCoordinateurId(coordinateurId);
        long nombreRapporteur = apprenantRepository.countDistinctRapporteursByCoordinateurId(coordinateurId);
        long nombreEncadrant = apprenantRepository.countDistinctEncadrantsByCoordinateurId(coordinateurId);
        long nombreSujets = apprenantRepository.findByCoordinateurId(coordinateurId)
                .stream().filter(a -> a.getSujetDetails() != null).count();
        long nombreApprenantsAffectes = apprenantRepository.countApprenantsWithSujetAndEncadrantByCoordinateurId(coordinateurId);

        return ResponseEntity.ok(Map.of(
                "totalFormateurs", totalFormateurs,
                "totalApprenants", totalApprenants,
                "nombreExaminateur", nombreExaminateur,
                "nombreRapporteur", nombreRapporteur,
                "nombreEncadrant", nombreEncadrant,
                "nombreSujets", nombreSujets,
                "nombreApprenantsAffectes", nombreApprenantsAffectes
        ));
    }

    private Long getCurrentCoordinateurId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        Coordinateur coordinateur = coordinateurRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Coordinateur non trouvé"));
        return coordinateur.getId();
    }
}
