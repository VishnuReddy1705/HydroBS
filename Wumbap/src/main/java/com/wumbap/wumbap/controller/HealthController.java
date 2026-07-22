package com.wumbap.wumbap.controller;

import com.wumbap.wumbap.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.lang.management.ManagementFactory;
import java.lang.management.OperatingSystemMXBean;
import java.io.File;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/health")
@RequiredArgsConstructor
@PreAuthorize("hasRole('SUPER_ADMIN')")
public class HealthController {

    private final JdbcTemplate jdbcTemplate;
    private final AuditLogRepository auditLogRepository;

    @GetMapping
    public ResponseEntity<?> getSystemHealth() {
        Map<String, Object> health = new HashMap<>();
        health.put("generatedAt", java.time.LocalDateTime.now().toString());

        // 1. API Status
        health.put("apiStatus", "UP");

        // 2. Database Status Check
        String dbStatus = "DOWN";
        Long dbLatencyMs = null;
        try {
            long start = System.nanoTime();
            Integer result = jdbcTemplate.queryForObject("SELECT 1", Integer.class);
            if (result != null && result == 1) {
                dbStatus = "UP";
            }
            dbLatencyMs = (System.nanoTime() - start) / 1_000_000;
        } catch (RuntimeException e) {
            health.put("dbError", e.getMessage());
        }
        health.put("dbStatus", dbStatus);
        health.put("dbLatencyMs", dbLatencyMs);

        // 3. JVM Memory Info
        Runtime runtime = Runtime.getRuntime();
        long maxMemory = runtime.maxMemory();
        long allocatedMemory = runtime.totalMemory();
        long freeMemory = runtime.freeMemory();
        
        health.put("jvmMemoryMax", maxMemory / (1024 * 1024)); // MB
        health.put("jvmMemoryAllocated", allocatedMemory / (1024 * 1024)); // MB
        health.put("jvmMemoryFree", freeMemory / (1024 * 1024)); // MB
        health.put("jvmMemoryUsed", (allocatedMemory - freeMemory) / (1024 * 1024)); // MB
        health.put("jvmMemoryUsagePercent", maxMemory > 0 ? Math.round(((allocatedMemory - freeMemory) * 100.0) / maxMemory) : 0);

        // 4. Disk Storage Info
        File root = new File(System.getProperty("user.dir")).getAbsoluteFile().toPath().getRoot().toFile();
        health.put("diskTotal", root.getTotalSpace() / (1024 * 1024 * 1024)); // GB
        health.put("diskFree", root.getFreeSpace() / (1024 * 1024 * 1024)); // GB
        health.put("diskUsed", (root.getTotalSpace() - root.getFreeSpace()) / (1024 * 1024 * 1024)); // GB
        health.put("diskUsagePercent", root.getTotalSpace() > 0
                ? Math.round(((root.getTotalSpace() - root.getFreeSpace()) * 100.0) / root.getTotalSpace())
                : 0);

        // 5. Runtime
        long uptimeMs = ManagementFactory.getRuntimeMXBean().getUptime();
        health.put("uptimeHours", Math.round((uptimeMs / 1000.0 / 60.0 / 60.0) * 10.0) / 10.0);
        health.put("uptimeMinutes", Math.round(uptimeMs / 1000.0 / 60.0));

        OperatingSystemMXBean osBean = ManagementFactory.getOperatingSystemMXBean();
        health.put("cpuCores", osBean.getAvailableProcessors());
        health.put("systemLoadAverage", osBean.getSystemLoadAverage());

        // 6. Audit risk metrics
        health.put("auditTotalEntries", auditLogRepository.count());
        health.put("auditEntriesToday", auditLogRepository.countByCreatedAtGreaterThanEqual(LocalDate.now().atStartOfDay()));
        health.put("auditFailureSignals", auditLogRepository.countByActionTypeContainingIgnoreCaseOrDetailsContainingIgnoreCase("FAIL", "FAIL"));

        return ResponseEntity.ok(health);
    }
}
