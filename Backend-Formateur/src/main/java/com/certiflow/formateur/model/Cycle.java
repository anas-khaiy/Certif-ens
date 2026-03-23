package com.certiflow.formateur.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "cycles")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Cycle {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String nomCycle;
}
