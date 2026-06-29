package com.certiflow.apprenant.repository;

import com.certiflow.apprenant.model.Sujet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SujetRepository extends JpaRepository<Sujet, Long> {
    Optional<Sujet> findByApprenantId(Long apprenantId);
    List<Sujet> findByApprenantIsNull();
}
