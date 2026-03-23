package com.certiflow.apprenant.service;

import com.certiflow.apprenant.model.Apprenant;
import com.certiflow.apprenant.model.Course;
import com.certiflow.apprenant.model.Enrollment;
import com.certiflow.apprenant.model.EnrollmentStatus;
import com.certiflow.apprenant.repository.ApprenantRepository;
import com.certiflow.apprenant.repository.CourseRepository;
import com.certiflow.apprenant.repository.EnrollmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class EnrollmentService {
    private final EnrollmentRepository enrollmentRepository;
    private final CourseRepository courseRepository;
    private final ApprenantRepository apprenantRepository;

    public Enrollment requestEnrollment(Long courseId, String email) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cours non trouvé"));

        Apprenant apprenant = apprenantRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Apprenant non trouvé"));

        if (enrollmentRepository.findByApprenantEmailAndCourseId(email, courseId).isPresent()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Vous avez déjà envoyé une demande pour ce cours");
        }

        Enrollment enrollment = Enrollment.builder()
                .course(course)
                .apprenant(apprenant)
                .status(EnrollmentStatus.PENDING)
                .requestedAt(LocalDateTime.now())
                .build();

        Enrollment savedEnrollment = enrollmentRepository.save(enrollment);
        return savedEnrollment;
    }

    public Enrollment reRequestEnrollment(Long courseId, String email) {
        // Check for an existing rejected enrollment and update it to PENDING
        Optional<Enrollment> existing = enrollmentRepository.findByApprenantEmailAndCourseId(email, courseId);
        if (existing.isPresent()) {
            Enrollment enrollment = existing.get();
            if (enrollment.getStatus() == EnrollmentStatus.REJECTED) {
                enrollment.setStatus(EnrollmentStatus.PENDING);
                enrollment.setRequestedAt(LocalDateTime.now());
                enrollment.setProcessedAt(null);
                return enrollmentRepository.save(enrollment);
            } else if (enrollment.getStatus() == EnrollmentStatus.PENDING) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Vous avez déjà une demande en attente");
            } else {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Vous êtes déjà inscrit à ce cours");
            }
        }
        // No existing enrollment, create a new one
        return requestEnrollment(courseId, email);
    }

    public List<Enrollment> getMyEnrollments(String email) {
        return enrollmentRepository.findByApprenantEmail(email).stream()
                .filter(e -> e.getCourse() != null && e.getCourse().isPublished())
                .collect(java.util.stream.Collectors.toList());
    }

    public List<Enrollment> getMyAcceptedEnrollments(String email) {
        return enrollmentRepository.findByApprenantEmailAndStatus(email, EnrollmentStatus.ACCEPTED).stream()
                .filter(e -> e.getCourse() != null && e.getCourse().isPublished())
                .collect(java.util.stream.Collectors.toList());
    }
}
