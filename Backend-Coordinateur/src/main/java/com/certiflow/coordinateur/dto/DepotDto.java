package com.certiflow.coordinateur.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class DepotDto {
    private Long id;
    private String nomApprenant;
    private String prenomApprenant;
    private String specialiteApprenant;
    private String sujetTitre;
    private String typeDepot;
    private String fichierUrl;
    private LocalDateTime dateDepot;
}
