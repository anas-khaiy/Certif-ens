package com.certiflow.apprenant.config;

import com.certiflow.apprenant.model.Apprenant;
import com.certiflow.apprenant.repository.ApprenantRepository;
import com.certiflow.apprenant.repository.EnseignantRepository;
import org.springframework.boot.autoconfigure.jackson.Jackson2ObjectMapperBuilderCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import com.fasterxml.jackson.core.StreamReadConstraints;

@Configuration
public class ApplicationConfig {

    private final ApprenantRepository repository;
    private final EnseignantRepository enseignantRepository;

    public ApplicationConfig(ApprenantRepository repository, EnseignantRepository enseignantRepository) {
        this.repository = repository;
        this.enseignantRepository = enseignantRepository;
    }

    @Bean
    public UserDetailsService userDetailsService() {
        return username -> repository.findByEmail(username)
                .map(UserDetails.class::cast)
                .orElseGet(() -> enseignantRepository.findByEmail(username)
                        .map(trainer -> {
                            // Automatically sync trainer to apprenants table to allow catalog access & enrollment
                            Apprenant shadow = Apprenant.builder()
                                    .email(trainer.getEmail())
                                    .nom(trainer.getNom())
                                    .prenom(trainer.getPrenom())
                                    .motDePasse(trainer.getMotDePasse())
                                    .specialite(trainer.getSpecialite())
                                    .photoProfile(trainer.getPhotoProfile())
                                    .build();
                            return repository.save(shadow);
                        })
                        .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + username)));
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService());
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public Jackson2ObjectMapperBuilderCustomizer jacksonCustomizer() {
        return builder -> {
            StreamReadConstraints.overrideDefaultStreamReadConstraints(
                    StreamReadConstraints.builder()
                            .maxStringLength(100_000_000) // 100 MB
                            .build());
        };
    }
}
