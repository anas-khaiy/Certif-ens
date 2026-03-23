package com.certiflow.formateur.repository;

import com.certiflow.formateur.model.CertificationPrototype;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CertificationPrototypeRepository extends JpaRepository<CertificationPrototype, Long> {
}
