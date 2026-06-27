package com.certiflow.apprenant.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "coordinateur_settings", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"coordinateur_id", "setting_key"})
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CoordinateurSetting {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "coordinateur_id", nullable = false)
    private Long coordinateurId;

    @Column(name = "setting_key", nullable = false)
    private String settingKey;

    @Column(name = "setting_value", nullable = false)
    private String settingValue;
}
