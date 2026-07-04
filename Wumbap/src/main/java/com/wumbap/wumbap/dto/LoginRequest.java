// src/main/java/com/wumbap/wumbap/dto/LoginRequest.java
package com.wumbap.wumbap.dto;

import jakarta.validation.constraints.*;

public record LoginRequest(
        @Email @NotBlank String email,
        @NotBlank String password
) {}