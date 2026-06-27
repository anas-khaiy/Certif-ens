package com.certiflow.coordinateur.model;

import jakarta.persistence.*;

@Entity
@Table(name = "certification_prototypes")
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

    public CertificationPrototype() {
    }

    public CertificationPrototype(Long id, String logo, String tailleLogo, String cachet, String tailleCachet,
            String signature, String tailleSignature, String logoQR, String tailleQR, String message,
            String tailleMessage) {
        this.id = id;
        this.logo = logo;
        this.tailleLogo = tailleLogo;
        this.cachet = cachet;
        this.tailleCachet = tailleCachet;
        this.signature = signature;
        this.tailleSignature = tailleSignature;
        this.logoQR = logoQR;
        this.tailleQR = tailleQR;
        this.message = message;
        this.tailleMessage = tailleMessage;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getLogo() {
        return logo;
    }

    public void setLogo(String logo) {
        this.logo = logo;
    }

    public String getTailleLogo() {
        return tailleLogo;
    }

    public void setTailleLogo(String tailleLogo) {
        this.tailleLogo = tailleLogo;
    }

    public String getCachet() {
        return cachet;
    }

    public void setCachet(String cachet) {
        this.cachet = cachet;
    }

    public String getTailleCachet() {
        return tailleCachet;
    }

    public void setTailleCachet(String tailleCachet) {
        this.tailleCachet = tailleCachet;
    }

    public String getSignature() {
        return signature;
    }

    public void setSignature(String signature) {
        this.signature = signature;
    }

    public String getTailleSignature() {
        return tailleSignature;
    }

    public void setTailleSignature(String tailleSignature) {
        this.tailleSignature = tailleSignature;
    }

    public String getLogoQR() {
        return logoQR;
    }

    public void setLogoQR(String logoQR) {
        this.logoQR = logoQR;
    }

    public String getTailleQR() {
        return tailleQR;
    }

    public void setTailleQR(String tailleQR) {
        this.tailleQR = tailleQR;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getTailleMessage() {
        return tailleMessage;
    }

    public void setTailleMessage(String tailleMessage) {
        this.tailleMessage = tailleMessage;
    }
}
