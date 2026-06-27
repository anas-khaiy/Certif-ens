package com.certiflow.coordinateur.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VerificationDTO {
    private String learnerName;
    private String trainerName;
    private String courseName;
    private Integer score;
    private String completionDate;
    private String type; // "COURSE" or "BUNDLE"
    private boolean valid;
    private String errorMessage;
}
