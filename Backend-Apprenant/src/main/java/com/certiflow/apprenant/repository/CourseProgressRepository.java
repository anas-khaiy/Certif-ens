package com.certiflow.apprenant.repository;

import com.certiflow.apprenant.model.CourseProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface CourseProgressRepository extends JpaRepository<CourseProgress, Long> {
    Optional<CourseProgress> findByApprenantIdAndCourseId(Long apprenantId, Long courseId);

    // Safer for concurrent creations cleanup
    List<CourseProgress> findAllByApprenantIdAndCourseId(Long apprenantId, Long courseId);
}
