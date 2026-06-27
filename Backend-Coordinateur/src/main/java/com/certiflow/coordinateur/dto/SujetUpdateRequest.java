package com.certiflow.coordinateur.dto;

import lombok.Data;
import java.util.List;

@Data
public class SujetUpdateRequest {
    private String titre;
    private String description;
    private List<String> objectifs;
}
