package com.certiflow.admin.service;

import com.certiflow.admin.model.Departement;
import com.certiflow.admin.repository.DepartementRepository;
import org.springframework.stereotype.Service;

import java.util.List;

import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class DepartementService {

    private final DepartementRepository departementRepository;

    public DepartementService(DepartementRepository departementRepository) {
        this.departementRepository = departementRepository;
    }

    public List<Departement> getAllDepartements() {
        return departementRepository.findAll();
    }

    public Departement getDepartementById(Long id) {
        return departementRepository.findById(id).orElseThrow(() -> new RuntimeException("Département not found"));
    }

    public Departement saveDepartement(Departement departement) {
        if (departement.getNom() == null || departement.getNom().trim().isEmpty()) {
            throw new RuntimeException("Le nom du département est obligatoire");
        }
        String lowerName = departement.getNom().trim().toLowerCase();
        if (departementRepository.findByNomIgnoreCase(lowerName).isPresent()) {
            throw new RuntimeException("Un département avec ce nom existe déjà");
        }

        departement.setNom(lowerName);
        return departementRepository.save(departement);
    }

    public Departement updateDepartement(Long id, Departement departementDetails) {
        Departement departement = getDepartementById(id);
        String lowerName = departementDetails.getNom().trim().toLowerCase();

        if (!departement.getNom().equals(lowerName)) {
            if (departementRepository.findByNomIgnoreCase(lowerName).isPresent()) {
                throw new RuntimeException("Un département avec ce nom existe déjà");
            }
        }

        departement.setNom(lowerName);
        return departementRepository.save(departement);
    }

    public void deleteDepartement(Long id) {
        departementRepository.deleteById(id);
    }
}
