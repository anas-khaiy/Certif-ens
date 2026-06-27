package com.certiflow.admin.controller;

import com.certiflow.admin.model.Coordinateur;
import com.certiflow.admin.service.CoordinateurService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/coordinateurs")
public class CoordinateurController {

    private final CoordinateurService coordinateurService;

    public CoordinateurController(CoordinateurService coordinateurService) {
        this.coordinateurService = coordinateurService;
    }

    @GetMapping
    public ResponseEntity<List<Coordinateur>> getAllCoordinateurs() {
        return ResponseEntity.ok(coordinateurService.getAllCoordinateurs());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Coordinateur> getCoordinateurById(@PathVariable Long id) {
        return ResponseEntity.ok(coordinateurService.getCoordinateurById(id));
    }

    @PostMapping
    public ResponseEntity<Coordinateur> createCoordinateur(@RequestBody Coordinateur coordinateur) {
        return ResponseEntity.status(HttpStatus.CREATED).body(coordinateurService.saveCoordinateur(coordinateur));
    }

    @PostMapping("/from-formateur/{enseignantId}")
    public ResponseEntity<?> promoteFromEnseignant(@PathVariable Long enseignantId) {
        try {
            Coordinateur coordinateur = coordinateurService.promoteFromEnseignant(enseignantId);
            return ResponseEntity.status(HttpStatus.CREATED).body(coordinateur);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<Coordinateur> updateCoordinateur(@PathVariable Long id, @RequestBody Coordinateur coordinateur) {
        return ResponseEntity.ok(coordinateurService.updateCoordinateur(id, coordinateur));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCoordinateur(@PathVariable Long id) {
        coordinateurService.deleteCoordinateur(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/batch-delete")
    public ResponseEntity<Void> deleteMultipleCoordinateurs(@RequestBody List<Long> ids) {
        coordinateurService.deleteMultipleCoordinateurs(ids);
        return ResponseEntity.noContent().build();
    }

    // Helper record for error responses
    record ErrorResponse(String message) {}
}
