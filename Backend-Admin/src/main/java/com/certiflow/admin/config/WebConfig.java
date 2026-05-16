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
                        "https://srv1674744.hstgr.cloud",
                        "https://srv1674744.hstgr.cloud:5173",
                        "https://srv1674744.hstgr.cloud:5174",
                        "https://srv1674744.hstgr.cloud:5175",
                        "https://srv1674744.hstgr.cloud:5443",
                        "https://srv1674744.hstgr.cloud:5444",
                        "https://srv1674744.hstgr.cloud:5445"
                )
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true);
    }
}
