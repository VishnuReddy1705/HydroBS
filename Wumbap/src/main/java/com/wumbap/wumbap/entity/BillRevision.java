package com.wumbap.wumbap.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "bill_revisions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BillRevision {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "bill_id")
    private WaterBill bill;

    @Column(name = "revision_number", nullable = false)
    private Integer revisionNumber;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @Column(name = "tax_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal taxAmount;

    @Column(name = "late_fee", nullable = false, precision = 12, scale = 2)
    private BigDecimal lateFee;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal penalty;

    @Column(name = "discount_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal discountAmount;

    @Column(name = "subsidy_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal subsidyAmount;

    @Column(name = "revised_by", nullable = false, length = 150)
    private String revisedBy;

    @Column(nullable = false)
    private String reason;

    @Column(name = "revised_at", nullable = false)
    private LocalDateTime revisedAt;

    @PrePersist
    public void prePersist() {
        if (revisedAt == null) {
            revisedAt = LocalDateTime.now();
        }
    }
}
