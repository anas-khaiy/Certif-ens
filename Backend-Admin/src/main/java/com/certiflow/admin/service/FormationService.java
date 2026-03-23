package com.certiflow.admin.service;

import com.certiflow.admin.model.Formation;
import com.certiflow.admin.repository.FormationRepository;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class FormationService {

    private final FormationRepository formationRepository;

    public FormationService(FormationRepository formationRepository) {
        this.formationRepository = formationRepository;
    }

    public List<Formation> getAllFormations() {
        return formationRepository.findAll();
    }

    public Formation getFormationById(Long id) {
        if (id == null) return null;
        return formationRepository.findById(id).orElse(null);
    }

    public Formation saveFormation(Formation formation) {
        if (formation == null) return null;
        return formationRepository.save(formation);
    }

    public Formation updateFormation(Long id, Formation formationDetails) {
        if (id == null || formationDetails == null) return null;
        Formation formation = formationRepository.findById(id).orElse(null);
        if (formation != null) {
            formation.setNom(formationDetails.getNom());
            return formationRepository.save(formation);
        }
        return null;
    }

    public void deleteFormation(Long id) {
        if (id != null) {
            formationRepository.deleteById(id);
        }
    }
}
