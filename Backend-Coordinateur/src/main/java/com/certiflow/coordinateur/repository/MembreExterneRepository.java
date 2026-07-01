package com.certiflow.coordinateur.repository;

import com.certiflow.coordinateur.model.MembreExterne;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MembreExterneRepository extends JpaRepository<MembreExterne, Long> {
    List<MembreExterne> findByCoordinateurId(Long coordinateurId);
}
