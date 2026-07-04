package com.wumbap.wumbap.dto;

import java.time.LocalDateTime;

public record JoinRequestResponse(
        Long id, Long userId, String userFullName, String userEmail, String flatNumber, LocalDateTime requestedAt
) {}