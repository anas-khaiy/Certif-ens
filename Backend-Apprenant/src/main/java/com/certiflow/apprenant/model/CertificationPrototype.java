package com.certiflow.apprenant.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "certification_prototypes")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CertificationPrototype {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String logo;
    private String tailleLogo;

    private String cachet;
    private String tailleCachet;

    private String signature;
    private String tailleSignature;

    private String logoQR;
    private String tailleQR;

    private String message;
    private String tailleMessage;

    private String title;
    private String subtitle;
}
