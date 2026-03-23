package com.certiflow.apprenant.service;

import com.certiflow.apprenant.dto.DashboardDTO;
import com.certiflow.apprenant.model.*;
import com.certiflow.apprenant.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService {
    private final EnrollmentRepository enrollmentRepository;
    private final QuizResultRepository quizResultRepository;
    private final CourseProgressRepository courseProgressRepository;
    private final ApprenantRepository apprenantRepository;
    private final CourseRepository courseRepository;

    public DashboardDTO getDashboardData(String email) {
        Apprenant apprenant = apprenantRepository.findByEmail(email).stream().findFirst()
                .orElseThrow(() -> new RuntimeException("Apprenant not found"));
        Long apprenantId = apprenant.getId();

        List<Enrollment> enrollments = enrollmentRepository.findByApprenantEmail(email);
        List<Enrollment> acceptedEnrollments = enrollments.stream()
                .filter(e -> e.getStatus() == EnrollmentStatus.ACCEPTED)
                .collect(Collectors.toList());

        // Calculate counts based on all accepted and published enrollments (to match UI cards)
        long enrolledCount = 0;
        long completedCount = 0;
        long inProgressCount = 0;
        // Best score per quiz calculation for a fairer average
        java.util.Map<String, Double> bestScoresPerQuiz = new java.util.HashMap<>();

        List<DashboardDTO.ActiveCourseDTO> allCourseDTOs = new ArrayList<>();
        List<DashboardDTO.CourseProgressDataDTO> progressChartData = new ArrayList<>();

        for (Enrollment e : acceptedEnrollments) {
            Course course = e.getCourse();
            if (course == null || course.getId() == null || !course.isPublished()) continue;
            
            enrolledCount++;
            
            List<QuizResult> results = quizResultRepository.findByApprenantIdAndCourseId(apprenantId, course.getId());
            
            // Collect best scores for this course's quizzes
            for (QuizResult r : results) {
                if (r.getQuizId() != null && r.getScore() != null) {
                    Double currentScore = r.getScore().doubleValue();
                    bestScoresPerQuiz.merge(r.getQuizId(), currentScore, (v1, v2) -> v1 > v2 ? v1 : v2);
                }
            }
            
            // Progress calculation synced with EnrolledCoursesPage.tsx
            CourseProgress progress = courseProgressRepository.findAllByApprenantIdAndCourseId(apprenantId, course.getId()).stream()
                    .findFirst()
                    .orElse(null);
            
            int progressPercent = 0;
            long totalSectionsCount = course.getSections() != null ? course.getSections().stream()
                    .filter(s -> s != null && s.getSubSections() != null)
                    .flatMap(s -> s.getSubSections().stream())
                    .count() : 0;
            
            // Sync logic with frontend: Add 1 to total if exam enabled (default is true if not explicitly false)
            long totalItems = totalSectionsCount;
            if (course.getFinalExam() != null && course.getExamEnabled() != Boolean.FALSE) {
                totalItems += 1;
            }

            long completedItems = 0;
            java.util.Set<String> allSubSectionIds = new java.util.HashSet<>();
            if (course.getSections() != null) {
                course.getSections().stream()
                    .filter(s -> s != null && s.getSubSections() != null)
                    .flatMap(s -> s.getSubSections().stream())
                    .forEach(ss -> allSubSectionIds.add(String.valueOf(ss.getId())));
            }

            if (progress != null && progress.getCompletedSubSectionIds() != null) {
                java.util.Set<String> completedIds = java.util.Arrays.stream(progress.getCompletedSubSectionIds().split(","))
                    .filter(id -> id != null && !id.trim().isEmpty())
                    .map(String::trim)
                    .filter(allSubSectionIds::contains)
                    .collect(Collectors.toSet());
                completedItems = completedIds.size();
            }

            // Check if exam passed
            boolean examPassed = results.stream()
                .anyMatch(r -> ("final_exam".equals(r.getQuizId()) || (course.getFinalExam() != null && String.valueOf(course.getFinalExam().getId()).equals(r.getQuizId()))) 
                          && Boolean.TRUE.equals(r.getPassed()));

            if (examPassed && course.getExamEnabled() != Boolean.FALSE && course.getFinalExam() != null) {
                completedItems += 1;
            }

            if (totalItems > 0) {
                progressPercent = (int) Math.min(100, Math.round((completedItems * 100.0) / totalItems));
            }

            // Add to progress chart data
            progressChartData.add(DashboardDTO.CourseProgressDataDTO.builder()
                    .courseTitle(course.getTitle())
                    .progress(progressPercent)
                    .build());

            // A course is completed if progress is 100%
            boolean finished = (progressPercent >= 100);

            if (finished) {
                completedCount++;
            } else {
                inProgressCount++;
                allCourseDTOs.add(DashboardDTO.ActiveCourseDTO.builder()
                        .id(course.getId())
                        .title(course.getTitle())
                        .progress(progressPercent)
                        .lastAccessed("Récemment")
                        .coverImage(course.getCoverImage())
                        .build());
            }
        }

        double averageScore = 0;
        if (!bestScoresPerQuiz.isEmpty()) {
            double sumBest = bestScoresPerQuiz.values().stream().mapToDouble(Double::doubleValue).sum();
            averageScore = sumBest / bestScoresPerQuiz.size();
        }

        // Limit active courses to top 4 to keep dashboard informative but clean
        List<DashboardDTO.ActiveCourseDTO> limitedActiveCourses = allCourseDTOs.stream()
                .limit(4)
                .collect(Collectors.toList());

        // Recent Activities
        List<QuizResult> allResults = quizResultRepository.findByApprenantId(apprenantId);
        List<DashboardDTO.RecentActivityDTO> recentActivities = allResults.stream()
                .filter(r -> r != null && r.getAttemptedAt() != null)
                .sorted((r1, r2) -> r2.getAttemptedAt().compareTo(r1.getAttemptedAt()))
                .limit(5)
                .map(r -> {
                    Course course = null;
                    Long cid = r.getCourseId();
                    if (cid != null) {
                         course = courseRepository.findById(cid).orElse(null);
                    }
                    String courseTitle = course != null ? course.getTitle() : "Cours inconnu";
                    String activityTitle = "final_exam".equals(r.getQuizId()) ? "Examen Final: " + courseTitle : "Quiz: " + courseTitle;
                    
                    return DashboardDTO.RecentActivityDTO.builder()
                            .type("quiz")
                            .title(activityTitle)
                            .result((r.getScore() != null ? r.getScore() : 0) + "%")
                            .date(r.getAttemptedAt() != null ? r.getAttemptedAt().toString() : "")
                            .build();
                })
                .collect(Collectors.toList());

        return DashboardDTO.builder()
                .enrolledCoursesCount(enrolledCount)
                .completedCoursesCount(completedCount)
                .inProgressCoursesCount(inProgressCount)
                .averageScore(Math.round(averageScore * 10.0) / 10.0)
                .activeCourses(limitedActiveCourses)
                .recentActivities(recentActivities)
                .courseProgressData(progressChartData)
                .build();
    }
}
