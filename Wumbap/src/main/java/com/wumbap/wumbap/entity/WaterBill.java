package com.wumbap.wumbap.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "water_bills",
        uniqueConstraints = {
                @UniqueConstraint(
                        columnNames = {
                                "resident_id",
                                "billing_month"
                        }
                )
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WaterBill {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "resident_id")
    private User resident;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "community_id")
    private Community community;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "billing_cycle_id")
    private BillingCycle billingCycle;

    @Column(name = "billing_month", nullable = false)
    private LocalDate billingMonth;

    @Column(name = "billing_start_date")
    private LocalDate billingStartDate;

    @Column(name = "billing_end_date")
    private LocalDate billingEndDate;

    @Column(name = "total_usage", nullable = false, precision = 12, scale = 2)
    private BigDecimal totalUsage;

    @Column(name = "tariff_rate", nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal tariffRate = new BigDecimal("5.00");

    @Column(name = "tax_amount", nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal taxAmount = BigDecimal.ZERO;

    @Column(name = "late_fee", nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal lateFee = BigDecimal.ZERO;

    @Column(name = "discount_amount", nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal discountAmount = BigDecimal.ZERO;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @Column(nullable = false, length = 20)
    private String status; // e.g. 'DRAFT', 'GENERATED', 'SENT', 'VIEWED', 'PAID', 'PARTIALLY_PAID', 'OVERDUE', 'CANCELLED'

    @Column(name = "generated_at", nullable = false)
    private LocalDateTime generatedAt;

    @Column(name = "due_date")
    private LocalDate dueDate;

    @Column(name = "paid_at")
    private LocalDateTime paidAt;

    // Enterprise Smart Billing Engine Extensions
    @Column(name = "bill_number", length = 50, unique = true)
    private String billNumber;

    @Column(name = "invoice_number", length = 50, unique = true)
    private String invoiceNumber;

    @Column(name = "tariff_model", length = 50)
    @Builder.Default
    private String tariffModel = "PER_UNIT";

    @Column(name = "previous_reading", precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal previousReading = BigDecimal.ZERO;

    @Column(name = "current_reading", precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal currentReading = BigDecimal.ZERO;

    @Column(name = "service_charge", precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal serviceCharge = BigDecimal.ZERO;

    @Column(name = "maintenance_charge", precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal maintenanceCharge = BigDecimal.ZERO;

    @Column(name = "sewage_charge", precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal sewageCharge = BigDecimal.ZERO;

    @Column(precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal penalty = BigDecimal.ZERO;

    @Column(name = "subsidy_amount", precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal subsidyAmount = BigDecimal.ZERO;

    @Column(name = "revision_count")
    @Builder.Default
    private Integer revisionCount = 0;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tariff_id")
    private Tariff tariff;

    @Column(name = "generated_by", length = 150)
    private String generatedBy;

    @PrePersist
    public void prePersist() {
        if (generatedAt == null) {
            generatedAt = LocalDateTime.now();
        }
        if (status == null) {
            status = "GENERATED";
        }
        if (revisionCount == null) {
            revisionCount = 0;
        }
        if (tariffModel == null) {
            tariffModel = "PER_UNIT";
        }
        if (previousReading == null) previousReading = BigDecimal.ZERO;
        if (currentReading == null) currentReading = BigDecimal.ZERO;
        if (serviceCharge == null) serviceCharge = BigDecimal.ZERO;
        if (maintenanceCharge == null) maintenanceCharge = BigDecimal.ZERO;
        if (sewageCharge == null) sewageCharge = BigDecimal.ZERO;
        if (penalty == null) penalty = BigDecimal.ZERO;
        if (subsidyAmount == null) subsidyAmount = BigDecimal.ZERO;
    }
}
