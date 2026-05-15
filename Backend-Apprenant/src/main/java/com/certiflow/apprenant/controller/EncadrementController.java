package com.certiflow.apprenant.controller;

import com.certiflow.apprenant.model.EncadrementPlan;
import com.certiflow.apprenant.model.EncadrementTaskStatus;
import com.certiflow.apprenant.service.EncadrementService;
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

    @GetMapping("/mine")
    public ResponseEntity<List<EncadrementPlan>> getMyPlans(Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) return ResponseEntity.status(401).build();
        // auth.getName() is the apprenant email
        return ResponseEntity.ok(encadrementService.getPlansByApprenantEmail(auth.getName()));
    }

    @PatchMapping("/task/{taskId}/status")
    public ResponseEntity<Void> updateTaskStatus(
            @PathVariable Long taskId,
            @RequestParam EncadrementTaskStatus status,
            Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) return ResponseEntity.status(401).build();
        encadrementService.updateTaskStatus(taskId, status);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/save")
    public ResponseEntity<EncadrementPlan> saveProgress(@RequestBody EncadrementPlan plan, Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) return ResponseEntity.status(401).build();
        return ResponseEntity.ok(encadrementService.savePlan(plan));
    }
}
