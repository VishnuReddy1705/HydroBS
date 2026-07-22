package com.wumbap.wumbap.controller;

import com.wumbap.wumbap.entity.Announcement;
import com.wumbap.wumbap.entity.Community;
import com.wumbap.wumbap.entity.Role;
import com.wumbap.wumbap.entity.User;
import com.wumbap.wumbap.repository.CommunityRepository;
import com.wumbap.wumbap.repository.UserRepository;
import com.wumbap.wumbap.service.AnnouncementService;
import com.wumbap.wumbap.service.AuditLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/announcements")
@RequiredArgsConstructor
public class AnnouncementController {

    private final AnnouncementService announcementService;
    private final UserRepository userRepository;
    private final CommunityRepository communityRepository;
    private final AuditLogService auditLogService;

    @GetMapping
    public ResponseEntity<?> getAnnouncements(Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<Announcement> announcements = new ArrayList<>();

        if (user.getRole() == Role.SUPER_ADMIN) {
            announcements = announcementService.getAllAnnouncements();
        } else if (user.getRole() == Role.ADMIN) {
            if (user.getCommunity() != null) {
                announcements.addAll(announcementService.getCommunityAnnouncements(user.getCommunity().getId()));
            }
            announcements.addAll(announcementService.getGlobalAnnouncements());
        } else { // Resident
            if (user.getCommunity() != null) {
                List<Announcement> communityAnnouncements = announcementService.getCommunityAnnouncements(user.getCommunity().getId());
                List<Announcement> targeted = communityAnnouncements.stream()
                        .filter(a -> {
                            String aud = a.getAudience();
                            if (aud == null || "Entire Community".equalsIgnoreCase(aud) || "COMMUNITY".equalsIgnoreCase(aud)) {
                                return true;
                            }
                            if ("Selected Buildings".equalsIgnoreCase(aud) || "BUILDING".equalsIgnoreCase(aud)) {
                                if (a.getTargetBuildings() == null || user.getBuilding() == null) return false;
                                return java.util.Arrays.stream(a.getTargetBuildings().split(","))
                                        .map(String::trim)
                                        .anyMatch(b -> b.equalsIgnoreCase(user.getBuilding().trim()));
                            }
                            if ("Selected Flats".equalsIgnoreCase(aud) || "FLAT".equalsIgnoreCase(aud)) {
                                if (a.getTargetFlats() == null || user.getFlatNumber() == null) return false;
                                return java.util.Arrays.stream(a.getTargetFlats().split(","))
                                        .map(String::trim)
                                        .anyMatch(f -> f.equalsIgnoreCase(user.getFlatNumber().trim()));
                            }
                            if ("Selected Residents".equalsIgnoreCase(aud) || "RESIDENT".equalsIgnoreCase(aud)) {
                                if (a.getTargetResidents() == null) return false;
                                return java.util.Arrays.stream(a.getTargetResidents().split(","))
                                        .map(String::trim)
                                        .anyMatch(r -> r.equalsIgnoreCase(user.getEmail().trim()) || r.equals(user.getId().toString()));
                            }
                            return true;
                        })
                        .toList();
                announcements.addAll(targeted);
            }
            announcements.addAll(announcementService.getGlobalAnnouncements());
        }

        return ResponseEntity.ok(announcements);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<?> createAnnouncement(@RequestBody Map<String, Object> req, Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        String title = (String) req.get("title");
        String content = (String) req.get("content");

        if (title == null || title.trim().isEmpty() || content == null || content.trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Title and content are required");
        }

        Community community = null;
        if (user.getRole() == Role.ADMIN) {
            community = user.getCommunity();
        } else if (user.getRole() == Role.SUPER_ADMIN && req.get("communityId") != null) {
            Long communityId = Long.valueOf(req.get("communityId").toString());
            community = communityRepository.findById(communityId).orElse(null);
        }

        LocalDateTime expiryDate = null;
        if (req.get("expiryDate") != null) {
            try {
                String expStr = req.get("expiryDate").toString();
                if (expStr.contains("Z")) {
                    expiryDate = java.time.Instant.parse(expStr).atZone(java.time.ZoneId.systemDefault()).toLocalDateTime();
                } else if (expStr.length() >= 19) {
                    expiryDate = LocalDateTime.parse(expStr.substring(0, 19));
                }
            } catch (Exception e) {
                expiryDate = LocalDateTime.now().plusDays(7);
            }
        }

        String priority = req.get("priority") != null ? (String) req.get("priority") : "NORMAL";
        String audience = req.get("audience") != null ? (String) req.get("audience") : "Entire Community";
        String targetBuildings = (String) req.get("targetBuildings");
        String targetFlats = (String) req.get("targetFlats");
        String targetResidents = (String) req.get("targetResidents");

        Announcement announcement = announcementService.createAnnouncement(
                title, content, user, community, expiryDate,
                priority, audience, targetBuildings, targetFlats, targetResidents
        );
        auditLogService.log(user.getEmail(), "ANNOUNCEMENT_CREATED", "Announcement created with title: " + title);

        return ResponseEntity.ok(announcement);
    }

    @PostMapping("/{id}/archive")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<?> archiveAnnouncement(@PathVariable Long id, Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        announcementService.archiveAnnouncement(id);
        auditLogService.log(user.getEmail(), "ANNOUNCEMENT_ARCHIVED", "Announcement ID archived: " + id);

        return ResponseEntity.ok("Announcement archived");
    }
}
