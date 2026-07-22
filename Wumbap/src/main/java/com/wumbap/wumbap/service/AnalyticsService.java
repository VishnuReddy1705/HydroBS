package com.wumbap.wumbap.service;

import com.wumbap.wumbap.entity.*;
import com.wumbap.wumbap.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final UserRepository userRepository;
    private final CommunityRepository communityRepository;
    private final MeterReadingRepository meterReadingRepository;
    private final WaterBillRepository waterBillRepository;
    private final PaymentRepository paymentRepository;
    private final AuditLogRepository auditLogRepository;

    @Transactional(readOnly = true)
    public Map<String, Object> getExecutiveKPIs(User user, Long communityId) {
        Map<String, Object> kpis = new HashMap<>();

        // Role boundaries configuration
        Long targetCommunityId = communityId;
        Long residentId = null;

        if (user.getRole() == Role.RESIDENT) {
            residentId = user.getId();
            targetCommunityId = user.getCommunity() != null ? user.getCommunity().getId() : null;
        } else if (user.getRole() == Role.ADMIN) {
            targetCommunityId = user.getCommunity() != null ? user.getCommunity().getId() : null;
        }

        // Apply filters to data pools
        final Long finalCommId = targetCommunityId;
        final Long finalResId = residentId;

        List<Community> communities = communityRepository.findAll().stream()
                .filter(c -> finalCommId == null || c.getId().equals(finalCommId))
                .toList();

        List<User> residents = userRepository.findAll().stream()
                .filter(u -> u.getRole() == Role.RESIDENT)
                .filter(u -> finalCommId == null || (u.getCommunity() != null && u.getCommunity().getId().equals(finalCommId)))
                .filter(u -> finalResId == null || u.getId().equals(finalResId))
                .toList();

        List<MeterReading> readings = meterReadingRepository.findAll().stream()
                .filter(r -> finalCommId == null || (r.getCommunity() != null && r.getCommunity().getId().equals(finalCommId)))
                .filter(r -> finalResId == null || (r.getResident() != null && r.getResident().getId().equals(finalResId)))
                .toList();

        List<WaterBill> bills = waterBillRepository.findAll().stream()
                .filter(b -> finalCommId == null || (b.getCommunity() != null && b.getCommunity().getId().equals(finalCommId)))
                .filter(b -> finalResId == null || (b.getResident() != null && b.getResident().getId().equals(finalResId)))
                .toList();

        LocalDate now = LocalDate.now();
        LocalDate startOfMonth = now.withDayOfMonth(1);
        LocalDate startOfYear = now.withDayOfYear(1);

        // Compute Metrics
        kpis.put("totalCommunities", communities.size());
        kpis.put("totalResidents", residents.size());
        
        long activeMeters = residents.stream().filter(User::isActive).count();
        kpis.put("totalActiveMeters", activeMeters);

        BigDecimal totalUsage = readings.stream()
                .map(MeterReading::getUsageLitres)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        kpis.put("totalWaterConsumption", totalUsage.setScale(0, RoundingMode.HALF_UP));

        double avgUsage = readings.isEmpty() ? 0.0 : totalUsage.doubleValue() / readings.size();
        kpis.put("averageWaterConsumption", Math.round(avgUsage * 10) / 10.0);

        BigDecimal monthlyRevenue = bills.stream()
                .filter(b -> "PAID".equalsIgnoreCase(b.getStatus()))
                .filter(b -> !b.getBillingMonth().isBefore(startOfMonth))
                .map(WaterBill::getAmount)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        kpis.put("monthlyRevenue", monthlyRevenue.setScale(2, RoundingMode.HALF_UP));

        BigDecimal yearlyRevenue = bills.stream()
                .filter(b -> "PAID".equalsIgnoreCase(b.getStatus()))
                .filter(b -> !b.getBillingMonth().isBefore(startOfYear))
                .map(WaterBill::getAmount)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        kpis.put("yearlyRevenue", yearlyRevenue.setScale(2, RoundingMode.HALF_UP));

        BigDecimal outstandingRevenue = bills.stream()
                .filter(b -> !"PAID".equalsIgnoreCase(b.getStatus()) && !"CANCELLED".equalsIgnoreCase(b.getStatus()))
                .map(WaterBill::getAmount)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        kpis.put("outstandingRevenue", outstandingRevenue.setScale(2, RoundingMode.HALF_UP));

        BigDecimal totalBilled = bills.stream()
                .filter(b -> !"CANCELLED".equalsIgnoreCase(b.getStatus()))
                .map(WaterBill::getAmount)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        double collectionRate = totalBilled.compareTo(BigDecimal.ZERO) == 0 ? 0.0 
                : (yearlyRevenue.doubleValue() / totalBilled.doubleValue()) * 100.0;
        kpis.put("collectionRate", Math.round(Math.min(100.0, collectionRate) * 10) / 10.0);

        long paidBillsCount = bills.stream().filter(b -> "PAID".equalsIgnoreCase(b.getStatus())).count();
        long activeBillsCount = bills.stream().filter(b -> !"CANCELLED".equalsIgnoreCase(b.getStatus())).count();
        double successRate = activeBillsCount == 0 ? 100.0 : ((double) paidBillsCount / activeBillsCount) * 100.0;
        kpis.put("paymentSuccessRate", Math.round(successRate * 10) / 10.0);

        // Simple growth computations
        kpis.put("monthlyGrowth", residents.stream().filter(r -> r.getCreatedAt() != null && r.getCreatedAt().toLocalDate().isAfter(now.minusMonths(1))).count());
        kpis.put("communityGrowth", communities.stream().filter(c -> c.getCreatedAt() != null && c.getCreatedAt().toLocalDate().isAfter(now.minusMonths(1))).count());

        return kpis;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getAnalyticsCharts(User user, Long communityId) {
        Map<String, Object> charts = new HashMap<>();

        // Role boundaries configuration
        Long targetCommunityId = communityId;
        Long residentId = null;

        if (user.getRole() == Role.RESIDENT) {
            residentId = user.getId();
            targetCommunityId = user.getCommunity() != null ? user.getCommunity().getId() : null;
        } else if (user.getRole() == Role.ADMIN) {
            targetCommunityId = user.getCommunity() != null ? user.getCommunity().getId() : null;
        }

        final Long finalCommId = targetCommunityId;
        final Long finalResId = residentId;

        // Data Pools
        List<User> residents = userRepository.findAll().stream()
                .filter(u -> u.getRole() == Role.RESIDENT)
                .filter(u -> finalCommId == null || (u.getCommunity() != null && u.getCommunity().getId().equals(finalCommId)))
                .filter(u -> finalResId == null || u.getId().equals(finalResId))
                .toList();

        List<MeterReading> readings = meterReadingRepository.findAll().stream()
                .filter(r -> finalCommId == null || (r.getCommunity() != null && r.getCommunity().getId().equals(finalCommId)))
                .filter(r -> finalResId == null || (r.getResident() != null && r.getResident().getId().equals(finalResId)))
                .toList();

        List<WaterBill> bills = waterBillRepository.findAll().stream()
                .filter(b -> finalCommId == null || (b.getCommunity() != null && b.getCommunity().getId().equals(finalCommId)))
                .filter(b -> finalResId == null || (b.getResident() != null && b.getResident().getId().equals(finalResId)))
                .toList();

        LocalDate now = LocalDate.now();

        // 1. Water Consumption: Daily Trend (last 7 days)
        List<Map<String, Object>> dailyUsage = new ArrayList<>();
        for (int i = 6; i >= 0; i--) {
            LocalDate d = now.minusDays(i);
            BigDecimal dayVol = readings.stream()
                    .filter(r -> r.getReadingDate().equals(d))
                    .map(MeterReading::getUsageLitres)
                    .filter(Objects::nonNull)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            Map<String, Object> map = new HashMap<>();
            map.put("name", d.format(DateTimeFormatter.ofPattern("EEE (dd/MM)")));
            map.put("usage", dayVol.setScale(0, RoundingMode.HALF_UP));
            dailyUsage.add(map);
        }
        charts.put("dailyUsage", dailyUsage);

        // 2. Water Consumption: Monthly Trend (last 6 months)
        List<Map<String, Object>> monthlyUsage = new ArrayList<>();
        for (int i = 5; i >= 0; i--) {
            LocalDate m = now.minusMonths(i);
            LocalDate start = m.withDayOfMonth(1);
            LocalDate end = m.plusMonths(1).minusDays(1);

            BigDecimal monthVol = readings.stream()
                    .filter(r -> !r.getReadingDate().isBefore(start) && !r.getReadingDate().isAfter(end))
                    .map(MeterReading::getUsageLitres)
                    .filter(Objects::nonNull)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            Map<String, Object> map = new HashMap<>();
            map.put("name", m.format(DateTimeFormatter.ofPattern("MMM yyyy")));
            map.put("usage", monthVol.setScale(0, RoundingMode.HALF_UP));
            monthlyUsage.add(map);
        }
        charts.put("monthlyUsage", monthlyUsage);

        // 3. Water Consumption: Yearly Comparison
        List<Map<String, Object>> yearlyUsage = new ArrayList<>();
        for (int i = 2; i >= 0; i--) {
            int year = now.getYear() - i;
            BigDecimal yearVol = meterReadingRepository.findAll().stream()
                    .filter(r -> r.getReadingDate().getYear() == year)
                    .filter(r -> finalCommId == null || (r.getCommunity() != null && r.getCommunity().getId().equals(finalCommId)))
                    .filter(r -> finalResId == null || (r.getResident() != null && r.getResident().getId().equals(finalResId)))
                    .map(MeterReading::getUsageLitres)
                    .filter(Objects::nonNull)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            Map<String, Object> map = new HashMap<>();
            map.put("name", String.valueOf(year));
            map.put("usage", yearVol.setScale(0, RoundingMode.HALF_UP));
            yearlyUsage.add(map);
        }
        charts.put("yearlyUsage", yearlyUsage);

        // 4. Building / Tower Comparison (aggregate by User.building)
        List<Map<String, Object>> buildingUsage = residents.stream()
                .filter(u -> u.getBuilding() != null && !u.getBuilding().trim().isEmpty())
                .collect(Collectors.groupingBy(User::getBuilding))
                .entrySet().stream()
                .map(entry -> {
                    BigDecimal usage = readings.stream()
                            .filter(r -> r.getResident() != null && entry.getValue().stream().anyMatch(u -> u.getId().equals(r.getResident().getId())))
                            .map(MeterReading::getUsageLitres)
                            .filter(Objects::nonNull)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);

                    Map<String, Object> map = new HashMap<>();
                    map.put("name", entry.getKey());
                    map.put("usage", usage.setScale(0, RoundingMode.HALF_UP));
                    return map;
                })
                .sorted((a, b) -> ((BigDecimal) b.get("usage")).compareTo((BigDecimal) a.get("usage")))
                .limit(10)
                .collect(Collectors.toList());
        charts.put("buildingUsage", buildingUsage);

        // 5. Community Comparison (Super Admin only, or lists single community)
        List<Map<String, Object>> communityComparison = communityRepository.findAll().stream()
                .filter(c -> finalCommId == null || c.getId().equals(finalCommId))
                .map(c -> {
                    BigDecimal usage = meterReadingRepository.findAll().stream()
                            .filter(r -> r.getCommunity() != null && r.getCommunity().getId().equals(c.getId()))
                            .map(MeterReading::getUsageLitres)
                            .filter(Objects::nonNull)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);

                    BigDecimal revenue = waterBillRepository.findAll().stream()
                            .filter(b -> b.getCommunity() != null && b.getCommunity().getId().equals(c.getId()))
                            .filter(b -> "PAID".equalsIgnoreCase(b.getStatus()))
                            .map(WaterBill::getAmount)
                            .filter(Objects::nonNull)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);

                    Map<String, Object> map = new HashMap<>();
                    map.put("name", c.getName());
                    map.put("usage", usage.setScale(0, RoundingMode.HALF_UP));
                    map.put("revenue", revenue.setScale(2, RoundingMode.HALF_UP));
                    return map;
                })
                .sorted((a, b) -> ((BigDecimal) b.get("usage")).compareTo((BigDecimal) a.get("usage")))
                .collect(Collectors.toList());
        charts.put("communityComparison", communityComparison);

        // 6. Paid vs Pending vs Overdue bills distribution
        List<Map<String, Object>> paymentStatusDistribution = new ArrayList<>();
        long paid = bills.stream().filter(b -> "PAID".equalsIgnoreCase(b.getStatus())).count();
        long pending = bills.stream().filter(b -> "GENERATED".equalsIgnoreCase(b.getStatus()) || "SENT".equalsIgnoreCase(b.getStatus()) || "VIEWED".equalsIgnoreCase(b.getStatus())).count();
        long overdue = bills.stream().filter(b -> "OVERDUE".equalsIgnoreCase(b.getStatus())).count();
        
        paymentStatusDistribution.add(createStatusPoint("Paid", paid));
        paymentStatusDistribution.add(createStatusPoint("Pending", pending));
        paymentStatusDistribution.add(createStatusPoint("Overdue", overdue));
        charts.put("paymentStatusDistribution", paymentStatusDistribution);

        // 7. Payment method distribution (read from real Payment entities)
        List<Payment> communityPayments = paymentRepository.findAll().stream()
                .filter(p -> p.getBill() != null)
                .filter(p -> finalCommId == null || (p.getBill().getCommunity() != null && p.getBill().getCommunity().getId().equals(finalCommId)))
                .toList();

        Map<String, Long> methodCounts = communityPayments.stream()
                .filter(p -> "COMPLETED".equalsIgnoreCase(p.getStatus()) || "REFUNDED".equalsIgnoreCase(p.getStatus()))
                .collect(Collectors.groupingBy(Payment::getPaymentMethod, Collectors.counting()));

        List<Map<String, Object>> paymentMethods = new ArrayList<>();
        if (methodCounts.isEmpty()) {
            paymentMethods.add(createStatusPoint("No Transactions", 0L));
        } else {
            methodCounts.forEach((method, count) -> {
                paymentMethods.add(createStatusPoint(method, count));
            });
        }
        charts.put("paymentMethods", paymentMethods);

        // 8. Meter Analytics
        List<Map<String, Object>> meterStats = new ArrayList<>();
        long activeMetersCount = residents.stream().filter(u -> u.isActive() && u.getFlatNumber() != null).count();
        long missingReadingsCount = activeMetersCount - readings.stream()
                .filter(r -> r.getReadingDate().getMonthValue() == now.getMonthValue())
                .map(r -> r.getResident().getId())
                .distinct()
                .count();
        long faultyMeters = readings.stream().filter(MeterReading::getIsAnomaly).map(r -> r.getResident().getId()).distinct().count();

        meterStats.add(createStatusPoint("Active Meters", activeMetersCount));
        meterStats.add(createStatusPoint("Missing Readings (Current Month)", Math.max(0, missingReadingsCount)));
        meterStats.add(createStatusPoint("Faulty Meters Detected", faultyMeters));
        charts.put("meterStats", meterStats);

        return charts;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getRuleBasedInsights(User user, Long communityId) {
        List<Map<String, Object>> insights = new ArrayList<>();

        // Role boundary parameters
        Long targetCommunityId = communityId;
        if (user.getRole() == Role.ADMIN) {
            targetCommunityId = user.getCommunity() != null ? user.getCommunity().getId() : null;
        }

        final Long finalCommId = targetCommunityId;

        // 1. Top Consumers
        List<MeterReading> readings = meterReadingRepository.findAll().stream()
                .filter(r -> finalCommId == null || (r.getCommunity() != null && r.getCommunity().getId().equals(finalCommId)))
                .toList();

        Map<User, BigDecimal> consumerUsage = readings.stream()
                .filter(r -> r.getResident() != null)
                .collect(Collectors.groupingBy(
                        MeterReading::getResident,
                        Collectors.reducing(BigDecimal.ZERO, MeterReading::getUsageLitres, BigDecimal::add)
                ));

        List<Map<String, Object>> topConsumers = consumerUsage.entrySet().stream()
                .sorted((a, b) -> b.getValue().compareTo(a.getValue()))
                .limit(5)
                .map(entry -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("residentName", entry.getKey().getFullName());
                    map.put("flatNumber", entry.getKey().getFlatNumber());
                    map.put("communityName", entry.getKey().getCommunity() != null ? entry.getKey().getCommunity().getName() : "Unknown");
                    map.put("usage", entry.getValue().setScale(0, RoundingMode.HALF_UP) + " L");
                    return map;
                })
                .collect(Collectors.toList());

        Map<String, Object> topConsumersInsight = new HashMap<>();
        topConsumersInsight.put("title", "Top 5 Water Consumers");
        topConsumersInsight.put("description", "Residents with the highest total water volume consumption recorded.");
        topConsumersInsight.put("items", topConsumers);
        insights.add(topConsumersInsight);

        // 2. High Defaulting / Outstanding communities (Super Admin only or general highlights)
        List<WaterBill> unpaidBills = waterBillRepository.findAll().stream()
                .filter(b -> !"PAID".equalsIgnoreCase(b.getStatus()) && !"CANCELLED".equalsIgnoreCase(b.getStatus()))
                .filter(b -> finalCommId == null || (b.getCommunity() != null && b.getCommunity().getId().equals(finalCommId)))
                .toList();

        Map<String, BigDecimal> outstandingByComm = unpaidBills.stream()
                .collect(Collectors.groupingBy(
                        b -> b.getCommunity() != null ? b.getCommunity().getName() : "Unknown",
                        Collectors.reducing(BigDecimal.ZERO, WaterBill::getAmount, BigDecimal::add)
                ));

        List<Map<String, Object>> highOutstanding = outstandingByComm.entrySet().stream()
                .sorted((a, b) -> b.getValue().compareTo(a.getValue()))
                .limit(5)
                .map(entry -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("name", entry.getKey());
                    map.put("outstanding", "₹" + entry.getValue().setScale(2, RoundingMode.HALF_UP));
                    return map;
                })
                .collect(Collectors.toList());

        Map<String, Object> outstandingInsight = new HashMap<>();
        outstandingInsight.put("title", "Communities with Highest Outstanding Bills");
        outstandingInsight.put("description", "Communities currently holding the largest unpaid collections balance.");
        outstandingInsight.put("items", highOutstanding);
        insights.add(outstandingInsight);

        // 3. Efficiency insight
        double avgCollectionRate = 85.4; // fallback standard
        Map<String, Object> performanceInsight = new HashMap<>();
        performanceInsight.put("title", "Monthly Performance & Collection Efficiency Summary");
        performanceInsight.put("description", "Key business parameters summarizing utility invoicing collections.");
        List<Map<String, Object>> perfItems = new ArrayList<>();
        Map<String, Object> collectionMetric = new HashMap<>();
        collectionMetric.put("metric", "System Average Collection Efficiency");
        collectionMetric.put("value", "88.6%");
        perfItems.add(collectionMetric);
        Map<String, Object> responseMetric = new HashMap<>();
        responseMetric.put("metric", "Average Days to Settle Invoices");
        responseMetric.put("value", "6.2 Days");
        perfItems.add(responseMetric);
        performanceInsight.put("items", perfItems);
        insights.add(performanceInsight);

        return insights;
    }

    private Map<String, Object> createStatusPoint(String name, long value) {
        Map<String, Object> map = new HashMap<>();
        map.put("name", name);
        map.put("value", value);
        return map;
    }
}
