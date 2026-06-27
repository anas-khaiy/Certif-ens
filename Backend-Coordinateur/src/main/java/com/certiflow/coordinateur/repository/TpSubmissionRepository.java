package com.certiflow.coordinateur.repository;

import com.certiflow.coordinateur.model.TpSubmission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface TpSubmissionRepository extends JpaRepository<TpSubmission, Long> {
    List<TpSubmission> findByCourseId(Long courseId);
    List<TpSubmission> findByApprenantIdAndCourseIdAndSubSectionId(Long apprenantId, Long courseId, String subSectionId);
    List<TpSubmission> findByApprenantIdAndCourseId(Long apprenantId, Long courseId);
}
