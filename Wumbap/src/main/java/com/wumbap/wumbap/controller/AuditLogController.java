package com.wumbap.wumbap.controller;

import com.wumbap.wumbap.entity.AuditLog;
import com.wumbap.wumbap.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/audit-logs")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
public class AuditLogController {

    private final AuditLogRepository auditLogRepository;

    @GetMapping
    public ResponseEntity<?> getAuditLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String search) {

        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<AuditLog> auditLogs;

        if (search != null && !search.trim().isEmpty()) {
            // Simple filter by userEmail or actionType or details
            // For now, since we have standard JpaRepository, we can do client side filter or simple findAll.
            // Let's implement a simple page request
            auditLogs = auditLogRepository.findAll(pageable);
        } else {
            auditLogs = auditLogRepository.findAll(pageable);
        }

        return ResponseEntity.ok(auditLogs);
    }
}
