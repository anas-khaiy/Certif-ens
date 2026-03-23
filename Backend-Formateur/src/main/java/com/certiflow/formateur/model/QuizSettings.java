package com.certiflow.formateur.model;

import jakarta.persistence.Embeddable;
import lombok.*;

@Embeddable
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuizSettings {
    @Builder.Default
    private String mode = "manual";

    @Builder.Default
    private Integer aiGeneratedCount = 10;

    @Builder.Default
    private Integer totalQuestions = 5;

    @Builder.Default
    private Integer qcuCount = 3;

    @Builder.Default
    private Integer qcmCount = 2;

    @Builder.Default
    private Integer openCount = 0;

    @Builder.Default
    private Integer passingScore = 70;

    @Builder.Default
    private Integer timeLimit = 60;

    @Builder.Default
    private Boolean isAiDetectionEnabled = false;

    @Builder.Default
    private String aiDetectionType = "backend";

    @Builder.Default
    private Boolean isRandom = false;

    // --- Cheating Detection Controls (trainer-configurable) ---
    @Builder.Default
    private Boolean detectPhone = true;

    @Builder.Default
    private Boolean detectMultiplePersons = true;

    @Builder.Default
    private Boolean detectForbiddenObjects = true;

    @Builder.Default
    private Boolean detectLookingAway = true;

    @Builder.Default
    private Boolean detectTabSwitch = true;

    @Builder.Default
    private Boolean detectFullscreenExit = true;

    @Builder.Default
    private Boolean detectWindowBlur = true;
}
