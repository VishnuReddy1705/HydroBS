package com.wumbap.wumbap.controller;

import com.wumbap.wumbap.dto.PaymentRequest.OfflinePaymentRequest;
import com.wumbap.wumbap.dto.PaymentRequest.PaymentVerifyRequest;
import com.wumbap.wumbap.dto.PaymentResponse;
import com.wumbap.wumbap.service.PaymentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Map;

import org.springframework.transaction.annotation.Transactional;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
@Transactional(readOnly = true)
@Slf4j
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping("/create-order")
    @PreAuthorize("hasRole('RESIDENT')")
    @Transactional
    public ResponseEntity<?> createOrder(@RequestBody Map<String, Object> payload, Authentication authentication) {
        Long billId = Long.valueOf(payload.get("billId").toString());
        return ResponseEntity.ok(paymentService.createOrder(billId, authentication.getName()));
    }

    @PostMapping("/verify")
    @PreAuthorize("hasRole('RESIDENT')")
    @Transactional
    public ResponseEntity<?> verifyPayment(@RequestBody PaymentVerifyRequest request, Authentication authentication) {
        PaymentResponse response = paymentService.verifyAndRecordPayment(request, authentication.getName());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/record-offline")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    @Transactional
    public ResponseEntity<?> recordOfflinePayment(@RequestBody OfflinePaymentRequest request, Authentication authentication) {
        PaymentResponse response = paymentService.recordOfflinePayment(request, authentication.getName());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/reverse")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    @Transactional
    public ResponseEntity<?> reversePayment(@PathVariable Long id, @RequestBody Map<String, String> payload, Authentication authentication) {
        String reason = payload.getOrDefault("reason", "Administrative reversal");
        paymentService.reversePayment(id, reason, authentication.getName());
        return ResponseEntity.ok(Map.of("message", "Payment reversed successfully."));
    }

    @GetMapping("/outstanding/{billId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN', 'RESIDENT')")
    public ResponseEntity<?> getOutstanding(@PathVariable Long billId) {
        BigDecimal outstanding = paymentService.calculateOutstanding(billId);
        return ResponseEntity.ok(Map.of("billId", billId, "outstanding", outstanding));
    }

    @GetMapping("/history")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN', 'RESIDENT')")
    public ResponseEntity<?> getPaymentHistory(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            Authentication authentication) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("paidAt").descending());
        Page<PaymentResponse> history = paymentService.getHistory(authentication.getName(), pageable);
        return ResponseEntity.ok(history);
    }

    @GetMapping("/{id}/receipt")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN', 'RESIDENT')")
    public ResponseEntity<byte[]> downloadReceipt(@PathVariable Long id, Authentication authentication) {
        byte[] pdfBytes = paymentService.getReceiptPdf(id, authentication.getName());
        return ResponseEntity.ok()
                .header("Content-Type", "application/pdf")
                .header("Content-Disposition", "attachment; filename=\"Receipt_" + id + ".pdf\"")
                .body(pdfBytes);
    }
}
