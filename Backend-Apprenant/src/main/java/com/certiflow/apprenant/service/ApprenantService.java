package com.certiflow.apprenant.service;

import com.certiflow.apprenant.model.Apprenant;
import com.certiflow.apprenant.repository.ApprenantRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class ApprenantService {

    private final ApprenantRepository apprenantRepository;
    private final PasswordEncoder passwordEncoder;

    public ApprenantService(ApprenantRepository apprenantRepository, PasswordEncoder passwordEncoder) {
        this.apprenantRepository = apprenantRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public Optional<Apprenant> findByEmail(String email) {
        return apprenantRepository.findByEmail(email);
    }

    public Apprenant updateProfile(Apprenant apprenant) {
        return apprenantRepository.save(apprenant);
    }
}
