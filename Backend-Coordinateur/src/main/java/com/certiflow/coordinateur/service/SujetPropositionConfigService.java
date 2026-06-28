package com.certiflow.coordinateur.service;

import com.certiflow.coordinateur.model.Coordinateur;
import com.certiflow.coordinateur.model.Enseignant;
import com.certiflow.coordinateur.model.SujetPropositionConfig;
import com.certiflow.coordinateur.repository.CoordinateurRepository;
import com.certiflow.coordinateur.repository.EnseignantRepository;
import com.certiflow.coordinateur.repository.SujetPropositionConfigRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class SujetPropositionConfigService {

    private final SujetPropositionConfigRepository configRepository;
    private final CoordinateurRepository coordinateurRepository;
    private final EnseignantRepository enseignantRepository;

    public SujetPropositionConfigService(SujetPropositionConfigRepository configRepository,
                                         CoordinateurRepository coordinateurRepository,
                                         EnseignantRepository enseignantRepository) {
        this.configRepository = configRepository;
        this.coordinateurRepository = coordinateurRepository;
        this.enseignantRepository = enseignantRepository;
    }

    public SujetPropositionConfig getConfig(Long coordinateurId) {
        return configRepository.findByCoordinateurId(coordinateurId).orElse(null);
    }

    public SujetPropositionConfig saveConfig(Long coordinateurId, int nombreSujets, List<Long> formateurIds) {
        Coordinateur coordinateur = coordinateurRepository.findById(coordinateurId)
                .orElseThrow(() -> new RuntimeException("Coordinateur non trouvé"));

        List<Enseignant> formateurs = enseignantRepository.findAllById(formateurIds);

        SujetPropositionConfig config = configRepository.findByCoordinateurId(coordinateurId)
                .orElse(new SujetPropositionConfig());

        config.setCoordinateur(coordinateur);
        config.setNombreSujetsParFormateur(nombreSujets);
        config.setFormateursConcernes(formateurs);

        return configRepository.save(config);
    }
}
