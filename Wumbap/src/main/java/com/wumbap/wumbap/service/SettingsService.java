package com.wumbap.wumbap.service;

import com.wumbap.wumbap.entity.SystemSetting;
import com.wumbap.wumbap.entity.User;
import com.wumbap.wumbap.entity.UserPreference;
import com.wumbap.wumbap.repository.SystemSettingRepository;
import com.wumbap.wumbap.repository.UserPreferenceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class SettingsService {

    private final SystemSettingRepository systemSettingRepository;
    private final UserPreferenceRepository userPreferenceRepository;

    public void initDefaultSettings() {
        createSettingIfNotExist("orgName", "HydroBS Enterprise", "Name of the organization", "GENERAL");
        createSettingIfNotExist("waterUnits", "Liters", "Default unit for water measurements (Liters/Gallons)", "GENERAL");
        createSettingIfNotExist("currency", "INR", "Default currency code", "GENERAL");
        createSettingIfNotExist("timezone", "UTC+5:30", "Default timezone", "GENERAL");
        createSettingIfNotExist("theme", "SYSTEM", "Default system-wide theme", "THEME");
        createSettingIfNotExist("billingDay", "1", "Default day of the month for bill generation", "BILLING");
    }

    private void createSettingIfNotExist(String key, String value, String desc, String cat) {
        if (systemSettingRepository.findBySettingKey(key).isEmpty()) {
            SystemSetting setting = SystemSetting.builder()
                    .settingKey(key)
                    .settingValue(value)
                    .description(desc)
                    .category(cat)
                    .build();
            systemSettingRepository.save(setting);
        }
    }

    public List<SystemSetting> getSettingsByCategory(String category) {
        return systemSettingRepository.findByCategory(category);
    }

    public List<SystemSetting> getAllSettings() {
        return systemSettingRepository.findAll();
    }

    public SystemSetting updateSetting(String key, String value) {
        SystemSetting setting = systemSettingRepository.findBySettingKey(key)
                .orElse(SystemSetting.builder().settingKey(key).settingValue(value).build());
        setting.setSettingValue(value);
        return systemSettingRepository.save(setting);
    }

    public UserPreference getOrCreateUserPreference(User user) {
        return userPreferenceRepository.findByUserId(user.getId())
                .orElseGet(() -> {
                    UserPreference pref = UserPreference.builder()
                            .user(user)
                            .theme("SYSTEM")
                            .language("EN")
                            .emailNotifications(true)
                            .pushNotifications(true)
                            .smsNotifications(false)
                            .build();
                    return userPreferenceRepository.save(pref);
                });
    }

    public UserPreference updateUserPreference(User user, Map<String, Object> updates) {
        UserPreference pref = getOrCreateUserPreference(user);
        if (updates.containsKey("theme")) {
            pref.setTheme((String) updates.get("theme"));
        }
        if (updates.containsKey("language")) {
            pref.setLanguage((String) updates.get("language"));
        }
        if (updates.containsKey("emailNotifications")) {
            pref.setEmailNotifications((boolean) updates.get("emailNotifications"));
        }
        if (updates.containsKey("pushNotifications")) {
            pref.setPushNotifications((boolean) updates.get("pushNotifications"));
        }
        if (updates.containsKey("smsNotifications")) {
            pref.setSmsNotifications((boolean) updates.get("smsNotifications"));
        }
        return userPreferenceRepository.save(pref);
    }
}
