package com.certiflow.formateur.repository;

import com.certiflow.formateur.model.Enrollment;
import com.certiflow.formateur.model.EnrollmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EnrollmentRepository extends JpaRepository<Enrollment, Long> {
    List<Enrollment> findByCourseEnseignantEmail(String email);

    List<Enrollment> findByCourseEnseignantEmailAndStatus(String email, EnrollmentStatus status);
    List<Enrollment> findByApprenantEmailAndStatus(String email, EnrollmentStatus status);
}
