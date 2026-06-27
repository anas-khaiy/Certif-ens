package com.certiflow.coordinateur.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "tp_submissions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TpSubmission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long apprenantId;

    private Long courseId;

    private String subSectionId;

    @Column(columnDefinition = "TEXT")
    private String submissionLink;

    private LocalDateTime submissionDate;

    @PrePersist
    protected void onCreate() {
        submissionDate = LocalDateTime.now();
    }
}
