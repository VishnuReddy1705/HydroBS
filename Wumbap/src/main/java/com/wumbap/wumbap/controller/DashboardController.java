// src/main/java/com/wumbap/wumbap/controller/DashboardController.java
package com.wumbap.wumbap.controller;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public String adminWelcome(Authentication auth) {
        return "Welcome, Admin (" + auth.getName() + ")";
    }

    @GetMapping("/resident")
    @PreAuthorize("hasRole('RESIDENT')")
    public String residentWelcome(Authentication auth) {
        return "Welcome, Resident (" + auth.getName() + ")";
    }
}