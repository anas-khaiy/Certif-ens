package com.certiflow.admin.controller;

import com.certiflow.admin.model.SystemSetting;
import com.certiflow.admin.repository.SystemSettingRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/v1/admin/settings")
public class SettingsController {

    @Autowired
    private SystemSettingRepository systemSettingRepository;

    @GetMapping("/{key}")
    public ResponseEntity<?> getSetting(@PathVariable String key) {
        Optional<SystemSetting> setting = systemSettingRepository.findById(key);
        if (setting.isPresent()) {
            return ResponseEntity.ok(Map.of("key", setting.get().getSettingKey(), "value", setting.get().getSettingValue()));
        }
        return ResponseEntity.notFound().build();
    }

    @PostMapping("/{key}")
    public ResponseEntity<?> updateSetting(@PathVariable String key, @RequestBody Map<String, String> payload) {
        String value = payload.get("value");
        if (value == null) {
            return ResponseEntity.badRequest().body("Value is required");
        }
        SystemSetting setting = new SystemSetting(key, value);
        systemSettingRepository.save(setting);
        return ResponseEntity.ok(Map.of("message", "Setting updated", "key", key, "value", value));
    }
}
