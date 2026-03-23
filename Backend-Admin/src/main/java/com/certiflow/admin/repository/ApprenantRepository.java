package com.certiflow.admin.repository;

import com.certiflow.admin.model.Apprenant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ApprenantRepository extends JpaRepository<Apprenant, Long> {
    Optional<Apprenant> findByEmail(String email);

    Optional<Apprenant> findByCin(String cin);

    boolean existsByEmail(String email);

    boolean existsByCin(String cin);
}
