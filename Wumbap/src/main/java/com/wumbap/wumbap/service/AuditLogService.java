package com.wumbap.wumbap.service;

import com.wumbap.wumbap.entity.AuditLog;
import com.wumbap.wumbap.repository.AuditLogRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    public void log(String email, String actionType, String details) {
        String ipAddress = "UNKNOWN";
        try {
            ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attributes != null) {
                HttpServletRequest request = attributes.getRequest();
                ipAddress = request.getRemoteAddr();
                if (request.getHeader("X-Forwarded-For") != null) {
                    ipAddress = request.getHeader("X-Forwarded-For");
                }
            }
        } catch (Exception e) {
            // Request context may not be available outside of HTTP threads
        }

        AuditLog log = AuditLog.builder()
                .userEmail(email)
                .actionType(actionType)
                .details(details)
                .ipAddress(ipAddress)
                .createdAt(LocalDateTime.now())
                .build();

        auditLogRepository.save(log);
    }
}
