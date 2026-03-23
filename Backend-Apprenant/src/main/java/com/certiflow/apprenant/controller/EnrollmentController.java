package com.certiflow.apprenant.controller;

import com.certiflow.apprenant.model.Enrollment;
import com.certiflow.apprenant.service.EnrollmentService;
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

    @PostMapping("/{courseId}/request")
    public ResponseEntity<Enrollment> requestEnrollment(@PathVariable Long courseId, Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED).build();
        }
        String email = auth.getName();
        return ResponseEntity.ok(enrollmentService.requestEnrollment(courseId, email));
    }

    @GetMapping("/my")
    public ResponseEntity<List<Enrollment>> getMyEnrollments(Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED).build();
        }
        String email = auth.getName();
        return ResponseEntity.ok(enrollmentService.getMyEnrollments(email));
    }

    @PostMapping("/{courseId}/re-request")
    public ResponseEntity<Enrollment> reRequestEnrollment(@PathVariable Long courseId, Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED).build();
        }
        String email = auth.getName();
        return ResponseEntity.ok(enrollmentService.reRequestEnrollment(courseId, email));
    }

    @GetMapping("/my/accepted")
    public ResponseEntity<List<Enrollment>> getMyAcceptedEnrollments(Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED).build();
        }
        String email = auth.getName();
        return ResponseEntity.ok(enrollmentService.getMyAcceptedEnrollments(email));
    }
}
