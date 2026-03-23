package com.certiflow.formateur.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LearnerStatItemDTO {
    private Long id;
    private String name;
    private String email;
    private String status;
    private int progress;
    private int score;
    private String lastActive;
}
