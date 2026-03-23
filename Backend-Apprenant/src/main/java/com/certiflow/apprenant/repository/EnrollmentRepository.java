package com.certiflow.apprenant.repository;

import com.certiflow.apprenant.model.Enrollment;
import com.certiflow.apprenant.model.EnrollmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EnrollmentRepository extends JpaRepository<Enrollment, Long> {
    List<Enrollment> findByApprenantEmail(String email);

    Optional<Enrollment> findByApprenantEmailAndCourseId(String email, Long courseId);

    @org.springframework.data.jpa.repository.Query("SELECT e FROM Enrollment e LEFT JOIN FETCH e.course c LEFT JOIN FETCH c.enseignant t LEFT JOIN FETCH e.apprenant a WHERE e.id = :id")
    Optional<Enrollment> findByIdWithDetails(@org.springframework.data.repository.query.Param("id") Long id);

    @org.springframework.data.jpa.repository.Query("SELECT e FROM Enrollment e LEFT JOIN FETCH e.course c LEFT JOIN FETCH c.enseignant t LEFT JOIN FETCH e.apprenant a WHERE e.apprenant.email = :email AND e.status = :status")
    List<Enrollment> findByApprenantEmailAndStatus(
            @org.springframework.data.repository.query.Param("email") String email,
            @org.springframework.data.repository.query.Param("status") EnrollmentStatus status);
}
