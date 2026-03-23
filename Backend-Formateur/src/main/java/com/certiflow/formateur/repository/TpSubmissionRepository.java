package com.certiflow.formateur.repository;

import com.certiflow.formateur.model.TpSubmission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface TpSubmissionRepository extends JpaRepository<TpSubmission, Long> {
    List<TpSubmission> findByCourseId(Long courseId);
    List<TpSubmission> findByCourseIdAndApprenantId(Long courseId, Long apprenantId);
}
