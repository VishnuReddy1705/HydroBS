package com.wumbap.wumbap.service;

import com.wumbap.wumbap.dto.CommunitySummary;
import com.wumbap.wumbap.dto.JoinRequestResponse;
import com.wumbap.wumbap.entity.*;
import com.wumbap.wumbap.repository.CommunityJoinRequestRepository;
import com.wumbap.wumbap.repository.CommunityRepository;
import com.wumbap.wumbap.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CommunityService {

    private final CommunityRepository communityRepository;
    private final UserRepository userRepository;
    private final CommunityJoinRequestRepository joinRequestRepository;

    public List<CommunitySummary> getCommunities(String search) {

        List<Community> communities =
                (search == null || search.isBlank())
                        ? communityRepository.findAll()
                        : communityRepository.findByNameContainingIgnoreCase(search);

        return communities.stream()
                .map(c -> new CommunitySummary(
                        c.getId(),
                        c.getName()
                ))
                .toList();
    }

    public String sendJoinRequest(String email, Long communityId) {

        User resident = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Resident not found"));

        if (resident.getCommunity() != null) {
            throw new RuntimeException("You already belong to a community.");
        }

        if (joinRequestRepository
                .findByUserIdAndCommunityId(resident.getId(), communityId)
                .isPresent()) {

            throw new RuntimeException("Join request already exists.");
        }

        Community community = communityRepository.findById(communityId)
                .orElseThrow(() -> new RuntimeException("Community not found"));

        CommunityJoinRequest request = CommunityJoinRequest.builder()
                .user(resident)
                .community(community)
                .status(JoinRequestStatus.PENDING)
                .build();

        joinRequestRepository.save(request);

        return "Join request sent successfully.";
    }

    public List<JoinRequestResponse> getPendingRequests(String adminEmail) {

        User admin = userRepository.findByEmail(adminEmail)
                .orElseThrow(() -> new RuntimeException("Admin not found"));

        Long communityId = admin.getCommunity().getId();

        return joinRequestRepository
                .findByCommunityIdAndStatus(
                        communityId,
                        JoinRequestStatus.PENDING
                )
                .stream()
                .map(request -> new JoinRequestResponse(
                        request.getId(),
                        request.getUser().getId(),
                        request.getUser().getFullName(),
                        request.getUser().getEmail(),
                        request.getUser().getFlatNumber(),
                        request.getCommunity().getName(),
                        request.getRequestedAt()
                ))
                .toList();
    }

    public String approveRequest(String adminEmail, Long requestId) {

        User admin = userRepository.findByEmail(adminEmail)
                .orElseThrow(() -> new RuntimeException("Admin not found"));

        CommunityJoinRequest request = joinRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Join request not found"));

        if (!request.getCommunity().getId().equals(admin.getCommunity().getId())) {
            throw new RuntimeException("Unauthorized");
        }

        request.setStatus(JoinRequestStatus.APPROVED);
        request.setDecidedAt(LocalDateTime.now());

        User resident = request.getUser();
        resident.setCommunity(request.getCommunity());

        userRepository.save(resident);
        joinRequestRepository.save(request);

        return "Resident approved successfully.";
    }

    public String rejectRequest(String adminEmail, Long requestId) {

        User admin = userRepository.findByEmail(adminEmail)
                .orElseThrow(() -> new RuntimeException("Admin not found"));

        CommunityJoinRequest request = joinRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Join request not found"));

        if (!request.getCommunity().getId().equals(admin.getCommunity().getId())) {
            throw new RuntimeException("Unauthorized");
        }

        request.setStatus(JoinRequestStatus.REJECTED);
        request.setDecidedAt(LocalDateTime.now());

        joinRequestRepository.save(request);

        return "Resident rejected successfully.";
    }
}