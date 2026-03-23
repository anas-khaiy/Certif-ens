package com.certiflow.admin.service;

import com.certiflow.admin.model.Cycle;
import com.certiflow.admin.repository.CycleRepository;
import org.springframework.stereotype.Service;

import java.util.List;

import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class CycleService {

    private final CycleRepository cycleRepository;

    public CycleService(CycleRepository cycleRepository) {
        this.cycleRepository = cycleRepository;
    }

    public List<Cycle> getAllCycles() {
        return cycleRepository.findAll();
    }

    public Cycle getCycleById(Long id) {
        return cycleRepository.findById(id).orElseThrow(() -> new RuntimeException("Cycle not found"));
    }

    public Cycle saveCycle(Cycle cycle) {
        if (cycle.getNomCycle() == null) {
            throw new RuntimeException("Le nom du cycle est obligatoire");
        }
        String lowerName = cycle.getNomCycle().trim().toLowerCase();
        if (cycleRepository.findByNomCycleIgnoreCase(lowerName).isPresent()) {
            throw new RuntimeException("Un cycle avec ce nom existe déjà");
        }

        cycle.setNomCycle(lowerName);
        return cycleRepository.save(cycle);
    }

    public Cycle updateCycle(Long id, Cycle cycleDetails) {
        Cycle cycle = getCycleById(id);
        String lowerName = cycleDetails.getNomCycle().trim().toLowerCase();

        // If the name changed, check if the new name already exists
        if (!cycle.getNomCycle().equals(lowerName)) {
            if (cycleRepository.findByNomCycleIgnoreCase(lowerName).isPresent()) {
                throw new RuntimeException("Un cycle avec ce nom existe déjà");
            }
        }

        cycle.setNomCycle(lowerName);
        return cycleRepository.save(cycle);
    }

    public void deleteCycle(Long id) {
        cycleRepository.deleteById(id);
    }
}
