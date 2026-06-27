package com.certiflow.coordinateur.service;

import com.certiflow.coordinateur.model.Coordinateur;
import com.certiflow.coordinateur.model.CoordinateurSetting;
import com.certiflow.coordinateur.repository.CoordinateurRepository;
import com.certiflow.coordinateur.repository.CoordinateurSettingRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Transactional
public class SystemSettingService {

    private final CoordinateurSettingRepository coordinateurSettingRepository;
    private final CoordinateurRepository coordinateurRepository;

    public SystemSettingService(CoordinateurSettingRepository coordinateurSettingRepository,
                                CoordinateurRepository coordinateurRepository) {
        this.coordinateurSettingRepository = coordinateurSettingRepository;
        this.coordinateurRepository = coordinateurRepository;
    }

    public Map<String, String> getSettingsMapByCoordinateurId(Long coordinateurId) {
        return coordinateurSettingRepository.findByCoordinateurId(coordinateurId).stream()
                .collect(Collectors.toMap(CoordinateurSetting::getSettingKey, CoordinateurSetting::getSettingValue));
    }

    public void saveSettingsByCoordinateurId(Long coordinateurId, Map<String, String> settings) {
        Coordinateur coordinateur = coordinateurRepository.findById(coordinateurId)
                .orElseThrow(() -> new RuntimeException("Coordinateur non trouvé"));

        for (Map.Entry<String, String> entry : settings.entrySet()) {
            CoordinateurSetting existing = coordinateurSettingRepository
                    .findByCoordinateurIdAndSettingKey(coordinateurId, entry.getKey())
                    .orElse(null);

            if (existing != null) {
                existing.setSettingValue(entry.getValue());
                coordinateurSettingRepository.save(existing);
            } else {
                CoordinateurSetting setting = CoordinateurSetting.builder()
                        .coordinateur(coordinateur)
                        .settingKey(entry.getKey())
                        .settingValue(entry.getValue())
                        .build();
                coordinateurSettingRepository.save(setting);
            }
        }
    }
}
