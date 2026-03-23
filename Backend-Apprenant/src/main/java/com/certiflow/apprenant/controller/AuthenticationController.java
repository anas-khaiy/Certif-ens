package com.certiflow.apprenant.controller;

import com.certiflow.apprenant.dto.AuthenticationRequest;
import com.certiflow.apprenant.dto.AuthenticationResponse;
import com.certiflow.apprenant.service.AuthenticationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthenticationController {

    private final AuthenticationService service;

    public AuthenticationController(AuthenticationService service) {
        this.service = service;
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
}
