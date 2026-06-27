package com.certiflow.coordinateur.repository;

import com.certiflow.coordinateur.model.Sujet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SujetRepository extends JpaRepository<Sujet, Long> {
    Optional<Sujet> findByApprenantId(Long apprenantId);

    @Query("SELECT s FROM Sujet s JOIN s.apprenant a WHERE a.coordinateur.id = :coordinateurId")
    List<Sujet> findByCoordinateurId(@Param("coordinateurId") Long coordinateurId);
}
