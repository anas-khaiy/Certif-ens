package com.certiflow.apprenant.repository;

import com.certiflow.apprenant.model.Course;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface CourseRepository extends JpaRepository<Course, Long> {
    List<Course> findByPublishedTrueOrderByUpdatedAtDesc();

    List<Course> findAllByOrderByUpdatedAtDesc();
}
