package com.certiflow.coordinateur.repository;

import com.certiflow.coordinateur.model.EncadrementPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EncadrementPlanRepository extends JpaRepository<EncadrementPlan, Long> {
    List<EncadrementPlan> findByApprenantId(Long apprenantId);
    List<EncadrementPlan> findByTrainer_Id(Long trainerId);
}
