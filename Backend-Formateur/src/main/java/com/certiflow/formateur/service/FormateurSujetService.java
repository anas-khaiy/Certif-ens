package com.certiflow.formateur.service;

import com.certiflow.formateur.model.Enseignant;
import com.certiflow.formateur.model.Sujet;
import com.certiflow.formateur.model.SujetPropositionConfig;
import com.certiflow.formateur.repository.EnseignantRepository;
import com.certiflow.formateur.repository.SujetPropositionConfigRepository;
import com.certiflow.formateur.repository.SujetRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class FormateurSujetService {

    private final SujetRepository sujetRepository;
    private final SujetPropositionConfigRepository configRepository;
    private final EnseignantRepository enseignantRepository;

    public FormateurSujetService(SujetRepository sujetRepository,
                                 SujetPropositionConfigRepository configRepository,
                                 EnseignantRepository enseignantRepository) {
        this.sujetRepository = sujetRepository;
        this.configRepository = configRepository;
        this.enseignantRepository = enseignantRepository;
    }

    public SujetPropositionConfig getConfigForFormateur(String email) {
        Enseignant formateur = enseignantRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Formateur not found"));
        return configRepository.findByFormateursConcernesContains(formateur).orElse(null);
    }

    public List<Sujet> getProposedSujets(String email) {
        Enseignant formateur = enseignantRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Formateur not found"));
        return sujetRepository.findByFormateurId(formateur.getId());
    }

    public Sujet proposeSujet(String email, String titre, String description, List<String> objectifs) {
        Enseignant formateur = enseignantRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Formateur not found"));

        SujetPropositionConfig config = configRepository.findByFormateursConcernesContains(formateur)
                .orElseThrow(() -> new RuntimeException("Vous n'êtes pas autorisé à proposer des sujets pour le moment."));

        // Check quota
        long currentCount = sujetRepository.countByFormateurId(formateur.getId());
        if (currentCount >= config.getNombreSujetsParFormateur()) {
            throw new RuntimeException("Vous avez atteint la limite de " + config.getNombreSujetsParFormateur() + " sujets proposés.");
        }

        Sujet sujet = new Sujet();
        sujet.setTitre(titre);
        sujet.setDescription(description);
        sujet.setObjectifs(objectifs);
        sujet.setFormateur(formateur);

        return sujetRepository.save(sujet);
    }
}
