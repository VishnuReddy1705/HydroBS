package com.wumbap.wumbap.controller;

import com.wumbap.wumbap.entity.Role;
import com.wumbap.wumbap.entity.User;
import com.wumbap.wumbap.repository.UserRepository;
import com.wumbap.wumbap.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Map;

import org.springframework.transaction.annotation.Transactional;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReportController {

    private final ReportService reportService;
    private final UserRepository userRepository;

    @GetMapping("/preview")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'RESIDENT')")
    public ResponseEntity<?> previewReport(
            @RequestParam String reportType,
            @RequestParam String frequency,
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) Integer quarter,
            @RequestParam(required = false) Long communityId,
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) String building,
            @RequestParam(required = false) Long residentId,
            @RequestParam(required = false) Long billingCycleId,
            @RequestParam(required = false) String paymentStatus,
            @RequestParam(required = false) java.math.BigDecimal minUsage,
            @RequestParam(required = false) java.math.BigDecimal maxUsage,
            Authentication auth
    ) {
        User user = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        Long commId = communityId;
        if (user.getRole() == Role.ADMIN) {
            if (user.getCommunity() == null) {
                return ResponseEntity.badRequest().body("You are not associated with any community.");
            }
            commId = user.getCommunity().getId();
        } else if (user.getRole() == Role.RESIDENT) {
            if (user.getCommunity() == null) {
                return ResponseEntity.badRequest().body("You are not associated with any community.");
            }
            commId = user.getCommunity().getId();
            residentId = user.getId();
        }

        int targetYear = year != null ? year : LocalDate.now().getYear();

        Map<String, Object> data = reportService.generateReportData(
                reportType,
                frequency,
                targetYear,
                month,
                quarter,
                commId,
                startDate,
                endDate,
                building,
                residentId,
                billingCycleId,
                paymentStatus,
                minUsage,
                maxUsage
        );
        return ResponseEntity.ok(data);
    }

    @GetMapping("/download/{format}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'RESIDENT')")
    public ResponseEntity<?> downloadReport(
            @PathVariable String format,
            @RequestParam String reportType,
            @RequestParam String frequency,
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) Integer quarter,
            @RequestParam(required = false) Long communityId,
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) String building,
            @RequestParam(required = false) Long residentId,
            @RequestParam(required = false) Long billingCycleId,
            @RequestParam(required = false) String paymentStatus,
            @RequestParam(required = false) java.math.BigDecimal minUsage,
            @RequestParam(required = false) java.math.BigDecimal maxUsage,
            Authentication auth
    ) {
        User user = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        Long commId = communityId;
        if (user.getRole() == Role.ADMIN) {
            if (user.getCommunity() == null) {
                return ResponseEntity.badRequest().body("You are not associated with any community.");
            }
            commId = user.getCommunity().getId();
        } else if (user.getRole() == Role.RESIDENT) {
            if (user.getCommunity() == null) {
                return ResponseEntity.badRequest().body("You are not associated with any community.");
            }
            commId = user.getCommunity().getId();
            residentId = user.getId();
        }

        int targetYear = year != null ? year : LocalDate.now().getYear();

        try {
            Map<String, Object> data = reportService.generateReportData(
                    reportType,
                    frequency,
                    targetYear,
                    month,
                    quarter,
                    commId,
                    startDate,
                    endDate,
                    building,
                    residentId,
                    billingCycleId,
                    paymentStatus,
                    minUsage,
                    maxUsage
            );

            byte[] fileBytes;
            String filename = reportType.toLowerCase() + "-report-" + targetYear;
            HttpHeaders headers = new HttpHeaders();

            if ("pdf".equalsIgnoreCase(format)) {
                fileBytes = reportService.generatePdfReport(data);
                headers.setContentType(MediaType.APPLICATION_PDF);
                headers.setContentDispositionFormData("attachment", filename + ".pdf");
            } else if ("excel".equalsIgnoreCase(format) || "xlsx".equalsIgnoreCase(format)) {
                fileBytes = reportService.generateExcelReport(data);
                headers.setContentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
                headers.setContentDispositionFormData("attachment", filename + ".xlsx");
            } else if ("csv".equalsIgnoreCase(format)) {
                fileBytes = reportService.generateCsvReport(data);
                headers.setContentType(MediaType.TEXT_PLAIN);
                headers.setContentDispositionFormData("attachment", filename + ".csv");
            } else {
                return ResponseEntity.badRequest().body("Unsupported export format: " + format);
            }

            headers.setContentLength(fileBytes.length);
            return new ResponseEntity<>(fileBytes, headers, HttpStatus.OK);

        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error exporting report file: " + e.getMessage());
        }
    }
}
