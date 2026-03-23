package com.certiflow.formateur.controller;

import com.certiflow.formateur.model.Apprenant;
import com.certiflow.formateur.repository.ApprenantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/learners")
@RequiredArgsConstructor
public class LearnerController {

    private final ApprenantRepository apprenantRepository;

    @GetMapping
    public ResponseEntity<List<Apprenant>> getAllLearners() {
        return ResponseEntity.ok(apprenantRepository.findAll());
    }

    @PostMapping
    public ResponseEntity<Apprenant> addLearner(@RequestBody Apprenant apprenant) {
        if (apprenant.getPhotoProfile() == null) {
            apprenant.setPhotoProfile("default.png");
        }
        return ResponseEntity.ok(apprenantRepository.save(apprenant));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Apprenant> updateLearner(@PathVariable Long id, @RequestBody Apprenant details) {
        Apprenant apprenant = apprenantRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Apprenant non trouvé"));

        apprenant.setNom(details.getNom());
        apprenant.setPrenom(details.getPrenom());
        apprenant.setEmail(details.getEmail());
        apprenant.setCin(details.getCin());

        return ResponseEntity.ok(apprenantRepository.save(apprenant));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteLearner(@PathVariable Long id) {
        apprenantRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
