package com.wumbap.wumbap.dto;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
public class PaymentResponse {
    private Long id;
    private Long billId;
    private String billNumber;
    private String residentName;
    private BigDecimal amount;
    private String paymentMethod;
    private String transactionId;
    private String status;
    private LocalDateTime paidAt;
    private String receiptNumber;
    private String notes;
}
