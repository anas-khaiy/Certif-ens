package com.certiflow.formateur.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SuiviApprenantDto {
    private Long id;
    private String nom;
    private String prenom;
    private String email;
    private String specialite;
    
    // Sujet details
    private String sujetTitre;
    private String sujetDescription;
    private List<String> objectifs;
    
    private LocalDateTime dateSoutenance;
    
    // Roles
    private boolean isEncadrant;
    private boolean isExaminateur;
    private boolean isRapporteur;
    
    // Depots
    private List<DepotPfeDto> depots;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DepotPfeDto {
        private Long id;
        private String typeDepot;
        private String fichierUrl;
        private LocalDateTime dateDepot;
        private List<RemarqueDto> remarques;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RemarqueDto {
        private Long id;
        private String enseignantNom;
        private String commentaire;
        private LocalDateTime dateRemarque;
    }
}
