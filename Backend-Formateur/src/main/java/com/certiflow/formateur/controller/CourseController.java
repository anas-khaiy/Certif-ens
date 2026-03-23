package com.certiflow.formateur.controller;

import com.certiflow.formateur.model.Course;
import com.certiflow.formateur.model.QuizResult;
import com.certiflow.formateur.service.CourseService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/courses")
public class CourseController {

    private final CourseService service;
    private final com.certiflow.formateur.repository.QuizResultRepository quizResultRepository;
    private final com.certiflow.formateur.repository.CourseProgressRepository progressRepository;
    private final com.certiflow.formateur.repository.TpSubmissionRepository tpSubmissionRepository;

    public CourseController(CourseService service,
            com.certiflow.formateur.repository.QuizResultRepository quizResultRepository,
            com.certiflow.formateur.repository.CourseProgressRepository progressRepository,
            com.certiflow.formateur.repository.TpSubmissionRepository tpSubmissionRepository) {
        this.service = service;
        this.quizResultRepository = quizResultRepository;
        this.progressRepository = progressRepository;
        this.tpSubmissionRepository = tpSubmissionRepository;
    }

    @GetMapping
    public List<Course> getMyCourses() {
        String email = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication()
                .getName();
        return service.getCoursesByTrainerEmail(email);
    }

    @GetMapping("/all")
    public List<Course> getAllCourses() {
        return service.getAllCourses();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Course> getCourseById(@PathVariable Long id) {
        return ResponseEntity.ok(service.getCourseById(id));
    }

    @GetMapping("/{id}/quiz-results")
    public List<com.certiflow.formateur.model.QuizResult> getQuizResults(@PathVariable Long id) {
        return quizResultRepository.findByCourseId(id);
    }

    @GetMapping("/{id}/progress")
    public List<com.certiflow.formateur.model.CourseProgress> getCourseProgress(@PathVariable Long id) {
        return progressRepository.findByCourseId(id);
    }

    @GetMapping("/{id}/tps")
    public List<com.certiflow.formateur.model.TpSubmission> getCourseTps(@PathVariable Long id) {
        return tpSubmissionRepository.findByCourseId(id);
    }

    @PostMapping
    public Course createCourse(@RequestBody Course course) {
        String email = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication()
                .getName();
        return service.saveCourseWithTrainer(course, email);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Course> updateCourse(@PathVariable Long id, @RequestBody Course course) {
        return ResponseEntity.ok(service.updateCourse(id, course));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCourse(@PathVariable Long id) {
        service.deleteCourse(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/quiz-results/{resultId}")
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<QuizResult> updateQuizResult(
            @PathVariable Long id,
            @PathVariable Long resultId,
            @RequestBody QuizResult updatedResult) {

        QuizResult existing = quizResultRepository.findById(resultId).orElse(null);

        if (existing == null) {
            return ResponseEntity.notFound().build();
        }

        // Update fields if provided
        if (updatedResult.getScore() != null) {
            existing.setScore(updatedResult.getScore());
        }
        if (updatedResult.getPassed() != null) {
            existing.setPassed(updatedResult.getPassed());
        }
        if (updatedResult.getAnswers() != null) {
            existing.setAnswers(updatedResult.getAnswers());
        }

        QuizResult saved = quizResultRepository.save(existing);
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/{id}/quiz-results/{quizId}")
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<Void> deleteQuizResultsByQuizId(
            @PathVariable Long id,
            @PathVariable String quizId) {
        quizResultRepository.deleteByCourseIdAndQuizId(id, quizId);
        return ResponseEntity.noContent().build();
    }
}
