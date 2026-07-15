package com.wumbap.wumbap.repository;

import com.wumbap.wumbap.entity.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    List<AuditLog> findByUserEmailOrderByCreatedAtDesc(String userEmail);
    List<AuditLog> findByActionTypeOrderByCreatedAtDesc(String actionType);
}
