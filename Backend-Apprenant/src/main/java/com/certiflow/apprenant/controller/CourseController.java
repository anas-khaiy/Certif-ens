package com.certiflow.apprenant.controller;

import com.certiflow.apprenant.model.Course;
import com.certiflow.apprenant.repository.QuizResultRepository;
import com.certiflow.apprenant.service.CourseService;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/courses")
public class CourseController {

    private final CourseService service;
    private final QuizResultRepository quizResultRepository;

    public CourseController(CourseService service, QuizResultRepository quizResultRepository) {
        this.service = service;
        this.quizResultRepository = quizResultRepository;
    }

    @GetMapping
    public ResponseEntity<List<Course>> getPublishedCourses() {
        return ResponseEntity.ok(service.getPublishedCourses());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Course> getCourseById(@PathVariable Long id) {
        return ResponseEntity.ok(service.getCourseById(id));
    }

    /**
     * Internal service endpoint — called by the formateur backend when a trainer
     * deletes a final exam, to clear all learner quiz results for that exam.
     * Path is under /api/v1/courses/** which is permitAll so no auth is required.
     */
    @DeleteMapping("/{courseId}/exam-results/{quizId}")
    @Transactional
    public ResponseEntity<Void> deleteExamResults(
            @PathVariable Long courseId,
            @PathVariable String quizId) {
        quizResultRepository.deleteByCourseIdAndQuizId(courseId, quizId);
        return ResponseEntity.noContent().build();
    }
}
