package com.certiflow.admin.service;

import com.certiflow.admin.model.Admin;
import com.certiflow.admin.repository.AdminRepository;
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

    private final AdminRepository adminRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    private static final long CODE_TTL_MS = 10 * 60 * 1000L; // 10 minutes

    public PasswordResetService(AdminRepository adminRepository,
                                PasswordEncoder passwordEncoder,
                                EmailService emailService) {
        this.adminRepository = adminRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
    }

    public void generateAndSendCode(String email) {
        String normalizedEmail = email.toLowerCase().trim();

        Admin admin = adminRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Aucun administrateur trouvé avec cet email."));

        String code = generateCode();
        Instant expiresAt = Instant.now().plusMillis(CODE_TTL_MS);
        store.put(normalizedEmail, new ResetEntry(code, expiresAt));

        emailService.sendPasswordResetEmail(
                normalizedEmail,
                admin.getPrenom() != null ? admin.getPrenom() : "Administrateur",
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

        Admin admin = adminRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Administrateur non trouvé."));

        admin.setPassword(passwordEncoder.encode(newPassword));
        adminRepository.save(admin);

        store.remove(normalizedEmail);
    }

    private String generateCode() {
        Random rnd = new Random();
        int code = 100000 + rnd.nextInt(900000); // always 6 digits
        return String.valueOf(code);
    }

    private record ResetEntry(String code, Instant expiresAt) {}
}
