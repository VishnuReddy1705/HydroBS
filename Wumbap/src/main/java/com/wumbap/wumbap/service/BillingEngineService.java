package com.wumbap.wumbap.service;

import com.wumbap.wumbap.dto.BillGenerationRequest;
import com.wumbap.wumbap.dto.BillResponse;
import com.wumbap.wumbap.dto.BillRevisionRequest;
import com.wumbap.wumbap.entity.*;
import com.wumbap.wumbap.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class BillingEngineService {

    private final WaterBillRepository waterBillRepository;
    private final TariffRepository tariffRepository;
    private final BillRevisionRepository billRevisionRepository;
    private final UserRepository userRepository;
    private final CommunityRepository communityRepository;
    private final MeterReadingRepository meterReadingRepository;
    private final NotificationRepository notificationRepository;
    private final AuditLogRepository auditLogRepository;
    private final BillingCycleRepository billingCycleRepository;
    private final BulkWaterPurchaseRepository bulkWaterPurchaseRepository;

    @Transactional
    public List<BillResponse> generateBills(BillGenerationRequest request, String generatedBy) {
        List<WaterBill> generatedBills = new ArrayList<>();

        if (request.getBillingCycleId() != null) {
            BillingCycle cycle = billingCycleRepository.findById(request.getBillingCycleId())
                    .orElseThrow(() -> new IllegalArgumentException("Billing cycle not found with ID: " + request.getBillingCycleId()));

            if (!"ACTIVE".equalsIgnoreCase(cycle.getStatus())) {
                throw new IllegalStateException("Billing runs can only be executed for Active cycles. Current cycle status is: " + cycle.getStatus());
            }

            // Prevent duplicate bills for this cycle
            boolean hasBills = waterBillRepository.findAll().stream()
                    .anyMatch(b -> b.getBillingCycle() != null && b.getBillingCycle().getId().equals(cycle.getId()));
            if (hasBills) {
                throw new IllegalStateException("Duplicate bill generation: Bills already exist for this billing cycle.");
            }

            List<BulkWaterPurchase> purchases = bulkWaterPurchaseRepository.findByBillingCycleId(cycle.getId());
            if (!purchases.isEmpty()) {
                // Proportional Cost Allocation Distribution Engine
                BigDecimal totalPurchasedCost = purchases.stream()
                        .map(BulkWaterPurchase::getTotalCost)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);
                BigDecimal totalVolume = purchases.stream()
                        .map(BulkWaterPurchase::getVolumeLitres)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);

                if (totalPurchasedCost.compareTo(BigDecimal.ZERO) > 0) {
                    Community community = cycle.getCommunity();
                    Tariff tariff = tariffRepository.findByCommunityId(community.getId()).stream()
                            .filter(Tariff::getIsActive)
                            .findFirst()
                            .orElse(null);
                    String fallbackMethod = (tariff != null) ? tariff.getFallbackMethod() : "OCCUPANCY";
                    BigDecimal sharedAreaPct = (tariff != null) ? tariff.getSharedAreaPercentage() : new BigDecimal("10.00");

                    BigDecimal sharedAreaCost = totalPurchasedCost.multiply(sharedAreaPct).divide(new BigDecimal("100.00"), 2, RoundingMode.HALF_UP);
                    BigDecimal individualCost = totalPurchasedCost.subtract(sharedAreaCost);

                    List<User> residents = userRepository.findAll().stream()
                            .filter(u -> u.getCommunity() != null && u.getCommunity().getId().equals(community.getId()) && u.getRole() == Role.RESIDENT)
                            .collect(Collectors.toList());

                    if (residents.isEmpty()) {
                        throw new IllegalStateException("No residents found in community to distribute costs");
                    }

                    Map<Long, BigDecimal> residentUsages = new HashMap<>();
                    BigDecimal totalUsageSum = BigDecimal.ZERO;
                    for (User resident : residents) {
                        BigDecimal usage = getUsageForCycle(resident, cycle, fallbackMethod);
                        residentUsages.put(resident.getId(), usage);
                        totalUsageSum = totalUsageSum.add(usage);
                    }

                    BigDecimal totalAllocated = BigDecimal.ZERO;
                    int residentCount = residents.size();
                    BigDecimal sharedAreaShare = sharedAreaCost.divide(new BigDecimal(residentCount), 2, RoundingMode.HALF_UP);

                    for (int i = 0; i < residentCount; i++) {
                        User resident = residents.get(i);
                        BigDecimal residentUsage = residentUsages.get(resident.getId());
                        BigDecimal indivShare = BigDecimal.ZERO;
                        if (totalUsageSum.compareTo(BigDecimal.ZERO) > 0) {
                            indivShare = individualCost.multiply(residentUsage).divide(totalUsageSum, 2, RoundingMode.HALF_UP);
                        } else {
                            indivShare = individualCost.divide(new BigDecimal(residentCount), 2, RoundingMode.HALF_UP);
                        }

                        BigDecimal residentTotalCost = indivShare.add(sharedAreaShare);

                        // Adjust rounding difference on the last bill
                        if (i == residentCount - 1) {
                            BigDecimal currentSum = totalAllocated.add(residentTotalCost);
                            BigDecimal diff = totalPurchasedCost.subtract(currentSum);
                            residentTotalCost = residentTotalCost.add(diff);
                        }
                        totalAllocated = totalAllocated.add(residentTotalCost);

                        String billNo = "HB-" + cycle.getStartDate().getYear() + "-" + String.format("%06d", (long)(Math.random() * 1000000));
                        String invNo = "INV-" + cycle.getStartDate().getYear() + "-" + String.format("%08d", (long)(Math.random() * 100000000));

                        BigDecimal serviceCharge = (tariff != null) ? tariff.getServiceCharge() : BigDecimal.ZERO;
                        BigDecimal maintenanceCharge = (tariff != null) ? tariff.getMaintenanceCharge() : BigDecimal.ZERO;
                        BigDecimal sewageCharge = (tariff != null) ? tariff.getSewageCharge() : BigDecimal.ZERO;
                        int dueDays = (tariff != null) ? tariff.getDueDays() : 15;

                        WaterBill bill = WaterBill.builder()
                                .resident(resident)
                                .community(community)
                                .billingCycle(cycle)
                                .billingMonth(cycle.getStartDate())
                                .billingStartDate(cycle.getStartDate())
                                .billingEndDate(cycle.getEndDate())
                                .totalUsage(residentUsage)
                                .tariffRate(totalVolume.compareTo(BigDecimal.ZERO) > 0 ? totalPurchasedCost.divide(totalVolume, 4, RoundingMode.HALF_UP) : BigDecimal.ZERO)
                                .taxAmount(BigDecimal.ZERO)
                                .lateFee(BigDecimal.ZERO)
                                .discountAmount(BigDecimal.ZERO)
                                .amount(residentTotalCost.setScale(2, RoundingMode.HALF_UP))
                                .status("GENERATED")
                                .generatedAt(LocalDateTime.now())
                                .dueDate(LocalDate.now().plusDays(dueDays))
                                .billNumber(billNo)
                                .invoiceNumber(invNo)
                                .tariffModel("DISTRIBUTED")
                                .previousReading(BigDecimal.ZERO)
                                .currentReading(BigDecimal.ZERO)
                                .serviceCharge(serviceCharge)
                                .maintenanceCharge(maintenanceCharge)
                                .sewageCharge(sewageCharge)
                                .penalty(BigDecimal.ZERO)
                                .subsidyAmount(BigDecimal.ZERO)
                                .revisionCount(0)
                                .notes(request.getNotes())
                                .tariff(tariff)
                                .generatedBy(generatedBy)
                                .build();

                        waterBillRepository.save(bill);
                        generatedBills.add(bill);

                        notificationRepository.save(Notification.builder()
                                .user(resident)
                                .community(community)
                                .title("New Distributed Water Bill Generated")
                                .message("Your bill for cycle " + cycle.getName() + " is ready. Amount: " + bill.getAmount() + " INR.")
                                .type("BILL")
                                .build());
                    }

                    // Log audit trail
                    auditLogRepository.save(AuditLog.builder()
                            .userEmail(generatedBy)
                            .actionType("BILL_GENERATION")
                            .details("Generated " + generatedBills.size() + " distributed bills for cycle: " + cycle.getName())
                            .build());

                    return generatedBills.stream().map(this::mapToResponse).collect(Collectors.toList());
                }
            }

            // Fallback: If no bulk purchases, run standard slab/tariff billing for the community in this cycle
            Community community = cycle.getCommunity();
            List<User> residents = userRepository.findAll().stream()
                    .filter(u -> u.getCommunity() != null && u.getCommunity().getId().equals(community.getId()) && u.getRole() == Role.RESIDENT)
                    .collect(Collectors.toList());

            for (User resident : residents) {
                try {
                    WaterBill bill = generateSingleResidentBill(resident, community, cycle.getStartDate(), generatedBy, request.getNotes(), true, cycle);
                    generatedBills.add(bill);
                } catch (Exception e) {
                    log.error("Failed to generate bill for resident {}: {}", resident.getId(), e.getMessage());
                }
            }

            // Log audit trail
            auditLogRepository.save(AuditLog.builder()
                    .userEmail(generatedBy)
                    .actionType("BILL_GENERATION")
                    .details("Generated " + generatedBills.size() + " bills for cycle: " + cycle.getName())
                    .build());

            return generatedBills.stream().map(this::mapToResponse).collect(Collectors.toList());
        }

        LocalDate billingMonth = parseBillingMonth(request.getBillingMonth());
        log.info("Starting bill generation for scope: {} in month: {}", request.getScope(), billingMonth);

        if ("SINGLE_RESIDENT".equalsIgnoreCase(request.getScope())) {
            User resident = userRepository.findById(request.getResidentId())
                    .orElseThrow(() -> new IllegalArgumentException("Resident not found with ID: " + request.getResidentId()));
            Community community = resident.getCommunity();
            if (community == null) {
                throw new IllegalArgumentException("Resident is not assigned to a community");
            }
            WaterBill bill = generateSingleResidentBill(resident, community, billingMonth, generatedBy, request.getNotes(), true);
            generatedBills.add(bill);

        } else if ("BUILDING".equalsIgnoreCase(request.getScope())) {
            if (request.getCommunityId() == null || request.getBuilding() == null || request.getBuilding().trim().isEmpty()) {
                throw new IllegalArgumentException("Community ID and building identifier are required for building scope");
            }
            Community community = communityRepository.findById(request.getCommunityId())
                    .orElseThrow(() -> new IllegalArgumentException("Community not found with ID: " + request.getCommunityId()));
            List<User> residents = userRepository.findAll().stream()
                    .filter(u -> u.getCommunity() != null 
                            && u.getCommunity().getId().equals(community.getId()) 
                            && u.getRole() == Role.RESIDENT
                            && request.getBuilding().equalsIgnoreCase(u.getBuilding()))
                    .collect(Collectors.toList());

            for (User resident : residents) {
                try {
                    WaterBill bill = generateSingleResidentBill(resident, community, billingMonth, generatedBy, request.getNotes(), true);
                    generatedBills.add(bill);
                } catch (Exception e) {
                    log.error("Failed to generate bill for resident {}: {}", resident.getId(), e.getMessage());
                }
            }

        } else if ("COMMUNITY".equalsIgnoreCase(request.getScope())) {
            if (request.getCommunityId() == null) {
                throw new IllegalArgumentException("Community ID is required for community scope");
            }
            Community community = communityRepository.findById(request.getCommunityId())
                    .orElseThrow(() -> new IllegalArgumentException("Community not found with ID: " + request.getCommunityId()));
            List<User> residents = userRepository.findAll().stream()
                    .filter(u -> u.getCommunity() != null 
                            && u.getCommunity().getId().equals(community.getId()) 
                            && u.getRole() == Role.RESIDENT)
                    .collect(Collectors.toList());

            for (User resident : residents) {
                try {
                    WaterBill bill = generateSingleResidentBill(resident, community, billingMonth, generatedBy, request.getNotes(), true);
                    generatedBills.add(bill);
                } catch (Exception e) {
                    log.error("Failed to generate bill for resident {}: {}", resident.getId(), e.getMessage());
                }
            }
        } else if ("SYSTEM".equalsIgnoreCase(request.getScope())) {
            List<Community> communities = communityRepository.findAll();
            for (Community community : communities) {
                List<User> residents = userRepository.findAll().stream()
                        .filter(u -> u.getCommunity() != null 
                                && u.getCommunity().getId().equals(community.getId()) 
                                && u.getRole() == Role.RESIDENT)
                        .collect(Collectors.toList());

                for (User resident : residents) {
                    try {
                        WaterBill bill = generateSingleResidentBill(resident, community, billingMonth, generatedBy, request.getNotes(), true);
                        generatedBills.add(bill);
                    } catch (Exception e) {
                        log.error("Failed to generate bill for resident {}: {}", resident.getId(), e.getMessage());
                    }
                }
            }
        } else {
            throw new IllegalArgumentException("Invalid scope: " + request.getScope());
        }

        // Log audit trail
        auditLogRepository.save(AuditLog.builder()
                .userEmail(generatedBy)
                .actionType("BILL_GENERATION")
                .details("Generated " + generatedBills.size() + " bills for scope: " + request.getScope() + ", Month: " + billingMonth)
                .build());

        return generatedBills.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Transactional
    public WaterBill generateSingleResidentBill(User resident, Community community, LocalDate billingMonth, String generatedBy, String notes, boolean overwrite) {
        return generateSingleResidentBill(resident, community, billingMonth, generatedBy, notes, overwrite, null);
    }

    @Transactional
    public WaterBill generateSingleResidentBill(User resident, Community community, LocalDate billingMonth, String generatedBy, String notes, boolean overwrite, BillingCycle cycle) {
        Optional<WaterBill> existingBill = waterBillRepository.findByResidentIdAndBillingMonth(resident.getId(), billingMonth);
        if (existingBill.isPresent()) {
            waterBillRepository.delete(existingBill.get());
            waterBillRepository.flush();
        }

        LocalDate start = (cycle != null) ? cycle.getStartDate() : billingMonth.withDayOfMonth(1);
        LocalDate end = (cycle != null) ? cycle.getEndDate() : billingMonth.withDayOfMonth(billingMonth.lengthOfMonth());

        // Get readings to calculate usage
        List<MeterReading> readings = meterReadingRepository.findByResidentIdOrderByReadingDateDesc(resident.getId()).stream()
                .filter(r -> !r.getReadingDate().isBefore(start) && !r.getReadingDate().isAfter(end))
                .collect(Collectors.toList());

        BigDecimal totalUsage = readings.stream()
                .map(MeterReading::getUsageLitres)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Fetch prev/current meter reading indices
        BigDecimal previousReading = BigDecimal.ZERO;
        BigDecimal currentReading = BigDecimal.ZERO;
        if (!readings.isEmpty()) {
            currentReading = readings.get(0).getCurrentReading();
            BigDecimal lastPrev = readings.get(readings.size() - 1).getPreviousReading();
            previousReading = lastPrev != null ? lastPrev : readings.get(readings.size() - 1).getCurrentReading().subtract(readings.get(readings.size() - 1).getUsageLitres());
            if (previousReading.compareTo(BigDecimal.ZERO) < 0) {
                previousReading = BigDecimal.ZERO;
            }
        }

        // Find active tariff for community
        Optional<Tariff> activeTariffOpt = tariffRepository.findByCommunityIdAndIsActiveTrue(community.getId());

        BigDecimal consumptionCharge = BigDecimal.ZERO;
        BigDecimal baseCharge = BigDecimal.ZERO;
        BigDecimal unitPrice = BigDecimal.ZERO;
        BigDecimal minimumCharge = BigDecimal.ZERO;
        BigDecimal serviceCharge = BigDecimal.ZERO;
        BigDecimal maintenanceCharge = BigDecimal.ZERO;
        BigDecimal sewageCharge = BigDecimal.ZERO;
        BigDecimal taxPercentage = BigDecimal.ZERO;
        BigDecimal lateFee = BigDecimal.ZERO;
        BigDecimal penalty = BigDecimal.ZERO;
        BigDecimal discount = BigDecimal.ZERO;
        BigDecimal subsidy = BigDecimal.ZERO;
        Integer dueDays = 15;
        String tariffModel = "PER_UNIT";
        Tariff tariff = null;

        if (activeTariffOpt.isPresent()) {
            tariff = activeTariffOpt.get();
            tariffModel = tariff.getModel();
            baseCharge = tariff.getBaseCharge();
            unitPrice = tariff.getUnitPrice();
            minimumCharge = tariff.getMinimumCharge();
            serviceCharge = tariff.getServiceCharge();
            maintenanceCharge = tariff.getMaintenanceCharge();
            sewageCharge = tariff.getSewageCharge();
            taxPercentage = tariff.getTaxPercentage();
            lateFee = tariff.getLateFee();
            penalty = tariff.getPenalty();
            discount = tariff.getDiscount();
            subsidy = tariff.getSubsidy();
            dueDays = tariff.getDueDays();

            if ("FIXED".equalsIgnoreCase(tariffModel)) {
                consumptionCharge = unitPrice; // or fixed charge
            } else if ("PER_UNIT".equalsIgnoreCase(tariffModel)) {
                consumptionCharge = totalUsage.multiply(unitPrice);
            } else if ("SLAB".equalsIgnoreCase(tariffModel)) {
                // Progressive Slabs calculation
                BigDecimal remainingUsage = totalUsage;
                List<TariffSlab> slabs = tariff.getSlabs().stream()
                        .sorted(Comparator.comparing(TariffSlab::getRangeStart))
                        .collect(Collectors.toList());

                for (TariffSlab slab : slabs) {
                    if (remainingUsage.compareTo(BigDecimal.ZERO) <= 0) break;
                    BigDecimal slabStart = slab.getRangeStart();
                    BigDecimal slabEnd = slab.getRangeEnd();
                    BigDecimal slabRate = slab.getRatePerUnit();

                    BigDecimal slabWidth;
                    if (slabEnd == null) {
                        slabWidth = remainingUsage;
                    } else {
                        slabWidth = slabEnd.subtract(slabStart);
                    }

                    BigDecimal usageInSlab = remainingUsage.min(slabWidth);
                    consumptionCharge = consumptionCharge.add(usageInSlab.multiply(slabRate));
                    remainingUsage = remainingUsage.subtract(usageInSlab);
                }
            }
            if (consumptionCharge.compareTo(minimumCharge) < 0) {
                consumptionCharge = minimumCharge;
            }
        } else {
            // Tiered Tariff Calculation based on Community Settings
            unitPrice = community.getTariffRate();
            taxPercentage = community.getTaxRate();
            lateFee = community.getLateFeeRate();
            discount = community.getDiscountRate();
            minimumCharge = community.getMinimumMonthlyCharge();
            serviceCharge = community.getFixedServiceCharge();
            dueDays = community.getDueDateDays();

            BigDecimal tier1Limit = community.getTier1LimitLitres() != null ? community.getTier1LimitLitres() : new BigDecimal("10000.00");
            BigDecimal tier1Rate = community.getTier1Rate() != null ? community.getTier1Rate() : unitPrice;
            BigDecimal tier2Rate = community.getTier2Rate() != null ? community.getTier2Rate() : unitPrice.multiply(new BigDecimal("1.5"));

            BigDecimal tier1Usage = totalUsage.min(tier1Limit);
            BigDecimal tier2Usage = totalUsage.subtract(tier1Usage).max(BigDecimal.ZERO);

            consumptionCharge = tier1Usage.multiply(tier1Rate).add(tier2Usage.multiply(tier2Rate));

            if (consumptionCharge.compareTo(minimumCharge) < 0) {
                consumptionCharge = minimumCharge;
            }
        }

        // Subtotal calculation
        BigDecimal subtotal = consumptionCharge
                .add(baseCharge)
                .add(serviceCharge)
                .add(maintenanceCharge)
                .add(sewageCharge);

        // Taxes
        BigDecimal taxAmount = subtotal.multiply(taxPercentage.divide(new BigDecimal("100"), 4, RoundingMode.HALF_UP));

        // Discounts (convert flat discount or evaluate percentage discount)
        BigDecimal finalDiscount = discount;
        if (!activeTariffOpt.isPresent()) {
            // If community default, discountRate is a percentage
            finalDiscount = subtotal.multiply(discount.divide(new BigDecimal("100"), 4, RoundingMode.HALF_UP));
        }

        // Subsidy & Net Total
        BigDecimal finalTotal = subtotal.add(taxAmount).add(penalty).add(lateFee)
                .subtract(finalDiscount).subtract(subsidy);

        if (finalTotal.compareTo(BigDecimal.ZERO) < 0) {
            finalTotal = BigDecimal.ZERO;
        }

        // Professional Invoice Identifiers
        String billNo = "HB-" + billingMonth.getYear() + "-" + String.format("%06d", (long)(Math.random() * 1000000));
        String invNo = "INV-" + billingMonth.getYear() + "-" + String.format("%08d", (long)(Math.random() * 100000000));

        WaterBill bill = WaterBill.builder()
                .resident(resident)
                .community(community)
                .billingCycle(cycle)
                .billingMonth(billingMonth)
                .billingStartDate(start)
                .billingEndDate(end)
                .totalUsage(totalUsage)
                .tariffRate(unitPrice)
                .taxAmount(taxAmount.setScale(2, RoundingMode.HALF_UP))
                .lateFee(lateFee.setScale(2, RoundingMode.HALF_UP))
                .discountAmount(finalDiscount.setScale(2, RoundingMode.HALF_UP))
                .amount(finalTotal.setScale(2, RoundingMode.HALF_UP))
                .status("GENERATED")
                .generatedAt(LocalDateTime.now())
                .dueDate(LocalDate.now().plusDays(dueDays))
                .billNumber(billNo)
                .invoiceNumber(invNo)
                .tariffModel(tariffModel)
                .previousReading(previousReading.setScale(2, RoundingMode.HALF_UP))
                .currentReading(currentReading.setScale(2, RoundingMode.HALF_UP))
                .serviceCharge(serviceCharge.setScale(2, RoundingMode.HALF_UP))
                .maintenanceCharge(maintenanceCharge.setScale(2, RoundingMode.HALF_UP))
                .sewageCharge(sewageCharge.setScale(2, RoundingMode.HALF_UP))
                .penalty(penalty.setScale(2, RoundingMode.HALF_UP))
                .subsidyAmount(subsidy.setScale(2, RoundingMode.HALF_UP))
                .revisionCount(0)
                .notes(notes)
                .tariff(tariff)
                .generatedBy(generatedBy)
                .build();

        WaterBill savedBill = waterBillRepository.save(bill);

        // Notify Resident
        notificationRepository.save(Notification.builder()
                .user(resident)
                .community(community)
                .title("New Utility Bill Generated")
                .message("Your bill for " + billingMonth.format(DateTimeFormatter.ofPattern("MMM yyyy")) + " is ready. Amount Due: " + savedBill.getAmount() + " INR.")
                .type("BILL")
                .build());

        return savedBill;
    }

    @Transactional
    public BillResponse reviseBill(Long billId, BillRevisionRequest request, String revisedBy) {
        WaterBill bill = waterBillRepository.findById(billId)
                .orElseThrow(() -> new IllegalArgumentException("Bill not found with ID: " + billId));

        int newRevisionNum = bill.getRevisionCount() + 1;

        // Log Revision History
        BillRevision revision = BillRevision.builder()
                .bill(bill)
                .revisionNumber(newRevisionNum)
                .amount(bill.getAmount())
                .taxAmount(bill.getTaxAmount())
                .lateFee(bill.getLateFee())
                .penalty(bill.getPenalty())
                .discountAmount(bill.getDiscountAmount())
                .subsidyAmount(bill.getSubsidyAmount())
                .revisedBy(revisedBy)
                .reason(request.getReason())
                .build();
        billRevisionRepository.save(revision);

        // Update Bill details
        if (request.getAmount() != null) bill.setAmount(request.getAmount());
        if (request.getTaxAmount() != null) bill.setTaxAmount(request.getTaxAmount());
        if (request.getLateFee() != null) bill.setLateFee(request.getLateFee());
        if (request.getPenalty() != null) bill.setPenalty(request.getPenalty());
        if (request.getDiscountAmount() != null) bill.setDiscountAmount(request.getDiscountAmount());
        if (request.getSubsidyAmount() != null) bill.setSubsidyAmount(request.getSubsidyAmount());
        if (request.getServiceCharge() != null) bill.setServiceCharge(request.getServiceCharge());
        if (request.getMaintenanceCharge() != null) bill.setMaintenanceCharge(request.getMaintenanceCharge());
        if (request.getSewageCharge() != null) bill.setSewageCharge(request.getSewageCharge());
        if (request.getStatus() != null) bill.setStatus(request.getStatus());
        if (request.getNotes() != null) bill.setNotes(request.getNotes());

        bill.setRevisionCount(newRevisionNum);
        WaterBill savedBill = waterBillRepository.save(bill);

        // Notify Resident
        notificationRepository.save(Notification.builder()
                .user(bill.getResident())
                .community(bill.getCommunity())
                .title("Bill Revised")
                .message("Your bill for " + bill.getBillingMonth().format(DateTimeFormatter.ofPattern("MMM yyyy")) + " has been revised. New Amount: " + savedBill.getAmount() + " INR.")
                .type("BILL")
                .build());

        // Log audit trail
        auditLogRepository.save(AuditLog.builder()
                .userEmail(revisedBy)
                .actionType("BILL_REVISION")
                .details("Revised bill ID: " + billId + ", Revision #: " + newRevisionNum + ", Reason: " + request.getReason())
                .build());

        return mapToResponse(savedBill);
    }

    @Transactional(readOnly = true)
    public BillResponse getBillDetails(Long id) {
        WaterBill bill = waterBillRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Bill not found with ID: " + id));
        return mapToResponse(bill);
    }

    @Transactional(readOnly = true)
    public Page<BillResponse> searchBills(Long communityId, Long residentId, String billNumber, String status, String billingMonthStr, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("billingMonth").descending().and(Sort.by("id").descending()));
        LocalDate billingMonth = null;
        if (billingMonthStr != null && !billingMonthStr.trim().isEmpty()) {
            billingMonth = parseBillingMonth(billingMonthStr);
        }

        // Direct filtering utilizing Streams over repository to maintain code cleanliness or Jpa Specification, JpaRepository
        // Let's implement a manual query logic or fetch all and filter in memory if page/size is small. For safety and compliance:
        // We will fetch and map.
        List<WaterBill> allBills = waterBillRepository.findAll();
        final LocalDate finalBillingMonth = billingMonth;

        List<WaterBill> filtered = allBills.stream()
                .filter(b -> communityId == null || b.getCommunity().getId().equals(communityId))
                .filter(b -> residentId == null || b.getResident().getId().equals(residentId))
                .filter(b -> billNumber == null || b.getBillNumber().toLowerCase().contains(billNumber.toLowerCase()) || b.getInvoiceNumber().toLowerCase().contains(billNumber.toLowerCase()))
                .filter(b -> status == null || "ALL".equalsIgnoreCase(status) || b.getStatus().equalsIgnoreCase(status))
                .filter(b -> finalBillingMonth == null || b.getBillingMonth().equals(finalBillingMonth))
                .collect(Collectors.toList());

        int start = (int) pageable.getOffset();
        int end = Math.min((start + pageable.getPageSize()), filtered.size());

        List<BillResponse> pageList = new ArrayList<>();
        if (start < filtered.size()) {
            pageList = filtered.subList(start, end).stream()
                    .map(this::mapToResponse)
                    .collect(Collectors.toList());
        }

        final int totalElements = filtered.size();
        return new org.springframework.data.domain.PageImpl<>(pageList, pageable, totalElements);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getBillingAnalytics(Long communityId) {
        List<WaterBill> bills = waterBillRepository.findByCommunityId(communityId);
        
        BigDecimal totalRevenue = bills.stream()
                .filter(b -> "PAID".equalsIgnoreCase(b.getStatus()))
                .map(WaterBill::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal outstandingAmount = bills.stream()
                .filter(b -> "UNPAID".equalsIgnoreCase(b.getStatus()) || "OVERDUE".equalsIgnoreCase(b.getStatus()))
                .map(WaterBill::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        long billsGenerated = bills.size();
        long billsPaid = bills.stream().filter(b -> "PAID".equalsIgnoreCase(b.getStatus())).count();
        long billsPending = billsGenerated - billsPaid;

        double collectionEfficiency = billsGenerated == 0 ? 0.0 : ((double) billsPaid / billsGenerated) * 100;

        // Aging outstanding (30 / 60 / 90 days)
        LocalDate now = LocalDate.now();
        BigDecimal aging30 = bills.stream()
                .filter(b -> ("UNPAID".equalsIgnoreCase(b.getStatus()) || "OVERDUE".equalsIgnoreCase(b.getStatus())) && b.getDueDate().isAfter(now.minusDays(30)))
                .map(WaterBill::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal aging60 = bills.stream()
                .filter(b -> ("UNPAID".equalsIgnoreCase(b.getStatus()) || "OVERDUE".equalsIgnoreCase(b.getStatus())) && b.getDueDate().isBefore(now.minusDays(30)) && b.getDueDate().isAfter(now.minusDays(60)))
                .map(WaterBill::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal aging90 = bills.stream()
                .filter(b -> ("UNPAID".equalsIgnoreCase(b.getStatus()) || "OVERDUE".equalsIgnoreCase(b.getStatus())) && b.getDueDate().isBefore(now.minusDays(60)))
                .map(WaterBill::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Top defaulters
        List<Map<String, Object>> topDefaulters = bills.stream()
                .filter(b -> "UNPAID".equalsIgnoreCase(b.getStatus()) || "OVERDUE".equalsIgnoreCase(b.getStatus()))
                .collect(Collectors.groupingBy(b -> b.getResident().getFullName(), Collectors.reducing(BigDecimal.ZERO, WaterBill::getAmount, BigDecimal::add)))
                .entrySet().stream()
                .sorted(Map.Entry.<String, BigDecimal>comparingByValue().reversed())
                .limit(5)
                .map(entry -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("residentName", entry.getKey());
                    map.put("outstandingAmount", entry.getValue());
                    return map;
                })
                .collect(Collectors.toList());

        // Monthly trends (last 6 months)
        List<Map<String, Object>> monthlyTrends = new ArrayList<>();
        LocalDate baseDate = LocalDate.now().minusMonths(5).withDayOfMonth(1);
        for (int i = 0; i < 6; i++) {
            final LocalDate monthDate = baseDate.plusMonths(i);
            BigDecimal monthlyPaid = bills.stream()
                    .filter(b -> b.getBillingMonth().getYear() == monthDate.getYear() && b.getBillingMonth().getMonthValue() == monthDate.getMonthValue())
                    .filter(b -> "PAID".equalsIgnoreCase(b.getStatus()))
                    .map(WaterBill::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal monthlyUnpaid = bills.stream()
                    .filter(b -> b.getBillingMonth().getYear() == monthDate.getYear() && b.getBillingMonth().getMonthValue() == monthDate.getMonthValue())
                    .filter(b -> !"PAID".equalsIgnoreCase(b.getStatus()))
                    .map(WaterBill::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            Map<String, Object> map = new HashMap<>();
            map.put("month", monthDate.format(DateTimeFormatter.ofPattern("MMM yyyy")));
            map.put("revenueCollected", monthlyPaid);
            map.put("outstanding", monthlyUnpaid);
            monthlyTrends.add(map);
        }

        Map<String, Object> analytics = new HashMap<>();
        analytics.put("revenueCollected", totalRevenue);
        analytics.put("outstandingAmount", outstandingAmount);
        analytics.put("collectionRate", Math.round(collectionEfficiency * 10) / 10.0);
        analytics.put("billsGenerated", billsGenerated);
        analytics.put("billsPaid", billsPaid);
        analytics.put("billsPending", billsPending);
        analytics.put("aging30", aging30);
        analytics.put("aging60", aging60);
        analytics.put("aging90", aging90);
        analytics.put("topDefaulters", topDefaulters);
        analytics.put("monthlyRevenueData", monthlyTrends);

        return analytics;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getSuperAdminBillingAnalytics() {
        List<WaterBill> bills = waterBillRepository.findAll();

        BigDecimal totalRevenue = bills.stream()
                .filter(b -> "PAID".equalsIgnoreCase(b.getStatus()))
                .map(WaterBill::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal outstandingAmount = bills.stream()
                .filter(b -> "UNPAID".equalsIgnoreCase(b.getStatus()) || "OVERDUE".equalsIgnoreCase(b.getStatus()))
                .map(WaterBill::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Community comparisons
        List<Map<String, Object>> communityComparison = bills.stream()
                .collect(Collectors.groupingBy(b -> b.getCommunity().getName()))
                .entrySet().stream()
                .map(entry -> {
                    BigDecimal paid = entry.getValue().stream()
                            .filter(b -> "PAID".equalsIgnoreCase(b.getStatus()))
                            .map(WaterBill::getAmount)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);

                    BigDecimal unpaid = entry.getValue().stream()
                            .filter(b -> !"PAID".equalsIgnoreCase(b.getStatus()))
                            .map(WaterBill::getAmount)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);

                    Map<String, Object> map = new HashMap<>();
                    map.put("communityName", entry.getKey());
                    map.put("revenueCollected", paid);
                    map.put("outstanding", unpaid);
                    return map;
                })
                .collect(Collectors.toList());

        // Billing monthly trends (last 6 months)
        List<Map<String, Object>> monthlyTrends = new ArrayList<>();
        LocalDate baseDate = LocalDate.now().minusMonths(5).withDayOfMonth(1);
        for (int i = 0; i < 6; i++) {
            final LocalDate monthDate = baseDate.plusMonths(i);
            BigDecimal monthlyPaid = bills.stream()
                    .filter(b -> b.getBillingMonth().getYear() == monthDate.getYear() && b.getBillingMonth().getMonthValue() == monthDate.getMonthValue())
                    .filter(b -> "PAID".equalsIgnoreCase(b.getStatus()))
                    .map(WaterBill::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal monthlyUnpaid = bills.stream()
                    .filter(b -> b.getBillingMonth().getYear() == monthDate.getYear() && b.getBillingMonth().getMonthValue() == monthDate.getMonthValue())
                    .filter(b -> !"PAID".equalsIgnoreCase(b.getStatus()))
                    .map(WaterBill::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            Map<String, Object> map = new HashMap<>();
            map.put("month", monthDate.format(DateTimeFormatter.ofPattern("MMM yyyy")));
            map.put("revenueCollected", monthlyPaid);
            map.put("outstanding", monthlyUnpaid);
            // simple forecast (revenue of current month + 5% increase estimate)
            map.put("forecast", monthlyPaid.multiply(new BigDecimal("1.05")).setScale(2, RoundingMode.HALF_UP));
            monthlyTrends.add(map);
        }

        Map<String, Object> analytics = new HashMap<>();
        analytics.put("totalRevenue", totalRevenue);
        analytics.put("totalOutstanding", outstandingAmount);
        analytics.put("communityComparison", communityComparison);
        analytics.put("billingTrends", monthlyTrends);

        return analytics;
    }

    private LocalDate parseBillingMonth(String value) {
        if (value == null || value.trim().isEmpty()) {
            return LocalDate.now().withDayOfMonth(1);
        }
        try {
            if (value.length() == 7) { // yyyy-MM
                return YearMonth.parse(value).atDay(1);
            } else if (value.contains("-")) {
                LocalDate date = LocalDate.parse(value);
                return date.withDayOfMonth(1);
            }
        } catch (Exception e) {
            log.warn("Failed to parse billing month: {}, defaulting to current month", value);
        }
        return LocalDate.now().withDayOfMonth(1);
    }

    private BillResponse mapToResponse(WaterBill bill) {
        List<BillResponse.BillRevisionDto> revisionDtos = billRevisionRepository.findByBillIdOrderByRevisionNumberDesc(bill.getId())
                .stream()
                .map(rev -> BillResponse.BillRevisionDto.builder()
                        .id(rev.getId())
                        .revisionNumber(rev.getRevisionNumber())
                        .amount(rev.getAmount())
                        .taxAmount(rev.getTaxAmount())
                        .lateFee(rev.getLateFee())
                        .penalty(rev.getPenalty())
                        .discountAmount(rev.getDiscountAmount())
                        .subsidyAmount(rev.getSubsidyAmount())
                        .revisedBy(rev.getRevisedBy())
                        .reason(rev.getReason())
                        .revisedAt(rev.getRevisedAt())
                        .build())
                .collect(Collectors.toList());

        User resident = bill.getResident();
        Community community = bill.getCommunity();

        return BillResponse.builder()
                .id(bill.getId())
                .billNumber(bill.getBillNumber())
                .invoiceNumber(bill.getInvoiceNumber())
                .billingMonth(bill.getBillingMonth())
                .billingStartDate(bill.getBillingStartDate())
                .billingEndDate(bill.getBillingEndDate())
                .totalUsage(bill.getTotalUsage())
                .tariffRate(bill.getTariffRate())
                .taxAmount(bill.getTaxAmount())
                .lateFee(bill.getLateFee())
                .discountAmount(bill.getDiscountAmount())
                .amount(bill.getAmount())
                .status(bill.getStatus())
                .generatedAt(bill.getGeneratedAt())
                .dueDate(bill.getDueDate())
                .paidAt(bill.getPaidAt())
                
                .residentId(resident != null ? resident.getId() : null)
                .residentName(resident != null ? resident.getFullName() : null)
                .residentEmail(resident != null ? resident.getEmail() : null)
                .residentPhone(resident != null ? resident.getPhoneNumber() : null)
                
                .communityId(community != null ? community.getId() : null)
                .communityName(community != null ? community.getName() : null)
                
                .building(resident != null ? resident.getBuilding() : null)
                .block(resident != null ? resident.getBlock() : null)
                .floor(resident != null ? resident.getFloor() : null)
                .flatNumber(resident != null ? resident.getFlatNumber() : null)
                
                .previousReading(bill.getPreviousReading())
                .currentReading(bill.getCurrentReading())
                .serviceCharge(bill.getServiceCharge())
                .maintenanceCharge(bill.getMaintenanceCharge())
                .sewageCharge(bill.getSewageCharge())
                .penalty(bill.getPenalty())
                .subsidyAmount(bill.getSubsidyAmount())
                .tariffModel(bill.getTariffModel())
                .notes(bill.getNotes())
                .revisionCount(bill.getRevisionCount())
                .generatedBy(bill.getGeneratedBy())
                .revisions(revisionDtos)
                .build();
    }

    private BigDecimal getUsageForCycle(User resident, BillingCycle cycle, String fallbackMethod) {
        List<MeterReading> readings = meterReadingRepository.findByResidentIdOrderByReadingDateDesc(resident.getId()).stream()
                .filter(r -> r.getReadingDate() != null 
                        && !r.getReadingDate().isBefore(cycle.getStartDate()) 
                        && !r.getReadingDate().isAfter(cycle.getEndDate()))
                .collect(Collectors.toList());
        
        if (!readings.isEmpty()) {
            return readings.stream()
                    .map(MeterReading::getUsageLitres)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
        }
        
        // Fallback
        if ("AREA".equalsIgnoreCase(fallbackMethod)) {
            BigDecimal area = resident.getFlatArea() != null ? resident.getFlatArea() : BigDecimal.ZERO;
            return area.multiply(new BigDecimal("10.00")); // Nominal 10 L per SqFt
        } else {
            int familySize = resident.getFamilySize() != null ? resident.getFamilySize() : 1;
            return new BigDecimal(familySize).multiply(new BigDecimal("1500.00")); // Nominal 1500 L per person
        }
    }
}
