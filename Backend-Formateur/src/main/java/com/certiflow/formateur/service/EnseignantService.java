package com.certiflow.formateur.service;

import com.certiflow.formateur.model.Enseignant;
import com.certiflow.formateur.repository.EnseignantRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class EnseignantService {

    private final EnseignantRepository enseignantRepository;
    private final PasswordEncoder passwordEncoder;
    private final ExcelImportService excelImportService;

    public EnseignantService(EnseignantRepository enseignantRepository, PasswordEncoder passwordEncoder,
            ExcelImportService excelImportService) {
        this.enseignantRepository = enseignantRepository;
        this.passwordEncoder = passwordEncoder;
        this.excelImportService = excelImportService;
    }

    public com.certiflow.formateur.dto.ImportResponse importEnseignants(
            org.springframework.web.multipart.MultipartFile file) {
        return excelImportService.importEnseignants(file);
    }

    public List<Enseignant> getAllEnseignants() {
        return enseignantRepository.findAll();
    }

    public Enseignant getEnseignantById(Long id) {
        return enseignantRepository.findById(id).orElseThrow(() -> new RuntimeException("Enseignant not found"));
    }

    public Enseignant saveEnseignant(Enseignant enseignant) {
        // Default password is the email if not provided
        String password = (enseignant.getMotDePasse() != null && !enseignant.getMotDePasse().isEmpty())
                ? enseignant.getMotDePasse()
                : enseignant.getEmail();

        enseignant.setMotDePasse(passwordEncoder.encode(password));
        if (enseignant.getNom() != null)
            enseignant.setNom(enseignant.getNom().toLowerCase().trim());
        if (enseignant.getPrenom() != null)
            enseignant.setPrenom(enseignant.getPrenom().toLowerCase().trim());
        if (enseignant.getPhotoProfile() == null || enseignant.getPhotoProfile().isEmpty()) {
            enseignant.setPhotoProfile("default.png");
        }
        return enseignantRepository.save(enseignant);
    }

    public Enseignant updateEnseignant(Long id, Enseignant enseignantDetails) {
        Enseignant enseignant = getEnseignantById(id);
        if (enseignantDetails.getNom() != null)
            enseignant.setNom(enseignantDetails.getNom().toLowerCase().trim());
        if (enseignantDetails.getPrenom() != null)
            enseignant.setPrenom(enseignantDetails.getPrenom().toLowerCase().trim());
        enseignant.setEmail(enseignantDetails.getEmail());

        // Only update password if a new one is provided, otherwise keep existing
        if (enseignantDetails.getMotDePasse() != null && !enseignantDetails.getMotDePasse().isEmpty()) {
            enseignant.setMotDePasse(passwordEncoder.encode(enseignantDetails.getMotDePasse()));
        }
        if (enseignantDetails.getPhotoProfile() != null && !enseignantDetails.getPhotoProfile().isEmpty()) {
            enseignant.setPhotoProfile(enseignantDetails.getPhotoProfile());
        } else if (enseignant.getPhotoProfile() == null) {
            enseignant.setPhotoProfile("default.png");
        }
        enseignant.setSignature(enseignantDetails.getSignature());
        enseignant.setSpecialite(enseignantDetails.getSpecialite());
        return enseignantRepository.save(enseignant);
    }

    public void deleteEnseignant(Long id) {
        enseignantRepository.deleteById(id);
    }

    public void deleteMultipleEnseignants(List<Long> ids) {
        enseignantRepository.deleteAllById(ids);
    }
}
