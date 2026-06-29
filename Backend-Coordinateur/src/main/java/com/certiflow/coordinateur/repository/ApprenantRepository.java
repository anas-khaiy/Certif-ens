package com.certiflow.coordinateur.repository;

import com.certiflow.coordinateur.model.Apprenant;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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

    @Query("SELECT a FROM Apprenant a WHERE " +
           "(:nom = '' OR LOWER(a.nom) LIKE LOWER(CONCAT('%', :nom, '%')) OR LOWER(a.prenom) LIKE LOWER(CONCAT('%', :nom, '%'))) " +
           "AND (:specialiteId IS NULL OR a.specialite.id = :specialiteId)")
    Page<Apprenant> findByFilters(@Param("nom") String nom, @Param("specialiteId") Long specialiteId, Pageable pageable);

    @Query("SELECT a FROM Apprenant a WHERE " +
           "(:nom = '' OR LOWER(a.nom) LIKE LOWER(CONCAT('%', :nom, '%')) OR LOWER(a.prenom) LIKE LOWER(CONCAT('%', :nom, '%'))) " +
           "AND (:specialiteId IS NULL OR a.specialite.id = :specialiteId) " +
           "ORDER BY CASE WHEN a.encadrant.id = :formateurId THEN 0 ELSE 1 END, a.id ASC")
    Page<Apprenant> findByFiltersWithFormateurPriority(@Param("nom") String nom, @Param("specialiteId") Long specialiteId, @Param("formateurId") Long formateurId, Pageable pageable);

    List<Apprenant> findByEncadrantId(Long encadrantId);

    @Query("SELECT COUNT(DISTINCT e) FROM Apprenant a JOIN a.examinateurs e")
    long countDistinctExaminateurs();

    @Query("SELECT COUNT(DISTINCT r) FROM Apprenant a JOIN a.rapporteurs r")
    long countDistinctRapporteurs();

    @Query("SELECT COUNT(DISTINCT a.encadrant) FROM Apprenant a WHERE a.encadrant IS NOT NULL")
    long countDistinctEncadrants();

    @Query("SELECT COUNT(a) FROM Apprenant a WHERE a.encadrant IS NOT NULL AND a.sujetDetails IS NOT NULL")
    long countApprenantsWithSujetAndEncadrant();

    // ─── Coordinator-filtered queries ───────────────────────────────────────

    @Query("SELECT COUNT(a) FROM Apprenant a WHERE a.coordinateur.id = :coordinateurId OR a.coordinateur IS NULL")
    long countByCoordinateurIdOrUnclaimed(@Param("coordinateurId") Long coordinateurId);

    @Query("SELECT a FROM Apprenant a WHERE (a.coordinateur.id = :coordinateurId OR a.coordinateur IS NULL) AND " +
           "(:nom = '' OR LOWER(a.nom) LIKE LOWER(CONCAT('%', :nom, '%')) OR LOWER(a.prenom) LIKE LOWER(CONCAT('%', :nom, '%'))) " +
           "AND (:specialiteId IS NULL OR a.specialite.id = :specialiteId)")
    Page<Apprenant> findByCoordinateurIdOrUnclaimedAndFilters(@Param("coordinateurId") Long coordinateurId, @Param("nom") String nom, @Param("specialiteId") Long specialiteId, Pageable pageable);

    @Query("SELECT a FROM Apprenant a WHERE " +
           "(:nom = '' OR LOWER(a.nom) LIKE LOWER(CONCAT('%', :nom, '%')) OR LOWER(a.prenom) LIKE LOWER(CONCAT('%', :nom, '%'))) " +
           "AND (:specialiteId IS NULL OR a.specialite.id = :specialiteId) " +
           "AND (:coordinateurId IS NULL OR a.coordinateur.id = :coordinateurId)")
    Page<Apprenant> findAllWithFilters(@Param("nom") String nom, @Param("specialiteId") Long specialiteId, @Param("coordinateurId") Long coordinateurId, Pageable pageable);

    @Query("SELECT a FROM Apprenant a WHERE (a.coordinateur.id = :coordinateurId OR a.coordinateur IS NULL) AND " +
           "(:nom = '' OR LOWER(a.nom) LIKE LOWER(CONCAT('%', :nom, '%')) OR LOWER(a.prenom) LIKE LOWER(CONCAT('%', :nom, '%'))) " +
           "AND (:specialiteId IS NULL OR a.specialite.id = :specialiteId) " +
           "ORDER BY CASE WHEN a.encadrant.id = :formateurId THEN 0 ELSE 1 END, a.id ASC")
    Page<Apprenant> findByCoordinateurIdOrUnclaimedAndFiltersWithFormateurPriority(@Param("coordinateurId") Long coordinateurId, @Param("nom") String nom, @Param("specialiteId") Long specialiteId, @Param("formateurId") Long formateurId, Pageable pageable);

    List<Apprenant> findByCoordinateurIdAndEncadrantId(Long coordinateurId, Long encadrantId);

    List<Apprenant> findByCoordinateurId(Long coordinateurId);

    @Query("SELECT COUNT(DISTINCT e) FROM Apprenant a JOIN a.examinateurs e WHERE a.coordinateur.id = :coordinateurId")
    long countDistinctExaminateursByCoordinateurId(@Param("coordinateurId") Long coordinateurId);

    @Query("SELECT COUNT(DISTINCT r) FROM Apprenant a JOIN a.rapporteurs r WHERE a.coordinateur.id = :coordinateurId")
    long countDistinctRapporteursByCoordinateurId(@Param("coordinateurId") Long coordinateurId);

    @Query("SELECT COUNT(DISTINCT a.encadrant) FROM Apprenant a WHERE a.encadrant IS NOT NULL AND a.coordinateur.id = :coordinateurId")
    long countDistinctEncadrantsByCoordinateurId(@Param("coordinateurId") Long coordinateurId);

    @Query("SELECT COUNT(a) FROM Apprenant a WHERE a.encadrant IS NOT NULL AND a.sujetDetails IS NOT NULL AND a.coordinateur.id = :coordinateurId")
    long countApprenantsWithSujetAndEncadrantByCoordinateurId(@Param("coordinateurId") Long coordinateurId);

    @Query("SELECT a FROM Apprenant a WHERE a.coordinateur.id = :coordinateurId AND a.sujetDetails IS NULL")
    List<Apprenant> findWithoutSujetByCoordinateurId(@Param("coordinateurId") Long coordinateurId);

    @Query("SELECT COUNT(a) FROM Apprenant a WHERE a.coordinateur.id = :coordinateurId AND a.sujetDetails IS NULL")
    long countWithoutSujetByCoordinateurId(@Param("coordinateurId") Long coordinateurId);

    @Query("SELECT a FROM Apprenant a WHERE a.coordinateur.id = :coordinateurId AND a.encadrant IS NOT NULL AND a.sujetDetails IS NOT NULL")
    List<Apprenant> findAssignedByCoordinateurId(@Param("coordinateurId") Long coordinateurId);

    @Query("SELECT COUNT(a) FROM Apprenant a WHERE a.coordinateur.id = :coordinateurId AND a.encadrant IS NOT NULL AND a.sujetDetails IS NOT NULL")
    long countAssignedByCoordinateurId(@Param("coordinateurId") Long coordinateurId);
}
