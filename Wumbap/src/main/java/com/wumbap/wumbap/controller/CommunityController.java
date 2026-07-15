package com.wumbap.wumbap.controller;

import com.wumbap.wumbap.dto.CommunitySummary;
import com.wumbap.wumbap.dto.JoinRequestResponse;
import com.wumbap.wumbap.dto.MyJoinRequestResponse;
import com.wumbap.wumbap.entity.Community;
import com.wumbap.wumbap.entity.CommunityJoinRequest;
import com.wumbap.wumbap.entity.JoinRequestStatus;
import com.wumbap.wumbap.entity.Role;
import com.wumbap.wumbap.entity.User;
import com.wumbap.wumbap.repository.CommunityJoinRequestRepository;
import com.wumbap.wumbap.repository.CommunityRepository;
import com.wumbap.wumbap.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/communities")
@RequiredArgsConstructor
public class CommunityController {

    private final CommunityRepository communityRepository;
    private final UserRepository userRepository;
    private final CommunityJoinRequestRepository joinRequestRepository;
    private final com.wumbap.wumbap.service.AuditLogService auditLogService;

    @GetMapping("/public")
    public List<CommunitySummary> getCommunities(
            @RequestParam(required = false) String search
    ) {

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

    @PostMapping("/{communityId}/join-request")
    @PreAuthorize("hasRole('RESIDENT')")
    public ResponseEntity<?> sendJoinRequest(
            @PathVariable Long communityId,
            Authentication authentication
    ) {

        User resident = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("Resident not found"));

        if (resident.getCommunity() != null) {
            return ResponseEntity.badRequest()
                    .body("You already belong to a community.");
        }

        if (joinRequestRepository
                .findByUserIdAndCommunityId(resident.getId(), communityId)
                .isPresent()) {

            return ResponseEntity.badRequest()
                    .body("Join request already exists.");
        }

        Community community = communityRepository.findById(communityId)
                .orElseThrow(() -> new RuntimeException("Community not found"));

        CommunityJoinRequest request = CommunityJoinRequest.builder()
                .user(resident)
                .community(community)
                .status(JoinRequestStatus.PENDING)
                .build();

        joinRequestRepository.save(request);

        return ResponseEntity.ok("Join request sent successfully.");
    }

    @GetMapping("/join-requests/pending")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public List<JoinRequestResponse> pendingRequests(
            @RequestParam(required = false) Long communityId,
            Authentication authentication
    ) {

        User admin = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("Admin not found"));

        Long targetCommunityId = communityId;
        if (admin.getRole() != Role.SUPER_ADMIN) {
            if (admin.getCommunity() == null) {
                return List.of();
            }
            targetCommunityId = admin.getCommunity().getId();
        }

        List<CommunityJoinRequest> requests;
        if (targetCommunityId == null) {
            requests = joinRequestRepository.findByStatus(JoinRequestStatus.PENDING);
        } else {
            requests = joinRequestRepository.findByCommunityIdAndStatus(targetCommunityId, JoinRequestStatus.PENDING);
        }

        return requests.stream()
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

    @GetMapping("/my-requests")
    @PreAuthorize("hasRole('RESIDENT')")
    public List<MyJoinRequestResponse> myRequests(Authentication authentication) {

        User resident = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("Resident not found"));

        return joinRequestRepository.findByUserId(resident.getId())
                .stream()
                .map(request -> new MyJoinRequestResponse(
                        request.getId(),
                        request.getCommunity().getId(),
                        request.getCommunity().getName(),
                        request.getStatus().name()
                ))
                .toList();
    }

    @PostMapping("/join-requests/{requestId}/approve")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<?> approveJoinRequest(
            @PathVariable Long requestId,
            Authentication authentication
    ) {

        User admin = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("Admin not found"));

        CommunityJoinRequest request = joinRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Join request not found"));

        if (admin.getRole() != Role.SUPER_ADMIN) {
            if (admin.getCommunity() == null || !request.getCommunity().getId().equals(admin.getCommunity().getId())) {
                return ResponseEntity.status(403)
                        .body("You cannot approve requests for another community.");
            }
        }

        request.setStatus(JoinRequestStatus.APPROVED);
        request.setDecidedAt(LocalDateTime.now());

        User resident = request.getUser();
        resident.setCommunity(request.getCommunity());

        userRepository.save(resident);
        joinRequestRepository.save(request);

        auditLogService.log(authentication.getName(), "APPROVE_RESIDENT", "Approved resident: " + resident.getEmail() + " for flat: " + resident.getFlatNumber() + " in community: " + request.getCommunity().getName());
        return ResponseEntity.ok("Resident approved successfully.");
    }

    @PostMapping("/join-requests/{requestId}/reject")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<?> rejectJoinRequest(
            @PathVariable Long requestId,
            Authentication authentication
    ) {

        User admin = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("Admin not found"));

        CommunityJoinRequest request = joinRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Join request not found"));

        if (admin.getRole() != Role.SUPER_ADMIN) {
            if (admin.getCommunity() == null || !request.getCommunity().getId().equals(admin.getCommunity().getId())) {
                return ResponseEntity.status(403)
                        .body("You cannot reject requests for another community.");
            }
        }

        request.setStatus(JoinRequestStatus.REJECTED);
        request.setDecidedAt(LocalDateTime.now());

        joinRequestRepository.save(request);

        auditLogService.log(authentication.getName(), "REJECT_RESIDENT", "Rejected resident: " + request.getUser().getEmail() + " in community: " + request.getCommunity().getName());
        return ResponseEntity.ok("Resident rejected successfully.");
    }
}