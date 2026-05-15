package com.certiflow.formateur.controller;

import com.certiflow.formateur.dto.VerificationDTO;
import com.certiflow.formateur.service.VerificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/verify")
@RequiredArgsConstructor
public class VerificationController {

    private final VerificationService verificationService;

    @GetMapping("/{certId}")
    public ResponseEntity<VerificationDTO> verifyCertificate(@PathVariable String certId) {
        try {
            VerificationDTO result = verificationService.verifyAny(certId);
            // Always return 200 OK so the frontend can read the 'errorMessage' in the body
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.ok(VerificationDTO.builder()
                    .valid(false)
                    .errorMessage("Erreur Système: " + e.getMessage())
                    .build());
        }
    }
}
