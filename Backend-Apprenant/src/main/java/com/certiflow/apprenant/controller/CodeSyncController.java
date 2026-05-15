package com.certiflow.apprenant.controller;

import lombok.Data;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

@Controller
public class CodeSyncController {

    private static final Logger log = LoggerFactory.getLogger(CodeSyncController.class);

    @Data
    public static class CodeMessage {
        private Long learnerId;
        private String name;
        private String language;
        private String code;
        private boolean online;
    }

    /** Apprenant broadcasts a live code update → relayed to /topic/course/global/code */
    @MessageMapping("/course/global/code")
    @SendTo("/topic/course/global/code")
    public CodeMessage relayCode(CodeMessage message) {
        log.info("Received code update from learner {}: {}", message.getLearnerId(), message.getName());
        return message;
    }

    /** Apprenant broadcasts their presence status → relayed to /topic/course/global/presence */
    @MessageMapping("/course/global/presence")
    @SendTo("/topic/course/global/presence")
    public CodeMessage relayPresence(CodeMessage message) {
        log.info("Received presence update from learner {}: {} (Online: {})", 
                message.getLearnerId(), message.getName(), message.isOnline());
        return message;
    }

    /** Helper to relay correction from formateur to specific apprenant relaying to /topic/course/global/correction/{id} */
    @MessageMapping("/course/global/correction/{learnerId}")
    @SendTo("/topic/course/global/correction/{learnerId}")
    public CodeMessage relayCorrection(@DestinationVariable Long learnerId, CodeMessage message) {
        log.info("Relaying correction to learner {}", learnerId);
        return message;
    }
}
