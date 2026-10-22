package com.certiflow.formateur.controller;

import com.certiflow.formateur.service.QuizAIService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@RestController
@RequestMapping("/api/v1/ai")
@RequiredArgsConstructor
public class QuizAIController {

    private final QuizAIService quizAIService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private static final ExecutorService SSE_EXECUTOR = Executors.newCachedThreadPool(r -> {
        Thread t = new Thread(r, "ai-sse");
        t.setDaemon(true);
        return t;
    });

    private static final long SSE_TIMEOUT_MS = 600_000L; // 10 min

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

    @PostMapping(value = "/generate-content", produces = "text/plain;charset=UTF-8")
    public ResponseEntity<String> generateContent(@RequestBody java.util.Map<String, String> payload) {
        String prompt = payload.getOrDefault("prompt", "");
        if (prompt.trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Prompt cannot be empty");
        }

        String markdownContent = quizAIService.generateContent(prompt);
        return ResponseEntity
                .ok()
                .contentType(new MediaType("text", "plain", StandardCharsets.UTF_8))
                .body(markdownContent);
    }

    // ─── SSE streaming variants (keep proxies alive during slow CPU inference) ──

    @PostMapping(value = "/generate-quiz/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter generateQuizStream(@RequestBody Map<String, Object> payload) {
        String topic = (String) payload.getOrDefault("topic", "");
        int count = ((Number) payload.getOrDefault("count", 5)).intValue();

        SseEmitter emitter = new SseEmitter(SSE_TIMEOUT_MS);
        SSE_EXECUTOR.execute(() -> {
            try {
                String raw = quizAIService.generateQuestionsStream(topic, count, token -> {
                    sendEvent(emitter, "token", token);
                });
                JsonNode node = objectMapper.readTree(extractJson(raw));
                sendEvent(emitter, "done", node.toString());
                emitter.complete();
            } catch (Exception e) {
                sendEvent(emitter, "error", e.getMessage() != null ? e.getMessage() : "AI generation failed");
                emitter.completeWithError(e);
            }
        });
        return emitter;
    }

    @PostMapping(value = "/generate-content/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter generateContentStream(@RequestBody Map<String, String> payload) {
        String prompt = payload.getOrDefault("prompt", "");
        SseEmitter emitter = new SseEmitter(SSE_TIMEOUT_MS);
        if (prompt.trim().isEmpty()) {
            sendEvent(emitter, "error", "Prompt cannot be empty");
            emitter.complete();
            return emitter;
        }
        SSE_EXECUTOR.execute(() -> {
            try {
                String html = quizAIService.generateContentStream(prompt, token -> {
                    sendEvent(emitter, "token", token);
                });
                sendEvent(emitter, "done", html);
                emitter.complete();
            } catch (Exception e) {
                sendEvent(emitter, "error", e.getMessage() != null ? e.getMessage() : "AI generation failed");
                emitter.completeWithError(e);
            }
        });
        return emitter;
    }

    private void sendEvent(SseEmitter emitter, String name, String data) {
        try {
            // JSON-encode so newlines/quotes inside tokens survive the SSE frame
            String json = objectMapper.writeValueAsString(data);
            emitter.send(SseEmitter.event().name(name).data(json));
        } catch (Exception ignored) {
            // client disconnected — stop sending
        }
    }

    private String extractJson(String text) {
        if (text == null || text.isBlank()) return "{}";
        int start = text.indexOf('{');
        int end = text.lastIndexOf('}');
        if (start != -1 && end > start) {
            return text.substring(start, end + 1);
        }
        return text;
    }
}
