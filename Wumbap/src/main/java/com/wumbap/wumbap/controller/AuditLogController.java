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
            @RequestParam(defaultValue = "50") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String actionType) {

        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<AuditLog> auditLogs;

        if (actionType != null && !actionType.trim().isEmpty()) {
            auditLogs = auditLogRepository.findByActionTypeContainingIgnoreCase(actionType.trim(), pageable);
        } else if (search != null && !search.trim().isEmpty()) {
            String searchTerm = search.trim();
            auditLogs = auditLogRepository.findByUserEmailContainingIgnoreCaseOrActionTypeContainingIgnoreCaseOrDetailsContainingIgnoreCase(
                    searchTerm, searchTerm, searchTerm, pageable
            );
        } else {
            auditLogs = auditLogRepository.findAll(pageable);
        }

        return ResponseEntity.ok(auditLogs);
    }
}
