package com.certiflow.coordinateur.repository;

import com.certiflow.coordinateur.model.CertificationPrototype;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CertificationPrototypeRepository extends JpaRepository<CertificationPrototype, Long> {
}
