package com.wumbap.wumbap.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ResetPasswordRequest {
    @NotBlank(message = "Reset token is required")
    private String token;
    @NotBlank(message = "New password is required")
    @Size(min = 8, message = "At least 8 characters")
    private String newPassword;
}
