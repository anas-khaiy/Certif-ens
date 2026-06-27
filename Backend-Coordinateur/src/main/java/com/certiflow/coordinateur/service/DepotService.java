package com.certiflow.coordinateur.service;

import com.certiflow.coordinateur.dto.DepotDto;
import com.certiflow.coordinateur.model.DepotPfe;
import com.certiflow.coordinateur.repository.DepotPfeRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class DepotService {

    private final DepotPfeRepository repository;

    public DepotService(DepotPfeRepository repository) {
        this.repository = repository;
    }

    public List<DepotDto> getAllDepots() {
        return repository.findAllWithDetails().stream().map(this::mapToDto).collect(Collectors.toList());
    }

    public List<DepotDto> getDepotsByCoordinateurId(Long coordinateurId) {
        return repository.findAllWithDetailsByCoordinateurId(coordinateurId).stream().map(this::mapToDto).collect(Collectors.toList());
    }

    private DepotDto mapToDto(DepotPfe depot) {
        String specialite = depot.getApprenant().getSpecialite() != null ? depot.getApprenant().getSpecialite().getNom() : "Non assigné";
        String sujet = depot.getApprenant().getSujetDetails() != null ? depot.getApprenant().getSujetDetails().getTitre() : "Non assigné";

        return DepotDto.builder()
                .id(depot.getId())
                .nomApprenant(depot.getApprenant().getNom())
                .prenomApprenant(depot.getApprenant().getPrenom())
                .specialiteApprenant(specialite)
                .sujetTitre(sujet)
                .typeDepot(depot.getTypeDepot())
                .fichierUrl(depot.getFichierUrl())
                .dateDepot(depot.getDateDepot())
                .build();
    }
}
