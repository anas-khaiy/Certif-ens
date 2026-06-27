package com.certiflow.coordinateur.dto;

import java.util.List;
import lombok.Data;

@Data
public class JuryRequest {
    private List<Long> examinateursIds;
    private List<Long> rapporteursIds;
    private java.time.LocalDateTime dateSoutenance;
}
