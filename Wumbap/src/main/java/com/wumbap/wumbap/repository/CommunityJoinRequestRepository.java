package com.wumbap.wumbap.repository;

import com.wumbap.wumbap.entity.CommunityJoinRequest;
import com.wumbap.wumbap.entity.JoinRequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CommunityJoinRequestRepository extends JpaRepository<CommunityJoinRequest, Long> {

    /**
     * Get all pending/approved/rejected requests
     * for a particular community.
     */
    List<CommunityJoinRequest> findByCommunityIdAndStatus(
            Long communityId,
            JoinRequestStatus status
    );

    /**
     * Check if a resident has already sent
     * a request to this community.
     */
    Optional<CommunityJoinRequest> findByUserIdAndCommunityId(
            Long userId,
            Long communityId
    );

    /**
     * Get all requests created by a resident.
     */
    List<CommunityJoinRequest> findByUserId(Long userId);

    /**
     * Get all requests for a community.
     */
    List<CommunityJoinRequest> findByCommunityId(Long communityId);

    /**
     * Check if a resident already has
     * an APPROVED request.
     */
    Optional<CommunityJoinRequest> findByUserIdAndStatus(
            Long userId,
            JoinRequestStatus status
    );
}