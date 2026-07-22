package com.wumbap.wumbap.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public class PaymentRequest {

    @Data
    public static class PaymentVerifyRequest {
        private Long billId;
        private String razorpayPaymentId;
        private String razorpayOrderId;
        private String signature;
        private String status; // SUCCESS or FAILED
    }

    @Data
    public static class OfflinePaymentRequest {
        private Long billId;
        private BigDecimal amount;
        private String paymentMethod; // CASH, UPI, BANK_TRANSFER, CHEQUE
        private String transactionReference;
        private String notes;
    }
}
