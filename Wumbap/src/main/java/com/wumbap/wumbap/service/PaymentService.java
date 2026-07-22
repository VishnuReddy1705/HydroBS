package com.wumbap.wumbap.service;

import com.wumbap.wumbap.dto.PaymentRequest.OfflinePaymentRequest;
import com.wumbap.wumbap.dto.PaymentRequest.PaymentVerifyRequest;
import com.wumbap.wumbap.dto.PaymentResponse;
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
import java.util.*;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final WaterBillRepository waterBillRepository;
    private final UserRepository userRepository;
    private final ReceiptRepository receiptRepository;
    private final RefundRepository refundRepository;
    private final EmailService emailService;
    private final PdfService pdfService;

    public Map<String, Object> createOrder(Long billId, String email) {
        WaterBill bill = loadAndVerifyOwnedBill(billId, email);

        if ("PAID".equalsIgnoreCase(bill.getStatus())) {
            throw new IllegalArgumentException("Bill is already paid.");
        }

        // Calculate outstanding balance
        BigDecimal outstanding = calculateOutstanding(billId);
        if (outstanding.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Bill has no outstanding balance.");
        }

        Map<String, Object> response = new HashMap<>();
        response.put("id", "order_mock_" + UUID.randomUUID().toString().substring(0, 8));
        response.put("entity", "order");
        response.put("amount", outstanding.multiply(new BigDecimal("100")).longValue());
        response.put("amount_paid", 0);
        response.put("amount_due", outstanding.multiply(new BigDecimal("100")).longValue());
        response.put("currency", "INR");
        response.put("receipt", "rcpt_" + bill.getId());
        response.put("status", "created");
        response.put("attempts", 0);
        response.put("notes", Map.of("billId", bill.getId()));
        response.put("created_at", System.currentTimeMillis() / 1000);

        return response;
    }

    public PaymentResponse verifyAndRecordPayment(PaymentVerifyRequest request, String email) {
        WaterBill bill = loadAndVerifyOwnedBill(request.getBillId(), email);

        if ("PAID".equalsIgnoreCase(bill.getStatus())) {
            throw new IllegalArgumentException("Bill is already paid.");
        }

        BigDecimal outstanding = calculateOutstanding(bill.getId());

        if ("SUCCESS".equalsIgnoreCase(request.getStatus())) {
            // Check for duplicate payment transaction
            List<Payment> existing = paymentRepository.findByBillIdAndStatus(bill.getId(), "COMPLETED");
            for (Payment p : existing) {
                if (p.getTransactionId() != null && p.getTransactionId().equals(request.getRazorpayPaymentId())) {
                    throw new IllegalArgumentException("Payment was already processed for transaction id: " + request.getRazorpayPaymentId());
                }
            }

            Payment payment = Payment.builder()
                    .bill(bill)
                    .amount(outstanding)
                    .paymentMethod("Razorpay (Demo)")
                    .transactionId(request.getRazorpayPaymentId() != null ? request.getRazorpayPaymentId() : "pay_mock_" + UUID.randomUUID().toString().substring(0, 8))
                    .status("COMPLETED")
                    .paidAt(LocalDateTime.now())
                    .build();

            // Save Payment
            payment = paymentRepository.save(payment);

            // Generate receipt
            Receipt receipt = generateReceipt(payment, bill);
            payment.setReceiptNumber(receipt.getReceiptNumber());
            paymentRepository.save(payment);

            // Update WaterBill status
            bill.setStatus("PAID");
            bill.setPaidAt(LocalDateTime.now());
            waterBillRepository.save(bill);

            // Trigger notifications
            try {
                byte[] pdfBytes = pdfService.generateWaterBillPdf(bill);
                emailService.sendWaterBillEmailWithAttachment(bill, pdfBytes);
                
                byte[] receiptPdfBytes = pdfService.generatePaymentReceiptPdf(payment, receipt);
                emailService.sendReceiptEmail(receipt, receiptPdfBytes);
            } catch (Exception e) {
                log.error("Failed to generate/email PDF receipt: {}", e.getMessage());
                emailService.sendPaymentSuccessEmail(bill, payment.getTransactionId());
            }

            return mapToResponse(payment);
        } else {
            Payment payment = Payment.builder()
                    .bill(bill)
                    .amount(outstanding)
                    .paymentMethod("Razorpay (Demo)")
                    .transactionId("pay_failed_" + UUID.randomUUID().toString().substring(0, 8))
                    .status("FAILED")
                    .paidAt(LocalDateTime.now())
                    .build();
            paymentRepository.save(payment);

            emailService.sendPaymentFailureEmail(bill, "Demo checkout transaction declined by user");
            throw new IllegalArgumentException("Payment transaction failed.");
        }
    }

    public PaymentResponse recordOfflinePayment(OfflinePaymentRequest request, String adminEmail) {
        WaterBill bill = waterBillRepository.findById(request.getBillId())
                .orElseThrow(() -> new IllegalArgumentException("Bill not found"));

        User admin = userRepository.findByEmail(adminEmail)
                .orElseThrow(() -> new IllegalArgumentException("Admin not found"));

        if (admin.getRole() != Role.SUPER_ADMIN && 
            (admin.getCommunity() == null || !admin.getCommunity().getId().equals(bill.getCommunity().getId()))) {
            throw new AccessDeniedException("You are not authorized to record payments for this community.");
        }

        BigDecimal outstanding = calculateOutstanding(bill.getId());

        if (request.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Payment amount must be greater than zero.");
        }

        if (request.getAmount().compareTo(outstanding) > 0) {
            throw new IllegalArgumentException("Payment amount exceeds outstanding balance of " + outstanding);
        }

        Payment payment = Payment.builder()
                .bill(bill)
                .amount(request.getAmount())
                .paymentMethod(request.getPaymentMethod() != null ? request.getPaymentMethod() : "CASH")
                .transactionId(request.getTransactionReference() != null && !request.getTransactionReference().isEmpty() 
                        ? request.getTransactionReference() : "offline_" + UUID.randomUUID().toString().substring(0, 8))
                .status("COMPLETED")
                .paidAt(LocalDateTime.now())
                .notes(request.getNotes())
                .build();

        payment = paymentRepository.save(payment);

        // Generate receipt
        Receipt receipt = generateReceipt(payment, bill);
        payment.setReceiptNumber(receipt.getReceiptNumber());
        paymentRepository.save(payment);

        // Check if fully or partially paid
        BigDecimal newOutstanding = outstanding.subtract(request.getAmount());
        if (newOutstanding.compareTo(BigDecimal.ZERO) <= 0) {
            bill.setStatus("PAID");
            bill.setPaidAt(LocalDateTime.now());
        } else {
            bill.setStatus("PARTIALLY_PAID");
        }
        waterBillRepository.save(bill);

        // Send confirmation email
        try {
            byte[] receiptPdfBytes = pdfService.generatePaymentReceiptPdf(payment, receipt);
            emailService.sendReceiptEmail(receipt, receiptPdfBytes);
        } catch (Exception e) {
            log.error("Failed to generate/email offline receipt PDF: {}", e.getMessage());
            emailService.sendPaymentSuccessEmail(bill, payment.getTransactionId());
        }

        return mapToResponse(payment);
    }

    public void reversePayment(Long paymentId, String reason, String adminEmail) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new IllegalArgumentException("Payment record not found"));

        User admin = userRepository.findByEmail(adminEmail)
                .orElseThrow(() -> new IllegalArgumentException("Admin not found"));

        WaterBill bill = payment.getBill();

        if (admin.getRole() != Role.SUPER_ADMIN && 
            (admin.getCommunity() == null || !admin.getCommunity().getId().equals(bill.getCommunity().getId()))) {
            throw new AccessDeniedException("You are not authorized to reverse payments for this community.");
        }

        if ("REVERSED".equalsIgnoreCase(payment.getStatus())) {
            throw new IllegalArgumentException("Payment is already reversed.");
        }

        // Update Payment to REVERSED status
        payment.setStatus("REVERSED");
        payment.setReversedAt(LocalDateTime.now());
        payment.setReversalReason(reason);
        paymentRepository.save(payment);

        // Update Receipt status if exists
        receiptRepository.findByPaymentId(paymentId).ifPresent(r -> {
            r.setStatus("REVERSED");
            receiptRepository.save(r);
        });

        // Recompute bill status based on remaining payments
        BigDecimal outstanding = calculateOutstanding(bill.getId());
        if (outstanding.compareTo(bill.getAmount()) >= 0) {
            bill.setStatus("GENERATED");
            bill.setPaidAt(null);
        } else if (outstanding.compareTo(BigDecimal.ZERO) > 0) {
            bill.setStatus("PARTIALLY_PAID");
            bill.setPaidAt(null);
        }
        waterBillRepository.save(bill);
    }

    @Transactional(readOnly = true)
    public BigDecimal calculateOutstanding(Long billId) {
        WaterBill bill = waterBillRepository.findById(billId)
                .orElseThrow(() -> new IllegalArgumentException("Bill not found"));

        List<Payment> payments = paymentRepository.findByBillId(billId);
        BigDecimal totalPaid = payments.stream()
                .filter(p -> "COMPLETED".equalsIgnoreCase(p.getStatus()))
                .map(Payment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return bill.getAmount().subtract(totalPaid).max(BigDecimal.ZERO);
    }

    @Transactional(readOnly = true)
    public Page<PaymentResponse> getHistory(String email, Pageable pageable) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Page<Payment> paymentPage;

        if (user.getRole() == Role.SUPER_ADMIN) {
            paymentPage = paymentRepository.findAll(pageable);
        } else if (user.getRole() == Role.ADMIN) {
            if (user.getCommunity() == null) {
                return Page.empty();
            }
            paymentPage = paymentRepository.findByBillCommunityId(user.getCommunity().getId(), pageable);
        } else { // RESIDENT
            paymentPage = paymentRepository.findByBillResidentId(user.getId(), pageable);
        }

        return paymentPage.map(this::mapToResponse);
    }

    @Transactional(readOnly = true)
    public byte[] getReceiptPdf(Long paymentId, String email) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new IllegalArgumentException("Payment record not found"));

        WaterBill bill = payment.getBill();
        loadAndVerifyOwnedBill(bill.getId(), email);

        Receipt receipt = receiptRepository.findByPaymentId(paymentId)
                .orElseThrow(() -> new IllegalArgumentException("Receipt not found for payment: " + paymentId));

        try {
            return pdfService.generatePaymentReceiptPdf(payment, receipt);
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate PDF receipt", e);
        }
    }

    private Receipt generateReceipt(Payment payment, WaterBill bill) {
        String receiptNum = "RCP-" + LocalDateTime.now().getYear() + "-" + (100000 + new Random().nextInt(900000));
        
        Receipt receipt = Receipt.builder()
                .receiptNumber(receiptNum)
                .payment(payment)
                .bill(bill)
                .resident(bill.getResident())
                .community(bill.getCommunity())
                .amount(payment.getAmount())
                .generatedAt(LocalDateTime.now())
                .status("GENERATED")
                .build();

        return receiptRepository.save(receipt);
    }

    private WaterBill loadAndVerifyOwnedBill(Long billId, String email) {
        WaterBill bill = waterBillRepository.findById(billId)
                .orElseThrow(() -> new IllegalArgumentException("Bill not found"));

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (user.getRole() == Role.RESIDENT) {
            if (bill.getResident() == null || !email.equalsIgnoreCase(bill.getResident().getEmail())) {
                throw new AccessDeniedException("You are not authorized to access this bill.");
            }
        } else if (user.getRole() == Role.ADMIN) {
            if (user.getCommunity() == null || !user.getCommunity().getId().equals(bill.getCommunity().getId())) {
                throw new AccessDeniedException("You are not authorized to access bills in this community.");
            }
        }
        return bill;
    }

    private PaymentResponse mapToResponse(Payment p) {
        return PaymentResponse.builder()
                .id(p.getId())
                .billId(p.getBill().getId())
                .billNumber(p.getBill().getBillNumber())
                .residentName(p.getBill().getResident() != null ? p.getBill().getResident().getFullName() : "N/A")
                .amount(p.getAmount())
                .paymentMethod(p.getPaymentMethod())
                .transactionId(p.getTransactionId())
                .status(p.getStatus())
                .paidAt(p.getPaidAt())
                .receiptNumber(p.getReceiptNumber())
                .notes(p.getNotes())
                .build();
    }
}
