package com.certiflow.coordinateur.repository;

import com.certiflow.coordinateur.model.SujetPropositionConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SujetPropositionConfigRepository extends JpaRepository<SujetPropositionConfig, Long> {
    Optional<SujetPropositionConfig> findByCoordinateurId(Long coordinateurId);
}
