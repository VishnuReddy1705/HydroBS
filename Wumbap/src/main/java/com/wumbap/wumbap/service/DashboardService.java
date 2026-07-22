package com.wumbap.wumbap.service;

import com.wumbap.wumbap.entity.*;
import com.wumbap.wumbap.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.TextStyle;
import java.time.temporal.TemporalAdjusters;
import java.util.*;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DashboardService {

    private final UserRepository userRepository;
    private final CommunityRepository communityRepository;
    private final CommunityJoinRequestRepository joinRequestRepository;
    private final MeterReadingRepository meterReadingRepository;
    private final MeterImportErrorRepository meterImportErrorRepository;
    private final WaterBillRepository waterBillRepository;
    private final UploadJobRepository uploadJobRepository;
    private final NotificationRepository notificationRepository;
    private final UsageArchiveRepository usageArchiveRepository;
    private final BulkWaterPurchaseRepository bulkWaterPurchaseRepository;

    public Map<String, Object> getSuperAdminStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalCommunities", communityRepository.count());
        stats.put("totalUsers", userRepository.count());

        BigDecimal systemWideUsage = meterReadingRepository.findAll().stream()
                .map(MeterReading::getUsageLitres)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        stats.put("systemWideWaterUsage", systemWideUsage.setScale(0, java.math.RoundingMode.HALF_UP) + " L");

        long activeAlerts = meterReadingRepository.findAll().stream()
                .filter(r -> r.getUsageLitres().compareTo(new BigDecimal("400")) > 0)
                .map(r -> r.getResident().getId())
                .distinct()
                .count();
        stats.put("activeAlerts", activeAlerts);

        List<Map<String, Object>> recentCommunities = communityRepository.findAll().stream()
                .sorted((a, b) -> b.getId().compareTo(a.getId()))
                .limit(10)
                .map(c -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", c.getId());
                    map.put("name", c.getName());
                    map.put("residentsCount", userRepository.countByCommunityId(c.getId()));
                    map.put("createdAt", c.getCreatedAt() != null ? c.getCreatedAt().toString() : LocalDateTime.now().toString());
                    return map;
                })
                .toList();
        stats.put("recentCommunities", recentCommunities);

        List<Map<String, Object>> recentErrors = meterImportErrorRepository.findAll().stream()
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .limit(20)
                .map(err -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", err.getId());
                    map.put("jobId", err.getUploadJob().getId());
                    map.put("csvRowNumber", err.getCsvRowNumber());
                    map.put("residentIdentifier", err.getResidentIdentifier());
                    map.put("errorMessage", err.getErrorMessage());
                    map.put("createdAt", err.getCreatedAt().toString());
                    return map;
                })
                .toList();
        stats.put("recentErrors", recentErrors);

        // Visualizations for Super Admin
        LocalDate now = LocalDate.now();
        List<MeterReading> allReadings = meterReadingRepository.findAll();
        
        // 1. System Monthly Trend (last 6 months)
        List<Map<String, Object>> systemMonthlyTrend = new ArrayList<>();
        for (int i = 5; i >= 0; i--) {
            LocalDate m = now.minusMonths(i);
            LocalDate mStart = m.withDayOfMonth(1);
            LocalDate mEnd = m.plusMonths(1).minusDays(1);

            BigDecimal usage = allReadings.stream()
                    .filter(r -> !r.getReadingDate().isBefore(mStart) && !r.getReadingDate().isAfter(mEnd))
                    .map(MeterReading::getUsageLitres)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            Map<String, Object> point = new HashMap<>();
            point.put("name", m.getMonth().getDisplayName(TextStyle.SHORT, Locale.ENGLISH));
            point.put("usage", usage.setScale(0, java.math.RoundingMode.HALF_UP));
            systemMonthlyTrend.add(point);
        }
        stats.put("systemMonthlyTrend", systemMonthlyTrend);

        // 2. User Growth (last 6 months cumulative)
        List<Map<String, Object>> userGrowth = new ArrayList<>();
        List<User> allUsers = userRepository.findAll();
        for (int i = 5; i >= 0; i--) {
            LocalDate m = now.minusMonths(i);
            LocalDate mEnd = m.plusMonths(1).minusDays(1);

            long count = allUsers.stream()
                    .filter(u -> u.getCreatedAt() == null || !u.getCreatedAt().toLocalDate().isAfter(mEnd))
                    .count();

            Map<String, Object> point = new HashMap<>();
            point.put("name", m.getMonth().getDisplayName(TextStyle.SHORT, Locale.ENGLISH));
            point.put("users", count);
            userGrowth.add(point);
        }
        stats.put("userGrowthData", userGrowth);

        // 3. Usage by Community
        List<Map<String, Object>> usageByCommunity = new ArrayList<>();
        communityRepository.findAll().forEach(c -> {
            BigDecimal usage = allReadings.stream()
                    .filter(r -> r.getResident() != null && r.getResident().getCommunity() != null && r.getResident().getCommunity().getId().equals(c.getId()))
                    .map(MeterReading::getUsageLitres)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            
            Map<String, Object> point = new HashMap<>();
            point.put("name", c.getName());
            point.put("usage", usage.setScale(0, java.math.RoundingMode.HALF_UP));
            usageByCommunity.add(point);
        });
        stats.put("usageByCommunity", usageByCommunity);

        // Extra SaaS features for Super Admin
        List<WaterBill> allBills = waterBillRepository.findAll();
        BigDecimal totalRevenue = allBills.stream()
                .filter(b -> "PAID".equalsIgnoreCase(b.getStatus()))
                .map(WaterBill::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalOutstanding = allBills.stream()
                .filter(b -> "UNPAID".equalsIgnoreCase(b.getStatus()))
                .map(WaterBill::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        long paidBillsCount = allBills.stream().filter(b -> "PAID".equalsIgnoreCase(b.getStatus())).count();
        long unpaidBillsCount = allBills.stream().filter(b -> "UNPAID".equalsIgnoreCase(b.getStatus())).count();

        stats.put("totalRevenue", totalRevenue.setScale(2, java.math.RoundingMode.HALF_UP));
        stats.put("totalOutstanding", totalOutstanding.setScale(2, java.math.RoundingMode.HALF_UP));
        stats.put("totalBills", (long) allBills.size());

        long pendingRequests = joinRequestRepository.findAll().stream()
                .filter(r -> r.getStatus() == JoinRequestStatus.PENDING)
                .count();
        stats.put("pendingRequests", pendingRequests);

        List<Map<String, Object>> paymentStatusData = new ArrayList<>();
        Map<String, Object> paidMap = new HashMap<>();
        paidMap.put("name", "Paid");
        paidMap.put("value", paidBillsCount);
        paymentStatusData.add(paidMap);

        Map<String, Object> unpaidMap = new HashMap<>();
        unpaidMap.put("name", "Unpaid");
        unpaidMap.put("value", unpaidBillsCount);
        paymentStatusData.add(unpaidMap);
        stats.put("paymentStatusData", paymentStatusData);

        List<Map<String, Object>> monthlyRevenueData = new ArrayList<>();
        for (int i = 5; i >= 0; i--) {
            LocalDate m = now.minusMonths(i);
            LocalDate mStart = m.withDayOfMonth(1);
            LocalDate mEnd = m.plusMonths(1).minusDays(1);

            BigDecimal rev = allBills.stream()
                    .filter(b -> !b.getBillingMonth().isBefore(mStart) && !b.getBillingMonth().isAfter(mEnd))
                    .filter(b -> "PAID".equalsIgnoreCase(b.getStatus()))
                    .map(WaterBill::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal out = allBills.stream()
                    .filter(b -> !b.getBillingMonth().isBefore(mStart) && !b.getBillingMonth().isAfter(mEnd))
                    .filter(b -> "UNPAID".equalsIgnoreCase(b.getStatus()))
                    .map(WaterBill::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            Map<String, Object> point = new HashMap<>();
            point.put("name", m.getMonth().getDisplayName(TextStyle.SHORT, Locale.ENGLISH));
            point.put("revenue", rev.setScale(2, java.math.RoundingMode.HALF_UP));
            point.put("outstanding", out.setScale(2, java.math.RoundingMode.HALF_UP));
            monthlyRevenueData.add(point);
        }
        stats.put("monthlyRevenueData", monthlyRevenueData);

        List<Map<String, Object>> allCommunitiesData = communityRepository.findAll().stream()
                .sorted((a, b) -> a.getName().compareToIgnoreCase(b.getName()))
                .map(c -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", c.getId());
                    map.put("name", c.getName());
                    map.put("residentsCount", userRepository.countByCommunityId(c.getId()));
                    map.put("createdAt", c.getCreatedAt() != null ? c.getCreatedAt().toString() : LocalDateTime.now().toString());
                    map.put("tariffRate", c.getTariffRate());
                    map.put("taxRate", c.getTaxRate());
                    map.put("lateFeeRate", c.getLateFeeRate());
                    map.put("discountRate", c.getDiscountRate());
                    map.put("minimumMonthlyCharge", c.getMinimumMonthlyCharge());
                    map.put("fixedServiceCharge", c.getFixedServiceCharge());
                    map.put("dueDateDays", c.getDueDateDays());
                    map.put("code", c.getCode());
                    map.put("address", c.getAddress());
                    map.put("city", c.getCity());
                    map.put("state", c.getState());
                    map.put("country", c.getCountry());
                    map.put("postalCode", c.getPostalCode());
                    map.put("latitude", c.getLatitude());
                    map.put("longitude", c.getLongitude());
                    map.put("buildingsCount", c.getBuildingsCount());
                    map.put("blocksCount", c.getBlocksCount());
                    map.put("totalFlats", c.getTotalFlats());
                    map.put("status", c.getStatus());
                    map.put("logoUrl", c.getLogoUrl());
                    map.put("description", c.getDescription());
                    map.put("currency", c.getCurrency());
                    map.put("waterUnit", c.getWaterUnit());
                    map.put("billingCycle", c.getBillingCycle());
                    map.put("primaryAdminId", c.getPrimaryAdmin() != null ? c.getPrimaryAdmin().getId() : null);
                    map.put("primaryAdminName", c.getPrimaryAdmin() != null ? c.getPrimaryAdmin().getFullName() : "Not Assigned");
                    return map;
                })
                .toList();
        stats.put("allCommunities", allCommunitiesData);

        List<Map<String, Object>> allUsersData = userRepository.findAll().stream()
                .sorted((a, b) -> a.getFullName().compareToIgnoreCase(b.getFullName()))
                .map(u -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", u.getId());
                    map.put("fullName", u.getFullName());
                    map.put("email", u.getEmail());
                    map.put("role", u.getRole().name());
                    map.put("communityName", u.getCommunity() != null ? u.getCommunity().getName() : "None");
                    map.put("flatNumber", u.getFlatNumber() != null ? u.getFlatNumber() : "N/A");
                    map.put("createdAt", u.getCreatedAt() != null ? u.getCreatedAt().toString() : LocalDateTime.now().toString());
                    return map;
                })
                .toList();
        stats.put("allUsers", allUsersData);

        return stats;
    }

    public Map<String, Object> getCommunityAdminStats(String email) {
        User admin = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Admin not found"));

        Map<String, Object> stats = new HashMap<>();

        if (admin.getCommunity() == null) {
            stats.put("communityName", "No Community");
            stats.put("totalUsers", 0);
            stats.put("totalWaterUsed", "0 L");
            stats.put("waterPurchased", "0 L");
            stats.put("pendingBills", 0);
            stats.put("activeAlerts", 0);
            return stats;
        }

        Long communityId = admin.getCommunity().getId();
        String communityName = admin.getCommunity().getName();
        stats.put("communityName", communityName);
        stats.put("tariffRate", admin.getCommunity().getTariffRate());
        stats.put("tier1LimitLitres", admin.getCommunity().getTier1LimitLitres());
        stats.put("tier1Rate", admin.getCommunity().getTier1Rate());
        stats.put("tier2Rate", admin.getCommunity().getTier2Rate());
        stats.put("taxRate", admin.getCommunity().getTaxRate());
        stats.put("lateFeeRate", admin.getCommunity().getLateFeeRate());
        stats.put("discountRate", admin.getCommunity().getDiscountRate());
        stats.put("minimumMonthlyCharge", admin.getCommunity().getMinimumMonthlyCharge());
        stats.put("fixedServiceCharge", admin.getCommunity().getFixedServiceCharge());
        stats.put("dueDateDays", admin.getCommunity().getDueDateDays());

        List<User> residents = userRepository.findAll().stream()
                .filter(u -> u.getCommunity() != null 
                        && u.getCommunity().getId().equals(communityId) 
                        && u.getRole() == Role.RESIDENT)
                .toList();

        long totalUsers = residents.size();
        stats.put("totalUsers", totalUsers);

        LocalDate now = LocalDate.now();
        LocalDate startOfMonth = now.withDayOfMonth(1);
        LocalDate endOfMonth = now.plusMonths(1).minusDays(1);
        LocalDate startOfLastMonth = now.minusMonths(1).withDayOfMonth(1);
        LocalDate endOfLastMonth = now.minusMonths(1).plusMonths(1).minusDays(1);
        LocalDate startOfWeek = now.with(TemporalAdjusters.previousOrSame(DayOfWeek.SUNDAY));
        LocalDate startOfYear = now.withDayOfYear(1);

        List<MeterReading> communityReadings = meterReadingRepository.findByCommunityId(communityId);

        BigDecimal thisMonthUsage = communityReadings.stream()
                .filter(r -> !r.getReadingDate().isBefore(startOfMonth) && !r.getReadingDate().isAfter(endOfMonth))
                .map(MeterReading::getUsageLitres)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        stats.put("totalWaterUsed", thisMonthUsage.setScale(0, java.math.RoundingMode.HALF_UP) + " L");

        BigDecimal avgPerRes = totalUsers > 0 
                ? thisMonthUsage.divide(new BigDecimal(totalUsers), 0, java.math.RoundingMode.HALF_UP) 
                : BigDecimal.ZERO;
        stats.put("avgUsagePerResident", avgPerRes.setScale(0, java.math.RoundingMode.HALF_UP) + " L");

        BigDecimal lastMonthUsage = communityReadings.stream()
                .filter(r -> !r.getReadingDate().isBefore(startOfLastMonth) && !r.getReadingDate().isAfter(endOfLastMonth))
                .map(MeterReading::getUsageLitres)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        String usageChange = "Stable";
        if (lastMonthUsage.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal diff = thisMonthUsage.subtract(lastMonthUsage);
            BigDecimal percentage = diff.multiply(new BigDecimal("100")).divide(lastMonthUsage, 1, java.math.RoundingMode.HALF_UP);
            if (percentage.compareTo(BigDecimal.ZERO) > 0) {
                usageChange = "+" + percentage + "% vs last month";
            } else {
                usageChange = percentage + "% vs last month";
            }
        }
        stats.put("usageChange", usageChange);

        BigDecimal waterPurchased = bulkWaterPurchaseRepository.findByCommunityId(communityId).stream()
                .filter(p -> p.getPurchaseDate() != null 
                        && !p.getPurchaseDate().isBefore(startOfMonth) 
                        && !p.getPurchaseDate().isAfter(endOfMonth))
                .map(BulkWaterPurchase::getVolumeLitres)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        stats.put("waterPurchased", waterPurchased.setScale(0, java.math.RoundingMode.HALF_UP) + " L");

        String purchaseChange = "Stable";
        BigDecimal lastPurchased = bulkWaterPurchaseRepository.findByCommunityId(communityId).stream()
                .filter(p -> p.getPurchaseDate() != null 
                        && !p.getPurchaseDate().isBefore(startOfLastMonth) 
                        && !p.getPurchaseDate().isAfter(endOfLastMonth))
                .map(BulkWaterPurchase::getVolumeLitres)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        if (lastPurchased.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal diff = waterPurchased.subtract(lastPurchased);
            BigDecimal percentage = diff.multiply(new BigDecimal("100")).divide(lastPurchased, 1, java.math.RoundingMode.HALF_UP);
            if (percentage.compareTo(BigDecimal.ZERO) > 0) {
                purchaseChange = "+" + percentage + "% vs last month";
            } else {
                purchaseChange = percentage + "% vs last month";
            }
        }
        stats.put("purchaseChange", purchaseChange);

        long pendingBills = waterBillRepository.countByCommunityIdAndStatus(communityId, "UNPAID");
        stats.put("pendingBills", pendingBills);

        long activeAlerts = communityReadings.stream()
                .filter(r -> !r.getReadingDate().isBefore(startOfMonth) && !r.getReadingDate().isAfter(endOfMonth))
                .filter(r -> r.getUsageLitres().compareTo(new BigDecimal("400")) > 0)
                .map(r -> r.getResident().getId())
                .distinct()
                .count();
        stats.put("activeAlerts", activeAlerts);

        // Chart Data
        List<Map<String, Object>> monthlyChart = new ArrayList<>();
        for (int i = 5; i >= 0; i--) {
            LocalDate m = now.minusMonths(i);
            LocalDate mStart = m.withDayOfMonth(1);
            LocalDate mEnd = m.plusMonths(1).minusDays(1);

            BigDecimal usage = communityReadings.stream()
                    .filter(r -> !r.getReadingDate().isBefore(mStart) && !r.getReadingDate().isAfter(mEnd))
                    .map(MeterReading::getUsageLitres)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            Map<String, Object> point = new HashMap<>();
            point.put("name", m.getMonth().getDisplayName(TextStyle.SHORT, Locale.ENGLISH));
            point.put("usage", usage.setScale(0, java.math.RoundingMode.HALF_UP));
            point.put("purchased", usage.multiply(new BigDecimal("1.15")).setScale(0, java.math.RoundingMode.HALF_UP));
            monthlyChart.add(point);
        }
        stats.put("chartData", monthlyChart);

        // Resident Usage Distribution (this month)
        List<Map<String, Object>> residentUsage = new ArrayList<>();
        residents.forEach(r -> {
            BigDecimal usage = communityReadings.stream()
                    .filter(read -> read.getResident().getId().equals(r.getId()))
                    .filter(read -> !read.getReadingDate().isBefore(startOfMonth) && !read.getReadingDate().isAfter(endOfMonth))
                    .map(MeterReading::getUsageLitres)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            Map<String, Object> point = new HashMap<>();
            point.put("name", r.getFullName());
            point.put("flat", r.getFlatNumber() != null ? r.getFlatNumber() : "N/A");
            point.put("usage", usage.setScale(0, java.math.RoundingMode.HALF_UP));
            residentUsage.add(point);
        });
        stats.put("residentUsageDistribution", residentUsage);

        // Billing payment status distribution
        List<WaterBill> communityBills = waterBillRepository.findByCommunityId(communityId);
        long paidCount = communityBills.stream().filter(b -> "PAID".equalsIgnoreCase(b.getStatus())).count();
        long unpaidCount = communityBills.stream().filter(b -> "UNPAID".equalsIgnoreCase(b.getStatus())).count();
        
        List<Map<String, Object>> billingDist = new ArrayList<>();
        Map<String, Object> paidMap = new HashMap<>();
        paidMap.put("name", "Paid");
        paidMap.put("value", paidCount);
        billingDist.add(paidMap);
        
        Map<String, Object> unpaidMap = new HashMap<>();
        unpaidMap.put("name", "Unpaid");
        unpaidMap.put("value", unpaidCount);
        billingDist.add(unpaidMap);
        
        stats.put("billingDistribution", billingDist);

        // Recent Activity
        List<Map<String, Object>> activities = new ArrayList<>();
        residents.stream()
                .sorted((a, b) -> b.getId().compareTo(a.getId()))
                .limit(3)
                .forEach(r -> {
                    Map<String, Object> act = new HashMap<>();
                    act.put("id", "app-" + r.getId());
                    act.put("title", "Resident approved");
                    act.put("desc", r.getFullName() + " (Flat " + r.getFlatNumber() + ")");
                    act.put("time", "Approved");
                    activities.add(act);
                });

        uploadJobRepository.findByCommunityIdOrderByUploadStartedAtDesc(communityId).stream()
                .limit(3)
                .forEach(job -> {
                    Map<String, Object> act = new HashMap<>();
                    act.put("id", "up-" + job.getId());
                    act.put("title", "Meter readings uploaded");
                    act.put("desc", job.getSuccessfulRows() + " readings uploaded successfully");
                    act.put("time", job.getUploadStartedAt().toString());
                    activities.add(act);
                });
        stats.put("recentActivity", activities);

        // Unpaid bills table list
        List<WaterBill> unpaidBills = communityBills.stream()
                .filter(b -> "UNPAID".equalsIgnoreCase(b.getStatus()))
                .toList();

        List<Map<String, Object>> pendingBillsList = unpaidBills.stream()
                .limit(10)
                .map(b -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", b.getId());
                    map.put("billNo", "INV-" + b.getId());
                    map.put("flat", "Flat " + b.getResident().getFlatNumber());
                    map.put("residentName", b.getResident().getFullName());
                    map.put("amount", b.getAmount());
                    map.put("dueDate", b.getDueDate().toString());
                    map.put("status", b.getStatus());
                    return map;
                })
                .toList();
        stats.put("pendingBillsList", pendingBillsList);

        // Leak Alerts
        List<Map<String, Object>> leakAlertsList = communityReadings.stream()
                .filter(r -> !r.getReadingDate().isBefore(startOfMonth) && !r.getReadingDate().isAfter(endOfMonth))
                .filter(r -> r.getUsageLitres().compareTo(new BigDecimal("400")) > 0)
                .sorted((a, b) -> b.getReadingDate().compareTo(a.getReadingDate()))
                .limit(5)
                .map(r -> {
                    Map<String, Object> alert = new HashMap<>();
                    alert.put("id", r.getId());
                    alert.put("flat", r.getResident().getFlatNumber());
                    alert.put("name", r.getResident().getFullName());
                    alert.put("usage", r.getUsageLitres());
                    alert.put("date", r.getReadingDate().toString());
                    alert.put("message", "High usage: " + r.getUsageLitres() + " L");
                    return alert;
                })
                .toList();
        stats.put("leakAlertsList", leakAlertsList);

        // Extra SaaS features for Admin
        BigDecimal totalRevenue = communityBills.stream()
                .filter(b -> "PAID".equalsIgnoreCase(b.getStatus()))
                .map(WaterBill::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalOutstanding = communityBills.stream()
                .filter(b -> "UNPAID".equalsIgnoreCase(b.getStatus()))
                .map(WaterBill::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        stats.put("totalRevenue", totalRevenue.setScale(2, java.math.RoundingMode.HALF_UP));
        stats.put("totalOutstanding", totalOutstanding.setScale(2, java.math.RoundingMode.HALF_UP));
        stats.put("totalBills", (long) communityBills.size());

        long communityPendingRequests = joinRequestRepository.findAll().stream()
                .filter(r -> r.getCommunity() != null && r.getCommunity().getId().equals(communityId))
                .filter(r -> r.getStatus() == JoinRequestStatus.PENDING)
                .count();
        stats.put("pendingRequests", communityPendingRequests);

        List<Map<String, Object>> paymentStatusData = new ArrayList<>();
        Map<String, Object> commPaidMap = new HashMap<>();
        commPaidMap.put("name", "Paid");
        commPaidMap.put("value", paidCount);
        paymentStatusData.add(commPaidMap);

        Map<String, Object> commUnpaidMap = new HashMap<>();
        commUnpaidMap.put("name", "Unpaid");
        commUnpaidMap.put("value", unpaidCount);
        paymentStatusData.add(commUnpaidMap);
        stats.put("paymentStatusData", paymentStatusData);

        List<Map<String, Object>> monthlyRevenueData = new ArrayList<>();
        for (int i = 5; i >= 0; i--) {
            LocalDate m = now.minusMonths(i);
            LocalDate mStart = m.withDayOfMonth(1);
            LocalDate mEnd = m.plusMonths(1).minusDays(1);

            BigDecimal rev = communityBills.stream()
                    .filter(b -> !b.getBillingMonth().isBefore(mStart) && !b.getBillingMonth().isAfter(mEnd))
                    .filter(b -> "PAID".equalsIgnoreCase(b.getStatus()))
                    .map(WaterBill::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal out = communityBills.stream()
                    .filter(b -> !b.getBillingMonth().isBefore(mStart) && !b.getBillingMonth().isAfter(mEnd))
                    .filter(b -> "UNPAID".equalsIgnoreCase(b.getStatus()))
                    .map(WaterBill::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            Map<String, Object> point = new HashMap<>();
            point.put("name", m.getMonth().getDisplayName(TextStyle.SHORT, Locale.ENGLISH));
            point.put("revenue", rev.setScale(2, java.math.RoundingMode.HALF_UP));
            point.put("outstanding", out.setScale(2, java.math.RoundingMode.HALF_UP));
            monthlyRevenueData.add(point);
        }
        stats.put("monthlyRevenueData", monthlyRevenueData);

        List<Map<String, Object>> customerGrowthData = new ArrayList<>();
        for (int i = 5; i >= 0; i--) {
            LocalDate m = now.minusMonths(i);
            LocalDate mEnd = m.plusMonths(1).minusDays(1);

            long count = residents.stream()
                    .filter(u -> u.getCreatedAt() == null || !u.getCreatedAt().toLocalDate().isAfter(mEnd))
                    .count();

            Map<String, Object> point = new HashMap<>();
            point.put("name", m.getMonth().getDisplayName(TextStyle.SHORT, Locale.ENGLISH));
            point.put("customers", count);
            customerGrowthData.add(point);
        }
        stats.put("customerGrowthData", customerGrowthData);

        List<Map<String, Object>> allResidentsData = residents.stream()
                .map(r -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", r.getId());
                    map.put("fullName", r.getFullName());
                    map.put("email", r.getEmail());
                    map.put("flatNumber", r.getFlatNumber() != null ? r.getFlatNumber() : "N/A");
                    map.put("createdAt", r.getCreatedAt() != null ? r.getCreatedAt().toString() : LocalDateTime.now().toString());
                    return map;
                })
                .toList();
        stats.put("allResidents", allResidentsData);

        List<Map<String, Object>> allReadingsData = communityReadings.stream()
                .sorted((a, b) -> b.getReadingDate().compareTo(a.getReadingDate()))
                .map(read -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", read.getId());
                    map.put("flatNumber", read.getResident().getFlatNumber() != null ? read.getResident().getFlatNumber() : "N/A");
                    map.put("residentName", read.getResident().getFullName());
                    map.put("readingDate", read.getReadingDate().toString());
                    map.put("previousReading", read.getPreviousReading());
                    map.put("currentReading", read.getCurrentReading());
                    map.put("usageLitres", read.getUsageLitres());
                    return map;
                })
                .toList();
        stats.put("allReadings", allReadingsData);

        // Advanced community admin dashboard calculations
        BigDecimal totalCommunityConsumption = communityReadings.stream()
                .map(MeterReading::getUsageLitres)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        stats.put("totalCommunityConsumption", totalCommunityConsumption.setScale(1, RoundingMode.HALF_UP));

        BigDecimal todayCommunityConsumption = communityReadings.stream()
                .filter(r -> r.getReadingDate().equals(now))
                .map(MeterReading::getUsageLitres)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        stats.put("todayCommunityConsumption", todayCommunityConsumption.setScale(1, RoundingMode.HALF_UP));

        stats.put("monthlyCommunityConsumption", thisMonthUsage.setScale(1, RoundingMode.HALF_UP));

        BigDecimal weeklyCommunityConsumption = communityReadings.stream()
                .filter(r -> !r.getReadingDate().isBefore(startOfWeek) && !r.getReadingDate().isAfter(now))
                .map(MeterReading::getUsageLitres)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        stats.put("weeklyCommunityConsumption", weeklyCommunityConsumption.setScale(1, RoundingMode.HALF_UP));

        BigDecimal yearlyCommunityConsumption = communityReadings.stream()
                .filter(r -> !r.getReadingDate().isBefore(startOfYear) && !r.getReadingDate().isAfter(now))
                .map(MeterReading::getUsageLitres)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        stats.put("yearlyCommunityConsumption", yearlyCommunityConsumption.setScale(1, RoundingMode.HALF_UP));

        BigDecimal averageCommunityConsumption = totalUsers == 0 ? BigDecimal.ZERO : 
                thisMonthUsage.divide(new BigDecimal(totalUsers), 1, RoundingMode.HALF_UP);
        stats.put("averageCommunityConsumption", averageCommunityConsumption);

        // Highest and lowest consumers
        Map<String, Object> highestConsumer = new HashMap<>();
        highestConsumer.put("flat", "N/A");
        highestConsumer.put("name", "N/A");
        highestConsumer.put("usage", BigDecimal.ZERO);
        BigDecimal maxUsage = BigDecimal.ZERO;
        for (Map<String, Object> rUsage : residentUsage) {
            BigDecimal u = (BigDecimal) rUsage.get("usage");
            if (u.compareTo(maxUsage) > 0) {
                maxUsage = u;
                highestConsumer.put("flat", rUsage.get("flat"));
                highestConsumer.put("name", rUsage.get("name"));
                highestConsumer.put("usage", u);
            }
        }
        stats.put("highestConsumer", highestConsumer);

        Map<String, Object> lowestConsumer = new HashMap<>();
        lowestConsumer.put("flat", "N/A");
        lowestConsumer.put("name", "N/A");
        lowestConsumer.put("usage", BigDecimal.ZERO);
        BigDecimal minUsage = new BigDecimal("99999999");
        boolean foundAny = false;
        for (Map<String, Object> rUsage : residentUsage) {
            BigDecimal u = (BigDecimal) rUsage.get("usage");
            foundAny = true;
            if (u.compareTo(minUsage) < 0) {
                minUsage = u;
                lowestConsumer.put("flat", rUsage.get("flat"));
                lowestConsumer.put("name", rUsage.get("name"));
                lowestConsumer.put("usage", u);
            }
        }
        if (!foundAny) {
            lowestConsumer.put("usage", BigDecimal.ZERO);
        }
        stats.put("lowestConsumer", lowestConsumer);

        // Top 10 Consumers
        List<Map<String, Object>> top10Consumers = residentUsage.stream()
                .sorted((a, b) -> ((BigDecimal) b.get("usage")).compareTo((BigDecimal) a.get("usage")))
                .limit(10)
                .toList();
        stats.put("top10Consumers", top10Consumers);

        // Building Wise
        Map<String, BigDecimal> buildingMap = new HashMap<>();
        for (Map<String, Object> rUsage : residentUsage) {
            String flat = (String) rUsage.get("flat");
            BigDecimal u = (BigDecimal) rUsage.get("usage");
            String bld = "Unknown";
            if (flat != null && flat.contains("-")) {
                bld = flat.substring(0, flat.indexOf("-")).trim();
            } else if (flat != null && !flat.isBlank()) {
                char first = flat.trim().charAt(0);
                if (Character.isLetter(first)) {
                    bld = String.valueOf(first).toUpperCase();
                }
            }
            buildingMap.put(bld, buildingMap.getOrDefault(bld, BigDecimal.ZERO).add(u));
        }
        List<Map<String, Object>> buildingWiseList = new ArrayList<>();
        buildingMap.forEach((k, v) -> {
            Map<String, Object> map = new HashMap<>();
            map.put("name", k);
            map.put("usage", v.setScale(0, RoundingMode.HALF_UP));
            buildingWiseList.add(map);
        });
        stats.put("buildingWiseUsage", buildingWiseList);

        // Floor Wise
        Map<String, BigDecimal> floorMap = new HashMap<>();
        for (Map<String, Object> rUsage : residentUsage) {
            String flat = (String) rUsage.get("flat");
            BigDecimal u = (BigDecimal) rUsage.get("usage");
            String flr = "1";
            if (flat != null && flat.contains("-")) {
                String afterDash = flat.substring(flat.indexOf("-") + 1).trim();
                if (!afterDash.isEmpty() && Character.isDigit(afterDash.charAt(0))) {
                    flr = String.valueOf(afterDash.charAt(0));
                }
            } else if (flat != null && !flat.isBlank()) {
                String clean = flat.replaceAll("[^0-9]", "");
                if (!clean.isEmpty()) {
                    flr = String.valueOf(clean.charAt(0));
                }
            }
            floorMap.put("Floor " + flr, floorMap.getOrDefault("Floor " + flr, BigDecimal.ZERO).add(u));
        }
        List<Map<String, Object>> floorWiseList = new ArrayList<>();
        floorMap.forEach((k, v) -> {
            Map<String, Object> map = new HashMap<>();
            map.put("name", k);
            map.put("usage", v.setScale(0, RoundingMode.HALF_UP));
            floorWiseList.add(map);
        });
        stats.put("floorWiseUsage", floorWiseList);

        stats.put("flatWiseUsage", residentUsage);
        stats.put("occupancyStatistics", totalUsers);

        // Completion percent
        long uploadedTodayCount = communityReadings.stream()
                .filter(r -> r.getReadingDate().equals(now))
                .map(r -> r.getResident().getId())
                .distinct()
                .count();
        BigDecimal completionPercent = totalUsers == 0 ? BigDecimal.ZERO : 
                new BigDecimal(uploadedTodayCount).multiply(new BigDecimal("100")).divide(new BigDecimal(totalUsers), 1, RoundingMode.HALF_UP);
        stats.put("readingCompletionPercent", completionPercent);

        // Pending flats
        List<String> pendingFlats = new ArrayList<>();
        List<User> pendingUsers = residents.stream()
                .filter(r -> communityReadings.stream().noneMatch(read -> read.getResident().getId().equals(r.getId()) && read.getReadingDate().equals(now)))
                .toList();
        pendingUsers.forEach(pu -> pendingFlats.add(pu.getFlatNumber() != null ? pu.getFlatNumber() : pu.getFullName()));
        stats.put("pendingFlats", pendingFlats);

        long missingReadingsThisMonth = residents.stream()
                .filter(r -> communityReadings.stream().noneMatch(read -> read.getResident().getId().equals(r.getId()) && !read.getReadingDate().isBefore(startOfMonth) && !read.getReadingDate().isAfter(endOfMonth)))
                .count();
        stats.put("missingReadings", missingReadingsThisMonth);

        // Latest upload status details
        Optional<UploadJob> latestJobOpt = uploadJobRepository.findByCommunityIdOrderByUploadStartedAtDesc(communityId).stream().findFirst();
        if (latestJobOpt.isPresent()) {
            UploadJob job = latestJobOpt.get();
            Map<String, Object> jobMap = new HashMap<>();
            jobMap.put("id", job.getId());
            jobMap.put("fileName", job.getOriginalFilename());
            jobMap.put("status", job.getUploadStatus().name());
            jobMap.put("successCount", job.getSuccessfulRows());
            jobMap.put("failedCount", job.getFailedRows());
            jobMap.put("timestamp", job.getUploadStartedAt().toString());
            stats.put("latestUpload", jobMap);
        } else {
            stats.put("latestUpload", null);
        }

        return stats;
    }

    public Map<String, Object> getResidentStats(String email) {
        User resident = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Resident not found"));

        Map<String, Object> stats = new HashMap<>();
        stats.put("fullName", resident.getFullName());
        stats.put("email", resident.getEmail());
        stats.put("flatNumber", resident.getFlatNumber());

        if (resident.getCommunity() == null) {
            stats.put("hasCommunity", false);
            return stats;
        }

        stats.put("hasCommunity", true);
        stats.put("communityName", resident.getCommunity().getName());
        stats.put("tariffRate", resident.getCommunity().getTariffRate());
        stats.put("taxRate", resident.getCommunity().getTaxRate());
        stats.put("lateFeeRate", resident.getCommunity().getLateFeeRate());
        stats.put("discountRate", resident.getCommunity().getDiscountRate());
        stats.put("minimumMonthlyCharge", resident.getCommunity().getMinimumMonthlyCharge());
        stats.put("fixedServiceCharge", resident.getCommunity().getFixedServiceCharge());
        stats.put("dueDateDays", resident.getCommunity().getDueDateDays());

        List<MeterReading> readings = meterReadingRepository.findByResidentIdOrderByReadingDateDesc(resident.getId());

        LocalDate now = LocalDate.now();
        LocalDate startOfMonth = now.withDayOfMonth(1);
        LocalDate endOfMonth = now.plusMonths(1).minusDays(1);
        LocalDate startOfWeek = now.with(TemporalAdjusters.previousOrSame(DayOfWeek.SUNDAY));
        LocalDate startOfYear = now.withDayOfYear(1);

        // Core Reading statistics
        BigDecimal currentReading = readings.isEmpty() ? BigDecimal.ZERO : readings.get(0).getCurrentReading();
        BigDecimal lastReading = readings.isEmpty() ? BigDecimal.ZERO : readings.get(0).getUsageLitres();
        BigDecimal todayUsage = readings.isEmpty() ? BigDecimal.ZERO : 
                readings.stream().filter(r -> r.getReadingDate().equals(now)).map(MeterReading::getUsageLitres).reduce(BigDecimal.ZERO, BigDecimal::add);
        LocalDate latestDate = readings.isEmpty() ? LocalDate.now() : readings.get(0).getReadingDate();

        stats.put("currentReading", currentReading.setScale(1, RoundingMode.HALF_UP));
        stats.put("lastReading", lastReading.setScale(1, RoundingMode.HALF_UP));
        stats.put("todayUsage", todayUsage.setScale(1, RoundingMode.HALF_UP));
        stats.put("latestReadingDate", latestDate.toString());

        // Period consumptions
        BigDecimal thisMonthUsage = readings.stream()
                .filter(r -> !r.getReadingDate().isBefore(startOfMonth) && !r.getReadingDate().isAfter(endOfMonth))
                .map(MeterReading::getUsageLitres)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        stats.put("thisMonthUsage", thisMonthUsage.setScale(1, RoundingMode.HALF_UP));

        BigDecimal weeklyUsage = readings.stream()
                .filter(r -> !r.getReadingDate().isBefore(startOfWeek) && !r.getReadingDate().isAfter(now))
                .map(MeterReading::getUsageLitres)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        stats.put("weeklyUsage", weeklyUsage.setScale(1, RoundingMode.HALF_UP));

        BigDecimal yearlyUsage = readings.stream()
                .filter(r -> !r.getReadingDate().isBefore(startOfYear) && !r.getReadingDate().isAfter(now))
                .map(MeterReading::getUsageLitres)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        stats.put("yearlyUsage", yearlyUsage.setScale(1, RoundingMode.HALF_UP));

        BigDecimal totalConsumption = readings.stream()
                .map(MeterReading::getUsageLitres)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        stats.put("totalConsumption", totalConsumption.setScale(1, RoundingMode.HALF_UP));

        long readingDays = readings.stream()
                .filter(r -> !r.getReadingDate().isBefore(startOfMonth) && !r.getReadingDate().isAfter(endOfMonth))
                .count();
        BigDecimal avgDailyUsage = readingDays == 0 ? BigDecimal.ZERO : thisMonthUsage.divide(new BigDecimal(readingDays), 1, RoundingMode.HALF_UP);
        stats.put("avgDailyUsage", avgDailyUsage);

        BigDecimal peakUsage = readings.stream()
                .map(MeterReading::getUsageLitres)
                .max(BigDecimal::compareTo)
                .orElse(BigDecimal.ZERO);
        stats.put("peakUsage", peakUsage.setScale(1, RoundingMode.HALF_UP));

        BigDecimal lowestUsage = readings.stream()
                .map(MeterReading::getUsageLitres)
                .min(BigDecimal::compareTo)
                .orElse(BigDecimal.ZERO);
        stats.put("lowestUsage", lowestUsage.setScale(1, RoundingMode.HALF_UP));

        // Comparison metrics (percent vs previous period)
        BigDecimal prevMonthUsage = readings.stream()
                .filter(r -> !r.getReadingDate().isBefore(now.minusMonths(1).withDayOfMonth(1)) 
                        && !r.getReadingDate().isAfter(now.minusMonths(1).plusMonths(1).minusDays(1)))
                .map(MeterReading::getUsageLitres)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal compMonthPercent = BigDecimal.ZERO;
        if (prevMonthUsage.compareTo(BigDecimal.ZERO) > 0) {
            compMonthPercent = thisMonthUsage.subtract(prevMonthUsage).multiply(new BigDecimal("100")).divide(prevMonthUsage, 1, RoundingMode.HALF_UP);
        }
        stats.put("comparisonWithPreviousMonth", compMonthPercent);

        BigDecimal prevWeekUsage = readings.stream()
                .filter(r -> !r.getReadingDate().isBefore(startOfWeek.minusWeeks(1)) && r.getReadingDate().isBefore(startOfWeek))
                .map(MeterReading::getUsageLitres)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal compWeekPercent = BigDecimal.ZERO;
        if (prevWeekUsage.compareTo(BigDecimal.ZERO) > 0) {
            compWeekPercent = weeklyUsage.subtract(prevWeekUsage).multiply(new BigDecimal("100")).divide(prevWeekUsage, 1, RoundingMode.HALF_UP);
        }
        stats.put("comparisonWithPreviousWeek", compWeekPercent);

        BigDecimal prevYearUsage = readings.stream()
                .filter(r -> !r.getReadingDate().isBefore(startOfYear.minusYears(1)) && r.getReadingDate().isBefore(startOfYear))
                .map(MeterReading::getUsageLitres)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal compYearPercent = BigDecimal.ZERO;
        if (prevYearUsage.compareTo(BigDecimal.ZERO) > 0) {
            compYearPercent = yearlyUsage.subtract(prevYearUsage).multiply(new BigDecimal("100")).divide(prevYearUsage, 1, RoundingMode.HALF_UP);
        }
        stats.put("comparisonWithPreviousYear", compYearPercent);

        // Water Saved calculation compared to community average
        Long communityId = resident.getCommunity().getId();
        List<MeterReading> communityReadings = meterReadingRepository.findByCommunityId(communityId);
        long communityResidentsCount = userRepository.countByCommunityId(communityId);
        BigDecimal commTotalThisMonth = communityReadings.stream()
                .filter(r -> !r.getReadingDate().isBefore(startOfMonth) && !r.getReadingDate().isAfter(endOfMonth))
                .map(MeterReading::getUsageLitres)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal commAvgUsage = communityResidentsCount == 0 ? BigDecimal.ZERO : 
                commTotalThisMonth.divide(new BigDecimal(communityResidentsCount), 2, RoundingMode.HALF_UP);

        BigDecimal waterSaved = BigDecimal.ZERO;
        if (commAvgUsage.compareTo(thisMonthUsage) > 0) {
            waterSaved = commAvgUsage.subtract(thisMonthUsage);
        }
        stats.put("waterSaved", waterSaved.setScale(1, RoundingMode.HALF_UP));

        // Leak checks
        boolean highUsage = todayUsage.compareTo(new BigDecimal("400")) > 0;
        stats.put("leakStatus", highUsage ? "Warning" : "Safe");
        stats.put("leakMessage", highUsage ? "Abnormally high flow detected today. Check faucets." : "No leaks detected in your apartment.");

        // Chart Data (monthly consumption, daily usage points)
        List<Map<String, Object>> monthlyChart = readings.stream()
                .filter(r -> !r.getReadingDate().isBefore(startOfMonth) && !r.getReadingDate().isAfter(endOfMonth))
                .sorted((a, b) -> a.getReadingDate().compareTo(b.getReadingDate()))
                .map(r -> {
                    Map<String, Object> point = new HashMap<>();
                    point.put("name", r.getReadingDate().getDayOfMonth() + " " + r.getReadingDate().getMonth().getDisplayName(TextStyle.SHORT, Locale.ENGLISH));
                    point.put("usage", r.getUsageLitres().setScale(0, RoundingMode.HALF_UP));
                    return point;
                })
                .toList();
        stats.put("monthlyChart", monthlyChart);
        stats.put("dailyChart", monthlyChart);

        // Weekly usage chart
        List<Map<String, Object>> weeklyChart = readings.stream()
                .limit(7)
                .sorted((a, b) -> a.getReadingDate().compareTo(b.getReadingDate()))
                .map(r -> {
                    Map<String, Object> point = new HashMap<>();
                    point.put("name", r.getReadingDate().getDayOfWeek().getDisplayName(TextStyle.SHORT, Locale.ENGLISH));
                    point.put("usage", r.getUsageLitres().setScale(0, RoundingMode.HALF_UP));
                    return point;
                })
                .toList();
        stats.put("weeklyChart", weeklyChart);

        // Yearly usage chart
        List<Map<String, Object>> yearlyChartList = new ArrayList<>();
        for (int i = 4; i >= 0; i--) {
            LocalDate yr = now.minusYears(i);
            LocalDate yrStart = yr.withDayOfYear(1);
            LocalDate yrEnd = yr.plusYears(1).minusDays(1);
            BigDecimal yrUsage = readings.stream()
                    .filter(r -> !r.getReadingDate().isBefore(yrStart) && !r.getReadingDate().isAfter(yrEnd))
                    .map(MeterReading::getUsageLitres)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            Map<String, Object> point = new HashMap<>();
            point.put("name", String.valueOf(yr.getYear()));
            point.put("usage", yrUsage.setScale(0, RoundingMode.HALF_UP));
            yearlyChartList.add(point);
        }
        stats.put("yearlyChart", yearlyChartList);

        // Comparison averages chart
        List<Map<String, Object>> comparisonChart = new ArrayList<>();
        for (int i = 5; i >= 0; i--) {
            LocalDate m = now.minusMonths(i);
            LocalDate mStart = m.withDayOfMonth(1);
            LocalDate mEnd = m.plusMonths(1).minusDays(1);

            BigDecimal myMonthUsage = readings.stream()
                    .filter(r -> !r.getReadingDate().isBefore(mStart) && !r.getReadingDate().isAfter(mEnd))
                    .map(MeterReading::getUsageLitres)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal commMonthUsage = communityReadings.stream()
                    .filter(r -> !r.getReadingDate().isBefore(mStart) && !r.getReadingDate().isAfter(mEnd))
                    .map(MeterReading::getUsageLitres)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal commAvg = communityResidentsCount == 0 ? BigDecimal.ZERO : 
                    commMonthUsage.divide(new BigDecimal(communityResidentsCount), 1, RoundingMode.HALF_UP);

            Map<String, Object> point = new HashMap<>();
            point.put("name", m.getMonth().getDisplayName(TextStyle.SHORT, Locale.ENGLISH));
            point.put("myUsage", myMonthUsage.setScale(0, RoundingMode.HALF_UP));
            point.put("averageUsage", commAvg.setScale(0, RoundingMode.HALF_UP));
            comparisonChart.add(point);
        }
        stats.put("comparisonChart", comparisonChart);

        // AI Advisor savings text
        LocalDate oneWeekAgo = now.minusWeeks(1);
        BigDecimal thisWeekSum = readings.stream()
                .filter(r -> !r.getReadingDate().isBefore(oneWeekAgo))
                .map(MeterReading::getUsageLitres)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal lastWeekSum = readings.stream()
                .filter(r -> r.getReadingDate().isBefore(oneWeekAgo) && !r.getReadingDate().isBefore(oneWeekAgo.minusWeeks(1)))
                .map(MeterReading::getUsageLitres)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        String advisorText = "Your water usage is stable. Good job keeping consumption low!";
        int savingsVal = 0;
        int diffPercentage = 0;
        if (lastWeekSum.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal diff = thisWeekSum.subtract(lastWeekSum);
            BigDecimal percentage = diff.multiply(new BigDecimal("100")).divide(lastWeekSum, 0, RoundingMode.HALF_UP);
            diffPercentage = percentage.intValue();
            if (diffPercentage > 0) {
                advisorText = "Your usage is " + diffPercentage + "% higher than last week. Try reducing shower time by 2 minutes/day.";
                savingsVal = diff.multiply(new BigDecimal("5.0")).intValue();
            } else if (diffPercentage < 0) {
                advisorText = "Excellent! Your usage is " + Math.abs(diffPercentage) + "% lower than last week. Keep it up!";
            }
        }
        stats.put("advisorText", advisorText);
        stats.put("advisorSavings", "₹" + savingsVal + "/month");
        stats.put("advisorPercentage", diffPercentage);

        // Recent Invoices
        Optional<WaterBill> currentBillOpt = waterBillRepository.findByResidentIdAndBillingMonth(resident.getId(), startOfMonth);
        if (currentBillOpt.isPresent()) {
            WaterBill bill = currentBillOpt.get();
            stats.put("currentBillAmount", bill.getAmount());
            stats.put("currentBillStatus", bill.getStatus());
            stats.put("currentBillDueDate", bill.getDueDate() != null ? bill.getDueDate().toString() : null);
            stats.put("currentBillId", bill.getId());
        } else {
            stats.put("currentBillAmount", BigDecimal.ZERO);
            stats.put("currentBillStatus", "NO_BILL");
            stats.put("currentBillDueDate", null);
        }

        List<Map<String, Object>> recentBillsList = waterBillRepository.findByResidentId(resident.getId()).stream()
                .sorted((a, b) -> b.getBillingMonth().compareTo(a.getBillingMonth()))
                .limit(5)
                .map(b -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("billNo", "INV-" + b.getId());
                    map.put("month", b.getBillingMonth().getMonth().getDisplayName(TextStyle.SHORT, Locale.ENGLISH) + " " + b.getBillingMonth().getYear());
                    map.put("usage", b.getTotalUsage().setScale(0, RoundingMode.HALF_UP) + " L");
                    map.put("amount", b.getAmount());
                    map.put("status", b.getStatus());
                    return map;
                })
                .toList();
        stats.put("recentBillsList", recentBillsList);

        List<Notification> notifs = notificationRepository.findByUserIdOrderByCreatedAtDesc(resident.getId());
        List<Map<String, Object>> notificationList = notifs.stream()
                .limit(10)
                .map(n -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", n.getId());
                    map.put("title", n.getTitle());
                    map.put("message", n.getMessage());
                    map.put("type", n.getType());
                    map.put("isRead", n.isRead());
                    map.put("createdAt", n.getCreatedAt().toString());
                    return map;
                })
                .toList();
        stats.put("notifications", notificationList);

        List<WaterBill> residentBills = waterBillRepository.findByResidentId(resident.getId());
        BigDecimal totalSpent = residentBills.stream()
                .filter(b -> "PAID".equalsIgnoreCase(b.getStatus()))
                .map(WaterBill::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalOutstanding = residentBills.stream()
                .filter(b -> "UNPAID".equalsIgnoreCase(b.getStatus()))
                .map(WaterBill::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        stats.put("totalSpent", totalSpent.setScale(2, RoundingMode.HALF_UP));
        stats.put("totalOutstanding", totalOutstanding.setScale(2, RoundingMode.HALF_UP));

        return stats;
    }
}