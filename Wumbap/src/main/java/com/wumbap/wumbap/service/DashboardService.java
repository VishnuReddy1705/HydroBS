package com.wumbap.wumbap.service;

import com.wumbap.wumbap.entity.*;
import com.wumbap.wumbap.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.TextStyle;
import java.util.*;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final UserRepository userRepository;
    private final CommunityRepository communityRepository;
    private final CommunityJoinRequestRepository joinRequestRepository;
    private final MeterReadingRepository meterReadingRepository;
    private final MeterImportErrorRepository meterImportErrorRepository;
    private final WaterBillRepository waterBillRepository;
    private final UploadJobRepository uploadJobRepository;

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

        List<MeterReading> communityReadings = meterReadingRepository.findByCommunityId(communityId);

        BigDecimal thisMonthUsage = communityReadings.stream()
                .filter(r -> !r.getReadingDate().isBefore(startOfMonth) && !r.getReadingDate().isAfter(endOfMonth))
                .map(MeterReading::getUsageLitres)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        stats.put("totalWaterUsed", thisMonthUsage.setScale(0, java.math.RoundingMode.HALF_UP) + " L");

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

        BigDecimal waterPurchased = thisMonthUsage.multiply(new BigDecimal("1.15"));
        stats.put("waterPurchased", waterPurchased.setScale(0, java.math.RoundingMode.HALF_UP) + " L");

        String purchaseChange = "Stable";
        if (lastMonthUsage.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal lastPurchased = lastMonthUsage.multiply(new BigDecimal("1.15"));
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
        List<WaterBill> unpaidBills = waterBillRepository.findByCommunityId(communityId).stream()
                .filter(b -> "UNPAID".equalsIgnoreCase(b.getStatus()))
                .toList();

        List<Map<String, Object>> pendingBillsList = unpaidBills.stream()
                .limit(10)
                .map(b -> {
                    Map<String, Object> map = new HashMap<>();
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

        List<MeterReading> readings = meterReadingRepository.findByResidentIdOrderByReadingDateDesc(resident.getId());

        LocalDate now = LocalDate.now();
        LocalDate startOfMonth = now.withDayOfMonth(1);
        LocalDate endOfMonth = now.plusMonths(1).minusDays(1);

        BigDecimal todayUsage = readings.isEmpty() ? BigDecimal.ZERO : readings.get(0).getUsageLitres();
        LocalDate latestDate = readings.isEmpty() ? LocalDate.now() : readings.get(0).getReadingDate();
        stats.put("todayUsage", todayUsage);
        stats.put("latestReadingDate", latestDate.toString());

        BigDecimal thisMonthUsage = readings.stream()
                .filter(r -> !r.getReadingDate().isBefore(startOfMonth) && !r.getReadingDate().isAfter(endOfMonth))
                .map(MeterReading::getUsageLitres)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        stats.put("thisMonthUsage", thisMonthUsage);

        long readingDays = readings.stream()
                .filter(r -> !r.getReadingDate().isBefore(startOfMonth) && !r.getReadingDate().isAfter(endOfMonth))
                .count();
        BigDecimal avgDailyUsage = readingDays == 0 ? BigDecimal.ZERO : thisMonthUsage.divide(new BigDecimal(readingDays), 1, java.math.RoundingMode.HALF_UP);
        stats.put("avgDailyUsage", avgDailyUsage);

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
                    point.put("usage", r.getUsageLitres().setScale(0, java.math.RoundingMode.HALF_UP));
                    return point;
                })
                .toList();
        stats.put("monthlyChart", monthlyChart);

        // Weekly usage chart
        List<Map<String, Object>> weeklyChart = readings.stream()
                .limit(7)
                .sorted((a, b) -> a.getReadingDate().compareTo(b.getReadingDate()))
                .map(r -> {
                    Map<String, Object> point = new HashMap<>();
                    point.put("name", r.getReadingDate().getDayOfWeek().getDisplayName(TextStyle.SHORT, Locale.ENGLISH));
                    point.put("usage", r.getUsageLitres().setScale(0, java.math.RoundingMode.HALF_UP));
                    return point;
                })
                .toList();
        stats.put("weeklyChart", weeklyChart);

        // Compute community average usage over the last 6 months for comparison
        Long communityId = resident.getCommunity().getId();
        List<MeterReading> communityReadings = meterReadingRepository.findByCommunityId(communityId);
        long communityResidentsCount = userRepository.countByCommunityId(communityId);

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
                    commMonthUsage.divide(new BigDecimal(communityResidentsCount), 1, java.math.RoundingMode.HALF_UP);

            Map<String, Object> point = new HashMap<>();
            point.put("name", m.getMonth().getDisplayName(TextStyle.SHORT, Locale.ENGLISH));
            point.put("myUsage", myMonthUsage.setScale(0, java.math.RoundingMode.HALF_UP));
            point.put("averageUsage", commAvg.setScale(0, java.math.RoundingMode.HALF_UP));
            comparisonChart.add(point);
        }
        stats.put("comparisonChart", comparisonChart);

        // AI Advice comparison
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
            BigDecimal percentage = diff.multiply(new BigDecimal("100")).divide(lastWeekSum, 0, java.math.RoundingMode.HALF_UP);
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

        List<Map<String, Object>> recentBillsList = waterBillRepository.findByResidentId(resident.getId()).stream()
                .sorted((a, b) -> b.getBillingMonth().compareTo(a.getBillingMonth()))
                .limit(5)
                .map(b -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("billNo", "INV-" + b.getId());
                    map.put("month", b.getBillingMonth().getMonth().getDisplayName(TextStyle.SHORT, Locale.ENGLISH) + " " + b.getBillingMonth().getYear());
                    map.put("usage", b.getTotalUsage().setScale(0, java.math.RoundingMode.HALF_UP) + " L");
                    map.put("amount", b.getAmount());
                    map.put("status", b.getStatus());
                    return map;
                })
                .toList();
        stats.put("recentBillsList", recentBillsList);

        return stats;
    }
}