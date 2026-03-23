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

        public AuthenticationService(ApprenantRepository repository,
                        JwtService jwtService,
                        AuthenticationManager authenticationManager,
                        PasswordEncoder passwordEncoder) {
                this.repository = repository;
                this.jwtService = jwtService;
                this.authenticationManager = authenticationManager;
                this.passwordEncoder = passwordEncoder;
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

                String jwtToken = jwtService.generateToken(apprenant);

                return AuthenticationResponse.builder()
                                .token(jwtToken)
                                .email(apprenant.getEmail())
                                .nom(apprenant.getNom())
                                .prenom(apprenant.getPrenom())
                                .role("APPRENANT")
                                .photoProfile(apprenant.getPhotoProfile())
                                .build();
        }

        public AuthenticationResponse getUserDetails(String email) {
                String normalizedEmail = email.toLowerCase().trim();
                Apprenant apprenant = repository.findByEmail(normalizedEmail)
                                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                                                "Apprenant non trouvé"));
                return AuthenticationResponse.builder()
                                .email(apprenant.getEmail())
                                .nom(apprenant.getNom())
                                .prenom(apprenant.getPrenom())
                                .role("APPRENANT")
                                .photoProfile(apprenant.getPhotoProfile())
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
