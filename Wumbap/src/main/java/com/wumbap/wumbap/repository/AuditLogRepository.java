package com.wumbap.wumbap.repository;

import com.wumbap.wumbap.entity.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    List<AuditLog> findByUserEmailOrderByCreatedAtDesc(String userEmail);
    List<AuditLog> findByActionTypeOrderByCreatedAtDesc(String actionType);
    Page<AuditLog> findByUserEmailContainingIgnoreCaseOrActionTypeContainingIgnoreCaseOrDetailsContainingIgnoreCase(
            String userEmail, String actionType, String details, Pageable pageable
    );
    Page<AuditLog> findByActionTypeContainingIgnoreCase(String actionType, Pageable pageable);
    long countByCreatedAtGreaterThanEqual(LocalDateTime createdAt);
    long countByActionTypeContainingIgnoreCaseOrDetailsContainingIgnoreCase(String actionType, String details);
}
