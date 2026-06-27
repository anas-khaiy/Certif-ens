package com.certiflow.coordinateur.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "encadrement_tasks")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties(ignoreUnknown = true)
public class EncadrementTask {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    private String deadline;

    private Double estimatedHours;

    private String type; // sequential or parallel

    @Enumerated(EnumType.STRING)
    private EncadrementPriority priority;

    @Enumerated(EnumType.STRING)
    private EncadrementTaskStatus status;

    @Column(columnDefinition = "TEXT")
    private String feedback;

    private Integer score;

    @Column(columnDefinition = "TEXT")
    private String deliverable;

    @Column(columnDefinition = "TEXT")
    private String comments;

    @Column(columnDefinition = "TEXT")
    private String blockedReason;

    @Column(columnDefinition = "TEXT")
    private String alertMessage;

    @ManyToOne
    @JoinColumn(name = "phase_id")
    @JsonIgnore
    private EncadrementPhase phase;
}
