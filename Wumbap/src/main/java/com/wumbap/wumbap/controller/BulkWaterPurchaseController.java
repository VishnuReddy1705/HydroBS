package com.wumbap.wumbap.controller;

import com.wumbap.wumbap.dto.BulkWaterPurchaseDto;
import com.wumbap.wumbap.entity.*;
import com.wumbap.wumbap.repository.BillingCycleRepository;
import com.wumbap.wumbap.repository.BulkWaterPurchaseRepository;
import com.wumbap.wumbap.repository.CommunityRepository;
import com.wumbap.wumbap.repository.UserRepository;
import com.wumbap.wumbap.service.AuditLogService;
import lombok.RequiredArgsConstructor;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVPrinter;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import jakarta.persistence.criteria.Predicate;
import java.io.StringWriter;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/bulk-purchases")
@RequiredArgsConstructor
public class BulkWaterPurchaseController {

    private final BulkWaterPurchaseRepository bulkWaterPurchaseRepository;
    private final CommunityRepository communityRepository;
    private final BillingCycleRepository billingCycleRepository;
    private final UserRepository userRepository;
    private final AuditLogService auditLogService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<?> getPurchases(
            @RequestParam(required = false) Long communityId,
            @RequestParam(required = false) Long billingCycleId,
            @RequestParam(required = false) String supplier,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "purchaseDate") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            Authentication authentication
    ) {
        User caller = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("Caller not found"));

        Long commId = communityId;
        if (caller.getRole() == Role.ADMIN) {
            commId = caller.getCommunity().getId();
        }

        Sort sort = Sort.by(Sort.Direction.fromString(sortDir), sortBy);
        Pageable pageable = PageRequest.of(page, size, sort);

        final Long targetCommId = commId;
        Specification<BulkWaterPurchase> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (targetCommId != null) {
                predicates.add(cb.equal(root.get("community").get("id"), targetCommId));
            }
            if (billingCycleId != null) {
                predicates.add(cb.equal(root.get("billingCycle").get("id"), billingCycleId));
            }
            if (supplier != null && !supplier.trim().isEmpty()) {
                predicates.add(cb.like(cb.lower(root.get("supplier")), "%" + supplier.toLowerCase() + "%"));
            }
            if (search != null && !search.trim().isEmpty()) {
                Predicate supLike = cb.like(cb.lower(root.get("supplier")), "%" + search.toLowerCase() + "%");
                Predicate refLike = cb.like(cb.lower(root.get("invoiceReference")), "%" + search.toLowerCase() + "%");
                Predicate remLike = cb.like(cb.lower(root.get("remarks")), "%" + search.toLowerCase() + "%");
                predicates.add(cb.or(supLike, refLike, remLike));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<BulkWaterPurchase> resultPage = bulkWaterPurchaseRepository.findAll(spec, pageable);
        List<BulkWaterPurchaseDto> dtos = resultPage.getContent().stream().map(this::mapToDto).collect(Collectors.toList());

        return ResponseEntity.ok(new PageResponse<>(dtos, resultPage));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<?> createPurchase(@RequestBody BulkWaterPurchaseDto dto, Authentication authentication) {
        User caller = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("Caller not found"));

        Long commId = dto.getCommunityId();
        if (caller.getRole() == Role.ADMIN) {
            commId = caller.getCommunity().getId();
        }

        if (commId == null) {
            return ResponseEntity.badRequest().body("Community ID is required");
        }

        Community community = communityRepository.findById(commId)
                .orElseThrow(() -> new RuntimeException("Community not found"));

        BillingCycle cycle = null;
        if (dto.getBillingCycleId() != null) {
            cycle = billingCycleRepository.findById(dto.getBillingCycleId())
                    .orElseThrow(() -> new RuntimeException("Billing cycle not found"));
        }

        BigDecimal total = dto.getTotalCost();
        if (total == null && dto.getVolumeLitres() != null && dto.getUnitCost() != null) {
            total = dto.getVolumeLitres().multiply(dto.getUnitCost());
        }

        BulkWaterPurchase purchase = BulkWaterPurchase.builder()
                .community(community)
                .supplier(dto.getSupplier())
                .purchaseDate(dto.getPurchaseDate())
                .volumeLitres(dto.getVolumeLitres())
                .unitCost(dto.getUnitCost())
                .totalCost(total)
                .invoiceReference(dto.getInvoiceReference())
                .billingCycle(cycle)
                .remarks(dto.getRemarks())
                .build();

        bulkWaterPurchaseRepository.save(purchase);
        auditLogService.log(caller.getEmail(), "BULK_WATER_PURCHASE_CREATE", "Logged purchase: " + purchase.getInvoiceReference() + " for " + total);

        return ResponseEntity.ok(mapToDto(purchase));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<?> updatePurchase(@PathVariable Long id, @RequestBody BulkWaterPurchaseDto dto, Authentication authentication) {
        User caller = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("Caller not found"));

        BulkWaterPurchase purchase = bulkWaterPurchaseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Purchase log not found"));

        if (caller.getRole() == Role.ADMIN && !purchase.getCommunity().getId().equals(caller.getCommunity().getId())) {
            return ResponseEntity.status(403).body("Access denied");
        }

        BillingCycle cycle = null;
        if (dto.getBillingCycleId() != null) {
            cycle = billingCycleRepository.findById(dto.getBillingCycleId())
                    .orElseThrow(() -> new RuntimeException("Billing cycle not found"));
        }

        BigDecimal total = dto.getTotalCost();
        if (total == null && dto.getVolumeLitres() != null && dto.getUnitCost() != null) {
            total = dto.getVolumeLitres().multiply(dto.getUnitCost());
        }

        purchase.setSupplier(dto.getSupplier());
        purchase.setPurchaseDate(dto.getPurchaseDate());
        purchase.setVolumeLitres(dto.getVolumeLitres());
        purchase.setUnitCost(dto.getUnitCost());
        purchase.setTotalCost(total);
        purchase.setInvoiceReference(dto.getInvoiceReference());
        purchase.setBillingCycle(cycle);
        purchase.setRemarks(dto.getRemarks());

        bulkWaterPurchaseRepository.save(purchase);
        auditLogService.log(caller.getEmail(), "BULK_WATER_PURCHASE_UPDATE", "Updated purchase log: " + purchase.getId());

        return ResponseEntity.ok(mapToDto(purchase));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<?> deletePurchase(@PathVariable Long id, Authentication authentication) {
        User caller = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("Caller not found"));

        BulkWaterPurchase purchase = bulkWaterPurchaseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Purchase log not found"));

        if (caller.getRole() == Role.ADMIN && !purchase.getCommunity().getId().equals(caller.getCommunity().getId())) {
            return ResponseEntity.status(403).body("Access denied");
        }

        bulkWaterPurchaseRepository.delete(purchase);
        auditLogService.log(caller.getEmail(), "BULK_WATER_PURCHASE_DELETE", "Deleted purchase log: " + purchase.getId());

        return ResponseEntity.ok().build();
    }

    @GetMapping("/export")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<?> exportPurchases(
            @RequestParam(required = false) Long communityId,
            @RequestParam(required = false) Long billingCycleId,
            Authentication authentication
    ) {
        User caller = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("Caller not found"));

        Long commId = communityId;
        if (caller.getRole() == Role.ADMIN) {
            commId = caller.getCommunity().getId();
        }

        List<BulkWaterPurchase> purchases;
        if (commId != null) {
            purchases = bulkWaterPurchaseRepository.findByCommunityId(commId);
        } else {
            purchases = bulkWaterPurchaseRepository.findAll();
        }

        if (billingCycleId != null) {
            purchases = purchases.stream().filter(p -> p.getBillingCycle() != null && p.getBillingCycle().getId().equals(billingCycleId)).collect(Collectors.toList());
        }

        try {
            StringWriter sw = new StringWriter();
            CSVPrinter csvPrinter = new CSVPrinter(sw, CSVFormat.DEFAULT.withHeader(
                    "ID", "Supplier", "Purchase Date", "Volume (L)", "Unit Cost", "Total Cost", "Invoice Reference", "Billing Cycle", "Remarks"
            ));

            for (BulkWaterPurchase p : purchases) {
                csvPrinter.printRecord(
                        p.getId(),
                        p.getSupplier(),
                        p.getPurchaseDate(),
                        p.getVolumeLitres(),
                        p.getUnitCost(),
                        p.getTotalCost(),
                        p.getInvoiceReference(),
                        p.getBillingCycle() != null ? p.getBillingCycle().getName() : "None",
                        p.getRemarks()
                );
            }
            csvPrinter.flush();
            csvPrinter.close();

            byte[] csvData = sw.toString().getBytes("UTF-8");
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"bulk_water_purchases.csv\"")
                    .contentType(MediaType.parseMediaType("text/csv"))
                    .body(csvData);

        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error exporting CSV: " + e.getMessage());
        }
    }

    private BulkWaterPurchaseDto mapToDto(BulkWaterPurchase p) {
        return BulkWaterPurchaseDto.builder()
                .id(p.getId())
                .communityId(p.getCommunity().getId())
                .supplier(p.getSupplier())
                .purchaseDate(p.getPurchaseDate())
                .volumeLitres(p.getVolumeLitres())
                .unitCost(p.getUnitCost())
                .totalCost(p.getTotalCost())
                .invoiceReference(p.getInvoiceReference())
                .billingCycleId(p.getBillingCycle() != null ? p.getBillingCycle().getId() : null)
                .billingCycleName(p.getBillingCycle() != null ? p.getBillingCycle().getName() : null)
                .remarks(p.getRemarks())
                .build();
    }

    // Static helper class for Page wrapper structure
    @RequiredArgsConstructor
    public static class PageResponse<T> {
        public final List<T> content;
        public final int totalPages;
        public final long totalElements;
        public final int pageNumber;
        public final int pageSize;

        public PageResponse(List<T> content, Page<?> page) {
            this.content = content;
            this.totalPages = page.getTotalPages();
            this.totalElements = page.getTotalElements();
            this.pageNumber = page.getNumber();
            this.pageSize = page.getSize();
        }
    }
}
