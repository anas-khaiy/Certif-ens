package com.certiflow.formateur.repository;

import com.certiflow.formateur.model.BundleEnrollment;
import com.certiflow.formateur.model.BundleEnrollmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BundleEnrollmentRepository extends JpaRepository<BundleEnrollment, Long> {
    List<BundleEnrollment> findByBundleId(Long bundleId);
    void deleteByBundleId(Long bundleId);
    List<BundleEnrollment> findByEnseignantId(Long enseignantId);
    List<BundleEnrollment> findByEnseignantEmail(String email);
    List<BundleEnrollment> findByApprenantEmail(String email);
    List<BundleEnrollment> findByStatus(BundleEnrollmentStatus status);
}
