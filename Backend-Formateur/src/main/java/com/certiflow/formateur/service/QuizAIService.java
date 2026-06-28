package com.certiflow.formateur.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import com.certiflow.formateur.model.SystemSetting;
import com.certiflow.formateur.repository.SystemSettingRepository;
import org.springframework.beans.factory.annotation.Autowired;

@Service
public class QuizAIService {

    @Autowired
    private SystemSettingRepository systemSettingRepository;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    private String getModelName() {
        Optional<SystemSetting> setting = systemSettingRepository.findById("OLLAMA_MODEL");
        if (setting.isPresent() && setting.get().getSettingValue() != null) {
            return setting.get().getSettingValue();
        }
        return System.getenv("OLLAMA_MODEL") != null ? System.getenv("OLLAMA_MODEL") : "mistral";
    }

    public String generateQuestions(String topic, int count) {
        String ollamaBase = System.getenv("OLLAMA_URL") != null
                ? System.getenv("OLLAMA_URL")
                : "http://192.168.20.25:11434";
        String url = ollamaBase + "/api/generate";

        String prompt = String.format(
                "Tu es un expert pédagogique. Génère un quiz de %d questions techniques basé UNIQUEMENT sur ce contenu : '%s'.\n"
                        + "FORMAT DE RÉPONSE OBLIGATOIRE (JSON pur, sans texte avant ni après) :\n"
                        + "{\n"
                        + "  \"questions\": [\n"
                        + "    {\n"
                        + "      \"type\": \"QCU\" ou \"QCM\",\n"
                        + "      \"text\": \"énoncé de la question\",\n"
                        + "      \"options\": [\"Choix 1\", \"Choix 2\", \"Choix 3\", \"Choix 4\"],\n"
                        + "      \"correctAnswers\": [0]\n"
                        + "    }\n"
                        + "  ]\n"
                        + "}\n"
                        + "RÈGLES :\n"
                        + "- correctAnswers doit contenir UNIQUEMENT des entiers (indices commençant par 0).\n"
                        + "- Si plusieurs réponses sont correctes, type = \"QCM\". Sinon, type = \"QCU\".\n"
                        + "- NE DONNE RIEN d'autre que l'objet JSON.",
                count, topic);

        Map<String, Object> body = new HashMap<>();
        String model = getModelName();
        body.put("model", model);
        body.put("prompt", prompt);
        body.put("stream", false);
        body.put("format", "json");

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);
            if (response.getStatusCode() == HttpStatus.OK) {
                JsonNode root = objectMapper.readTree(response.getBody());
                JsonNode responseNode = root.get("response");

                String jsonContent;
                if (responseNode.isTextual()) {
                    jsonContent = responseNode.asText();
                } else {
                    jsonContent = objectMapper.writeValueAsString(responseNode);
                }

                jsonContent = extractJsonBlock(jsonContent);
                objectMapper.readTree(jsonContent);
                return jsonContent;
            } else {
                Map<String, String> errorMap = new HashMap<>();
                errorMap.put("error", "Ollama status: " + response.getStatusCode());
                return objectMapper.writeValueAsString(errorMap);
            }
        } catch (Exception e) {
            try {
                Map<String, String> errorMap = new HashMap<>();
                errorMap.put("error", "Ollama error: " + e.getMessage());
                return objectMapper.writeValueAsString(errorMap);
            } catch (Exception ex) {
                return "{\"error\": \"Critical AI communication failure\"}";
            }
        }
    }

    public String generateContent(String query) {
        String ollamaBase = System.getenv("OLLAMA_URL") != null
                ? System.getenv("OLLAMA_URL")
                : "http://192.168.20.25:11434";
        String url = ollamaBase + "/api/generate";

        String prompt = String.format(
                "Tu es un expert pédagogique. Rédige le contenu détaillé d'une leçon sur le sujet suivant: '%s'. "
                        + "Fournis UNIQUEMENT le contenu final formaté en balises HTML valides (utilise <h1>, <h2>, <p>, <ul>, <li>, <strong>, et <pre><code> pour les extraits de code). "
                        + "NE DONNE SURTOUT PAS de Markdown (n'utilise pas # ou ```). Ne mets pas de balises <html>, <head> ou <body>, donne uniquement le contenu. "
                        + "Ne dis pas 'Voici le contenu' ou de phrases d'introduction. Renvoie strictement l'HTML pur prêt à être affiché.",
                query);

        Map<String, Object> body = new HashMap<>();
        String model = getModelName();
        body.put("model", model);
        body.put("prompt", prompt);
        body.put("stream", false);
        body.put("format", ""); // No JSON format constraint, we want Markdown text

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);
            if (response.getStatusCode() == HttpStatus.OK) {
                JsonNode root = objectMapper.readTree(response.getBody());
                JsonNode responseNode = root.get("response");
                return responseNode != null ? responseNode.asText() : "";
            } else {
                return "Erreur du modèle IA: HTTP " + response.getStatusCode();
            }
        } catch (Exception e) {
            return "Une erreur est survenue lors de la communication avec l'IA: " + e.getMessage();
        }
    }

    /**
     * Extracts the first valid JSON object block from a string that may contain extra surrounding text.
     */
    private String extractJsonBlock(String text) {
        if (text == null || text.isBlank()) return "{}";
        int start = text.indexOf('{');
        int end = text.lastIndexOf('}');
        if (start != -1 && end != -1 && end > start) {
            return text.substring(start, end + 1);
        }
        return text;
    }
}
