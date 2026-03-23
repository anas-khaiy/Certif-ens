package com.certiflow.admin.config;

import com.certiflow.admin.model.Admin;
import com.certiflow.admin.model.Cycle;
import com.certiflow.admin.model.Role;
import com.certiflow.admin.repository.AdminRepository;
import com.certiflow.admin.repository.CycleRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.certiflow.admin.model.Specialite;
import com.certiflow.admin.repository.SpecialiteRepository;
import java.util.*;

@Component
public class DataInitializer implements CommandLineRunner {

    private final AdminRepository adminRepository;
    private final CycleRepository cycleRepository;
    private final PasswordEncoder passwordEncoder;
    private final com.certiflow.admin.repository.EnseignantRepository enseignantRepository;
    private final com.certiflow.admin.repository.ApprenantRepository apprenantRepository;
    private final SpecialiteRepository specialiteRepository;

    public DataInitializer(AdminRepository adminRepository, CycleRepository cycleRepository,
            PasswordEncoder passwordEncoder, com.certiflow.admin.repository.EnseignantRepository enseignantRepository,
            com.certiflow.admin.repository.ApprenantRepository apprenantRepository,
            SpecialiteRepository specialiteRepository) {
        this.adminRepository = adminRepository;
        this.cycleRepository = cycleRepository;
        this.passwordEncoder = passwordEncoder;
        this.enseignantRepository = enseignantRepository;
        this.apprenantRepository = apprenantRepository;
        this.specialiteRepository = specialiteRepository;
    }

    @Override
    public void run(String... args) throws Exception {
        if (adminRepository.count() == 0) {
            Admin admin = new Admin();
            admin.setNom("Default");
            admin.setPrenom("Admin");
            admin.setEmail("admin@certiflow.com");
            admin.setPassword(passwordEncoder.encode("admin123"));
            admin.setRole(Role.SUPER_ADMIN);
            admin.setPhotoProfile("default.png");
            adminRepository.save(admin);
            System.out.println("Default admin created: admin@certiflow.com / admin123");
        } else {
            // Update existing admins missing a profile photo
            List<Admin> admins = adminRepository.findAll();
            boolean updated = false;
            for (Admin admin : admins) {
                if (admin.getPhotoProfile() == null || admin.getPhotoProfile().isEmpty()) {
                    admin.setPhotoProfile("default.png");
                    adminRepository.save(admin);
                    updated = true;
                }
            }
            if (updated) {
                System.out.println("Existing admins updated with default profile picture.");
            }

            // Update existing enseignants missing a profile photo
            List<com.certiflow.admin.model.Enseignant> enseignants = enseignantRepository.findAll();
            boolean enseignantsUpdated = false;
            for (com.certiflow.admin.model.Enseignant enseignant : enseignants) {
                if (enseignant.getPhotoProfile() == null || enseignant.getPhotoProfile().isEmpty()) {
                    enseignant.setPhotoProfile("default.png");
                    enseignantRepository.save(enseignant);
                    enseignantsUpdated = true;
                }
            }
            if (enseignantsUpdated) {
                System.out.println("Existing enseignants updated with default profile picture.");
            }

            // Update existing apprenants missing a profile photo
            List<com.certiflow.admin.model.Apprenant> apprenants = apprenantRepository.findAll();
            boolean apprenantsUpdated = false;
            for (com.certiflow.admin.model.Apprenant apprenant : apprenants) {
                if (apprenant.getPhotoProfile() == null || apprenant.getPhotoProfile().isEmpty()) {
                    apprenant.setPhotoProfile("default.png");
                    apprenantRepository.save(apprenant);
                    apprenantsUpdated = true;
                }
            }
            if (apprenantsUpdated) {
                System.out.println("Existing apprenants updated with default profile picture.");
            }
        }

        // --- CLEANUP DUPLICATES AND NORMALIZE EXISTING DATA ---
        normalizeAndCleanupCycles();
        normalizeAndCleanupSpecialities();

        List<String> defaultCycles = List.of("licence", "master", "doctorat");
        for (String nomCycle : defaultCycles) {
            if (cycleRepository.findByNomCycleIgnoreCase(nomCycle).isEmpty()) {
                Cycle cycle = new Cycle();
                cycle.setNomCycle(nomCycle);
                cycleRepository.save(cycle);
                System.out.println("Default cycle created: " + nomCycle);
            }
        }
    }

    private void normalizeAndCleanupCycles() {
        List<Cycle> cycles = cycleRepository.findAll();
        Map<String, Cycle> seen = new HashMap<>();
        List<Cycle> toDelete = new ArrayList<>();

        for (Cycle c : cycles) {
            String normalized = c.getNomCycle().trim().toLowerCase();
            if (seen.containsKey(normalized)) {
                // Re-assign relations would be best, but for now just cleanup
                toDelete.add(c);
            } else {
                c.setNomCycle(normalized);
                cycleRepository.save(c);
                seen.put(normalized, c);
            }
        }

        for (Cycle c : toDelete) {
            try {
                cycleRepository.delete(c);
                System.out.println("Cleaned up duplicate cycle: " + c.getNomCycle());
            } catch (Exception e) {
                System.out.println("Could not delete duplicate cycle (in use): " + c.getNomCycle());
            }
        }
    }

    private void normalizeAndCleanupSpecialities() {
        List<Specialite> specs = specialiteRepository.findAll();
        Map<String, Specialite> seen = new HashMap<>();
        List<Specialite> toDelete = new ArrayList<>();

        for (Specialite s : specs) {
            String normalized = s.getNom().trim().toLowerCase();
            if (seen.containsKey(normalized)) {
                toDelete.add(s);
            } else {
                s.setNom(normalized);
                specialiteRepository.save(s);
                seen.put(normalized, s);
            }
        }

        for (Specialite s : toDelete) {
            try {
                specialiteRepository.delete(s);
                System.out.println("Cleaned up duplicate speciality: " + s.getNom());
            } catch (Exception e) {
                System.out.println("Could not delete duplicate speciality (in use): " + s.getNom());
            }
        }
    }
}
