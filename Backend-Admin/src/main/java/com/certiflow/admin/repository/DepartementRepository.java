package com.certiflow.admin.repository;

import com.certiflow.admin.model.Departement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DepartementRepository extends JpaRepository<Departement, Long> {
    @org.springframework.data.jpa.repository.Query("SELECT d FROM Departement d WHERE LOWER(TRIM(d.nom)) = LOWER(TRIM(:nom))")
    Optional<Departement> findByNomIgnoreCase(String nom);
}
