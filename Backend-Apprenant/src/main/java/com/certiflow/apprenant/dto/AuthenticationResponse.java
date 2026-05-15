package com.certiflow.apprenant.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AuthenticationResponse {
    private Long id;
    private String token;
    private String email;
    private String nom;
    private String prenom;
    private String role;
    private String photoProfile;
    private String specialite;
    private boolean mfaEnabled;
    private boolean mfaRequired;
}
