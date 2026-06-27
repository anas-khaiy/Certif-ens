package com.certiflow.formateur.repository;

import com.certiflow.formateur.model.DepotPfe;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DepotPfeRepository extends JpaRepository<DepotPfe, Long> {
    List<DepotPfe> findByApprenantIdOrderByDateDepotDesc(Long apprenantId);
    Optional<DepotPfe> findByApprenantIdAndTypeDepot(Long apprenantId, String typeDepot);
}
