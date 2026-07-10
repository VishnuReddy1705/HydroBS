package com.wumbap.wumbap.controller;

import com.wumbap.wumbap.dto.*;
import com.wumbap.wumbap.entity.Community;
import com.wumbap.wumbap.entity.Role;
import com.wumbap.wumbap.entity.User;
import com.wumbap.wumbap.repository.CommunityRepository;
import com.wumbap.wumbap.repository.UserRepository;
import com.wumbap.wumbap.service.AuthService;
import com.wumbap.wumbap.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final UserRepository userRepository;
    private final CommunityRepository communityRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/register-resident")
    public ResponseEntity<AuthResponse> registerResident(@RequestBody RegisterResidentRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/register-admin")
    public ResponseEntity<?> registerAdmin(@RequestBody RegisterAdminRequest request) {
        if (userRepository.findByEmail(request.email()).isPresent()) {
            return ResponseEntity.badRequest().body("Email already exists");
        }

        // Check if community already exists (case-insensitive check)
        boolean communityExists = communityRepository.findAll().stream()
                .anyMatch(c -> c.getName().equalsIgnoreCase(request.communityName().trim()));

        if (communityExists) {
            return ResponseEntity.badRequest().body("Community name already exists");
        }

        // Create community
        Community community = Community.builder()
                .name(request.communityName().trim())
                .build();
        community = communityRepository.save(community);

        // Create admin user
        User admin = User.builder()
                .fullName(request.fullName())
                .email(request.email())
                .password(passwordEncoder.encode(request.password()))
                .role(Role.ADMIN)
                .community(community)
                .build();
        userRepository.save(admin);

        // Generate token
        org.springframework.security.core.userdetails.User userDetails =
                new org.springframework.security.core.userdetails.User(
                        admin.getEmail(),
                        admin.getPassword(),
                        java.util.List.of(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_" + admin.getRole().name()))
                );
        String token = jwtService.generateToken(userDetails);

        AuthResponse response = AuthResponse.builder()
                .token(token)
                .email(admin.getEmail())
                .role(admin.getRole().name())
                .fullName(admin.getFullName())
                .build();

        return ResponseEntity.ok(response);
    }
}