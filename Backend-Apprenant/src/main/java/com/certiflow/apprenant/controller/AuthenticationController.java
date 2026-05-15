package com.certiflow.apprenant.controller;

import com.certiflow.apprenant.dto.AuthenticationRequest;
import com.certiflow.apprenant.dto.AuthenticationResponse;
import com.certiflow.apprenant.service.AuthenticationService;
import com.certiflow.apprenant.service.PasswordResetService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthenticationController {

    private final AuthenticationService service;
    private final PasswordResetService passwordResetService;

    public AuthenticationController(AuthenticationService service,
                                    PasswordResetService passwordResetService) {
        this.service = service;
        this.passwordResetService = passwordResetService;
    }

    @PostMapping("/authenticate")
    public ResponseEntity<AuthenticationResponse> authenticate(@RequestBody AuthenticationRequest request) {
        return ResponseEntity.ok(service.authenticate(request));
    }

    @GetMapping("/me")
    public ResponseEntity<AuthenticationResponse> getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        return ResponseEntity.ok(service.getUserDetails(email));
    }

    @PutMapping("/me")
    public ResponseEntity<Void> updateProfile(@RequestBody com.certiflow.apprenant.dto.UpdateProfileRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        service.updateProfile(email, request);
        return ResponseEntity.ok().build();
    }
    @PostMapping("/mfa/verify")
    public ResponseEntity<AuthenticationResponse> verifyMfa(@RequestBody com.certiflow.apprenant.dto.MfaRequest request) {
        return ResponseEntity.ok(service.verifyMfa(request.getEmail(), request.getCode()));
    }

    @PostMapping("/mfa/setup")
    public ResponseEntity<String> setupMfa() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        return ResponseEntity.ok(service.generateMfaSetup(email));
    }

    @PostMapping("/mfa/enable")
    public ResponseEntity<Void> enableMfa(@RequestBody com.certiflow.apprenant.dto.MfaRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        service.enableMfa(email, request.getCode());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/mfa/disable")
    public ResponseEntity<Void> disableMfa() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        service.disableMfa(email);
        return ResponseEntity.ok().build();
    }

    // ─── Password Reset Flow ─────────────────────────────────────────────────

    /**
     * Step 1 — Request a 6-digit OTP sent by email.
     * Body: { "email": "..." }
     */
    @PostMapping("/forgot-password")
    public ResponseEntity<Map<String, String>> forgotPassword(@RequestBody Map<String, String> body) {
        String email = body.getOrDefault("email", "").trim();
        if (email.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "L'email est requis."));
        }
        passwordResetService.generateAndSendCode(email);
        return ResponseEntity.ok(Map.of("message", "Un code de vérification a été envoyé à votre adresse email."));
    }

    /**
     * Step 2 — Verify the OTP code (does NOT reset the password yet).
     * Body: { "email": "...", "code": "123456" }
     */
    @PostMapping("/verify-reset-code")
    public ResponseEntity<Map<String, String>> verifyResetCode(@RequestBody Map<String, String> body) {
        String email = body.getOrDefault("email", "").trim();
        String code  = body.getOrDefault("code", "").trim();
        passwordResetService.verifyCode(email, code);
        return ResponseEntity.ok(Map.of("message", "Code vérifié avec succès."));
    }

    /**
     * Step 3 — Reset the password (re-verifies the code before saving).
     * Body: { "email": "...", "code": "123456", "newPassword": "..." }
     */
    @PostMapping("/reset-password")
    public ResponseEntity<Map<String, String>> resetPassword(@RequestBody Map<String, String> body) {
        String email       = body.getOrDefault("email", "").trim();
        String code        = body.getOrDefault("code", "").trim();
        String newPassword = body.getOrDefault("newPassword", "").trim();
        if (newPassword.length() < 6) {
            return ResponseEntity.badRequest().body(Map.of("message", "Le mot de passe doit contenir au moins 6 caractères."));
        }
        passwordResetService.resetPassword(email, code, newPassword);
        return ResponseEntity.ok(Map.of("message", "Mot de passe réinitialisé avec succès."));
    }
}
