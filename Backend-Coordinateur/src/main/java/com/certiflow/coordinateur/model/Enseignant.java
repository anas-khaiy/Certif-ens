package com.certiflow.coordinateur.model;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

@Entity
@Table(name = "enseignants")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Enseignant {

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

    @Builder.Default
    @Column(columnDefinition = "varchar(255) default 'default.png'")
    private String photoProfile = "default.png";

    @Column(columnDefinition = "TEXT")
    private String signature;

    @ManyToOne
    @JoinColumn(name = "specialite_id")
    private Specialite specialite;
}
