package com.wumbap.wumbap.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RegisterResidentRequest {
    @NotBlank(message = "Full name is required")
    @Size(min = 2, message = "Enter your name")
    private String fullName;
    @Email(message = "Enter a valid email")
    @NotBlank(message = "Email is required")
    private String email;
    @NotBlank(message = "Password is required")
    @Size(min = 8, message = "At least 8 characters")
    private String password;
    @NotBlank(message = "Flat number is required")
    private String flatNumber;
    private Long communityId;
    private String phoneNumber;
    private String occupancyType;
}