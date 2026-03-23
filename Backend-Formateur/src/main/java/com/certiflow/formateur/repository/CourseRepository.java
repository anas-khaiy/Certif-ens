package com.certiflow.formateur.repository;

import com.certiflow.formateur.model.Course;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface CourseRepository extends JpaRepository<Course, Long> {
    List<Course> findByEnseignantIdOrderByUpdatedAtDesc(Long enseignantId);

    List<Course> findByEnseignantEmailOrderByUpdatedAtDesc(String email);

    List<Course> findAllByOrderByUpdatedAtDesc();
}
