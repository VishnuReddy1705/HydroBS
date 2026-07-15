package com.wumbap.wumbap.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BillRevisionRequest {
    private String reason;
    private BigDecimal amount;
    private BigDecimal taxAmount;
    private BigDecimal lateFee;
    private BigDecimal penalty;
    private BigDecimal discountAmount;
    private BigDecimal subsidyAmount;
    private BigDecimal serviceCharge;
    private BigDecimal maintenanceCharge;
    private BigDecimal sewageCharge;
    private String status; // Allow updating status if needed (e.g. CANCELLED, DRAFT, SENT)
    private String notes;
}
