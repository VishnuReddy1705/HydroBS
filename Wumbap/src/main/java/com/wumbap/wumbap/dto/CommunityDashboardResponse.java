package com.wumbap.wumbap.dto;

public record CommunityDashboardResponse(

        String communityName,

        Long residentCount,

        Long pendingRequests,

        Long todayUsage,

        Long monthlyUsage,

        String currentCycle

) {
}