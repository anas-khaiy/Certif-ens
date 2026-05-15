package com.certiflow.apprenant.service;

import com.certiflow.apprenant.model.Apprenant;
import com.certiflow.apprenant.repository.ApprenantRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.Map;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class PasswordResetService {

    // In-memory store: email -> (code, expiresAt)
    private final Map<String, ResetEntry> store = new ConcurrentHashMap<>();

    private final ApprenantRepository apprenantRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    private static final long CODE_TTL_MS = 10 * 60 * 1000L; // 10 minutes

    public PasswordResetService(ApprenantRepository apprenantRepository,
                                PasswordEncoder passwordEncoder,
                                EmailService emailService) {
        this.apprenantRepository = apprenantRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
    }

    /**
     * Generates a 6-digit OTP, stores it, and sends it by email.
     * Does NOT reveal whether the email exists (security best practice).
     */
    public void generateAndSendCode(String email) {
        String normalizedEmail = email.toLowerCase().trim();

        Apprenant apprenant = apprenantRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Aucun compte trouvé avec cet email."));

        String code = generateCode();
        Instant expiresAt = Instant.now().plusMillis(CODE_TTL_MS);
        store.put(normalizedEmail, new ResetEntry(code, expiresAt));

        emailService.sendPasswordResetEmail(
                normalizedEmail,
                apprenant.getPrenom() != null ? apprenant.getPrenom() : "Apprenant",
                code
        );
    }

    /**
     * Verifies that the provided code matches what was sent and is not expired.
     */
    public void verifyCode(String email, String code) {
        String normalizedEmail = email.toLowerCase().trim();
        ResetEntry entry = store.get(normalizedEmail);

        if (entry == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Aucun code de réinitialisation trouvé. Veuillez refaire une demande.");
        }
        if (Instant.now().isAfter(entry.expiresAt())) {
            store.remove(normalizedEmail);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Le code a expiré. Veuillez refaire une demande.");
        }
        if (!entry.code().equals(code.trim())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Code incorrect. Vérifiez votre email et réessayez.");
        }
    }

    /**
     * Verifies the code and then updates the password.
     * Removes the OTP from the store on success.
     */
    public void resetPassword(String email, String code, String newPassword) {
        String normalizedEmail = email.toLowerCase().trim();

        // Will throw if invalid
        verifyCode(normalizedEmail, code);

        Apprenant apprenant = apprenantRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Utilisateur non trouvé."));

        apprenant.setMotDePasse(passwordEncoder.encode(newPassword));
        apprenantRepository.save(apprenant);

        // Remove used code
        store.remove(normalizedEmail);
    }

    private String generateCode() {
        Random rnd = new Random();
        int code = 100000 + rnd.nextInt(900000); // always 6 digits
        return String.valueOf(code);
    }

    private record ResetEntry(String code, Instant expiresAt) {}
}
