package com.certiflow.admin.service;

import com.certiflow.admin.model.Apprenant;
import com.certiflow.admin.model.Coordinateur;
import com.certiflow.admin.model.Enseignant;
import com.certiflow.admin.repository.ApprenantRepository;
import com.certiflow.admin.repository.CoordinateurRepository;
import com.certiflow.admin.repository.EnseignantRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CoordinateurService {

    private final CoordinateurRepository coordinateurRepository;
    private final EnseignantRepository enseignantRepository;
    private final ApprenantRepository apprenantRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    public CoordinateurService(CoordinateurRepository coordinateurRepository,
                               EnseignantRepository enseignantRepository,
                               ApprenantRepository apprenantRepository,
                               PasswordEncoder passwordEncoder,
                               EmailService emailService) {
        this.coordinateurRepository = coordinateurRepository;
        this.enseignantRepository = enseignantRepository;
        this.apprenantRepository = apprenantRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
    }

    public List<Coordinateur> getAllCoordinateurs() {
        return coordinateurRepository.findAll();
    }

    public Coordinateur getCoordinateurById(Long id) {
        return coordinateurRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Coordinateur not found with id: " + id));
    }

    public Coordinateur saveCoordinateur(Coordinateur coordinateur) {
        // Normalize email
        if (coordinateur.getEmail() != null) {
            coordinateur.setEmail(coordinateur.getEmail().toLowerCase().trim());
        }

        // Default password = email if not provided
        String password = (coordinateur.getMotDePasse() != null && !coordinateur.getMotDePasse().isEmpty())
                ? coordinateur.getMotDePasse()
                : coordinateur.getEmail();

        // Normalize password
        if (password != null) {
            password = password.toLowerCase().trim();
        }

        coordinateur.setMotDePasse(passwordEncoder.encode(password));

        if (coordinateur.getNom() != null)
            coordinateur.setNom(coordinateur.getNom().toLowerCase().trim());
        if (coordinateur.getPrenom() != null)
            coordinateur.setPrenom(coordinateur.getPrenom().toLowerCase().trim());
        if (coordinateur.getPhotoProfile() == null || coordinateur.getPhotoProfile().isEmpty()) {
            coordinateur.setPhotoProfile("default.png");
        }

        // departement and specialite are set directly from the request body (ManyToOne)

        Coordinateur saved = coordinateurRepository.save(coordinateur);

        // Send welcome email asynchronously
        final String finalPassword = password;
        new Thread(() -> {
            try {
                emailService.sendCoordinateurWelcomeEmail(saved.getEmail(), saved.getPrenom(), finalPassword);
            } catch (Exception e) {
                System.err.println("Failed to send welcome email to " + saved.getEmail() + ": " + e.getMessage());
            }
        }).start();

        return saved;
    }

    /**
     * Promote an existing Enseignant to Coordinateur.
     * Copies nom, prenom, email and sets default password = email.
     */
    public Coordinateur promoteFromEnseignant(Long enseignantId) {
        Enseignant enseignant = enseignantRepository.findById(enseignantId)
                .orElseThrow(() -> new RuntimeException("Enseignant not found with id: " + enseignantId));

        // Check if a coordinateur already exists with this email
        if (coordinateurRepository.existsByEmail(enseignant.getEmail())) {
            throw new RuntimeException("Un coordinateur avec cet email existe déjà.");
        }

        Coordinateur coordinateur = new Coordinateur();
        coordinateur.setNom(enseignant.getNom());
        coordinateur.setPrenom(enseignant.getPrenom());
        coordinateur.setEmail(enseignant.getEmail());
        coordinateur.setPhotoProfile(enseignant.getPhotoProfile() != null ? enseignant.getPhotoProfile() : "default.png");
        coordinateur.setSpecialite(enseignant.getSpecialite());

        // Default password = email
        String password = enseignant.getEmail().toLowerCase().trim();
        coordinateur.setMotDePasse(passwordEncoder.encode(password));

        Coordinateur saved = coordinateurRepository.save(coordinateur);

        // Send welcome email asynchronously
        new Thread(() -> {
            try {
                emailService.sendCoordinateurWelcomeEmail(saved.getEmail(), saved.getPrenom(), password);
            } catch (Exception e) {
                System.err.println("Failed to send welcome email to " + saved.getEmail() + ": " + e.getMessage());
            }
        }).start();

        return saved;
    }

    public Coordinateur updateCoordinateur(Long id, Coordinateur details) {
        Coordinateur coordinateur = getCoordinateurById(id);

        if (details.getNom() != null)
            coordinateur.setNom(details.getNom().toLowerCase().trim());
        if (details.getPrenom() != null)
            coordinateur.setPrenom(details.getPrenom().toLowerCase().trim());
        if (details.getEmail() != null)
            coordinateur.setEmail(details.getEmail().toLowerCase().trim());

        // Only update password if a new one is provided
        if (details.getMotDePasse() != null && !details.getMotDePasse().isEmpty()) {
            coordinateur.setMotDePasse(passwordEncoder.encode(details.getMotDePasse()));
        }
        if (details.getPhotoProfile() != null && !details.getPhotoProfile().isEmpty()) {
            coordinateur.setPhotoProfile(details.getPhotoProfile());
        }

        // Update departement and specialite
        coordinateur.setDepartement(details.getDepartement());
        coordinateur.setSpecialite(details.getSpecialite());

        return coordinateurRepository.save(coordinateur);
    }

    public void deleteCoordinateur(Long id) {
        coordinateurRepository.deleteById(id);
    }

    public void deleteMultipleCoordinateurs(List<Long> ids) {
        coordinateurRepository.deleteAllById(ids);
    }

    public List<Apprenant> getAssignedApprenants(Long coordinateurId) {
        return apprenantRepository.findByCoordinateurId(coordinateurId);
    }

    public List<Enseignant> getAssignedEnseignants(Long coordinateurId) {
        return enseignantRepository.findByCoordinateurId(coordinateurId);
    }

    @Transactional
    public void assignApprenants(Long coordinateurId, List<Long> apprenantIds) {
        Coordinateur coordinateur = getCoordinateurById(coordinateurId);
        // Unassign all current apprenants of this coordinateur
        List<Apprenant> current = apprenantRepository.findByCoordinateurId(coordinateurId);
        for (Apprenant a : current) {
            a.setCoordinateur(null);
            apprenantRepository.save(a);
        }
        // Assign selected apprenants
        for (Long id : apprenantIds) {
            Apprenant a = apprenantRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Apprenant not found with id: " + id));
            a.setCoordinateur(coordinateur);
            apprenantRepository.save(a);
        }
    }

    @Transactional
    public void assignEnseignants(Long coordinateurId, List<Long> enseignantIds) {
        Coordinateur coordinateur = getCoordinateurById(coordinateurId);
        // Unassign all current enseignants of this coordinateur
        List<Enseignant> current = enseignantRepository.findByCoordinateurId(coordinateurId);
        for (Enseignant e : current) {
            e.setCoordinateur(null);
            enseignantRepository.save(e);
        }
        // Assign selected enseignants
        for (Long id : enseignantIds) {
            Enseignant e = enseignantRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Enseignant not found with id: " + id));
            e.setCoordinateur(coordinateur);
            enseignantRepository.save(e);
        }
    }
}
