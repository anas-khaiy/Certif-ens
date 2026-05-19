package com.certiflow.admin.service;

import com.certiflow.admin.dto.ImportResponse;
import com.certiflow.admin.model.Apprenant;
import com.certiflow.admin.model.Cycle;
import com.certiflow.admin.model.Enseignant;
import com.certiflow.admin.model.Formation;
import com.certiflow.admin.model.Specialite;
import com.certiflow.admin.repository.ApprenantRepository;
import com.certiflow.admin.repository.CycleRepository;
import com.certiflow.admin.repository.EnseignantRepository;
import com.certiflow.admin.repository.FormationRepository;
import com.certiflow.admin.repository.SpecialiteRepository;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.util.*;

import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class ExcelImportService {

    private final EnseignantRepository enseignantRepository;
    private final ApprenantRepository apprenantRepository;
    private final SpecialiteRepository specialiteRepository;
    private final CycleRepository cycleRepository;
    private final FormationRepository formationRepository;
    private final PasswordEncoder passwordEncoder;
    private final SpecialiteService specialiteService;
    private final CycleService cycleService;
    private final FormationService formationService;
    private final EmailService emailService;

    // ──────────────────────────────────────────────────────────────────────────
    // ENSEIGNANTS
    // Expected columns: nom, prenom, email, specialite (optional)
    // ──────────────────────────────────────────────────────────────────────────
    public ImportResponse importEnseignants(MultipartFile file) {
        List<String> errors = new ArrayList<>();
        int successCount = 0;
        int totalRows = 0;

        try (InputStream is = file.getInputStream(); Workbook workbook = new XSSFWorkbook(is)) {
            Sheet sheet = workbook.getSheetAt(0);
            Iterator<Row> rows = sheet.iterator();

            // Read header row and build column-name → index map
            if (!rows.hasNext()) {
                errors.add("Le fichier est vide.");
                return buildResponse(totalRows, successCount, errors);
            }
            Row headerRow = rows.next();
            Map<String, Integer> headers = buildHeaderMap(headerRow);

            // Validate required columns
            List<String> requiredCols = List.of("nom", "prenom", "email");
            for (String col : requiredCols) {
                if (!headers.containsKey(col)) {
                    errors.add("Colonne obligatoire manquante : \"" + col + "\". "
                            + "Ce fichier ne semble pas être un fichier de formateurs.");
                    return buildResponse(0, 0, errors);
                }
            }

            int rowIdx = 1;
            while (rows.hasNext()) {
                rowIdx++;
                Row row = rows.next();

                // Skip completely empty rows
                if (isRowEmpty(row))
                    continue;
                totalRows++;

                try {
                    String nom = getCellByHeader(row, headers, "nom");
                    String prenom = getCellByHeader(row, headers, "prenom");
                    String email = getCellByHeader(row, headers, "email");
                    String specNom = getCellByHeader(row, headers, "specialite");

                    if (isEmpty(nom) || isEmpty(prenom) || isEmpty(email)) {
                        errors.add("Ligne " + rowIdx + ": Données manquantes (Nom, Prénom ou Email).");
                        continue;
                    }

                    String normalizedEmail = email.toLowerCase().trim();
                    if (enseignantRepository.existsByEmail(normalizedEmail)) {
                        errors.add("Ligne " + rowIdx + ": L'email '" + normalizedEmail + "' existe déjà.");
                        continue;
                    }

                    Specialite specialite = null;
                    if (!isEmpty(specNom)) {
                        String normSpec = specNom.toLowerCase().trim();
                        specialite = specialiteRepository.findByNomIgnoreCase(normSpec)
                                .orElseGet(() -> specialiteService.saveSpecialite(
                                        Specialite.builder().nom(normSpec).build()));
                    }

                    Enseignant e = Enseignant.builder()
                            .nom(nom.toLowerCase().trim())
                            .prenom(prenom.toLowerCase().trim())
                            .email(normalizedEmail)
                            .specialite(specialite)
                            .motDePasse(passwordEncoder.encode(normalizedEmail))
                            .photoProfile("default.png")
                            .build();

                    if (e != null) {
                        enseignantRepository.save(e);
                        successCount++;
                    }
                } catch (Exception ex) {
                    errors.add("Ligne " + rowIdx + ": Erreur lors de l'enregistrement: " + ex.getMessage());
                }
            }
        } catch (IOException e) {
            errors.add("Erreur lors de la lecture du fichier: " + e.getMessage());
        }

        return buildResponse(totalRows, successCount, errors);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // APPRENANTS
    // Expected columns: nom, prenom, cin, email, specialite (opt), cycle (opt)
    // ──────────────────────────────────────────────────────────────────────────
    public ImportResponse importApprenants(MultipartFile file) {
        List<String> errors = new ArrayList<>();
        int successCount = 0;
        int totalRows = 0;

        try (InputStream is = file.getInputStream(); Workbook workbook = new XSSFWorkbook(is)) {
            Sheet sheet = workbook.getSheetAt(0);
            Iterator<Row> rows = sheet.iterator();

            if (!rows.hasNext()) {
                errors.add("Le fichier est vide.");
                return buildResponse(totalRows, successCount, errors);
            }
            Row headerRow = rows.next();
            Map<String, Integer> headers = buildHeaderMap(headerRow);

            // Validate required columns
            List<String> requiredCols = List.of("nom", "prenom", "cin", "email");
            for (String col : requiredCols) {
                if (!headers.containsKey(col)) {
                    errors.add("Colonne obligatoire manquante : \"" + col + "\". "
                            + "Ce fichier ne semble pas être un fichier d'apprenants (colonnes attendues : nom, prenom, cin, email, specialite, cycle).");
                    return buildResponse(0, 0, errors);
                }
            }

            int rowIdx = 1;
            while (rows.hasNext()) {
                rowIdx++;
                Row row = rows.next();

                if (isRowEmpty(row))
                    continue;
                totalRows++;

                try {
                    String nom = getCellByHeader(row, headers, "nom");
                    String prenom = getCellByHeader(row, headers, "prenom");
                    String cin = getCellByHeader(row, headers, "cin");
                    String email = getCellByHeader(row, headers, "email");
                    String specNom = getCellByHeader(row, headers, "specialite");
                    String cycleNom = getCellByHeader(row, headers, "cycle");
                    String formationNom = getCellByHeader(row, headers, "formation");
                    String sexe = getCellByHeader(row, headers, "sexe");

                    if (isEmpty(nom) || isEmpty(prenom) || isEmpty(cin) || isEmpty(email)) {
                        errors.add("Ligne " + rowIdx + ": Données manquantes (Nom, Prénom, CIN ou Email).");
                        continue;
                    }

                    String normalizedEmail = email.toLowerCase().trim();
                    String normalizedCin = cin.toUpperCase().trim();

                    if (apprenantRepository.existsByEmail(normalizedEmail)) {
                        errors.add("Ligne " + rowIdx + ": L'email '" + normalizedEmail + "' existe déjà.");
                        continue;
                    }
                    if (apprenantRepository.existsByCin(normalizedCin)) {
                        errors.add("Ligne " + rowIdx + ": Le CIN '" + normalizedCin + "' existe déjà.");
                        continue;
                    }

                    Specialite specialite = null;
                    if (!isEmpty(specNom)) {
                        String normSpec = specNom.toLowerCase().trim();
                        specialite = specialiteRepository.findByNomIgnoreCase(normSpec)
                                .orElseGet(() -> specialiteService.saveSpecialite(
                                        Specialite.builder().nom(normSpec).build()));
                    }

                    Cycle cycle = null;
                    if (!isEmpty(cycleNom)) {
                        String normCycle = cycleNom.toLowerCase().trim();
                        cycle = cycleRepository.findByNomCycleIgnoreCase(normCycle)
                                .orElseGet(() -> cycleService.saveCycle(
                                        Cycle.builder().nomCycle(normCycle).build()));
                    }

                    Formation formation = null;
                    if (!isEmpty(formationNom)) {
                        String normForm = formationNom.toLowerCase().trim();
                        formation = formationRepository.findByNomIgnoreCase(normForm)
                                .orElseGet(() -> formationService.saveFormation(
                                        new Formation(null, normForm)));
                    }

                    Apprenant a = Apprenant.builder()
                            .nom(nom.toLowerCase().trim())
                            .prenom(prenom.toLowerCase().trim())
                            .cin(normalizedCin)
                            .email(normalizedEmail)
                            .specialite(specialite)
                            .cycle(cycle)
                            .formation(formation)
                            .sexe(sexe)
                            .motDePasse(passwordEncoder.encode(normalizedCin))
                            .photoProfile("default.png")
                            .build();

                    if (a != null) {
                        apprenantRepository.save(a);
                        successCount++;
                        
                        // Send Welcome Email asynchronously to not block the import
                        final String userEmail = normalizedEmail;
                        final String userPrenom = prenom;
                        final String userCin = normalizedCin;
                        try {
                            new Thread(() -> {
                                try {
                                    emailService.sendApprenantWelcomeEmail(userEmail, userPrenom, userCin);
                                } catch (Exception e) {
                                    System.err.println("Failed to send welcome email to " + userEmail + ": " + e.getMessage());
                                }
                            }).start();
                        } catch (Exception e) {
                            System.err.println("Failed to start email thread: " + e.getMessage());
                        }
                    }
                } catch (Exception ex) {
                    errors.add("Ligne " + rowIdx + ": Erreur lors de l'enregistrement: " + ex.getMessage());
                }
            }
        } catch (IOException e) {
            errors.add("Erreur lors de la lecture du fichier: " + e.getMessage());
        }

        return buildResponse(totalRows, successCount, errors);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Helpers
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Build a case-insensitive map: header label (trimmed, lowercase) → column
     * index
     */
    private Map<String, Integer> buildHeaderMap(Row headerRow) {
        Map<String, Integer> map = new HashMap<>();
        for (Cell cell : headerRow) {
            String label = getRawCellValue(cell).trim().toLowerCase();
            if (!label.isEmpty()) {
                map.put(label, cell.getColumnIndex());
            }
        }
        return map;
    }

    /**
     * Get cell value by header name; returns "" if column not present in this row
     */
    private String getCellByHeader(Row row, Map<String, Integer> headers, String header) {
        Integer idx = headers.get(header.toLowerCase());
        if (idx == null)
            return "";
        return getCellValue(row, idx);
    }

    private String getCellValue(Row row, int cellIdx) {
        Cell cell = row.getCell(cellIdx);
        return getRawCellValue(cell);
    }

    private String getRawCellValue(Cell cell) {
        if (cell == null)
            return "";
        switch (cell.getCellType()) {
            case STRING:
                return cell.getStringCellValue();
            case NUMERIC:
                if (DateUtil.isCellDateFormatted(cell))
                    return cell.getDateCellValue().toString();
                return String.valueOf((long) cell.getNumericCellValue());
            case BOOLEAN:
                return String.valueOf(cell.getBooleanCellValue());
            default:
                return "";
        }
    }

    private boolean isRowEmpty(Row row) {
        if (row == null)
            return true;
        for (Cell cell : row) {
            if (!isEmpty(getRawCellValue(cell)))
                return false;
        }
        return true;
    }

    private boolean isEmpty(String s) {
        return s == null || s.trim().isEmpty();
    }

    private ImportResponse buildResponse(int total, int success, List<String> errors) {
        return ImportResponse.builder()
                .totalAttempted(total)
                .successCount(success)
                .failureCount(total - success)
                .errorMessages(errors)
                .build();
    }
}
