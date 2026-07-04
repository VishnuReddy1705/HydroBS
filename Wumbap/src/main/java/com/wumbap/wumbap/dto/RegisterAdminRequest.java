// src/main/java/com/wumbap/wumbap/dto/RegisterAdminRequest.java
package com.wumbap.wumbap.dto;

import jakarta.validation.constraints.*;

public record RegisterAdminRequest(
        @NotBlank String fullName,
        @Email @NotBlank String email,
        @NotBlank @Size(min = 8) String password,
        @NotBlank String communityName
) {}