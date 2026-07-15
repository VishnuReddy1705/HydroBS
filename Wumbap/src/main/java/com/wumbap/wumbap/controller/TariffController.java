package com.wumbap.wumbap.controller;

import com.wumbap.wumbap.dto.TariffRequest;
import com.wumbap.wumbap.dto.TariffResponse;
import com.wumbap.wumbap.entity.Role;
import com.wumbap.wumbap.entity.User;
import com.wumbap.wumbap.repository.UserRepository;
import com.wumbap.wumbap.service.TariffService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/communities/{communityId}/tariffs")
@RequiredArgsConstructor
public class TariffController {

    private final TariffService tariffService;
    private final UserRepository userRepository;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<List<TariffResponse>> getTariffs(
            @PathVariable Long communityId,
            Authentication authentication) {
        checkAccess(communityId, authentication);
        return ResponseEntity.ok(tariffService.getTariffsByCommunity(communityId));
    }

    @GetMapping("/active")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN', 'RESIDENT')")
    public ResponseEntity<TariffResponse> getActiveTariff(
            @PathVariable Long communityId,
            Authentication authentication) {
        checkAccess(communityId, authentication);
        return tariffService.getActiveTariffByCommunity(communityId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<TariffResponse> createTariff(
            @PathVariable Long communityId,
            @RequestBody TariffRequest request,
            Authentication authentication) {
        checkAccess(communityId, authentication);
        return ResponseEntity.ok(tariffService.createTariff(communityId, request));
    }

    @PutMapping("/{tariffId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<TariffResponse> updateTariff(
            @PathVariable Long communityId,
            @PathVariable Long tariffId,
            @RequestBody TariffRequest request,
            Authentication authentication) {
        checkAccess(communityId, authentication);
        return ResponseEntity.ok(tariffService.updateTariff(communityId, tariffId, request));
    }

    @DeleteMapping("/{tariffId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<Void> deleteTariff(
            @PathVariable Long communityId,
            @PathVariable Long tariffId,
            Authentication authentication) {
        checkAccess(communityId, authentication);
        tariffService.deleteTariff(communityId, tariffId);
        return ResponseEntity.ok().build();
    }

    private void checkAccess(Long communityId, Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (user.getRole() == Role.SUPER_ADMIN) {
            return;
        }

        if (user.getCommunity() == null || !user.getCommunity().getId().equals(communityId)) {
            throw new org.springframework.security.access.AccessDeniedException("Access denied to this community's settings");
        }
    }
}
