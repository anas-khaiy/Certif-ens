package com.certiflow.coordinateur.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "quiz_results")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuizResult {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long apprenantId;
    private Long courseId;
    private String quizId;
    private Integer score;
    private Boolean passed;

    @Builder.Default
    private LocalDateTime attemptedAt = LocalDateTime.now();

    @Column(columnDefinition = "TEXT")
    private String answers; // Store JSON string of student answers

    @Column(columnDefinition = "TEXT")
    private String cheatingReason; // Null if no cheating detected; otherwise describes the violation
}
