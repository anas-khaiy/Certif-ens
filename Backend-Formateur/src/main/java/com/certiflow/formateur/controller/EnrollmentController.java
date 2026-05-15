package com.certiflow.formateur.controller;

import com.certiflow.formateur.model.Enrollment;
import com.certiflow.formateur.model.EnrollmentStatus;
import com.certiflow.formateur.service.EnrollmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/enrollments")
@RequiredArgsConstructor
public class EnrollmentController {
    private final EnrollmentService enrollmentService;

    @GetMapping
    public ResponseEntity<List<Enrollment>> getEnrollmentRequests(Authentication auth) {
        String email = auth.getName();
        return ResponseEntity.ok(enrollmentService.getEnrollmentRequests(email));
    }

    @GetMapping("/pending")
    public ResponseEntity<List<Enrollment>> getPendingRequests(Authentication auth) {
        String email = auth.getName();
        return ResponseEntity.ok(enrollmentService.getPendingRequests(email));
    }

    @PutMapping("/{id}/accept")
    public ResponseEntity<Enrollment> acceptEnrollment(@PathVariable Long id, Authentication auth) {
        String email = auth.getName();
        return ResponseEntity.ok(enrollmentService.processEnrollment(id, EnrollmentStatus.ACCEPTED, email));
    }

    @PutMapping("/{id}/reject")
    public ResponseEntity<Enrollment> rejectEnrollment(@PathVariable Long id, Authentication auth) {
        String email = auth.getName();
        return ResponseEntity.ok(enrollmentService.processEnrollment(id, EnrollmentStatus.REJECTED, email));
    }

    @GetMapping("/learners")
    public ResponseEntity<List<com.certiflow.formateur.model.Apprenant>> getEnrolledLearners(Authentication auth) {
        String email = auth.getName();
        return ResponseEntity.ok(enrollmentService.getEnrolledLearners(email));
    }

    @GetMapping("/my/accepted")
    public ResponseEntity<List<Enrollment>> getMyAcceptedEnrollments(Authentication auth) {
        String email = auth.getName();
        return ResponseEntity.ok(enrollmentService.getMyAcceptedEnrollments(email));
    }
}
