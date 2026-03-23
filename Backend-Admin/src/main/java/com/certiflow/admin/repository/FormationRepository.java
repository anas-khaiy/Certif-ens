package com.certiflow.admin.repository;

import com.certiflow.admin.model.Formation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface FormationRepository extends JpaRepository<Formation, Long> {
    java.util.Optional<Formation> findByNomIgnoreCase(String nom);
}
