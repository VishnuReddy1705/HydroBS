package com.wumbap.wumbap.service;

import com.wumbap.wumbap.entity.*;
import com.wumbap.wumbap.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Random;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class RefundService {

    private final RefundRepository refundRepository;
    private final PaymentRepository paymentRepository;
    private final WaterBillRepository waterBillRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;

    public Refund initiateRefund(Long paymentId, BigDecimal amount, String reason, String requesterEmail) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new IllegalArgumentException("Payment record not found"));

        User requester = userRepository.findByEmail(requesterEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        WaterBill bill = payment.getBill();

        // Check if admin is authorized for this community
        if (requester.getRole() != Role.SUPER_ADMIN && 
            (requester.getCommunity() == null || !requester.getCommunity().getId().equals(bill.getCommunity().getId()))) {
            throw new AccessDeniedException("You are not authorized to initiate refunds for this community.");
        }

        if (!"COMPLETED".equalsIgnoreCase(payment.getStatus())) {
            throw new IllegalArgumentException("Cannot refund a payment with status: " + payment.getStatus());
        }

        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Refund amount must be greater than zero.");
        }

        if (amount.compareTo(payment.getAmount()) > 0) {
            throw new IllegalArgumentException("Refund amount cannot exceed payment amount of " + payment.getAmount());
        }

        // Check if there is already an active refund
        List<Refund> existing = refundRepository.findByBillId(bill.getId());
        BigDecimal totalRefunded = existing.stream()
                .filter(r -> "APPROVED".equalsIgnoreCase(r.getStatus()) || "PENDING".equalsIgnoreCase(r.getStatus()) || "PROCESSED".equalsIgnoreCase(r.getStatus()))
                .map(Refund::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        if (totalRefunded.add(amount).compareTo(payment.getAmount()) > 0) {
            throw new IllegalArgumentException("Total refunds exceed the original payment amount.");
        }

        String refundNumber = "REF-" + LocalDateTime.now().getYear() + "-" + (100000 + new Random().nextInt(900000));

        Refund refund = Refund.builder()
                .refundNumber(refundNumber)
                .payment(payment)
                .bill(bill)
                .amount(amount)
                .reason(reason)
                .status("PENDING")
                .requestedBy(requester)
                .requestedAt(LocalDateTime.now())
                .build();

        refund = refundRepository.save(refund);

        try {
            emailService.sendRefundInitiatedEmail(refund);
        } catch (Exception e) {
            log.error("Failed to send refund initiation email: {}", e.getMessage());
        }

        return refund;
    }

    public Refund approveRefund(Long refundId, String approverEmail) {
        Refund refund = refundRepository.findById(refundId)
                .orElseThrow(() -> new IllegalArgumentException("Refund request not found"));

        User approver = userRepository.findByEmail(approverEmail)
                .orElseThrow(() -> new IllegalArgumentException("Approver user not found"));

        if (approver.getRole() != Role.SUPER_ADMIN) {
            throw new AccessDeniedException("Only Super Admins can approve refund requests.");
        }

        if (!"PENDING".equalsIgnoreCase(refund.getStatus())) {
            throw new IllegalArgumentException("Refund request is already processed. Status: " + refund.getStatus());
        }

        refund.setStatus("APPROVED");
        refund.setApprovedBy(approver);
        refund.setProcessedAt(LocalDateTime.now());
        refund = refundRepository.save(refund);

        // Update Payment status to REFUNDED
        Payment payment = refund.getPayment();
        payment.setStatus("REFUNDED");
        paymentRepository.save(payment);

        // Reset Bill status back to UNPAID/GENERATED
        WaterBill bill = refund.getBill();
        bill.setStatus("GENERATED");
        bill.setPaidAt(null);
        waterBillRepository.save(bill);

        try {
            emailService.sendRefundApprovedEmail(refund);
        } catch (Exception e) {
            log.error("Failed to send refund approval email: {}", e.getMessage());
        }

        return refund;
    }

    public Refund rejectRefund(Long refundId, String reason, String approverEmail) {
        Refund refund = refundRepository.findById(refundId)
                .orElseThrow(() -> new IllegalArgumentException("Refund request not found"));

        User approver = userRepository.findByEmail(approverEmail)
                .orElseThrow(() -> new IllegalArgumentException("Approver user not found"));

        if (approver.getRole() != Role.SUPER_ADMIN) {
            throw new AccessDeniedException("Only Super Admins can reject refund requests.");
        }

        if (!"PENDING".equalsIgnoreCase(refund.getStatus())) {
            throw new IllegalArgumentException("Refund request is already processed. Status: " + refund.getStatus());
        }

        refund.setStatus("REJECTED");
        refund.setApprovedBy(approver);
        refund.setProcessedAt(LocalDateTime.now());
        refund.setNotes("Rejected Reason: " + reason);
        return refundRepository.save(refund);
    }

    @Transactional(readOnly = true)
    public Page<Refund> getRefundHistory(String email, Pageable pageable) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (user.getRole() == Role.SUPER_ADMIN) {
            return refundRepository.findAll(pageable);
        } else if (user.getRole() == Role.ADMIN) {
            if (user.getCommunity() == null) {
                return Page.empty();
            }
            return refundRepository.findByBillCommunityId(user.getCommunity().getId(), pageable);
        } else {
            throw new AccessDeniedException("Residents are not authorized to view refund history.");
        }
    }
}
