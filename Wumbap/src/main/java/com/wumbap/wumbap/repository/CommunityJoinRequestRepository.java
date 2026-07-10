package com.wumbap.wumbap.repository;

import com.wumbap.wumbap.entity.CommunityJoinRequest;
import com.wumbap.wumbap.entity.JoinRequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CommunityJoinRequestRepository extends JpaRepository<CommunityJoinRequest, Long> {

    /**
     * All requests of a resident.
     */
    List<CommunityJoinRequest> findByUserId(Long userId);

    /**
     * All requests for a community.
     */
    List<CommunityJoinRequest> findByCommunityId(Long communityId);

    /**
     * Requests of a community filtered by status.
     */
    List<CommunityJoinRequest> findByCommunityIdAndStatus(
            Long communityId,
            JoinRequestStatus status
    );

    /**
     * Check whether a resident already requested
     * to join a particular community.
     */
    Optional<CommunityJoinRequest> findByUserIdAndCommunityId(
            Long userId,
            Long communityId
    );

    /**
     * Check whether a resident already has a request
     * with a particular status.
     */
    Optional<CommunityJoinRequest> findByUserIdAndStatus(
            Long userId,
            JoinRequestStatus status
    );

    /**
     * Dashboard statistics.
     */
    long countByCommunityIdAndStatus(
            Long communityId,
            JoinRequestStatus status
    );

}