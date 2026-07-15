package com.wumbap.wumbap.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BillResponse {
    private Long id;
    private String billNumber;
    private String invoiceNumber;
    private LocalDate billingMonth;
    private BigDecimal totalUsage;
    private BigDecimal tariffRate;
    private BigDecimal taxAmount;
    private BigDecimal lateFee;
    private BigDecimal discountAmount;
    private BigDecimal amount;
    private String status;
    private LocalDateTime generatedAt;
    private LocalDate dueDate;
    private LocalDateTime paidAt;

    private Long residentId;
    private String residentName;
    private String residentEmail;
    private String residentPhone;

    private Long communityId;
    private String communityName;

    private String building;
    private String block;
    private String floor;
    private String flatNumber;

    private BigDecimal previousReading;
    private BigDecimal currentReading;
    private BigDecimal serviceCharge;
    private BigDecimal maintenanceCharge;
    private BigDecimal sewageCharge;
    private BigDecimal penalty;
    private BigDecimal subsidyAmount;
    private String tariffModel;
    private String notes;
    private Integer revisionCount;
    private String generatedBy;

    private List<BillRevisionDto> revisions;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class BillRevisionDto {
        private Long id;
        private Integer revisionNumber;
        private BigDecimal amount;
        private BigDecimal taxAmount;
        private BigDecimal lateFee;
        private BigDecimal penalty;
        private BigDecimal discountAmount;
        private BigDecimal subsidyAmount;
        private String revisedBy;
        private String reason;
        private LocalDateTime revisedAt;
    }
}
