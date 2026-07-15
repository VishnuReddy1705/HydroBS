package com.wumbap.wumbap.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "communities")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Community {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150, unique = true)
    private String name;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "primary_admin_id")
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({"community", "password", "verificationToken", "resetPasswordToken"})
    private User primaryAdmin;

    @Column(nullable = false, length = 50, unique = true)
    private String code;

    @Column(length = 255)
    private String address;

    @Column(length = 100)
    private String city;

    @Column(length = 100)
    private String state;

    @Column(length = 100)
    private String country;

    @Column(name = "postal_code", length = 20)
    private String postalCode;

    private Double latitude;

    private Double longitude;

    @Column(name = "buildings_count", nullable = false)
    @Builder.Default
    private Integer buildingsCount = 1;

    @Column(name = "blocks_count", nullable = false)
    @Builder.Default
    private Integer blocksCount = 1;

    @Column(name = "total_flats", nullable = false)
    @Builder.Default
    private Integer totalFlats = 0;

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String status = "ACTIVE";

    @Column(name = "logo_url", columnDefinition = "TEXT")
    private String logoUrl;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, length = 10)
    @Builder.Default
    private String currency = "INR";

    @Column(name = "water_unit", nullable = false, length = 10)
    @Builder.Default
    private String waterUnit = "L";

    @Column(name = "billing_cycle", nullable = false, length = 20)
    @Builder.Default
    private String billingCycle = "MONTHLY";

    @Column(name = "tariff_rate", nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal tariffRate = new BigDecimal("5.00");

    @Column(name = "tax_rate", nullable = false, precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal taxRate = new BigDecimal("18.00");

    @Column(name = "late_fee_rate", nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal lateFeeRate = new BigDecimal("50.00");

    @Column(name = "discount_rate", nullable = false, precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal discountRate = new BigDecimal("0.00");

    @Column(name = "minimum_monthly_charge", nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal minimumMonthlyCharge = new BigDecimal("0.00");

    @Column(name = "fixed_service_charge", nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal fixedServiceCharge = new BigDecimal("0.00");

    @Column(name = "due_date_days", nullable = false)
    @Builder.Default
    private Integer dueDateDays = 15;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    public void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        createdAt = now;
        updatedAt = now;
        if (code == null || code.trim().isEmpty()) {
            code = "COM-" + java.util.UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        }
    }

    @PreUpdate
    public void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

}