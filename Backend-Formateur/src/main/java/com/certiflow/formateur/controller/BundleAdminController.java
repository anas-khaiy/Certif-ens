package com.certiflow.formateur.controller;

import com.certiflow.formateur.model.Bundle;
import com.certiflow.formateur.model.BundleEnrollment;
import com.certiflow.formateur.service.BundleAdminService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/bundles")
public class BundleAdminController {

    private final BundleAdminService service;

    public BundleAdminController(BundleAdminService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<List<Bundle>> getAllBundles() {
        return ResponseEntity.ok(service.getAllBundles());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Bundle> getBundleById(@PathVariable Long id) {
        return ResponseEntity.ok(service.getBundleById(id));
    }

    @PostMapping("/admin")
    public ResponseEntity<Bundle> createBundle(@RequestBody Map<String, Object> payload, 
                                               @RequestParam(required = false) Long specialtyId) {
        return ResponseEntity.ok(service.createBundle(payload, specialtyId));
    }

    @PutMapping("/admin/{id}")
    public ResponseEntity<Bundle> updateBundle(@PathVariable Long id,
                                               @RequestBody Map<String, Object> payload, 
                                               @RequestParam(required = false) Long specialtyId) {
        return ResponseEntity.ok(service.updateBundle(id, payload, specialtyId));
    }

    @DeleteMapping("/admin/{id}")
    public ResponseEntity<Void> deleteBundle(@PathVariable Long id) {
        service.deleteBundle(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/admin/enrollments")
    public ResponseEntity<List<BundleEnrollment>> getAllEnrollments() {
        return ResponseEntity.ok(service.getAllEnrollments());
    }

    @PatchMapping("/admin/enrollments/{id}/status")
    public ResponseEntity<BundleEnrollment> updateEnrollmentStatus(
            @PathVariable Long id,
            @RequestParam String status) {
        return ResponseEntity.ok(service.updateEnrollmentStatus(id, status));
    }

    @GetMapping("/admin/enrollments/{id}/progress")
    public ResponseEntity<Map<String, Double>> getEnrollmentProgress(@PathVariable Long id) {
        double progress = service.getEnrollmentProgress(id);
        return ResponseEntity.ok(Collections.singletonMap("progress", progress));
    }

    @GetMapping("/admin/enrollments/{id}/detailed-progress")
    public ResponseEntity<Map<String, Object>> getEnrollmentDetailedProgress(@PathVariable Long id) {
        return ResponseEntity.ok(service.getEnrollmentDetailedProgress(id));
    }

    @GetMapping("/admin/{id}/enrollments")
    public ResponseEntity<List<BundleEnrollment>> getEnrollmentsByBundle(@PathVariable Long id) {
        return ResponseEntity.ok(service.getEnrollmentsByBundle(id));
    }
}
