package com.certiflow.admin.repository;

import com.certiflow.admin.model.CertificationPrototype;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CertificationPrototypeRepository extends JpaRepository<CertificationPrototype, Long> {
}
