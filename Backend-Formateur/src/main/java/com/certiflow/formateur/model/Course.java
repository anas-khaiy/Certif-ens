package com.certiflow.formateur.model;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "courses")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties(ignoreUnknown = true)
public class Course {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;
    private String level; // Licence, Master, or Libre
    private Long specialiteId; // ID of the linked Specialite

    @ElementCollection
    @CollectionTable(name = "course_semesters", joinColumns = @JoinColumn(name = "course_id"))
    @Column(name = "semester")
    @Builder.Default
    private List<String> semesters = new ArrayList<>();

    @Column(columnDefinition = "TEXT")
    private String prerequisites;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(columnDefinition = "TEXT")
    private String coverImage;
    private boolean published;
    @Builder.Default
    private Boolean contentCompleted = false;
    @Builder.Default
    private Boolean examEnabled = true;

    private LocalDateTime deadlineDate;

    private Integer reminderDays;

    @Builder.Default
    private Boolean timeTrackingEnabled = false;

    @ManyToMany
    @JoinTable(
        name = "course_formations",
        joinColumns = @JoinColumn(name = "course_id"),
        inverseJoinColumns = @JoinColumn(name = "formation_id")
    )
    @Builder.Default
    private java.util.Set<Formation> formations = new java.util.HashSet<>();

    @ManyToOne
    @JoinColumn(name = "enseignant_id")
    private Enseignant enseignant;

    @OneToMany(mappedBy = "course", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("orderIndex ASC")
    @Builder.Default
    private List<Section> sections = new ArrayList<>();

    @OneToOne(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "final_exam_id")
    private Quiz finalExam;

    // Supervised quizzes (titled, AI-supervised or not) attached to the course.
    // Independent from the final exam: a course can hold any number of them.
    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinTable(
        name = "course_quizzes",
        joinColumns = @JoinColumn(name = "course_id"),
        inverseJoinColumns = @JoinColumn(name = "quiz_id")
    )
    @Builder.Default
    private List<Quiz> courseQuizzes = new ArrayList<>();

    @JsonProperty("createdAt")
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
    @org.hibernate.annotations.CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @JsonProperty("updatedAt")
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
    @org.hibernate.annotations.UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // ---- Helpers for supervised course quizzes (not getters => not serialized) ----
    public java.util.Set<String> courseQuizIds() {
        java.util.Set<String> ids = new java.util.LinkedHashSet<>();
        if (courseQuizzes != null) {
            for (Quiz q : courseQuizzes) {
                // Un quiz désactivé n'est pas exigé pour la complétion / le certificat
                if (q != null && q.getId() != null && !Boolean.FALSE.equals(q.getActive())) ids.add(String.valueOf(q.getId()));
            }
        }
        return ids;
    }

    public String courseQuizTitle(String quizId) {
        if (courseQuizzes != null && quizId != null) {
            for (Quiz q : courseQuizzes) {
                if (q != null && q.getId() != null && quizId.equals(String.valueOf(q.getId()))) {
                    return q.getTitle() != null ? q.getTitle() : "Quiz";
                }
            }
        }
        return null;
    }

    /** Number of distinct supervised quizzes of this course passed in the given results. */
    public long passedCourseQuizCount(java.util.Collection<QuizResult> results) {
        java.util.Set<String> ids = courseQuizIds();
        if (ids.isEmpty() || results == null) return 0;
        return results.stream()
                .filter(r -> r != null && r.getQuizId() != null && ids.contains(r.getQuizId()) && Boolean.TRUE.equals(r.getPassed()))
                .map(QuizResult::getQuizId)
                .distinct()
                .count();
    }
}
