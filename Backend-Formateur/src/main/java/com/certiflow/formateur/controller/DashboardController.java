package com.certiflow.formateur.controller;

import com.certiflow.formateur.dto.DashboardStats;
import com.certiflow.formateur.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/stats")
    public ResponseEntity<DashboardStats> getStats(Authentication auth) {
        String email = auth.getName();
        return ResponseEntity.ok(dashboardService.getTrainerStats(email));
    }

    @GetMapping("/course-statistics")
    public ResponseEntity<com.certiflow.formateur.dto.CourseStatisticsDTO> getCourseStatistics(Authentication auth) {
        String email = auth.getName();
        return ResponseEntity.ok(dashboardService.getDetailedCourseStats(email));
    }

    @GetMapping("/learner-statistics")
    public ResponseEntity<java.util.List<com.certiflow.formateur.dto.LearnerStatItemDTO>> getLearnerStatistics(Authentication auth) {
        String email = auth.getName();
        return ResponseEntity.ok(dashboardService.getLearnerStatistics(email));
    }

    @GetMapping("/quiz-statistics")
    public ResponseEntity<com.certiflow.formateur.dto.QuizStatisticsDTO> getQuizStatistics(Authentication auth) {
        String email = auth.getName();
        return ResponseEntity.ok(dashboardService.getQuizStatistics(email));
    }
}
