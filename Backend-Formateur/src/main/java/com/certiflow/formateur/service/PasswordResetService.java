package com.certiflow.formateur.service;

import com.certiflow.formateur.model.Enseignant;
import com.certiflow.formateur.repository.EnseignantRepository;
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

    private final EnseignantRepository enseignantRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    private static final long CODE_TTL_MS = 10 * 60 * 1000L; // 10 minutes

    public PasswordResetService(EnseignantRepository enseignantRepository,
                                PasswordEncoder passwordEncoder,
                                EmailService emailService) {
        this.enseignantRepository = enseignantRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
    }

    public void generateAndSendCode(String email) {
        String normalizedEmail = email.toLowerCase().trim();

        Enseignant enseignant = enseignantRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Aucun compte formateur trouvé avec cet email."));

        String code = generateCode();
        Instant expiresAt = Instant.now().plusMillis(CODE_TTL_MS);
        store.put(normalizedEmail, new ResetEntry(code, expiresAt));

        emailService.sendPasswordResetEmail(
                normalizedEmail,
                enseignant.getPrenom() != null ? enseignant.getPrenom() : "Formateur",
                code
        );
    }

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

    public void resetPassword(String email, String code, String newPassword) {
        String normalizedEmail = email.toLowerCase().trim();

        verifyCode(normalizedEmail, code);

        Enseignant enseignant = enseignantRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Formateur non trouvé."));

        enseignant.setMotDePasse(passwordEncoder.encode(newPassword));
        enseignantRepository.save(enseignant);

        store.remove(normalizedEmail);
    }

    private String generateCode() {
        Random rnd = new Random();
        int code = 100000 + rnd.nextInt(900000); // always 6 digits
        return String.valueOf(code);
    }

    private record ResetEntry(String code, Instant expiresAt) {}
}
