package com.wumbap.wumbap.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TariffRequest {
    private String name;
    private String model; // FIXED, PER_UNIT, SLAB
    private BigDecimal baseCharge;
    private BigDecimal unitPrice;
    private BigDecimal minimumCharge;
    private BigDecimal serviceCharge;
    private BigDecimal maintenanceCharge;
    private BigDecimal sewageCharge;
    private BigDecimal taxPercentage;
    private BigDecimal lateFee;
    private BigDecimal penalty;
    private BigDecimal discount;
    private BigDecimal subsidy;
    private String currency;
    private String billingCycle; // MONTHLY, BI_MONTHLY, QUARTERLY
    private Integer dueDays;
    private Boolean isActive;
    private String fallbackMethod;
    private BigDecimal sharedAreaPercentage;
    private List<TariffSlabDto> slabs;
}
