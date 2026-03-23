package com.certiflow.formateur.controller;

import com.certiflow.formateur.model.Formation;
import com.certiflow.formateur.repository.FormationRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.List;

@RestController
@RequestMapping("/api/v1/formations")
public class FormationController {

    private final FormationRepository repository;

    public FormationController(FormationRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<Formation> getAllFormations() {
        return repository.findAll();
    }
}


