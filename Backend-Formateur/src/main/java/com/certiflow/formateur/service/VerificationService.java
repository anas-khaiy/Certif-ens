package com.certiflow.formateur.service;

import com.certiflow.formateur.dto.VerificationDTO;
import com.certiflow.formateur.model.*;
import com.certiflow.formateur.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class VerificationService {

    private final EnrollmentRepository enrollmentRepository;
    private final QuizResultRepository quizResultRepository;
    private final BundleEnrollmentRepository bundleEnrollmentRepository;
    private final BundleRepository bundleRepository;

    @Transactional
    public VerificationDTO verifyAny(String certId) {
        if (certId == null) return VerificationDTO.builder().valid(false).errorMessage("ID invalide").build();

        if (certId.startsWith("BND-")) {
            try {
                Long bundleEnrollmentId = Long.parseLong(certId.substring(4));
                return verifyBundle(bundleEnrollmentId);
            } catch (NumberFormatException e) {
                return VerificationDTO.builder().valid(false).errorMessage("Format d'ID Parcours invalide").build();
            }
        }

        try {
            Long enrollmentId = Long.parseLong(certId);
            return verify(enrollmentId);
        } catch (NumberFormatException e) {
            return VerificationDTO.builder().valid(false).errorMessage("Format d'ID Certificat invalide").build();
        }
    }

    @Transactional
    public VerificationDTO verify(Long enrollmentId) {
        try {
            Optional<Enrollment> optEnrollment = enrollmentRepository.findById(enrollmentId);
            if (optEnrollment.isEmpty()) {
                return VerificationDTO.builder().valid(false).errorMessage("Certificat introuvable").build();
            }
            
            Enrollment enrollment = optEnrollment.get();
            if (enrollment.getApprenant() == null || enrollment.getCourse() == null) {
                return VerificationDTO.builder().valid(false).errorMessage("Données incomplètes").build();
            }

            if (enrollment.getStatus() != EnrollmentStatus.ACCEPTED) {
                return VerificationDTO.builder().valid(false).errorMessage("Inscription non approuvée").build();
            }

            // Calculation logic with strong error handling
            Integer finalBestScore = 100; // Fallback
            try {
                List<QuizResult> results = quizResultRepository.findByApprenantIdAndCourseId(
                        enrollment.getApprenant().getId(),
                        enrollment.getCourse().getId());

                Set<String> validRegularQuizIds = new HashSet<>();
                List<Section> sections = enrollment.getCourse().getSections();
                if (sections != null) {
                    for (Section section : sections) {
                        if (section == null || section.getSubSections() == null) continue;
                        for (SubSection ss : section.getSubSections()) {
                            if (ss != null && ss.getQuiz() != null && ss.getQuiz().getId() != null) {
                                validRegularQuizIds.add(String.valueOf(ss.getQuiz().getId()));
                            }
                        }
                    }
                }

                Map<String, Integer> quizBestScores = new HashMap<>();
                Integer bestFinalExamScore = 0;
                if (results != null) {
                    for (QuizResult r : results) {
                        if (r == null || r.getQuizId() == null) continue;
                        String qId = r.getQuizId();
                        Integer score = r.getScore() != null ? r.getScore() : 0;
                        if ("final_exam".equals(qId) || (enrollment.getCourse().getFinalExam() != null && String.valueOf(enrollment.getCourse().getFinalExam().getId()).equals(qId))) {
                            if (score > bestFinalExamScore) bestFinalExamScore = score;
                        } else if (validRegularQuizIds.contains(qId)) {
                            quizBestScores.put(qId, Math.max(quizBestScores.getOrDefault(qId, 0), score));
                        }
                    }
                }

                long totalScoreSum = 0;
                for (String qId : validRegularQuizIds) totalScoreSum += quizBestScores.getOrDefault(qId, 0);
                boolean hasFinalExam = enrollment.getCourse().getFinalExam() != null && Boolean.TRUE.equals(enrollment.getCourse().getExamEnabled());
                int totalGradedItems = validRegularQuizIds.size() + (hasFinalExam ? 1 : 0);
                if (totalGradedItems > 0) {
                    finalBestScore = (int) Math.round((double) (totalScoreSum + (hasFinalExam ? bestFinalExamScore : 0)) / totalGradedItems);
                }
            } catch (Exception calcError) {
                // If calculation fails, we still allow verification with 100%
            }

            String trainerName = "ENS Marrakech";
            if (enrollment.getCourse().getEnseignant() != null) {
                String enseignantName = enrollment.getCourse().getEnseignant().getPrenom() + " " + enrollment.getCourse().getEnseignant().getNom();
                if (!enseignantName.trim().isEmpty() && !enseignantName.contains("null")) {
                    trainerName = enseignantName + " (ENS Marrakech)";
                }
            }

            LocalDateTime date = enrollment.getProcessedAt() != null ? enrollment.getProcessedAt() : (enrollment.getRequestedAt() != null ? enrollment.getRequestedAt() : LocalDateTime.now());
            
            String learnerName = "Apprenant Certifié";
            if (enrollment.getApprenant() != null) {
                String p = enrollment.getApprenant().getPrenom();
                String n = enrollment.getApprenant().getNom();
                if (p != null && n != null && !p.trim().isEmpty() && !n.trim().isEmpty() && !p.equalsIgnoreCase("null") && !n.equalsIgnoreCase("null")) {
                    learnerName = p + " " + n;
                } else if (enrollment.getApprenant().getEmail() != null) {
                    String email = enrollment.getApprenant().getEmail();
                    learnerName = email.split("@")[0];
                    if (learnerName.length() > 1) {
                        learnerName = learnerName.substring(0, 1).toUpperCase() + learnerName.substring(1);
                    }
                }
            }

            return VerificationDTO.builder()
                    .type("COURSE")
                    .valid(true)
                    .learnerName(learnerName)
                    .trainerName(trainerName)
                    .courseName(enrollment.getCourse().getTitle())
                    .score(finalBestScore)
                    .completionDate(date.toString())
                    .build();
        } catch (Exception e) {
            return VerificationDTO.builder().valid(false).errorMessage("Erreur Fatale: " + e.getMessage()).build();
        }
    }

    @Transactional
    public VerificationDTO verifyBundle(Long bundleEnrollmentId) {
        try {
            Optional<BundleEnrollment> optEnrollment = bundleEnrollmentRepository.findById(bundleEnrollmentId);
            if (optEnrollment.isEmpty()) {
                return VerificationDTO.builder().valid(false).errorMessage("Certificat de parcours introuvable").build();
            }
            
            BundleEnrollment enrollment = optEnrollment.get();
            if (enrollment.getStatus() != BundleEnrollmentStatus.ACCEPTED) {
                return VerificationDTO.builder().valid(false).errorMessage("Inscription au parcours non approuvée").build();
            }

            Bundle bundle = bundleRepository.findById(enrollment.getBundleId()).orElse(null);
            if (bundle == null) {
                return VerificationDTO.builder().valid(false).errorMessage("Parcours introuvable").build();
            }

            // Calculation logic with strong error handling
            int finalScore = 100; // Fallback
            try {
                List<Course> courses = bundle.getCourses();
                if (courses != null && !courses.isEmpty() && enrollment.getApprenant() != null) {
                    double sumAverages = 0;
                    for (Course course : courses) {
                        if (course == null) continue;
                        List<QuizResult> results = quizResultRepository.findByApprenantIdAndCourseId(enrollment.getApprenant().getId(), course.getId());
                        Set<String> validRegularQuizIds = new HashSet<>();
                        if (course.getSections() != null) {
                            for (Section section : course.getSections()) {
                                if (section == null || section.getSubSections() == null) continue;
                                for (SubSection ss : section.getSubSections()) {
                                    if (ss != null && ss.getQuiz() != null && ss.getQuiz().getId() != null) {
                                        validRegularQuizIds.add(String.valueOf(ss.getQuiz().getId()));
                                    }
                                }
                            }
                        }
                        Map<String, Integer> quizBestScores = new HashMap<>();
                        Integer bestFinalExamScore = 0;
                        if (results != null) {
                            for (QuizResult r : results) {
                                if (r == null || r.getQuizId() == null) continue;
                                String qId = r.getQuizId();
                                Integer score = r.getScore() != null ? r.getScore() : 0;
                                if ("final_exam".equals(qId) || (course.getFinalExam() != null && String.valueOf(course.getFinalExam().getId()).equals(qId))) {
                                    if (score > bestFinalExamScore) bestFinalExamScore = score;
                                } else if (validRegularQuizIds.contains(qId)) {
                                    quizBestScores.put(qId, Math.max(quizBestScores.getOrDefault(qId, 0), score));
                                }
                            }
                        }
                        long courseScoreSum = 0;
                        for (String qId : validRegularQuizIds) courseScoreSum += quizBestScores.getOrDefault(qId, 0);
                        boolean hasFinalExam = course.getFinalExam() != null && Boolean.TRUE.equals(course.getExamEnabled());
                        int totalGradedItems = validRegularQuizIds.size() + (hasFinalExam ? 1 : 0);
                        double courseAverage = 100;
                        if (totalGradedItems > 0) {
                            courseAverage = (double) (courseScoreSum + (hasFinalExam ? bestFinalExamScore : 0)) / totalGradedItems;
                        }
                        sumAverages += courseAverage;
                    }
                    finalScore = (int) Math.round(sumAverages / courses.size());
                } else if (enrollment.getEnseignant() != null) {
                    // Trainers default to 100% on completion
                    finalScore = 100;
                }
            } catch (Exception calcError) {
                // Calculation failed, proceed with fallback
            }

            LocalDateTime date = enrollment.getCompletedAt() != null ? enrollment.getCompletedAt() : (enrollment.getEnrolledAt() != null ? enrollment.getEnrolledAt() : LocalDateTime.now());
            
            String learnerDisplayName = "Apprenant Certifié";
            if (enrollment.getApprenant() != null) {
                String p = enrollment.getApprenant().getPrenom();
                String n = enrollment.getApprenant().getNom();
                if (p != null && n != null && !p.trim().isEmpty() && !n.trim().isEmpty() && !p.equalsIgnoreCase("null") && !n.equalsIgnoreCase("null")) {
                    learnerDisplayName = p + " " + n;
                } else if (enrollment.getApprenant().getEmail() != null) {
                    String email = enrollment.getApprenant().getEmail();
                    learnerDisplayName = email.split("@")[0];
                    if (learnerDisplayName.length() > 1) {
                        learnerDisplayName = learnerDisplayName.substring(0, 1).toUpperCase() + learnerDisplayName.substring(1);
                    }
                }
            } else if (enrollment.getEnseignant() != null) {
                String p = enrollment.getEnseignant().getPrenom();
                String n = enrollment.getEnseignant().getNom();
                if (p != null && n != null && !p.trim().isEmpty() && !n.trim().isEmpty() && !p.equalsIgnoreCase("null") && !n.equalsIgnoreCase("null")) {
                    learnerDisplayName = p + " " + n;
                } else {
                    String email = enrollment.getEnseignant().getEmail();
                    learnerDisplayName = email.split("@")[0];
                    if (learnerDisplayName.length() > 1) {
                        learnerDisplayName = learnerDisplayName.substring(0, 1).toUpperCase() + learnerDisplayName.substring(1);
                    }
                }
            }

            return VerificationDTO.builder()
                    .valid(true)
                    .type("BUNDLE")
                    .learnerName(learnerDisplayName)
                    .trainerName("ENS Marrakech")
                    .courseName(bundle.getTitle())
                    .score(finalScore)
                    .completionDate(date.toString())
                    .build();
        } catch (Exception e) {
            return VerificationDTO.builder().valid(false).errorMessage("Erreur Fatale (Bundle): " + e.getMessage()).build();
        }
    }
}
