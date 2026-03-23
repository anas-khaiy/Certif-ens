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
public class DashboardStats {
    private long totalCourses;
    private long totalLearners;
    private long totalQuizzesCompleted;
    private long totalCertifications;
    private double averageScore;
    
    // For the charts
    private List<MonthlyData> monthlyCertifications;
    private List<PieChartData> courseStudentsDistribution;

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class MonthlyData {
        private String month;
        private int certs;
        private int learners;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class PieChartData {
        private String name;
        private long value;
    }
}
