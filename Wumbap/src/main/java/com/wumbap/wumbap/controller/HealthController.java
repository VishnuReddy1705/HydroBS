package com.wumbap.wumbap.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.File;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/health")
@RequiredArgsConstructor
@PreAuthorize("hasRole('SUPER_ADMIN')")
public class HealthController {

    private final JdbcTemplate jdbcTemplate;

    @GetMapping
    public ResponseEntity<?> getSystemHealth() {
        Map<String, Object> health = new HashMap<>();

        // 1. API Status
        health.put("apiStatus", "UP");

        // 2. Database Status Check
        String dbStatus = "DOWN";
        try {
            Integer result = jdbcTemplate.queryForObject("SELECT 1", Integer.class);
            if (result != null && result == 1) {
                dbStatus = "UP";
            }
        } catch (Exception e) {
            // DB is offline
        }
        health.put("dbStatus", dbStatus);

        // 3. JVM Memory Info
        Runtime runtime = Runtime.getRuntime();
        long maxMemory = runtime.maxMemory();
        long allocatedMemory = runtime.totalMemory();
        long freeMemory = runtime.freeMemory();
        
        health.put("jvmMemoryMax", maxMemory / (1024 * 1024)); // MB
        health.put("jvmMemoryAllocated", allocatedMemory / (1024 * 1024)); // MB
        health.put("jvmMemoryFree", freeMemory / (1024 * 1024)); // MB
        health.put("jvmMemoryUsed", (allocatedMemory - freeMemory) / (1024 * 1024)); // MB

        // 4. Disk Storage Info
        File root = new File("/");
        health.put("diskTotal", root.getTotalSpace() / (1024 * 1024 * 1024)); // GB
        health.put("diskFree", root.getFreeSpace() / (1024 * 1024 * 1024)); // GB
        health.put("diskUsed", (root.getTotalSpace() - root.getFreeSpace()) / (1024 * 1024 * 1024)); // GB

        return ResponseEntity.ok(health);
    }
}
