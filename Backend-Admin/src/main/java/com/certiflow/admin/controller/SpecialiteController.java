package com.certiflow.admin.controller;

import com.certiflow.admin.model.Specialite;
import com.certiflow.admin.service.SpecialiteService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/specialites")
public class SpecialiteController {

    private final SpecialiteService specialityService;

    public SpecialiteController(SpecialiteService specialityService) {
        this.specialityService = specialityService;
    }

    @GetMapping
    public List<Specialite> getAllSpecialites() {
        return specialityService.getAllSpecialites();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Specialite> getSpecialiteById(@PathVariable Long id) {
        return ResponseEntity.ok(specialityService.getSpecialiteById(id));
    }

    @PostMapping
    public Specialite createSpecialite(@RequestBody Specialite speciality) {
        return specialityService.saveSpecialite(speciality);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Specialite> updateSpecialite(@PathVariable Long id, @RequestBody Specialite speciality) {
        return ResponseEntity.ok(specialityService.updateSpecialite(id, speciality));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSpecialite(@PathVariable Long id) {
        specialityService.deleteSpecialite(id);
        return ResponseEntity.noContent().build();
    }
}
