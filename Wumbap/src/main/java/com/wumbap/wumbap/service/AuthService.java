package com.wumbap.wumbap.service;

import com.wumbap.wumbap.dto.AuthResponse;
import com.wumbap.wumbap.dto.LoginRequest;
import com.wumbap.wumbap.dto.RegisterResidentRequest;
import com.wumbap.wumbap.entity.RefreshToken;
import com.wumbap.wumbap.entity.Role;
import com.wumbap.wumbap.entity.User;
import com.wumbap.wumbap.repository.UserRepository;
import com.wumbap.wumbap.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import com.wumbap.wumbap.entity.Community;
import com.wumbap.wumbap.entity.CommunityJoinRequest;
import com.wumbap.wumbap.entity.JoinRequestStatus;
import com.wumbap.wumbap.repository.CommunityJoinRequestRepository;
import com.wumbap.wumbap.repository.CommunityRepository;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final CommunityRepository communityRepository;
    private final CommunityJoinRequestRepository joinRequestRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final RefreshTokenService refreshTokenService;
    private final AuditLogService auditLogService;
    private final EmailService emailService;

    public AuthResponse register(RegisterResidentRequest request) {
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new RuntimeException("Email already exists");
        }

        User user = User.builder()
                .fullName(request.getFullName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(Role.RESIDENT)
                .flatNumber(request.getFlatNumber())
                .phoneNumber(request.getPhoneNumber())
                .occupancyType(request.getOccupancyType() != null && !request.getOccupancyType().isBlank() ? request.getOccupancyType().toUpperCase() : "TENANT")
                .isEmailVerified(false)
                .verificationToken(UUID.randomUUID().toString())
                .build();

        user = userRepository.save(user);
        auditLogService.log(user.getEmail(), "RESIDENT_REGISTERED", "Resident user self-registered");

        String communityName = null;
        // Automatically create a pending CommunityJoinRequest if communityId is supplied
        if (request.getCommunityId() != null) {
            Optional<Community> communityOpt = communityRepository.findById(request.getCommunityId());
            if (communityOpt.isPresent()) {
                communityName = communityOpt.get().getName();
                CommunityJoinRequest joinRequest = CommunityJoinRequest.builder()
                        .user(user)
                        .community(communityOpt.get())
                        .status(JoinRequestStatus.PENDING)
                        .requestedAt(LocalDateTime.now())
                        .build();
                joinRequestRepository.save(joinRequest);
            }
        }

        try {
            emailService.sendWelcomeResidentEmail(user, request.getPassword(), communityName);
        } catch (Exception ex) {
            System.err.println("Failed to send welcome email upon self registration: " + ex.getMessage());
        }

        // Simulate sending verification email
        System.out.println("Verification Email Link: http://localhost:5173/verify-email?token=" + user.getVerificationToken());

        org.springframework.security.core.userdetails.User userDetails =
                new org.springframework.security.core.userdetails.User(
                        user.getEmail(),
                        user.getPassword(),
                        List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()))
                );

        String token = jwtService.generateToken(userDetails);
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(user.getId(), false);

        return AuthResponse.builder()
                .token(token)
                .refreshToken(refreshToken.getToken())
                .email(user.getEmail())
                .role(user.getRole().name())
                .fullName(user.getFullName())
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setLastLoginAt(LocalDateTime.now());
        userRepository.save(user);
        auditLogService.log(user.getEmail(), "USER_LOGIN", "User logged in successfully");

        org.springframework.security.core.userdetails.User userDetails =
                new org.springframework.security.core.userdetails.User(
                        user.getEmail(),
                        user.getPassword(),
                        List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()))
                );

        String token = jwtService.generateToken(userDetails);
        
        // Delete old refresh tokens
        refreshTokenService.deleteByUserId(user.getId());
        
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(user.getId(), request.isRememberMe());

        return AuthResponse.builder()
                .token(token)
                .refreshToken(refreshToken.getToken())
                .email(user.getEmail())
                .role(user.getRole().name())
                .fullName(user.getFullName())
                .build();
    }

    public void forgotPassword(String email) {
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            user.setResetPasswordToken(UUID.randomUUID().toString());
            user.setResetPasswordTokenExpiry(LocalDateTime.now().plusHours(1));
            userRepository.save(user);
            auditLogService.log(email, "FORGOT_PASSWORD_REQUESTED", "Password reset token generated for user");
            
            // Simulate sending reset email
            System.out.println("Reset Password Link: http://localhost:5173/reset-password?token=" + user.getResetPasswordToken());
        }
    }

    public void resetPassword(String token, String newPassword) {
        User user = userRepository.findAll().stream()
                .filter(u -> token.equals(u.getResetPasswordToken()))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Invalid token"));

        if (user.getResetPasswordTokenExpiry().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Token expired");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        user.setResetPasswordToken(null);
        user.setResetPasswordTokenExpiry(null);
        userRepository.save(user);
        auditLogService.log(user.getEmail(), "PASSWORD_CHANGED", "User successfully reset their password via token");
    }
}