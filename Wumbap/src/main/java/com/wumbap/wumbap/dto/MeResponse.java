package com.wumbap.wumbap.dto;

public record MeResponse(
        String fullName,
        String email,
        String role,
        Long communityId,
        String communityName
) {
}