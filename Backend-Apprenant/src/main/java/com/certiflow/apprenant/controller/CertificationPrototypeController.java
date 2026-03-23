package com.certiflow.apprenant.controller;

import com.certiflow.apprenant.model.CertificationPrototype;
import com.certiflow.apprenant.service.CertificationPrototypeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/prototypes")
@RequiredArgsConstructor
public class CertificationPrototypeController {

    private final CertificationPrototypeService service;

    @GetMapping("/global")
    public ResponseEntity<CertificationPrototype> getGlobalPrototype() {
        return service.getGlobalPrototype()
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.noContent().build());
    }
}
