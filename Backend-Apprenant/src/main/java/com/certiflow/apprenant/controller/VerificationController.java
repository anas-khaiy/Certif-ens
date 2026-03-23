package com.certiflow.apprenant.controller;

import com.certiflow.apprenant.dto.VerificationDTO;
import com.certiflow.apprenant.service.VerificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/verify")
@RequiredArgsConstructor
public class VerificationController {

        private final VerificationService verificationService;

        @GetMapping("/{enrollmentId}")
        public ResponseEntity<VerificationDTO> verifyCertificate(@PathVariable Long enrollmentId) {
                try {
                        System.out.println("Processing verification for certificate ID: " + enrollmentId);
                        VerificationDTO result = verificationService.verify(enrollmentId);
                        return ResponseEntity.ok(result);
                } catch (Exception e) {
                        System.err.println("Critical Error in VerificationController: " + e.getMessage());
                        return ResponseEntity.ok(VerificationDTO.builder()
                                        .valid(false)
                                        .errorMessage("Oups! Erreur technique: " + e.getMessage())
                                        .build());
                }
        }
}
