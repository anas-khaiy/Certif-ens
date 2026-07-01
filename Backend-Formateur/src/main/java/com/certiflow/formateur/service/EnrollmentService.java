package com.certiflow.formateur.service;

import com.certiflow.formateur.model.Bundle;
import com.certiflow.formateur.model.BundleEnrollment;
import com.certiflow.formateur.model.BundleEnrollmentStatus;
import com.certiflow.formateur.model.Apprenant;
import com.certiflow.formateur.model.Enseignant;
import com.certiflow.formateur.model.Enrollment;
import com.certiflow.formateur.model.EnrollmentStatus;
import com.certiflow.formateur.repository.ApprenantRepository;
import com.certiflow.formateur.repository.BundleEnrollmentRepository;
import com.certiflow.formateur.repository.BundleRepository;
import com.certiflow.formateur.repository.EnrollmentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class EnrollmentService {
    private final EnrollmentRepository enrollmentRepository;
    private final BundleEnrollmentRepository bundleEnrollmentRepository;
    private final BundleRepository bundleRepository;
    private final ApprenantRepository apprenantRepository;

    public List<Enrollment> getEnrollmentRequests(String email) {
        log.info("LOG_ENTRY: EnrollmentService.getEnrollmentRequests for {}", email);
        List<Enrollment> realEnrollments = enrollmentRepository.findByCourseEnseignantEmail(email);
        List<Enrollment> virtualEnrollments = getVirtualEnrollmentsFromBundles(email);
        
        List<Enrollment> combined = new java.util.ArrayList<>(realEnrollments);

        for (Enrollment ve : virtualEnrollments) {
            boolean alreadyExists = realEnrollments.stream().anyMatch(re -> 
                re.getCourse().getId().equals(ve.getCourse().getId()) && 
                re.getApprenant().getEmail().equalsIgnoreCase(ve.getApprenant().getEmail())
            );
            if (!alreadyExists) {
                combined.add(ve);
            }
        }
        
        return combined;
    }

    public List<Enrollment> getPendingRequests(String email) {
        return enrollmentRepository.findByCourseEnseignantEmailAndStatus(email, EnrollmentStatus.PENDING);
    }

    @Transactional
    public Enrollment processEnrollment(Long enrollmentId, EnrollmentStatus status, String email) {
        Enrollment enrollment = enrollmentRepository.findById(enrollmentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Inscription non trouvée"));

        // Check if the trainer is the owner of the course
        String normalizedEmail = email == null ? "" : email.trim();
        if (enrollment.getCourse().getEnseignant() == null || 
            !enrollment.getCourse().getEnseignant().getEmail().trim().equalsIgnoreCase(normalizedEmail)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Accès refusé");
        }

        enrollment.setStatus(status);
        enrollment.setProcessedAt(LocalDateTime.now());
        return enrollmentRepository.save(enrollment);
    }

    public List<com.certiflow.formateur.model.Apprenant> getEnrolledLearners(String email) {
        // 1. Direct enrollments
        List<com.certiflow.formateur.model.Apprenant> learners = enrollmentRepository.findByCourseEnseignantEmailAndStatus(email, EnrollmentStatus.ACCEPTED)
                .stream()
                .map(Enrollment::getApprenant)
                .distinct()
                .collect(java.util.stream.Collectors.toList());

        // 2. Bundle enrollments
        List<BundleEnrollment> bundleEnrollments = bundleEnrollmentRepository.findByStatus(BundleEnrollmentStatus.ACCEPTED);
        for (BundleEnrollment be : bundleEnrollments) {
            Bundle bundle = bundleRepository.findById(be.getBundleId()).orElse(null);
            if (bundle != null) {
                String normalizedEmail = email == null ? "" : email.trim().toLowerCase();
                boolean hasTrainerCourse = bundle.getCourses().stream()
                        .anyMatch(c -> c.getEnseignant() != null && 
                                  c.getEnseignant().getEmail().trim().toLowerCase().equals(normalizedEmail));
                
                if (hasTrainerCourse) {
                    if (be.getApprenant() != null) {
                        learners.add(be.getApprenant());
                    } else if (be.getEnseignant() != null) {
                        learners.add(convertToApprenant(be.getEnseignant()));
                    }
                }
            }
        }

        return learners.stream()
                .filter(l -> l != null && l.getEmail() != null)
                .collect(java.util.stream.Collectors.toMap(
                    com.certiflow.formateur.model.Apprenant::getEmail,
                    l -> l,
                    (l1, l2) -> l1
                ))
                .values().stream().toList();
    }

    public List<Enrollment> getMyAcceptedEnrollments(String email) {
        return enrollmentRepository.findByApprenantEmailAndStatus(email, EnrollmentStatus.ACCEPTED);
    }

    private List<Enrollment> getVirtualEnrollmentsFromBundles(String trainerEmail) {
        String normalizedTrainerEmail = trainerEmail == null ? "" : trainerEmail.trim().toLowerCase();
        log.info("Generating virtual enrollments for trainer: {}", normalizedTrainerEmail);
        List<Enrollment> virtuals = new java.util.ArrayList<>();
        List<BundleEnrollment> bundleEnrollments = bundleEnrollmentRepository.findByStatus(BundleEnrollmentStatus.ACCEPTED);
        
        log.info("Found {} accepted bundle enrollments in DB", bundleEnrollments.size());

        long mockIdCounter = -1000000;

        for (BundleEnrollment be : bundleEnrollments) {
            Bundle bundle = bundleRepository.findById(be.getBundleId()).orElse(null);
            if (bundle != null) {
                log.debug("Processing bundle: {} for enrollment ID: {}", bundle.getTitle(), be.getId());
                for (com.certiflow.formateur.model.Course course : bundle.getCourses()) {
                    if (course.getEnseignant() != null) {
                        String courseOwnerEmail = course.getEnseignant().getEmail().trim().toLowerCase();
                        
                        if (courseOwnerEmail.equals(normalizedTrainerEmail)) {
                            Apprenant student = null;
                            if (be.getApprenant() != null) {
                                student = be.getApprenant();
                            } else if (be.getEnseignant() != null) {
                                student = convertToApprenant(be.getEnseignant());
                            }

                            if (student != null) {
                                Enrollment virtual = Enrollment.builder()
                                        .id(mockIdCounter--)
                                        .course(course)
                                        .apprenant(student)
                                        .status(EnrollmentStatus.ACCEPTED)
                                        .requestedAt(be.getEnrolledAt() != null ? be.getEnrolledAt() : LocalDateTime.now())
                                        .processedAt(be.getEnrolledAt() != null ? be.getEnrolledAt() : LocalDateTime.now())
                                        .build();
                                virtuals.add(virtual);
                            }
                        }
                    }
                }
            }
        }
        log.info("Total virtual enrollments generated: {}", virtuals.size());
        return virtuals;
    }

    private Apprenant convertToApprenant(Enseignant e) {
        String email = e.getEmail().trim().toLowerCase();
        
        // Try to find a real learner account first to maintain identity consistency
        return apprenantRepository.findByEmail(email).orElseGet(() -> 
            Apprenant.builder()
                .id(-1000000L - e.getId())
                .nom(e.getNom())
                .prenom(e.getPrenom())
                .email(email)
                .photoProfile(e.getPhotoProfile())
                .specialite(e.getSpecialite())
                .build()
        );
    }
}
