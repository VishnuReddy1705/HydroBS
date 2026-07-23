package com.wumbap.wumbap.controller;

import com.wumbap.wumbap.entity.*;
import com.wumbap.wumbap.repository.*;
import com.wumbap.wumbap.service.EmailService;
import com.wumbap.wumbap.service.PdfService;
import lombok.RequiredArgsConstructor;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVRecord;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStreamReader;
import java.io.Reader;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.transaction.annotation.Transactional;

@RestController
@RequestMapping("/api/water")
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class WaterController {

    private final UserRepository userRepository;
    private final UploadJobRepository uploadJobRepository;
    private final MeterReadingRepository meterReadingRepository;
    private final MeterImportErrorRepository meterImportErrorRepository;
    private final WaterBillRepository waterBillRepository;
    private final CommunityRepository communityRepository;
    private final PdfService pdfService;
    private final EmailService emailService;
    private final CalendarEventRepository calendarEventRepository;
    private final NotificationRepository notificationRepository;
    private final com.wumbap.wumbap.service.AuditLogService auditLogService;
    private final MeterRepository meterRepository;
    private final com.wumbap.wumbap.service.LeakDetectionService leakDetectionService;
    private final com.wumbap.wumbap.service.BillingEngineService billingEngineService;

    @PostMapping(value = "/upload-readings", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    @Transactional
    public ResponseEntity<?> uploadReadings(
            @RequestParam("file") MultipartFile file,
            Authentication authentication
    ) {
        User admin = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("Admin not found"));
        Community community;
        try {
            community = resolveCommunity(admin);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }

        UploadJob job = UploadJob.builder()
                .community(community)
                .uploadedBy(admin)
                .originalFilename(file.getOriginalFilename())
                .uploadStatus(UploadStatus.PROCESSING)
                .totalRows(0)
                .successfulRows(0)
                .failedRows(0)
                .build();
        job = uploadJobRepository.save(job);

        int rowNumber = 0;
        int successCount = 0;
        int duplicateCount = 0;
        int invalidCount = 0;
        int unknownCount = 0;

        java.util.Set<String> processedFlats = new java.util.HashSet<>();

        try (Reader reader = new InputStreamReader(file.getInputStream())) {
            CSVFormat csvFormat = CSVFormat.DEFAULT.builder()
                    .setHeader()
                    .setSkipHeaderRecord(true)
                    .setIgnoreHeaderCase(true)
                    .setTrim(true)
                    .build();

            Iterable<CSVRecord> records;
            try {
                records = csvFormat.parse(reader);
            } catch (Exception ex) {
                // Try headerless parser if header parse fails
                try (Reader r2 = new InputStreamReader(file.getInputStream())) {
                    records = CSVFormat.DEFAULT.builder().setTrim(true).build().parse(r2);
                }
            }

            for (CSVRecord record : records) {
                rowNumber++;
                String flatNumber = getRecordValue(record, "Flat Number", "Flat No", "Flat", "flat_number");
                String readingStr = getRecordValue(record, "Reading", "Usage", "Consumption");
                String meterNum = getRecordValue(record, "Meter Number", "Meter No", "Meter", "meter_number");
                String building = getRecordValue(record, "Building", "building");
                String block = getRecordValue(record, "Block", "block");
                String dateStr = getRecordValue(record, "Reading Date", "Date", "reading_date");

                if (flatNumber == null && record.size() >= 1) flatNumber = record.get(0);
                if (readingStr == null && record.size() >= 2) readingStr = record.get(1);

                try {
                    if (flatNumber == null || flatNumber.isBlank()) {
                        invalidCount++;
                        throw new RuntimeException("INVALID: Flat number is missing or blank");
                    }
                    flatNumber = flatNumber.trim();

                    if (processedFlats.contains(flatNumber)) {
                        duplicateCount++;
                        throw new RuntimeException("DUPLICATE: Flat " + flatNumber + " already processed in this file");
                    }
                    processedFlats.add(flatNumber);

                    if (readingStr == null || readingStr.isBlank()) {
                        invalidCount++;
                        throw new RuntimeException("INVALID: Reading value is empty");
                    }

                    BigDecimal readingVal;
                    try {
                        readingVal = new BigDecimal(readingStr.trim());
                    } catch (Exception numEx) {
                        invalidCount++;
                        throw new RuntimeException("INVALID: Reading is non-numeric: " + readingStr);
                    }

                    if (readingVal.compareTo(BigDecimal.ZERO) < 0) {
                        invalidCount++;
                        throw new RuntimeException("INVALID: Reading value cannot be negative: " + readingVal);
                    }

                    LocalDate readingDate = LocalDate.now();
                    if (dateStr != null && !dateStr.trim().isEmpty()) {
                        try {
                            readingDate = LocalDate.parse(dateStr.trim());
                        } catch (Exception parseEx) {
                            try {
                                String[] parts = dateStr.trim().split("[/-]");
                                if (parts.length == 3) {
                                    int first = Integer.parseInt(parts[0]);
                                    int second = Integer.parseInt(parts[1]);
                                    int third = Integer.parseInt(parts[2]);
                                    if (third > 1000) {
                                        if (first <= 12) {
                                            readingDate = LocalDate.of(third, first, second);
                                        } else {
                                            readingDate = LocalDate.of(third, second, first);
                                        }
                                    } else if (first > 1000) {
                                        if (second <= 12) {
                                            readingDate = LocalDate.of(first, second, third);
                                        } else {
                                            readingDate = LocalDate.of(first, third, second);
                                        }
                                    }
                                }
                            } catch (Exception exDate) {
                                throw new RuntimeException("INVALID: Reading date format invalid: " + dateStr);
                            }
                        }
                    }

                    User resident = null;
                    if (meterNum != null && !meterNum.trim().isEmpty()) {
                        Optional<Meter> mOpt = meterRepository.findByMeterNumber(meterNum.trim());
                        if (mOpt.isPresent()) {
                            resident = mOpt.get().getResident();
                        }
                    }

                    if (resident == null) {
                        final String normCSVFlat = normalizeFlatNumber(flatNumber);
                        final String normBuilding = building != null ? building.trim().toUpperCase() : null;
                        final String normBlock = block != null ? block.trim().toUpperCase() : null;

                        List<User> matches = userRepository.findAll().stream()
                                .filter(u -> u.getCommunity() != null 
                                        && u.getCommunity().getId().equals(community.getId()) 
                                        && u.getRole() == Role.RESIDENT
                                        && u.getFlatNumber() != null 
                                        && normalizeFlatNumber(u.getFlatNumber()).equals(normCSVFlat))
                                .toList();

                        if (normBuilding != null || normBlock != null) {
                            matches = matches.stream()
                                    .filter(u -> (normBuilding == null || (u.getBuilding() != null && u.getBuilding().trim().toUpperCase().contains(normBuilding)))
                                            && (normBlock == null || (u.getBlock() != null && u.getBlock().trim().toUpperCase().contains(normBlock))))
                                    .toList();
                        }

                        if (!matches.isEmpty()) {
                            resident = matches.get(0);
                        }
                    }

                    if (resident == null) {
                        unknownCount++;
                        throw new RuntimeException("UNKNOWN: Flat " + flatNumber + " is not registered in this community");
                    }

                    final LocalDate fReadingDate = readingDate;
                    Optional<MeterReading> latestReadingOpt = meterReadingRepository.findByResidentIdOrderByReadingDateDesc(resident.getId()).stream()
                            .filter(r -> r.getReadingDate().isBefore(fReadingDate))
                            .findFirst();

                    BigDecimal previousReading = BigDecimal.ZERO;
                    if (latestReadingOpt.isPresent()) {
                        previousReading = latestReadingOpt.get().getCurrentReading();
                    }

                    BigDecimal currentReading = previousReading.add(readingVal);
                    BigDecimal usageLitres = readingVal;

                    Optional<MeterReading> existingOpt = meterReadingRepository.findByResidentIdAndReadingDate(resident.getId(), readingDate);
                    MeterReading meterReading;
                    if (existingOpt.isPresent()) {
                        meterReading = existingOpt.get();
                        meterReading.setPreviousReading(previousReading);
                        meterReading.setCurrentReading(currentReading);
                        meterReading.setUsageLitres(usageLitres);
                        meterReading.setUploadJob(job);
                    } else {
                        meterReading = MeterReading.builder()
                                .uploadJob(job)
                                .community(community)
                                .resident(resident)
                                .readingDate(readingDate)
                                .previousReading(previousReading)
                                .currentReading(currentReading)
                                .usageLitres(usageLitres)
                                .build();
                    }

                    detectAndFlagAnomaly(meterReading, resident);

                    meterReadingRepository.save(meterReading);
                    successCount++;

                    // Recalculate and update resident bill for month and send email ONLY to this resident
                    try {
                        String uBy = (job.getUploadedBy() != null && job.getUploadedBy().getEmail() != null) ? job.getUploadedBy().getEmail() : "CSV Upload";
                        WaterBill csvBill = billingEngineService.generateSingleResidentBill(resident, community, readingDate.withDayOfMonth(1), uBy, "CSV reading bill generation", true);
                        if (csvBill != null) {
                            emailService.sendWaterBillEmail(csvBill);
                        }
                    } catch (Exception ex) {
                        System.err.println("Error generating bill for resident " + resident.getId() + " after CSV upload: " + ex.getMessage());
                    }

                    if (meterReading.getIsAnomaly() != null && meterReading.getIsAnomaly()) {
                        Notification alertNotif = Notification.builder()
                                .user(resident)
                                .community(community)
                                .title("Water Anomaly Detected")
                                .message("Your flat " + flatNumber + " flagged a " + meterReading.getAnomalyType() + " anomaly: " + meterReading.getAnomalyNotes())
                                .type("HIGH_USAGE")
                                .build();
                        notificationRepository.save(alertNotif);
                    } else {
                        Notification normalNotif = Notification.builder()
                                .user(resident)
                                .community(community)
                                .title("New Reading Logged")
                                .message("Your water meter log of " + usageLitres + " L has been uploaded for " + readingDate + ".")
                                .type("READING_UPLOADED")
                                .build();
                        notificationRepository.save(normalNotif);
                    }

                } catch (Exception ex) {
                    MeterImportError error = MeterImportError.builder()
                            .uploadJob(job)
                            .csvRowNumber(rowNumber)
                            .residentIdentifier(flatNumber != null ? flatNumber : "ROW-" + rowNumber)
                            .errorMessage(ex.getMessage())
                            .build();
                    meterImportErrorRepository.save(error);
                }
            }

            int totalFailures = duplicateCount + invalidCount + unknownCount;
            job.setTotalRows(rowNumber);
            job.setSuccessfulRows(successCount);
            job.setFailedRows(totalFailures);
            job.setUploadCompletedAt(LocalDateTime.now());

            if (totalFailures == 0 && rowNumber > 0) {
                job.setUploadStatus(UploadStatus.COMPLETED);
            } else if (successCount > 0 && totalFailures > 0) {
                job.setUploadStatus(UploadStatus.COMPLETED_WITH_ERRORS);
            } else {
                job.setUploadStatus(UploadStatus.FAILED);
                job.setErrorMessage("All rows failed or file was empty.");
            }
            uploadJobRepository.save(job);

            // Log upload history event in calendar
            CalendarEvent uploadEvent = CalendarEvent.builder()
                    .community(community)
                    .title("CSV Reading Import #" + job.getId())
                    .description("Uploaded " + successCount + " valid rows, " + duplicateCount + " duplicates, " + invalidCount + " invalid, " + unknownCount + " unknown flats.")
                    .eventDate(LocalDate.now())
                    .eventType("UPLOAD_JOB")
                    .referenceId(job.getId())
                    .build();
            calendarEventRepository.save(uploadEvent);

            // Automatically recalculate billing cycle records for the current month
            LocalDate billingMonth = LocalDate.now().withDayOfMonth(1);
            calculateBillsForCommunity(community, billingMonth);

            Map<String, Object> result = new HashMap<>();
            result.put("jobId", job.getId());
            result.put("status", job.getUploadStatus().name());
            result.put("totalRows", job.getTotalRows());
            result.put("successfulRows", job.getSuccessfulRows());
            result.put("failedRows", job.getFailedRows());
            result.put("duplicatesCount", duplicateCount);
            result.put("unknownFlatsCount", unknownCount);
            result.put("invalidRowsCount", invalidCount);
            auditLogService.log(authentication.getName(), "CSV_UPLOAD", "Uploaded CSV: " + file.getOriginalFilename() + ". Successful: " + successCount + ", Failed: " + totalFailures);
            return ResponseEntity.ok(result);

        } catch (Exception e) {
            job.setUploadStatus(UploadStatus.FAILED);
            job.setErrorMessage("CSV parse failed: " + e.getMessage());
            job.setUploadCompletedAt(LocalDateTime.now());
            uploadJobRepository.save(job);
            return ResponseEntity.badRequest().body("Failed to parse CSV: " + e.getMessage());
        }
    }

    private int calculateBillsForCommunity(Community community, LocalDate billingMonth) {
        List<User> residents = userRepository.findAll().stream()
                .filter(u -> u.getCommunity() != null 
                        && u.getCommunity().getId().equals(community.getId()) 
                        && u.getRole() == Role.RESIDENT)
                .toList();

        int generatedCount = 0;
        for (User resident : residents) {
            try {
                billingEngineService.generateSingleResidentBill(resident, community, billingMonth, "SYSTEM", "Automatic Recalculation", true);
                generatedCount++;
            } catch (Exception e) {
                // ignore
            }
        }

        // Save Calendar event for billing generation milestone
        CalendarEvent billingEvent = CalendarEvent.builder()
                .community(community)
                .title("Billing Cycle Run Completed")
                .description("Generated water bills for " + generatedCount + " residents in community.")
                .eventDate(LocalDate.now())
                .eventType("BILL_GEN")
                .build();
        calendarEventRepository.save(billingEvent);

        return generatedCount;
    }

    @PostMapping("/generate-bills")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    @Transactional
    public ResponseEntity<?> generateBills(
            @RequestParam(required = false) String month,
            Authentication authentication
    ) {
        User admin = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("Admin not found"));
        Community community;
        try {
            community = resolveCommunity(admin);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }

        LocalDate billingMonth;
        if (month == null || month.isBlank()) {
            billingMonth = LocalDate.now().withDayOfMonth(1);
        } else {
            billingMonth = LocalDate.parse(month + "-01");
        }

        int count = calculateBillsForCommunity(community, billingMonth);
        auditLogService.log(authentication.getName(), "GENERATE_BILLS", "Generated bills for " + count + " residents in community: " + community.getName() + " for month: " + billingMonth);
        return ResponseEntity.ok("Successfully generated bills for " + count + " residents.");
    }

    @GetMapping("/bills")
    public ResponseEntity<?> getBills(Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getRole() == Role.RESIDENT) {
            List<WaterBill> bills = waterBillRepository.findByResidentId(user.getId());
            return ResponseEntity.ok(mapBills(bills));
        } else if (user.getRole() == Role.ADMIN) {
            if (user.getCommunity() == null) {
                return ResponseEntity.ok(List.of());
            }
            List<WaterBill> bills = waterBillRepository.findByCommunityId(user.getCommunity().getId());
            return ResponseEntity.ok(mapBills(bills));
        } else {
            List<WaterBill> bills = waterBillRepository.findAll();
            return ResponseEntity.ok(mapBills(bills));
        }
    }

    private List<Map<String, Object>> mapBills(List<WaterBill> bills) {
        return bills.stream()
                .map(b -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", b.getId());
                    map.put("residentName", b.getResident().getFullName());
                    map.put("flatNumber", b.getResident().getFlatNumber());
                    map.put("billingMonth", b.getBillingMonth().toString());
                    map.put("billingStartDate", b.getBillingStartDate() != null ? b.getBillingStartDate().toString() : null);
                    map.put("billingEndDate", b.getBillingEndDate() != null ? b.getBillingEndDate().toString() : null);
                    map.put("totalUsage", b.getTotalUsage());
                    BigDecimal t1Limit = b.getTier1LimitLitres() != null ? b.getTier1LimitLitres() : (b.getCommunity() != null && b.getCommunity().getTier1LimitLitres() != null ? b.getCommunity().getTier1LimitLitres() : new BigDecimal("10000.00"));
                    BigDecimal t1Rate = b.getTier1Rate() != null ? b.getTier1Rate() : (b.getCommunity() != null && b.getCommunity().getTier1Rate() != null ? b.getCommunity().getTier1Rate() : new BigDecimal("1.00"));
                    BigDecimal t2Rate = b.getTier2Rate() != null ? b.getTier2Rate() : (b.getCommunity() != null && b.getCommunity().getTier2Rate() != null ? b.getCommunity().getTier2Rate() : new BigDecimal("3.00"));
                    map.put("tier1LimitLitres", t1Limit);
                    map.put("tier1Rate", t1Rate);
                    map.put("tier2Rate", t2Rate);
                    map.put("serviceCharge", b.getServiceCharge());
                    map.put("tariffRate", b.getTariffRate());
                    map.put("taxAmount", b.getTaxAmount());
                    map.put("lateFee", b.getLateFee());
                    map.put("discountAmount", b.getDiscountAmount());
                    map.put("amount", b.getAmount());
                    map.put("status", b.getStatus());
                    map.put("dueDate", b.getDueDate() != null ? b.getDueDate().toString() : null);
                    map.put("generatedAt", b.getGeneratedAt().toString());
                    return map;
                })
                .toList();
    }

    @PostMapping("/readings/manual")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN', 'RESIDENT')")
    @Transactional
    public ResponseEntity<?> addManualReading(@RequestBody Map<String, Object> req, Authentication auth) {
        User caller = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        Community community = caller.getCommunity();
        if (req.get("communityId") != null && !req.get("communityId").toString().isBlank()) {
            try {
                Long commId = Long.valueOf(req.get("communityId").toString());
                community = communityRepository.findById(commId).orElse(community);
            } catch (Exception ignored) {}
        }

        if (community == null && caller.getRole() != Role.SUPER_ADMIN) {
            try {
                community = resolveCommunity(caller);
            } catch (Exception e) {
                return ResponseEntity.badRequest().body(e.getMessage());
            }
        }

        String flat = (String) req.get("flatNumber");
        if (caller.getRole() == Role.RESIDENT && (flat == null || flat.isBlank())) {
            flat = caller.getFlatNumber();
        }

        String dateStr = (String) req.get("readingDate");
        
        // Single "reading" input representing the usage/consumption value directly in litres
        BigDecimal readingVal = req.get("reading") != null 
                ? new BigDecimal(req.get("reading").toString()) 
                : (req.get("usageLitres") != null ? new BigDecimal(req.get("usageLitres").toString()) : BigDecimal.ZERO);

        if (dateStr == null || dateStr.trim().isEmpty()) {
            dateStr = LocalDate.now().toString();
        }

        LocalDate date = LocalDate.parse(dateStr);
        if (date.isAfter(LocalDate.now())) {
            return ResponseEntity.badRequest().body("Reading date cannot be in the future.");
        }

        if (readingVal.compareTo(BigDecimal.ZERO) < 0) {
            return ResponseEntity.badRequest().body("Reading value cannot be negative.");
        }

        User resident = caller;
        if (caller.getRole() != Role.RESIDENT) {
            if (flat == null || flat.trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Flat number is required.");
            }
            final String normManualFlat = normalizeFlatNumber(flat);
            final Community targetComm = community;
            resident = userRepository.findAll().stream()
                    .filter(u -> u.getCommunity() != null 
                            && (targetComm == null || u.getCommunity().getId().equals(targetComm.getId()))
                            && u.getRole() == Role.RESIDENT
                            && u.getFlatNumber() != null 
                            && normalizeFlatNumber(u.getFlatNumber()).equals(normManualFlat))
                    .findFirst()
                    .orElse(null);

            if (resident == null) {
                return ResponseEntity.badRequest().body("Resident not found for flat " + flat);
            }
            community = resident.getCommunity();
        }

        // BLOCK DUPLICATE READINGS ON THE SAME DAY FOR THE RESIDENT
        Optional<MeterReading> existingOpt = meterReadingRepository.findByResidentIdAndReadingDate(resident.getId(), date);
        if (existingOpt.isPresent()) {
            return ResponseEntity.badRequest().body("A meter reading for flat " + resident.getFlatNumber() + " has already been submitted for " + date + ". Duplicate readings on the same day are not allowed.");
        }

        // Get or create dummy processing upload job for manual logs
        final Community finalComm = community;
        final User adminUser = caller;
        UploadJob dummyJob = uploadJobRepository.findAll().stream()
                .filter(j -> finalComm != null && j.getCommunity() != null && j.getCommunity().getId().equals(finalComm.getId()) && "MANUAL_ENTRY".equals(j.getOriginalFilename()))
                .findFirst()
                .orElseGet(() -> {
                    UploadJob job = UploadJob.builder()
                            .community(finalComm)
                            .uploadedBy(adminUser)
                            .originalFilename("MANUAL_ENTRY")
                            .uploadStatus(UploadStatus.COMPLETED)
                            .totalRows(1)
                            .successfulRows(1)
                            .failedRows(0)
                            .build();
                    return uploadJobRepository.save(job);
                });

        // Retrieve resident's previous reading (latest before this date) to calculate cumulative current index
        Optional<MeterReading> latestReadingOpt = meterReadingRepository.findByResidentIdOrderByReadingDateDesc(resident.getId()).stream()
                .filter(r -> r.getReadingDate().isBefore(date))
                .findFirst();

        BigDecimal previousReading = BigDecimal.ZERO;
        if (latestReadingOpt.isPresent()) {
            previousReading = latestReadingOpt.get().getCurrentReading();
        }

        BigDecimal usageLitres = readingVal;
        BigDecimal currentReading = previousReading.add(usageLitres);

        MeterReading reading = MeterReading.builder()
                .uploadJob(dummyJob)
                .community(community)
                .resident(resident)
                .readingDate(date)
                .previousReading(previousReading)
                .currentReading(currentReading)
                .usageLitres(usageLitres)
                .build();

        // Run anomaly detection
        detectAndFlagAnomaly(reading, resident);
        meterReadingRepository.save(reading);

        // Save Calendar event for manual reading logged
        CalendarEvent manualEvent = CalendarEvent.builder()
                .community(community)
                .title("Manual Reading: Flat " + resident.getFlatNumber())
                .description("Logged reading of " + reading.getUsageLitres() + " L on " + date + ".")
                .eventDate(LocalDate.now())
                .eventType("UPLOAD_JOB")
                .build();
        calendarEventRepository.save(manualEvent);

        // Automatically calculate & generate bill for resident based on tariff and send email ONLY to this resident
        try {
            WaterBill manualBill = billingEngineService.generateSingleResidentBill(resident, community, date.withDayOfMonth(1), caller.getEmail(), "Manual reading bill generation", true);
            if (manualBill != null) {
                emailService.sendWaterBillEmail(manualBill);
            }
        } catch (Exception e) {
            System.err.println("Error auto-generating bill after manual reading: " + e.getMessage());
        }

        // Trigger notifications and high-usage alerts instantly
        if (reading.getIsAnomaly() != null && reading.getIsAnomaly()) {
            Notification alert = Notification.builder()
                    .user(resident)
                    .community(community)
                    .title("Water Anomaly Detected")
                    .message("Your flat " + resident.getFlatNumber() + " flagged a " + reading.getAnomalyType() + " anomaly on " + date + ": " + reading.getAnomalyNotes())
                    .type("HIGH_USAGE")
                    .build();
            notificationRepository.save(alert);
        } else {
            Notification notif = Notification.builder()
                    .user(resident)
                    .community(community)
                    .title("Manual Reading Recorded")
                    .message("A manual meter reading of " + reading.getUsageLitres() + " L has been logged for " + date + ".")
                    .type("READING_UPLOADED")
                    .build();
            notificationRepository.save(notif);
        }

        // Recalculate community billing cycles for the target month
        calculateBillsForCommunity(community, date.withDayOfMonth(1));

        auditLogService.log(auth.getName(), "MANUAL_READING_LOG", "Logged manual reading of " + reading.getUsageLitres() + " L for flat: " + resident.getFlatNumber() + " on " + date);
        return ResponseEntity.ok("Manual reading logged successfully: Billed " + reading.getUsageLitres() + " L for flat " + resident.getFlatNumber());
    }

    @PutMapping("/billing-settings")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    @Transactional
    public ResponseEntity<?> updateBillingSettings(@RequestBody Map<String, Object> req, Authentication auth) {
        User admin = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("Admin not found"));
        
        Long communityId = null;
        if (req.get("communityId") != null && !req.get("communityId").toString().isBlank()) {
            try {
                communityId = Long.valueOf(req.get("communityId").toString());
            } catch (Exception ignored) {}
        }

        Community community;
        if (communityId != null) {
            community = communityRepository.findById(communityId)
                    .orElseThrow(() -> new RuntimeException("Community not found"));
        } else {
            try {
                community = resolveCommunity(admin);
            } catch (Exception e) {
                return ResponseEntity.badRequest().body(e.getMessage());
            }
        }

        if (req.get("tariffRate") != null) community.setTariffRate(new BigDecimal(req.get("tariffRate").toString()));
        if (req.get("tier1LimitLitres") != null) community.setTier1LimitLitres(new BigDecimal(req.get("tier1LimitLitres").toString()));
        if (req.get("tier1Rate") != null) community.setTier1Rate(new BigDecimal(req.get("tier1Rate").toString()));
        if (req.get("tier2Rate") != null) community.setTier2Rate(new BigDecimal(req.get("tier2Rate").toString()));
        if (req.get("taxRate") != null) community.setTaxRate(new BigDecimal(req.get("taxRate").toString()));
        if (req.get("lateFeeRate") != null) community.setLateFeeRate(new BigDecimal(req.get("lateFeeRate").toString()));
        if (req.get("discountRate") != null) community.setDiscountRate(new BigDecimal(req.get("discountRate").toString()));
        if (req.get("minimumMonthlyCharge") != null) community.setMinimumMonthlyCharge(new BigDecimal(req.get("minimumMonthlyCharge").toString()));
        if (req.get("fixedServiceCharge") != null) community.setFixedServiceCharge(new BigDecimal(req.get("fixedServiceCharge").toString()));
        if (req.get("dueDateDays") != null) community.setDueDateDays(Integer.valueOf(req.get("dueDateDays").toString()));

        communityRepository.save(community);
        communityRepository.flush();

        // DO NOT retroactively modify existing bills! Past generated bills remain untouched as historical records.
        // New bills generated on subsequent meter reading submissions will automatically fetch these saved DB rates.

        auditLogService.log(auth.getName(), "BILLING_SETTINGS_UPDATE", "Updated and published billing settings for community: " + community.getName());
        return ResponseEntity.ok("Community tariff plan published and saved to database successfully.");
    }

    @GetMapping("/bills/{id}/pdf")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN', 'RESIDENT')")
    public ResponseEntity<?> downloadBillPdf(@PathVariable Long id, Authentication authentication) {
        WaterBill bill = waterBillRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Invoice not found"));

        // Authorization: SUPER_ADMIN (any), ADMIN (own community only), RESIDENT (own bill only).
        User caller = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        boolean allowed = switch (caller.getRole()) {
            case SUPER_ADMIN -> true;
            case ADMIN -> caller.getCommunity() != null && bill.getCommunity() != null
                    && caller.getCommunity().getId().equals(bill.getCommunity().getId());
            case RESIDENT -> bill.getResident() != null
                    && caller.getId().equals(bill.getResident().getId());
        };
        if (!allowed) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("You are not authorized to access this invoice.");
        }
        try {
            byte[] pdfBytes = pdfService.generateWaterBillPdf(bill);
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("attachment", "invoice-" + id + ".pdf");
            headers.setContentLength(pdfBytes.length);
            return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error generating bill PDF: " + e.getMessage());
        }
    }

    @PostMapping("/bills/{id}/email")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    @Transactional
    public ResponseEntity<?> emailBill(@PathVariable Long id) {
        WaterBill bill = waterBillRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Invoice not found"));
        emailService.sendWaterBillEmail(bill);
        return ResponseEntity.ok("Email notification triggered successfully.");
    }

    @GetMapping("/readings/search")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN', 'RESIDENT')")
    public ResponseEntity<?> searchReadings(
            @RequestParam(value = "communityId", required = false) Long communityId,
            @RequestParam(value = "residentId", required = false) Long residentId,
            @RequestParam(value = "building", required = false) String building,
            @RequestParam(value = "flatNumber", required = false) String flatNumber,
            @RequestParam(value = "meterNumber", required = false) String meterNumber,
            @RequestParam(value = "isAnomaly", required = false) Boolean isAnomaly,
            @RequestParam(value = "startDate", required = false) String startDate,
            @RequestParam(value = "endDate", required = false) String endDate,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "10") int size,
            Authentication auth
    ) {
        User caller = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        Long targetCommunityId = communityId;
        if (caller.getRole() == Role.ADMIN) {
            targetCommunityId = caller.getCommunity() != null ? caller.getCommunity().getId() : null;
        } else if (caller.getRole() == Role.RESIDENT) {
            residentId = caller.getId();
            targetCommunityId = caller.getCommunity() != null ? caller.getCommunity().getId() : null;
        }

        List<MeterReading> list = meterReadingRepository.findAll();

        // Apply filters
        final Long fCommunityId = targetCommunityId;
        final Long fResidentId = residentId;
        final String fBuilding = building;
        final String fFlat = flatNumber;
        final String fMeter = meterNumber;
        final Boolean fAnomaly = isAnomaly;
        final LocalDate fStart = startDate != null && !startDate.isBlank() ? LocalDate.parse(startDate) : null;
        final LocalDate fEnd = endDate != null && !endDate.isBlank() ? LocalDate.parse(endDate) : null;

        java.util.stream.Stream<MeterReading> stream = list.stream();
        if (fCommunityId != null) {
            stream = stream.filter(r -> r.getCommunity() != null && r.getCommunity().getId().equals(fCommunityId));
        }
        if (fResidentId != null) {
            stream = stream.filter(r -> r.getResident() != null && r.getResident().getId().equals(fResidentId));
        }
        if (fBuilding != null && !fBuilding.isBlank()) {
            stream = stream.filter(r -> r.getResident() != null && r.getResident().getBuilding() != null && 
                    r.getResident().getBuilding().equalsIgnoreCase(fBuilding.trim()));
        }
        if (fFlat != null && !fFlat.isBlank()) {
            stream = stream.filter(r -> r.getResident() != null && r.getResident().getFlatNumber() != null && 
                    r.getResident().getFlatNumber().equalsIgnoreCase(fFlat.trim()));
        }
        if (fMeter != null && !fMeter.isBlank()) {
            stream = stream.filter(r -> r.getResident() != null && r.getResident().getMeterNumber() != null && 
                    r.getResident().getMeterNumber().equalsIgnoreCase(fMeter.trim()));
        }
        if (fAnomaly != null) {
            stream = stream.filter(r -> r.getIsAnomaly() != null && r.getIsAnomaly().equals(fAnomaly));
        }
        if (fStart != null) {
            stream = stream.filter(r -> !r.getReadingDate().isBefore(fStart));
        }
        if (fEnd != null) {
            stream = stream.filter(r -> !r.getReadingDate().isAfter(fEnd));
        }

        List<MeterReading> filteredList = stream
                .sorted((a, b) -> {
                    int cmp = b.getReadingDate().compareTo(a.getReadingDate());
                    if (cmp != 0) return cmp;
                    if (b.getCreatedAt() != null && a.getCreatedAt() != null) {
                        return b.getCreatedAt().compareTo(a.getCreatedAt());
                    }
                    return Long.compare(b.getId() != null ? b.getId() : 0L, a.getId() != null ? a.getId() : 0L);
                })
                .toList();

        int total = filteredList.size();
        int fromIndex = Math.min(page * size, total);
        int toIndex = Math.min(fromIndex + size, total);

        List<com.wumbap.wumbap.dto.ReadingResponse> content = filteredList.subList(fromIndex, toIndex).stream()
                .map(this::mapReadingToResponse)
                .toList();

        Map<String, Object> resp = new HashMap<>();
        resp.put("content", content);
        resp.put("totalElements", total);
        resp.put("page", page);
        resp.put("size", size);

        return ResponseEntity.ok(resp);
    }

    @GetMapping("/readings/analytics")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<?> getReadingsAnalytics(
            @RequestParam(value = "communityId", required = false) Long communityId,
            Authentication auth
    ) {
        User caller = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("Caller not found"));

        Long targetCommunityId = communityId;
        if (caller.getRole() == Role.ADMIN) {
            targetCommunityId = caller.getCommunity() != null ? caller.getCommunity().getId() : null;
        }

        List<MeterReading> readings = meterReadingRepository.findAll();
        if (targetCommunityId != null) {
            final Long finalId = targetCommunityId;
            readings = readings.stream()
                    .filter(r -> r.getCommunity() != null && r.getCommunity().getId().equals(finalId))
                    .toList();
        }

        BigDecimal totalUsed = readings.stream()
                .map(r -> r.getUsageLitres() != null ? r.getUsageLitres() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        long anomalyCount = readings.stream()
                .filter(r -> r.getIsAnomaly() != null && r.getIsAnomaly())
                .count();

        BigDecimal peakUsage = readings.stream()
                .map(r -> r.getUsageLitres() != null ? r.getUsageLitres() : BigDecimal.ZERO)
                .max(BigDecimal::compareTo)
                .orElse(BigDecimal.ZERO);

        BigDecimal minUsage = readings.stream()
                .map(r -> r.getUsageLitres() != null ? r.getUsageLitres() : BigDecimal.ZERO)
                .filter(u -> u.compareTo(BigDecimal.ZERO) > 0)
                .min(BigDecimal::compareTo)
                .orElse(BigDecimal.ZERO);

        // Weekly usage trend (last 7 days)
        Map<LocalDate, BigDecimal> weeklyMap = new java.util.TreeMap<>();
        for (int i = 6; i >= 0; i--) {
            weeklyMap.put(LocalDate.now().minusDays(i), BigDecimal.ZERO);
        }
        for (MeterReading r : readings) {
            if (weeklyMap.containsKey(r.getReadingDate())) {
                BigDecimal val = r.getUsageLitres() != null ? r.getUsageLitres() : BigDecimal.ZERO;
                weeklyMap.put(r.getReadingDate(), weeklyMap.get(r.getReadingDate()).add(val));
            }
        }
        List<Map<String, Object>> weeklyTrend = weeklyMap.entrySet().stream()
                .map(entry -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("name", entry.getKey().toString());
                    m.put("usage", entry.getValue());
                    return m;
                }).toList();

        // Monthly trend (last 6 months)
        Map<String, BigDecimal> monthlyMap = new java.util.LinkedHashMap<>();
        for (int i = 5; i >= 0; i--) {
            LocalDate d = LocalDate.now().minusMonths(i);
            String label = d.getMonth().name().substring(0, 3) + " " + (d.getYear() % 100);
            monthlyMap.put(label, BigDecimal.ZERO);
        }
        for (MeterReading r : readings) {
            LocalDate d = r.getReadingDate();
            String label = d.getMonth().name().substring(0, 3) + " " + (d.getYear() % 100);
            if (monthlyMap.containsKey(label)) {
                BigDecimal val = r.getUsageLitres() != null ? r.getUsageLitres() : BigDecimal.ZERO;
                monthlyMap.put(label, monthlyMap.get(label).add(val));
            }
        }
        List<Map<String, Object>> monthlyTrend = monthlyMap.entrySet().stream()
                .map(entry -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("name", entry.getKey());
                    m.put("usage", entry.getValue());
                    return m;
                }).toList();

        // Consumption by building
        Map<String, BigDecimal> buildingMap = new HashMap<>();
        for (MeterReading r : readings) {
            if (r.getResident() != null && r.getResident().getBuilding() != null) {
                String bld = r.getResident().getBuilding().trim();
                BigDecimal val = r.getUsageLitres() != null ? r.getUsageLitres() : BigDecimal.ZERO;
                buildingMap.put(bld, buildingMap.getOrDefault(bld, BigDecimal.ZERO).add(val));
            }
        }
        List<Map<String, Object>> buildingTrend = buildingMap.entrySet().stream()
                .map(entry -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("building", entry.getKey());
                    m.put("usage", entry.getValue());
                    return m;
                }).toList();

        // Top 5 consumers
        Map<User, BigDecimal> residentMap = new HashMap<>();
        for (MeterReading r : readings) {
            if (r.getResident() != null) {
                BigDecimal val = r.getUsageLitres() != null ? r.getUsageLitres() : BigDecimal.ZERO;
                residentMap.put(r.getResident(), residentMap.getOrDefault(r.getResident(), BigDecimal.ZERO).add(val));
            }
        }
        List<Map<String, Object>> topConsumers = residentMap.entrySet().stream()
                .sorted((a, b) -> b.getValue().compareTo(a.getValue()))
                .limit(5)
                .map(entry -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("flat", entry.getKey().getFlatNumber());
                    m.put("resident", entry.getKey().getFullName());
                    m.put("usage", entry.getValue());
                    return m;
                }).toList();

        Map<String, Object> analytics = new HashMap<>();
        analytics.put("totalWaterUsed", totalUsed);
        analytics.put("anomalyCount", anomalyCount);
        analytics.put("peakUsage", peakUsage);
        analytics.put("minUsage", minUsage);
        analytics.put("weeklyUsageTrend", weeklyTrend);
        analytics.put("monthlyUsageTrend", monthlyTrend);
        analytics.put("consumptionByBuilding", buildingTrend);
        analytics.put("topConsumers", topConsumers);

        return ResponseEntity.ok(analytics);
    }

    @GetMapping("/readings/imports")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<?> getCSVImportJobs(
            @RequestParam(value = "communityId", required = false) Long communityId,
            Authentication auth
    ) {
        User caller = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("Caller not found"));

        Long targetCommunityId = communityId;
        if (caller.getRole() == Role.ADMIN) {
            targetCommunityId = caller.getCommunity() != null ? caller.getCommunity().getId() : null;
        }

        List<UploadJob> jobs;
        if (targetCommunityId != null) {
            jobs = uploadJobRepository.findByCommunityIdOrderByUploadStartedAtDesc(targetCommunityId);
        } else {
            jobs = uploadJobRepository.findAll();
        }

        List<Map<String, Object>> mappedJobs = jobs.stream()
                .sorted((a, b) -> b.getUploadStartedAt().compareTo(a.getUploadStartedAt()))
                .map(j -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("id", j.getId());
                    m.put("originalFilename", j.getOriginalFilename());
                    m.put("uploadedBy", j.getUploadedBy() != null ? j.getUploadedBy().getFullName() : "System");
                    m.put("uploadStatus", j.getUploadStatus().name());
                    m.put("totalRows", j.getTotalRows());
                    m.put("successfulRows", j.getSuccessfulRows());
                    m.put("failedRows", j.getFailedRows());
                    m.put("uploadStartedAt", j.getUploadStartedAt().toString());
                    m.put("uploadCompletedAt", j.getUploadCompletedAt() != null ? j.getUploadCompletedAt().toString() : null);
                    m.put("errorMessage", j.getErrorMessage());
                    return m;
                })
                .toList();

        return ResponseEntity.ok(mappedJobs);
    }

    private com.wumbap.wumbap.dto.ReadingResponse mapReadingToResponse(MeterReading r) {
        return com.wumbap.wumbap.dto.ReadingResponse.builder()
                .id(r.getId())
                .communityId(r.getCommunity() != null ? r.getCommunity().getId() : null)
                .communityName(r.getCommunity() != null ? r.getCommunity().getName() : null)
                .residentId(r.getResident() != null ? r.getResident().getId() : null)
                .residentName(r.getResident() != null ? r.getResident().getFullName() : null)
                .flatNumber(r.getResident() != null ? r.getResident().getFlatNumber() : null)
                .building(r.getResident() != null ? r.getResident().getBuilding() : null)
                .block(r.getResident() != null ? r.getResident().getBlock() : null)
                .floor(r.getResident() != null ? r.getResident().getFloor() : null)
                .meterNumber(r.getResident() != null ? r.getResident().getMeterNumber() : null)
                .readingDate(r.getReadingDate())
                .previousReading(r.getPreviousReading())
                .currentReading(r.getCurrentReading())
                .usageLitres(r.getUsageLitres())
                .isAnomaly(r.getIsAnomaly())
                .anomalyType(r.getAnomalyType())
                .anomalyNotes(r.getAnomalyNotes())
                .notes(r.getUploadJob() != null ? r.getUploadJob().getOriginalFilename() : "")
                .createdAt(r.getCreatedAt())
                .build();
    }

    private Community resolveCommunity(User user) {
        if (user.getCommunity() != null) {
            return user.getCommunity();
        }
        if (user.getRole() == Role.SUPER_ADMIN) {
            return communityRepository.findAll().stream()
                    .findFirst()
                    .orElseThrow(() -> new RuntimeException("No communities exist in the system. Create a community first."));
        }
        throw new RuntimeException("You are not associated with any community.");
    }

    private String normalizeFlatNumber(String flat) {
        if (flat == null) return "";
        String normalized = flat.replaceAll("[\\s\\-_/]", "").toUpperCase();
        if (normalized.startsWith("FLAT")) {
            normalized = normalized.substring(4);
        }
        return normalized;
    }

    private String getRecordValue(CSVRecord record, String... headers) {
        for (String h : headers) {
            if (record.isMapped(h) && record.isSet(h)) {
                return record.get(h);
            }
            // Case-insensitive mapping lookup
            for (Map.Entry<String, String> entry : record.toMap().entrySet()) {
                if (entry.getKey().trim().equalsIgnoreCase(h.trim())) {
                    return entry.getValue();
                }
            }
        }
        return null;
    }

    private void detectAndFlagAnomaly(MeterReading reading, User resident) {
        BigDecimal usage = reading.getUsageLitres();
        if (usage == null) usage = BigDecimal.ZERO;

        // 1. Negative Reading
        if (usage.compareTo(BigDecimal.ZERO) < 0) {
            reading.setIsAnomaly(true);
            reading.setAnomalyType("NEGATIVE_READING");
            reading.setAnomalyNotes("Usage is negative: " + usage + " L");
            return;
        }

        // 2. Sudden Spike (e.g. usage > 400 L)
        if (usage.compareTo(new BigDecimal("400")) > 0) {
            reading.setIsAnomaly(true);
            reading.setAnomalyType("SPIKE");
            reading.setAnomalyNotes("Usage spike detected: " + usage + " L");
            return;
        }

        // 3. Unusually High Usage (e.g. usage > 800 L)
        if (usage.compareTo(new BigDecimal("800")) > 0) {
            reading.setIsAnomaly(true);
            reading.setAnomalyType("HIGH_USAGE");
            reading.setAnomalyNotes("Critical high usage: " + usage + " L");
            return;
        }

        // 4. Skipped Month Check
        List<MeterReading> previousReadings = meterReadingRepository.findByResidentIdOrderByReadingDateDesc(resident.getId());
        if (!previousReadings.isEmpty()) {
            MeterReading lastReading = previousReadings.get(0);
            if (lastReading.getReadingDate().isBefore(reading.getReadingDate().minusDays(40))) {
                reading.setIsAnomaly(true);
                reading.setAnomalyType("SKIPPED_PERIOD");
                reading.setAnomalyNotes("Time since last reading exceeds 40 days");
                return;
            }
        }
    }

    @GetMapping("/anomalies")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<?> getAnomalies(@RequestParam(required = false) Long communityId, Authentication authentication) {
        User caller = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("Caller not found"));
                
        Long targetCommId = communityId;
        if (caller.getRole() == Role.ADMIN) {
            targetCommId = caller.getCommunity().getId();
        }
        
        return ResponseEntity.ok(leakDetectionService.detectAnomalies(targetCommId));
    }
}
