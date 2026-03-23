package com.certiflow.apprenant.service;

import com.certiflow.apprenant.model.CertificationPrototype;
import com.certiflow.apprenant.repository.CertificationPrototypeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CertificationPrototypeService {

    private final CertificationPrototypeRepository repository;

    public Optional<CertificationPrototype> getGlobalPrototype() {
        return repository.findFirstByOrderByIdAsc();
    }
}
