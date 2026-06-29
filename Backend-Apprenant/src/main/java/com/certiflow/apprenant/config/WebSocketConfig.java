package com.certiflow.apprenant.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Lazy;
import org.springframework.lang.NonNull;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(@NonNull MessageBrokerRegistry config) {
        // Enable heartbeats (10s) - requires a task scheduler for SimpleBroker
        config.enableSimpleBroker("/topic", "/queue")
              .setHeartbeatValue(new long[] {10000, 10000})
              .setTaskScheduler(heartbeatTaskScheduler());
        
        config.setApplicationDestinationPrefixes("/app");
    }

    @Bean
    @Lazy
    public ThreadPoolTaskScheduler heartbeatTaskScheduler() {
        ThreadPoolTaskScheduler scheduler = new ThreadPoolTaskScheduler();
        scheduler.setPoolSize(1);
        scheduler.setThreadNamePrefix("ws-heartbeat-");
        return scheduler;
    }

    @Override
    public void registerStompEndpoints(@NonNull StompEndpointRegistry registry) {
        // Native WebSocket endpoint (used by @stomp/stompjs with brokerURL: ws://...)
                registry.addEndpoint("/ws")
                .setAllowedOrigins(
                    "http://localhost:5173", "http://localhost:5174", "http://localhost:5175",
                    "http://127.0.0.1:5173", "http://127.0.0.1:5174", "http://127.0.0.1:5175",
                    "http://217.65.145.127", "http://217.65.145.127:5173", "http://217.65.145.127:5174", "http://217.65.145.127:5175",
                    "https://217.65.145.127", "https://217.65.145.127:5443", "https://217.65.145.127:5444", "https://217.65.145.127:5445",
                    "http://localhost:6173", "http://localhost:6174", "http://localhost:6175", "http://localhost:6176",
                    "http://localhost:9091", "http://localhost:9092", "http://localhost:9093", "http://localhost:9094"
                )
                .setAllowedOriginPatterns("*");
        
        // SockJS fallback endpoint (if the browser falls back to HTTP)
        registry.addEndpoint("/ws-sockjs")
                .setAllowedOrigins(
                    "http://localhost:5173", "http://localhost:5174", "http://localhost:5175",
                    "http://127.0.0.1:5173", "http://127.0.0.1:5174", "http://127.0.0.1:5175",
                    "http://217.65.145.127", "http://217.65.145.127:5173", "http://217.65.145.127:5174", "http://217.65.145.127:5175",
                    "https://217.65.145.127", "https://217.65.145.127:5443", "https://217.65.145.127:5444", "https://217.65.145.127:5445",
                    "http://localhost:6173", "http://localhost:6174", "http://localhost:6175", "http://localhost:6176",
                    "http://localhost:9091", "http://localhost:9092", "http://localhost:9093", "http://localhost:9094"
                )
                .setAllowedOriginPatterns("*")
                .withSockJS();
    }
}
