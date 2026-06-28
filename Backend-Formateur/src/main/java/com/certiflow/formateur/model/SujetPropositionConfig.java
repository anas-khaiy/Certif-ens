package com.certiflow.formateur.model;

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

    @Column(name = "coordinateur_id", nullable = false)
    private Long coordinateurId;

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
