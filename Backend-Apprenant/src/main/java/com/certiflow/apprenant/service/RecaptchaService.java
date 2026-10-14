package com.certiflow.apprenant.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Service
public class RecaptchaService {

    @Value("${recaptcha.secret.key:6LeaZu8tAAAAANsQzrTQO4eGM_y96rpksu0u3-Oa}")
    private String secretKey;

    private static final String VERIFY_URL = "https://www.google.com/recaptcha/api/siteverify";

    public boolean verify(String token) {
        if (token == null || token.isBlank()) {
            System.out.println("[reCAPTCHA] token is null or blank");
            return false;
        }
        try {
            String body = "secret=" + URLEncoder.encode(secretKey, StandardCharsets.UTF_8)
                    + "&response=" + URLEncoder.encode(token, StandardCharsets.UTF_8);
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(VERIFY_URL))
                    .header("Content-Type", "application/x-www-form-urlencoded")
                    .POST(HttpRequest.BodyPublishers.ofString(body))
                    .timeout(java.time.Duration.ofSeconds(10))
                    .build();
            HttpClient client = HttpClient.newHttpClient();
            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
            String json = response.body().replaceAll("\\s+", "");
            System.out.println("[reCAPTCHA] verify response: " + json);
            return json.contains("\"success\":true");
        } catch (Exception e) {
            System.err.println("[reCAPTCHA] verification failed: " + e.getMessage());
            return false;
        }
    }
}
