package com.certiflow.formateur.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "formateur_bundles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties(ignoreUnknown = true)
public class Bundle {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(columnDefinition = "TEXT")
    private String coverImage;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "specialite_id")
    private Specialite specialite;

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
        name = "formateur_bundle_courses",
        joinColumns = @JoinColumn(name = "bundle_id"),
        inverseJoinColumns = @JoinColumn(name = "course_id")
    )
    @Builder.Default
    private List<Course> courses = new ArrayList<>();

    @Builder.Default
    private boolean published = true;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
