package com.certiflow.apprenant.service;

import com.certiflow.apprenant.model.*;
import com.certiflow.apprenant.repository.ApprenantRepository;
import com.certiflow.apprenant.repository.EncadrementPlanRepository;
import com.certiflow.apprenant.repository.EncadrementTaskRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class EncadrementService {

    private final EncadrementPlanRepository planRepository;
    private final EncadrementTaskRepository taskRepository;
    private final ApprenantRepository apprenantRepository;

    public List<EncadrementPlan> getPlansByApprenantEmail(String email) {
        Apprenant apprenant = apprenantRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Apprenant not found"));
        return planRepository.findByApprenantId(apprenant.getId());
    }

    @Transactional
    public void updateTaskStatus(Long taskId, EncadrementTaskStatus status) {
        EncadrementTask task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));
        task.setStatus(status);
        taskRepository.save(task);
    }

    @Transactional
    public EncadrementPlan savePlan(EncadrementPlan plan) {
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
}
