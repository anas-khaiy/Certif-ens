package com.certiflow.coordinateur.service;

import com.certiflow.coordinateur.dto.AuthenticationRequest;
import com.certiflow.coordinateur.dto.AuthenticationResponse;
import com.certiflow.coordinateur.model.Coordinateur;
import com.certiflow.coordinateur.repository.CoordinateurRepository;
import com.certiflow.coordinateur.security.JwtService;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class AuthenticationService {

        private final CoordinateurRepository repository;
        private final JwtService jwtService;
        private final AuthenticationManager authenticationManager;
        private final org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

        public AuthenticationService(CoordinateurRepository repository,
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

                try {
                        authenticationManager.authenticate(
                                        new UsernamePasswordAuthenticationToken(
                                                        normalizedEmail,
                                                        rawPassword));
                } catch (Exception e) {
                        throw new org.springframework.web.server.ResponseStatusException(
                                        org.springframework.http.HttpStatus.UNAUTHORIZED,
                                        "Email ou mot de passe incorrect");
                }

                Coordinateur coordinateur = repository.findByEmail(normalizedEmail)
                                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                                                org.springframework.http.HttpStatus.NOT_FOUND,
                                                "Utilisateur non trouvé"));
                
                String jwtToken = jwtService.generateToken(coordinateur);

                AuthenticationResponse response = new AuthenticationResponse();
                response.setToken(jwtToken);
                response.setEmail(coordinateur.getEmail());
                response.setNom(coordinateur.getNom());
                response.setPrenom(coordinateur.getPrenom());
                response.setRole("COORDINATEUR");
                response.setPhotoProfile(coordinateur.getPhotoProfile());
                return response;
        }

        public AuthenticationResponse getUserDetails(String email) {
                Coordinateur coordinateur = repository.findByEmail(email).orElseThrow();
                AuthenticationResponse response = new AuthenticationResponse();
                response.setEmail(coordinateur.getEmail());
                response.setNom(coordinateur.getNom());
                response.setPrenom(coordinateur.getPrenom());
                response.setRole("COORDINATEUR");
                response.setPhotoProfile(coordinateur.getPhotoProfile());
                return response;
        }

        public void updateProfile(String email, com.certiflow.coordinateur.dto.UpdateProfileRequest request) {
                Coordinateur coordinateur = repository.findByEmail(email).orElseThrow();

                if (request.getPrenom() != null && !request.getPrenom().isBlank()) {
                        coordinateur.setPrenom(request.getPrenom().trim());
                }
                if (request.getNom() != null && !request.getNom().isBlank()) {
                        coordinateur.setNom(request.getNom().trim());
                }

                if (request.getPassword() != null && !request.getPassword().isBlank()) {
                        if (request.getCurrentPassword() == null || request.getCurrentPassword().isBlank()) {
                                throw new org.springframework.web.server.ResponseStatusException(
                                                org.springframework.http.HttpStatus.BAD_REQUEST,
                                                "Le mot de passe actuel est requis pour changer le mot de passe.");
                        }
                        if (!passwordEncoder.matches(request.getCurrentPassword().trim(), coordinateur.getMotDePasse())) {
                                throw new org.springframework.web.server.ResponseStatusException(
                                                org.springframework.http.HttpStatus.BAD_REQUEST,
                                                "Le mot de passe actuel est incorrect.");
                        }
                        coordinateur.setMotDePasse(passwordEncoder.encode(request.getPassword().trim()));
                }

                repository.save(coordinateur);
        }

        public void updatePhotoProfile(String email, String photoName) {
                Coordinateur coordinateur = repository.findByEmail(email).orElseThrow();
                coordinateur.setPhotoProfile(photoName);
                repository.save(coordinateur);
        }
}
