package com.wumbap.wumbap.controller;

import com.wumbap.wumbap.entity.User;
import com.wumbap.wumbap.repository.UserRepository;
import com.wumbap.wumbap.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;
    private final UserRepository userRepository;

    @GetMapping("/kpis")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'RESIDENT')")
    public ResponseEntity<Map<String, Object>> getKPIs(
            @RequestParam(required = false) Long communityId,
            Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName()).orElseThrow();
        return ResponseEntity.ok(analyticsService.getExecutiveKPIs(user, communityId));
    }

    @GetMapping("/charts")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'RESIDENT')")
    public ResponseEntity<Map<String, Object>> getCharts(
            @RequestParam(required = false) Long communityId,
            Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName()).orElseThrow();
        return ResponseEntity.ok(analyticsService.getAnalyticsCharts(user, communityId));
    }

    @GetMapping("/insights")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'RESIDENT')")
    public ResponseEntity<List<Map<String, Object>>> getInsights(
            @RequestParam(required = false) Long communityId,
            Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName()).orElseThrow();
        return ResponseEntity.ok(analyticsService.getRuleBasedInsights(user, communityId));
    }
}
