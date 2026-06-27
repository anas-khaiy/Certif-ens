package com.certiflow.apprenant.service;

import com.certiflow.apprenant.dto.MonPfeDto;
import com.certiflow.apprenant.model.Apprenant;
import com.certiflow.apprenant.model.CoordinateurSetting;
import com.certiflow.apprenant.model.DepotPfe;
import com.certiflow.apprenant.repository.ApprenantRepository;
import com.certiflow.apprenant.repository.CoordinateurSettingRepository;
import com.certiflow.apprenant.repository.DepotPfeRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class MonPfeService {

    private final ApprenantRepository apprenantRepository;
    private final DepotPfeRepository depotPfeRepository;
    private final CoordinateurSettingRepository coordinateurSettingRepository;
    private final com.certiflow.apprenant.repository.RemarqueDepotRepository remarqueDepotRepository;

    @Value("${app.upload.dir:uploads/pfe}")
    private String uploadDir;

    public MonPfeService(ApprenantRepository apprenantRepository,
                         DepotPfeRepository depotPfeRepository,
                         CoordinateurSettingRepository coordinateurSettingRepository,
                         com.certiflow.apprenant.repository.RemarqueDepotRepository remarqueDepotRepository) {
        this.apprenantRepository = apprenantRepository;
        this.depotPfeRepository = depotPfeRepository;
        this.coordinateurSettingRepository = coordinateurSettingRepository;
        this.remarqueDepotRepository = remarqueDepotRepository;
    }

    private Map<String, String> getDeadlinesForApprenant(Apprenant apprenant) {
        if (apprenant.getCoordinateurId() == null) {
            return new HashMap<>();
        }
        return coordinateurSettingRepository.findByCoordinateurId(apprenant.getCoordinateurId()).stream()
                .collect(Collectors.toMap(CoordinateurSetting::getSettingKey, CoordinateurSetting::getSettingValue));
    }

    public MonPfeDto getMonPfeDetails(String email) {
        Apprenant apprenant = apprenantRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Apprenant introuvable"));

        Map<String, String> deadlines = getDeadlinesForApprenant(apprenant);

        // Fetch depots
        List<DepotPfe> depotsList = depotPfeRepository.findByApprenantId(apprenant.getId());
        Map<String, MonPfeDto.DepotDto> depotsMap = new HashMap<>();
        for (DepotPfe depot : depotsList) {
            List<com.certiflow.apprenant.model.RemarqueDepot> remarques = remarqueDepotRepository.findByDepotPfeId(depot.getId());
            List<MonPfeDto.RemarqueDto> remarqueDtos = remarques.stream().map(r -> 
                MonPfeDto.RemarqueDto.builder()
                    .enseignantNom(r.getEnseignant().getPrenom() + " " + r.getEnseignant().getNom())
                    .commentaire(r.getCommentaire())
                    .dateRemarque(r.getDateRemarque())
                    .build()
            ).collect(Collectors.toList());

            depotsMap.put(depot.getTypeDepot(), MonPfeDto.DepotDto.builder()
                    .fichierUrl(depot.getFichierUrl())
                    .dateDepot(depot.getDateDepot())
                    .remarques(remarqueDtos)
                    .statut(depot.getStatut())
                    .build());
        }

        MonPfeDto.MonPfeDtoBuilder builder = MonPfeDto.builder()
                .dateSoutenance(apprenant.getDateSoutenance())
                .deadlines(deadlines)
                .depots(depotsMap);

        if (apprenant.getSujetDetails() != null) {
            builder.sujetTitre(apprenant.getSujetDetails().getTitre())
                   .sujetDescription(apprenant.getSujetDetails().getDescription())
                   .objectifs(apprenant.getSujetDetails().getObjectifs());
        }

        if (apprenant.getEncadrant() != null) {
            builder.encadrant(MonPfeDto.EnseignantDto.builder()
                    .nom(apprenant.getEncadrant().getNom())
                    .prenom(apprenant.getEncadrant().getPrenom())
                    .email(apprenant.getEncadrant().getEmail())
                    .build());
        }

        if (apprenant.getExaminateurs() != null) {
            builder.examinateurs(apprenant.getExaminateurs().stream()
                    .map(e -> MonPfeDto.EnseignantDto.builder()
                            .nom(e.getNom())
                            .prenom(e.getPrenom())
                            .email(e.getEmail())
                            .build())
                    .collect(Collectors.toList()));
        }

        if (apprenant.getRapporteurs() != null) {
            builder.rapporteurs(apprenant.getRapporteurs().stream()
                    .map(e -> MonPfeDto.EnseignantDto.builder()
                            .nom(e.getNom())
                            .prenom(e.getPrenom())
                            .email(e.getEmail())
                            .build())
                    .collect(Collectors.toList()));
        }

        return builder.build();
    }

    public void uploadDepot(String email, String typeDepot, MultipartFile file) throws IOException {
        Apprenant apprenant = apprenantRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Apprenant introuvable"));

        Optional<DepotPfe> existingDepot = depotPfeRepository.findByApprenantIdAndTypeDepot(apprenant.getId(), typeDepot);
        if (existingDepot.isPresent()) {
            // Autoriser le re-upload pour DEPOT_1 si le dépôt a été refusé
            if ("DEPOT_1".equals(typeDepot) && "REFUSE".equals(existingDepot.get().getStatut())) {
                depotPfeRepository.delete(existingDepot.get());
            } else {
                throw new RuntimeException("Vous avez déjà effectué ce dépôt.");
            }
        }

        // Verify if enabled (per-coordinator)
        Map<String, String> deadlines = getDeadlinesForApprenant(apprenant);
        String enabledKey = "DEADLINE_" + typeDepot + "_ENABLED";
        String enabledValue = deadlines.get(enabledKey);
        if (enabledValue == null || !"true".equals(enabledValue)) {
            throw new RuntimeException("Ce dépôt n'est pas actuellement autorisé.");
        }

        // Verify if deadline passed (per-coordinator)
        String dateKey = "DEADLINE_" + typeDepot;
        String dateValue = deadlines.get(dateKey);
        if (dateValue != null && !dateValue.isEmpty()) {
            LocalDateTime deadline = LocalDateTime.parse(dateValue);
            if (LocalDateTime.now().isAfter(deadline)) {
                throw new RuntimeException("La date limite pour ce dépôt est dépassée.");
            }
        }

        File directory = new File(uploadDir);
        if (!directory.exists()) {
            directory.mkdirs();
        }

        String filename = UUID.randomUUID().toString() + "_" + file.getOriginalFilename();
        Path filePath = Paths.get(uploadDir, filename);
        Files.copy(file.getInputStream(), filePath);

        DepotPfe depot = DepotPfe.builder()
                .apprenant(apprenant)
                .typeDepot(typeDepot)
                .fichierUrl(filename)
                .dateDepot(LocalDateTime.now())
                .build();

        depotPfeRepository.save(depot);
    }
}
