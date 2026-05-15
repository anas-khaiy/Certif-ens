package com.certiflow.formateur.controller;

import com.certiflow.formateur.model.EncadrementPlan;
import com.certiflow.formateur.service.EncadrementService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/encadrement")
@RequiredArgsConstructor
public class EncadrementController {

    private final EncadrementService encadrementService;

    @GetMapping("/trainer")
    public ResponseEntity<List<EncadrementPlan>> getTrainerPlans(Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) return ResponseEntity.status(401).build();
        return ResponseEntity.ok(encadrementService.getPlansByTrainer(auth.getName()));
    }

    @PostMapping("/save")
    public ResponseEntity<EncadrementPlan> savePlan(@RequestBody EncadrementPlan plan, Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) return ResponseEntity.status(401).build();
        return ResponseEntity.ok(encadrementService.savePlan(plan, auth.getName()));
    }

    @DeleteMapping("/{planId}")
    public ResponseEntity<Void> deletePlan(@PathVariable Long planId, Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) return ResponseEntity.status(401).build();
        encadrementService.deletePlan(planId);
        return ResponseEntity.noContent().build();
    }
}
