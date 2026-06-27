package com.certiflow.coordinateur.model;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

@Entity
@Table(name = "apprenants")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Apprenant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nom;
    private String prenom;

    @Column(unique = true, nullable = false)
    private String email;

    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    @Column(nullable = false)
    private String motDePasse;

    @Column(unique = true)
    private String cin;

    @Builder.Default
    @Column(columnDefinition = "varchar(255) default 'default.png'")
    private String photoProfile = "default.png";

    private String tailleQR;

    @ManyToOne
    @JoinColumn(name = "specialite_id")
    private Specialite specialite;

    @ManyToOne
    @JoinColumn(name = "cycle_id")
    private Cycle cycle;

    private String sexe;

    @ManyToOne
    @JoinColumn(name = "formation_id")
    private Formation formation;

    @Builder.Default
    @Column(nullable = false, columnDefinition = "boolean default false")
    private boolean mfaEnabled = false;

    private String mfaSecret;

    @ManyToOne
    @JoinColumn(name = "encadrant_id")
    private Enseignant encadrant;

    @ManyToOne
    @JoinColumn(name = "coordinateur_id")
    private Coordinateur coordinateur;

    private java.time.LocalDateTime dateSoutenance;

    @OneToOne(mappedBy = "apprenant")
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties("apprenant")
    private Sujet sujetDetails;

    @ManyToMany
    @JoinTable(
        name = "apprenant_examinateurs",
        joinColumns = @JoinColumn(name = "apprenant_id"),
        inverseJoinColumns = @JoinColumn(name = "enseignant_id")
    )
    private java.util.Set<Enseignant> examinateurs;

    @ManyToMany
    @JoinTable(
        name = "apprenant_rapporteurs",
        joinColumns = @JoinColumn(name = "apprenant_id"),
        inverseJoinColumns = @JoinColumn(name = "enseignant_id")
    )
    private java.util.Set<Enseignant> rapporteurs;
}
