package com.certiflow.apprenant.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "depots_pfe")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DepotPfe {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "apprenant_id", nullable = false)
    private Apprenant apprenant;

    @Column(nullable = false)
    private String typeDepot; // "DEPOT_1", "DEPOT_2", "FINAL"

    @Column(nullable = false)
    private String fichierUrl;

    @Column(nullable = false)
    private LocalDateTime dateDepot;

    @Builder.Default
    @Column(nullable = false)
    private String statut = "EN_ATTENTE"; // EN_ATTENTE, VALIDE, REFUSE
}
