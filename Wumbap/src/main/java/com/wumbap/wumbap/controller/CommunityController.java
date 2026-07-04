package com.wumbap.wumbap.controller;
import com.wumbap.wumbap.entity.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import java.time.LocalDateTime;
import com.wumbap.wumbap.dto.CommunitySummary;
import com.wumbap.wumbap.dto.JoinRequestResponse;
import com.wumbap.wumbap.entity.Community;
import com.wumbap.wumbap.dto.MyJoinRequestResponse;
import com.wumbap.wumbap.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/communities")
@RequiredArgsConstructor
public class CommunityController {

    private final CommunityRepository communityRepository;

    private final UserRepository userRepository;

    private final CommunityJoinRequestRepository joinRequestRepository;

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
            Authentication authentication) {

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
    @PreAuthorize("hasRole('ADMIN')")
    public List<JoinRequestResponse> pendingRequests(Authentication auth) {
        User admin = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("Admin not found"));
        Long communityId = admin.getCommunity().getId();

        return joinRequestRepository.findByCommunityIdAndStatus(communityId, JoinRequestStatus.PENDING)
                .stream()
                .map(r -> new JoinRequestResponse(r.getId(), r.getUser().getId(),
                        r.getUser().getFullName(), r.getUser().getEmail(), r.getUser().getFlatNumber(), r.getRequestedAt()))
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
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> approveJoinRequest(
            @PathVariable Long requestId,
            Authentication authentication) {

        User admin = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("Admin not found"));

        CommunityJoinRequest request = joinRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Join request not found"));

        // Security check
        if (!request.getCommunity().getId().equals(admin.getCommunity().getId())) {
            return ResponseEntity.status(403)
                    .body("You cannot approve requests for another community.");
        }

        request.setStatus(JoinRequestStatus.APPROVED);
        request.setDecidedAt(LocalDateTime.now());

        User resident = request.getUser();
        resident.setCommunity(request.getCommunity());

        userRepository.save(resident);
        joinRequestRepository.save(request);

        return ResponseEntity.ok("Resident approved successfully.");
    }
    @PostMapping("/join-requests/{requestId}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> rejectJoinRequest(
            @PathVariable Long requestId,
            Authentication authentication) {

        User admin = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("Admin not found"));

        CommunityJoinRequest request = joinRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Join request not found"));

        if (!request.getCommunity().getId().equals(admin.getCommunity().getId())) {
            return ResponseEntity.status(403)
                    .body("You cannot reject requests for another community.");
        }

        request.setStatus(JoinRequestStatus.REJECTED);
        request.setDecidedAt(LocalDateTime.now());

        joinRequestRepository.save(request);

        return ResponseEntity.ok("Resident rejected successfully.");
    }
}