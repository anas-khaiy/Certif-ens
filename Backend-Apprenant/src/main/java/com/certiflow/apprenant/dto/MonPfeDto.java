package com.certiflow.apprenant.dto;

import com.certiflow.apprenant.model.Apprenant;
import com.certiflow.apprenant.model.DepotPfe;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Data
@Builder
public class MonPfeDto {
    private String sujetTitre;
    private String sujetDescription;
    private List<String> objectifs;
    private LocalDateTime dateSoutenance;

    private EnseignantDto encadrant;
    private List<EnseignantDto> examinateurs;
    private List<EnseignantDto> rapporteurs;

    private Map<String, String> deadlines;
    private Map<String, DepotDto> depots;

    @Data
    @Builder
    public static class EnseignantDto {
        private String nom;
        private String prenom;
        private String email;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DepotDto {
        private String fichierUrl;
        private java.time.LocalDateTime dateDepot;
        private java.util.List<RemarqueDto> remarques;
        private String statut;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RemarqueDto {
        private String enseignantNom;
        private String commentaire;
        private java.time.LocalDateTime dateRemarque;
    }
}
