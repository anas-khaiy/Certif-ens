package com.certiflow.formateur.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuizStatisticsDTO {
    private int totalCompleted;
    private double successRate;
    private double averageScore;
    private List<QuizStatItemDTO> recentResults;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class QuizStatItemDTO {
        private Long id;
        private String learner;
        private String quizName;
        private int score;
        private String date;
        private String status;
    }
}
