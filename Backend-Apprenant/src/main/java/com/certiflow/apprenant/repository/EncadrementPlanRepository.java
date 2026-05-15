package com.certiflow.apprenant.repository;

import com.certiflow.apprenant.model.EncadrementPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface EncadrementPlanRepository extends JpaRepository<EncadrementPlan, Long> {
    
    @Query("SELECT p FROM EncadrementPlan p LEFT JOIN FETCH p.trainer WHERE p.apprenantId = :apprenantId")
    List<EncadrementPlan> findByApprenantId(@Param("apprenantId") Long apprenantId);
    
    List<EncadrementPlan> findByTrainer_Id(Long trainerId);
}
