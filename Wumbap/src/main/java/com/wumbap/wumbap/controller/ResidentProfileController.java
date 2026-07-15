package com.wumbap.wumbap.controller;

import com.wumbap.wumbap.dto.DocumentResponse;
import com.wumbap.wumbap.dto.FamilyMemberRequest;
import com.wumbap.wumbap.dto.ResidentProfileResponse;
import com.wumbap.wumbap.entity.*;
import com.wumbap.wumbap.repository.*;
import com.wumbap.wumbap.service.AuditLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/profile")
@RequiredArgsConstructor
public class ResidentProfileController {

    private final UserRepository userRepository;
    private final FamilyMemberRepository familyMemberRepository;
    private final DocumentRepository documentRepository;
    private final MeterReadingRepository meterReadingRepository;
    private final WaterBillRepository waterBillRepository;
    private final PaymentRepository paymentRepository;
    private final NotificationRepository notificationRepository;
    private final AuditLogRepository auditLogRepository;
    private final AuditLogService auditLogService;

    private final String uploadDir = "uploads/documents/";

    @GetMapping("/me")
    @PreAuthorize("hasRole('RESIDENT')")
    public ResponseEntity<?> getMyProfile(Authentication authentication) {
        User resident = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("Logged in resident not found"));

        // Record last login if it hasn't been updated recently (e.g. within 5 mins)
        if (resident.getLastLoginAt() == null || resident.getLastLoginAt().isBefore(LocalDateTime.now().minusMinutes(5))) {
            resident.setLastLoginAt(LocalDateTime.now());
            userRepository.save(resident);
        }

        ResidentProfileResponse resp = mapToProfileResponse(resident);
        
        // Populate real billing/usage metrics
        LocalDate start = LocalDate.now().withDayOfMonth(1);
        LocalDate end = LocalDate.now().plusMonths(1).minusDays(1);
        
        List<MeterReading> readings = meterReadingRepository.findByResidentIdOrderByReadingDateDesc(resident.getId()).stream()
                .filter(r -> !r.getReadingDate().isBefore(start) && !r.getReadingDate().isAfter(end))
                .toList();

        BigDecimal monthlyUsage = readings.stream()
                .map(MeterReading::getUsageLitres)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        resp.setCurrentMonthUsage(monthlyUsage);

        Optional<WaterBill> currentBillOpt = waterBillRepository.findByResidentIdAndBillingMonth(resident.getId(), start);
        if (currentBillOpt.isPresent()) {
            WaterBill currentBill = currentBillOpt.get();
            resp.setCurrentBillAmount(currentBill.getAmount());
            resp.setPaymentStatus(currentBill.getStatus());
            resp.setDueDate(currentBill.getDueDate());
        }

        List<WaterBill> unpaidBills = waterBillRepository.findByResidentId(resident.getId()).stream()
                .filter(b -> "UNPAID".equalsIgnoreCase(b.getStatus()))
                .toList();
        BigDecimal outstanding = unpaidBills.stream()
                .map(WaterBill::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        resp.setOutstandingAmount(outstanding);

        // Latest reading details
        Optional<MeterReading> latestReadingOpt = meterReadingRepository.findByResidentIdOrderByReadingDateDesc(resident.getId()).stream().findFirst();
        if (latestReadingOpt.isPresent()) {
            resp.setLatestMeterReading(latestReadingOpt.get().getCurrentReading());
            resp.setLatestReadingDate(latestReadingOpt.get().getReadingDate());
        }

        // Last payment details
        List<Payment> payments = paymentRepository.findAll().stream()
                .filter(p -> p.getBill() != null && p.getBill().getResident() != null &&
                        p.getBill().getResident().getId().equals(resident.getId()) &&
                        "COMPLETED".equalsIgnoreCase(p.getStatus()))
                .sorted(Comparator.comparing(Payment::getPaidAt).reversed())
                .toList();

        if (!payments.isEmpty()) {
            resp.setLastPaymentDate(payments.get(0).getPaidAt().toLocalDate());
            resp.setLastPaymentAmount(payments.get(0).getAmount());
        }

        return ResponseEntity.ok(resp);
    }

    // ===========================================
    // FAMILY MEMBER CRUD (Resident Scope)
    // ===========================================

    @GetMapping("/family")
    @PreAuthorize("hasRole('RESIDENT')")
    public ResponseEntity<?> getMyFamily(Authentication authentication) {
        User resident = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("Logged in resident not found"));

        return ResponseEntity.ok(familyMemberRepository.findByResidentId(resident.getId()));
    }

    @PostMapping("/family")
    @PreAuthorize("hasRole('RESIDENT')")
    public ResponseEntity<?> addFamilyMember(@RequestBody FamilyMemberRequest req, Authentication authentication) {
        User resident = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("Logged in resident not found"));

        FamilyMember fm = FamilyMember.builder()
                .resident(resident)
                .name(req.getName())
                .relationship(req.getRelationship())
                .age(req.getAge())
                .contactNumber(req.getContactNumber())
                .status(req.getStatus() != null ? req.getStatus() : "ACTIVE")
                .build();

        familyMemberRepository.save(fm);
        auditLogService.log(resident.getEmail(), "FAMILY_ADD", "Added family member: " + fm.getName());
        return ResponseEntity.ok(fm);
    }

    @PutMapping("/family/{id}")
    @PreAuthorize("hasRole('RESIDENT')")
    public ResponseEntity<?> editFamilyMember(@PathVariable Long id, @RequestBody FamilyMemberRequest req, Authentication authentication) {
        User resident = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("Logged in resident not found"));

        FamilyMember fm = familyMemberRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Family member not found"));

        if (!fm.getResident().getId().equals(resident.getId())) {
            return ResponseEntity.status(403).body("Access Denied: You cannot modify family members of another resident.");
        }

        fm.setName(req.getName());
        fm.setRelationship(req.getRelationship());
        fm.setAge(req.getAge());
        fm.setContactNumber(req.getContactNumber());
        if (req.getStatus() != null) fm.setStatus(req.getStatus());

        familyMemberRepository.save(fm);
        auditLogService.log(resident.getEmail(), "FAMILY_UPDATE", "Updated family member: " + fm.getName());
        return ResponseEntity.ok(fm);
    }

    @DeleteMapping("/family/{id}")
    @PreAuthorize("hasRole('RESIDENT')")
    public ResponseEntity<?> removeFamilyMember(@PathVariable Long id, Authentication authentication) {
        User resident = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("Logged in resident not found"));

        FamilyMember fm = familyMemberRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Family member not found"));

        if (!fm.getResident().getId().equals(resident.getId())) {
            return ResponseEntity.status(403).body("Access Denied.");
        }

        familyMemberRepository.delete(fm);
        auditLogService.log(resident.getEmail(), "FAMILY_REMOVE", "Removed family member: " + fm.getName());
        return ResponseEntity.ok("Family member removed successfully.");
    }

    // ===========================================
    // DOCUMENT MANAGEMENT (Resident Scope)
    // ===========================================

    @GetMapping("/documents")
    @PreAuthorize("hasRole('RESIDENT')")
    public ResponseEntity<?> getMyDocuments(Authentication authentication) {
        User resident = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("Logged in resident not found"));

        List<DocumentResponse> list = documentRepository.findByResidentId(resident.getId()).stream()
                .map(this::mapToDocResponse)
                .toList();
        return ResponseEntity.ok(list);
    }

    @PostMapping(value = "/documents", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('RESIDENT')")
    public ResponseEntity<?> uploadDocument(
            @RequestParam("file") MultipartFile file,
            @RequestParam("type") String documentType,
            Authentication authentication
    ) {
        User resident = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("Logged in resident not found"));

        // Validate File Size & Type
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body("File is empty.");
        }
        if (file.getSize() > 10 * 1024 * 1024) { // Max 10MB
            return ResponseEntity.badRequest().body("File exceeds limit of 10MB.");
        }
        String contentType = file.getContentType();
        if (contentType == null || (!contentType.equals("application/pdf") &&
                !contentType.equals("image/jpeg") &&
                !contentType.equals("image/png"))) {
            return ResponseEntity.badRequest().body("Unsupported file type. Only PDF, JPG, and PNG are allowed.");
        }

        File folder = new File(uploadDir);
        if (!folder.exists()) {
            folder.mkdirs();
        }

        String randomName = UUID.randomUUID().toString() + "_" + file.getOriginalFilename();
        File destFile = new File(folder, randomName);

        try {
            file.transferTo(destFile);
        } catch (IOException e) {
            return ResponseEntity.status(500).body("Error saving file: " + e.getMessage());
        }

        Document doc = Document.builder()
                .resident(resident)
                .documentType(documentType.toUpperCase())
                .fileName(file.getOriginalFilename())
                .filePath(destFile.getAbsolutePath())
                .fileSize(file.getSize())
                .build();

        documentRepository.save(doc);
        auditLogService.log(resident.getEmail(), "DOCUMENT_UPLOAD", "Uploaded document: " + doc.getFileName() + " (" + doc.getDocumentType() + ")");
        return ResponseEntity.ok(mapToDocResponse(doc));
    }

    @GetMapping("/documents/{id}/download")
    @PreAuthorize("hasAnyRole('RESIDENT', 'ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<?> downloadDocument(@PathVariable Long id, Authentication authentication) {
        User caller = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("Logged in user not found"));

        Document doc = documentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Document not found"));

        // Verify authorization
        if (caller.getRole() == Role.RESIDENT && !doc.getResident().getId().equals(caller.getId())) {
            return ResponseEntity.status(403).body("Access Denied: You cannot view documents of another resident.");
        }
        if (caller.getRole() == Role.ADMIN) {
            if (caller.getCommunity() == null || doc.getResident().getCommunity() == null ||
                    !caller.getCommunity().getId().equals(doc.getResident().getCommunity().getId())) {
                return ResponseEntity.status(403).body("Access Denied.");
            }
        }

        File file = new File(doc.getFilePath());
        if (!file.exists()) {
            return ResponseEntity.notFound().build();
        }

        Resource resource = new FileSystemResource(file);
        String contentType = "application/octet-stream";
        if (doc.getFileName().endsWith(".pdf")) {
            contentType = "application/pdf";
        } else if (doc.getFileName().endsWith(".jpg") || doc.getFileName().endsWith(".jpeg")) {
            contentType = "image/jpeg";
        } else if (doc.getFileName().endsWith(".png")) {
            contentType = "image/png";
        }

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + doc.getFileName() + "\"")
                .body(resource);
    }

    @DeleteMapping("/documents/{id}")
    @PreAuthorize("hasRole('RESIDENT')")
    public ResponseEntity<?> deleteDocument(@PathVariable Long id, Authentication authentication) {
        User resident = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("Logged in resident not found"));

        Document doc = documentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Document not found"));

        if (!doc.getResident().getId().equals(resident.getId())) {
            return ResponseEntity.status(403).body("Access Denied.");
        }

        File file = new File(doc.getFilePath());
        if (file.exists()) {
            file.delete();
        }

        documentRepository.delete(doc);
        auditLogService.log(resident.getEmail(), "DOCUMENT_REMOVE", "Removed document: " + doc.getFileName());
        return ResponseEntity.ok("Document deleted successfully.");
    }

    // ===========================================
    // UTILITY TIMELINES / LOGS (Resident Scope)
    // ===========================================

    @GetMapping("/timeline")
    @PreAuthorize("hasRole('RESIDENT')")
    public ResponseEntity<?> getMyTimeline(Authentication authentication) {
        User resident = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("Logged in resident not found"));

        List<AuditLog> logs = auditLogRepository.findByUserEmailOrderByCreatedAtDesc(resident.getEmail()).stream()
                .limit(20)
                .toList();

        return ResponseEntity.ok(logs);
    }

    private DocumentResponse mapToDocResponse(Document d) {
        return DocumentResponse.builder()
                .id(d.getId())
                .residentId(d.getResident().getId())
                .documentType(d.getDocumentType())
                .fileName(d.getFileName())
                .filePath(d.getFilePath())
                .fileSize(d.getFileSize())
                .uploadedAt(d.getUploadedAt())
                .build();
    }

    private ResidentProfileResponse mapToProfileResponse(User u) {
        return ResidentProfileResponse.builder()
                .id(u.getId())
                .email(u.getEmail())
                .fullName(u.getFullName())
                .role(u.getRole().name())
                .phoneNumber(u.getPhoneNumber())
                .profilePhotoUrl(u.getProfilePhotoUrl())
                .gender(u.getGender())
                .dateOfBirth(u.getDateOfBirth())
                .emergencyContactName(u.getEmergencyContactName())
                .emergencyContactPhone(u.getEmergencyContactPhone())
                .address(u.getAddress())
                .communityId(u.getCommunity() != null ? u.getCommunity().getId() : null)
                .communityName(u.getCommunity() != null ? u.getCommunity().getName() : null)
                .building(u.getBuilding())
                .block(u.getBlock())
                .floor(u.getFloor())
                .flatNumber(u.getFlatNumber())
                .familySize(u.getFamilySize())
                .occupancyType(u.getOccupancyType())
                .moveInDate(u.getMoveInDate())
                .meterNumber(u.getMeterNumber())
                .waterBalance(u.getWaterBalance())
                .isActive(u.isActive())
                .lastLoginAt(u.getLastLoginAt())
                .build();
    }
}
