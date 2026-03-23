package com.certiflow.formateur.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ImportResponse {
    private int totalAttempted;
    private int successCount;
    private int failureCount;
    private List<String> errorMessages;
}
