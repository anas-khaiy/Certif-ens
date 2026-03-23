package com.certiflow.formateur.dto;

public class ProfileUpdateRequest {
    private String nom;
    private String prenom;

    public ProfileUpdateRequest() {
    }

    public ProfileUpdateRequest(String nom, String prenom) {
        this.nom = nom;
        this.prenom = prenom;
    }

    public String getNom() {
        return nom;
    }

    public void setNom(String nom) {
        this.nom = nom;
    }

    public String getPrenom() {
        return prenom;
    }

    public void setPrenom(String prenom) {
        this.prenom = prenom;
    }
}
