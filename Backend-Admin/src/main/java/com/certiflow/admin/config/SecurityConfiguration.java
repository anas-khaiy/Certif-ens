package com.certiflow.admin.config;

import com.certiflow.admin.security.JwtAuthenticationFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfiguration {

        private final JwtAuthenticationFilter jwtAuthFilter;
        private final AuthenticationProvider authenticationProvider;

        public SecurityConfiguration(JwtAuthenticationFilter jwtAuthFilter,
                        AuthenticationProvider authenticationProvider) {
                this.jwtAuthFilter = jwtAuthFilter;
                this.authenticationProvider = authenticationProvider;
        }

        @Bean
        public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
                http
                                .csrf(AbstractHttpConfigurer::disable)
                                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                                .authorizeHttpRequests(auth -> auth
                                                .requestMatchers(org.springframework.http.HttpMethod.OPTIONS, "/**").permitAll()
                                                .requestMatchers("/api/v1/auth/authenticate", "/api/v1/auth/register",
                                                                "/api/v1/auth/forgot-password",
                                                                "/api/v1/auth/verify-reset-code",
                                                                "/api/v1/auth/reset-password")
                                                .permitAll()
                                                .requestMatchers("/api/v1/files/profiles/**",
                                                                "/api/v1/files/certificates/**")
                                                .permitAll()
                                                .requestMatchers("/api/v1/stats/**", "/api/v1/prototypes/**")
                                                .permitAll()
                                                .requestMatchers("/api/v1/excel/**", "/api/v1/debug/**").permitAll()
                                                .requestMatchers("/error").permitAll()
                                                .requestMatchers("/api/v1/auth/photo", "/api/v1/auth/profile",
                                                                "/api/v1/auth/password",
                                                                "/api/v1/auth/me")
                                                .authenticated()
                                                .anyRequest().authenticated())

                                .sessionManagement(session -> session
                                                .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                                .authenticationProvider(authenticationProvider)
                                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

                return http.build();
        }

        @Bean
        public CorsConfigurationSource corsConfigurationSource() {
                CorsConfiguration configuration = new CorsConfiguration();
                // Use allowedOriginPatterns for more flexibility with localhost, internal IPs and server IPs
                configuration.setAllowedOriginPatterns(List.of(
                                "http://localhost",
                                "http://localhost:*",
                                "https://localhost",
                                "https://localhost:*",
                                "http://127.0.0.1",
                                "http://127.0.0.1:*",
                                "https://127.0.0.1:*",
                                "http://192.168.22.*:*",
                                "http://192.168.100.16:*",
                                "https://192.168.100.16:*",
                                "http://10.10.10.*:*",
                                "http://10.10.10.2:*",
                                "http://217.65.145.127:*",
                                "https://217.65.145.127:*"));
                configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
                configuration.setAllowedHeaders(List.of("*"));
                configuration.setExposedHeaders(List.of("Set-Cookie", "Authorization"));
                configuration.setAllowCredentials(true);
                UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
                source.registerCorsConfiguration("/**", configuration);
                return source;
        }

}
