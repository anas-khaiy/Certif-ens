package com.certiflow.apprenant.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

@Entity
@Table(name = "apprenants")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Apprenant implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nom;
    private String prenom;

    @Column(unique = true, nullable = false)
    private String email;

    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    @Column(nullable = false)
    private String motDePasse;

    @Column(unique = true)
    private String cin;

    @Builder.Default
    @Column(columnDefinition = "varchar(255) default 'default.png'")
    private String photoProfile = "default.png";

    private String tailleQR;

    @ManyToOne
    @JoinColumn(name = "specialite_id")
    private Specialite specialite;

    @ManyToOne
    @JoinColumn(name = "cycle_id")
    private Cycle cycle;

    @Builder.Default
    @Column(nullable = false, columnDefinition = "boolean default false")
    private boolean mfaEnabled = false;

    @JsonIgnore
    private String mfaSecret;

    @ManyToOne
    @JoinColumn(name = "encadrant_id")
    private Enseignant encadrant;

    @Column(name = "coordinateur_id")
    private Long coordinateurId;

    private java.time.LocalDateTime dateSoutenance;

    @OneToOne(mappedBy = "apprenant")
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties("apprenant")
    private Sujet sujetDetails;

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
        name = "apprenant_examinateurs",
        joinColumns = @JoinColumn(name = "apprenant_id"),
        inverseJoinColumns = @JoinColumn(name = "enseignant_id")
    )
    private java.util.Set<Enseignant> examinateurs;

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
        name = "apprenant_rapporteurs",
        joinColumns = @JoinColumn(name = "apprenant_id"),
        inverseJoinColumns = @JoinColumn(name = "enseignant_id")
    )
    private java.util.Set<Enseignant> rapporteurs;

    @Override
    @JsonIgnore
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_APPRENANT"));
    }

    @Override
    @JsonIgnore
    public String getPassword() {
        return motDePasse;
    }

    @Override
    @JsonIgnore
    public String getUsername() {
        return email;
    }

    @Override
    @JsonIgnore
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    @JsonIgnore
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    @JsonIgnore
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    @JsonIgnore
    public boolean isEnabled() {
        return true;
    }
}
