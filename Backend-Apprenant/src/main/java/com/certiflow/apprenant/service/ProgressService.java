package com.certiflow.apprenant.service;

import com.certiflow.apprenant.model.*;
import com.certiflow.apprenant.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProgressService {
        private final CourseProgressRepository progressRepository;
        private final QuizResultRepository quizResultRepository;
        private final ApprenantRepository apprenantRepository;
        private final TpSubmissionRepository tpSubmissionRepository;
        private final CourseRepository courseRepository;

        public CourseProgress getProgress(Long courseId, String email) {
                try {
                        Apprenant apprenant = apprenantRepository.findByEmail(email)
                                        .orElseThrow(() -> new RuntimeException(
                                                        "Apprenant non trouvé pour l'email: " + email));

                        // Use findFirst just in case duplicates exist before the constraint was added
                        List<CourseProgress> progressList = progressRepository
                                        .findAllByApprenantIdAndCourseId(apprenant.getId(), courseId);

                        if (!progressList.isEmpty()) {
                                return progressList.get(0);
                        }

                        return CourseProgress.builder()
                                        .apprenantId(apprenant.getId())
                                        .courseId(courseId)
                                        .completedSubSectionIds("")
                                        .build();
                } catch (Exception e) {
                        System.err.println("Error in getProgress: " + e.getMessage());
                        e.printStackTrace();
                        throw e;
                }
        }

        @Transactional
        public CourseProgress updateProgress(Long courseId, String email, String lastSubSectionId, String completedId, String timeSpentPerSection) {
                try {
                        Apprenant apprenant = apprenantRepository.findByEmail(email)
                                        .orElseThrow(() -> new RuntimeException(
                                                        "Apprenant non trouvé pour l'email: " + email));

                        List<CourseProgress> progressList = progressRepository
                                        .findAllByApprenantIdAndCourseId(apprenant.getId(), courseId);
                        CourseProgress progress;

                        if (progressList.isEmpty()) {
                                progress = CourseProgress.builder()
                                                .apprenantId(apprenant.getId())
                                                .courseId(courseId)
                                                .completedSubSectionIds("")
                                                .timeSpentPerSection(timeSpentPerSection)
                                                .build();
                        } else {
                                progress = progressList.get(0);
                                // Clean up duplicates if any
                                if (progressList.size() > 1) {
                                        for (int i = 1; i < progressList.size(); i++) {
                                                progressRepository.delete(progressList.get(i));
                                        }
                                }
                        }

                        if (lastSubSectionId != null) {
                                progress.setLastSubSectionId(lastSubSectionId);
                        }

                        if (completedId != null) {
                                String current = progress.getCompletedSubSectionIds();
                                Set<String> completed = new LinkedHashSet<>();
                                if (current != null && !current.isEmpty()) {
                                        completed.addAll(Arrays.asList(current.split(",")));
                                }
                                completed.add(completedId);
                                String joined = completed.stream()
                                                .filter(s -> s != null && !s.isEmpty())
                                                .collect(Collectors.joining(","));
                                progress.setCompletedSubSectionIds(joined);
                        }
                        
                        // Si le client envoie des temps de présence
                        if (timeSpentPerSection != null && !timeSpentPerSection.isEmpty()) {
                            // On pourrait fusionner si on voulait, mais ici c'est déjà un total côté frontend 
                            // donc on va tout simplement l'assigner comme état actuel global
                            progress.setTimeSpentPerSection(timeSpentPerSection);
                        }

                        return progressRepository.save(progress);
                } catch (Exception e) {
                        System.err.println("Error in updateProgress: " + e.getMessage());
                        e.printStackTrace();
                        throw e;
                }
        }

        @Transactional
        public QuizResult saveQuizResult(Long courseId, String email, String quizId, Integer score, Boolean passed,
                        String answers, String cheatingReason, String status) {
                // Un quiz supervisé désactivé par le formateur ne peut pas être passé
                courseRepository.findById(courseId).ifPresent(course -> {
                        if (course.getCourseQuizzes() != null && quizId != null) {
                                for (Quiz q : course.getCourseQuizzes()) {
                                        if (q != null && q.getId() != null && quizId.equals(String.valueOf(q.getId()))
                                                        && Boolean.FALSE.equals(q.getActive())) {
                                                throw new org.springframework.web.server.ResponseStatusException(
                                                                org.springframework.http.HttpStatus.FORBIDDEN,
                                                                "Ce quiz n'est pas disponible pour le moment.");
                                        }
                                }
                        }
                });
                // Nombre maximum de tentatives (réglage du quiz : null ou 0 = illimité)
                courseRepository.findById(courseId).ifPresent(course -> {
                        Quiz target = findQuizById(course, quizId);
                        Integer max = (target != null && target.getSettings() != null) ? target.getSettings().getMaxAttempts() : null;
                        if (max != null && max > 0) {
                                apprenantRepository.findByEmail(email).ifPresent(a -> {
                                        int used = quizResultRepository
                                                        .findByApprenantIdAndCourseIdAndQuizId(a.getId(), courseId, quizId).size();
                                        if (used >= max) {
                                                throw new org.springframework.web.server.ResponseStatusException(
                                                                org.springframework.http.HttpStatus.FORBIDDEN,
                                                                "Nombre maximum de tentatives atteint pour ce quiz.");
                                        }
                                });
                        }
                });
                try {
                        Apprenant apprenant = apprenantRepository.findByEmail(email)
                                        .orElseThrow(() -> new RuntimeException(
                                                        "Apprenant non trouvé pour l'email: " + email));

                        QuizResult result = QuizResult.builder()
                                        .apprenantId(apprenant.getId())
                                        .courseId(courseId)
                                        .quizId(quizId)
                                        .score(score)
                                        .passed(passed)
                                        .answers(answers)
                                        .cheatingReason(cheatingReason)
                                        .status(status != null ? status : "GRADED")
                                        .build();

                        return quizResultRepository.save(result);
                } catch (Exception e) {
                        System.err.println("Error in saveQuizResult: " + e.getMessage());
                        e.printStackTrace();
                        throw e;
                }
        }

        /** Retrouve un quiz du cours (quiz de leçon ou quiz supervisé) par son identifiant. */
        private Quiz findQuizById(Course course, String quizId) {
                if (quizId == null)
                        return null;
                if (course.getCourseQuizzes() != null) {
                        for (Quiz q : course.getCourseQuizzes()) {
                                if (q != null && q.getId() != null && quizId.equals(String.valueOf(q.getId())))
                                        return q;
                        }
                }
                if (course.getSections() != null) {
                        for (Section sec : course.getSections()) {
                                if (sec == null || sec.getSubSections() == null)
                                        continue;
                                for (SubSection ss : sec.getSubSections()) {
                                        Quiz q = ss != null ? ss.getQuiz() : null;
                                        if (q != null && q.getId() != null && quizId.equals(String.valueOf(q.getId())))
                                                return q;
                                }
                        }
                }
                return null;
        }

        public List<QuizResult> getQuizResults(Long courseId, String email) {
                try {
                        Apprenant apprenant = apprenantRepository.findByEmail(email)
                                        .orElseThrow(() -> new RuntimeException(
                                                        "Apprenant non trouvé pour l'email: " + email));
                        return quizResultRepository.findByApprenantIdAndCourseId(apprenant.getId(), courseId);
                } catch (Exception e) {
                        System.err.println("Error in getQuizResults: " + e.getMessage());
                        e.printStackTrace();
                        throw e;
                }
        }

        @Transactional
        public TpSubmission saveTpSubmission(Long courseId, String email, String subSectionId, String link) {
                try {
                        Apprenant apprenant = apprenantRepository.findByEmail(email)
                                        .orElseThrow(() -> new RuntimeException("Apprenant non trouvé"));
                        
                        Optional<TpSubmission> existing = tpSubmissionRepository
                                .findByApprenantIdAndCourseIdAndSubSectionId(apprenant.getId(), courseId, subSectionId);
                        
                        TpSubmission submission;
                        if (existing.isPresent()) {
                                submission = existing.get();
                                submission.setSubmissionLink(link);
                                submission.setSubmissionDate(java.time.LocalDateTime.now());
                        } else {
                                submission = TpSubmission.builder()
                                        .apprenantId(apprenant.getId())
                                        .courseId(courseId)
                                        .subSectionId(subSectionId)
                                        .submissionLink(link)
                                        .build();
                        }
                        TpSubmission saved = tpSubmissionRepository.save(submission);
                        return saved;
                } catch (Exception e) {
                        throw new RuntimeException("Error saving TP submission", e);
                }
        }

        public List<TpSubmission> getTpSubmissions(Long courseId, String email) {
                try {
                        Apprenant apprenant = apprenantRepository.findByEmail(email)
                                        .orElseThrow(() -> new RuntimeException("Apprenant non trouvé"));
                        return tpSubmissionRepository.findByApprenantIdAndCourseId(apprenant.getId(), courseId);
                } catch (Exception e) {
                        throw new RuntimeException("Error fetching TP submissions", e);
                }
        }

        @Transactional
        public void deleteQuizResults(Long courseId, String quizId) {
                try {
                        quizResultRepository.deleteByCourseIdAndQuizId(courseId, quizId);
                } catch (Exception e) {
                        System.err.println("Error in deleteQuizResults: " + e.getMessage());
                        e.printStackTrace();
                        throw e;
                }
        }
}
