package com.certiflow.formateur.service;

import com.certiflow.formateur.model.EncadrementPlan;
import com.certiflow.formateur.model.Enseignant;
import com.certiflow.formateur.repository.EncadrementPlanRepository;
import com.certiflow.formateur.repository.EnseignantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class EncadrementService {

    private final EncadrementPlanRepository planRepository;
    private final EnseignantRepository enseignantRepository;

    public List<EncadrementPlan> getPlansByApprenant(Long apprenantId) {
        return planRepository.findByApprenantId(apprenantId);
    }

    public List<EncadrementPlan> getPlansByTrainer(String trainerEmail) {
        Enseignant trainer = enseignantRepository.findByEmail(trainerEmail)
                .orElseThrow(() -> new RuntimeException("Trainer not found"));
        return planRepository.findByTrainer_Id(trainer.getId());
    }

    @Transactional
    public EncadrementPlan savePlan(EncadrementPlan plan, String trainerEmail) {
        Enseignant trainer = enseignantRepository.findByEmail(trainerEmail)
                .orElseThrow(() -> new RuntimeException("Trainer not found"));
        
        plan.setTrainer(trainer);
        
        // Setup relationships for JPA persistence
        if (plan.getPhases() != null) {
            plan.getPhases().forEach(phase -> {
                phase.setPlan(plan);
                if (phase.getTasks() != null) {
                    phase.getTasks().forEach(task -> task.setPhase(phase));
                }
            });
        }
        
        return planRepository.save(plan);
    }

    @Transactional
    public void deletePlan(Long planId) {
        planRepository.deleteById(planId);
    }
}
