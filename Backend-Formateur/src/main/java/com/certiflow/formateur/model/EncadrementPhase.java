package com.certiflow.formateur.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "encadrement_phases")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties(ignoreUnknown = true)
public class EncadrementPhase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;

    private Integer orderIndex;

    private boolean collapsed;

    @OneToMany(mappedBy = "phase", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<EncadrementTask> tasks = new ArrayList<>();

    @ManyToOne
    @JoinColumn(name = "plan_id")
    @JsonIgnore
    private EncadrementPlan plan;
}
