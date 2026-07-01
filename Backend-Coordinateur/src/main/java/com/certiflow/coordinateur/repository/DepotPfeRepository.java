package com.certiflow.coordinateur.repository;

import com.certiflow.coordinateur.model.DepotPfe;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DepotPfeRepository extends JpaRepository<DepotPfe, Long> {

    @Query("SELECT d FROM DepotPfe d JOIN FETCH d.apprenant a LEFT JOIN FETCH a.specialite LEFT JOIN FETCH a.sujetDetails ORDER BY d.dateDepot DESC")
    List<DepotPfe> findAllWithDetails();

    @Query("SELECT d FROM DepotPfe d JOIN FETCH d.apprenant a LEFT JOIN FETCH a.specialite LEFT JOIN FETCH a.sujetDetails WHERE a.coordinateur.id = :coordinateurId ORDER BY d.dateDepot DESC")
    List<DepotPfe> findAllWithDetailsByCoordinateurId(@Param("coordinateurId") Long coordinateurId);

    List<DepotPfe> findByApprenantId(Long apprenantId);

    Optional<DepotPfe> findByApprenantIdAndTypeDepot(Long apprenantId, String typeDepot);
}
