package com.wumbap.wumbap.controller;

import com.wumbap.wumbap.dto.*;
import com.wumbap.wumbap.entity.Community;
import com.wumbap.wumbap.entity.RefreshToken;
import com.wumbap.wumbap.entity.Role;
import com.wumbap.wumbap.entity.User;
import com.wumbap.wumbap.repository.CommunityRepository;
import com.wumbap.wumbap.repository.UserRepository;
import com.wumbap.wumbap.service.AuthService;
import com.wumbap.wumbap.service.RefreshTokenService;
import com.wumbap.wumbap.security.JwtService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final RefreshTokenService refreshTokenService;
    private final UserRepository userRepository;
    private final CommunityRepository communityRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/register-resident")
    public ResponseEntity<AuthResponse> registerResident(@Valid @RequestBody RegisterResidentRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/register-admin")
    public ResponseEntity<?> registerAdmin(@Valid @RequestBody RegisterAdminRequest request) {
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
                .isEmailVerified(false)
                .verificationToken(UUID.randomUUID().toString())
                .build();
        userRepository.save(admin);

        // Simulate sending verification email
        System.out.println("Verification Email Link: http://localhost:5173/verify-email?token=" + admin.getVerificationToken());

        // Generate token
        org.springframework.security.core.userdetails.User userDetails =
                new org.springframework.security.core.userdetails.User(
                        admin.getEmail(),
                        admin.getPassword(),
                        List.of(new SimpleGrantedAuthority("ROLE_" + admin.getRole().name()))
                );
        String token = jwtService.generateToken(userDetails);
        
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(admin.getId(), false);

        AuthResponse response = AuthResponse.builder()
                .token(token)
                .refreshToken(refreshToken.getToken())
                .email(admin.getEmail())
                .role(admin.getRole().name())
                .fullName(admin.getFullName())
                .build();

        return ResponseEntity.ok(response);
    }

    @PostMapping("/refresh-token")
    public ResponseEntity<?> refreshToken(@Valid @RequestBody TokenRefreshRequest request) {
        String requestRefreshToken = request.getRefreshToken();

        return refreshTokenService.findByToken(requestRefreshToken)
                .map(refreshTokenService::verifyExpiration)
                .map(RefreshToken::getUser)
                .map(user -> {
                    org.springframework.security.core.userdetails.User userDetails =
                            new org.springframework.security.core.userdetails.User(
                                    user.getEmail(),
                                    user.getPassword(),
                                    List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()))
                            );
                    String token = jwtService.generateToken(userDetails);
                    return ResponseEntity.ok(new TokenRefreshResponse(token, requestRefreshToken));
                })
                .orElseThrow(() -> new RuntimeException("Refresh token is not in database!"));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        authService.forgotPassword(request.getEmail());
        return ResponseEntity.ok("If an account with that email exists, a reset link has been sent.");
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request.getToken(), request.getNewPassword());
        return ResponseEntity.ok("Password successfully reset.");
    }

    @GetMapping("/verify-email")
    public ResponseEntity<?> verifyEmail(@RequestParam("token") String token) {
        Optional<User> userOpt = userRepository.findAll().stream()
                .filter(u -> token.equals(u.getVerificationToken()))
                .findFirst();

        if (userOpt.isPresent()) {
            User user = userOpt.get();
            user.setVerificationToken(null);
            user.setEmailVerified(true);
            userRepository.save(user);
            return ResponseEntity.ok("Email verified successfully.");
        }
        return ResponseEntity.badRequest().body("Invalid verification token.");
    }
}