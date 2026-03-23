package com.certiflow.apprenant.controller;

import com.certiflow.apprenant.model.Specialite;
import com.certiflow.apprenant.repository.SpecialiteRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/specialites")
public class SpecialiteController {

    private final SpecialiteRepository repository;

    public SpecialiteController(SpecialiteRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public ResponseEntity<List<Specialite>> getAllSpecialites() {
        return ResponseEntity.ok(repository.findAll());
    }
}
