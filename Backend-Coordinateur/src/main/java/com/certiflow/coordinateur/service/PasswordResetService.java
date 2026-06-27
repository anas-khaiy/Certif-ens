package com.certiflow.coordinateur.service;

import com.certiflow.coordinateur.model.Coordinateur;
import com.certiflow.coordinateur.repository.CoordinateurRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Optional;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class PasswordResetService {

    private final CoordinateurRepository repository;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;
    private final Map<String, String> resetCodes = new ConcurrentHashMap<>();

    public PasswordResetService(CoordinateurRepository repository, EmailService emailService, PasswordEncoder passwordEncoder) {
        this.repository = repository;
        this.emailService = emailService;
        this.passwordEncoder = passwordEncoder;
    }

    public void generateAndSendCode(String email) {
        Optional<Coordinateur> userOpt = repository.findByEmail(email);
        if (userOpt.isPresent()) {
            String code = String.format("%06d", new Random().nextInt(999999));
            resetCodes.put(email, code);
            emailService.sendVerificationCode(email, code);
        }
    }

    public void verifyCode(String email, String code) {
        String savedCode = resetCodes.get(email);
        if (savedCode == null || !savedCode.equals(code)) {
            throw new RuntimeException("Code invalide ou expiré");
        }
    }

    public void resetPassword(String email, String code, String newPassword) {
        verifyCode(email, code);
        Coordinateur user = repository.findByEmail(email).orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
        user.setMotDePasse(passwordEncoder.encode(newPassword));
        repository.save(user);
        resetCodes.remove(email);
    }
}
