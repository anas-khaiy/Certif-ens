package com.certiflow.apprenant.repository;

import com.certiflow.apprenant.model.CoordinateurSetting;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CoordinateurSettingRepository extends JpaRepository<CoordinateurSetting, Long> {
    List<CoordinateurSetting> findByCoordinateurId(Long coordinateurId);
    Optional<CoordinateurSetting> findByCoordinateurIdAndSettingKey(Long coordinateurId, String settingKey);
}
