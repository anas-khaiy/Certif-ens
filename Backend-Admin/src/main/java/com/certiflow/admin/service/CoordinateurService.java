package com.certiflow.admin.service;

import com.certiflow.admin.model.Coordinateur;
import com.certiflow.admin.model.Enseignant;
import com.certiflow.admin.repository.CoordinateurRepository;
import com.certiflow.admin.repository.EnseignantRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CoordinateurService {

    private final CoordinateurRepository coordinateurRepository;
    private final EnseignantRepository enseignantRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    public CoordinateurService(CoordinateurRepository coordinateurRepository,
                               EnseignantRepository enseignantRepository,
                               PasswordEncoder passwordEncoder,
                               EmailService emailService) {
        this.coordinateurRepository = coordinateurRepository;
        this.enseignantRepository = enseignantRepository;
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
}
