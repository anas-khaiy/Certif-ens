package com.certiflow.coordinateur.controller;

import com.certiflow.coordinateur.dto.DepotDto;
import com.certiflow.coordinateur.model.Coordinateur;
import com.certiflow.coordinateur.repository.CoordinateurRepository;
import com.certiflow.coordinateur.service.DepotService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/coord/depots")
public class DepotController {

    private final DepotService service;
    private final CoordinateurRepository coordinateurRepository;

    public DepotController(DepotService service, CoordinateurRepository coordinateurRepository) {
        this.service = service;
        this.coordinateurRepository = coordinateurRepository;
    }

    @GetMapping
    public ResponseEntity<List<DepotDto>> getAllDepots() {
        Long coordinateurId = getCurrentCoordinateurId();
        return ResponseEntity.ok(service.getDepotsByCoordinateurId(coordinateurId));
    }

    private Long getCurrentCoordinateurId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        Coordinateur coordinateur = coordinateurRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Coordinateur non trouvé"));
        return coordinateur.getId();
    }
}
