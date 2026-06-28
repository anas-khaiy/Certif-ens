package com.certiflow.coordinateur.controller;

import com.certiflow.coordinateur.model.Coordinateur;
import com.certiflow.coordinateur.model.SujetPropositionConfig;
import com.certiflow.coordinateur.repository.CoordinateurRepository;
import com.certiflow.coordinateur.service.SujetPropositionConfigService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/coord/sujet-config")
public class SujetPropositionConfigController {

    private final SujetPropositionConfigService configService;
    private final CoordinateurRepository coordinateurRepository;

    public SujetPropositionConfigController(SujetPropositionConfigService configService, CoordinateurRepository coordinateurRepository) {
        this.configService = configService;
        this.coordinateurRepository = coordinateurRepository;
    }

    @GetMapping
    public ResponseEntity<SujetPropositionConfig> getConfig(Authentication authentication) {
        Coordinateur coordinateur = coordinateurRepository.findByEmail(authentication.getName())
            .orElseThrow(() -> new RuntimeException("Coordinateur non trouvé"));
        SujetPropositionConfig config = configService.getConfig(coordinateur.getId());
        return ResponseEntity.ok(config);
    }

    @PostMapping
    public ResponseEntity<SujetPropositionConfig> saveConfig(
            Authentication authentication,
            @RequestBody ConfigRequest request) {
        Coordinateur coordinateur = coordinateurRepository.findByEmail(authentication.getName())
            .orElseThrow(() -> new RuntimeException("Coordinateur non trouvé"));
        SujetPropositionConfig saved = configService.saveConfig(
                coordinateur.getId(),
                request.getNombreSujets(),
                request.getFormateurIds()
        );
        return ResponseEntity.ok(saved);
    }

    public static class ConfigRequest {
        private int nombreSujets;
        private List<Long> formateurIds;

        public int getNombreSujets() { return nombreSujets; }
        public void setNombreSujets(int nombreSujets) { this.nombreSujets = nombreSujets; }
        public List<Long> getFormateurIds() { return formateurIds; }
        public void setFormateurIds(List<Long> formateurIds) { this.formateurIds = formateurIds; }
    }
}
