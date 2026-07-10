package com.wumbap.wumbap.dto;

public record MyJoinRequestResponse(
        Long id,
        Long communityId,
        String communityName,
        String status
) {}