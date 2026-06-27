package com.certiflow.coordinateur.repository;

import com.certiflow.coordinateur.model.BundleEnrollment;
import com.certiflow.coordinateur.model.BundleEnrollmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BundleEnrollmentRepository extends JpaRepository<BundleEnrollment, Long> {
    List<BundleEnrollment> findByBundleId(Long bundleId);
    void deleteByBundleId(Long bundleId);
    List<BundleEnrollment> findByCoordinateurId(Long coordinateurId);
    List<BundleEnrollment> findByCoordinateurEmail(String email);
    List<BundleEnrollment> findByApprenantEmail(String email);
    List<BundleEnrollment> findByStatus(BundleEnrollmentStatus status);
}
