package com.certiflow.formateur.service;

import com.certiflow.formateur.model.*;
import com.certiflow.formateur.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
public class BundleAdminService {

    private final BundleRepository bundleRepository;
    private final BundleEnrollmentRepository enrollmentRepository;
    private final SpecialiteRepository specialiteRepository;
    private final CourseRepository courseRepository;
    private final CourseProgressRepository progressRepository;
    private final EnseignantRepository enseignantRepository;
    private final ApprenantRepository apprenantRepository;
    private final QuizResultRepository quizResultRepository;

    public BundleAdminService(BundleRepository bundleRepository,
                              BundleEnrollmentRepository enrollmentRepository,
                              SpecialiteRepository specialiteRepository,
                              CourseRepository courseRepository,
                              CourseProgressRepository progressRepository,
                              EnseignantRepository enseignantRepository,
                              ApprenantRepository apprenantRepository,
                              QuizResultRepository quizResultRepository) {
        this.bundleRepository = bundleRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.specialiteRepository = specialiteRepository;
        this.courseRepository = courseRepository;
        this.progressRepository = progressRepository;
        this.enseignantRepository = enseignantRepository;
        this.apprenantRepository = apprenantRepository;
        this.quizResultRepository = quizResultRepository;
    }

    public List<Bundle> getAllBundles() {
        return bundleRepository.findAllByOrderByIdDesc();
    }

    public Bundle getBundleById(Long id) {
        return bundleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Bundle not found with id: " + id));
    }

    @Transactional
    public Bundle createBundle(Map<String, Object> payload, Long specialtyId) {
        Bundle bundle = new Bundle();
        bundle.setTitle((String) payload.get("title"));
        bundle.setDescription((String) payload.get("description"));
        bundle.setCoverImage((String) payload.get("coverImage"));
        
        if (payload.containsKey("published")) {
            bundle.setPublished((Boolean) payload.get("published"));
        }

        if (specialtyId != null) {
            specialiteRepository.findById(specialtyId).ifPresent(bundle::setSpecialite);
        }

        List<Map<String, Object>> coursesPayload = (List<Map<String, Object>>) payload.get("courses");
        if (coursesPayload != null) {
            for (Map<String, Object> cMap : coursesPayload) {
                // Ensure number parsing handles Integer and Long types from JSON mapping
                Number courseIdNum = (Number) cMap.get("id");
                if (courseIdNum != null) {
                    Long courseId = courseIdNum.longValue();
                    courseRepository.findById(courseId).ifPresent(course -> bundle.getCourses().add(course));
                }
            }
        }

        return bundleRepository.save(bundle);
    }
    @Transactional
    public Bundle updateBundle(Long id, Map<String, Object> payload, Long specialtyId) {
        Bundle bundle = bundleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Bundle not found with id: " + id));
        
        bundle.setTitle((String) payload.get("title"));
        bundle.setDescription((String) payload.get("description"));
        bundle.setCoverImage((String) payload.get("coverImage"));

        if (payload.containsKey("published")) {
            bundle.setPublished((Boolean) payload.get("published"));
        }

        if (specialtyId != null) {
            specialiteRepository.findById(specialtyId).ifPresent(bundle::setSpecialite);
        } else {
            bundle.setSpecialite(null);
        }

        bundle.getCourses().clear();
        List<Map<String, Object>> coursesPayload = (List<Map<String, Object>>) payload.get("courses");
        if (coursesPayload != null) {
            for (Map<String, Object> cMap : coursesPayload) {
                Number courseIdNum = (Number) cMap.get("id");
                if (courseIdNum != null) {
                    Long courseId = courseIdNum.longValue();
                    courseRepository.findById(courseId).ifPresent(course -> bundle.getCourses().add(course));
                }
            }
        }

        return bundleRepository.save(bundle);
    }
    @Transactional
    public void deleteBundle(Long id) {
        enrollmentRepository.deleteByBundleId(id);
        bundleRepository.deleteById(id);
    }

    public List<BundleEnrollment> getAllEnrollments() {
        return enrollmentRepository.findAll();
    }

    @Transactional
    public BundleEnrollment updateEnrollmentStatus(Long enrollmentId, String status) {
        BundleEnrollment enrollment = enrollmentRepository.findById(enrollmentId)
                .orElseThrow(() -> new RuntimeException("Enrollment not found"));
        enrollment.setStatus(BundleEnrollmentStatus.valueOf(status.toUpperCase()));
        return enrollmentRepository.save(enrollment);
    }

    public Map<String, Object> getBundleDetailedProgress(Long bundleId, String email) {
        // Check for accepted enrollment
        List<BundleEnrollment> enrollments = getUserEnrollments(email);
        boolean isAccepted = enrollments.stream()
                .anyMatch(e -> e.getBundleId().equals(bundleId) && e.getStatus() == BundleEnrollmentStatus.ACCEPTED);
        
        if (!isAccepted) {
            throw new RuntimeException("Accès refusé : Vous n'êtes pas inscrit à ce parcours ou votre demande est en attente.");
        }

        Bundle bundle = bundleRepository.findById(bundleId).orElse(null);
        if (bundle == null) return java.util.Collections.emptyMap();

        Long studentId = apprenantRepository.findByEmail(email.trim().toLowerCase())
                .map(Apprenant::getId)
                .orElse(null);

        Map<Long, Double> courseProgressMap = new java.util.HashMap<>();
        
        double totalProgressSum = 0.0;
        int courseCount = bundle.getCourses().size();

        for (Course course : bundle.getCourses()) {
            long totalCourseSubSections = 0;
            for (Section section : course.getSections()) {
                totalCourseSubSections += section.getSubSections().size();
            }
            
            // CRITICAL: INCLUDE FINAL EXAM IN PROGRESS
            boolean hasExam = course.getFinalExam() != null && course.getExamEnabled() != false;
            if (hasExam) {
                totalCourseSubSections++;
            }

            double courseProgressPercent = 0.0;
            if (studentId != null && totalCourseSubSections > 0) {
                List<CourseProgress> progressList = progressRepository.findByApprenantIdAndCourseId(studentId, course.getId());
                long completed = 0;
                
                if (!progressList.isEmpty()) {
                    CourseProgress progress = progressList.get(0);
                    if (progress.getCompletedSubSectionIds() != null && !progress.getCompletedSubSectionIds().isEmpty()) {
                        completed = progress.getCompletedSubSectionIds().split(",").length;
                    }
                }
                
                // CHECK IF FINAL EXAM IS PASSED
                if (hasExam) {
                    List<QuizResult> results = quizResultRepository.findByApprenantIdAndCourseId(studentId, course.getId());
                    int threshold = 70;
                    if (course.getFinalExam().getSettings() != null) {
                        threshold = course.getFinalExam().getSettings().getPassingScore();
                    }
                    
                    int finalThreshold = threshold;
                    boolean examPassed = results.stream()
                        .filter(r -> "final_exam".equals(r.getQuizId()) || (course.getFinalExam() != null && String.valueOf(course.getFinalExam().getId()).equals(r.getQuizId())))
                        .anyMatch(r -> r.getScore() != null && r.getScore() >= finalThreshold);
                    
                    if (examPassed) {
                        completed++;
                    }
                }
                
                courseProgressPercent = (double) completed / totalCourseSubSections * 100.0;
            }
            double finalCoursePercent = Math.min(100.0, courseProgressPercent);
            courseProgressMap.put(course.getId(), finalCoursePercent);
            totalProgressSum += finalCoursePercent;
        }

        double averageProgress = courseCount == 0 ? 0.0 : totalProgressSum / courseCount;

        Map<String, Object> result = new java.util.HashMap<>();
        result.put("bundleId", bundleId);
        result.put("totalProgress", Math.min(100.0, averageProgress));
        result.put("courseProgress", courseProgressMap);
        
        return result;
    }

    public Map<String, Object> getEnrollmentDetailedProgress(Long enrollmentId) {
        BundleEnrollment enrollment = enrollmentRepository.findById(enrollmentId).orElse(null);
        if (enrollment == null) return java.util.Collections.emptyMap();
        
        Bundle bundle = bundleRepository.findById(enrollment.getBundleId()).orElse(null);
        if (bundle == null) return java.util.Collections.emptyMap();

        String email = enrollment.getEnseignant() != null 
                        ? enrollment.getEnseignant().getEmail() 
                        : (enrollment.getApprenant() != null ? enrollment.getApprenant().getEmail() : null);
        
        if (email == null) return java.util.Collections.emptyMap();

        Long studentId = apprenantRepository.findByEmail(email.trim().toLowerCase())
                        .map(Apprenant::getId)
                        .orElse(null);

        Map<Long, Double> courseProgressMap = new java.util.HashMap<>();
        double totalProgressSum = 0.0;
        int courseCount = bundle.getCourses().size();

        for (Course course : bundle.getCourses()) {
            long totalCourseSubSections = 0;
            for (Section section : course.getSections()) {
                totalCourseSubSections += section.getSubSections().size();
            }
            
            // CRITICAL: INCLUDE FINAL EXAM IN PROGRESS
            boolean hasExam = course.getFinalExam() != null && course.getExamEnabled() != false;
            if (hasExam) {
                totalCourseSubSections++;
            }

            double courseProgressPercent = 0.0;
            if (studentId != null && totalCourseSubSections > 0) {
                List<CourseProgress> progressList = progressRepository.findByApprenantIdAndCourseId(studentId, course.getId());
                long completed = 0;
                
                if (!progressList.isEmpty()) {
                    CourseProgress progress = progressList.get(0);
                    if (progress.getCompletedSubSectionIds() != null && !progress.getCompletedSubSectionIds().isEmpty()) {
                        completed = progress.getCompletedSubSectionIds().split(",").length;
                    }
                }
                
                // CHECK IF FINAL EXAM IS PASSED
                if (hasExam) {
                    List<QuizResult> results = quizResultRepository.findByApprenantIdAndCourseId(studentId, course.getId());
                    int threshold = 70;
                    if (course.getFinalExam().getSettings() != null) {
                        threshold = course.getFinalExam().getSettings().getPassingScore();
                    }
                    
                    int finalThreshold = threshold;
                    boolean examPassed = results.stream()
                        .filter(r -> "final_exam".equals(r.getQuizId()) || (course.getFinalExam() != null && String.valueOf(course.getFinalExam().getId()).equals(r.getQuizId())))
                        .anyMatch(r -> r.getScore() != null && r.getScore() >= finalThreshold);
                    
                    if (examPassed) {
                        completed++;
                    }
                }
                
                courseProgressPercent = (double) completed / totalCourseSubSections * 100.0;
            }
            double finalCoursePercent = Math.min(100.0, courseProgressPercent);
            courseProgressMap.put(course.getId(), finalCoursePercent);
            totalProgressSum += finalCoursePercent;
        }

        double averageProgress = courseCount == 0 ? 0.0 : totalProgressSum / courseCount;

        Map<String, Object> result = new java.util.HashMap<>();
        result.put("enrollmentId", enrollmentId);
        result.put("totalProgress", Math.min(100.0, averageProgress));
        result.put("courseProgress", courseProgressMap);
        
        return result;
    }

    public double getEnrollmentProgress(Long enrollmentId) {
        Map<String, Object> detailed = getEnrollmentDetailedProgress(enrollmentId);
        Object total = detailed.get("totalProgress");
        return total instanceof Double ? (Double) total : 0.0;
    }

    public List<Bundle> getPublishedBundles() {
        return bundleRepository.findAllByPublishedTrueOrderByIdDesc();
    }

    @Transactional
    public BundleEnrollment enrollInBundle(Long bundleId, String email) {
        // Try to find if user is a trainer
        java.util.Optional<Enseignant> trainer = enseignantRepository.findByEmail(email);
        if (trainer.isPresent()) {
            List<BundleEnrollment> existing = enrollmentRepository.findByEnseignantEmail(email);
            if (existing.stream().anyMatch(e -> e.getBundleId().equals(bundleId))) {
                throw new RuntimeException("Déjà inscrit à ce parcours");
            }
            return enrollmentRepository.save(BundleEnrollment.builder()
                    .bundleId(bundleId)
                    .enseignant(trainer.get())
                    .status(BundleEnrollmentStatus.PENDING)
                    .build());
        }

        // Try to find if user is a learner
        java.util.Optional<Apprenant> learner = apprenantRepository.findByEmail(email);
        if (learner.isPresent()) {
            List<BundleEnrollment> existing = enrollmentRepository.findByApprenantEmail(email);
            if (existing.stream().anyMatch(e -> e.getBundleId().equals(bundleId))) {
                throw new RuntimeException("Déjà inscrit à ce parcours");
            }
            return enrollmentRepository.save(BundleEnrollment.builder()
                    .bundleId(bundleId)
                    .apprenant(learner.get())
                    .status(BundleEnrollmentStatus.PENDING)
                    .build());
        }

        throw new RuntimeException("Utilisateur non trouvé avec l'email: " + email);
    }

    public List<BundleEnrollment> getUserEnrollments(String email) {
        List<BundleEnrollment> enrollments = new java.util.ArrayList<>();
        enrollments.addAll(enrollmentRepository.findByEnseignantEmail(email));
        enrollments.addAll(enrollmentRepository.findByApprenantEmail(email));
        return enrollments;
    }

    public boolean isCourseInAcceptedBundle(Long courseId, String email) {
        List<BundleEnrollment> enrollments = getUserEnrollments(email);
        return enrollments.stream()
                .filter(e -> e.getStatus() == BundleEnrollmentStatus.ACCEPTED)
                .anyMatch(e -> {
                    Bundle b = bundleRepository.findById(e.getBundleId()).orElse(null);
                    return b != null && b.getCourses().stream().anyMatch(c -> c.getId().equals(courseId));
                });
    }

    public List<BundleEnrollment> getEnrollmentsByBundle(Long bundleId) {
        return enrollmentRepository.findByBundleId(bundleId);
    }

    public Map<String, Object> getBundlePerformance(Long bundleId, String email) {
        Bundle bundle = getBundleById(bundleId);
        Long studentId = apprenantRepository.findByEmail(email.trim().toLowerCase())
                .map(Apprenant::getId)
                .orElse(null);

        double totalScore = 0.0;
        int quizCount = 0;

        for (Course course : bundle.getCourses()) {
            for (Section section : course.getSections()) {
                for (SubSection sub : section.getSubSections()) {
                    if (sub.getQuiz() != null) {
                        String quizId = sub.getQuiz().getId().toString();
                        // Find results for this specific quiz
                        List<QuizResult> results = studentId != null 
                            ? quizResultRepository.findByApprenantIdAndCourseId(studentId, course.getId())
                            : new java.util.ArrayList<>();
                            
                        // Filter by quizId and find max score
                        int maxScore = results.stream()
                            .filter(r -> r.getQuizId().equals(quizId))
                            .mapToInt(QuizResult::getScore)
                            .max()
                            .orElse(0);
                            
                        totalScore += maxScore;
                        quizCount++;
                    }
                }
            }
            
            // CRITICAL: INCLUDE FINAL EXAM IN PERFORMANCE
            if (course.getFinalExam() != null && course.getExamEnabled() != false) {
                List<QuizResult> results = studentId != null 
                    ? quizResultRepository.findByApprenantIdAndCourseId(studentId, course.getId())
                    : new java.util.ArrayList<>();
                
                int maxScore = results.stream()
                    .filter(r -> "final_exam".equals(r.getQuizId()) || (course.getFinalExam() != null && String.valueOf(course.getFinalExam().getId()).equals(r.getQuizId())))
                    .mapToInt(QuizResult::getScore)
                    .max()
                    .orElse(0);
                
                totalScore += maxScore;
                quizCount++;
            }
        }

        double averageScore = quizCount == 0 ? 100.0 : totalScore / quizCount;
        
        Map<String, Object> result = new java.util.HashMap<>();
        result.put("averageScore", Math.round(averageScore * 100.0) / 100.0);
        result.put("quizCount", quizCount);
        return result;
    }
}
