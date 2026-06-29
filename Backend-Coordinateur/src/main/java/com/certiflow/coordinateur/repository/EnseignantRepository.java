package com.certiflow.coordinateur.repository;

import com.certiflow.coordinateur.model.Enseignant;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

@Repository
public interface EnseignantRepository extends JpaRepository<Enseignant, Long> {
    Page<Enseignant> findByNomContainingIgnoreCaseOrPrenomContainingIgnoreCase(String nom, String prenom, Pageable pageable);

    Page<Enseignant> findBySpecialiteId(Long specialiteId, Pageable pageable);

    @Query("SELECT e FROM Enseignant e WHERE e.specialite.id = :specialiteId AND (LOWER(e.nom) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(e.prenom) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Enseignant> findBySpecialiteIdAndSearch(@Param("specialiteId") Long specialiteId, @Param("search") String search, Pageable pageable);

    // ─── Coordinator-filtered queries ───────────────────────────────────────

    @Query("SELECT DISTINCT a.encadrant FROM Apprenant a WHERE a.coordinateur.id = :coordinateurId AND a.encadrant IS NOT NULL")
    List<Enseignant> findEncadrantsByCoordinateurId(@Param("coordinateurId") Long coordinateurId);

    @Query("SELECT DISTINCT e FROM Enseignant e, Apprenant a WHERE e MEMBER OF a.examinateurs AND a.coordinateur.id = :coordinateurId")
    List<Enseignant> findExaminateursByCoordinateurId(@Param("coordinateurId") Long coordinateurId);

    @Query("SELECT DISTINCT e FROM Enseignant e, Apprenant a WHERE e MEMBER OF a.rapporteurs AND a.coordinateur.id = :coordinateurId")
    List<Enseignant> findRapporteursByCoordinateurId(@Param("coordinateurId") Long coordinateurId);

    @Query("SELECT DISTINCT e FROM Enseignant e, Apprenant a WHERE (a.encadrant = e OR e MEMBER OF a.examinateurs OR e MEMBER OF a.rapporteurs) AND a.coordinateur.id = :coordinateurId")
    List<Enseignant> findAllEnseignantsByCoordinateurId(@Param("coordinateurId") Long coordinateurId);

    @Query("SELECT DISTINCT e FROM Enseignant e, Apprenant a WHERE (a.encadrant = e OR e MEMBER OF a.examinateurs OR e MEMBER OF a.rapporteurs) AND a.coordinateur.id = :coordinateurId AND " +
           "(:specialiteId IS NULL OR e.specialite.id = :specialiteId) AND " +
           "(:search = '' OR LOWER(e.nom) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(e.prenom) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Enseignant> findByCoordinateurIdAndFilters(@Param("coordinateurId") Long coordinateurId, @Param("specialiteId") Long specialiteId, @Param("search") String search, Pageable pageable);

    @Query("SELECT e FROM Enseignant e WHERE " +
           "(:specialiteId IS NULL OR e.specialite.id = :specialiteId) AND " +
           "(:search = '' OR LOWER(e.nom) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(e.prenom) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Enseignant> findByFilters(@Param("specialiteId") Long specialiteId, @Param("search") String search, Pageable pageable);

    @Query("SELECT e FROM Enseignant e WHERE e.coordinateur.id = :coordinateurId AND " +
           "(:specialiteId IS NULL OR e.specialite.id = :specialiteId) AND " +
           "(:search = '' OR LOWER(e.nom) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(e.prenom) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Enseignant> findByCoordinateurIdWithFilters(@Param("coordinateurId") Long coordinateurId, @Param("specialiteId") Long specialiteId, @Param("search") String search, Pageable pageable);
}
