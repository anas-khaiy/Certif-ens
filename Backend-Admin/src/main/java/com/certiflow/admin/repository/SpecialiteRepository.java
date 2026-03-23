package com.certiflow.admin.repository;

import com.certiflow.admin.model.Specialite;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SpecialiteRepository extends JpaRepository<Specialite, Long> {
    @org.springframework.data.jpa.repository.Query("SELECT s FROM Specialite s WHERE LOWER(TRIM(s.nom)) = LOWER(TRIM(:nom))")
    Optional<Specialite> findByNomIgnoreCase(String nom);
}
