package com.certiflow.coordinateur.repository;

import com.certiflow.coordinateur.model.Coordinateur;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CoordinateurRepository extends JpaRepository<Coordinateur, Long> {
    Optional<Coordinateur> findByEmail(String email);
}
