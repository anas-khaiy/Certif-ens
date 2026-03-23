package com.certiflow.admin.repository;

import com.certiflow.admin.model.Cycle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CycleRepository extends JpaRepository<Cycle, Long> {
    @org.springframework.data.jpa.repository.Query("SELECT c FROM Cycle c WHERE LOWER(TRIM(c.nomCycle)) = LOWER(TRIM(:nomCycle))")
    Optional<Cycle> findByNomCycleIgnoreCase(String nomCycle);
}
