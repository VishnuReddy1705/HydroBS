package com.wumbap.wumbap.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BulkWaterPurchaseDto {
    private Long id;
    private Long communityId;
    private String supplier;
    private LocalDate purchaseDate;
    private BigDecimal volumeLitres;
    private BigDecimal unitCost;
    private BigDecimal totalCost;
    private String invoiceReference;
    private Long billingCycleId;
    private String billingCycleName;
    private String remarks;
}
