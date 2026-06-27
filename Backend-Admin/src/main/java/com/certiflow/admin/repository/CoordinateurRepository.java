package com.certiflow.admin.repository;

import com.certiflow.admin.model.Coordinateur;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CoordinateurRepository extends JpaRepository<Coordinateur, Long> {
    Optional<Coordinateur> findByEmail(String email);
    boolean existsByEmail(String email);
}
