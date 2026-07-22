package com.wumbap.wumbap.controller;

import com.wumbap.wumbap.entity.*;
import com.wumbap.wumbap.repository.*;
import com.wumbap.wumbap.service.AuditLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/super-admin")
@PreAuthorize("hasRole('SUPER_ADMIN')")
@RequiredArgsConstructor
public class SuperAdminController {

    private final UserRepository userRepository;
    private final CommunityRepository communityRepository;
    private final WaterBillRepository waterBillRepository;
    private final MeterReadingRepository meterReadingRepository;
    private final CommunityJoinRequestRepository joinRequestRepository;
    private final UploadJobRepository uploadJobRepository;
    private final MeterImportErrorRepository importErrorRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditLogService auditLogService;

    // --- Communities CRUD ---

    @PostMapping("/communities")
    public ResponseEntity<?> createCommunity(@RequestBody Map<String, Object> req, Authentication auth) {
        String name = (String) req.get("name");
        if (name == null || name.trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Community name is required");
        }

        if (communityRepository.findAll().stream().anyMatch(c -> c.getName().equalsIgnoreCase(name.trim()))) {
            return ResponseEntity.badRequest().body("Community name already exists");
        }

        BigDecimal tariffRate = req.get("tariffRate") != null ? new BigDecimal(req.get("tariffRate").toString()) : new BigDecimal("5.00");
        BigDecimal taxRate = req.get("taxRate") != null ? new BigDecimal(req.get("taxRate").toString()) : new BigDecimal("18.00");
        BigDecimal lateFeeRate = req.get("lateFeeRate") != null ? new BigDecimal(req.get("lateFeeRate").toString()) : new BigDecimal("50.00");
        BigDecimal discountRate = req.get("discountRate") != null ? new BigDecimal(req.get("discountRate").toString()) : new BigDecimal("0.00");

        String code = (String) req.get("code");
        if (code != null && !code.trim().isEmpty()) {
            if (communityRepository.findAll().stream().anyMatch(c -> c.getCode() != null && c.getCode().equalsIgnoreCase(code.trim()))) {
                return ResponseEntity.badRequest().body("Community code already exists");
            }
        }

        User primaryAdmin = null;
        if (req.get("primaryAdminId") != null && !req.get("primaryAdminId").toString().isEmpty()) {
            Long adminId = Long.valueOf(req.get("primaryAdminId").toString());
            primaryAdmin = userRepository.findById(adminId)
                    .orElseThrow(() -> new RuntimeException("Primary admin user not found"));
            if (primaryAdmin.getRole() != Role.ADMIN) {
                return ResponseEntity.badRequest().body("Primary admin must have ADMIN role");
            }
        }

        Community c = Community.builder()
                .name(name.trim())
                .code(code != null && !code.trim().isEmpty() ? code.trim() : null)
                .primaryAdmin(primaryAdmin)
                .address((String) req.get("address"))
                .city((String) req.get("city"))
                .state((String) req.get("state"))
                .country((String) req.get("country"))
                .postalCode((String) req.get("postalCode"))
                .latitude(req.get("latitude") != null ? Double.valueOf(req.get("latitude").toString()) : null)
                .longitude(req.get("longitude") != null ? Double.valueOf(req.get("longitude").toString()) : null)
                .buildingsCount(req.get("buildingsCount") != null ? Integer.valueOf(req.get("buildingsCount").toString()) : 1)
                .blocksCount(req.get("blocksCount") != null ? Integer.valueOf(req.get("blocksCount").toString()) : 1)
                .totalFlats(req.get("totalFlats") != null ? Integer.valueOf(req.get("totalFlats").toString()) : 0)
                .status(req.get("status") != null ? (String) req.get("status") : "ACTIVE")
                .logoUrl((String) req.get("logoUrl"))
                .description((String) req.get("description"))
                .currency(req.get("currency") != null ? (String) req.get("currency") : "INR")
                .waterUnit(req.get("waterUnit") != null ? (String) req.get("waterUnit") : "L")
                .billingCycle(req.get("billingCycle") != null ? (String) req.get("billingCycle") : "MONTHLY")
                .tariffRate(tariffRate)
                .taxRate(taxRate)
                .lateFeeRate(lateFeeRate)
                .discountRate(discountRate)
                .build();
        c = communityRepository.save(c);

        if (primaryAdmin != null) {
            primaryAdmin.setCommunity(c);
            userRepository.save(primaryAdmin);
        }
        auditLogService.log(auth.getName(), "SUPER_ADMIN_COMMUNITY_CREATE", "Created community: " + c.getName() + " (#" + c.getId() + ")");

        return ResponseEntity.ok(c);
    }

    @PutMapping("/communities/{id}")
    public ResponseEntity<?> updateCommunity(@PathVariable Long id, @RequestBody Map<String, Object> req, Authentication auth) {
        Community c = communityRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Community not found"));

        String name = (String) req.get("name");
        if (name != null && !name.trim().isEmpty()) {
            if (communityRepository.findAll().stream().anyMatch(other -> !other.getId().equals(id) && other.getName().equalsIgnoreCase(name.trim()))) {
                return ResponseEntity.badRequest().body("Community name already exists");
            }
            c.setName(name.trim());
        }

        String code = (String) req.get("code");
        if (code != null && !code.trim().isEmpty()) {
            if (communityRepository.findAll().stream().anyMatch(other -> !other.getId().equals(id) && other.getCode() != null && other.getCode().equalsIgnoreCase(code.trim()))) {
                return ResponseEntity.badRequest().body("Community code already exists");
            }
            c.setCode(code.trim());
        }

        if (req.containsKey("primaryAdminId")) {
            if (req.get("primaryAdminId") == null || req.get("primaryAdminId").toString().isEmpty()) {
                c.setPrimaryAdmin(null);
            } else {
                Long adminId = Long.valueOf(req.get("primaryAdminId").toString());
                User admin = userRepository.findById(adminId)
                        .orElseThrow(() -> new RuntimeException("Primary admin user not found"));
                if (admin.getRole() != Role.ADMIN) {
                    return ResponseEntity.badRequest().body("Primary admin must have ADMIN role");
                }
                admin.setCommunity(c);
                userRepository.save(admin);
                c.setPrimaryAdmin(admin);
            }
        }

        if (req.containsKey("address")) c.setAddress((String) req.get("address"));
        if (req.containsKey("city")) c.setCity((String) req.get("city"));
        if (req.containsKey("state")) c.setState((String) req.get("state"));
        if (req.containsKey("country")) c.setCountry((String) req.get("country"));
        if (req.containsKey("postalCode")) c.setPostalCode((String) req.get("postalCode"));
        if (req.containsKey("latitude")) c.setLatitude(req.get("latitude") != null ? Double.valueOf(req.get("latitude").toString()) : null);
        if (req.containsKey("longitude")) c.setLongitude(req.get("longitude") != null ? Double.valueOf(req.get("longitude").toString()) : null);
        if (req.containsKey("buildingsCount")) c.setBuildingsCount(req.get("buildingsCount") != null ? Integer.valueOf(req.get("buildingsCount").toString()) : 1);
        if (req.containsKey("blocksCount")) c.setBlocksCount(req.get("blocksCount") != null ? Integer.valueOf(req.get("blocksCount").toString()) : 1);
        if (req.containsKey("totalFlats")) c.setTotalFlats(req.get("totalFlats") != null ? Integer.valueOf(req.get("totalFlats").toString()) : 0);
        if (req.containsKey("status")) c.setStatus(req.get("status") != null ? (String) req.get("status") : "ACTIVE");
        if (req.containsKey("logoUrl")) c.setLogoUrl((String) req.get("logoUrl"));
        if (req.containsKey("description")) c.setDescription((String) req.get("description"));
        if (req.containsKey("currency")) c.setCurrency(req.get("currency") != null ? (String) req.get("currency") : "INR");
        if (req.containsKey("waterUnit")) c.setWaterUnit(req.get("waterUnit") != null ? (String) req.get("waterUnit") : "L");
        if (req.containsKey("billingCycle")) c.setBillingCycle(req.get("billingCycle") != null ? (String) req.get("billingCycle") : "MONTHLY");

        if (req.get("tariffRate") != null) c.setTariffRate(new BigDecimal(req.get("tariffRate").toString()));
        if (req.get("taxRate") != null) c.setTaxRate(new BigDecimal(req.get("taxRate").toString()));
        if (req.get("lateFeeRate") != null) c.setLateFeeRate(new BigDecimal(req.get("lateFeeRate").toString()));
        if (req.get("discountRate") != null) c.setDiscountRate(new BigDecimal(req.get("discountRate").toString()));

        c = communityRepository.save(c);
        auditLogService.log(auth.getName(), "SUPER_ADMIN_COMMUNITY_UPDATE", "Updated community: " + c.getName() + " (#" + c.getId() + ")");
        return ResponseEntity.ok(c);
    }

    @DeleteMapping("/communities/{id}")
    @Transactional
    public ResponseEntity<?> deleteCommunity(@PathVariable Long id, Authentication auth) {
        Community c = communityRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Community not found"));

        // Delete all bills
        List<WaterBill> bills = waterBillRepository.findByCommunityId(id);
        waterBillRepository.deleteAll(bills);

        // Delete all readings
        List<MeterReading> readings = meterReadingRepository.findByCommunityId(id);
        meterReadingRepository.deleteAll(readings);

        // Delete join requests
        List<CommunityJoinRequest> requests = joinRequestRepository.findAll().stream()
                .filter(r -> r.getCommunity() != null && r.getCommunity().getId().equals(id))
                .toList();
        joinRequestRepository.deleteAll(requests);

        // Delete upload jobs and errors
        List<UploadJob> jobs = uploadJobRepository.findByCommunityIdOrderByUploadStartedAtDesc(id);
        for (UploadJob job : jobs) {
            importErrorRepository.deleteAll(importErrorRepository.findAll().stream()
                    .filter(e -> e.getUploadJob().getId().equals(job.getId())).toList());
        }
        uploadJobRepository.deleteAll(jobs);

        // Disassociate users
        List<User> users = userRepository.findAll().stream()
                .filter(u -> u.getCommunity() != null && u.getCommunity().getId().equals(id))
                .toList();
        for (User u : users) {
            u.setCommunity(null);
            u.setFlatNumber(null);
            userRepository.save(u);
        }

        communityRepository.delete(c);
        auditLogService.log(auth.getName(), "SUPER_ADMIN_COMMUNITY_DELETE", "Deleted community: " + c.getName() + " (#" + c.getId() + ")");
        return ResponseEntity.ok("Community deleted successfully");
    }

    // --- Users CRUD ---

    @GetMapping("/users")
    public ResponseEntity<?> getAllUsers() {
        return ResponseEntity.ok(userRepository.findAll());
    }

    @PostMapping("/users")
    public ResponseEntity<?> createUser(@RequestBody Map<String, Object> req, Authentication auth) {
        String email = (String) req.get("email");
        String password = (String) req.get("password");
        String fullName = (String) req.get("fullName");
        String roleStr = (String) req.get("role");

        if (email == null || email.trim().isEmpty() || password == null || password.trim().isEmpty() || fullName == null || fullName.trim().isEmpty() || roleStr == null) {
            return ResponseEntity.badRequest().body("All fields (email, password, fullName, role) are required");
        }

        if (userRepository.existsByEmail(email.trim())) {
            return ResponseEntity.badRequest().body("User email already exists");
        }

        Role role = Role.valueOf(roleStr.toUpperCase());
        Community comm = null;
        String flatNumber = null;

        if (role == Role.ADMIN || role == Role.RESIDENT) {
            if (req.get("communityId") != null) {
                Long commId = Long.valueOf(req.get("communityId").toString());
                comm = communityRepository.findById(commId).orElse(null);
            }
            if (role == Role.RESIDENT) {
                flatNumber = (String) req.get("flatNumber");
            }
        }

        User user = User.builder()
                .email(email.trim())
                .password(passwordEncoder.encode(password))
                .fullName(fullName.trim())
                .role(role)
                .community(comm)
                .flatNumber(flatNumber)
                .isActive(true)
                .isEmailVerified(true) // Pre-verify when super admin creates
                .build();

        user = userRepository.save(user);
        auditLogService.log(auth.getName(), "SUPER_ADMIN_USER_CREATE", "Created user account: " + user.getEmail() + " with role " + user.getRole());
        return ResponseEntity.ok(user);
    }

    @PutMapping("/users/{id}")
    public ResponseEntity<?> updateUser(@PathVariable Long id, @RequestBody Map<String, Object> req, Authentication auth) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        String email = (String) req.get("email");
        if (email != null && !email.trim().isEmpty()) {
            if (userRepository.findAll().stream().anyMatch(other -> !other.getId().equals(id) && other.getEmail().equalsIgnoreCase(email.trim()))) {
                return ResponseEntity.badRequest().body("User email already exists");
            }
            user.setEmail(email.trim());
        }

        String password = (String) req.get("password");
        if (password != null && !password.trim().isEmpty()) {
            user.setPassword(passwordEncoder.encode(password));
        }

        String fullName = (String) req.get("fullName");
        if (fullName != null && !fullName.trim().isEmpty()) {
            user.setFullName(fullName.trim());
        }

        String roleStr = (String) req.get("role");
        if (roleStr != null) {
            user.setRole(Role.valueOf(roleStr.toUpperCase()));
        }

        if (req.containsKey("communityId")) {
            if (req.get("communityId") == null) {
                user.setCommunity(null);
            } else {
                Long commId = Long.valueOf(req.get("communityId").toString());
                Community comm = communityRepository.findById(commId).orElse(null);
                user.setCommunity(comm);
            }
        }

        if (req.containsKey("flatNumber")) {
            user.setFlatNumber((String) req.get("flatNumber"));
        }

        user = userRepository.save(user);
        auditLogService.log(auth.getName(), "SUPER_ADMIN_USER_UPDATE", "Updated user account: " + user.getEmail() + " (#" + user.getId() + ")");
        return ResponseEntity.ok(user);
    }

    @PostMapping("/users/{id}/toggle-active")
    public ResponseEntity<?> toggleUserActive(@PathVariable Long id, Authentication auth) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setActive(!user.isActive());
        user = userRepository.save(user);
        auditLogService.log(auth.getName(), "SUPER_ADMIN_USER_TOGGLE", "Toggled active status for user: " + user.getEmail() + " -> " + (user.isActive() ? "ACTIVE" : "DISABLED"));
        return ResponseEntity.ok(user);
    }

    @DeleteMapping("/users/{id}")
    @Transactional
    public ResponseEntity<?> deleteUser(@PathVariable Long id, Authentication auth) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Delete related records
        List<WaterBill> bills = waterBillRepository.findByResidentId(id);
        waterBillRepository.deleteAll(bills);

        List<MeterReading> readings = meterReadingRepository.findByResidentIdOrderByReadingDateDesc(id);
        meterReadingRepository.deleteAll(readings);

        List<CommunityJoinRequest> requests = joinRequestRepository.findByUserId(id);
        joinRequestRepository.deleteAll(requests);

        List<UploadJob> jobs = uploadJobRepository.findAll().stream()
                .filter(j -> j.getUploadedBy().getId().equals(id))
                .toList();
        for (UploadJob job : jobs) {
            importErrorRepository.deleteAll(importErrorRepository.findAll().stream()
                    .filter(e -> e.getUploadJob().getId().equals(job.getId())).toList());
        }
        uploadJobRepository.deleteAll(jobs);

        userRepository.delete(user);
        auditLogService.log(auth.getName(), "SUPER_ADMIN_USER_DELETE", "Deleted user account: " + user.getEmail() + " (#" + user.getId() + ")");
        return ResponseEntity.ok("User deleted successfully");
    }
}
