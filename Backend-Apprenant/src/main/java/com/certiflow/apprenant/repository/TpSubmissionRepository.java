package com.certiflow.apprenant.repository;

import com.certiflow.apprenant.model.TpSubmission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface TpSubmissionRepository extends JpaRepository<TpSubmission, Long> {
    List<TpSubmission> findByApprenantIdAndCourseId(Long apprenantId, Long courseId);
    Optional<TpSubmission> findByApprenantIdAndCourseIdAndSubSectionId(Long apprenantId, Long courseId, String subSectionId);
}
