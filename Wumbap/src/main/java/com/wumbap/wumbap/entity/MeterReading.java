package com.wumbap.wumbap.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "meter_readings",
        uniqueConstraints = {
                @UniqueConstraint(
                        columnNames = {
                                "resident_id",
                                "reading_date"
                        }
                )
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MeterReading {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "upload_job_id")
    private UploadJob uploadJob;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "community_id")
    private Community community;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "resident_id")
    private User resident;

    @Column(name = "reading_date", nullable = false)
    private LocalDate readingDate;

    @Column(name = "previous_reading", precision = 12, scale = 2)
    private BigDecimal previousReading;

    @Column(name = "current_reading", precision = 12, scale = 2)
    private BigDecimal currentReading;

    @Column(name = "usage_litres", precision = 12, scale = 2)
    private BigDecimal usageLitres;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {

        createdAt = LocalDateTime.now();

        if (usageLitres == null
                && previousReading != null
                && currentReading != null) {

            usageLitres = currentReading.subtract(previousReading);

        }

    }

}