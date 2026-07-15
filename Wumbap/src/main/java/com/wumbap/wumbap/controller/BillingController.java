package com.wumbap.wumbap.controller;

import com.wumbap.wumbap.dto.BillGenerationRequest;
import com.wumbap.wumbap.dto.BillResponse;
import com.wumbap.wumbap.dto.BillRevisionRequest;
import com.wumbap.wumbap.entity.Role;
import com.wumbap.wumbap.entity.User;
import com.wumbap.wumbap.entity.WaterBill;
import com.wumbap.wumbap.repository.UserRepository;
import com.wumbap.wumbap.repository.WaterBillRepository;
import com.wumbap.wumbap.service.BillingEngineService;
import com.wumbap.wumbap.service.EmailService;
import com.wumbap.wumbap.service.PdfService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/billing")
@RequiredArgsConstructor
@Slf4j
public class BillingController {

    private final BillingEngineService billingEngineService;
    private final WaterBillRepository waterBillRepository;
    private final UserRepository userRepository;
    private final PdfService pdfService;
    private final EmailService emailService;

    @PostMapping("/generate")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<List<BillResponse>> generateBills(
            @RequestBody BillGenerationRequest request,
            Authentication authentication) {
        log.info("Request to generate bills: {}", request);
        
        // Enforce Community boundary for community admins
        User user = userRepository.findByEmail(authentication.getName()).orElseThrow();
        if (user.getRole() == Role.ADMIN) {
            if ("SYSTEM".equalsIgnoreCase(request.getScope())) {
                throw new org.springframework.security.access.AccessDeniedException("Admins cannot generate billing at SYSTEM level");
            }
            if (request.getCommunityId() == null || !request.getCommunityId().equals(user.getCommunity().getId())) {
                throw new org.springframework.security.access.AccessDeniedException("Admins can only generate billing for their own community");
            }
        }
        
        List<BillResponse> bills = billingEngineService.generateBills(request, authentication.getName());
        return ResponseEntity.ok(bills);
    }

    @PostMapping("/{billId}/revise")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<BillResponse> reviseBill(
            @PathVariable Long billId,
            @RequestBody BillRevisionRequest request,
            Authentication authentication) {
        log.info("Request to revise bill ID: {}", billId);
        
        // Enforce Community boundary
        User user = userRepository.findByEmail(authentication.getName()).orElseThrow();
        WaterBill bill = waterBillRepository.findById(billId)
                .orElseThrow(() -> new IllegalArgumentException("Bill not found"));
        if (user.getRole() == Role.ADMIN && (user.getCommunity() == null || !user.getCommunity().getId().equals(bill.getCommunity().getId()))) {
            throw new org.springframework.security.access.AccessDeniedException("Admins can only revise bills belonging to their own community");
        }

        BillResponse revised = billingEngineService.reviseBill(billId, request, authentication.getName());
        return ResponseEntity.ok(revised);
    }

    @GetMapping("/{billId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN', 'RESIDENT')")
    public ResponseEntity<BillResponse> getBillDetails(
            @PathVariable Long billId,
            Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName()).orElseThrow();
        BillResponse details = billingEngineService.getBillDetails(billId);

        // Security check for Residents
        if (user.getRole() == Role.RESIDENT && !user.getId().equals(details.getResidentId())) {
            throw new org.springframework.security.access.AccessDeniedException("Residents can only view their own bills");
        }

        // Security check for Admins
        if (user.getRole() == Role.ADMIN && (user.getCommunity() == null || !user.getCommunity().getId().equals(details.getCommunityId()))) {
            throw new org.springframework.security.access.AccessDeniedException("Admins can only view bills belonging to their own community");
        }

        return ResponseEntity.ok(details);
    }

    @GetMapping("/search")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN', 'RESIDENT')")
    public ResponseEntity<Page<BillResponse>> searchBills(
            @RequestParam(value = "communityId", required = false) Long communityId,
            @RequestParam(value = "residentId", required = false) Long residentId,
            @RequestParam(value = "billNumber", required = false) String billNumber,
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "billingMonth", required = false) String billingMonth,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "10") int size,
            Authentication authentication) {
        
        User user = userRepository.findByEmail(authentication.getName()).orElseThrow();
        
        // Enforce role-based parameters
        Long targetCommunityId = communityId;
        Long targetResidentId = residentId;
        
        if (user.getRole() == Role.RESIDENT) {
            targetResidentId = user.getId();
            targetCommunityId = user.getCommunity() != null ? user.getCommunity().getId() : null;
        } else if (user.getRole() == Role.ADMIN) {
            targetCommunityId = user.getCommunity() != null ? user.getCommunity().getId() : null;
        }

        Page<BillResponse> results = billingEngineService.searchBills(targetCommunityId, targetResidentId, billNumber, status, billingMonth, page, size);
        return ResponseEntity.ok(results);
    }

    @GetMapping("/analytics")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<Map<String, Object>> getAnalytics(
            @RequestParam(value = "communityId", required = false) Long communityId,
            Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName()).orElseThrow();
        
        Long targetCommunityId = communityId;
        if (user.getRole() == Role.ADMIN) {
            targetCommunityId = user.getCommunity() != null ? user.getCommunity().getId() : null;
        }

        if (targetCommunityId == null) {
            return ResponseEntity.badRequest().build();
        }

        return ResponseEntity.ok(billingEngineService.getBillingAnalytics(targetCommunityId));
    }

    @GetMapping("/super-admin/analytics")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<Map<String, Object>> getSuperAdminAnalytics() {
        return ResponseEntity.ok(billingEngineService.getSuperAdminBillingAnalytics());
    }

    @GetMapping("/{billId}/pdf")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN', 'RESIDENT')")
    public ResponseEntity<?> downloadBillPdf(
            @PathVariable Long billId,
            Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName()).orElseThrow();
        WaterBill bill = waterBillRepository.findById(billId)
                .orElseThrow(() -> new IllegalArgumentException("Bill not found"));

        // Security check
        if (user.getRole() == Role.RESIDENT && !user.getId().equals(bill.getResident().getId())) {
            throw new org.springframework.security.access.AccessDeniedException("Residents can only access their own bill PDFs");
        }
        if (user.getRole() == Role.ADMIN && (user.getCommunity() == null || !user.getCommunity().getId().equals(bill.getCommunity().getId()))) {
            throw new org.springframework.security.access.AccessDeniedException("Admins can only access bill PDFs from their own community");
        }

        try {
            byte[] pdfBytes = pdfService.generateWaterBillPdf(bill);
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("attachment", "invoice-" + bill.getInvoiceNumber() + ".pdf");
            headers.setContentLength(pdfBytes.length);
            return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);
        } catch (Exception e) {
            log.error("Error generating bill PDF for ID {}: {}", billId, e.getMessage());
            return ResponseEntity.status(500).body("Error generating bill PDF: " + e.getMessage());
        }
    }

    @PostMapping("/{billId}/email")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<?> emailBill(
            @PathVariable Long billId,
            Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName()).orElseThrow();
        WaterBill bill = waterBillRepository.findById(billId)
                .orElseThrow(() -> new IllegalArgumentException("Bill not found"));

        if (user.getRole() == Role.ADMIN && (user.getCommunity() == null || !user.getCommunity().getId().equals(bill.getCommunity().getId()))) {
            throw new org.springframework.security.access.AccessDeniedException("Admins can only trigger email notifications for their own community");
        }

        emailService.sendWaterBillEmail(bill);
        return ResponseEntity.ok("Email invoice triggered successfully.");
    }
}
