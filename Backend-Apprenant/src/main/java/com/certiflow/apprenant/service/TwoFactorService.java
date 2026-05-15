package com.certiflow.apprenant.service;

import com.warrenstrange.googleauth.GoogleAuthenticator;
import com.warrenstrange.googleauth.GoogleAuthenticatorKey;
import com.warrenstrange.googleauth.GoogleAuthenticatorQRGenerator;
import org.springframework.stereotype.Service;

@Service
public class TwoFactorService {

    private final GoogleAuthenticator gAuth = new GoogleAuthenticator();

    public String generateNewSecret() {
        final GoogleAuthenticatorKey key = gAuth.createCredentials();
        return key.getKey();
    }

    public String getQrCodeUrl(String secret, String email) {
        return GoogleAuthenticatorQRGenerator.getOtpAuthURL("CertiFlow", email, 
                new GoogleAuthenticatorKey.Builder(secret).build());
    }

    public boolean isOtpValid(String secret, int code) {
        return gAuth.authorize(secret, code);
    }
}
