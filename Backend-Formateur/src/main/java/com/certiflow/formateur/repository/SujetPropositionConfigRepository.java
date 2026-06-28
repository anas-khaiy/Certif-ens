package com.certiflow.formateur.repository;

import com.certiflow.formateur.model.SujetPropositionConfig;
import com.certiflow.formateur.model.Enseignant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SujetPropositionConfigRepository extends JpaRepository<SujetPropositionConfig, Long> {
    Optional<SujetPropositionConfig> findByFormateursConcernesContains(Enseignant enseignant);
}
