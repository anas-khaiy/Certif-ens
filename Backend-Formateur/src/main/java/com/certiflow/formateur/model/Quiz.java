package com.certiflow.formateur.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "quizzes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties(ignoreUnknown = true)
public class Quiz {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;

    /** Quiz supervisé du cours : actif (null ou true) = accessible aux apprenants ; false = non disponible. */
    private Boolean active;

    /** Position du quiz supervisé dans le cours (ordre choisi par le formateur). */
    private Integer orderIndex;

    @Embedded
    @Builder.Default
    private QuizSettings settings = new QuizSettings();

    @OneToMany(mappedBy = "quiz", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Question> questions = new ArrayList<>();
}
