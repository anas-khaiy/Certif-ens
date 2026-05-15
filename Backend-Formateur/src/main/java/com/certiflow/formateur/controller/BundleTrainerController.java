package com.certiflow.formateur.controller;

import com.certiflow.formateur.model.Bundle;
import com.certiflow.formateur.model.BundleEnrollment;
import com.certiflow.formateur.service.BundleAdminService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/bundles")
public class BundleTrainerController {

    private final BundleAdminService service;

    public BundleTrainerController(BundleAdminService service) {
        this.service = service;
    }

    @GetMapping("/trainer/published")
    public ResponseEntity<List<Bundle>> getPublishedBundles() {
        return ResponseEntity.ok(service.getPublishedBundles());
    }

    @PostMapping("/trainer/enroll/{bundleId}")
    public ResponseEntity<BundleEnrollment> enroll(@PathVariable Long bundleId) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(service.enrollInBundle(bundleId, email));
    }

    @GetMapping("/trainer/my-enrollments")
    public ResponseEntity<List<Map<String, Object>>> getMyEnrollments() {
        String email = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getName();
        List<BundleEnrollment> enrollments = service.getUserEnrollments(email);
        
        List<Map<String, Object>> result = new java.util.ArrayList<>();
        for (BundleEnrollment e : enrollments) {
            Map<String, Object> map = new java.util.HashMap<>();
            map.put("enrollment", e);
            map.put("progress", service.getEnrollmentProgress(e.getId()));
            result.add(map);
        }
        
        return ResponseEntity.ok(result);
    }

    @GetMapping("/trainer/check-course-access/{courseId}")
    public ResponseEntity<Map<String, Boolean>> checkCourseAccess(@PathVariable Long courseId) {
        String email = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getName();
        boolean hasAccess = service.isCourseInAcceptedBundle(courseId, email);
        return ResponseEntity.ok(Collections.singletonMap("hasAccess", hasAccess));
    }

    @GetMapping("/trainer/my-enrollments/{bundleId}/detailed-progress")
    public ResponseEntity<Map<String, Object>> getDetailedProgress(@PathVariable Long bundleId) {
        String email = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(service.getBundleDetailedProgress(bundleId, email));
    }

    @GetMapping("/trainer/my-enrollments/{bundleId}/performance")
    public ResponseEntity<Map<String, Object>> getBundlePerformance(@PathVariable Long bundleId) {
        String email = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(service.getBundlePerformance(bundleId, email));
    }
}
