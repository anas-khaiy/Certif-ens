package com.certiflow.coordinateur.repository;

import com.certiflow.coordinateur.model.EnvoiRapport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EnvoiRapportRepository extends JpaRepository<EnvoiRapport, Long> {
    List<EnvoiRapport> findByApprenantId(Long apprenantId);
    Optional<EnvoiRapport> findByApprenantIdAndTypeDepot(Long apprenantId, String typeDepot);
}
