package com.certiflow.apprenant.model;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "sujets")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Sujet {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String titre;

    @Column(columnDefinition = "TEXT")
    private String description;

    @ElementCollection
    @CollectionTable(name = "sujet_objectifs", joinColumns = @JoinColumn(name = "sujet_id"))
    @Column(name = "objectif", columnDefinition = "TEXT")
    @Builder.Default
    private List<String> objectifs = new ArrayList<>();

    @OneToOne
    @JoinColumn(name = "apprenant_id", unique = true)
    @ToString.Exclude
    private Apprenant apprenant;

    @ManyToOne
    @JoinColumn(name = "formateur_id", referencedColumnName = "id")
    private Enseignant formateur;

    @Builder.Default
    @Column(nullable = false, columnDefinition = "boolean default true")
    private boolean selectionActive = true;
}
