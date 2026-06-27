package com.certiflow.formateur.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "remarques_depots")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RemarqueDepot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "depot_id", nullable = false)
    private DepotPfe depotPfe;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "enseignant_id", nullable = false)
    private Enseignant enseignant;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String commentaire;

    @Column(nullable = false)
    private LocalDateTime dateRemarque;
}
