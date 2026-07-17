package com.wumbap.wumbap.controller;

import com.wumbap.wumbap.entity.SystemSetting;
import com.wumbap.wumbap.entity.User;
import com.wumbap.wumbap.entity.UserPreference;
import com.wumbap.wumbap.repository.UserRepository;
import com.wumbap.wumbap.service.AuditLogService;
import com.wumbap.wumbap.service.SettingsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/settings")
@RequiredArgsConstructor
public class SettingsController {

    private final SettingsService settingsService;
    private final UserRepository userRepository;
    private final AuditLogService auditLogService;

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<List<SystemSetting>> getSettings() {
        settingsService.initDefaultSettings();
        return ResponseEntity.ok(settingsService.getAllSettings());
    }

    @PostMapping
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<?> updateSettings(@RequestBody Map<String, String> req, Authentication authentication) {
        for (Map.Entry<String, String> entry : req.entrySet()) {
            settingsService.updateSetting(entry.getKey(), entry.getValue());
        }
        auditLogService.log(authentication.getName(), "SETTINGS_UPDATED", "System settings updated: " + req.keySet());
        return ResponseEntity.ok("Settings updated successfully");
    }

    @GetMapping("/preference")
    public ResponseEntity<UserPreference> getUserPreference(Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        return ResponseEntity.ok(settingsService.getOrCreateUserPreference(user));
    }

    @PostMapping("/preference")
    public ResponseEntity<UserPreference> updateUserPreference(@RequestBody Map<String, Object> req, Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        UserPreference pref = settingsService.updateUserPreference(user, req);
        auditLogService.log(user.getEmail(), "PREFERENCES_UPDATED", "User preferences updated: " + req.keySet());
        return ResponseEntity.ok(pref);
    }
}
