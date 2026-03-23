package com.certiflow.admin.controller;

import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.net.MalformedURLException;
import java.nio.file.Path;
import java.nio.file.Paths;

@RestController
@RequestMapping("/api/v1/files")
public class FileController {

    @GetMapping("/profiles/{filename:.+}")
    public ResponseEntity<Resource> getProfileImage(@PathVariable String filename) {
        return getResource(filename, Paths.get("uploads/profiles"), "default.png");
    }

    @GetMapping("/certificates/{filename:.+}")
    public ResponseEntity<Resource> getCertificateImage(@PathVariable String filename) {
        return getResource(filename, Paths.get("uploads/certificates"), null);
    }

    private ResponseEntity<Resource> getResource(String filename, Path root, String defaultFile) {
        try {
            Path file = root.resolve(filename);
            Resource resource = new UrlResource(file.toUri());

            if (resource.exists() || resource.isReadable()) {
                String contentType = "image/png";
                if (filename.toLowerCase().endsWith(".jpg") || filename.toLowerCase().endsWith(".jpeg")) {
                    contentType = "image/jpeg";
                }

                return ResponseEntity.ok()
                        .contentType(MediaType.parseMediaType(contentType))
                        .body(resource);
            } else if (defaultFile != null) {
                Path def = root.resolve(defaultFile);
                Resource defaultResource = new UrlResource(def.toUri());
                return ResponseEntity.ok()
                        .contentType(MediaType.IMAGE_PNG)
                        .body(defaultResource);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (MalformedURLException e) {
            return ResponseEntity.badRequest().build();
        }
    }
}
