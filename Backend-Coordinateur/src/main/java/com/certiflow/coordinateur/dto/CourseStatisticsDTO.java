package com.certiflow.coordinateur.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CourseStatisticsDTO {
    private long totalLearners;
    private long activeCourses;
    private double engagementRate;
    private long totalCertifications;

    private List<CourseEngagement> courseEngagements;
    private List<TopLearner> topLearners;

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class CourseEngagement {
        private String name;
        private int learners;
        private int progress;
        private int success;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class TopLearner {
        private String name;
        private String xp;
        private int coursesCount;
        private String avatar;
        private int averageProgress;
    }
}
