package com.certiflow.admin.service;

import com.certiflow.admin.model.CertificationPrototype;
import com.certiflow.admin.repository.CertificationPrototypeRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CertificationPrototypeService {

    private final CertificationPrototypeRepository repository;

    public CertificationPrototypeService(CertificationPrototypeRepository repository) {
        this.repository = repository;
    }

    public List<CertificationPrototype> getAllPrototypes() {
        return repository.findAll();
    }

    public CertificationPrototype getPrototypeById(Long id) {
        return repository.findById(id).orElseThrow(() -> new RuntimeException("Prototype not found"));
    }

    public CertificationPrototype savePrototype(CertificationPrototype prototype) {
        return repository.save(prototype);
    }

    public CertificationPrototype updatePrototype(Long id, CertificationPrototype details) {
        CertificationPrototype prototype = getPrototypeById(id);
        prototype.setLogo(details.getLogo());
        prototype.setTailleLogo(details.getTailleLogo());
        prototype.setCachet(details.getCachet());
        prototype.setTailleCachet(details.getTailleCachet());
        prototype.setSignature(details.getSignature());
        prototype.setTailleSignature(details.getTailleSignature());
        prototype.setLogoQR(details.getLogoQR());
        prototype.setTailleQR(details.getTailleQR());
        prototype.setMessage(details.getMessage());
        prototype.setTailleMessage(details.getTailleMessage());
        prototype.setTitle(details.getTitle());
        prototype.setSubtitle(details.getSubtitle());
        return repository.save(prototype);
    }

    public void deletePrototype(Long id) {
        repository.deleteById(id);
    }
}
