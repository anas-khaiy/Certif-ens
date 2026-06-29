package com.certiflow.admin.repository;

import com.certiflow.admin.model.Enseignant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EnseignantRepository extends JpaRepository<Enseignant, Long> {
    Optional<Enseignant> findByEmail(String email);

    boolean existsByEmail(String email);

    List<Enseignant> findByCoordinateurId(Long coordinateurId);
}
