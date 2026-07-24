package com.wumbap.wumbap.service;

import com.wumbap.wumbap.entity.*;
import com.wumbap.wumbap.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.TemporalAdjusters;
import java.time.temporal.WeekFields;
import java.util.List;
import java.util.Locale;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class CycleSchedulerService {

    private final UserRepository userRepository;
    private final CommunityRepository communityRepository;
    private final MeterReadingRepository meterReadingRepository;
    private final UsageArchiveRepository usageArchiveRepository;
    private final CalendarEventRepository calendarEventRepository;
    private final NotificationRepository notificationRepository;
    private final BillingEngineService billingEngineService;
    private final LeakDetectionService leakDetectionService;
    private final BillingCycleRepository billingCycleRepository;
    private final WaterBillRepository waterBillRepository;
    private final EmailService emailService;

    // Run every Sunday at midnight (Weekly snapshot)
    @Scheduled(cron = "0 0 0 * * SUN")
    @Transactional
    public void runWeeklyArchive() {
        LocalDate today = LocalDate.now();
        LocalDate lastSunday = today.minusWeeks(1).with(TemporalAdjusters.previousOrSame(DayOfWeek.SUNDAY));
        LocalDate lastSaturday = lastSunday.plusDays(6);
        int weekNum = lastSunday.get(WeekFields.of(Locale.getDefault()).weekOfYear());
        String periodId = lastSunday.getYear() + "-W" + weekNum;

        log.info("Starting weekly cycle archive for period: {}", periodId);
        archivePeriod(lastSunday, lastSaturday, "WEEK", periodId);
    }

    // Run 1st of every month at midnight (Monthly snapshot)
    @Scheduled(cron = "0 0 0 1 * *")
    @Transactional
    public void runMonthlyArchive() {
        LocalDate today = LocalDate.now();
        LocalDate firstDayOfLastMonth = today.minusMonths(1).withDayOfMonth(1);
        LocalDate lastDayOfLastMonth = firstDayOfLastMonth.plusMonths(1).minusDays(1);
        String periodId = firstDayOfLastMonth.getYear() + "-" + String.format("%02d", firstDayOfLastMonth.getMonthValue());

        log.info("Starting monthly cycle archive for period: {}", periodId);
        archivePeriod(firstDayOfLastMonth, lastDayOfLastMonth, "MONTH", periodId);
    }

    // Run 1st of every year at midnight (Yearly snapshot)
    @Scheduled(cron = "0 0 0 1 1 *")
    @Transactional
    public void runYearlyArchive() {
        LocalDate today = LocalDate.now();
        LocalDate firstDayOfLastYear = today.minusYears(1).withDayOfYear(1);
        LocalDate lastDayOfLastYear = firstDayOfLastYear.plusYears(1).minusDays(1);
        String periodId = String.valueOf(firstDayOfLastYear.getYear());

        log.info("Starting yearly cycle archive for period: {}", periodId);
        archivePeriod(firstDayOfLastYear, lastDayOfLastYear, "YEAR", periodId);
    }

    @Transactional
    public void archivePeriod(LocalDate start, LocalDate end, String periodType, String periodId) {
        List<Community> communities = communityRepository.findAll();
        long daysCount = start.until(end).getDays() + 1;
        BigDecimal days = new BigDecimal(daysCount);

        for (Community community : communities) {
            // Find all residents in community
            List<User> residents = userRepository.findAll().stream()
                    .filter(u -> u.getCommunity() != null 
                            && u.getCommunity().getId().equals(community.getId()) 
                            && u.getRole() == Role.RESIDENT)
                    .toList();

            BigDecimal communityTotal = BigDecimal.ZERO;

            for (User resident : residents) {
                List<MeterReading> readings = meterReadingRepository.findByResidentIdOrderByReadingDateDesc(resident.getId()).stream()
                        .filter(r -> !r.getReadingDate().isBefore(start) && !r.getReadingDate().isAfter(end))
                        .toList();

                if (readings.isEmpty()) {
                    continue;
                }

                BigDecimal totalUsage = readings.stream()
                        .map(MeterReading::getUsageLitres)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);

                BigDecimal avgDaily = totalUsage.divide(days, 2, RoundingMode.HALF_UP);

                BigDecimal peak = readings.stream()
                        .map(MeterReading::getUsageLitres)
                        .max(BigDecimal::compareTo)
                        .orElse(BigDecimal.ZERO);

                BigDecimal lowest = readings.stream()
                        .map(MeterReading::getUsageLitres)
                        .min(BigDecimal::compareTo)
                        .orElse(BigDecimal.ZERO);

                communityTotal = communityTotal.add(totalUsage);

                // Save resident snapshot
                UsageArchive archive = UsageArchive.builder()
                        .community(community)
                        .resident(resident)
                        .periodType(periodType)
                        .periodIdentifier(periodId)
                        .totalUsageLitres(totalUsage)
                        .averageDailyUsage(avgDaily)
                        .peakUsageLitres(peak)
                        .lowestUsageLitres(lowest)
                        .build();

                usageArchiveRepository.save(archive);

                // Send notification to resident
                Notification notification = Notification.builder()
                        .user(resident)
                        .community(community)
                        .title(periodType + " Usage Archived")
                        .message("Your consumption for " + periodId + " has been archived. Total usage was: " + totalUsage + " L.")
                        .type("REPORT_READY")
                        .build();
                notificationRepository.save(notification);
            }

            // Save community snapshot (resident_id is null)
            BigDecimal communityAvg = residents.isEmpty() ? BigDecimal.ZERO : 
                    communityTotal.divide(new BigDecimal(residents.size()), 2, RoundingMode.HALF_UP);

            UsageArchive commArchive = UsageArchive.builder()
                    .community(community)
                    .resident(null)
                    .periodType(periodType)
                    .periodIdentifier(periodId)
                    .totalUsageLitres(communityTotal)
                    .averageDailyUsage(communityAvg.divide(days, 2, RoundingMode.HALF_UP))
                    .build();
            usageArchiveRepository.save(commArchive);

            // Save Calendar timeline milestone event
            try {
                if (community != null) {
                    CalendarEvent event = CalendarEvent.builder()
                            .community(community)
                            .title(periodType + " Cycle Completed")
                            .description("Usage statistics archived for cycle " + periodId + ". Total community consumption: " + communityTotal + " L.")
                            .eventDate(end)
                            .eventType("REMINDER")
                            .createdAt(LocalDateTime.now())
                            .build();
                    calendarEventRepository.save(event);
                }
            } catch (Exception e) {
                log.error("Failed to save archive cycle calendar event: {}", e.getMessage());
            }
        }
        log.info("Completed cycle archiving for period type: {} (ID: {})", periodType, periodId);
    }

    // Run Daily at Midnight to analyze usage & check for high usage alerts
    @Scheduled(cron = "0 0 0 * * *")
    @Transactional
    public void runDailyUsageAnalysis() {
        log.info("Starting scheduled daily usage analysis");
        List<User> residents = userRepository.findAll().stream()
                .filter(u -> u.getRole() == Role.RESIDENT)
                .toList();

        for (User resident : residents) {
            List<MeterReading> readings = meterReadingRepository.findByResidentIdOrderByReadingDateDesc(resident.getId());
            if (readings.isEmpty()) continue;

            MeterReading latest = readings.get(0);
            // If the latest reading is within the last 24 hours and exceeds 1000 Litres
            if (latest.getReadingDate() != null && latest.getReadingDate().isAfter(LocalDate.now().minusDays(1))) {
                if (latest.getUsageLitres() != null && latest.getUsageLitres().compareTo(new BigDecimal("1000.00")) > 0) {
                    notificationRepository.save(Notification.builder()
                            .user(resident)
                            .community(resident.getCommunity())
                            .title("High Daily Water Usage Alert")
                            .message("Your daily water usage is unusually high: " + latest.getUsageLitres() + " L. Please check if any taps are left open.")
                            .type("HIGH_USAGE")
                            .build());
                }
            }
        }
    }

    // Run Weekly at 1 AM every Sunday for Statistical Leak Anomaly Detection
    @Scheduled(cron = "0 0 1 * * SUN")
    @Transactional
    public void runWeeklyLeakDetection() {
        log.info("Starting scheduled weekly leak detection");
        leakDetectionService.detectAnomalies(null); // NULL detects anomalies across all communities
    }

    // Run Monthly at 2 AM on the 1st of every month for Auto Bill Generation & Cycle Finalization
    @Scheduled(cron = "0 0 2 1 * *")
    @Transactional
    public void runMonthlyBillGenerationAndCycleFinalization() {
        log.info("Starting scheduled monthly bill generation and cycle finalization");
        
        // Find all ACTIVE cycles that have passed their end dates
        List<BillingCycle> activeCycles = billingCycleRepository.findByStatus("ACTIVE").stream()
                .filter(c -> c.getEndDate().isBefore(LocalDate.now()))
                .toList();

        for (BillingCycle cycle : activeCycles) {
            try {
                // Auto generate bills if not already generated
                com.wumbap.wumbap.dto.BillGenerationRequest request = com.wumbap.wumbap.dto.BillGenerationRequest.builder()
                        .billingCycleId(cycle.getId())
                        .notes("Auto-generated monthly billing run")
                        .build();

                billingEngineService.generateBills(request, "SYSTEM");

                // Finalize the billing cycle
                cycle.setStatus("FINALIZED");
                billingCycleRepository.save(cycle);
                log.info("Automatically finalized billing cycle: {}", cycle.getName());

                // Create timeline reminder
                calendarEventRepository.save(CalendarEvent.builder()
                        .community(cycle.getCommunity())
                        .title("Cycle Finalized: " + cycle.getName())
                        .description("Billing cycle auto-generated and transitioned to FINALIZED status.")
                        .eventDate(LocalDate.now())
                        .eventType("REMINDER")
                        .build());

            } catch (Exception e) {
                log.error("Failed to auto-generate bills/finalize cycle for cycle {}: {}", cycle.getId(), e.getMessage());
            }
        }
    }

    // Run Hourly at top of the hour to dispatch emails for generated bills
    @Scheduled(cron = "0 0 * * * *")
    @Transactional
    public void runEmailDispatch() {
        log.info("Starting scheduled hourly email dispatch");
        List<WaterBill> unsentBills = waterBillRepository.findAll().stream()
                .filter(b -> "GENERATED".equalsIgnoreCase(b.getStatus()))
                .toList();

        for (WaterBill bill : unsentBills) {
            try {
                emailService.sendWaterBillEmail(bill);
                bill.setStatus("SENT");
                waterBillRepository.save(bill);
            } catch (Exception e) {
                log.error("Failed to send bill email for bill {}: {}", bill.getId(), e.getMessage());
            }
        }
    }

    // Run Daily at 3 AM to cleanup/archive old notifications
    @Scheduled(cron = "0 0 3 * * *")
    @Transactional
    public void runNotificationCleanup() {
        log.info("Starting scheduled notification archive/cleanup");
        LocalDateTime limit = LocalDateTime.now().minusDays(30);
        List<Notification> oldNotifications = notificationRepository.findAll().stream()
                .filter(n -> n.getCreatedAt().isBefore(limit) && !n.isArchived())
                .toList();

        for (Notification n : oldNotifications) {
            n.setArchived(true);
            notificationRepository.save(n);
        }
        log.info("Archived {} old notifications", oldNotifications.size());
    }
}
