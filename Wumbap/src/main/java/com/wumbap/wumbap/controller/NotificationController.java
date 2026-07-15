package com.wumbap.wumbap.controller;

import com.wumbap.wumbap.entity.Notification;
import com.wumbap.wumbap.entity.User;
import com.wumbap.wumbap.repository.NotificationRepository;
import com.wumbap.wumbap.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<?> getNotifications(Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<Notification> notifications = notificationRepository.findByUserIdAndIsArchivedOrderByCreatedAtDesc(user.getId(), false);
        List<Map<String, Object>> response = notifications.stream()
                .map(n -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", n.getId());
                    map.put("title", n.getTitle());
                    map.put("message", n.getMessage());
                    map.put("type", n.getType());
                    map.put("isRead", n.isRead());
                    map.put("isArchived", n.isArchived());
                    map.put("createdAt", n.getCreatedAt().toString());
                    return map;
                })
                .toList();

        return ResponseEntity.ok(response);
    }

    @GetMapping("/unread-count")
    public ResponseEntity<?> getUnreadCount(Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<Notification> unread = notificationRepository.findByUserIdAndIsReadAndIsArchivedOrderByCreatedAtDesc(user.getId(), false, false);
        Map<String, Object> response = new HashMap<>();
        response.put("unreadCount", unread.size());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/read")
    public ResponseEntity<?> markAsRead(@PathVariable Long id, Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Notification not found"));

        if (!notification.getUser().getId().equals(user.getId())) {
            return ResponseEntity.status(403).body("You do not have access to this notification.");
        }

        notification.setRead(true);
        notificationRepository.save(notification);

        return ResponseEntity.ok("Notification marked as read.");
    }

    @PostMapping("/read-all")
    public ResponseEntity<?> markAllAsRead(Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<Notification> unread = notificationRepository.findByUserIdAndIsReadAndIsArchivedOrderByCreatedAtDesc(user.getId(), false, false);
        for (Notification n : unread) {
            n.setRead(true);
            notificationRepository.save(n);
        }

        return ResponseEntity.ok("All notifications marked as read.");
    }

    @PostMapping("/{id}/archive")
    public ResponseEntity<?> archiveNotification(@PathVariable Long id, Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Notification not found"));

        if (!notification.getUser().getId().equals(user.getId())) {
            return ResponseEntity.status(403).body("You do not have access to this notification.");
        }

        notification.setArchived(true);
        notificationRepository.save(notification);

        return ResponseEntity.ok("Notification archived.");
    }

    @PostMapping("/archive-all")
    public ResponseEntity<?> archiveAllNotifications(Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<Notification> notifications = notificationRepository.findByUserIdAndIsArchivedOrderByCreatedAtDesc(user.getId(), false);
        for (Notification n : notifications) {
            n.setArchived(true);
            notificationRepository.save(n);
        }

        return ResponseEntity.ok("All notifications archived.");
    }
}
