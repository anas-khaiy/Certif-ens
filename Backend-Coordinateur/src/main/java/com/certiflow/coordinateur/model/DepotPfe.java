package com.certiflow.coordinateur.model;

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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "apprenant_id", nullable = false)
    private Apprenant apprenant;

    @Column(name = "type_depot", nullable = false)
    private String typeDepot;

    @Column(name = "fichier_url", nullable = false)
    private String fichierUrl;

    @Column(name = "date_depot", nullable = false)
    private LocalDateTime dateDepot;
}
