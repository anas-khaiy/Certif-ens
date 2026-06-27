package com.certiflow.coordinateur.controller;

import com.certiflow.coordinateur.model.Coordinateur;
import com.certiflow.coordinateur.repository.CoordinateurRepository;
import com.certiflow.coordinateur.service.SystemSettingService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/coord/settings")
public class SystemSettingController {

    private final SystemSettingService service;
    private final CoordinateurRepository coordinateurRepository;

    public SystemSettingController(SystemSettingService service, CoordinateurRepository coordinateurRepository) {
        this.service = service;
        this.coordinateurRepository = coordinateurRepository;
    }

    @GetMapping
    public ResponseEntity<Map<String, String>> getAllSettings() {
        Long coordinateurId = getCurrentCoordinateurId();
        return ResponseEntity.ok(service.getSettingsMapByCoordinateurId(coordinateurId));
    }

    @PostMapping
    public ResponseEntity<Void> saveSettings(@RequestBody Map<String, String> settings) {
        Long coordinateurId = getCurrentCoordinateurId();
        service.saveSettingsByCoordinateurId(coordinateurId, settings);
        return ResponseEntity.ok().build();
    }

    private Long getCurrentCoordinateurId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        Coordinateur coordinateur = coordinateurRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Coordinateur non trouvé"));
        return coordinateur.getId();
    }
}
