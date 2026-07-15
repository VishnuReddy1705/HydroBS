package com.wumbap.wumbap.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 150)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(name = "full_name", nullable = false, length = 150)
    private String fullName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Role role;

    @Column(name = "flat_number", length = 20)
    private String flatNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "community_id")
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({"primaryAdmin"})
    private Community community;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "is_email_verified", nullable = false)
    @Builder.Default
    private boolean isEmailVerified = false;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean isActive = true;

    @Column(name = "verification_token")
    private String verificationToken;

    @Column(name = "reset_password_token")
    private String resetPasswordToken;

    @Column(name = "reset_password_token_expiry")
    private LocalDateTime resetPasswordTokenExpiry;

    @Column(name = "phone_number", length = 50)
    private String phoneNumber;

    @Column(name = "profile_photo_url")
    private String profilePhotoUrl;

    @Column(length = 20)
    private String gender;

    @Column(name = "date_of_birth")
    private java.time.LocalDate dateOfBirth;

    @Column(name = "emergency_contact_name", length = 150)
    private String emergencyContactName;

    @Column(name = "emergency_contact_phone", length = 50)
    private String emergencyContactPhone;

    private String address;

    @Column(length = 100)
    private String building;

    @Column(length = 100)
    private String block;

    @Column(length = 50)
    private String floor;

    @Column(name = "family_size")
    private Integer familySize;

    @Column(name = "occupancy_type", length = 50)
    private String occupancyType;

    @Column(name = "move_in_date")
    private java.time.LocalDate moveInDate;

    @Column(name = "flat_area", precision = 12, scale = 2)
    @Builder.Default
    private java.math.BigDecimal flatArea = java.math.BigDecimal.ZERO;

    @Column(name = "meter_number", length = 100)
    private String meterNumber;

    @Column(name = "water_balance", precision = 12, scale = 2)
    @Builder.Default
    private java.math.BigDecimal waterBalance = java.math.BigDecimal.ZERO;

    @Column(name = "last_login_at")
    private LocalDateTime lastLoginAt;

    @PrePersist
    public void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    public void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}