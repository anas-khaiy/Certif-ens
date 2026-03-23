package com.certiflow.formateur.service;

import com.certiflow.formateur.model.Specialite;
import com.certiflow.formateur.repository.SpecialiteRepository;
import org.springframework.stereotype.Service;

import java.util.List;

import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class SpecialiteService {

    private final SpecialiteRepository specialityRepository;

    public SpecialiteService(SpecialiteRepository specialityRepository) {
        this.specialityRepository = specialityRepository;
    }

    public List<Specialite> getAllSpecialites() {
        return specialityRepository.findAll();
    }

    public Specialite getSpecialiteById(Long id) {
        return specialityRepository.findById(id).orElseThrow(() -> new RuntimeException("Specialite not found"));
    }

    public Specialite saveSpecialite(Specialite speciality) {
        if (speciality.getNom() == null) {
            throw new RuntimeException("Le nom de la spécialité est obligatoire");
        }
        String lowerName = speciality.getNom().trim().toLowerCase();
        System.out.println("Attempting to save speciality: " + lowerName);

        if (specialityRepository.findByNomIgnoreCase(lowerName).isPresent()) {
            System.out.println("Duplicate speciality found for: " + lowerName);
            throw new RuntimeException("Cette spécialité existe déjà");
        }
        speciality.setNom(lowerName);
        return specialityRepository.save(speciality);
    }

    public Specialite updateSpecialite(Long id, Specialite specialityDetails) {
        Specialite speciality = getSpecialiteById(id);
        if (specialityDetails.getNom() == null) {
            throw new RuntimeException("Le nom de la spécialité est obligatoire");
        }
        String lowerName = specialityDetails.getNom().trim().toLowerCase();

        if (!speciality.getNom().equalsIgnoreCase(lowerName)) {
            if (specialityRepository.findByNomIgnoreCase(lowerName).isPresent()) {
                throw new RuntimeException("Cette spécialité existe déjà");
            }
        }

        speciality.setNom(lowerName);
        return specialityRepository.save(speciality);
    }

    public void deleteSpecialite(Long id) {
        specialityRepository.deleteById(id);
    }
}
