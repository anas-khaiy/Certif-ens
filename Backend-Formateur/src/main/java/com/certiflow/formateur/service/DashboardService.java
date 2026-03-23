package com.certiflow.formateur.service;

import com.certiflow.formateur.dto.DashboardStats;
import com.certiflow.formateur.dto.CourseStatisticsDTO;
import com.certiflow.formateur.model.*;
import com.certiflow.formateur.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.format.TextStyle;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final CourseRepository courseRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final QuizResultRepository quizResultRepository;
    private final CourseProgressRepository courseProgressRepository;

    public DashboardStats getTrainerStats(String trainerEmail) {
        List<Course> trainerCourses = courseRepository.findByEnseignantEmailOrderByUpdatedAtDesc(trainerEmail);
        List<Long> courseIds = trainerCourses.stream().map(Course::getId).collect(Collectors.toList());

        long totalCourses = trainerCourses.size();
        long totalLearners = enrollmentRepository.findByCourseEnseignantEmailAndStatus(trainerEmail, EnrollmentStatus.ACCEPTED)
                .stream().map(enrollment -> enrollment.getApprenant().getId()).distinct().count();

        Map<Long, Long> courseTotalItems = new HashMap<>();
        Map<Long, String> courseFinalExamIds = new HashMap<>();
        for (Course course : trainerCourses) {
            long subSectionsCount = course.getSections() != null ? course.getSections().stream()
                    .filter(s -> s != null && s.getSubSections() != null)
                    .flatMap(s -> s.getSubSections().stream())
                    .count() : 0;
            boolean examEnabled = course.getFinalExam() != null && course.getExamEnabled() != Boolean.FALSE;
            courseTotalItems.put(course.getId(), subSectionsCount + (examEnabled ? 1 : 0));
            if (examEnabled) courseFinalExamIds.put(course.getId(), course.getFinalExam().getId().toString());
        }

        List<QuizResult> allResults = new ArrayList<>();
        for (Long courseId : courseIds) allResults.addAll(quizResultRepository.findByCourseId(courseId));
        
        List<com.certiflow.formateur.model.Enrollment> acceptedEnrollments = enrollmentRepository.findByCourseEnseignantEmailAndStatus(trainerEmail, EnrollmentStatus.ACCEPTED);
        List<com.certiflow.formateur.model.Enrollment> allEnrollments = enrollmentRepository.findByCourseEnseignantEmail(trainerEmail);

        long totalCertifications = 0;
        Map<String, Integer> certsByMonth = new HashMap<>();
        for (com.certiflow.formateur.model.Enrollment enrollment : acceptedEnrollments) {
            Long apprenantId = enrollment.getApprenant().getId();
            Course course = enrollment.getCourse();
            Long courseId = course.getId();
            Set<String> subIds = new HashSet<>();
            if (course.getSections() != null) course.getSections().stream().filter(s -> s != null && s.getSubSections() != null).flatMap(s -> s.getSubSections().stream()).forEach(ss -> subIds.add(String.valueOf(ss.getId())));
            boolean examEnabled = course.getFinalExam() != null && course.getExamEnabled() != Boolean.FALSE;
            long totalItems = subIds.size() + (examEnabled ? 1 : 0);
            if (totalItems == 0) continue;

            long completed = 0;
            Optional<CourseProgress> prog = courseProgressRepository.findByApprenantIdAndCourseId(apprenantId, courseId).stream().findFirst();
            if (prog.isPresent() && prog.get().getCompletedSubSectionIds() != null) {
                completed = Arrays.stream(prog.get().getCompletedSubSectionIds().split(",")).map(String::trim).filter(id -> !id.isEmpty() && subIds.contains(id)).distinct().count();
            }
            String feId = (course.getFinalExam() != null) ? course.getFinalExam().getId().toString() : null;
            Optional<QuizResult> eRes = allResults.stream().filter(r -> r.getApprenantId().equals(apprenantId) && r.getCourseId().equals(courseId)).filter(r -> ("final_exam".equals(r.getQuizId()) || (feId != null && feId.equals(r.getQuizId())))).filter(r -> Boolean.TRUE.equals(r.getPassed())).max(Comparator.comparing(QuizResult::getAttemptedAt));
            if (eRes.isPresent() && examEnabled) completed += 1;
            if (completed >= totalItems) {
                totalCertifications++;
                java.time.LocalDateTime date = eRes.isPresent() ? eRes.get().getAttemptedAt() : (enrollment.getProcessedAt() != null ? enrollment.getProcessedAt() : enrollment.getRequestedAt());
                if (date != null) certsByMonth.merge(date.getYear() + "-" + String.format("%02d", date.getMonthValue()), 1, (v1, v2) -> v1 + v2);
            }
        }

        List<DashboardStats.PieChartData> courseData = new ArrayList<>();
        Map<String, Long> studentsPerCourse = acceptedEnrollments.stream().collect(Collectors.groupingBy(e -> e.getCourse().getTitle(), Collectors.counting()));
        for (Map.Entry<String, Long> entry : studentsPerCourse.entrySet()) {
            courseData.add(new DashboardStats.PieChartData(entry.getKey(), entry.getValue()));
        }
        if (courseData.isEmpty() && totalCourses > 0) courseData.add(new DashboardStats.PieChartData("Aucun apprenant", 1));


        List<DashboardStats.MonthlyData> monthlyData = new ArrayList<>();
        java.time.LocalDateTime now = java.time.LocalDateTime.now();
        for (int i = 5; i >= 0; i--) {
            java.time.LocalDateTime mStart = now.minusMonths(i).withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0).withNano(0);
            String mName = mStart.getMonth().getDisplayName(TextStyle.SHORT, Locale.FRENCH);
            mName = mName.substring(0, 1).toUpperCase() + mName.substring(1);
            int certs = certsByMonth.getOrDefault(mStart.getYear() + "-" + String.format("%02d", mStart.getMonthValue()), 0);
            long learners = allEnrollments.stream().filter(e -> e.getRequestedAt() != null && !e.getRequestedAt().isBefore(mStart) && e.getRequestedAt().isBefore(mStart.plusMonths(1))).count();
            monthlyData.add(new DashboardStats.MonthlyData(mName, certs, (int) learners));
        }

        double avg = allResults.stream().mapToInt(r -> r.getScore() != null ? r.getScore() : 0).average().orElse(0.0);
        return DashboardStats.builder().totalCourses(totalCourses).totalLearners(totalLearners).totalQuizzesCompleted(allResults.size()).totalCertifications(totalCertifications).averageScore(allResults.isEmpty() ? 0.0 : Math.round(avg * 10.0) / 10.0).monthlyCertifications(monthlyData).courseStudentsDistribution(courseData).build();
    }

    public CourseStatisticsDTO getDetailedCourseStats(String trainerEmail) {
        List<Course> trainerCourses = courseRepository.findByEnseignantEmailOrderByUpdatedAtDesc(trainerEmail);
        List<com.certiflow.formateur.model.Enrollment> acceptedEnrollments = enrollmentRepository.findByCourseEnseignantEmailAndStatus(trainerEmail, EnrollmentStatus.ACCEPTED);
        
        List<CourseStatisticsDTO.CourseEngagement> engagements = new ArrayList<>();
        Map<Long, Integer> learnerCertCount = new HashMap<>(); // LearnerID -> Count of 100% courses
        Map<Long, String> learnerNames = new HashMap<>();

        Map<Long, Double> learnerSumProgressMap = new HashMap<>();
        Map<Long, Integer> learnerCourseCountMap = new HashMap<>();

        long globalCertifications = 0;
        double sumProgress = 0;
        int totalEnrollmentsUsedForAvg = 0;

        for (Course course : trainerCourses) {
            List<com.certiflow.formateur.model.Enrollment> courseEnrollments = acceptedEnrollments.stream()
                    .filter(e -> e.getCourse().getId().equals(course.getId()))
                    .collect(Collectors.toList());

            if (courseEnrollments.isEmpty()) {
                engagements.add(new CourseStatisticsDTO.CourseEngagement(course.getTitle(), 0, 0, 0));
                continue;
            }

            Set<String> subIds = new HashSet<>();
            if (course.getSections() != null) course.getSections().stream().filter(s -> s != null && s.getSubSections() != null).flatMap(s -> s.getSubSections().stream()).forEach(ss -> subIds.add(String.valueOf(ss.getId())));
            boolean examEnabled = course.getFinalExam() != null && course.getExamEnabled() != Boolean.FALSE;
            long totalItems = subIds.size() + (examEnabled ? 1 : 0);
            String feId = (course.getFinalExam() != null) ? course.getFinalExam().getId().toString() : null;

            long courseCerts = 0;
            double courseSumProgress = 0;

            for (com.certiflow.formateur.model.Enrollment enrollment : courseEnrollments) {
                Long apprenantId = enrollment.getApprenant().getId();
                learnerNames.put(apprenantId, enrollment.getApprenant().getNom() + " " + enrollment.getApprenant().getPrenom());
                
                long comp = 0;
                Optional<CourseProgress> prog = courseProgressRepository.findByApprenantIdAndCourseId(apprenantId, course.getId()).stream().findFirst();
                if (prog.isPresent() && prog.get().getCompletedSubSectionIds() != null) {
                    comp = Arrays.stream(prog.get().getCompletedSubSectionIds().split(",")).map(String::trim).filter(id -> !id.isEmpty() && subIds.contains(id)).distinct().count();
                }

                boolean passed = quizResultRepository.findByCourseId(course.getId()).stream()
                        .filter(r -> r.getApprenantId().equals(apprenantId))
                        .filter(r -> ("final_exam".equals(r.getQuizId()) || (feId != null && feId.equals(r.getQuizId()))))
                        .anyMatch(r -> Boolean.TRUE.equals(r.getPassed()));

                if (passed && examEnabled) comp += 1;
                double pPerc = totalItems > 0 ? (comp * 100.0 / totalItems) : 0;
                courseSumProgress += pPerc;

                // Track per-learner global stats
                learnerSumProgressMap.merge(apprenantId, pPerc, (v1, v2) -> v1 + v2);
                learnerCourseCountMap.merge(apprenantId, 1, (v1, v2) -> v1 + v2);

                if (pPerc >= 100) { 
                    courseCerts++; 
                    globalCertifications++; 
                    learnerCertCount.merge(apprenantId, 1, (v1, v2) -> v1 + v2); 
                }
                sumProgress += pPerc; totalEnrollmentsUsedForAvg++;
            }

            engagements.add(new CourseStatisticsDTO.CourseEngagement(course.getTitle(), courseEnrollments.size(), (int) Math.round(courseSumProgress / courseEnrollments.size()), (int) Math.round(courseCerts * 100.0 / courseEnrollments.size())));
        }

        List<CourseStatisticsDTO.TopLearner> topLearners = learnerCourseCountMap.keySet().stream()
                .map(learnerId -> {
                    String name = learnerNames.getOrDefault(learnerId, "Apprenant " + learnerId);
                    String avatar = name.split(" ").length > 1 ? (name.split(" ")[0].charAt(0) + "" + name.split(" ")[1].charAt(0)) : name.substring(0, 2).toUpperCase();
                    int certs = learnerCertCount.getOrDefault(learnerId, 0);
                    double avgProgress = learnerSumProgressMap.getOrDefault(learnerId, 0.0) / learnerCourseCountMap.get(learnerId);
                    
                    return new CourseStatisticsDTO.TopLearner(
                        name,
                        (certs * 500) + " XP",
                        certs,
                        avatar,
                        (int) Math.round(avgProgress)
                    );
                })
                .sorted((l1, l2) -> {
                    int c = Integer.compare(l2.getAverageProgress(), l1.getAverageProgress());
                    if (c != 0) return c;
                    return Integer.compare(l2.getCoursesCount(), l1.getCoursesCount());
                })
                .limit(10)
                .collect(Collectors.toList());

        return CourseStatisticsDTO.builder()
                .totalLearners(acceptedEnrollments.stream().map(e -> e.getApprenant().getId()).distinct().count())
                .activeCourses(trainerCourses.stream().filter(Course::isPublished).count())
                .engagementRate(totalEnrollmentsUsedForAvg > 0 ? Math.round(sumProgress / totalEnrollmentsUsedForAvg * 10.0) / 10.0 : 0.0)
                .totalCertifications(globalCertifications)
                .courseEngagements(engagements)
                .topLearners(topLearners)
                .build();
    }

    public List<com.certiflow.formateur.dto.LearnerStatItemDTO> getLearnerStatistics(String trainerEmail) {
        List<Course> trainerCourses = courseRepository.findByEnseignantEmailOrderByUpdatedAtDesc(trainerEmail);
        List<com.certiflow.formateur.model.Enrollment> acceptedEnrollments = enrollmentRepository.findByCourseEnseignantEmailAndStatus(trainerEmail, EnrollmentStatus.ACCEPTED);
        
        // Learner aggregations
        Map<Long, com.certiflow.formateur.model.Apprenant> learners = new HashMap<>();
        Map<Long, Double> sumProgressMap = new HashMap<>();
        Map<Long, Integer> courseCountMap = new HashMap<>();
        Map<Long, Double> sumScoreMap = new HashMap<>();
        Map<Long, Integer> scoreCountMap = new HashMap<>();
        Map<Long, java.time.LocalDateTime> lastActiveMap = new HashMap<>();

        for (Course course : trainerCourses) {
            List<com.certiflow.formateur.model.Enrollment> courseEnrollments = acceptedEnrollments.stream()
                    .filter(e -> e.getCourse().getId().equals(course.getId()))
                    .collect(Collectors.toList());

            if (courseEnrollments.isEmpty()) continue;

            Set<String> subIds = new HashSet<>();
            if (course.getSections() != null) {
                course.getSections().stream()
                    .filter(s -> s != null && s.getSubSections() != null)
                    .flatMap(s -> s.getSubSections().stream())
                    .forEach(ss -> subIds.add(String.valueOf(ss.getId())));
            }
            boolean examEnabled = course.getFinalExam() != null && course.getExamEnabled() != Boolean.FALSE;
            long totalItems = subIds.size() + (examEnabled ? 1 : 0);
            String feId = (course.getFinalExam() != null) ? course.getFinalExam().getId().toString() : null;

            List<QuizResult> courseResults = quizResultRepository.findByCourseId(course.getId());

            for (com.certiflow.formateur.model.Enrollment enrollment : courseEnrollments) {
                Long apprenantId = enrollment.getApprenant().getId();
                learners.putIfAbsent(apprenantId, enrollment.getApprenant());

                // Calculate Progress
                long comp = 0;
                Optional<CourseProgress> prog = courseProgressRepository.findByApprenantIdAndCourseId(apprenantId, course.getId()).stream().findFirst();
                if (prog.isPresent() && prog.get().getCompletedSubSectionIds() != null) {
                    comp = Arrays.stream(prog.get().getCompletedSubSectionIds().split(",")).map(String::trim).filter(id -> !id.isEmpty() && subIds.contains(id)).distinct().count();
                }

                // Check Exam & Score
                List<QuizResult> learnerResults = courseResults.stream()
                        .filter(r -> r.getApprenantId().equals(apprenantId)).collect(Collectors.toList());
                
                boolean passedExam = learnerResults.stream()
                        .filter(r -> ("final_exam".equals(r.getQuizId()) || (feId != null && feId.equals(r.getQuizId()))))
                        .anyMatch(r -> Boolean.TRUE.equals(r.getPassed()));

                if (passedExam && examEnabled) comp += 1;
                
                double pPerc = totalItems > 0 ? (comp * 100.0 / totalItems) : 0;
                sumProgressMap.merge(apprenantId, pPerc, (v1, v2) -> v1 + v2);
                courseCountMap.merge(apprenantId, 1, (v1, v2) -> v1 + v2);

                // Average Score for this course
                double avgScore = learnerResults.stream().mapToInt(r -> r.getScore() != null ? r.getScore() : 0).average().orElse(-1.0);
                if (avgScore >= 0) {
                    sumScoreMap.merge(apprenantId, avgScore, (v1, v2) -> v1 + v2);
                    scoreCountMap.merge(apprenantId, 1, (v1, v2) -> v1 + v2);
                }

                // Last Active (Approximate with enrollment processing date or last quiz attempt)
                java.time.LocalDateTime lastActive = enrollment.getProcessedAt() != null ? enrollment.getProcessedAt() : enrollment.getRequestedAt();
                Optional<QuizResult> lastQuiz = learnerResults.stream().max(Comparator.comparing(QuizResult::getAttemptedAt));
                if (lastQuiz.isPresent()) {
                    if (lastActive == null || lastQuiz.get().getAttemptedAt().isAfter(lastActive)) {
                        lastActive = lastQuiz.get().getAttemptedAt();
                    }
                }
                if (lastActive != null) {
                    java.time.LocalDateTime currentMax = lastActiveMap.get(apprenantId);
                    if (currentMax == null || lastActive.isAfter(currentMax)) {
                        lastActiveMap.put(apprenantId, lastActive);
                    }
                }
            }
        }

        // Build result
        List<com.certiflow.formateur.dto.LearnerStatItemDTO> result = new ArrayList<>();
        for (com.certiflow.formateur.model.Apprenant apprenant : learners.values()) {
            Long id = apprenant.getId();
            int cCount = courseCountMap.getOrDefault(id, 1);
            int sCount = scoreCountMap.getOrDefault(id, 0);
            double avgProgress = sumProgressMap.getOrDefault(id, 0.0) / cCount;
            double avgScore = sCount > 0 ? sumScoreMap.getOrDefault(id, 0.0) / sCount : 0.0;
            
            String lastActiveStr = "Récemment";
            java.time.LocalDateTime date = lastActiveMap.get(id);
            if (date != null) {
                long days = java.time.Duration.between(date, java.time.LocalDateTime.now()).toDays();
                if (days == 0) lastActiveStr = "Aujourd'hui";
                else if (days == 1) lastActiveStr = "Hier";
                else if (days < 7) lastActiveStr = "Il y a " + days + " jours";
                else if (days < 30) lastActiveStr = "Il y a " + (days / 7) + " semaine(s)";
                else lastActiveStr = "Actif ce mois";
            }

            result.add(com.certiflow.formateur.dto.LearnerStatItemDTO.builder()
                .id(id)
                .name(apprenant.getNom() + " " + apprenant.getPrenom())
                .email(apprenant.getEmail())
                .status("Actif")
                .progress((int) Math.round(avgProgress))
                .score((int) Math.round(avgScore))
                .lastActive(lastActiveStr)
                .build());
        }

        return result.stream()
                .sorted((l1, l2) -> Integer.compare(l2.getProgress(), l1.getProgress()))
                .collect(Collectors.toList());
    }

    public com.certiflow.formateur.dto.QuizStatisticsDTO getQuizStatistics(String trainerEmail) {
        List<Course> trainerCourses = courseRepository.findByEnseignantEmailOrderByUpdatedAtDesc(trainerEmail);
        List<com.certiflow.formateur.model.Enrollment> acceptedEnrollments = enrollmentRepository.findByCourseEnseignantEmailAndStatus(trainerEmail, EnrollmentStatus.ACCEPTED);
        
        Map<Long, com.certiflow.formateur.model.Apprenant> apprenants = new HashMap<>();
        acceptedEnrollments.forEach(e -> apprenants.put(e.getApprenant().getId(), e.getApprenant()));

        List<QuizResult> allResults = new ArrayList<>();
        Map<Long, Course> courseMap = new HashMap<>();
        
        for (Course c : trainerCourses) {
            courseMap.put(c.getId(), c);
            allResults.addAll(quizResultRepository.findByCourseId(c.getId()));
        }

        int totalCompleted = allResults.size();
        long successCount = allResults.stream().filter(r -> Boolean.TRUE.equals(r.getPassed())).count();
        double successRate = totalCompleted > 0 ? (successCount * 100.0 / totalCompleted) : 0.0;
        double avgScore = allResults.stream().mapToInt(r -> r.getScore() != null ? r.getScore() : 0).average().orElse(0.0);

        List<com.certiflow.formateur.dto.QuizStatisticsDTO.QuizStatItemDTO> items = new ArrayList<>();
        allResults.sort(Comparator.comparing(QuizResult::getAttemptedAt).reversed());
        
        long idCounter = 1;
        for (QuizResult r : allResults) {
            com.certiflow.formateur.model.Apprenant app = apprenants.get(r.getApprenantId());
            if (app == null) continue;
            
            Course c = courseMap.get(r.getCourseId());
            String quizName = "Quiz Inconnu";
            if (c != null) {
                String feId = (c.getFinalExam() != null) ? c.getFinalExam().getId().toString() : null;
                if ("final_exam".equals(r.getQuizId()) || (feId != null && feId.equals(r.getQuizId()))) {
                    quizName = "Examen Final: " + c.getTitle();
                } else if (c.getSections() != null) {
                    // Try to find section name
                    for (var sec : c.getSections()) {
                        if (sec.getSubSections() != null) {
                            for (var subsec : sec.getSubSections()) {
                                if (subsec.getQuiz() != null && String.valueOf(subsec.getQuiz().getId()).equals(r.getQuizId())) {
                                    quizName = subsec.getTitle();
                                    break;
                                }
                            }
                        }
                    }
                }
            }

            String dateStr = "Récemment";
            if (r.getAttemptedAt() != null) {
                long days = java.time.Duration.between(r.getAttemptedAt(), java.time.LocalDateTime.now()).toDays();
                if (days == 0) dateStr = "Aujourd'hui";
                else if (days == 1) dateStr = "Hier";
                else if (days < 7) dateStr = "Il y a " + days + " jours";
                else dateStr = "Il y a " + (days / 7) + " semaine(s)";
            }

            items.add(com.certiflow.formateur.dto.QuizStatisticsDTO.QuizStatItemDTO.builder()
                .id(idCounter++)
                .learner(app.getNom() + " " + app.getPrenom())
                .quizName(quizName)
                .score(r.getScore() != null ? r.getScore() : 0)
                .date(dateStr)
                .status(Boolean.TRUE.equals(r.getPassed()) ? "Réussi" : "Échoué")
                .build());
        }

        return com.certiflow.formateur.dto.QuizStatisticsDTO.builder()
            .totalCompleted(totalCompleted)
            .successRate(Math.round(successRate * 10.0) / 10.0)
            .averageScore(Math.round(avgScore * 10.0) / 10.0)
            .recentResults(items)
            .build();
    }
}
