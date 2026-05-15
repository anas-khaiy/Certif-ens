package com.certiflow.admin.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOrigins("http://localhost:5173", "http://localhost:5174", "https://localhost:5173", "https://localhost:5174", "http://192.168.100.16", "http://192.168.100.16:5173", "http://192.168.100.16:5174", "http://192.168.100.16:5175", "https://192.168.100.16", "https://192.168.100.16:5443", "https://192.168.100.16:5444", "https://192.168.100.16:5445")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true);
    }
}
