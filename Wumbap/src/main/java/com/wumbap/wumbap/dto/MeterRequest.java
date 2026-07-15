package com.wumbap.wumbap.dto;

import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MeterRequest {
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
    private Long residentId;
}
