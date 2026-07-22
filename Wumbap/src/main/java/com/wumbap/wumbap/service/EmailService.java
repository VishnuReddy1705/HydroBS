package com.wumbap.wumbap.service;

import com.wumbap.wumbap.entity.*;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;
import java.nio.charset.StandardCharsets;
import java.util.Optional;

@Service
public class EmailService {

    private final JavaMailSender mailSender;

    @org.springframework.beans.factory.annotation.Value("${app.frontend.base-url:http://localhost:5173}")
    private String frontendBaseUrl;

    @Autowired
    public EmailService(Optional<JavaMailSender> mailSenderOpt) {
        this.mailSender = mailSenderOpt.orElse(null);
    }

    private void sendHtmlEmail(String to, String subject, String htmlContent, String attachmentName, byte[] attachmentBytes) {
        try {
            if (mailSender == null) {
                throw new IllegalStateException("JavaMailSender bean is not configured.");
            }
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, StandardCharsets.UTF_8.name());
            
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);
            helper.setFrom("no-reply@hydrobs.com", "HydroBS Support");

            if (attachmentName != null && attachmentBytes != null) {
                helper.addAttachment(attachmentName, new ByteArrayResource(attachmentBytes));
            }

            mailSender.send(message);
            System.out.println("HTML Email successfully sent to " + to);
        } catch (Exception e) {
            System.err.println("Failed to send actual email to " + to + " (Mail Server offline/not configured). Print simulation below:");
            System.out.println("----- HTML EMAIL SIMULATION -----");
            System.out.println("To: " + to);
            System.out.println("Subject: " + subject);
            System.out.println("Attachment: " + (attachmentName != null ? attachmentName : "None"));
            System.out.println("Body:\n" + htmlContent);
            System.out.println("---------------------------------");
        }
    }

    private String getBaseTemplate(String title, String content) {
        return "<!DOCTYPE html>" +
                "<html>" +
                "<head>" +
                "  <meta charset='utf-8'>" +
                "  <meta name='viewport' content='width=device-width, initial-scale=1.0'>" +
                "  <title>" + title + "</title>" +
                "  <style>" +
                "    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 20px; }" +
                "    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }" +
                "    .header { background: linear-gradient(135deg, #0F4C81, #00B4D8); padding: 32px 24px; text-align: center; color: #ffffff; }" +
                "    .header h1 { margin: 0; font-size: 24px; font-weight: 800; tracking-wide: 0.05em; }" +
                "    .body { padding: 32px 24px; line-height: 1.6; font-size: 15px; }" +
                "    .footer { background: #f8fafc; padding: 24px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }" +
                "    .btn { display: inline-block; padding: 12px 24px; background: #00B4D8; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 16px; }" +
                "    .badge { display: inline-block; padding: 4px 8px; background: #e0f2fe; color: #0369a1; border-radius: 6px; font-size: 12px; font-weight: bold; }" +
                "  </style>" +
                "</head>" +
                "<body>" +
                "  <div class='container'>" +
                "    <div class='header'>" +
                "      <h1>HydroBS</h1>" +
                "      <div style='font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #e0f2fe; margin-top: 4px;'>Smart Water Management</div>" +
                "    </div>" +
                "    <div class='body'>" +
                "      " + content + "" +
                "    </div>" +
                "    <div class='footer'>" +
                "      <p>© 2026 HydroBS Water Utility Solutions. All rights reserved.</p>" +
                "      <p>Contact Support: support@hydrobs.com | +1 (800) 555-0199</p>" +
                "    </div>" +
                "  </div>" +
                "</body>" +
                "</html>";
    }

    public void sendWelcomeEmail(User user) {
        String content = "<h2>Welcome to HydroBS, " + user.getFullName() + "!</h2>" +
                "<p>Your registration was successful. We are excited to help you manage and conserve your community's water resource intelligently.</p>" +
                "<p><strong>User Role:</strong> <span class='badge'>" + user.getRole().name() + "</span></p>" +
                "<p>Please log in to your dashboard to complete your profile set up and view real-time statistics.</p>" +
                "<a href='" + frontendBaseUrl + "/login' class='btn' style='color:#ffffff;'>Log In to Dashboard</a>";
        sendHtmlEmail(user.getEmail(), "Welcome to HydroBS!", getBaseTemplate("Welcome to HydroBS", content), null, null);
    }

    public void sendCommunityApprovalEmail(Community community, User admin) {
        String content = "<h2>Community Registration Approved!</h2>" +
                "<p>Hello " + admin.getFullName() + ",</p>" +
                "<p>We are pleased to inform you that your community <strong>" + community.getName() + "</strong> has been officially approved and activated on the HydroBS network.</p>" +
                "<p>You can now log in, assign water meters, ingest reading templates, and launch billing cycles.</p>" +
                "<a href='" + frontendBaseUrl + "/login' class='btn' style='color:#ffffff;'>Admin Console Login</a>";
        sendHtmlEmail(admin.getEmail(), "Community Approved - " + community.getName(), getBaseTemplate("Community Approved", content), null, null);
    }

    public void sendPasswordResetEmail(User user, String token) {
        String content = "<h2>Password Reset Request</h2>" +
                "<p>We received a request to reset your password for your HydroBS account.</p>" +
                "<p>Click the link below to configure your new credentials. This link expires in 1 hour.</p>" +
                "<a href='" + frontendBaseUrl + "/reset-password?token=" + token + "' class='btn' style='color:#ffffff;'>Reset Password</a>" +
                "<p style='margin-top: 24px; font-size: 13px; color: #64748b;'>If you did not request this, please ignore this email.</p>";
        sendHtmlEmail(user.getEmail(), "Password Reset Request", getBaseTemplate("Reset Password Request", content), null, null);
    }

    public void sendWaterBillEmail(WaterBill bill) {
        sendWaterBillEmailWithAttachment(bill, null);
    }

    public void sendWaterBillEmailWithAttachment(WaterBill bill, byte[] pdfBytes) {
        String to = bill.getResident().getEmail();
        String subject = "New HydroBS Water Invoice - Month " + bill.getBillingMonth().toString();
        
        String content = "<h2>New Water Invoice Generated</h2>" +
                "<p>Dear " + bill.getResident().getFullName() + ",</p>" +
                "<p>Your monthly water utility invoice has been successfully computed for <strong>" + bill.getBillingMonth().toString() + "</strong>.</p>" +
                "<table style='width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 14px;'>" +
                "  <tr style='border-bottom: 1px solid #e2e8f0;'>" +
                "    <td style='padding: 8px 0; color: #64748b;'>Invoice Number</td>" +
                "    <td style='padding: 8px 0; text-align: right; font-weight: bold;'>INV-" + bill.getId() + "</td>" +
                "  </tr>" +
                "  <tr style='border-bottom: 1px solid #e2e8f0;'>" +
                "    <td style='padding: 8px 0; color: #64748b;'>Water Consumed</td>" +
                "    <td style='padding: 8px 0; text-align: right; font-weight: bold;'>" + bill.getTotalUsage().setScale(0, java.math.RoundingMode.HALF_UP) + " Litres</td>" +
                "  </tr>" +
                "  <tr style='border-bottom: 1px solid #e2e8f0;'>" +
                "    <td style='padding: 8px 0; color: #64748b;'>Total Payable</td>" +
                "    <td style='padding: 8px 0; text-align: right; font-weight: bold; color: #0F4C81;'>₹" + bill.getAmount().setScale(2, java.math.RoundingMode.HALF_UP) + "</td>" +
                "  </tr>" +
                "  <tr style='border-bottom: 1px solid #e2e8f0;'>" +
                "    <td style='padding: 8px 0; color: #64748b;'>Due Date</td>" +
                "    <td style='padding: 8px 0; text-align: right; color: #ef4444; font-weight: bold;'>" + (bill.getDueDate() != null ? bill.getDueDate().toString() : "N/A") + "</td>" +
                "  </tr>" +
                "</table>" +
                "<p style='margin-top: 16px;'>Please review the attached PDF invoice for full slab details, taxes, and service charges.</p>" +
                "<a href='" + frontendBaseUrl + "/resident/dashboard' class='btn' style='color:#ffffff;'>Pay Now (Razorpay Checkout)</a>";

        String attachmentName = "Invoice_INV_" + bill.getId() + ".pdf";
        sendHtmlEmail(to, subject, getBaseTemplate("New Water Invoice", content), attachmentName, pdfBytes);
    }

    public void sendPaymentSuccessEmail(WaterBill bill, String transactionId) {
        String content = "<h2>Payment Successful</h2>" +
                "<p>Dear " + bill.getResident().getFullName() + ",</p>" +
                "<p>Thank you! Your payment for water invoice <strong>INV-" + bill.getId() + "</strong> has been processed successfully.</p>" +
                "<p><strong>Transaction ID:</strong> <span class='badge'>" + transactionId + "</span></p>" +
                "<p><strong>Amount Paid:</strong> ₹" + bill.getAmount().setScale(2, java.math.RoundingMode.HALF_UP) + "</p>" +
                "<p><strong>Billing Month:</strong> " + bill.getBillingMonth().toString() + "</p>";
        sendHtmlEmail(bill.getResident().getEmail(), "Payment Receipt - INV-" + bill.getId(), getBaseTemplate("Payment Receipt", content), null, null);
    }

    public void sendPaymentFailureEmail(WaterBill bill, String reason) {
        String content = "<h2>Payment Failed</h2>" +
                "<p>Dear " + bill.getResident().getFullName() + ",</p>" +
                "<p>Your payment attempt for water invoice <strong>INV-" + bill.getId() + "</strong> failed.</p>" +
                "<p><strong>Failure Reason:</strong> <span style='color: #ef4444; font-weight: bold;'>" + reason + "</span></p>" +
                "<p>Please log in and retry the checkout process to avoid late payment fee interest charges.</p>" +
                "<a href='" + frontendBaseUrl + "/resident/dashboard' class='btn' style='color:#ffffff;'>Retry Payment</a>";
        sendHtmlEmail(bill.getResident().getEmail(), "Payment Failed - INV-" + bill.getId(), getBaseTemplate("Payment Failed", content), null, null);
    }

    public void sendHighUsageAlert(User resident, BigDecimal usage, BigDecimal limit) {
        String content = "<h2>⚠️ High Water Consumption Alert</h2>" +
                "<p>Dear " + resident.getFullName() + ",</p>" +
                "<p>Our pipeline telemetry has detected an abnormally high rate of water consumption at your flat <strong>" + resident.getFlatNumber() + "</strong>.</p>" +
                "<p>Your current usage is <strong>" + usage.setScale(0, java.math.RoundingMode.HALF_UP) + " Litres</strong> which exceeds your warning threshold of " + limit.setScale(0, java.math.RoundingMode.HALF_UP) + " Litres.</p>" +
                "<p style='color: #ef4444; font-weight: bold;'>Please inspect your taps, toilets, and pipe junctions for potential leakages.</p>";
        sendHtmlEmail(resident.getEmail(), "High Water Consumption Warning", getBaseTemplate("Water Alert", content), null, null);
    }

    public void sendCsvUploadResult(User admin, String filename, boolean success, int successes, int failures) {
        String statusText = success ? "Successfully Processed" : "Failed / Incomplete";
        String color = success ? "#22c55e" : "#ef4444";
        String content = "<h2>Meter Reading CSV Upload Status</h2>" +
                "<p>Hello " + admin.getFullName() + ",</p>" +
                "<p>The CSV index upload job for file <strong>" + filename + "</strong> has finished execution.</p>" +
                "<p><strong>Processing Status:</strong> <span style='color: " + color + "; font-weight: bold;'>" + statusText + "</span></p>" +
                "<ul>" +
                "  <li>Success Rows Ingested: " + successes + "</li>" +
                "  <li>Failed / Error Rows: " + failures + "</li>" +
                "</ul>" +
                "<p>Please review the import ledger dashboard for any error messages.</p>";
        sendHtmlEmail(admin.getEmail(), "Meter Reading Ingestion Report: " + filename, getBaseTemplate("Ingestion Report", content), null, null);
    }

    public void sendPartialPaymentEmail(WaterBill bill, Payment payment, BigDecimal remaining) {
        String content = "<h2>Partial Payment Received</h2>" +
                "<p>Dear " + bill.getResident().getFullName() + ",</p>" +
                "<p>We have received a partial payment for water invoice <strong>INV-" + bill.getId() + "</strong>.</p>" +
                "<p><strong>Amount Paid:</strong> ₹" + payment.getAmount().setScale(2, java.math.RoundingMode.HALF_UP) + "</p>" +
                "<p><strong>Remaining Outstanding:</strong> ₹" + remaining.setScale(2, java.math.RoundingMode.HALF_UP) + "</p>" +
                "<p>Please pay the remaining balance before the due date to avoid late charges.</p>" +
                "<a href='" + frontendBaseUrl + "/resident/dashboard' class='btn' style='color:#ffffff;'>Pay Outstanding Balance</a>";
        sendHtmlEmail(bill.getResident().getEmail(), "Partial Payment Receipt - INV-" + bill.getId(), getBaseTemplate("Partial Payment", content), null, null);
    }

    public void sendRefundInitiatedEmail(Refund refund) {
        String content = "<h2>Refund Request Initiated</h2>" +
                "<p>Dear " + refund.getBill().getResident().getFullName() + ",</p>" +
                "<p>A refund has been initiated for transaction <strong>" + refund.getPayment().getTransactionId() + "</strong> against water invoice <strong>INV-" + refund.getBill().getId() + "</strong>.</p>" +
                "<p><strong>Refund Amount:</strong> ₹" + refund.getAmount().setScale(2, java.math.RoundingMode.HALF_UP) + "</p>" +
                "<p><strong>Reason:</strong> " + refund.getReason() + "</p>" +
                "<p>The request is currently pending administrative approval. You will receive an update once approved.</p>";
        sendHtmlEmail(refund.getBill().getResident().getEmail(), "Refund Requested - " + refund.getRefundNumber(), getBaseTemplate("Refund Requested", content), null, null);
    }

    public void sendRefundApprovedEmail(Refund refund) {
        String content = "<h2>Refund Approved and Processed</h2>" +
                "<p>Dear " + refund.getBill().getResident().getFullName() + ",</p>" +
                "<p>Good news! Your refund request <strong>" + refund.getRefundNumber() + "</strong> has been approved and processed.</p>" +
                "<p><strong>Refund Amount:</strong> ₹" + refund.getAmount().setScale(2, java.math.RoundingMode.HALF_UP) + "</p>" +
                "<p><strong>Status:</strong> <span class='badge'>APPROVED</span></p>" +
                "<p>Please check your original payment method in 5-7 business days for the credit settlement.</p>";
        sendHtmlEmail(refund.getBill().getResident().getEmail(), "Refund Processed - " + refund.getRefundNumber(), getBaseTemplate("Refund Processed", content), null, null);
    }

    public void sendPaymentDueReminderEmail(WaterBill bill, int daysOverdue) {
        String content = "<h2>⚠️ Overdue Payment Reminder</h2>" +
                "<p>Dear " + bill.getResident().getFullName() + ",</p>" +
                "<p>This is a reminder that water invoice <strong>INV-" + bill.getId() + "</strong> is now <strong>" + daysOverdue + " days overdue</strong>.</p>" +
                "<p><strong>Overdue Amount:</strong> ₹" + bill.getAmount().setScale(2, java.math.RoundingMode.HALF_UP) + "</p>" +
                "<p><strong>Due Date:</strong> " + bill.getDueDate().toString() + "</p>" +
                "<p>Please settle the dues immediately to prevent utility suspension or further late interest penalties.</p>" +
                "<a href='" + frontendBaseUrl + "/resident/dashboard' class='btn' style='color:#ffffff;'>Pay Dues Now</a>";
        sendHtmlEmail(bill.getResident().getEmail(), "Overdue Reminder: Invoice INV-" + bill.getId(), getBaseTemplate("Payment Due", content), null, null);
    }

    public void sendReceiptEmail(Receipt receipt, byte[] pdfBytes) {
        String content = "<h2>Payment Receipt Generated</h2>" +
                "<p>Dear " + receipt.getResident().getFullName() + ",</p>" +
                "<p>Your payment receipt <strong>" + receipt.getReceiptNumber() + "</strong> has been generated successfully.</p>" +
                "<p><strong>Receipt Number:</strong> " + receipt.getReceiptNumber() + "</p>" +
                "<p><strong>Amount Paid:</strong> ₹" + receipt.getAmount().setScale(2, java.math.RoundingMode.HALF_UP) + "</p>" +
                "<p><strong>Date Paid:</strong> " + receipt.getGeneratedAt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")) + "</p>" +
                "<p>Please find the attached PDF payment receipt for your records.</p>";
        
        String attachmentName = "Receipt_" + receipt.getReceiptNumber() + ".pdf";
        sendHtmlEmail(receipt.getResident().getEmail(), "Payment Receipt - " + receipt.getReceiptNumber(), getBaseTemplate("Payment Receipt", content), attachmentName, pdfBytes);
    }
}

