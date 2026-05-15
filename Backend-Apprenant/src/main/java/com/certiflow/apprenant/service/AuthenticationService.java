package com.certiflow.apprenant.service;

import com.certiflow.apprenant.dto.AuthenticationRequest;
import com.certiflow.apprenant.dto.AuthenticationResponse;
import com.certiflow.apprenant.model.Apprenant;
import com.certiflow.apprenant.repository.ApprenantRepository;
import com.certiflow.apprenant.security.JwtService;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

@Service
public class AuthenticationService {

        private final ApprenantRepository repository;
        private final JwtService jwtService;
        private final AuthenticationManager authenticationManager;
        private final PasswordEncoder passwordEncoder;
        private final TwoFactorService twoFactorService;

        public AuthenticationService(ApprenantRepository repository,
                        JwtService jwtService,
                        AuthenticationManager authenticationManager,
                        PasswordEncoder passwordEncoder,
                        TwoFactorService twoFactorService) {
                this.repository = repository;
                this.jwtService = jwtService;
                this.authenticationManager = authenticationManager;
                this.passwordEncoder = passwordEncoder;
                this.twoFactorService = twoFactorService;
        }

        public AuthenticationResponse authenticate(AuthenticationRequest request) {
                String normalizedEmail = request.getEmail().toLowerCase().trim();
                String rawPassword = request.getPassword();

                try {
                        authenticationManager.authenticate(
                                        new UsernamePasswordAuthenticationToken(
                                                        normalizedEmail,
                                                        rawPassword));
                } catch (org.springframework.security.authentication.BadCredentialsException e) {
                        throw new ResponseStatusException(
                                        HttpStatus.UNAUTHORIZED,
                                        "Email ou mot de passe incorrect");
                }

                Apprenant apprenant = repository.findByEmail(normalizedEmail)
                                .orElseThrow(() -> new ResponseStatusException(
                                                HttpStatus.NOT_FOUND,
                                                "Utilisateur non trouvé"));

                if (apprenant.isMfaEnabled()) {
                        return AuthenticationResponse.builder()
                                        .email(apprenant.getEmail())
                                        .mfaEnabled(true)
                                        .mfaRequired(true)
                                        .build();
                }

                String jwtToken = jwtService.generateToken(apprenant);

                return AuthenticationResponse.builder()
                                .id(apprenant.getId())
                                .token(jwtToken)
                                .email(apprenant.getEmail())
                                .nom(apprenant.getNom())
                                .prenom(apprenant.getPrenom())
                                .role("APPRENANT")
                                .photoProfile(apprenant.getPhotoProfile())
                                .specialite(apprenant.getSpecialite() != null ? apprenant.getSpecialite().getNom() : null)
                                .mfaEnabled(false)
                                .mfaRequired(false)
                                .build();
        }

        public AuthenticationResponse verifyMfa(String email, int code) {
                Apprenant apprenant = repository.findByEmail(email.toLowerCase().trim())
                                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Utilisateur non trouvé"));

                if (!twoFactorService.isOtpValid(apprenant.getMfaSecret(), code)) {
                        throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Code MFA invalide");
                }

                String jwtToken = jwtService.generateToken(apprenant);

                return AuthenticationResponse.builder()
                                .id(apprenant.getId())
                                .token(jwtToken)
                                .email(apprenant.getEmail())
                                .nom(apprenant.getNom())
                                .prenom(apprenant.getPrenom())
                                .role("APPRENANT")
                                .photoProfile(apprenant.getPhotoProfile())
                                .specialite(apprenant.getSpecialite() != null ? apprenant.getSpecialite().getNom() : null)
                                .mfaEnabled(true)
                                .mfaRequired(false)
                                .build();
        }

        public String generateMfaSetup(String email) {
                Apprenant apprenant = repository.findByEmail(email)
                                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Utilisateur non trouvé"));

                String secret = twoFactorService.generateNewSecret();
                apprenant.setMfaSecret(secret);
                repository.save(apprenant);

                return twoFactorService.getQrCodeUrl(secret, apprenant.getEmail());
        }

        public void enableMfa(String email, int code) {
                Apprenant apprenant = repository.findByEmail(email)
                                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Utilisateur non trouvé"));

                if (twoFactorService.isOtpValid(apprenant.getMfaSecret(), code)) {
                        apprenant.setMfaEnabled(true);
                        repository.save(apprenant);
                } else {
                        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Code MFA invalide");
                }
        }

        public void disableMfa(String email) {
                Apprenant apprenant = repository.findByEmail(email)
                                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Utilisateur non trouvé"));
                apprenant.setMfaEnabled(false);
                apprenant.setMfaSecret(null);
                repository.save(apprenant);
        }

        public AuthenticationResponse getUserDetails(String email) {
                String normalizedEmail = email.toLowerCase().trim();
                Apprenant apprenant = repository.findByEmail(normalizedEmail)
                                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                                                "Apprenant non trouvé"));
                return AuthenticationResponse.builder()
                                .id(apprenant.getId())
                                .email(apprenant.getEmail())
                                .nom(apprenant.getNom())
                                .prenom(apprenant.getPrenom())
                                .role("APPRENANT")
                                .photoProfile(apprenant.getPhotoProfile())
                                .specialite(apprenant.getSpecialite() != null ? apprenant.getSpecialite().getNom() : null)
                                .build();
        }

        public void updatePhotoProfile(String email, String filename) {
                Apprenant apprenant = repository.findByEmail(email)
                                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                                                "Apprenant non trouvé"));
                apprenant.setPhotoProfile(filename);
                repository.save(apprenant);
        }

        public void updateProfile(String email, com.certiflow.apprenant.dto.UpdateProfileRequest request) {
                Apprenant apprenant = repository.findByEmail(email)
                                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                                                "Apprenant non trouvé"));

                if (request.getPrenom() != null && !request.getPrenom().trim().isEmpty()) {
                        apprenant.setPrenom(request.getPrenom().trim());
                }
                if (request.getNom() != null && !request.getNom().trim().isEmpty()) {
                        apprenant.setNom(request.getNom().trim());
                }

                if (request.getPassword() != null && !request.getPassword().trim().isEmpty()) {
                        if (request.getCurrentPassword() == null || request.getCurrentPassword().trim().isEmpty()) {
                                throw new ResponseStatusException(
                                                HttpStatus.BAD_REQUEST,
                                                "Le mot de passe actuel est requis pour changer le mot de passe.");
                        }
                        if (!passwordEncoder.matches(request.getCurrentPassword().trim(), apprenant.getMotDePasse())) {
                                throw new ResponseStatusException(
                                                HttpStatus.BAD_REQUEST,
                                                "Le mot de passe actuel est incorrect.");
                        }
                        apprenant.setMotDePasse(passwordEncoder.encode(request.getPassword().trim()));
                }

                repository.save(apprenant);
        }
}
