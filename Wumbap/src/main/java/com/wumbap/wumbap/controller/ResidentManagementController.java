package com.wumbap.wumbap.controller;

import com.wumbap.wumbap.dto.ResidentProfileResponse;
import com.wumbap.wumbap.dto.ResidentRequest;
import com.wumbap.wumbap.entity.Community;
import com.wumbap.wumbap.entity.Role;
import com.wumbap.wumbap.entity.User;
import com.wumbap.wumbap.repository.CommunityRepository;
import com.wumbap.wumbap.repository.UserRepository;
import com.wumbap.wumbap.service.AuditLogService;
import lombok.RequiredArgsConstructor;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVPrinter;
import org.apache.commons.csv.CSVRecord;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStreamReader;
import java.io.Reader;
import java.io.StringWriter;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/residents")
@RequiredArgsConstructor
public class ResidentManagementController {

    private final UserRepository userRepository;
    private final CommunityRepository communityRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditLogService auditLogService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    @Transactional(readOnly = true)
    public ResponseEntity<?> getResidents(
            @RequestParam(required = false) Long communityId,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String building,
            @RequestParam(required = false) String block,
            @RequestParam(required = false) String floor,
            @RequestParam(required = false) String occupancyType,
            @RequestParam(required = false) Boolean isActive,
            @RequestParam(defaultValue = "fullName") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            Authentication authentication
    ) {
        User caller = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("Logged in user not found"));

        Long targetCommunityId = communityId;
        if (caller.getRole() != Role.SUPER_ADMIN) {
            if (caller.getCommunity() == null) {
                return ResponseEntity.ok(Map.of("content", List.of(), "totalElements", 0));
            }
            targetCommunityId = caller.getCommunity().getId();
        }

        final Long finalCommId = targetCommunityId;

        // Perform stream-based filtering, sorting, and pagination
        List<User> list = userRepository.findAll().stream()
                .filter(u -> u.getRole() == Role.RESIDENT)
                .filter(u -> finalCommId == null || (u.getCommunity() != null && u.getCommunity().getId().equals(finalCommId)))
                .filter(u -> search == null || search.isBlank() || 
                        u.getFullName().toLowerCase().contains(search.toLowerCase()) ||
                        u.getEmail().toLowerCase().contains(search.toLowerCase()) ||
                        (u.getFlatNumber() != null && u.getFlatNumber().toLowerCase().contains(search.toLowerCase())) ||
                        (u.getPhoneNumber() != null && u.getPhoneNumber().contains(search)) ||
                        u.getId().toString().equals(search))
                .filter(u -> building == null || building.isBlank() || (u.getBuilding() != null && u.getBuilding().equalsIgnoreCase(building)))
                .filter(u -> block == null || block.isBlank() || (u.getBlock() != null && u.getBlock().equalsIgnoreCase(block)))
                .filter(u -> floor == null || floor.isBlank() || (u.getFloor() != null && u.getFloor().equalsIgnoreCase(floor)))
                .filter(u -> occupancyType == null || occupancyType.isBlank() || (u.getOccupancyType() != null && u.getOccupancyType().equalsIgnoreCase(occupancyType)))
                .filter(u -> isActive == null || u.isActive() == isActive)
                .toList();

        // Sorting
        List<User> mutableList = new ArrayList<>(list);
        mutableList.sort((a, b) -> {
            int comp = 0;
            if ("id".equalsIgnoreCase(sortBy)) {
                comp = a.getId().compareTo(b.getId());
            } else if ("email".equalsIgnoreCase(sortBy)) {
                comp = a.getEmail().compareToIgnoreCase(b.getEmail());
            } else if ("flatNumber".equalsIgnoreCase(sortBy)) {
                String fa = a.getFlatNumber() != null ? a.getFlatNumber() : "";
                String fb = b.getFlatNumber() != null ? b.getFlatNumber() : "";
                comp = fa.compareToIgnoreCase(fb);
            } else if ("building".equalsIgnoreCase(sortBy)) {
                String ba = a.getBuilding() != null ? a.getBuilding() : "";
                String bb = b.getBuilding() != null ? b.getBuilding() : "";
                comp = ba.compareToIgnoreCase(bb);
            } else {
                comp = a.getFullName().compareToIgnoreCase(b.getFullName());
            }
            return "desc".equalsIgnoreCase(sortDir) ? -comp : comp;
        });

        int total = mutableList.size();
        int fromIndex = Math.min(page * size, total);
        int toIndex = Math.min(fromIndex + size, total);
        List<User> paginated = mutableList.subList(fromIndex, toIndex);

        List<ResidentProfileResponse> content = paginated.stream()
                .map(this::mapToProfileResponse)
                .toList();

        Map<String, Object> response = new HashMap<>();
        response.put("content", content);
        response.put("totalElements", total);
        response.put("page", page);
        response.put("size", size);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    @Transactional(readOnly = true)
    public ResponseEntity<?> getResidentById(@PathVariable Long id, Authentication authentication) {
        User caller = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("Logged in user not found"));

        User resident = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Resident not found"));

        if (resident.getRole() != Role.RESIDENT) {
            return ResponseEntity.badRequest().body("Target user is not a resident.");
        }

        if (caller.getRole() != Role.SUPER_ADMIN) {
            if (caller.getCommunity() == null || resident.getCommunity() == null ||
                    !caller.getCommunity().getId().equals(resident.getCommunity().getId())) {
                return ResponseEntity.status(403).body("Access Denied: Resident belongs to another community.");
            }
        }

        return ResponseEntity.ok(mapToProfileResponse(resident));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<?> registerResident(@RequestBody ResidentRequest req, Authentication authentication) {
        User caller = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("Logged in user not found"));

        if (userRepository.existsByEmail(req.getEmail())) {
            return ResponseEntity.badRequest().body("Email address already registered.");
        }

        Long communityId = req.getCommunityId();
        if (caller.getRole() != Role.SUPER_ADMIN) {
            if (caller.getCommunity() == null) {
                return ResponseEntity.badRequest().body("You are not associated with any community.");
            }
            communityId = caller.getCommunity().getId();
        }

        if (communityId == null) {
            return ResponseEntity.badRequest().body("Community ID is required.");
        }

        Community community = communityRepository.findById(communityId)
                .orElseThrow(() -> new RuntimeException("Community not found"));

        // Validate unit duplicate active occupancy
        if (req.getFlatNumber() != null && !req.getFlatNumber().isBlank()) {
            boolean unitOccupied = userRepository.findAll().stream()
                    .anyMatch(u -> u.getRole() == Role.RESIDENT
                            && u.getCommunity() != null && u.getCommunity().getId().equals(community.getId())
                            && u.isActive()
                            && u.getFlatNumber() != null
                            && u.getFlatNumber().equalsIgnoreCase(req.getFlatNumber().trim()));
            
            if (unitOccupied) {
                return ResponseEntity.badRequest().body("Unit " + req.getFlatNumber() + " is already occupied by an active resident.");
            }
        }

        User resident = User.builder()
                .email(req.getEmail())
                .password(passwordEncoder.encode(req.getPassword() != null ? req.getPassword() : "HydroPass123!"))
                .fullName(req.getFullName())
                .role(Role.RESIDENT)
                .phoneNumber(req.getPhoneNumber())
                .profilePhotoUrl(req.getProfilePhotoUrl())
                .gender(req.getGender())
                .dateOfBirth(req.getDateOfBirth())
                .emergencyContactName(req.getEmergencyContactName())
                .emergencyContactPhone(req.getEmergencyContactPhone())
                .address(req.getAddress())
                .community(community)
                .building(req.getBuilding())
                .block(req.getBlock())
                .floor(req.getFloor())
                .flatNumber(req.getFlatNumber())
                .familySize(req.getFamilySize() != null ? req.getFamilySize() : 1)
                .occupancyType(req.getOccupancyType() != null ? req.getOccupancyType() : "TENANT")
                .moveInDate(req.getMoveInDate() != null ? req.getMoveInDate() : LocalDate.now())
                .flatArea(req.getFlatArea() != null ? req.getFlatArea() : BigDecimal.ZERO)
                .meterNumber(req.getMeterNumber())
                .waterBalance(req.getWaterBalance() != null ? req.getWaterBalance() : BigDecimal.ZERO)
                .isActive(req.getIsActive() != null ? req.getIsActive() : true)
                .isEmailVerified(false)
                .build();

        userRepository.save(resident);
        auditLogService.log(authentication.getName(), "RESIDENT_REGISTER", "Registered resident: " + resident.getEmail() + " in community: " + community.getName());
        return ResponseEntity.ok(mapToProfileResponse(resident));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<?> editResident(@PathVariable Long id, @RequestBody ResidentRequest req, Authentication authentication) {
        User caller = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("Logged in user not found"));

        User resident = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Resident not found"));

        if (resident.getRole() != Role.RESIDENT) {
            return ResponseEntity.badRequest().body("Target user is not a resident.");
        }

        if (caller.getRole() != Role.SUPER_ADMIN) {
            if (caller.getCommunity() == null || resident.getCommunity() == null ||
                    !caller.getCommunity().getId().equals(resident.getCommunity().getId())) {
                return ResponseEntity.status(403).body("Access Denied: Resident belongs to another community.");
            }
        }

        if (!resident.getEmail().equalsIgnoreCase(req.getEmail()) && userRepository.existsByEmail(req.getEmail())) {
            return ResponseEntity.badRequest().body("Email address already registered.");
        }

        // Validate flat duplicate active occupancy if it changes
        if (req.getFlatNumber() != null && !req.getFlatNumber().isBlank() && 
                (resident.getFlatNumber() == null || !resident.getFlatNumber().equalsIgnoreCase(req.getFlatNumber().trim()))) {
            
            boolean unitOccupied = userRepository.findAll().stream()
                    .anyMatch(u -> u.getRole() == Role.RESIDENT
                            && u.getCommunity() != null && u.getCommunity().getId().equals(resident.getCommunity().getId())
                            && u.isActive()
                            && !u.getId().equals(resident.getId())
                            && u.getFlatNumber() != null
                            && u.getFlatNumber().equalsIgnoreCase(req.getFlatNumber().trim()));
            
            if (unitOccupied) {
                return ResponseEntity.badRequest().body("Unit " + req.getFlatNumber() + " is already occupied by an active resident.");
            }
        }

        resident.setEmail(req.getEmail());
        if (req.getPassword() != null && !req.getPassword().isBlank()) {
            resident.setPassword(passwordEncoder.encode(req.getPassword()));
        }
        resident.setFullName(req.getFullName());
        resident.setPhoneNumber(req.getPhoneNumber());
        resident.setProfilePhotoUrl(req.getProfilePhotoUrl());
        resident.setGender(req.getGender());
        resident.setDateOfBirth(req.getDateOfBirth());
        resident.setEmergencyContactName(req.getEmergencyContactName());
        resident.setEmergencyContactPhone(req.getEmergencyContactPhone());
        resident.setAddress(req.getAddress());
        resident.setBuilding(req.getBuilding());
        resident.setBlock(req.getBlock());
        resident.setFloor(req.getFloor());
        resident.setFlatNumber(req.getFlatNumber());
        if (req.getFamilySize() != null) resident.setFamilySize(req.getFamilySize());
        if (req.getOccupancyType() != null) resident.setOccupancyType(req.getOccupancyType());
        if (req.getMoveInDate() != null) resident.setMoveInDate(req.getMoveInDate());
        if (req.getFlatArea() != null) resident.setFlatArea(req.getFlatArea());
        resident.setMeterNumber(req.getMeterNumber());
        if (req.getWaterBalance() != null) resident.setWaterBalance(req.getWaterBalance());
        if (req.getIsActive() != null) resident.setActive(req.getIsActive());

        userRepository.save(resident);
        auditLogService.log(authentication.getName(), "RESIDENT_UPDATE", "Updated resident details: " + resident.getEmail());
        return ResponseEntity.ok(mapToProfileResponse(resident));
    }

    @PostMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<?> toggleResidentStatus(@PathVariable Long id, @RequestParam boolean active, Authentication authentication) {
        User caller = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("Logged in user not found"));

        User resident = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Resident not found"));

        if (caller.getRole() != Role.SUPER_ADMIN) {
            if (caller.getCommunity() == null || resident.getCommunity() == null ||
                    !caller.getCommunity().getId().equals(resident.getCommunity().getId())) {
                return ResponseEntity.status(403).body("Access Denied.");
            }
        }

        resident.setActive(active);
        userRepository.save(resident);

        String action = active ? "RESIDENT_ACTIVATE" : "RESIDENT_DEACTIVATE";
        auditLogService.log(authentication.getName(), action, (active ? "Activated" : "Deactivated") + " resident: " + resident.getEmail());
        return ResponseEntity.ok("Resident " + (active ? "activated" : "deactivated") + " successfully.");
    }

    @PostMapping("/{id}/transfer")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<?> transferResident(
            @PathVariable Long id,
            @RequestParam(required = false) Long communityId,
            @RequestParam String flatNumber,
            @RequestParam(required = false) String building,
            @RequestParam(required = false) String block,
            @RequestParam(required = false) String floor,
            Authentication authentication
    ) {
        User caller = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("Logged in user not found"));

        User resident = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Resident not found"));

        if (caller.getRole() != Role.SUPER_ADMIN) {
            if (caller.getCommunity() == null || resident.getCommunity() == null ||
                    !caller.getCommunity().getId().equals(resident.getCommunity().getId())) {
                return ResponseEntity.status(403).body("Access Denied.");
            }
        }

        Community targetCommunity = resident.getCommunity();
        if (communityId != null && !communityId.equals(targetCommunity.getId())) {
            if (caller.getRole() != Role.SUPER_ADMIN) {
                return ResponseEntity.badRequest().body("Only Super Admin can transfer residents to another community.");
            }
            targetCommunity = communityRepository.findById(communityId)
                    .orElseThrow(() -> new RuntimeException("Target Community not found"));
        }

        // Validate occupancy in target unit
        final Community finalComm = targetCommunity;
        boolean occupied = userRepository.findAll().stream()
                .anyMatch(u -> u.getRole() == Role.RESIDENT
                        && u.getCommunity() != null && u.getCommunity().getId().equals(finalComm.getId())
                        && u.isActive()
                        && !u.getId().equals(resident.getId())
                        && u.getFlatNumber() != null
                        && u.getFlatNumber().equalsIgnoreCase(flatNumber.trim()));

        if (occupied) {
            return ResponseEntity.badRequest().body("Target Unit " + flatNumber + " is already occupied by another active resident.");
        }

        resident.setCommunity(targetCommunity);
        resident.setFlatNumber(flatNumber);
        if (building != null) resident.setBuilding(building);
        if (block != null) resident.setBlock(block);
        if (floor != null) resident.setFloor(floor);

        userRepository.save(resident);
        auditLogService.log(authentication.getName(), "RESIDENT_TRANSFER", "Transferred resident: " + resident.getEmail() + " to unit: " + flatNumber + " in community: " + targetCommunity.getName());
        return ResponseEntity.ok(mapToProfileResponse(resident));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<?> deleteOrArchiveResident(@PathVariable Long id, @RequestParam(defaultValue = "false") boolean archiveOnly, Authentication authentication) {
        User caller = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("Logged in user not found"));

        User resident = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Resident not found"));

        if (caller.getRole() != Role.SUPER_ADMIN) {
            if (caller.getCommunity() == null || resident.getCommunity() == null ||
                    !caller.getCommunity().getId().equals(resident.getCommunity().getId())) {
                return ResponseEntity.status(403).body("Access Denied.");
            }
        }

        if (archiveOnly) {
            resident.setActive(false);
            userRepository.save(resident);
            auditLogService.log(authentication.getName(), "RESIDENT_ARCHIVE", "Archived resident: " + resident.getEmail());
            return ResponseEntity.ok("Resident archived successfully (historical billing records preserved).");
        } else {
            userRepository.delete(resident);
            auditLogService.log(authentication.getName(), "RESIDENT_DELETE", "Permanently deleted resident: " + resident.getEmail());
            return ResponseEntity.ok("Resident deleted permanently from the database.");
        }
    }

    @PostMapping(value = "/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<?> importResidents(@RequestParam("file") MultipartFile file, Authentication authentication) {
        User caller = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("Logged in user not found"));

        Long defaultCommunityId = (caller.getCommunity() != null) ? caller.getCommunity().getId() : null;

        List<Map<String, Object>> errorLog = new ArrayList<>();
        int rowNum = 0;
        int importCount = 0;

        try (Reader reader = new InputStreamReader(file.getInputStream())) {
            CSVFormat csvFormat = CSVFormat.DEFAULT.builder()
                    .setHeader()
                    .setSkipHeaderRecord(true)
                    .setIgnoreHeaderCase(true)
                    .setTrim(true)
                    .build();

            Iterable<CSVRecord> records = csvFormat.parse(reader);
            for (CSVRecord record : records) {
                rowNum++;
                Map<String, Object> rowError = new HashMap<>();
                rowError.put("row", rowNum);

                String fullName = getRecordVal(record, "Full Name", "Name");
                String email = getRecordVal(record, "Email", "Email Address");
                String phone = getRecordVal(record, "Phone", "Phone Number");
                String flatNumber = getRecordVal(record, "Flat", "Flat Number", "Unit");
                String building = getRecordVal(record, "Building");
                String block = getRecordVal(record, "Block");
                String floor = getRecordVal(record, "Floor");
                String occupancyStr = getRecordVal(record, "Occupancy", "Occupancy Type");
                String meter = getRecordVal(record, "Meter", "Meter Number");
                String commIdStr = getRecordVal(record, "Community ID", "Community");

                if (fullName == null || fullName.isBlank()) {
                    rowError.put("error", "Full Name is required.");
                    errorLog.add(rowError);
                    continue;
                }

                if (email == null || email.isBlank()) {
                    rowError.put("error", "Email Address is required.");
                    errorLog.add(rowError);
                    continue;
                }

                if (!email.contains("@")) {
                    rowError.put("error", "Invalid Email Format: " + email);
                    errorLog.add(rowError);
                    continue;
                }

                if (userRepository.existsByEmail(email)) {
                    rowError.put("error", "Duplicate Email: " + email + " already exists.");
                    errorLog.add(rowError);
                    continue;
                }

                Long targetCommId = defaultCommunityId;
                if (commIdStr != null && !commIdStr.isBlank()) {
                    try {
                        targetCommId = Long.valueOf(commIdStr);
                    } catch (Exception e) {
                        rowError.put("error", "Invalid Community ID format: " + commIdStr);
                        errorLog.add(rowError);
                        continue;
                    }
                }

                if (targetCommId == null) {
                    rowError.put("error", "Community assignment is required.");
                    errorLog.add(rowError);
                    continue;
                }

                Optional<Community> communityOpt = communityRepository.findById(targetCommId);
                if (communityOpt.isEmpty()) {
                    rowError.put("error", "Community with ID " + targetCommId + " does not exist.");
                    errorLog.add(rowError);
                    continue;
                }

                // Check unit duplicate occupant
                final Long checkCommId = targetCommId;
                final String checkFlat = flatNumber;
                if (checkFlat != null && !checkFlat.isBlank()) {
                    boolean unitOccupied = userRepository.findAll().stream()
                            .anyMatch(u -> u.getRole() == Role.RESIDENT
                                    && u.getCommunity() != null && u.getCommunity().getId().equals(checkCommId)
                                    && u.isActive()
                                    && u.getFlatNumber() != null
                                    && u.getFlatNumber().equalsIgnoreCase(checkFlat.trim()));
                    
                    if (unitOccupied) {
                        rowError.put("error", "Duplicate occupany: Unit " + checkFlat + " is already occupied in community " + checkCommId);
                        errorLog.add(rowError);
                        continue;
                    }
                }

                User resident = User.builder()
                        .email(email)
                        .password(passwordEncoder.encode("HydroPass123!"))
                        .fullName(fullName)
                        .role(Role.RESIDENT)
                        .phoneNumber(phone)
                        .gender("MALE")
                        .address(building != null ? building : "")
                        .community(communityOpt.get())
                        .building(building)
                        .block(block)
                        .floor(floor)
                        .flatNumber(flatNumber)
                        .occupancyType(occupancyStr != null ? occupancyStr.toUpperCase() : "TENANT")
                        .meterNumber(meter)
                        .familySize(1)
                        .waterBalance(BigDecimal.ZERO)
                        .isActive(true)
                        .isEmailVerified(false)
                        .build();

                userRepository.save(resident);
                importCount++;
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("CSV import failed: " + e.getMessage());
        }

        Map<String, Object> result = new HashMap<>();
        result.put("successfulRows", importCount);
        result.put("errors", errorLog);
        auditLogService.log(authentication.getName(), "RESIDENTS_BULK_IMPORT", "Uploaded residents CSV. Successful: " + importCount + ", Errors: " + errorLog.size());
        return ResponseEntity.ok(result);
    }

    @GetMapping("/export")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    @Transactional(readOnly = true)
    public ResponseEntity<?> exportResidents(Authentication authentication) {
        User caller = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("Logged in user not found"));

        Long targetCommunityId = (caller.getCommunity() != null) ? caller.getCommunity().getId() : null;

        List<User> list = userRepository.findAll().stream()
                .filter(u -> u.getRole() == Role.RESIDENT)
                .filter(u -> targetCommunityId == null || (u.getCommunity() != null && u.getCommunity().getId().equals(targetCommunityId)))
                .toList();

        String[] headers = {"Resident ID", "Full Name", "Email", "Phone", "Community", "Building", "Block", "Floor", "Flat Number", "Occupancy Type", "Meter Number", "Status"};

        try (StringWriter sw = new StringWriter();
             CSVPrinter csvPrinter = new CSVPrinter(sw, CSVFormat.DEFAULT.builder().setHeader(headers).build())) {

            for (User u : list) {
                csvPrinter.printRecord(
                        u.getId(),
                        u.getFullName(),
                        u.getEmail(),
                        u.getPhoneNumber() != null ? u.getPhoneNumber() : "",
                        u.getCommunity() != null ? u.getCommunity().getName() : "N/A",
                        u.getBuilding() != null ? u.getBuilding() : "",
                        u.getBlock() != null ? u.getBlock() : "",
                        u.getFloor() != null ? u.getFloor() : "",
                        u.getFlatNumber() != null ? u.getFlatNumber() : "",
                        u.getOccupancyType() != null ? u.getOccupancyType() : "",
                        u.getMeterNumber() != null ? u.getMeterNumber() : "",
                        u.isActive() ? "ACTIVE" : "INACTIVE"
                );
            }
            csvPrinter.flush();
            byte[] csvBytes = sw.toString().getBytes();

            HttpHeaders responseHeaders = new HttpHeaders();
            responseHeaders.setContentType(MediaType.parseMediaType("text/csv"));
            responseHeaders.setContentDispositionFormData("attachment", "residents-export.csv");
            responseHeaders.setContentLength(csvBytes.length);

            return new ResponseEntity<>(csvBytes, responseHeaders, org.springframework.http.HttpStatus.OK);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error exporting CSV: " + e.getMessage());
        }
    }

    private String getRecordVal(CSVRecord record, String... headers) {
        for (String h : headers) {
            if (record.isSet(h)) {
                return record.get(h);
            }
        }
        return null;
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
                .flatArea(u.getFlatArea())
                .meterNumber(u.getMeterNumber())
                .waterBalance(u.getWaterBalance())
                .isActive(u.isActive())
                .lastLoginAt(u.getLastLoginAt())
                .build();
    }
}
