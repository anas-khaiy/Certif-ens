package com.certiflow.admin.controller;

import com.certiflow.admin.model.CertificationPrototype;
import com.certiflow.admin.service.CertificationPrototypeService;
import com.certiflow.admin.service.FileService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/prototypes")
public class CertificationPrototypeController {

    private final CertificationPrototypeService service;
    private final FileService fileService;

    public CertificationPrototypeController(CertificationPrototypeService service, FileService fileService) {
        this.service = service;
        this.fileService = fileService;
    }

    @GetMapping
    public List<CertificationPrototype> getAllPrototypes() {
        return service.getAllPrototypes();
    }

    @GetMapping("/{id}")
    public ResponseEntity<CertificationPrototype> getPrototypeById(@PathVariable Long id) {
        return ResponseEntity.ok(service.getPrototypeById(id));
    }

    @PostMapping
    public CertificationPrototype createPrototype(@RequestBody CertificationPrototype prototype) {
        return service.savePrototype(prototype);
    }

    @PutMapping("/{id}")
    public ResponseEntity<CertificationPrototype> updatePrototype(@PathVariable Long id,
            @RequestBody CertificationPrototype prototype) {
        return ResponseEntity.ok(service.updatePrototype(id, prototype));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePrototype(@PathVariable Long id) {
        service.deletePrototype(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/upload/logo")
    public ResponseEntity<String> uploadLogo(
            @RequestParam("file") org.springframework.web.multipart.MultipartFile file) {
        return ResponseEntity.ok(fileService.saveCertificateFile(file));
    }

    @PostMapping("/upload/cachet")
    public ResponseEntity<String> uploadCachet(
            @RequestParam("file") org.springframework.web.multipart.MultipartFile file) {
        return ResponseEntity.ok(fileService.saveCertificateFile(file));
    }

    @PostMapping("/upload/signature")
    public ResponseEntity<String> uploadSignature(
            @RequestParam("file") org.springframework.web.multipart.MultipartFile file) {
        return ResponseEntity.ok(fileService.saveCertificateFile(file));
    }
}
