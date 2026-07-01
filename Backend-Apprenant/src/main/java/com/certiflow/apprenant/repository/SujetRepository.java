package com.certiflow.apprenant.repository;

import com.certiflow.apprenant.model.Sujet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SujetRepository extends JpaRepository<Sujet, Long> {
    Optional<Sujet> findByApprenantId(Long apprenantId);
    List<Sujet> findByApprenantIsNull();

    @Query("SELECT s FROM Sujet s WHERE s.formateur.coordinateurId = :coordinateurId AND s.selectionActive = true")
    List<Sujet> findByCoordinateurId(@Param("coordinateurId") Long coordinateurId);
}
