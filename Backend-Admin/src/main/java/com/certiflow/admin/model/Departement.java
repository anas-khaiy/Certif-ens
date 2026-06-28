package com.certiflow.admin.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "departements")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Departement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String nom;
}
