package com.certiflow.formateur.repository;

import com.certiflow.formateur.model.Apprenant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ApprenantRepository extends JpaRepository<Apprenant, Long> {
    Optional<Apprenant> findByEmail(String email);

    Optional<Apprenant> findByCin(String cin);

    boolean existsByEmail(String email);

    boolean existsByCin(String cin);

    @Query("SELECT a FROM Apprenant a WHERE a.encadrant.id = :enseignantId")
    List<Apprenant> findByEncadrantId(@Param("enseignantId") Long enseignantId);

    @Query("SELECT a FROM Apprenant a JOIN a.examinateurs e WHERE e.id = :enseignantId")
    List<Apprenant> findByExaminateurId(@Param("enseignantId") Long enseignantId);

    @Query("SELECT a FROM Apprenant a JOIN a.rapporteurs r WHERE r.id = :enseignantId")
    List<Apprenant> findByRapporteurId(@Param("enseignantId") Long enseignantId);
}
