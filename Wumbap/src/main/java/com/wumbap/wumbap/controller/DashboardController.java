package com.wumbap.wumbap.controller;

import com.wumbap.wumbap.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/super-admin")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<Map<String, Object>> getSuperAdminStats() {
        return ResponseEntity.ok(dashboardService.getSuperAdminStats());
    }

    @GetMapping("/admin")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<Map<String, Object>> getCommunityAdminStats(Authentication authentication) {
        return ResponseEntity.ok(dashboardService.getCommunityAdminStats(authentication.getName()));
    }

    @GetMapping("/resident")
    @PreAuthorize("hasRole('RESIDENT')")
    public ResponseEntity<Map<String, Object>> getResidentStats(Authentication authentication) {
        return ResponseEntity.ok(dashboardService.getResidentStats(authentication.getName()));
    }
}