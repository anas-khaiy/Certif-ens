package com.certiflow.apprenant.controller;

import com.certiflow.apprenant.dto.MonPfeDto;
import com.certiflow.apprenant.service.MonPfeService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;

import java.io.IOException;
import java.nio.file.Path;
import java.nio.file.Paths;

@RestController
@RequestMapping("/api/v1/mon-pfe")
public class MonPfeController {

    private final MonPfeService monPfeService;

    public MonPfeController(MonPfeService monPfeService) {
        this.monPfeService = monPfeService;
    }

    @GetMapping
    public ResponseEntity<MonPfeDto> getMonPfe(Authentication authentication) {
        String email = authentication.getName();
        return ResponseEntity.ok(monPfeService.getMonPfeDetails(email));
    }

    @PostMapping("/upload/{typeDepot}")
    public ResponseEntity<?> uploadDepot(
            @PathVariable String typeDepot,
            @RequestParam("file") MultipartFile file,
            Authentication authentication) {
        try {
            String email = authentication.getName();
            monPfeService.uploadDepot(email, typeDepot, file);
            return ResponseEntity.ok().body("{\"message\": \"Dépôt effectué avec succès\"}");
        } catch (RuntimeException | IOException e) {
            return ResponseEntity.badRequest().body("{\"error\": \"" + e.getMessage() + "\"}");
        }
    }

    @GetMapping("/download/{filename:.+}")
    public ResponseEntity<Resource> downloadFile(@PathVariable String filename) {
        try {
            // L'idéal serait de récupérer uploadDir depuis un Service
            // Ici, pour la simplicité de l'ajout, on pointe directement vers uploads/pfe
            Path filePath = Paths.get("uploads/pfe").resolve(filename).normalize();
            Resource resource = new UrlResource(filePath.toUri());

            if (resource.exists() && resource.isReadable()) {
                return ResponseEntity.ok()
                        .contentType(MediaType.APPLICATION_PDF)
                        .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                        .body(resource);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}
