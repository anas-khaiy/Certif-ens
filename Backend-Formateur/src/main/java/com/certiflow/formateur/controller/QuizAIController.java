package com.certiflow.formateur.controller;

import com.certiflow.formateur.service.QuizAIService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/ai")
@RequiredArgsConstructor
public class QuizAIController {

    private final QuizAIService quizAIService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @PostMapping(value = "/generate-quiz", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<JsonNode> generateQuiz(@RequestBody java.util.Map<String, Object> payload) {
        String topic = (String) payload.getOrDefault("topic", "");
        int count = ((Number) payload.getOrDefault("count", 5)).intValue();

        String questionsJson = quizAIService.generateQuestions(topic, count);
        try {
            // Parse the JSON string into a real JSON node so Spring won't double-encode it
            JsonNode node = objectMapper.readTree(questionsJson);
            return ResponseEntity.ok(node);
        } catch (Exception e) {
            // If parsing fails, return a proper error JSON object
            try {
                JsonNode errorNode = objectMapper.readTree("{\"error\": \"Invalid JSON from AI service\"}");
                return ResponseEntity.ok(errorNode);
            } catch (Exception ex) {
                return ResponseEntity.internalServerError().build();
            }
        }
    }

    @PostMapping(value = "/generate-content", produces = MediaType.TEXT_PLAIN_VALUE)
    public ResponseEntity<String> generateContent(@RequestBody java.util.Map<String, String> payload) {
        String prompt = payload.getOrDefault("prompt", "");
        if (prompt.trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Prompt cannot be empty");
        }

        String markdownContent = quizAIService.generateContent(prompt);
        return ResponseEntity.ok(markdownContent);
    }
}
