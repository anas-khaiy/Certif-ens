package com.certiflow.coordinateur.controller;

import com.certiflow.coordinateur.dto.AssignRequest;
import com.certiflow.coordinateur.model.Apprenant;
import com.certiflow.coordinateur.model.Coordinateur;
import com.certiflow.coordinateur.model.Enseignant;
import com.certiflow.coordinateur.model.Specialite;
import com.certiflow.coordinateur.repository.ApprenantRepository;
import com.certiflow.coordinateur.repository.CoordinateurRepository;
import com.certiflow.coordinateur.repository.CycleRepository;
import com.certiflow.coordinateur.repository.EnseignantRepository;
import com.certiflow.coordinateur.repository.SpecialiteRepository;
import com.certiflow.coordinateur.repository.SujetRepository;
import com.certiflow.coordinateur.dto.SujetUpdateRequest;
import com.certiflow.coordinateur.model.Sujet;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.ArrayList;
import java.util.Collections;

@RestController
@RequestMapping("/api/v1/coord/affectation")
public class AffectationController {

    private final EnseignantRepository enseignantRepository;
    private final ApprenantRepository apprenantRepository;
    private final SpecialiteRepository specialiteRepository;
    private final CycleRepository cycleRepository;
    private final SujetRepository sujetRepository;
    private final CoordinateurRepository coordinateurRepository;

    public AffectationController(EnseignantRepository enseignantRepository,
                                  ApprenantRepository apprenantRepository,
                                  SpecialiteRepository specialiteRepository,
                                  CycleRepository cycleRepository,
                                  SujetRepository sujetRepository,
                                  CoordinateurRepository coordinateurRepository) {
        this.enseignantRepository = enseignantRepository;
        this.apprenantRepository = apprenantRepository;
        this.specialiteRepository = specialiteRepository;
        this.cycleRepository = cycleRepository;
        this.sujetRepository = sujetRepository;
        this.coordinateurRepository = coordinateurRepository;
    }

    @GetMapping("/all-apprenants")
    public ResponseEntity<Page<Apprenant>> getAllApprenants(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false, defaultValue = "") String search,
            @RequestParam(required = false) Long specialiteId,
            @RequestParam(required = false) Long coordinateurId) {
        Pageable pageable = PageRequest.of(page, size);
        String nameFilter = (search != null && !search.trim().isEmpty()) ? search.trim() : "";
        if (coordinateurId == null) {
            coordinateurId = getCurrentCoordinateurId();
        }
        return ResponseEntity.ok(apprenantRepository.findAllWithFilters(nameFilter, specialiteId, coordinateurId, pageable));
    }

    @GetMapping("/coordinateurs")
    public ResponseEntity<List<Coordinateur>> getCoordinateurs() {
        return ResponseEntity.ok(coordinateurRepository.findAll());
    }

    @GetMapping("/formateurs")
    public ResponseEntity<Page<Enseignant>> getFormateurs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Long specialiteId) {
        Pageable pageable = PageRequest.of(page, size);
        Long coordinateurId = getCurrentCoordinateurId();
        String searchValue = (search != null && !search.trim().isEmpty()) ? search.trim() : "";
        Page<Enseignant> result = enseignantRepository.findByCoordinateurIdWithFilters(coordinateurId, specialiteId, searchValue, pageable);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/apprenants")
    public ResponseEntity<Page<Apprenant>> getApprenants(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false, defaultValue = "") String search,
            @RequestParam(required = false) Long specialiteId,
            @RequestParam(required = false) Long formateurId) {
        Pageable pageable = PageRequest.of(page, size);
        String nameFilter = (search != null && !search.trim().isEmpty()) ? search.trim() : "";
        Long coordinateurId = getCurrentCoordinateurId();
        Page<Apprenant> result;
        if (formateurId != null) {
            result = apprenantRepository.findByCoordinateurIdOrUnclaimedAndFiltersWithFormateurPriority(coordinateurId, nameFilter, specialiteId, formateurId, pageable);
        } else {
            result = apprenantRepository.findByCoordinateurIdOrUnclaimedAndFilters(coordinateurId, nameFilter, specialiteId, pageable);
        }
        return ResponseEntity.ok(result);
    }

    @GetMapping("/specialites")
    public ResponseEntity<List<Specialite>> getSpecialites() {
        return ResponseEntity.ok(specialiteRepository.findAll());
    }

    @GetMapping("/cycles")
    public ResponseEntity<List<com.certiflow.coordinateur.model.Cycle>> getCycles() {
        return ResponseEntity.ok(cycleRepository.findAll());
    }

    @GetMapping("/sujets")
    public ResponseEntity<List<Sujet>> getSujets() {
        Long coordinateurId = getCurrentCoordinateurId();
        return ResponseEntity.ok(sujetRepository.findByCoordinateurId(coordinateurId));
    }

    @GetMapping("/formateur/{id}/apprenants")
    public ResponseEntity<List<Long>> getAssignedApprenantIds(@PathVariable Long id) {
        Long coordinateurId = getCurrentCoordinateurId();
        List<Long> ids = apprenantRepository.findByCoordinateurIdAndEncadrantId(coordinateurId, id)
                .stream().map(Apprenant::getId).toList();
        return ResponseEntity.ok(ids);
    }

    @PostMapping("/assign")
    public ResponseEntity<?> assignApprenants(@RequestBody AssignRequest request) {
        Enseignant enseignant = enseignantRepository.findById(request.getEnseignantId())
                .orElseThrow(() -> new RuntimeException("Formateur non trouvé"));

        Long coordinateurId = getCurrentCoordinateurId();

        // Assign selected apprenants to this formateur
        if (request.getApprenantIds() != null && !request.getApprenantIds().isEmpty()) {
            Coordinateur coord = coordinateurRepository.findById(coordinateurId).orElseThrow();
            List<Apprenant> toAssign = apprenantRepository.findAllById(request.getApprenantIds());
            for (Apprenant apprenant : toAssign) {
                if (apprenant.getCoordinateur() == null || apprenant.getCoordinateur().getId().equals(coordinateurId)) {
                    apprenant.setEncadrant(enseignant);
                    apprenant.setCoordinateur(coord);
                }
            }
            apprenantRepository.saveAll(toAssign);
        }

        return ResponseEntity.ok(Map.of("message", "Affectations mises à jour avec succès !"));
    }

    @GetMapping("/apprenant/{id}/sujet")
    public ResponseEntity<Sujet> getSujetApprenant(@PathVariable Long id) {
        return sujetRepository.findByApprenantId(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.ok(new Sujet()));
    }

    @GetMapping("/formateur/{id}/sujets-disponibles")
    public ResponseEntity<List<Sujet>> getSujetsDisponiblesByFormateur(@PathVariable Long id) {
        return ResponseEntity.ok(sujetRepository.findByFormateurIdAndApprenantIsNull(id));
    }

    @PostMapping("/apprenant/{id}/affecter-sujet/{sujetId}")
    public ResponseEntity<Sujet> affecterSujet(
            @PathVariable Long id,
            @PathVariable Long sujetId) {
        Apprenant apprenant = apprenantRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Apprenant non trouvé"));
        Coordinateur coord = getCurrentCoordinateur();
        if (apprenant.getCoordinateur() == null) {
            apprenant.setCoordinateur(coord);
        }
        
        Sujet sujet = sujetRepository.findById(sujetId)
                .orElseThrow(() -> new RuntimeException("Sujet non trouvé"));

        if (sujet.getApprenant() != null && !sujet.getApprenant().getId().equals(id)) {
            throw new RuntimeException("Ce sujet est déjà attribué à un autre apprenant");
        }
                
        sujetRepository.findByApprenantId(id).ifPresent(oldSujet -> {
            if (!oldSujet.getId().equals(sujetId)) {
                if (oldSujet.getFormateur() != null) {
                    oldSujet.setApprenant(null);
                    sujetRepository.save(oldSujet);
                } else {
                    sujetRepository.delete(oldSujet);
                }
            }
        });
        
        sujet.setApprenant(apprenant);
        sujet.setModifiePar(coord);
        return ResponseEntity.ok(sujetRepository.save(sujet));
    }

    @PutMapping("/apprenant/{id}/sujet")
    public ResponseEntity<Sujet> updateSujetApprenant(
            @PathVariable Long id,
            @RequestBody SujetUpdateRequest request) {
        
        Apprenant apprenant = apprenantRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Apprenant non trouvé"));

        Coordinateur coord = getCurrentCoordinateur();
        if (apprenant.getCoordinateur() == null) {
            apprenant.setCoordinateur(coord);
        }
                
        Sujet sujet = sujetRepository.findByApprenantId(id).orElse(new Sujet());
        sujet.setApprenant(apprenant);
        sujet.setTitre(request.getTitre());
        sujet.setDescription(request.getDescription());
        sujet.setObjectifs(request.getObjectifs() != null ? request.getObjectifs() : List.of());
        sujet.setModifiePar(coord);
        
        return ResponseEntity.ok(sujetRepository.save(sujet));
    }

    @PutMapping("/apprenant/{id}/jury")
    public ResponseEntity<Apprenant> assignJury(@PathVariable Long id, @RequestBody com.certiflow.coordinateur.dto.JuryRequest request) {
        Apprenant apprenant = apprenantRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Apprenant not found"));

        Long coordinateurId = getCurrentCoordinateurId();
        if (apprenant.getCoordinateur() != null && !apprenant.getCoordinateur().getId().equals(coordinateurId)) {
            throw new RuntimeException("Accès non autorisé à cet apprenant");
        }

        if (apprenant.getCoordinateur() == null) {
            Coordinateur coord = coordinateurRepository.findById(coordinateurId).orElseThrow();
            apprenant.setCoordinateur(coord);
        }

        java.util.List<Enseignant> examinateurs = request.getExaminateursIds() != null && !request.getExaminateursIds().isEmpty() 
            ? enseignantRepository.findAllById(request.getExaminateursIds()) 
            : java.util.List.of();
            
        java.util.List<Enseignant> rapporteurs = request.getRapporteursIds() != null && !request.getRapporteursIds().isEmpty() 
            ? enseignantRepository.findAllById(request.getRapporteursIds()) 
            : java.util.List.of();

        apprenant.setExaminateurs(new java.util.HashSet<>(examinateurs));
        apprenant.setRapporteurs(new java.util.HashSet<>(rapporteurs));
        apprenant.setDateSoutenance(request.getDateSoutenance());

        return ResponseEntity.ok(apprenantRepository.save(apprenant));
    }

    @PostMapping("/random-assign")
    public ResponseEntity<Map<String, Object>> randomAssign() {
        Long coordinateurId = getCurrentCoordinateurId();
        Coordinateur coord = getCurrentCoordinateur();

        List<Apprenant> apprenants = apprenantRepository.findWithoutSujetByCoordinateurId(coordinateurId);
        List<Sujet> sujets = sujetRepository.findAvailableByCoordinateurId(coordinateurId);

        if (sujets.size() < apprenants.size()) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Pas assez de sujets disponibles (" + sujets.size() + ") pour " + apprenants.size() + " apprenants"
            ));
        }

        Collections.shuffle(apprenants);
        Collections.shuffle(sujets);

        int assigned = 0;
        for (int i = 0; i < apprenants.size(); i++) {
            Apprenant apprenant = apprenants.get(i);
            Sujet sujet = sujets.get(i);

            apprenant.setEncadrant(sujet.getFormateur());
            apprenant.setCoordinateur(coord);
            apprenantRepository.save(apprenant);

            sujet.setApprenant(apprenant);
            sujet.setModifiePar(coord);
            sujetRepository.save(sujet);

            assigned++;
        }

        return ResponseEntity.ok(Map.of(
            "success", true,
            "message", assigned + " apprenants ont été assignés aléatoirement",
            "assigned", assigned
        ));
    }

    @GetMapping("/random-assign-stats")
    public ResponseEntity<Map<String, Object>> getRandomAssignStats() {
        Long coordinateurId = getCurrentCoordinateurId();
        long apprenantsSansSujet = apprenantRepository.countWithoutSujetByCoordinateurId(coordinateurId);
        long sujetsDisponibles = sujetRepository.countAvailableByCoordinateurId(coordinateurId);
        return ResponseEntity.ok(Map.of(
            "apprenantsSansSujet", apprenantsSansSujet,
            "sujetsDisponibles", sujetsDisponibles
        ));
    }

    private Long getCurrentCoordinateurId() {
        return getCurrentCoordinateur().getId();
    }

    private Coordinateur getCurrentCoordinateur() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        return coordinateurRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Coordinateur non trouvé"));
    }
}
