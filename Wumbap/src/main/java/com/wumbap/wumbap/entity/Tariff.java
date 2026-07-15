package com.wumbap.wumbap.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "tariffs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Tariff {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "community_id")
    private Community community;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, length = 50)
    private String model; // FIXED, PER_UNIT, SLAB

    @Column(name = "base_charge", nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal baseCharge = BigDecimal.ZERO;

    @Column(name = "unit_price", nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal unitPrice = BigDecimal.ZERO;

    @Column(name = "minimum_charge", nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal minimumCharge = BigDecimal.ZERO;

    @Column(name = "service_charge", nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal serviceCharge = BigDecimal.ZERO;

    @Column(name = "maintenance_charge", nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal maintenanceCharge = BigDecimal.ZERO;

    @Column(name = "sewage_charge", nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal sewageCharge = BigDecimal.ZERO;

    @Column(name = "tax_percentage", nullable = false, precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal taxPercentage = BigDecimal.ZERO;

    @Column(name = "late_fee", nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal lateFee = BigDecimal.ZERO;

    @Column(nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal penalty = BigDecimal.ZERO;

    @Column(nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal discount = BigDecimal.ZERO;

    @Column(nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal subsidy = BigDecimal.ZERO;

    @Column(nullable = false, length = 10)
    @Builder.Default
    private String currency = "INR";

    @Column(name = "billing_cycle", nullable = false, length = 50)
    @Builder.Default
    private String billingCycle = "MONTHLY"; // MONTHLY, BI_MONTHLY, QUARTERLY

    @Column(name = "due_days", nullable = false)
    @Builder.Default
    private Integer dueDays = 15;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "fallback_method", nullable = false, length = 50)
    @Builder.Default
    private String fallbackMethod = "OCCUPANCY";

    @Column(name = "shared_area_percentage", nullable = false, precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal sharedAreaPercentage = new BigDecimal("10.00");

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "tariff", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<TariffSlab> slabs = new ArrayList<>();

    @PrePersist
    public void prePersist() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (isActive == null) {
            isActive = true;
        }
    }
}
