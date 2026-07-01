package com.certiflow.coordinateur.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "envois_rapports")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EnvoiRapport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "apprenant_id", nullable = false)
    private Apprenant apprenant;

    @Column(name = "type_depot", nullable = false)
    private String typeDepot;

    @Column(name = "date_envoi", nullable = false)
    private LocalDateTime dateEnvoi;
}
