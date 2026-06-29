package com.certiflow.admin.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOrigins(
                        "http://localhost:5173", 
                        "http://localhost:5174", 
                        "http://localhost:5175",
                        "https://localhost:5173", 
                        "https://localhost:5174",
                        "https://localhost:5175",
                        "http://217.65.145.127",
                        "https://217.65.145.127",
                        "https://217.65.145.127:5443",
                        "https://217.65.145.127:5444",
                        "https://217.65.145.127:5445",
                        "http://localhost:5443",
                        "http://localhost:5444",
                        "http://localhost:5445",
                        "http://localhost:6173",
                        "http://localhost:6174",
                        "http://localhost:6175",
                        "http://localhost:6176",
                        "http://localhost:9091",
                        "http://localhost:9092",
                        "http://localhost:9093",
                        "http://localhost:9094"
                )
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true);
    }
}
