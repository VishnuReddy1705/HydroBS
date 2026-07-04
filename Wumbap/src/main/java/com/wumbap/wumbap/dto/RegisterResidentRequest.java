package com.wumbap.wumbap.dto;

import jakarta.validation.constraints.*;

public record RegisterResidentRequest(
        @NotBlank String fullName,
        @Email @NotBlank String email,
        @NotBlank @Size(min = 8) String password,
        @NotBlank String flatNumber
) {}