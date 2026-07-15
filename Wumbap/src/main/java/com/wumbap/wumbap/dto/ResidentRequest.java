package com.wumbap.wumbap.dto;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResidentRequest {
    private String email;
    private String password;
    private String fullName;
    private String phoneNumber;
    private String profilePhotoUrl;
    private String gender;
    private LocalDate dateOfBirth;
    private String emergencyContactName;
    private String emergencyContactPhone;
    private String address;
    private Long communityId;
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
    private Boolean isActive;
}
