package com.certiflow.formateur.repository;

import com.certiflow.formateur.model.Sujet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SujetRepository extends JpaRepository<Sujet, Long> {
    Optional<Sujet> findByApprenantId(Long apprenantId);
    java.util.List<Sujet> findByFormateurId(Long formateurId);
    long countByFormateurId(Long formateurId);
}
