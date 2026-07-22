package com.wumbap.wumbap.controller;

import com.wumbap.wumbap.dto.MeterRequest;
import com.wumbap.wumbap.dto.MeterResponse;
import com.wumbap.wumbap.entity.Community;
import com.wumbap.wumbap.entity.Meter;
import com.wumbap.wumbap.entity.Role;
import com.wumbap.wumbap.entity.User;
import com.wumbap.wumbap.repository.CommunityRepository;
import com.wumbap.wumbap.repository.MeterRepository;
import com.wumbap.wumbap.repository.UserRepository;
import com.wumbap.wumbap.service.AuditLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/meters")
@RequiredArgsConstructor
public class MeterController {

    private final MeterRepository meterRepository;
    private final CommunityRepository communityRepository;
    private final UserRepository userRepository;
    private final AuditLogService auditLogService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN', 'RESIDENT')")
    public ResponseEntity<?> getMeters(
            @RequestParam(value = "communityId", required = false) Long communityId,
            @RequestParam(value = "status", required = false) String status,
            Authentication auth
    ) {
        User caller = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("Caller not found"));

        Long targetCommunityId = communityId;
        if (caller.getRole() == Role.ADMIN) {
            if (caller.getCommunity() == null) {
                return ResponseEntity.badRequest().body("Admin must be assigned to a community.");
            }
            targetCommunityId = caller.getCommunity().getId();
        }

        List<Meter> meters;
        if (targetCommunityId != null) {
            meters = meterRepository.findByCommunityId(targetCommunityId);
        } else {
            meters = meterRepository.findAll();
        }

        if (status != null && !status.equalsIgnoreCase("ALL")) {
            meters = meters.stream()
                    .filter(m -> m.getStatus().equalsIgnoreCase(status))
                    .toList();
        }

        List<MeterResponse> responses = meters.stream()
                .map(this::mapToResponse)
                .toList();

        return ResponseEntity.ok(responses);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<?> getMeterById(@PathVariable Long id, Authentication auth) {
        User caller = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("Caller not found"));

        Meter meter = meterRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Meter not found"));

        if (caller.getRole() == Role.ADMIN) {
            if (caller.getCommunity() == null || !caller.getCommunity().getId().equals(meter.getCommunity().getId())) {
                return ResponseEntity.status(403).body("Access Denied: Meter belongs to another community.");
            }
        }

        return ResponseEntity.ok(mapToResponse(meter));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<?> createMeter(@RequestBody MeterRequest req, Authentication auth) {
        User caller = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("Caller not found"));

        Long targetCommunityId = req.getCommunityId();
        if (caller.getRole() == Role.ADMIN) {
            if (caller.getCommunity() == null) {
                return ResponseEntity.badRequest().body("Admin not assigned to a community.");
            }
            targetCommunityId = caller.getCommunity().getId();
        }

        if (targetCommunityId == null) {
            return ResponseEntity.badRequest().body("Community ID is required.");
        }

        if (req.getMeterNumber() == null || req.getMeterNumber().trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Meter number is required.");
        }

        if (meterRepository.findByMeterNumber(req.getMeterNumber()).isPresent()) {
            return ResponseEntity.badRequest().body("Meter number already registered.");
        }

        Community community = communityRepository.findById(targetCommunityId)
                .orElseThrow(() -> new RuntimeException("Community not found"));

        User resident = null;
        if (req.getResidentId() != null) {
            resident = userRepository.findById(req.getResidentId())
                    .orElseThrow(() -> new RuntimeException("Resident not found"));
        }

        Meter meter = Meter.builder()
                .meterNumber(req.getMeterNumber().trim())
                .qrCode(req.getQrCode())
                .barcode(req.getBarcode())
                .status(req.getStatus() != null ? req.getStatus() : "ACTIVE")
                .meterType(req.getMeterType() != null ? req.getMeterType() : "MECHANICAL")
                .installationDate(req.getInstallationDate())
                .calibrationDate(req.getCalibrationDate())
                .lastServiceDate(req.getLastServiceDate())
                .nextServiceDate(req.getNextServiceDate())
                .community(community)
                .resident(resident)
                .build();

        meterRepository.save(meter);

        // Sync with User entity meterNumber field for compatibility
        if (resident != null) {
            resident.setMeterNumber(meter.getMeterNumber());
            userRepository.save(resident);
        }

        auditLogService.log(caller.getEmail(), "METER_CREATE", "Registered water meter: " + meter.getMeterNumber());
        return ResponseEntity.ok(mapToResponse(meter));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<?> updateMeter(@PathVariable Long id, @RequestBody MeterRequest req, Authentication auth) {
        User caller = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("Caller not found"));

        Meter meter = meterRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Meter not found"));

        if (caller.getRole() == Role.ADMIN) {
            if (caller.getCommunity() == null || !caller.getCommunity().getId().equals(meter.getCommunity().getId())) {
                return ResponseEntity.status(403).body("Access Denied.");
            }
        }

        if (req.getMeterNumber() != null && !req.getMeterNumber().trim().isEmpty() && !req.getMeterNumber().equalsIgnoreCase(meter.getMeterNumber())) {
            Optional<Meter> duplicate = meterRepository.findByMeterNumber(req.getMeterNumber().trim());
            if (duplicate.isPresent() && !duplicate.get().getId().equals(id)) {
                return ResponseEntity.badRequest().body("Meter number already registered to another meter.");
            }
            meter.setMeterNumber(req.getMeterNumber().trim());
        }

        if (req.getQrCode() != null) meter.setQrCode(req.getQrCode());
        if (req.getBarcode() != null) meter.setBarcode(req.getBarcode());
        if (req.getStatus() != null) meter.setStatus(req.getStatus());
        if (req.getMeterType() != null) meter.setMeterType(req.getMeterType());
        if (req.getInstallationDate() != null) meter.setInstallationDate(req.getInstallationDate());
        if (req.getCalibrationDate() != null) meter.setCalibrationDate(req.getCalibrationDate());
        if (req.getLastServiceDate() != null) meter.setLastServiceDate(req.getLastServiceDate());
        if (req.getNextServiceDate() != null) meter.setNextServiceDate(req.getNextServiceDate());

        if (req.getResidentId() != null) {
            User resident = userRepository.findById(req.getResidentId())
                    .orElseThrow(() -> new RuntimeException("Resident not found"));
            meter.setResident(resident);
            
            // Sync user's meterNumber property
            resident.setMeterNumber(meter.getMeterNumber());
            userRepository.save(resident);
        } else if (req.getResidentId() == null && meter.getResident() != null) {
            User oldResident = meter.getResident();
            oldResident.setMeterNumber(null);
            userRepository.save(oldResident);
            meter.setResident(null);
        }

        meterRepository.save(meter);
        auditLogService.log(caller.getEmail(), "METER_UPDATE", "Updated water meter details: " + meter.getMeterNumber());
        return ResponseEntity.ok(mapToResponse(meter));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<?> deleteMeter(@PathVariable Long id, Authentication auth) {
        User caller = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("Caller not found"));

        Meter meter = meterRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Meter not found"));

        if (caller.getRole() == Role.ADMIN) {
            if (caller.getCommunity() == null || !caller.getCommunity().getId().equals(meter.getCommunity().getId())) {
                return ResponseEntity.status(403).body("Access Denied.");
            }
        }

        if (meter.getResident() != null) {
            User resident = meter.getResident();
            resident.setMeterNumber(null);
            userRepository.save(resident);
        }

        meterRepository.delete(meter);
        auditLogService.log(caller.getEmail(), "METER_DELETE", "Deleted water meter: " + meter.getMeterNumber());
        return ResponseEntity.ok("Meter deleted successfully.");
    }

    @PostMapping("/{id}/assign")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<?> assignMeter(
            @PathVariable Long id,
            @RequestParam(value = "residentId", required = false) Long residentId,
            Authentication auth
    ) {
        User caller = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("Caller not found"));

        Meter meter = meterRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Meter not found"));

        if (caller.getRole() == Role.ADMIN) {
            if (caller.getCommunity() == null || !caller.getCommunity().getId().equals(meter.getCommunity().getId())) {
                return ResponseEntity.status(403).body("Access Denied.");
            }
        }

        if (residentId != null) {
            User resident = userRepository.findById(residentId)
                    .orElseThrow(() -> new RuntimeException("Resident not found"));

            // If resident already has an assigned active meter, unassign it first
            Optional<Meter> activeMeter = meterRepository.findByResidentIdAndStatus(residentId, "ACTIVE");
            if (activeMeter.isPresent() && !activeMeter.get().getId().equals(id)) {
                Meter oldMeter = activeMeter.get();
                oldMeter.setResident(null);
                meterRepository.save(oldMeter);
            }

            meter.setResident(resident);
            meter.setStatus("ACTIVE");
            meterRepository.save(meter);

            resident.setMeterNumber(meter.getMeterNumber());
            userRepository.save(resident);

            auditLogService.log(caller.getEmail(), "METER_ASSIGN", "Assigned meter " + meter.getMeterNumber() + " to resident: " + resident.getFullName());
        } else {
            if (meter.getResident() != null) {
                User oldResident = meter.getResident();
                oldResident.setMeterNumber(null);
                userRepository.save(oldResident);
                
                meter.setResident(null);
                meterRepository.save(meter);
                auditLogService.log(caller.getEmail(), "METER_UNASSIGN", "Unassigned meter: " + meter.getMeterNumber());
            }
        }

        return ResponseEntity.ok(mapToResponse(meter));
    }

    @PostMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<?> toggleMeterStatus(
            @PathVariable Long id,
            @RequestParam("status") String status,
            Authentication auth
    ) {
        User caller = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("Caller not found"));

        Meter meter = meterRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Meter not found"));

        if (caller.getRole() == Role.ADMIN) {
            if (caller.getCommunity() == null || !caller.getCommunity().getId().equals(meter.getCommunity().getId())) {
                return ResponseEntity.status(403).body("Access Denied.");
            }
        }

        meter.setStatus(status.toUpperCase());
        meterRepository.save(meter);

        auditLogService.log(caller.getEmail(), "METER_STATUS", "Toggled meter " + meter.getMeterNumber() + " status to: " + status.toUpperCase());
        return ResponseEntity.ok(mapToResponse(meter));
    }

    @PostMapping("/{id}/replace")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<?> replaceMeter(
            @PathVariable Long id,
            @RequestParam("newMeterNumber") String newMeterNumber,
            Authentication auth
    ) {
        User caller = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("Caller not found"));

        Meter oldMeter = meterRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Old meter not found"));

        if (caller.getRole() == Role.ADMIN) {
            if (caller.getCommunity() == null || !caller.getCommunity().getId().equals(oldMeter.getCommunity().getId())) {
                return ResponseEntity.status(403).body("Access Denied.");
            }
        }

        User resident = oldMeter.getResident();
        if (resident == null) {
            return ResponseEntity.badRequest().body("Old meter is not currently assigned to any resident.");
        }

        if (meterRepository.findByMeterNumber(newMeterNumber).isPresent()) {
            return ResponseEntity.badRequest().body("New meter number is already registered.");
        }

        // 1. Decommission old meter
        oldMeter.setStatus("DECOMMISSIONED");
        oldMeter.setResident(null);
        meterRepository.save(oldMeter);

        // 2. Create and assign new meter
        Meter newMeter = Meter.builder()
                .meterNumber(newMeterNumber.trim())
                .status("ACTIVE")
                .meterType(oldMeter.getMeterType())
                .installationDate(java.time.LocalDate.now())
                .calibrationDate(java.time.LocalDate.now())
                .community(oldMeter.getCommunity())
                .resident(resident)
                .build();
        meterRepository.save(newMeter);

        // 3. Sync resident with new meter number
        resident.setMeterNumber(newMeter.getMeterNumber());
        userRepository.save(resident);

        auditLogService.log(caller.getEmail(), "METER_REPLACE", "Replaced old meter " + oldMeter.getMeterNumber() + " with " + newMeter.getMeterNumber() + " for resident " + resident.getFullName());
        return ResponseEntity.ok(mapToResponse(newMeter));
    }

    private MeterResponse mapToResponse(Meter m) {
        return MeterResponse.builder()
                .id(m.getId())
                .meterNumber(m.getMeterNumber())
                .qrCode(m.getQrCode())
                .barcode(m.getBarcode())
                .status(m.getStatus())
                .meterType(m.getMeterType())
                .installationDate(m.getInstallationDate())
                .calibrationDate(m.getCalibrationDate())
                .lastServiceDate(m.getLastServiceDate())
                .nextServiceDate(m.getNextServiceDate())
                .communityId(m.getCommunity().getId())
                .communityName(m.getCommunity().getName())
                .residentId(m.getResident() != null ? m.getResident().getId() : null)
                .residentName(m.getResident() != null ? m.getResident().getFullName() : null)
                .flatNumber(m.getResident() != null ? m.getResident().getFlatNumber() : null)
                .createdAt(m.getCreatedAt())
                .updatedAt(m.getUpdatedAt())
                .build();
    }
}
