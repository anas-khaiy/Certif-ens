package com.certiflow.coordinateur.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Entity
@Table(name = "sub_sections")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties(ignoreUnknown = true)
public class SubSection {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;

    @Column(columnDefinition = "TEXT")
    private String content;

    /** Legacy single-video field — kept for backward compatibility. */
    private String videoUrl;

    /**
     * Stores multiple YouTube video URLs as a newline-delimited TEXT column.
     * The JSON serialisation exposes this as a List<String> to the frontend.
     */
    @Column(name = "video_urls", columnDefinition = "TEXT")
    private String videoUrlsRaw;

    private int orderIndex;

    @ManyToOne
    @JoinColumn(name = "section_id")
    @JsonIgnore
    private Section section;

    @OneToOne(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "quiz_id")
    private Quiz quiz;

    @Column(name = "is_tp")
    @Builder.Default
    @com.fasterxml.jackson.annotation.JsonProperty("isTp")
    private Boolean isTp = false;

    // Explicit getter/setter to handle Boolean naming issues with "is" prefix
    public Boolean getIsTp() {
        return isTp;
    }

    public void setIsTp(Boolean isTp) {
        this.isTp = isTp;
    }

    @Column(name = "tp_prompt", columnDefinition = "TEXT")
    private String tpPrompt;

    // ---- JSON-visible list <-> raw string conversion ----

    /** Called by Jackson when serialising to JSON (→ frontend). */
    public List<String> getVideoUrls() {
        if (videoUrlsRaw != null && !videoUrlsRaw.isBlank()) {
            return Arrays.stream(videoUrlsRaw.split("\n"))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .collect(Collectors.toList());
        }
        // Fall back to legacy single-URL field so old courses still show their video
        if (videoUrl != null && !videoUrl.isBlank()) {
            return List.of(videoUrl);
        }
        return Collections.emptyList();
    }

    /** Called by Jackson when deserialising from JSON (← frontend). */
    public void setVideoUrls(List<String> urls) {
        if (urls == null || urls.isEmpty()) {
            this.videoUrlsRaw = null;
        } else {
            this.videoUrlsRaw = urls.stream()
                    .filter(u -> u != null && !u.isBlank())
                    .collect(Collectors.joining("\n"));
            // Keep the legacy field in sync with the first URL
            this.videoUrl = urls.stream().filter(u -> u != null && !u.isBlank()).findFirst().orElse(null);
        }
    }
}
