package com.certiflow.coordinateur.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "course_progress", uniqueConstraints = {
        @UniqueConstraint(columnNames = { "apprenantId", "courseId" })
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CourseProgress {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long apprenantId;
    private Long courseId;
    private String lastSubSectionId;

    @Column(columnDefinition = "TEXT")
    private String completedSubSectionIds; // Comma separated IDs

    @Column(columnDefinition = "TEXT")
    private String timeSpentPerSection; // JSON string of sectionId -> seconds
}
