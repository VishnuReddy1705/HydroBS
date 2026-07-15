package com.wumbap.wumbap.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReadingResponse {
    private Long id;
    private Long communityId;
    private String communityName;
    private Long residentId;
    private String residentName;
    private String flatNumber;
    private String building;
    private String block;
    private String floor;
    private String meterNumber;
    private LocalDate readingDate;
    private BigDecimal previousReading;
    private BigDecimal currentReading;
    private BigDecimal usageLitres;
    private Boolean isAnomaly;
    private String anomalyType;
    private String anomalyNotes;
    private String notes;
    private LocalDateTime createdAt;
}
