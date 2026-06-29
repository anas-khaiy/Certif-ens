package com.certiflow.coordinateur.repository;

import com.certiflow.coordinateur.model.SujetPropositionConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SujetPropositionConfigRepository extends JpaRepository<SujetPropositionConfig, Long> {
    Optional<SujetPropositionConfig> findByCoordinateurId(Long coordinateurId);

    @Query("SELECT DISTINCT ef.id FROM SujetPropositionConfig c JOIN c.formateursConcernes ef WHERE c.coordinateur.id != :coordinateurId")
    List<Long> findFormateurIdsInOtherConfigs(@Param("coordinateurId") Long coordinateurId);
}
