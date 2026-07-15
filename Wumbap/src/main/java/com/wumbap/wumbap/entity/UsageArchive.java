package com.wumbap.wumbap.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "usage_archives")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UsageArchive {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "community_id")
    private Community community;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resident_id")
    private User resident;

    @Column(name = "period_type", nullable = false, length = 20)
    private String periodType; // WEEK, MONTH, YEAR

    @Column(name = "period_identifier", nullable = false, length = 50)
    private String periodIdentifier; // e.g. 2026-W28, 2026-07, 2026

    @Column(name = "total_usage_litres", nullable = false, precision = 12, scale = 2)
    private BigDecimal totalUsageLitres;

    @Column(name = "average_daily_usage", nullable = false, precision = 12, scale = 2)
    private BigDecimal averageDailyUsage;

    @Column(name = "peak_usage_litres", precision = 12, scale = 2)
    private BigDecimal peakUsageLitres;

    @Column(name = "lowest_usage_litres", precision = 12, scale = 2)
    private BigDecimal lowestUsageLitres;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    public void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
