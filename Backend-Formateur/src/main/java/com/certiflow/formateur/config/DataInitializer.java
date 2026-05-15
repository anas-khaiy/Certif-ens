package com.certiflow.formateur.config;

import com.certiflow.formateur.model.Admin;
import com.certiflow.formateur.model.Cycle;
import com.certiflow.formateur.model.Role;
import com.certiflow.formateur.model.Enseignant;
import com.certiflow.formateur.model.Specialite;
import com.certiflow.formateur.repository.AdminRepository;
import com.certiflow.formateur.repository.CycleRepository;
import com.certiflow.formateur.repository.EnseignantRepository;
import com.certiflow.formateur.repository.ApprenantRepository;
import com.certiflow.formateur.repository.SpecialiteRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.*;

@Component
public class DataInitializer implements CommandLineRunner {

    private final AdminRepository adminRepository;
    private final CycleRepository cycleRepository;
    private final PasswordEncoder passwordEncoder;
    private final EnseignantRepository enseignantRepository;
    private final ApprenantRepository apprenantRepository;
    private final SpecialiteRepository specialiteRepository;
    private final JdbcTemplate jdbcTemplate;

    public DataInitializer(AdminRepository adminRepository, CycleRepository cycleRepository,
            PasswordEncoder passwordEncoder, EnseignantRepository enseignantRepository,
            ApprenantRepository apprenantRepository,
            SpecialiteRepository specialiteRepository,
            JdbcTemplate jdbcTemplate) {
        this.adminRepository = adminRepository;
        this.cycleRepository = cycleRepository;
        this.passwordEncoder = passwordEncoder;
        this.enseignantRepository = enseignantRepository;
        this.apprenantRepository = apprenantRepository;
        this.specialiteRepository = specialiteRepository;
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(String... args) throws Exception {
        // Schema cleanup for legacy columns
        try {
            System.out.println("Checking for legacy database columns and ensuring proper types...");
            jdbcTemplate.execute("ALTER TABLE courses DROP COLUMN IF EXISTS is_published");
            jdbcTemplate.execute("ALTER TABLE courses ALTER COLUMN cover_image TYPE TEXT");
            // Add specialite_id column if it doesn't exist (migration from category)
            jdbcTemplate.execute("ALTER TABLE courses ADD COLUMN IF NOT EXISTS specialite_id BIGINT");
            // Add video_urls column to sub_sections for multi-video support
            jdbcTemplate.execute("ALTER TABLE sub_sections ADD COLUMN IF NOT EXISTS video_urls TEXT");
            // Add created_at and updated_at columns for course tracking
            jdbcTemplate.execute(
                    "ALTER TABLE courses ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP");
            jdbcTemplate.execute(
                    "ALTER TABLE courses ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP");

            // Populate existing NULLs with current timestamp to enable sorting
            jdbcTemplate.execute("UPDATE courses SET created_at = CURRENT_TIMESTAMP WHERE created_at IS NULL");
            jdbcTemplate.execute("UPDATE courses SET updated_at = CURRENT_TIMESTAMP WHERE updated_at IS NULL");

            System.out.println("Schema maintenance successful.");
        } catch (Exception e) {
            System.err.println("Schema cleanup skipped or failed: " + e.getMessage());
        }

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
            List<Enseignant> enseignants = enseignantRepository.findAll();
            boolean enseignantsUpdated = false;
            for (Enseignant enseignant : enseignants) {
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
            List<com.certiflow.formateur.model.Apprenant> apprenants = apprenantRepository.findAll();
            boolean apprenantsUpdated = false;
            for (com.certiflow.formateur.model.Apprenant apprenant : apprenants) {
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

        // --- ENSEIGNANT (TRAINER) INITIALIZATION ---
        if (enseignantRepository.count() == 0) {
            // Create default speciality first
            Specialite spec = specialiteRepository.findByNomIgnoreCase("informatique")
                    .orElseGet(() -> {
                        Specialite s = new Specialite();
                        s.setNom("informatique");
                        return specialiteRepository.save(s);
                    });

            Enseignant trainer = new Enseignant();
            trainer.setNom("Formateur");
            trainer.setPrenom("CertiFlow");
            trainer.setEmail("trainer@certiflow.com");
            trainer.setMotDePasse(passwordEncoder.encode("trainer123"));
            trainer.setSpecialite(spec);
            trainer.setPhotoProfile("default.png");
            enseignantRepository.save(trainer);
            System.out.println("Default trainer created: trainer@certiflow.com / trainer123");
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
            if (c != null) {
                try {
                    cycleRepository.delete(c);
                    System.out.println("Cleaned up duplicate cycle: " + c.getNomCycle());
                } catch (Exception e) {
                    System.out.println("Could not delete duplicate cycle (in use): " + c.getNomCycle());
                }
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
            if (s != null) {
                try {
                    specialiteRepository.delete(s);
                    System.out.println("Cleaned up duplicate speciality: " + s.getNom());
                } catch (Exception e) {
                    System.out.println("Could not delete duplicate speciality (in use): " + s.getNom());
                }
            }
        }
    }
}
