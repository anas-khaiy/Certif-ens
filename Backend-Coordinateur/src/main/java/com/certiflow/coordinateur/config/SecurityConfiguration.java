package com.certiflow.coordinateur.config;

import com.certiflow.coordinateur.security.JwtAuthenticationFilter;
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

import jakarta.servlet.http.HttpServletResponse;
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
                                                // Allow trainer login and password reset
                                                .requestMatchers("/api/v1/coord/auth/authenticate",
                                                                "/api/v1/coord/auth/forgot-password",
                                                                "/api/v1/coord/auth/verify-reset-code",
                                                                "/api/v1/coord/auth/reset-password").permitAll()
                                                // Allow serving profile & certificate images without auth
                                                .requestMatchers("/api/v1/files/profiles/**",
                                                                "/api/v1/files/certificates/**")
                                                .permitAll()
                                                // Allow fetching specialities and formations without authentication
                                                .requestMatchers("/api/v1/specialites", "/api/v1/formations").permitAll()
                                                // Allow admin cross-service requests
                                                .requestMatchers("/api/v1/bundles", "/api/v1/bundles/admin/**", "/api/v1/courses/all").permitAll()
                                                // Allow serving content images without auth (needed for <img> tags in lesson content)
                                                .requestMatchers("/api/v1/files/content-images/**").permitAll()
                                                // Allow LiveKit token generation without auth — secured by LiveKit API key/secret
                                                .requestMatchers("/api/v1/livekit/**").permitAll()
                                                // Allow certificate verification without auth
                                                .requestMatchers("/api/v1/verify/**").permitAll()
                                                // Allow error page
                                                .requestMatchers("/error").permitAll()
                                                // Explicitly require authentication for auth/me and other auth endpoints
                                                .requestMatchers("/api/v1/coord/auth/me", "/api/v1/coord/auth/profile").authenticated()
                                                // Everything else requires authentication
                                                .anyRequest().authenticated())
                                .sessionManagement(session -> session
                                                .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                                .authenticationProvider(authenticationProvider)
                                .exceptionHandling(ex -> ex
                                                .authenticationEntryPoint((request, response, authException) -> {
                                                        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                                                        response.getWriter().write("Unauthenticated: " + authException.getMessage());
                                                }))
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
