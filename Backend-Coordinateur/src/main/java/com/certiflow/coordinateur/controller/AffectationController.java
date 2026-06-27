package com.certiflow.coordinateur.controller;

import com.certiflow.coordinateur.dto.AssignRequest;
import com.certiflow.coordinateur.model.Apprenant;
import com.certiflow.coordinateur.model.Coordinateur;
import com.certiflow.coordinateur.model.Enseignant;
import com.certiflow.coordinateur.model.Specialite;
import com.certiflow.coordinateur.repository.ApprenantRepository;
import com.certiflow.coordinateur.repository.CoordinateurRepository;
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

@RestController
@RequestMapping("/api/v1/coord/affectation")
public class AffectationController {

    private final EnseignantRepository enseignantRepository;
    private final ApprenantRepository apprenantRepository;
    private final SpecialiteRepository specialiteRepository;
    private final SujetRepository sujetRepository;
    private final CoordinateurRepository coordinateurRepository;

    public AffectationController(EnseignantRepository enseignantRepository,
                                  ApprenantRepository apprenantRepository,
                                  SpecialiteRepository specialiteRepository,
                                  SujetRepository sujetRepository,
                                  CoordinateurRepository coordinateurRepository) {
        this.enseignantRepository = enseignantRepository;
        this.apprenantRepository = apprenantRepository;
        this.specialiteRepository = specialiteRepository;
        this.sujetRepository = sujetRepository;
        this.coordinateurRepository = coordinateurRepository;
    }

    @GetMapping("/formateurs")
    public ResponseEntity<Page<Enseignant>> getFormateurs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Long specialiteId) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Enseignant> result;

        boolean hasSearch = (search != null && !search.trim().isEmpty());
        boolean hasSpecialite = (specialiteId != null);

        if (hasSearch && hasSpecialite) {
            result = enseignantRepository.findBySpecialiteIdAndSearch(specialiteId, search.trim(), pageable);
        } else if (hasSearch) {
            result = enseignantRepository.findByNomContainingIgnoreCaseOrPrenomContainingIgnoreCase(search.trim(), search.trim(), pageable);
        } else if (hasSpecialite) {
            result = enseignantRepository.findBySpecialiteId(specialiteId, pageable);
        } else {
            result = enseignantRepository.findByFilters(null, "", pageable);
        }
        
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

        // First, unassign all previously assigned to this formateur for this coordinator
        List<Apprenant> previouslyAssigned = apprenantRepository.findByCoordinateurIdAndEncadrantId(coordinateurId, enseignant.getId());
        for (Apprenant a : previouslyAssigned) {
            a.setEncadrant(null);
        }
        apprenantRepository.saveAll(previouslyAssigned);

        // Then assign selected ones (only those belonging to this coordinator or unassigned)
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

    @PutMapping("/apprenant/{id}/sujet")
    public ResponseEntity<Sujet> updateSujetApprenant(
            @PathVariable Long id,
            @RequestBody SujetUpdateRequest request) {
        
        Apprenant apprenant = apprenantRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Apprenant non trouvé"));

        Long coordinateurId = getCurrentCoordinateurId();
        if (apprenant.getCoordinateur() != null && !apprenant.getCoordinateur().getId().equals(coordinateurId)) {
            throw new RuntimeException("Accès non autorisé à cet apprenant");
        }
        if (apprenant.getCoordinateur() == null) {
            Coordinateur coord = coordinateurRepository.findById(coordinateurId).orElseThrow();
            apprenant.setCoordinateur(coord);
        }
                
        Sujet sujet = sujetRepository.findByApprenantId(id).orElse(new Sujet());
        sujet.setApprenant(apprenant);
        sujet.setTitre(request.getTitre());
        sujet.setDescription(request.getDescription());
        sujet.setObjectifs(request.getObjectifs() != null ? request.getObjectifs() : List.of());
        
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

    private Long getCurrentCoordinateurId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        Coordinateur coordinateur = coordinateurRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Coordinateur non trouvé"));
        return coordinateur.getId();
    }
}
