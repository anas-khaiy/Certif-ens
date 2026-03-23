package com.certiflow.formateur.controller;

import com.certiflow.formateur.model.Specialite;
import com.certiflow.formateur.repository.SpecialiteRepository;
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
    public List<Specialite> getAllSpecialites() {
        return repository.findAll();
    }
}
