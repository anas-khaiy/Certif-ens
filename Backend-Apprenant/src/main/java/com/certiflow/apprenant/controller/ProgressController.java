package com.certiflow.apprenant.controller;

import com.certiflow.apprenant.model.CourseProgress;
import com.certiflow.apprenant.model.QuizResult;
import com.certiflow.apprenant.service.ProgressService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/progress")
@RequiredArgsConstructor
public class ProgressController {
    private final ProgressService progressService;

    @GetMapping("/{courseId}")
    public ResponseEntity<CourseProgress> getProgress(@PathVariable Long courseId, Authentication auth) {
        if (auth == null)
            return ResponseEntity.status(401).build();
        return ResponseEntity.ok(progressService.getProgress(courseId, auth.getName()));
    }

    @PostMapping("/{courseId}")
    public ResponseEntity<CourseProgress> updateProgress(
            @PathVariable Long courseId,
            @RequestBody Map<String, Object> body,
            Authentication auth) {
        if (auth == null)
            return ResponseEntity.status(401).build();
        String lastSubSectionId = body.get("lastSubSectionId") != null ? body.get("lastSubSectionId").toString() : null;
        String completedId = body.get("completedId") != null ? body.get("completedId").toString() : null;
        
        String timeSpentPerSection = null;
        if (body.get("timeSpentPerSection") != null) {
            Object obj = body.get("timeSpentPerSection");
            if (obj instanceof String) {
                timeSpentPerSection = (String) obj;
            } else {
                try {
                    timeSpentPerSection = new com.fasterxml.jackson.databind.ObjectMapper()
                            .writeValueAsString(obj);
                } catch (Exception e) {
                    timeSpentPerSection = obj.toString();
                }
            }
        }
        
        return ResponseEntity
                .ok(progressService.updateProgress(courseId, auth.getName(), lastSubSectionId, completedId, timeSpentPerSection));
    }

    @PostMapping("/{courseId}/quiz/{quizId}")
    public ResponseEntity<QuizResult> saveQuizResult(
            @PathVariable Long courseId,
            @PathVariable String quizId,
            @RequestBody Map<String, Object> body,
            Authentication auth) {
        if (auth == null)
            return ResponseEntity.status(401).build();

        Integer score = 0;
        if (body.get("score") instanceof Number) {
            score = ((Number) body.get("score")).intValue();
        }

        Boolean passed = Boolean.TRUE.equals(body.get("passed"));
        String answers = null;
        if (body.get("answers") != null) {
            try {
                answers = new com.fasterxml.jackson.databind.ObjectMapper()
                        .writeValueAsString(body.get("answers"));
            } catch (Exception e) {
                answers = body.get("answers").toString();
            }
        }

        String cheatingReason = body.get("cheatingReason") != null ? body.get("cheatingReason").toString() : null;

        return ResponseEntity
                .ok(progressService.saveQuizResult(courseId, auth.getName(), quizId, score, passed, answers, cheatingReason));
    }

    @GetMapping("/{courseId}/quizzes")
    public ResponseEntity<List<QuizResult>> getQuizResults(@PathVariable Long courseId, Authentication auth) {
        if (auth == null)
            return ResponseEntity.status(401).build();
        return ResponseEntity.ok(progressService.getQuizResults(courseId, auth.getName()));
    }

    @DeleteMapping("/{courseId}/quiz/{quizId}")
    public ResponseEntity<Void> deleteQuizResults(
            @PathVariable Long courseId,
            @PathVariable String quizId,
            Authentication auth) {
        if (auth == null)
            return ResponseEntity.status(401).build();
        progressService.deleteQuizResults(courseId, quizId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{courseId}/tp/{subSectionId}")
    public ResponseEntity<com.certiflow.apprenant.model.TpSubmission> saveTpSubmission(
            @PathVariable Long courseId,
            @PathVariable String subSectionId,
            @RequestBody Map<String, String> body,
            Authentication auth) {
        if (auth == null)
            return ResponseEntity.status(401).build();
        String link = body.get("link");
        return ResponseEntity.ok(progressService.saveTpSubmission(courseId, auth.getName(), subSectionId, link));
    }

    @GetMapping("/{courseId}/tps")
    public ResponseEntity<List<com.certiflow.apprenant.model.TpSubmission>> getTpSubmissions(
            @PathVariable Long courseId,
            Authentication auth) {
        if (auth == null)
            return ResponseEntity.status(401).build();
        return ResponseEntity.ok(progressService.getTpSubmissions(courseId, auth.getName()));
    }
}
