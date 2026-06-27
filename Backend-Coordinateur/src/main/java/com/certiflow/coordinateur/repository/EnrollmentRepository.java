package com.certiflow.coordinateur.repository;

import com.certiflow.coordinateur.model.Enrollment;
import com.certiflow.coordinateur.model.EnrollmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EnrollmentRepository extends JpaRepository<Enrollment, Long> {
    List<Enrollment> findByCourseCoordinateurEmail(String email);

    List<Enrollment> findByCourseCoordinateurEmailAndStatus(String email, EnrollmentStatus status);
    List<Enrollment> findByApprenantEmailAndStatus(String email, EnrollmentStatus status);
}
