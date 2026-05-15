package com.certiflow.formateur.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "formateur_bundle_enrollments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties(ignoreUnknown = true)
public class BundleEnrollment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "bundle_id", nullable = false)
    private Long bundleId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "enseignant_id", nullable = true)
    private Enseignant enseignant;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "apprenant_id", nullable = true)
    private Apprenant apprenant;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private BundleEnrollmentStatus status = BundleEnrollmentStatus.PENDING;

    @CreationTimestamp
    @Column(name = "enrolled_at", updatable = false)
    private LocalDateTime enrolledAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;
}
