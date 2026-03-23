package com.certiflow.apprenant.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VerificationDTO {
    private String learnerName;
    private String trainerName;
    private String courseName;
    private Integer score;
    private String completionDate;
    private boolean valid;
    private String errorMessage;
}
