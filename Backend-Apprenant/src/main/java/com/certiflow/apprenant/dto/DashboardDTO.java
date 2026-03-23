package com.certiflow.apprenant.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardDTO {
    private long enrolledCoursesCount;
    private long completedCoursesCount;
    private long inProgressCoursesCount;
    private double averageScore;
    private List<ActiveCourseDTO> activeCourses;
    private List<RecentActivityDTO> recentActivities;
    private List<CourseProgressDataDTO> courseProgressData;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CourseProgressDataDTO {
        private String courseTitle;
        private double progress;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ActiveCourseDTO {
        private Long id;
        private String title;
        private int progress;
        private String lastAccessed;
        private String coverImage;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RecentActivityDTO {
        private String type; // 'quiz', 'course', 'module'
        private String title;
        private String result;
        private String date;
    }
}
