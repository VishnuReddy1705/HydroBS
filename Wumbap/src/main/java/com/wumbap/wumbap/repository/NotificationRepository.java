package com.wumbap.wumbap.repository;

import com.wumbap.wumbap.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByUserIdOrderByCreatedAtDesc(Long userId);
    List<Notification> findByUserIdAndIsReadOrderByCreatedAtDesc(Long userId, boolean isRead);
    List<Notification> findByUserIdAndIsArchivedOrderByCreatedAtDesc(Long userId, boolean isArchived);
    List<Notification> findByUserIdAndIsReadAndIsArchivedOrderByCreatedAtDesc(Long userId, boolean isRead, boolean isArchived);
}
