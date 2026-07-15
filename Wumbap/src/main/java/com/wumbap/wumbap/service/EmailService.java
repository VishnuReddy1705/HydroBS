package com.wumbap.wumbap.service;

import com.wumbap.wumbap.entity.WaterBill;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class EmailService {

    private final JavaMailSender mailSender;

    @Autowired
    public EmailService(Optional<JavaMailSender> mailSenderOpt) {
        this.mailSender = mailSenderOpt.orElse(null);
    }

    public void sendWaterBillEmail(WaterBill bill) {
        String to = bill.getResident().getEmail();
        String subject = "HydroBS Water Bill Notification - " + bill.getBillingMonth().toString();
        
        StringBuilder body = new StringBuilder();
        body.append("Dear ").append(bill.getResident().getFullName()).append(",\n\n")
            .append("Your water bill for ").append(bill.getBillingMonth().toString()).append(" has been generated.\n\n")
            .append("Bill Summary:\n")
            .append("- Invoice No: INV-").append(bill.getId()).append("\n")
            .append("- Total Usage: ").append(bill.getTotalUsage().setScale(0, java.math.RoundingMode.HALF_UP)).append(" L\n")
            .append("- Tariff Rate: ₹").append(bill.getTariffRate().setScale(2, java.math.RoundingMode.HALF_UP)).append("/L\n")
            .append("- Base Amount: ₹").append(bill.getTotalUsage().multiply(bill.getTariffRate()).setScale(2, java.math.RoundingMode.HALF_UP)).append("\n")
            .append("- Taxes: ₹").append(bill.getTaxAmount().setScale(2, java.math.RoundingMode.HALF_UP)).append("\n")
            .append("- Late Fee: ₹").append(bill.getLateFee().setScale(2, java.math.RoundingMode.HALF_UP)).append("\n")
            .append("- Discount: - ₹").append(bill.getDiscountAmount().setScale(2, java.math.RoundingMode.HALF_UP)).append("\n")
            .append("- Total Payable: ₹").append(bill.getAmount().setScale(2, java.math.RoundingMode.HALF_UP)).append("\n")
            .append("- Due Date: ").append(bill.getDueDate() != null ? bill.getDueDate().toString() : "N/A").append("\n\n")
            .append("Please log in to your dashboard to pay the bill.\n\n")
            .append("Regards,\n")
            .append("HydroBS Management & ").append(bill.getCommunity().getName()).append(" Office");

        try {
            if (mailSender == null) {
                throw new IllegalStateException("JavaMailSender bean is not configured (mail properties are commented out)");
            }
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(to);
            message.setSubject(subject);
            message.setText(body.toString());
            mailSender.send(message);
            System.out.println("Email successfully sent to " + to);
        } catch (Exception e) {
            System.err.println("Failed to send actual email to " + to + " (Mail Server not configured or offline). Print to console instead:");
            System.out.println("----- EMAIL SIMULATION -----");
            System.out.println("To: " + to);
            System.out.println("Subject: " + subject);
            System.out.println(body.toString());
            System.out.println("----------------------------");
        }
    }
}
