package com.wumbap.wumbap.controller;

import com.wumbap.wumbap.dto.BillingCycleDto;
import com.wumbap.wumbap.entity.*;
import com.wumbap.wumbap.repository.BillingCycleRepository;
import com.wumbap.wumbap.repository.CommunityRepository;
import com.wumbap.wumbap.repository.UserRepository;
import com.wumbap.wumbap.service.AuditLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/billing-cycles")
@RequiredArgsConstructor
public class BillingCycleController {

    private final BillingCycleRepository billingCycleRepository;
    private final CommunityRepository communityRepository;
    private final UserRepository userRepository;
    private final AuditLogService auditLogService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN', 'RESIDENT')")
    public ResponseEntity<?> getCycles(@RequestParam(required = false) Long communityId, Authentication authentication) {
        User caller = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("Caller not found"));

        Long commId = communityId;
        if (caller.getRole() == Role.RESIDENT) {
            commId = caller.getCommunity().getId();
        } else if (caller.getRole() == Role.ADMIN) {
            commId = caller.getCommunity().getId();
        }

        List<BillingCycle> cycles;
        if (commId != null) {
            cycles = billingCycleRepository.findByCommunityId(commId);
        } else {
            cycles = billingCycleRepository.findAll();
        }

        List<BillingCycleDto> dtos = cycles.stream().map(c -> BillingCycleDto.builder()
                .id(c.getId())
                .communityId(c.getCommunity().getId())
                .name(c.getName())
                .startDate(c.getStartDate())
                .endDate(c.getEndDate())
                .status(c.getStatus())
                .build()).collect(Collectors.toList());

        return ResponseEntity.ok(dtos);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<?> createCycle(@RequestBody BillingCycleDto dto, Authentication authentication) {
        User caller = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("Caller not found"));

        Long commId = dto.getCommunityId();
        if (caller.getRole() == Role.ADMIN) {
            commId = caller.getCommunity().getId();
        }

        if (commId == null) {
            return ResponseEntity.badRequest().body("Community ID is required");
        }

        Community community = communityRepository.findById(commId)
                .orElseThrow(() -> new RuntimeException("Community not found"));

        BillingCycle cycle = BillingCycle.builder()
                .community(community)
                .name(dto.getName())
                .startDate(dto.getStartDate())
                .endDate(dto.getEndDate())
                .status("OPEN")
                .build();

        billingCycleRepository.save(cycle);
        auditLogService.log(caller.getEmail(), "BILLING_CYCLE_CREATE", "Created billing cycle: " + cycle.getName());
        
        dto.setId(cycle.getId());
        dto.setStatus("OPEN");
        return ResponseEntity.ok(dto);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<?> updateCycle(@PathVariable Long id, @RequestBody BillingCycleDto dto, Authentication authentication) {
        User caller = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("Caller not found"));

        BillingCycle cycle = billingCycleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Billing cycle not found"));

        if (caller.getRole() == Role.ADMIN && !cycle.getCommunity().getId().equals(caller.getCommunity().getId())) {
            return ResponseEntity.status(403).body("Access denied");
        }

        cycle.setName(dto.getName());
        cycle.setStartDate(dto.getStartDate());
        cycle.setEndDate(dto.getEndDate());
        billingCycleRepository.save(cycle);

        auditLogService.log(caller.getEmail(), "BILLING_CYCLE_UPDATE", "Updated billing cycle: " + cycle.getName());
        return ResponseEntity.ok(dto);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<?> deleteCycle(@PathVariable Long id, Authentication authentication) {
        User caller = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("Caller not found"));

        BillingCycle cycle = billingCycleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Billing cycle not found"));

        if (caller.getRole() == Role.ADMIN && !cycle.getCommunity().getId().equals(caller.getCommunity().getId())) {
            return ResponseEntity.status(403).body("Access denied");
        }

        billingCycleRepository.delete(cycle);
        auditLogService.log(caller.getEmail(), "BILLING_CYCLE_DELETE", "Deleted billing cycle: " + cycle.getName());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/transition")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<?> transitionStatus(@PathVariable Long id, @RequestParam String status, Authentication authentication) {
        User caller = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("Caller not found"));

        BillingCycle cycle = billingCycleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Billing cycle not found"));

        if (caller.getRole() == Role.ADMIN && !cycle.getCommunity().getId().equals(caller.getCommunity().getId())) {
            return ResponseEntity.status(403).body("Access denied");
        }

        String targetStatus = status.toUpperCase();
        if (!List.of("OPEN", "ACTIVE", "FINALIZED", "ARCHIVED").contains(targetStatus)) {
            return ResponseEntity.badRequest().body("Invalid cycle status");
        }

        cycle.setStatus(targetStatus);
        billingCycleRepository.save(cycle);

        auditLogService.log(caller.getEmail(), "BILLING_CYCLE_TRANSITION", "Transitioned billing cycle: " + cycle.getName() + " to " + targetStatus);
        return ResponseEntity.ok(BillingCycleDto.builder()
                .id(cycle.getId())
                .communityId(cycle.getCommunity().getId())
                .name(cycle.getName())
                .startDate(cycle.getStartDate())
                .endDate(cycle.getEndDate())
                .status(cycle.getStatus())
                .build());
    }

    @PostMapping("/{id}/reopen")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<?> reopenCycle(@PathVariable Long id, Authentication authentication) {
        User caller = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("Caller not found"));

        BillingCycle cycle = billingCycleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Billing cycle not found"));

        // Only Admin/Super Admin can reopen
        if (caller.getRole() != Role.ADMIN && caller.getRole() != Role.SUPER_ADMIN) {
            return ResponseEntity.status(403).body("Access denied. Admin only.");
        }
        if (caller.getRole() == Role.ADMIN && !cycle.getCommunity().getId().equals(caller.getCommunity().getId())) {
            return ResponseEntity.status(403).body("Access denied");
        }

        cycle.setStatus("ACTIVE");
        billingCycleRepository.save(cycle);

        auditLogService.log(caller.getEmail(), "BILLING_CYCLE_REOPEN", "Reopened billing cycle: " + cycle.getName());
        return ResponseEntity.ok(BillingCycleDto.builder()
                .id(cycle.getId())
                .communityId(cycle.getCommunity().getId())
                .name(cycle.getName())
                .startDate(cycle.getStartDate())
                .endDate(cycle.getEndDate())
                .status(cycle.getStatus())
                .build());
    }
}
