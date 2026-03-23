package com.certiflow.formateur.service;

import com.certiflow.formateur.dto.AuthenticationRequest;
import com.certiflow.formateur.dto.AuthenticationResponse;
import com.certiflow.formateur.model.Enseignant;
import com.certiflow.formateur.repository.EnseignantRepository;
import com.certiflow.formateur.security.JwtService;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class AuthenticationService {

        private final EnseignantRepository repository;
        private final JwtService jwtService;
        private final AuthenticationManager authenticationManager;
        private final org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

        public AuthenticationService(EnseignantRepository repository,
                        JwtService jwtService,
                        AuthenticationManager authenticationManager,
                        org.springframework.security.crypto.password.PasswordEncoder passwordEncoder) {
                this.repository = repository;
                this.jwtService = jwtService;
                this.authenticationManager = authenticationManager;
                this.passwordEncoder = passwordEncoder;
        }

        public AuthenticationResponse authenticate(AuthenticationRequest request) {
                String normalizedEmail = request.getEmail().toLowerCase().trim();
                String rawPassword = request.getPassword();

                System.out.println("--- LOGIN DEBUG START ---");
                System.out.println("DEBUG: Attempting login for: [" + normalizedEmail + "]");

                // Pre-check existence to see if it's "not found" vs "wrong password"
                boolean exists = repository.existsByEmail(normalizedEmail);
                System.out.println("DEBUG: User exists in database: " + exists);

                Enseignant testUser = repository.findByEmail(normalizedEmail).orElse(null);
                if (testUser != null) {
                        String storedHash = testUser.getMotDePasse();
                        System.out.println("DEBUG: Stored Hash length: "
                                        + (storedHash != null ? storedHash.length() : "NULL"));
                        System.out.println("DEBUG: Manual Password Match Check: "
                                        + passwordEncoder.matches(rawPassword, storedHash));
                        if (storedHash != null && storedHash.length() >= 10) {
                                System.out.println("DEBUG: Stored Hash Prefix: " + storedHash.substring(0, 10));
                        }
                }

                try {
                        authenticationManager.authenticate(
                                        new UsernamePasswordAuthenticationToken(
                                                        normalizedEmail,
                                                        rawPassword));

                        System.out.println("DEBUG: Authentication SUCCESSFUL for: " + normalizedEmail);
                        System.out.println("--- LOGIN DEBUG END ---");
                } catch (org.springframework.security.authentication.BadCredentialsException e) {
                        System.err.println("DEBUG: Authentication FAILED: Bad Credentials for " + normalizedEmail);
                        if (testUser != null) {
                                System.err.println("RE-CHECK: Manual match for [" + rawPassword + "] vs DB was: "
                                                + passwordEncoder.matches(rawPassword, testUser.getMotDePasse()));
                        }
                        if (!exists) {
                                System.err.println(
                                                "DEBUG HINT: The error is likely because the user DOES NOT EXIST in the 'enseignants' table.");
                        } else {
                                System.err.println(
                                                "DEBUG HINT: The user exists, so the PASSWORD hash does not match the encoding.");
                        }
                        System.out.println("--- LOGIN DEBUG END ---");
                        throw new org.springframework.web.server.ResponseStatusException(
                                        org.springframework.http.HttpStatus.UNAUTHORIZED,
                                        "Email ou mot de passe incorrect");
                } catch (Exception e) {
                        System.err.println("DEBUG: Authentication FAILED for UNEXPECTED reason: " + e.getMessage());
                        e.printStackTrace();
                        System.out.println("--- LOGIN DEBUG END ---");
                        throw e;
                }

                Enseignant enseignant = repository.findByEmail(normalizedEmail)
                                .orElseThrow(() -> {
                                        System.err.println("DEBUG: User not found in DB after successful auth! Email: "
                                                        + normalizedEmail);
                                        return new org.springframework.web.server.ResponseStatusException(
                                                        org.springframework.http.HttpStatus.NOT_FOUND,
                                                        "Utilisateur non trouvé");
                                });
                String jwtToken = jwtService.generateToken(enseignant);

                AuthenticationResponse response = new AuthenticationResponse();
                response.setToken(jwtToken);
                response.setEmail(enseignant.getEmail());
                response.setNom(enseignant.getNom());
                response.setPrenom(enseignant.getPrenom());
                response.setRole("ENSEIGNANT");
                response.setPhotoProfile(enseignant.getPhotoProfile());
                response.setSignature(enseignant.getSignature());
                return response;
        }

        public AuthenticationResponse getUserDetails(String email) {
                Enseignant enseignant = repository.findByEmail(email)
                                .orElseThrow();
                AuthenticationResponse response = new AuthenticationResponse();
                response.setEmail(enseignant.getEmail());
                response.setNom(enseignant.getNom());
                response.setPrenom(enseignant.getPrenom());
                response.setRole("ENSEIGNANT");
                response.setPhotoProfile(enseignant.getPhotoProfile());
                response.setSignature(enseignant.getSignature());
                return response;
        }

        public void updateProfile(String email, com.certiflow.formateur.dto.UpdateProfileRequest request) {
                Enseignant enseignant = repository.findByEmail(email).orElseThrow();

                // Only update fields that are explicitly provided and not blank
                if (request.getPrenom() != null && !request.getPrenom().isBlank()) {
                        enseignant.setPrenom(request.getPrenom().trim());
                }
                if (request.getNom() != null && !request.getNom().isBlank()) {
                        enseignant.setNom(request.getNom().trim());
                }

                // Password update logic - only triggers if password is provided
                if (request.getPassword() != null && !request.getPassword().isBlank()) {
                        if (request.getCurrentPassword() == null || request.getCurrentPassword().isBlank()) {
                                throw new org.springframework.web.server.ResponseStatusException(
                                                org.springframework.http.HttpStatus.BAD_REQUEST,
                                                "Le mot de passe actuel est requis pour changer le mot de passe.");
                        }
                        if (!passwordEncoder.matches(request.getCurrentPassword().trim(), enseignant.getMotDePasse())) {
                                throw new org.springframework.web.server.ResponseStatusException(
                                                org.springframework.http.HttpStatus.BAD_REQUEST,
                                                "Le mot de passe actuel est incorrect.");
                        }
                        enseignant.setMotDePasse(passwordEncoder.encode(request.getPassword().trim()));
                }

                // Signature update - can be null to clear, or a string to update
                if (request.getSignature() != null) {
                        enseignant.setSignature(request.getSignature());
                }

                repository.save(enseignant);
        }

        public void updatePhotoProfile(String email, String photoName) {
                Enseignant enseignant = repository.findByEmail(email)
                                .orElseThrow();
                enseignant.setPhotoProfile(photoName);
                repository.save(enseignant);
        }
}
