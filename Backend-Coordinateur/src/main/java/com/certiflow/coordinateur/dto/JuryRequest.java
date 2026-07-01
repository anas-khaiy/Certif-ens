package com.certiflow.coordinateur.dto;

import java.util.List;
import lombok.Data;

@Data
public class JuryRequest {
    private List<Long> examinateursIds;
    private List<Long> rapporteursIds;
    private List<Long> examinateursExternesIds;
    private List<Long> rapporteursExternesIds;
    private java.time.LocalDateTime dateSoutenance;
}
