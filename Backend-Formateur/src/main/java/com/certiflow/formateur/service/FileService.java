package com.certiflow.formateur.service;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@Service
public class FileService {

    private final Path rootCertificates = Paths.get("uploads/certificates");
    private final Path rootProfiles = Paths.get("uploads/profiles");
    private final Path rootContentImages = Paths.get("uploads/content-images");

    public FileService() {
        try {
            if (!Files.exists(rootCertificates))
                Files.createDirectories(rootCertificates);
            if (!Files.exists(rootProfiles))
                Files.createDirectories(rootProfiles);
            if (!Files.exists(rootContentImages))
                Files.createDirectories(rootContentImages);
        } catch (IOException e) {
            throw new RuntimeException("Could not initialize upload folders!");
        }
    }

    public String saveCertificateFile(MultipartFile file) {
        return saveFile(file, rootCertificates);
    }

    public String saveProfileFile(MultipartFile file) {
        return saveFile(file, rootProfiles);
    }

    public String saveContentImageFile(MultipartFile file) {
        return saveFile(file, rootContentImages);
    }

    private String saveFile(MultipartFile file, Path root) {
        try {
            if (file.isEmpty()) {
                throw new RuntimeException("Failed to store empty file.");
            }
            String filename = UUID.randomUUID().toString() + "_" + file.getOriginalFilename();
            Files.copy(file.getInputStream(), root.resolve(filename));
            return filename;
        } catch (Exception e) {
            throw new RuntimeException("Could not store the file. Error: " + e.getMessage());
        }
    }
}
