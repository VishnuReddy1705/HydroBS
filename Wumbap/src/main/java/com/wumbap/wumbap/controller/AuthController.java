// src/main/java/com/wumbap/wumbap/controller/AuthController.java
package com.wumbap.wumbap.controller;

import com.wumbap.wumbap.dto.*;
import com.wumbap.wumbap.entity.*;
import com.wumbap.wumbap.repository.*;
import com.wumbap.wumbap.security.JwtService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserRepository userRepository;
    private final CommunityRepository communityRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    @PostMapping("/register-admin")
    public ResponseEntity<?> registerAdmin(@Valid @RequestBody RegisterAdminRequest req) {
        if (userRepository.existsByEmail(req.email())) {
            return ResponseEntity.badRequest().body("Email already registered");
        }
        Community community = Community.builder().name(req.communityName()).build();
        communityRepository.save(community);

        User admin = User.builder()
                .fullName(req.fullName())
                .email(req.email())
                .password(passwordEncoder.encode(req.password()))
                .role(Role.ADMIN)
                .community(community)
                .build();
        userRepository.save(admin);

        return ResponseEntity.ok("Admin and community created");
    }

    // TEMPORARY test-only endpoint — replaced by the email-invite flow next milestone
    @PostMapping("/register-resident")
    public ResponseEntity<?> registerResident(@Valid @RequestBody RegisterResidentRequest req) {
        if (userRepository.existsByEmail(req.email())) {
            return ResponseEntity.badRequest().body("Email already registered");
        }
        User resident = User.builder()
                .fullName(req.fullName())
                .email(req.email())
                .password(passwordEncoder.encode(req.password()))
                .role(Role.RESIDENT)
                .flatNumber(req.flatNumber())
                .build();
        userRepository.save(resident);
        return ResponseEntity.ok("Resident account created");
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest req) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(req.email(), req.password()));

        User user = userRepository.findByEmail(req.email())
                .orElseThrow(() -> new RuntimeException("User not found"));

        String token = jwtService.generateToken(user.getEmail(), user.getRole().name());
        return ResponseEntity.ok(new AuthResponse(token, user.getFullName(), user.getRole().name()));
    }
}