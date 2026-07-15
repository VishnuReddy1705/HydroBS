package com.wumbap.wumbap.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BillingCycleDto {
    private Long id;
    private Long communityId;
    private String name;
    private LocalDate startDate;
    private LocalDate endDate;
    private String status; // OPEN, ACTIVE, FINALIZED, ARCHIVED
}
