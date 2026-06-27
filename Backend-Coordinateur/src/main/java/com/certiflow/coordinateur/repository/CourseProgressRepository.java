package com.certiflow.coordinateur.repository;

import com.certiflow.coordinateur.model.CourseProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CourseProgressRepository extends JpaRepository<CourseProgress, Long> {
    List<CourseProgress> findByCourseId(Long courseId);
    List<CourseProgress> findByApprenantIdAndCourseId(Long apprenantId, Long courseId);
}
