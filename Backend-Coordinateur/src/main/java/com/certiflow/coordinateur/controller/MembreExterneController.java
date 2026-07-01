package com.certiflow.coordinateur.controller;

import com.certiflow.coordinateur.model.Coordinateur;
import com.certiflow.coordinateur.model.MembreExterne;
import com.certiflow.coordinateur.repository.CoordinateurRepository;
import com.certiflow.coordinateur.repository.MembreExterneRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/coord/membres-externes")
public class MembreExterneController {

    private final MembreExterneRepository membreExterneRepository;
    private final CoordinateurRepository coordinateurRepository;

    public MembreExterneController(MembreExterneRepository membreExterneRepository,
                                    CoordinateurRepository coordinateurRepository) {
        this.membreExterneRepository = membreExterneRepository;
        this.coordinateurRepository = coordinateurRepository;
    }

    @GetMapping
    public ResponseEntity<List<MembreExterne>> getAll() {
        Long coordinateurId = getCurrentCoordinateurId();
        return ResponseEntity.ok(membreExterneRepository.findByCoordinateurId(coordinateurId));
    }

    @PostMapping
    public ResponseEntity<MembreExterne> create(@RequestBody MembreExterne membre) {
        Coordinateur coord = getCurrentCoordinateur();
        membre.setCoordinateur(coord);
        return ResponseEntity.ok(membreExterneRepository.save(membre));
    }

    @PutMapping("/{id}")
    public ResponseEntity<MembreExterne> update(@PathVariable Long id, @RequestBody MembreExterne membre) {
        MembreExterne existing = membreExterneRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Membre externe non trouvé"));
        existing.setNom(membre.getNom());
        existing.setPrenom(membre.getPrenom());
        existing.setEmail(membre.getEmail());
        existing.setAffiliation(membre.getAffiliation());
        existing.setTelephone(membre.getTelephone());
        existing.setSpecialite(membre.getSpecialite());
        return ResponseEntity.ok(membreExterneRepository.save(existing));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> delete(@PathVariable Long id) {
        membreExterneRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Membre externe supprimé"));
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
