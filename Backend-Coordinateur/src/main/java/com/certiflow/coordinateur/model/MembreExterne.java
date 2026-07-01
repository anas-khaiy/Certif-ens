package com.certiflow.coordinateur.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "membres_externes")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MembreExterne {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nom;

    @Column(nullable = false)
    private String prenom;

    private String email;

    private String affiliation;

    private String telephone;

    private String specialite;

    @ManyToOne
    @JoinColumn(name = "coordinateur_id")
    private Coordinateur coordinateur;
}
