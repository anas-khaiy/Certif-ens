package com.certiflow.apprenant.repository;

import com.certiflow.apprenant.model.CertificationPrototype;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CertificationPrototypeRepository extends JpaRepository<CertificationPrototype, Long> {
    // There is usually only one template, so let's find the first one
    Optional<CertificationPrototype> findFirstByOrderByIdAsc();
}
