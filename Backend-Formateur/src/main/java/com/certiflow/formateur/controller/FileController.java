package com.certiflow.formateur.controller;

import com.certiflow.formateur.service.AuthenticationService;
import com.certiflow.formateur.service.FileService;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.net.MalformedURLException;
import java.nio.file.Path;
import java.nio.file.Paths;

@RestController
@RequestMapping("/api/v1/files")
public class FileController {

    private final FileService fileService;
    private final AuthenticationService authenticationService;

    public FileController(FileService fileService, AuthenticationService authenticationService) {
        this.fileService = fileService;
        this.authenticationService = authenticationService;
    }

    /**
     * Upload a profile photo for the currently authenticated trainer.
     */
    @PostMapping("/profiles/upload")
    public ResponseEntity<String> uploadProfilePhoto(@RequestParam("file") MultipartFile file) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();
        String filename = fileService.saveProfileFile(file);
        authenticationService.updatePhotoProfile(email, filename);
        return ResponseEntity.ok(filename);
    }

    /**
     * Upload an image from the rich-text lesson editor.
     * Returns JSON: { "url":
     * "http://localhost:8081/api/v1/files/content-images/{filename}" }
     */
    @PostMapping("/content-images/upload")
    public ResponseEntity<java.util.Map<String, String>> uploadContentImage(
            @RequestParam("file") MultipartFile file,
            jakarta.servlet.http.HttpServletRequest request) {
        String filename = fileService.saveContentImageFile(file);
        String baseUrl = request.getScheme() + "://" + request.getServerName() + ":" + request.getServerPort();
        String url = baseUrl + "/api/v1/files/content-images/" + filename;
        return ResponseEntity.ok(java.util.Map.of("url", url, "filename", filename));
    }

    /**
     * Serve a profile image file. Falls back to default.png if not found.
     */
    @GetMapping("/profiles/{filename:.+}")
    public ResponseEntity<Resource> serveProfileFile(@PathVariable String filename) {
        try {
            Path filePath = Paths.get("uploads/profiles").resolve(filename);
            Resource resource = new UrlResource(filePath.toUri());

            if (!resource.exists() || !resource.isReadable()) {
                // fallback to default
                filePath = Paths.get("uploads/profiles").resolve("default.png");
                resource = new UrlResource(filePath.toUri());
            }

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                    .contentType(MediaType.IMAGE_PNG)
                    .body(resource);
        } catch (MalformedURLException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Serve a certificate image file.
     */
    @GetMapping("/certificates/{filename:.+}")
    public ResponseEntity<Resource> serveCertificateFile(@PathVariable String filename) {
        try {
            Path filePath = Paths.get("uploads/certificates").resolve(filename);
            Resource resource = new UrlResource(filePath.toUri());
            if (!resource.exists() || !resource.isReadable())
                return ResponseEntity.notFound().build();
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                    .contentType(MediaType.IMAGE_PNG)
                    .body(resource);
        } catch (MalformedURLException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Serve a content-image file (uploaded from the lesson rich-text editor).
     */
    @GetMapping("/content-images/{filename:.+}")
    public ResponseEntity<Resource> serveContentImage(@PathVariable String filename) {
        try {
            Path filePath = Paths.get("uploads/content-images").resolve(filename);
            Resource resource = new UrlResource(filePath.toUri());
            if (!resource.exists() || !resource.isReadable())
                return ResponseEntity.notFound().build();
            String contentType = "image/jpeg";
            String lc = filename.toLowerCase();
            if (lc.endsWith(".png"))
                contentType = "image/png";
            else if (lc.endsWith(".gif"))
                contentType = "image/gif";
            else if (lc.endsWith(".webp"))
                contentType = "image/webp";
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
                    .contentType(MediaType.parseMediaType(contentType))
                    .body(resource);
        } catch (MalformedURLException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
