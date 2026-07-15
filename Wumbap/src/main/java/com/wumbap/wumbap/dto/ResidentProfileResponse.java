package com.wumbap.wumbap.dto;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResidentProfileResponse {
    private Long id;
    private String email;
    private String fullName;
    private String role;
    private String phoneNumber;
    private String profilePhotoUrl;
    private String gender;
    private LocalDate dateOfBirth;
    private String emergencyContactName;
    private String emergencyContactPhone;
    private String address;
    private Long communityId;
    private String communityName;
    private String building;
    private String block;
    private String floor;
    private String flatNumber;
    private Integer familySize;
    private String occupancyType;
    private LocalDate moveInDate;
    private BigDecimal flatArea;
    private String meterNumber;
    private BigDecimal waterBalance;
    private boolean isActive;
    
    // Billing & usage metrics
    private BigDecimal currentMonthUsage;
    private BigDecimal currentBillAmount;
    private BigDecimal outstandingAmount;
    private String paymentStatus;
    private LocalDate dueDate;
    
    // Latest reading & payment details
    private BigDecimal latestMeterReading;
    private LocalDate latestReadingDate;
    private LocalDate lastPaymentDate;
    private BigDecimal lastPaymentAmount;
    private LocalDateTime lastLoginAt;
}
