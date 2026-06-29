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
                        "http://192.168.20.25:5173", 
                        "http://192.168.20.25:5174", 
                        "http://192.168.20.25:5175",
                        "https://192.168.20.25:5173", 
                        "https://192.168.20.25:5174",
                        "https://192.168.20.25:5175",
                        "http://217.65.145.127",
                        "https://217.65.145.127",
                        "https://217.65.145.127:5443",
                        "https://217.65.145.127:5444",
                        "https://217.65.145.127:5445",
                        "http://192.168.20.25:5443",
                        "http://192.168.20.25:5444",
                        "http://192.168.20.25:5445",
                        "http://192.168.20.25:6173",
                        "http://192.168.20.25:6174",
                        "http://192.168.20.25:6175",
                        "http://192.168.20.25:6176",
                        "http://192.168.20.25:9091",
                        "http://192.168.20.25:9092",
                        "http://192.168.20.25:9093",
                        "http://192.168.20.25:9094"
                )
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true);
    }
}
