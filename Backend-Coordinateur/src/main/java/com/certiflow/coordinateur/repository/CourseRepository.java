package com.certiflow.coordinateur.repository;

import com.certiflow.coordinateur.model.Course;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface CourseRepository extends JpaRepository<Course, Long> {
    List<Course> findByCoordinateurIdOrderByUpdatedAtDesc(Long coordinateurId);

    List<Course> findByCoordinateurEmailOrderByUpdatedAtDesc(String email);

    List<Course> findAllByOrderByUpdatedAtDesc();
}
