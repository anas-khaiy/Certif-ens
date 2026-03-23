package com.certiflow.admin.controller;

import com.certiflow.admin.dto.ImportResponse;
import com.certiflow.admin.service.ApprenantService;
import com.certiflow.admin.service.EnseignantService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequiredArgsConstructor
public class ExcelImportController {

    private final EnseignantService enseignantService;
    private final ApprenantService apprenantService;

    @PostMapping(value = "/api/v1/excel/import/enseignants")
    public ResponseEntity<ImportResponse> importEnseignants(@RequestParam("file") MultipartFile file) {
        System.out.println("Excel IMPORT (POST) Enseignants reached - File: " + file.getOriginalFilename());
        return ResponseEntity.ok(enseignantService.importEnseignants(file));
    }

    @PostMapping(value = "/api/v1/excel/import/apprenants")
    public ResponseEntity<ImportResponse> importApprenants(@RequestParam("file") MultipartFile file) {
        System.out.println("Excel IMPORT (POST) Apprenants reached - File: " + file.getOriginalFilename());
        return ResponseEntity.ok(apprenantService.importApprenants(file));
    }
}
