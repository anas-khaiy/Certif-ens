package com.certiflow.apprenant.controller;

import com.certiflow.apprenant.model.Formation;
import com.certiflow.apprenant.repository.FormationRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/formations")
public class FormationController {

    private final FormationRepository repository;

    public FormationController(FormationRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public ResponseEntity<List<Formation>> getAllFormations() {
        return ResponseEntity.ok(repository.findAll());
    }
}
