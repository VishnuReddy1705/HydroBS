package com.wumbap.wumbap.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BillGenerationRequest {
    private String scope; // SINGLE_RESIDENT, BUILDING, COMMUNITY, SYSTEM
    private Long communityId;
    private Long residentId;
    private String building;
    private String billingMonth; // format "yyyy-MM-dd" or "yyyy-MM"
    private String notes;
    private Long billingCycleId;
}
