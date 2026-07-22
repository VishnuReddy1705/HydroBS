package com.wumbap.wumbap.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "payments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "bill_id")
    private WaterBill bill;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @Column(name = "payment_method", nullable = false, length = 50)
    private String paymentMethod;

    @Column(name = "transaction_id", unique = true, length = 100)
    private String transactionId;

    @Column(nullable = false, length = 50)
    @Builder.Default
    private String status = "COMPLETED";

    @Column(name = "paid_at", nullable = false)
    private LocalDateTime paidAt;

    @Column(name = "receipt_number", length = 100)
    private String receiptNumber;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "reversed_at")
    private LocalDateTime reversedAt;

    @Column(name = "reversal_reason", length = 255)
    private String reversalReason;

    @PrePersist
    public void prePersist() {
        if (paidAt == null) {
            paidAt = LocalDateTime.now();
        }
        if (status == null) {
            status = "COMPLETED";
        }
    }
}
