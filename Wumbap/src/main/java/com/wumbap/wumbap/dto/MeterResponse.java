package com.wumbap.wumbap.dto;

import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MeterResponse {
    private Long id;
    private String meterNumber;
    private String qrCode;
    private String barcode;
    private String status;
    private String meterType;
    private LocalDate installationDate;
    private LocalDate calibrationDate;
    private LocalDate lastServiceDate;
    private LocalDate nextServiceDate;
    private Long communityId;
    private String communityName;
    private Long residentId;
    private String residentName;
    private String flatNumber;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
