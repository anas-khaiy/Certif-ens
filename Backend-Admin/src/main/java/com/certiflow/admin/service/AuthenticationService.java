package com.certiflow.admin.service;

import com.certiflow.admin.dto.AuthenticationRequest;
import com.certiflow.admin.dto.AuthenticationResponse;
import com.certiflow.admin.dto.RegisterRequest;
import com.certiflow.admin.model.Admin;
import com.certiflow.admin.model.Role;
import com.certiflow.admin.repository.AdminRepository;
import com.certiflow.admin.security.JwtService;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthenticationService {

        private final AdminRepository repository;
        private final PasswordEncoder passwordEncoder;
        private final JwtService jwtService;
        private final AuthenticationManager authenticationManager;

        public AuthenticationService(AdminRepository repository,
                        PasswordEncoder passwordEncoder,
                        JwtService jwtService,
                        AuthenticationManager authenticationManager) {
                this.repository = repository;
                this.passwordEncoder = passwordEncoder;
                this.jwtService = jwtService;
                this.authenticationManager = authenticationManager;
        }

        public AuthenticationResponse register(RegisterRequest request) {
                Admin admin = new Admin();
                admin.setNom(request.getNom());
                admin.setPrenom(request.getPrenom());
                admin.setEmail(request.getEmail());
                admin.setPassword(passwordEncoder.encode(request.getPassword()));
                admin.setRole(Role.ADMIN);
                admin.setPhotoProfile("default.png");

                repository.save(admin);
                var jwtToken = jwtService.generateToken(admin);

                AuthenticationResponse response = new AuthenticationResponse();
                response.setToken(jwtToken);
                response.setEmail(admin.getEmail());
                response.setNom(admin.getNom());
                response.setPrenom(admin.getPrenom());
                response.setRole(admin.getRole().name());
                response.setPhotoProfile(admin.getPhotoProfile());
                return response;
        }

        public AuthenticationResponse authenticate(AuthenticationRequest request) {
                authenticationManager.authenticate(
                                new UsernamePasswordAuthenticationToken(
                                                request.getEmail(),
                                                request.getPassword()));
                var admin = repository.findByEmail(request.getEmail())
                                .orElseThrow();
                var jwtToken = jwtService.generateToken(admin);

                AuthenticationResponse response = new AuthenticationResponse();
                response.setToken(jwtToken);
                response.setEmail(admin.getEmail());
                response.setNom(admin.getNom());
                response.setPrenom(admin.getPrenom());
                response.setRole(admin.getRole().name());
                response.setPhotoProfile(admin.getPhotoProfile());
                return response;
        }

        public AuthenticationResponse getUserDetails(String email) {
                var admin = repository.findByEmail(email)
                                .orElseThrow();
                AuthenticationResponse response = new AuthenticationResponse();
                response.setEmail(admin.getEmail());
                response.setNom(admin.getNom());
                response.setPrenom(admin.getPrenom());
                response.setRole(admin.getRole().name());
                response.setPhotoProfile(admin.getPhotoProfile());
                // We don't send the token back here, it's already in the cookie
                return response;
        }

        public void updateProfile(String email, com.certiflow.admin.dto.ProfileUpdateRequest request) {
                var admin = repository.findByEmail(email)
                                .orElseThrow();
                admin.setNom(request.getNom());
                admin.setPrenom(request.getPrenom());
                repository.save(admin);
        }

        public void updatePassword(String email, com.certiflow.admin.dto.PasswordUpdateRequest request) {
                var admin = repository.findByEmail(email)
                                .orElseThrow();
                if (!passwordEncoder.matches(request.getCurrentPassword(), admin.getPassword())) {
                        throw new RuntimeException("Current password incorrect");
                }
                admin.setPassword(passwordEncoder.encode(request.getNewPassword()));
                repository.save(admin);
        }

        public void updatePhotoProfile(String email, String photoName) {
                var admin = repository.findByEmail(email)
                                .orElseThrow();
                admin.setPhotoProfile(photoName);
                repository.save(admin);
        }
}
