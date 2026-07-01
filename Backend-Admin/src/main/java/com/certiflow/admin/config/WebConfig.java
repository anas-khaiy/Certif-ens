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
                        "http://localhost",
                        "http://localhost:80",
                        "http://localhost:81",
                        "http://localhost:82",
                        "http://localhost:83",
                        "http://localhost:84",
                        "http://localhost:85",
                        "http://localhost:86",
                        "http://localhost:87",
                        "http://localhost:88",
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
