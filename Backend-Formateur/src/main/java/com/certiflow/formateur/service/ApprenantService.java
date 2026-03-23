package com.certiflow.formateur.service;

import com.certiflow.formateur.model.Apprenant;
import com.certiflow.formateur.repository.ApprenantRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ApprenantService {

    private final ApprenantRepository apprenantRepository;
    private final PasswordEncoder passwordEncoder;
    private final ExcelImportService excelImportService;

    public ApprenantService(ApprenantRepository apprenantRepository, PasswordEncoder passwordEncoder,
            ExcelImportService excelImportService) {
        this.apprenantRepository = apprenantRepository;
        this.passwordEncoder = passwordEncoder;
        this.excelImportService = excelImportService;
    }

    public com.certiflow.formateur.dto.ImportResponse importApprenants(
            org.springframework.web.multipart.MultipartFile file) {
        return excelImportService.importApprenants(file);
    }

    public List<Apprenant> getAllApprenants() {
        return apprenantRepository.findAll();
    }

    public Apprenant getApprenantById(Long id) {
        return apprenantRepository.findById(id).orElseThrow(() -> new RuntimeException("Apprenant not found"));
    }

    public Apprenant saveApprenant(Apprenant apprenant) {
        // Default password is the CIN if not provided
        String password = (apprenant.getMotDePasse() != null && !apprenant.getMotDePasse().isEmpty())
                ? apprenant.getMotDePasse()
                : apprenant.getCin();

        apprenant.setMotDePasse(passwordEncoder.encode(password));
        if (apprenant.getNom() != null)
            apprenant.setNom(apprenant.getNom().toLowerCase().trim());
        if (apprenant.getPrenom() != null)
            apprenant.setPrenom(apprenant.getPrenom().toLowerCase().trim());
        if (apprenant.getPhotoProfile() == null || apprenant.getPhotoProfile().isEmpty()) {
            apprenant.setPhotoProfile("default.png");
        }
        return apprenantRepository.save(apprenant);
    }

    public Apprenant updateApprenant(Long id, Apprenant apprenantDetails) {
        Apprenant apprenant = getApprenantById(id);
        if (apprenantDetails.getNom() != null)
            apprenant.setNom(apprenantDetails.getNom().toLowerCase().trim());
        if (apprenantDetails.getPrenom() != null)
            apprenant.setPrenom(apprenantDetails.getPrenom().toLowerCase().trim());
        apprenant.setEmail(apprenantDetails.getEmail());

        // Only update password if a new one is provided, otherwise keep existing
        if (apprenantDetails.getMotDePasse() != null && !apprenantDetails.getMotDePasse().isEmpty()) {
            apprenant.setMotDePasse(passwordEncoder.encode(apprenantDetails.getMotDePasse()));
        }

        apprenant.setCin(apprenantDetails.getCin());
        if (apprenantDetails.getPhotoProfile() != null && !apprenantDetails.getPhotoProfile().isEmpty()) {
            apprenant.setPhotoProfile(apprenantDetails.getPhotoProfile());
        } else if (apprenant.getPhotoProfile() == null) {
            apprenant.setPhotoProfile("default.png");
        }
        apprenant.setTailleQR(apprenantDetails.getTailleQR());
        apprenant.setSpecialite(apprenantDetails.getSpecialite());
        apprenant.setCycle(apprenantDetails.getCycle());
        return apprenantRepository.save(apprenant);
    }

    public void deleteApprenant(Long id) {
        apprenantRepository.deleteById(id);
    }

    public void deleteMultipleApprenants(List<Long> ids) {
        apprenantRepository.deleteAllById(ids);
    }
}
