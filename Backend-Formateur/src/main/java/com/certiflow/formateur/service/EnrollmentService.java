package com.certiflow.formateur.service;

import com.certiflow.formateur.model.Enrollment;
import com.certiflow.formateur.model.EnrollmentStatus;
import com.certiflow.formateur.repository.EnrollmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class EnrollmentService {
    private final EnrollmentRepository enrollmentRepository;

    public List<Enrollment> getEnrollmentRequests(String email) {
        return enrollmentRepository.findByCourseEnseignantEmail(email);
    }

    public List<Enrollment> getPendingRequests(String email) {
        return enrollmentRepository.findByCourseEnseignantEmailAndStatus(email, EnrollmentStatus.PENDING);
    }

    public Enrollment processEnrollment(Long enrollmentId, EnrollmentStatus status, String email) {
        Enrollment enrollment = enrollmentRepository.findById(enrollmentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Inscription non trouvée"));

        // Check if the trainer is the owner of the course
        if (!enrollment.getCourse().getEnseignant().getEmail().equals(email)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Accès refusé");
        }

        enrollment.setStatus(status);
        enrollment.setProcessedAt(LocalDateTime.now());
        return enrollmentRepository.save(enrollment);
    }

    public List<com.certiflow.formateur.model.Apprenant> getEnrolledLearners(String email) {
        return enrollmentRepository.findByCourseEnseignantEmailAndStatus(email, EnrollmentStatus.ACCEPTED)
                .stream()
                .map(Enrollment::getApprenant)
                .distinct()
                .toList();
    }
}
