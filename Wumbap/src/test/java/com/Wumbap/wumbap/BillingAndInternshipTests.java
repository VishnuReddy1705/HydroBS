package com.wumbap.wumbap;

import com.wumbap.wumbap.dto.BillGenerationRequest;
import com.wumbap.wumbap.entity.*;
import com.wumbap.wumbap.repository.*;
import com.wumbap.wumbap.service.BillingEngineService;
import com.wumbap.wumbap.service.CycleSchedulerService;
import com.wumbap.wumbap.service.LeakDetectionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

public class BillingAndInternshipTests {

    @Mock
    private WaterBillRepository waterBillRepository;
    @Mock
    private TariffRepository tariffRepository;
    @Mock
    private BillRevisionRepository billRevisionRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private CommunityRepository communityRepository;
    @Mock
    private MeterReadingRepository meterReadingRepository;
    @Mock
    private NotificationRepository notificationRepository;
    @Mock
    private AuditLogRepository auditLogRepository;
    @Mock
    private BillingCycleRepository billingCycleRepository;
    @Mock
    private BulkWaterPurchaseRepository bulkWaterPurchaseRepository;

    @InjectMocks
    private BillingEngineService billingEngineService;

    @InjectMocks
    private LeakDetectionService leakDetectionService;

    @BeforeEach
    public void setup() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    public void testSlabTariffCalculationLogic() {
        // Arrange
        User resident = User.builder()
                .id(1L)
                .fullName("John Doe")
                .email("john@example.com")
                .role(Role.RESIDENT)
                .flatArea(BigDecimal.valueOf(1000))
                .build();
        
        Community community = Community.builder()
                .id(1L)
                .name("Community A")
                .build();
        
        Tariff tariff = Tariff.builder()
                .id(1L)
                .community(community)
                .model("SLAB")
                .baseCharge(BigDecimal.valueOf(50))
                .serviceCharge(BigDecimal.valueOf(10))
                .taxPercentage(BigDecimal.valueOf(5))
                .dueDays(15)
                .isActive(true)
                .build();

        TariffSlab slab1 = TariffSlab.builder().tariff(tariff).rangeStart(BigDecimal.ZERO).rangeEnd(BigDecimal.valueOf(100)).ratePerUnit(BigDecimal.valueOf(2)).build();
        TariffSlab slab2 = TariffSlab.builder().tariff(tariff).rangeStart(BigDecimal.valueOf(100)).rangeEnd(null).ratePerUnit(BigDecimal.valueOf(5)).build();
        tariff.setSlabs(List.of(slab1, slab2));

        // For usage of 150 Litres:
        // Slab 1 (0 to 100): 100 * 2 = 200
        // Slab 2 (100+): (150 - 100) * 5 = 250
        // Total consumption charge = 450
        // Subtotal = 450 + 50 (base) + 10 (service) = 510
        // Tax = 510 * 0.05 = 25.50
        // Net amount = 535.50

        when(tariffRepository.findByCommunityIdAndIsActiveTrue(anyLong())).thenReturn(Optional.of(tariff));
        when(waterBillRepository.findByResidentIdAndBillingMonth(anyLong(), any())).thenReturn(Optional.empty());

        MeterReading reading = MeterReading.builder()
                .resident(resident)
                .readingDate(LocalDate.of(2026, 6, 15))
                .usageLitres(BigDecimal.valueOf(150))
                .currentReading(BigDecimal.valueOf(200))
                .build();
        when(meterReadingRepository.findByResidentIdOrderByReadingDateDesc(anyLong())).thenReturn(List.of(reading));
        when(waterBillRepository.save(any(WaterBill.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        WaterBill bill = billingEngineService.generateSingleResidentBill(resident, community, LocalDate.of(2026, 6, 1), "ADMIN", "Test Note", false);

        // Assert
        assertNotNull(bill);
        assertEquals(BigDecimal.valueOf(150), bill.getTotalUsage());
        assertEquals("SLAB", bill.getTariffModel());
        assertEquals(BigDecimal.valueOf(535.50).setScale(2), bill.getAmount());
    }

    @Test
    public void testProportionalCostAllocationDistribution() {
        // Arrange
        BillingCycle cycle = BillingCycle.builder()
                .id(1L)
                .community(Community.builder().id(1L).name("Comm A").build())
                .startDate(LocalDate.of(2026, 6, 1))
                .endDate(LocalDate.of(2026, 6, 30))
                .status("ACTIVE")
                .name("June 2026")
                .build();

        BulkWaterPurchase purchase = BulkWaterPurchase.builder()
                .id(1L)
                .community(cycle.getCommunity())
                .supplier("Municipal Tankers")
                .volumeLitres(BigDecimal.valueOf(10000))
                .unitCost(BigDecimal.valueOf(1))
                .totalCost(BigDecimal.valueOf(10000))
                .invoiceReference("REF-001")
                .billingCycle(cycle)
                .build();

        User r1 = User.builder().id(1L).fullName("Res A").role(Role.RESIDENT).community(cycle.getCommunity()).familySize(2).flatArea(BigDecimal.valueOf(1000)).build();
        User r2 = User.builder().id(2L).fullName("Res B").role(Role.RESIDENT).community(cycle.getCommunity()).familySize(4).flatArea(BigDecimal.valueOf(1200)).build();

        when(billingCycleRepository.findById(1L)).thenReturn(Optional.of(cycle));
        when(bulkWaterPurchaseRepository.findByBillingCycleId(1L)).thenReturn(List.of(purchase));
        when(userRepository.findAll()).thenReturn(List.of(r1, r2));

        // Mock usage for R1 and R2
        MeterReading mr1 = MeterReading.builder().resident(r1).readingDate(LocalDate.of(2026, 6, 10)).usageLitres(BigDecimal.valueOf(300)).build();
        MeterReading mr2 = MeterReading.builder().resident(r2).readingDate(LocalDate.of(2026, 6, 10)).usageLitres(BigDecimal.valueOf(700)).build();

        when(meterReadingRepository.findByResidentIdOrderByReadingDateDesc(1L)).thenReturn(List.of(mr1));
        when(meterReadingRepository.findByResidentIdOrderByReadingDateDesc(2L)).thenReturn(List.of(mr2));
        
        // Active tariff settings: fallback Method = OCCUPANCY, sharedAreaPct = 10%
        Tariff tariff = Tariff.builder()
                .community(cycle.getCommunity())
                .isActive(true)
                .fallbackMethod("OCCUPANCY")
                .sharedAreaPercentage(BigDecimal.valueOf(10))
                .serviceCharge(BigDecimal.ZERO)
                .maintenanceCharge(BigDecimal.ZERO)
                .sewageCharge(BigDecimal.ZERO)
                .dueDays(15)
                .build();
        when(tariffRepository.findByCommunityId(anyLong())).thenReturn(List.of(tariff));

        // Calculation check:
        // Total cost = 10,000
        // Shared area cost (10%) = 1,000 (divided equally: 500 each)
        // Individual cost = 9,000 (R1 usage: 300, R2 usage: 700. Total usage = 1000)
        // R1 Individual share = 9,000 * 300 / 1000 = 2,700
        // R2 Individual share = 9,000 * 700 / 1000 = 6,300
        // R1 Bill Total = 2,700 + 500 = 3,200
        // R2 Bill Total = 6,300 + 500 = 6,800
        // Sum = 10,000

        BillGenerationRequest req = BillGenerationRequest.builder()
                .billingCycleId(1L)
                .scope("COMMUNITY")
                .notes("Distributed Run")
                .build();

        // Act
        var bills = billingEngineService.generateBills(req, "ADMIN");

        // Assert
        assertNotNull(bills);
        assertEquals(2, bills.size());
        assertEquals(BigDecimal.valueOf(3200).setScale(2), bills.get(0).getAmount());
        assertEquals(BigDecimal.valueOf(6800).setScale(2), bills.get(1).getAmount());
    }

    @Test
    public void testStatisticalLeakDetectionLogic() {
        // Arrange
        User resident = User.builder()
                .id(1L)
                .fullName("Spike Resident")
                .role(Role.RESIDENT)
                .community(Community.builder().id(1L).build())
                .build();

        // Mock 6 readings
        // Historical: 100 L, 110 L, 90 L, 100 L, 100 L (Mean: 100 L, StdDev: 6.32)
        // Latest: 250 L (Z-Score: (250-100)/6.32 = 23.7 -> Anomalous since Z > 2)
        List<MeterReading> readings = new ArrayList<>();
        readings.add(MeterReading.builder().resident(resident).readingDate(LocalDate.now()).usageLitres(BigDecimal.valueOf(250)).build()); // latest
        readings.add(MeterReading.builder().resident(resident).readingDate(LocalDate.now().minusWeeks(1)).usageLitres(BigDecimal.valueOf(100)).build());
        readings.add(MeterReading.builder().resident(resident).readingDate(LocalDate.now().minusWeeks(2)).usageLitres(BigDecimal.valueOf(110)).build());
        readings.add(MeterReading.builder().resident(resident).readingDate(LocalDate.now().minusWeeks(3)).usageLitres(BigDecimal.valueOf(90)).build());
        readings.add(MeterReading.builder().resident(resident).readingDate(LocalDate.now().minusWeeks(4)).usageLitres(BigDecimal.valueOf(100)).build());
        readings.add(MeterReading.builder().resident(resident).readingDate(LocalDate.now().minusWeeks(5)).usageLitres(BigDecimal.valueOf(100)).build());

        when(userRepository.findAll()).thenReturn(List.of(resident));
        when(meterReadingRepository.findByResidentIdOrderByReadingDateDesc(1L)).thenReturn(readings);
        when(notificationRepository.findAll()).thenReturn(Collections.emptyList());

        // Act
        var anomalies = leakDetectionService.detectAnomalies(1L);

        // Assert
        assertNotNull(anomalies);
        assertEquals(1, anomalies.size());
        assertEquals(BigDecimal.valueOf(250), anomalies.get(0).getLatestUsage());
        assertTrue(anomalies.get(0).getZScore().doubleValue() > 2.0);
    }
}
