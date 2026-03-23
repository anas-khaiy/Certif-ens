package com.certiflow.formateur.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "specialites")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Specialite {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String nom;
}
