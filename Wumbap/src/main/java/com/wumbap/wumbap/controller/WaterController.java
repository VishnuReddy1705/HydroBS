package com.wumbap.wumbap.controller;

import com.wumbap.wumbap.entity.*;
import com.wumbap.wumbap.repository.*;
import lombok.RequiredArgsConstructor;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVRecord;
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

@RestController
@RequestMapping("/api/water")
@RequiredArgsConstructor
public class WaterController {

    private final UserRepository userRepository;
    private final UploadJobRepository uploadJobRepository;
    private final MeterReadingRepository meterReadingRepository;
    private final MeterImportErrorRepository meterImportErrorRepository;
    private final WaterBillRepository waterBillRepository;

    @PostMapping(value = "/upload-readings", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> uploadReadings(
            @RequestParam("file") MultipartFile file,
            Authentication authentication
    ) {
        User admin = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("Admin not found"));
        Community community = admin.getCommunity();

        if (community == null) {
            return ResponseEntity.badRequest().body("You are not associated with any community.");
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
        int failCount = 0;

        try (Reader reader = new InputStreamReader(file.getInputStream())) {
            CSVFormat csvFormat = CSVFormat.DEFAULT.builder()
                    .setHeader()
                    .setSkipHeaderRecord(true)
                    .setIgnoreHeaderCase(true)
                    .setTrim(true)
                    .build();

            Iterable<CSVRecord> records = csvFormat.parse(reader);
            for (CSVRecord record : records) {
                rowNumber++;
                String flatNumber = null;
                String email = null;
                String dateStr = null;
                String prevStr = null;
                String currStr = null;

                if (record.isSet("flatNumber")) flatNumber = record.get("flatNumber");
                else if (record.isSet("flat")) flatNumber = record.get("flat");
                else if (record.isSet("flat_number")) flatNumber = record.get("flat_number");

                if (record.isSet("email")) email = record.get("email");

                if (record.isSet("readingDate")) dateStr = record.get("readingDate");
                else if (record.isSet("date")) dateStr = record.get("date");
                else if (record.isSet("reading_date")) dateStr = record.get("reading_date");

                if (record.isSet("previousReading")) prevStr = record.get("previousReading");
                else if (record.isSet("previous_reading")) prevStr = record.get("previous_reading");
                else if (record.isSet("previous")) prevStr = record.get("previous");

                if (record.isSet("currentReading")) currStr = record.get("currentReading");
                else if (record.isSet("current_reading")) currStr = record.get("current_reading");
                else if (record.isSet("current")) currStr = record.get("current");

                try {
                    if ((flatNumber == null || flatNumber.isBlank()) && (email == null || email.isBlank())) {
                        throw new RuntimeException("Flat number or email must be provided");
                    }
                    if (dateStr == null || dateStr.isBlank()) {
                        throw new RuntimeException("Reading date is required");
                    }
                    if (prevStr == null || prevStr.isBlank() || currStr == null || currStr.isBlank()) {
                        throw new RuntimeException("Previous and current readings are required");
                    }

                    LocalDate readingDate = LocalDate.parse(dateStr);
                    BigDecimal previousReading = new BigDecimal(prevStr);
                    BigDecimal currentReading = new BigDecimal(currStr);

                    if (currentReading.compareTo(previousReading) < 0) {
                        throw new RuntimeException("Current reading cannot be less than previous reading");
                    }

                    // Find resident
                    User resident = null;
                    if (email != null && !email.isBlank()) {
                        resident = userRepository.findByEmail(email).orElse(null);
                    }
                    if (resident == null && flatNumber != null && !flatNumber.isBlank()) {
                        // Find user in this community with this flat number
                        final String targetFlat = flatNumber.trim();
                        resident = userRepository.findAll().stream()
                                .filter(u -> u.getCommunity() != null 
                                        && u.getCommunity().getId().equals(community.getId()) 
                                        && u.getRole() == Role.RESIDENT
                                        && u.getFlatNumber() != null 
                                        && u.getFlatNumber().equalsIgnoreCase(targetFlat))
                                .findFirst()
                                .orElse(null);
                    }

                    if (resident == null) {
                        throw new RuntimeException("Resident not found in this community with flat " + flatNumber + " / email " + email);
                    }

                    // Save or update meter reading
                    Optional<MeterReading> existingOpt = meterReadingRepository.findByResidentIdAndReadingDate(resident.getId(), readingDate);
                    MeterReading meterReading;
                    if (existingOpt.isPresent()) {
                        meterReading = existingOpt.get();
                        meterReading.setPreviousReading(previousReading);
                        meterReading.setCurrentReading(currentReading);
                        meterReading.setUsageLitres(currentReading.subtract(previousReading));
                        meterReading.setUploadJob(job);
                    } else {
                        meterReading = MeterReading.builder()
                                .uploadJob(job)
                                .community(community)
                                .resident(resident)
                                .readingDate(readingDate)
                                .previousReading(previousReading)
                                .currentReading(currentReading)
                                .usageLitres(currentReading.subtract(previousReading))
                                .build();
                    }

                    meterReadingRepository.save(meterReading);
                    successCount++;

                } catch (Exception ex) {
                    failCount++;
                    MeterImportError error = MeterImportError.builder()
                            .uploadJob(job)
                            .csvRowNumber(rowNumber)
                            .residentIdentifier(email != null && !email.isBlank() ? email : flatNumber)
                            .errorMessage(ex.getMessage())
                            .build();
                    meterImportErrorRepository.save(error);
                }
            }

            job.setTotalRows(rowNumber);
            job.setSuccessfulRows(successCount);
            job.setFailedRows(failCount);
            job.setUploadCompletedAt(LocalDateTime.now());

            if (failCount == 0 && rowNumber > 0) {
                job.setUploadStatus(UploadStatus.COMPLETED);
            } else if (successCount > 0 && failCount > 0) {
                job.setUploadStatus(UploadStatus.COMPLETED_WITH_ERRORS);
            } else {
                job.setUploadStatus(UploadStatus.FAILED);
                job.setErrorMessage("All rows failed or file was empty.");
            }
            uploadJobRepository.save(job);

            Map<String, Object> result = new HashMap<>();
            result.put("jobId", job.getId());
            result.put("status", job.getUploadStatus().name());
            result.put("totalRows", job.getTotalRows());
            result.put("successfulRows", job.getSuccessfulRows());
            result.put("failedRows", job.getFailedRows());
            return ResponseEntity.ok(result);

        } catch (Exception e) {
            job.setUploadStatus(UploadStatus.FAILED);
            job.setErrorMessage("CSV parse failed: " + e.getMessage());
            job.setUploadCompletedAt(LocalDateTime.now());
            uploadJobRepository.save(job);
            return ResponseEntity.badRequest().body("Failed to parse CSV: " + e.getMessage());
        }
    }

    @PostMapping("/generate-bills")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> generateBills(
            @RequestParam(required = false) String month, // format yyyy-MM
            Authentication authentication
    ) {
        User admin = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("Admin not found"));
        Community community = admin.getCommunity();

        if (community == null) {
            return ResponseEntity.badRequest().body("You are not associated with any community.");
        }

        LocalDate billingMonth;
        if (month == null || month.isBlank()) {
            billingMonth = LocalDate.now().withDayOfMonth(1);
        } else {
            billingMonth = LocalDate.parse(month + "-01");
        }

        // Find all approved residents in this community
        List<User> residents = userRepository.findAll().stream()
                .filter(u -> u.getCommunity() != null 
                        && u.getCommunity().getId().equals(community.getId()) 
                        && u.getRole() == Role.RESIDENT)
                .toList();

        int generatedCount = 0;
        BigDecimal tariffRate = new BigDecimal("5.00"); // ₹5 per Litre

        for (User resident : residents) {
            LocalDate start = billingMonth;
            LocalDate end = billingMonth.plusMonths(1).minusDays(1);

            List<MeterReading> readings = meterReadingRepository.findByResidentIdOrderByReadingDateDesc(resident.getId()).stream()
                    .filter(r -> !r.getReadingDate().isBefore(start) && !r.getReadingDate().isAfter(end))
                    .toList();

            BigDecimal totalUsage = readings.stream()
                    .map(MeterReading::getUsageLitres)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal amount = totalUsage.multiply(tariffRate);

            // Save or update bill
            Optional<WaterBill> existingBill = waterBillRepository.findByResidentIdAndBillingMonth(resident.getId(), billingMonth);
            WaterBill bill;
            if (existingBill.isPresent()) {
                bill = existingBill.get();
                bill.setTotalUsage(totalUsage);
                bill.setAmount(amount);
            } else {
                bill = WaterBill.builder()
                        .resident(resident)
                        .community(community)
                        .billingMonth(billingMonth)
                        .totalUsage(totalUsage)
                        .amount(amount)
                        .status("UNPAID")
                        .dueDate(LocalDate.now().plusDays(15))
                        .build();
            }

            waterBillRepository.save(bill);
            generatedCount++;
        }

        return ResponseEntity.ok("Successfully generated/updated " + generatedCount + " bills for " + billingMonth.getMonth().name() + " " + billingMonth.getYear());
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
                    map.put("totalUsage", b.getTotalUsage());
                    map.put("amount", b.getAmount());
                    map.put("status", b.getStatus());
                    map.put("dueDate", b.getDueDate() != null ? b.getDueDate().toString() : null);
                    map.put("generatedAt", b.getGeneratedAt().toString());
                    return map;
                })
                .toList();
    }
}
