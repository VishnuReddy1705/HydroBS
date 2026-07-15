package com.wumbap.wumbap.service;

import com.wumbap.wumbap.entity.MeterReading;
import com.wumbap.wumbap.entity.Notification;
import com.wumbap.wumbap.entity.User;
import com.wumbap.wumbap.repository.MeterReadingRepository;
import com.wumbap.wumbap.repository.NotificationRepository;
import com.wumbap.wumbap.repository.UserRepository;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class LeakDetectionService {

    private final MeterReadingRepository meterReadingRepository;
    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;

    @Data
    @Builder
    public static class AnomalyResult {
        private Long residentId;
        private String residentName;
        private String flatNumber;
        private String building;
        private BigDecimal latestUsage;
        private BigDecimal historicalMean;
        private BigDecimal standardDeviation;
        private BigDecimal zScore;
        private String alertMessage;
    }

    @Transactional
    public List<AnomalyResult> detectAnomalies(Long communityId) {
        log.info("Running statistical leak detection for community: {}", communityId);
        List<User> residents = userRepository.findAll().stream()
                .filter(u -> u.getCommunity() != null 
                        && (communityId == null || u.getCommunity().getId().equals(communityId)) 
                        && u.getRole() == com.wumbap.wumbap.entity.Role.RESIDENT)
                .collect(Collectors.toList());

        List<AnomalyResult> anomalies = new ArrayList<>();

        for (User resident : residents) {
            List<MeterReading> readings = meterReadingRepository.findByResidentIdOrderByReadingDateDesc(resident.getId());
            if (readings.size() < 3) {
                // Not enough history for robust z-score calculation
                continue;
            }

            MeterReading latestReading = readings.get(0);
            BigDecimal latestUsage = latestReading.getUsageLitres();

            // Calculate mean of historical readings (excluding the latest one to test for anomaly)
            List<MeterReading> historicalReadings = readings.subList(1, readings.size());
            double sum = historicalReadings.stream()
                    .mapToDouble(r -> r.getUsageLitres().doubleValue())
                    .sum();
            double mean = sum / historicalReadings.size();

            // Calculate standard deviation
            double varianceSum = historicalReadings.stream()
                    .mapToDouble(r -> Math.pow(r.getUsageLitres().doubleValue() - mean, 2))
                    .sum();
            double stdDev = Math.sqrt(varianceSum / historicalReadings.size());

            if (stdDev <= 0.1) {
                // Avoid division by zero or division by tiny variance (e.g. constant usage)
                continue;
            }

            double zScore = (latestUsage.doubleValue() - mean) / stdDev;

            // Flag if usage is > 2 standard deviations above historical mean
            if (zScore > 2.0) {
                String message = String.format("Potential water leak detected. Latest usage of %.2f L is abnormally high compared to historical mean of %.2f L (Z-Score: %.2f, StdDev: %.2f)", 
                        latestUsage, mean, zScore, stdDev);
                
                AnomalyResult anomaly = AnomalyResult.builder()
                        .residentId(resident.getId())
                        .residentName(resident.getFullName())
                        .flatNumber(resident.getFlatNumber())
                        .building(resident.getBuilding())
                        .latestUsage(latestUsage)
                        .historicalMean(BigDecimal.valueOf(mean).setScale(2, RoundingMode.HALF_UP))
                        .standardDeviation(BigDecimal.valueOf(stdDev).setScale(2, RoundingMode.HALF_UP))
                        .zScore(BigDecimal.valueOf(zScore).setScale(2, RoundingMode.HALF_UP))
                        .alertMessage(message)
                        .build();

                anomalies.add(anomaly);

                // Create alert notification if not already created recently
                boolean alreadyNotified = notificationRepository.findAll().stream()
                        .filter(n -> n.getUser().getId().equals(resident.getId()) && "SPIKE_DETECTED".equals(n.getType()))
                        .anyMatch(n -> n.getCreatedAt().isAfter(LocalDateTime.now().minusDays(3)));

                if (!alreadyNotified) {
                    notificationRepository.save(Notification.builder()
                            .user(resident)
                            .community(resident.getCommunity())
                            .title("Water Leak Alert")
                            .message(message)
                            .type("SPIKE_DETECTED")
                            .isRead(false)
                            .createdAt(LocalDateTime.now())
                            .build());
                }
            }
        }

        return anomalies;
    }
}
