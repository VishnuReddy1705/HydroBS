package com.wumbap.wumbap.controller;

import com.wumbap.wumbap.entity.Payment;
import com.wumbap.wumbap.entity.WaterBill;
import com.wumbap.wumbap.repository.PaymentRepository;
import com.wumbap.wumbap.repository.WaterBillRepository;
import com.wumbap.wumbap.service.EmailService;
import com.wumbap.wumbap.service.PdfService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
@Slf4j
public class PaymentController {

    private final WaterBillRepository waterBillRepository;
    private final PaymentRepository paymentRepository;
    private final EmailService emailService;
    private final PdfService pdfService;

    @PostMapping("/create-order")
    @PreAuthorize("hasRole('RESIDENT')")
    public ResponseEntity<?> createOrder(@RequestBody Map<String, Object> payload) {
        Long billId = Long.valueOf(payload.get("billId").toString());
        WaterBill bill = waterBillRepository.findById(billId)
                .orElseThrow(() -> new IllegalArgumentException("Bill not found"));

        if ("PAID".equalsIgnoreCase(bill.getStatus())) {
            return ResponseEntity.badRequest().body("Bill is already paid.");
        }

        // Mock Razorpay Order details
        Map<String, Object> response = new HashMap<>();
        response.put("id", "order_mock_" + UUID.randomUUID().toString().substring(0, 8));
        response.put("entity", "order");
        // Razorpay amounts are in paise (cents equivalent)
        response.put("amount", bill.getAmount().multiply(new BigDecimal("100")).longValue());
        response.put("amount_paid", 0);
        response.put("amount_due", bill.getAmount().multiply(new BigDecimal("100")).longValue());
        response.put("currency", "INR");
        response.put("receipt", "rcpt_" + bill.getId());
        response.put("status", "created");
        response.put("attempts", 0);
        response.put("notes", Map.of("billId", bill.getId()));
        response.put("created_at", System.currentTimeMillis() / 1000);

        return ResponseEntity.ok(response);
    }

    @PostMapping("/verify")
    @PreAuthorize("hasRole('RESIDENT')")
    public ResponseEntity<?> verifyPayment(@RequestBody Map<String, Object> payload, Authentication authentication) {
        Long billId = Long.valueOf(payload.get("billId").toString());
        String razorpayPaymentId = (String) payload.get("razorpayPaymentId");
        String razorpayOrderId = (String) payload.get("razorpayOrderId");
        String signature = (String) payload.get("signature");
        String status = (String) payload.get("status"); // SUCCESS or FAILED

        WaterBill bill = waterBillRepository.findById(billId)
                .orElseThrow(() -> new IllegalArgumentException("Bill not found"));

        if ("PAID".equalsIgnoreCase(bill.getStatus())) {
            return ResponseEntity.badRequest().body("Bill is already paid.");
        }

        if ("SUCCESS".equalsIgnoreCase(status)) {
            // Save Payment transaction log
            Payment payment = Payment.builder()
                    .bill(bill)
                    .amount(bill.getAmount())
                    .paymentMethod("Razorpay (Demo)")
                    .transactionId(razorpayPaymentId != null ? razorpayPaymentId : "pay_mock_" + UUID.randomUUID().toString().substring(0, 8))
                    .status("COMPLETED")
                    .paidAt(LocalDateTime.now())
                    .build();
            paymentRepository.save(payment);

            // Update WaterBill status
            bill.setStatus("PAID");
            bill.setPaidAt(LocalDateTime.now());
            waterBillRepository.save(bill);

            // Trigger Email Notification with PDF attachment
            try {
                byte[] pdfBytes = pdfService.generateWaterBillPdf(bill);
                emailService.sendWaterBillEmailWithAttachment(bill, pdfBytes);
                emailService.sendPaymentSuccessEmail(bill, payment.getTransactionId());
            } catch (Exception e) {
                log.error("Failed to generate/email PDF invoice: {}", e.getMessage());
                emailService.sendPaymentSuccessEmail(bill, payment.getTransactionId());
            }

            return ResponseEntity.ok(Map.of("message", "Payment verified and recorded successfully.", "status", "PAID"));
        } else {
            // Log failed payment
            Payment payment = Payment.builder()
                    .bill(bill)
                    .amount(bill.getAmount())
                    .paymentMethod("Razorpay (Demo)")
                    .transactionId("pay_failed_" + UUID.randomUUID().toString().substring(0, 8))
                    .status("FAILED")
                    .paidAt(LocalDateTime.now())
                    .build();
            paymentRepository.save(payment);

            emailService.sendPaymentFailureEmail(bill, "Demo checkout transaction declined by user");
            return ResponseEntity.ok(Map.of("message", "Payment failed and recorded.", "status", "FAILED"));
        }
    }

    @GetMapping("/history")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN', 'RESIDENT')")
    public ResponseEntity<?> getPaymentHistory(Authentication authentication) {
        com.wumbap.wumbap.entity.User user = waterBillRepository.findByResidentId(1L).isEmpty() ? null : null; // search for user
        // Find matching payments
        // We will fetch based on role
        List<Payment> payments;
        payments = paymentRepository.findAll(); // Simple fallback for listing
        
        List<Map<String, Object>> response = payments.stream().map(p -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", p.getId());
            map.put("billId", p.getBill().getId());
            map.put("residentName", p.getBill().getResident().getFullName());
            map.put("communityName", p.getBill().getCommunity().getName());
            map.put("amount", p.getAmount());
            map.put("paymentMethod", p.getPaymentMethod());
            map.put("transactionId", p.getTransactionId());
            map.put("status", p.getStatus());
            map.put("paidAt", p.getPaidAt().toString());
            return map;
        }).toList();

        return ResponseEntity.ok(response);
    }
}
