package com.wumbap.wumbap.controller;

import com.wumbap.wumbap.entity.Refund;
import com.wumbap.wumbap.service.RefundService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/refunds")
@RequiredArgsConstructor
public class RefundController {

    private final RefundService refundService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<?> initiateRefund(@RequestBody Map<String, Object> payload, Authentication authentication) {
        Long paymentId = Long.valueOf(payload.get("paymentId").toString());
        BigDecimal amount = new BigDecimal(payload.get("amount").toString());
        String reason = (String) payload.getOrDefault("reason", "Requested Refund");
        Refund refund = refundService.initiateRefund(paymentId, amount, reason, authentication.getName());
        return ResponseEntity.ok(mapToResponse(refund));
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<?> approveRefund(@PathVariable Long id, Authentication authentication) {
        Refund refund = refundService.approveRefund(id, authentication.getName());
        return ResponseEntity.ok(mapToResponse(refund));
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<?> rejectRefund(@PathVariable Long id, @RequestBody Map<String, String> payload, Authentication authentication) {
        String reason = payload.getOrDefault("reason", "Disallowed");
        Refund refund = refundService.rejectRefund(id, reason, authentication.getName());
        return ResponseEntity.ok(mapToResponse(refund));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<?> getRefundHistory(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            Authentication authentication) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("requestedAt").descending());
        Page<Refund> refunds = refundService.getRefundHistory(authentication.getName(), pageable);
        return ResponseEntity.ok(refunds.map(this::mapToResponse));
    }

    private Map<String, Object> mapToResponse(Refund r) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", r.getId());
        map.put("refundNumber", r.getRefundNumber());
        map.put("paymentId", r.getPayment().getId());
        map.put("billId", r.getBill().getId());
        map.put("billNumber", r.getBill().getBillNumber());
        map.put("residentName", r.getBill().getResident() != null ? r.getBill().getResident().getFullName() : "N/A");
        map.put("amount", r.getAmount());
        map.put("reason", r.getReason());
        map.put("status", r.getStatus());
        map.put("requestedBy", r.getRequestedBy().getFullName());
        map.put("approvedBy", r.getApprovedBy() != null ? r.getApprovedBy().getFullName() : null);
        map.put("requestedAt", r.getRequestedAt().toString());
        map.put("processedAt", r.getProcessedAt() != null ? r.getProcessedAt().toString() : null);
        map.put("notes", r.getNotes());
        return map;
    }
}
