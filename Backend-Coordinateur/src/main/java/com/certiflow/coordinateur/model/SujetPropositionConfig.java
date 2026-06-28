package com.certiflow.coordinateur.model;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "sujet_proposition_configs")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SujetPropositionConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "coordinateur_id", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private Coordinateur coordinateur;

    @Column(name = "nombre_sujets_par_formateur", nullable = false)
    @Builder.Default
    private int nombreSujetsParFormateur = 1;

    @ManyToMany
    @JoinTable(
        name = "config_formateurs_concernes",
        joinColumns = @JoinColumn(name = "config_id", referencedColumnName = "id"),
        inverseJoinColumns = @JoinColumn(name = "enseignant_id", referencedColumnName = "id")
    )
    @Builder.Default
    private List<Enseignant> formateursConcernes = new ArrayList<>();
}
