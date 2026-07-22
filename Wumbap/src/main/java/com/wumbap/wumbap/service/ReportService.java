package com.wumbap.wumbap.service;

import com.lowagie.text.Document;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.FontFactory;
import com.lowagie.text.Element;
import com.lowagie.text.Phrase;
import com.lowagie.text.DocumentException;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import com.wumbap.wumbap.entity.*;
import com.wumbap.wumbap.repository.*;
import lombok.RequiredArgsConstructor;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVPrinter;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.BorderStyle;
import com.lowagie.text.Font;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.PrintWriter;
import java.io.StringWriter;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.ArrayList;
import java.util.Map;
import java.util.HashMap;
import java.util.TreeMap;
import java.util.Locale;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final UserRepository userRepository;
    private final CommunityRepository communityRepository;
    private final WaterBillRepository waterBillRepository;
    private final MeterReadingRepository meterReadingRepository;
    private final PaymentRepository paymentRepository;
    private final AuditLogRepository auditLogRepository;
    private final BillingCycleRepository billingCycleRepository;

    public Map<String, Object> generateReportData(
            String reportType,
            String frequency,
            int year,
            Integer month,
            Integer quarter,
            Long communityId
    ) {
        return generateReportData(reportType, frequency, year, month, quarter, communityId, null, null, null, null, null, null, null, null);
    }

    public Map<String, Object> generateReportData(
            String reportType,
            String frequency,
            int year,
            Integer month,
            Integer quarter,
            Long communityId,
            LocalDate startDate,
            LocalDate endDate,
            String building,
            Long residentId,
            Long billingCycleId,
            String paymentStatus,
            BigDecimal minUsage,
            BigDecimal maxUsage
    ) {
        Map<String, Object> data = new HashMap<>();
        String timeSpan = (startDate != null || endDate != null) 
                ? (startDate != null ? startDate.toString() : "Beginning") + " to " + (endDate != null ? endDate.toString() : "Present")
                : frequency.toUpperCase() + " - " + year;
        String title = reportType.toUpperCase() + " REPORT (" + timeSpan + ")";
        data.put("title", title);

        // Fetch primary pools
        List<WaterBill> bills = waterBillRepository.findAll().stream()
                .filter(b -> {
                    if (startDate != null && endDate != null) {
                        return !b.getBillingMonth().isBefore(startDate) && !b.getBillingMonth().isAfter(endDate);
                    } else if (startDate != null) {
                        return !b.getBillingMonth().isBefore(startDate);
                    } else if (endDate != null) {
                        return !b.getBillingMonth().isAfter(endDate);
                    } else {
                        return b.getBillingMonth().getYear() == year;
                    }
                })
                .filter(b -> communityId == null || (b.getCommunity() != null && b.getCommunity().getId().equals(communityId)))
                .filter(b -> billingCycleId == null || (b.getBillingCycle() != null && b.getBillingCycle().getId().equals(billingCycleId)))
                .filter(b -> paymentStatus == null || paymentStatus.isEmpty() || paymentStatus.equalsIgnoreCase(b.getStatus()))
                .filter(b -> residentId == null || (b.getResident() != null && b.getResident().getId().equals(residentId)))
                .filter(b -> building == null || building.isEmpty() || (b.getResident() != null && building.equalsIgnoreCase(b.getResident().getBuilding())))
                .toList();

        List<MeterReading> readings = meterReadingRepository.findAll().stream()
                .filter(r -> {
                    if (startDate != null && endDate != null) {
                        return !r.getReadingDate().isBefore(startDate) && !r.getReadingDate().isAfter(endDate);
                    } else if (startDate != null) {
                        return !r.getReadingDate().isBefore(startDate);
                    } else if (endDate != null) {
                        return !r.getReadingDate().isAfter(endDate);
                    } else {
                        return r.getReadingDate().getYear() == year;
                    }
                })
                .filter(r -> communityId == null || (r.getCommunity() != null && r.getCommunity().getId().equals(communityId)))
                .filter(r -> residentId == null || (r.getResident() != null && r.getResident().getId().equals(residentId)))
                .filter(r -> building == null || building.isEmpty() || (r.getResident() != null && building.equalsIgnoreCase(r.getResident().getBuilding())))
                .filter(r -> minUsage == null || (r.getUsageLitres() != null && r.getUsageLitres().compareTo(minUsage) >= 0))
                .filter(r -> maxUsage == null || (r.getUsageLitres() != null && r.getUsageLitres().compareTo(maxUsage) <= 0))
                .toList();

        List<User> residents = userRepository.findAll().stream()
                .filter(u -> u.getRole() == Role.RESIDENT)
                .filter(u -> communityId == null || (u.getCommunity() != null && u.getCommunity().getId().equals(communityId)))
                .filter(u -> residentId == null || u.getId().equals(residentId))
                .filter(u -> building == null || building.isEmpty() || building.equalsIgnoreCase(u.getBuilding()))
                .toList();

        // Apply Month/Quarter filter to bills ONLY if no specific custom date range is set
        if (startDate == null && endDate == null) {
            if ("MONTHLY".equalsIgnoreCase(frequency) && month != null) {
                bills = bills.stream().filter(b -> b.getBillingMonth().getMonthValue() == month).toList();
            } else if ("QUARTERLY".equalsIgnoreCase(frequency) && quarter != null) {
                int startM = (quarter - 1) * 3 + 1;
                int endM = quarter * 3;
                bills = bills.stream().filter(b -> b.getBillingMonth().getMonthValue() >= startM && b.getBillingMonth().getMonthValue() <= endM).toList();
            }
        }

        List<String> headers = new ArrayList<>();
        List<List<Object>> rows = new ArrayList<>();
        List<Map<String, Object>> chartData = new ArrayList<>();
        Map<String, Object> summary = new HashMap<>();

        if ("REVENUE".equalsIgnoreCase(reportType)) {
            headers.addAll(List.of("Billing Cycle", "Community Name", "Total Usage (L)", "Base Rate", "Gross Billed (₹)", "Paid Amount (₹)", "Outstanding (₹)", "Bills Count"));
            
            BigDecimal totalUsage = BigDecimal.ZERO;
            BigDecimal grossBilled = BigDecimal.ZERO;
            BigDecimal paidAmt = BigDecimal.ZERO;
            BigDecimal outstandingAmt = BigDecimal.ZERO;

            Map<String, Map<String, Object>> cycleAgg = new TreeMap<>();
            for (WaterBill b : bills) {
                String cycleKey = b.getBillingMonth().format(DateTimeFormatter.ofPattern("yyyy-MM"));
                String commName = b.getCommunity() != null ? b.getCommunity().getName() : "Unknown";
                String aggKey = cycleKey + " | " + commName;

                cycleAgg.putIfAbsent(aggKey, new HashMap<>());
                Map<String, Object> cell = cycleAgg.get(aggKey);
                cell.put("cycle", cycleKey);
                cell.put("commName", commName);
                cell.put("usage", ((BigDecimal) cell.getOrDefault("usage", BigDecimal.ZERO)).add(b.getTotalUsage() != null ? b.getTotalUsage() : BigDecimal.ZERO));
                cell.put("billed", ((BigDecimal) cell.getOrDefault("billed", BigDecimal.ZERO)).add(b.getAmount() != null ? b.getAmount() : BigDecimal.ZERO));
                
                BigDecimal paid = "PAID".equalsIgnoreCase(b.getStatus()) ? b.getAmount() : BigDecimal.ZERO;
                BigDecimal unpaid = "UNPAID".equalsIgnoreCase(b.getStatus()) ? b.getAmount() : BigDecimal.ZERO;
                cell.put("paid", ((BigDecimal) cell.getOrDefault("paid", BigDecimal.ZERO)).add(paid));
                cell.put("outstanding", ((BigDecimal) cell.getOrDefault("outstanding", BigDecimal.ZERO)).add(unpaid));
                cell.put("count", ((Integer) cell.getOrDefault("count", 0)) + 1);
            }

            for (Map.Entry<String, Map<String, Object>> entry : cycleAgg.entrySet()) {
                Map<String, Object> val = entry.getValue();
                BigDecimal usage = (BigDecimal) val.get("usage");
                BigDecimal billed = (BigDecimal) val.get("billed");
                BigDecimal paid = (BigDecimal) val.get("paid");
                BigDecimal outstanding = (BigDecimal) val.get("outstanding");
                Integer count = (Integer) val.get("count");

                rows.add(List.of(
                        val.get("cycle"),
                        val.get("commName"),
                        usage.setScale(0, RoundingMode.HALF_UP) + " L",
                        "₹5.00 / L",
                        "₹" + billed.setScale(2, RoundingMode.HALF_UP),
                        "₹" + paid.setScale(2, RoundingMode.HALF_UP),
                        "₹" + outstanding.setScale(2, RoundingMode.HALF_UP),
                        count + " bills"
                ));

                totalUsage = totalUsage.add(usage);
                grossBilled = grossBilled.add(billed);
                paidAmt = paidAmt.add(paid);
                outstandingAmt = outstandingAmt.add(outstanding);

                Map<String, Object> chartPoint = new HashMap<>();
                chartPoint.put("name", val.get("cycle"));
                chartPoint.put("billed", billed.setScale(2, RoundingMode.HALF_UP));
                chartPoint.put("paid", paid.setScale(2, RoundingMode.HALF_UP));
                chartPoint.put("outstanding", outstanding.setScale(2, RoundingMode.HALF_UP));
                chartData.add(chartPoint);
            }

            summary.put("totalUsage", totalUsage.setScale(0, RoundingMode.HALF_UP) + " L");
            summary.put("grossBilled", "₹" + grossBilled.setScale(2, RoundingMode.HALF_UP));
            summary.put("paidAmount", "₹" + paidAmt.setScale(2, RoundingMode.HALF_UP));
            summary.put("outstandingAmount", "₹" + outstandingAmt.setScale(2, RoundingMode.HALF_UP));

        } else if ("COLLECTION".equalsIgnoreCase(reportType)) {
            headers.addAll(List.of("Community Name", "Billed Target (₹)", "Collected Dues (₹)", "Outstanding Balance (₹)", "Collection Efficiency (%)", "Paid Bills", "Unpaid Bills"));

            Map<String, Map<String, Object>> commAgg = new HashMap<>();
            for (WaterBill b : bills) {
                String commName = b.getCommunity() != null ? b.getCommunity().getName() : "Unknown";
                commAgg.putIfAbsent(commName, new HashMap<>());
                Map<String, Object> cell = commAgg.get(commName);
                cell.put("commName", commName);
                cell.put("billed", ((BigDecimal) cell.getOrDefault("billed", BigDecimal.ZERO)).add(b.getAmount()));
                
                BigDecimal paid = "PAID".equalsIgnoreCase(b.getStatus()) ? b.getAmount() : BigDecimal.ZERO;
                BigDecimal unpaid = "UNPAID".equalsIgnoreCase(b.getStatus()) ? b.getAmount() : BigDecimal.ZERO;
                cell.put("paid", ((BigDecimal) cell.getOrDefault("paid", BigDecimal.ZERO)).add(paid));
                cell.put("outstanding", ((BigDecimal) cell.getOrDefault("outstanding", BigDecimal.ZERO)).add(unpaid));
                
                int pCount = "PAID".equalsIgnoreCase(b.getStatus()) ? 1 : 0;
                int uCount = "UNPAID".equalsIgnoreCase(b.getStatus()) ? 1 : 0;
                cell.put("pCount", ((Integer) cell.getOrDefault("pCount", 0)) + pCount);
                cell.put("uCount", ((Integer) cell.getOrDefault("uCount", 0)) + uCount);
            }

            BigDecimal totalBilled = BigDecimal.ZERO;
            BigDecimal totalCollected = BigDecimal.ZERO;

            for (Map.Entry<String, Map<String, Object>> entry : commAgg.entrySet()) {
                Map<String, Object> val = entry.getValue();
                BigDecimal billed = (BigDecimal) val.get("billed");
                BigDecimal paid = (BigDecimal) val.get("paid");
                BigDecimal outstanding = (BigDecimal) val.get("outstanding");
                Integer pCount = (Integer) val.get("pCount");
                Integer uCount = (Integer) val.get("uCount");

                BigDecimal efficiency = billed.compareTo(BigDecimal.ZERO) > 0 
                        ? paid.multiply(new BigDecimal("100")).divide(billed, 1, RoundingMode.HALF_UP) 
                        : BigDecimal.ZERO;

                rows.add(List.of(
                        val.get("commName"),
                        "₹" + billed.setScale(2, RoundingMode.HALF_UP),
                        "₹" + paid.setScale(2, RoundingMode.HALF_UP),
                        "₹" + outstanding.setScale(2, RoundingMode.HALF_UP),
                        efficiency + "%",
                        pCount + " invoices",
                        uCount + " invoices"
                ));

                totalBilled = totalBilled.add(billed);
                totalCollected = totalCollected.add(paid);

                Map<String, Object> chartPoint = new HashMap<>();
                chartPoint.put("name", val.get("commName"));
                chartPoint.put("efficiency", efficiency);
                chartPoint.put("collected", paid.setScale(2, RoundingMode.HALF_UP));
                chartPoint.put("outstanding", outstanding.setScale(2, RoundingMode.HALF_UP));
                chartData.add(chartPoint);
            }

            BigDecimal systemEfficiency = totalBilled.compareTo(BigDecimal.ZERO) > 0 
                    ? totalCollected.multiply(new BigDecimal("100")).divide(totalBilled, 1, RoundingMode.HALF_UP) 
                    : BigDecimal.ZERO;

            summary.put("targetBilled", "₹" + totalBilled.setScale(2, RoundingMode.HALF_UP));
            summary.put("collectedAmount", "₹" + totalCollected.setScale(2, RoundingMode.HALF_UP));
            summary.put("efficiency", systemEfficiency + "%");

        } else if ("CONSUMPTION".equalsIgnoreCase(reportType)) {
            headers.addAll(List.of("Resident Name", "Flat Number", "Community Name", "Total Consumption (L)", "Daily Average (L)", "Leak Limit Warnings", "Outstanding Bills"));

            Map<Long, Map<String, Object>> resAgg = new HashMap<>();
            for (MeterReading r : readings) {
                User resident = r.getResident();
                if (resident == null) continue;

                resAgg.putIfAbsent(resident.getId(), new HashMap<>());
                Map<String, Object> cell = resAgg.get(resident.getId());
                cell.put("name", resident.getFullName());
                cell.put("flat", resident.getFlatNumber() != null ? resident.getFlatNumber() : "N/A");
                cell.put("commName", resident.getCommunity() != null ? resident.getCommunity().getName() : "None");
                cell.put("usage", ((BigDecimal) cell.getOrDefault("usage", BigDecimal.ZERO)).add(r.getUsageLitres()));
                
                int warning = r.getUsageLitres().compareTo(new BigDecimal("400")) > 0 ? 1 : 0;
                cell.put("warnings", ((Integer) cell.getOrDefault("warnings", 0)) + warning);
                cell.put("days", ((Integer) cell.getOrDefault("days", 0)) + 1);
            }

            BigDecimal totalUsage = BigDecimal.ZERO;
            long totalWarnings = 0;

            for (Map.Entry<Long, Map<String, Object>> entry : resAgg.entrySet()) {
                Map<String, Object> val = entry.getValue();
                BigDecimal usage = (BigDecimal) val.get("usage");
                Integer warnings = (Integer) val.get("warnings");
                Integer days = (Integer) val.get("days");

                BigDecimal avg = days > 0 ? usage.divide(new BigDecimal(days), 1, RoundingMode.HALF_UP) : BigDecimal.ZERO;
                long unpaidCount = bills.stream()
                        .filter(b -> b.getResident().getId().equals(entry.getKey()) && "UNPAID".equalsIgnoreCase(b.getStatus()))
                        .count();

                rows.add(List.of(
                        val.get("name"),
                        "Flat " + val.get("flat"),
                        val.get("commName"),
                        usage.setScale(0, RoundingMode.HALF_UP) + " L",
                        avg.setScale(1, RoundingMode.HALF_UP) + " L/day",
                        warnings + " alerts",
                        unpaidCount + " pending"
                ));

                totalUsage = totalUsage.add(usage);
                totalWarnings += warnings;

                Map<String, Object> chartPoint = new HashMap<>();
                chartPoint.put("name", val.get("flat"));
                chartPoint.put("usage", usage.setScale(0, RoundingMode.HALF_UP));
                chartPoint.put("avg", avg.setScale(0, RoundingMode.HALF_UP));
                chartData.add(chartPoint);
            }

            summary.put("totalUsage", totalUsage.setScale(0, RoundingMode.HALF_UP) + " L");
            summary.put("activeLeaksBroke", totalWarnings + " warnings");

        } else if ("CUSTOMER".equalsIgnoreCase(reportType)) {
            headers.addAll(List.of("Resident ID", "Resident Name", "Email Address", "Flat Number", "Community Name", "Register Date", "Status"));

            for (User r : residents) {
                String activeStr = r.isActive() ? "Active" : "Deactivated";
                rows.add(List.of(
                        "#" + r.getId(),
                        r.getFullName(),
                        r.getEmail(),
                        r.getFlatNumber() != null ? "Flat " + r.getFlatNumber() : "N/A",
                        r.getCommunity() != null ? r.getCommunity().getName() : "None",
                        r.getCreatedAt() != null ? r.getCreatedAt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd")) : "N/A",
                        activeStr
                ));

                Map<String, Object> chartPoint = new HashMap<>();
                chartPoint.put("name", r.getFullName());
                chartPoint.put("status", r.isActive() ? 1 : 0);
                chartData.add(chartPoint);
            }

            long activeCount = residents.stream().filter(User::isActive).count();
            summary.put("totalCustomers", (long) residents.size());
            summary.put("activeCustomers", activeCount);
            summary.put("deactivatedCustomers", (residents.size() - activeCount));

        } else if ("AUDIT".equalsIgnoreCase(reportType)) {
            headers.addAll(List.of("Timestamp", "User Email", "Action Type", "IP Address", "Details"));
            List<AuditLog> logs = auditLogRepository.findAll().stream()
                    .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                    .filter(log -> residentId == null || (userRepository.findByEmail(log.getUserEmail()).isPresent() && userRepository.findByEmail(log.getUserEmail()).get().getId().equals(residentId)))
                    .limit(200)
                    .toList();

            for (AuditLog l : logs) {
                rows.add(List.of(
                        l.getCreatedAt().toString(),
                        l.getUserEmail(),
                        l.getActionType(),
                        l.getIpAddress(),
                        l.getDetails()
                ));
            }
            summary.put("totalAuditLogsLogged", (long) logs.size());

        } else if ("PAYMENTS".equalsIgnoreCase(reportType)) {
            headers.addAll(List.of("Payment Date", "Invoice Number", "Resident Name", "Flat Number", "Community Name", "Amount (₹)", "Method", "Status"));
            List<Payment> payments = paymentRepository.findAll().stream()
                    .filter(p -> p.getBill() != null && (communityId == null || (p.getBill().getCommunity() != null && p.getBill().getCommunity().getId().equals(communityId))))
                    .toList();

            BigDecimal totalPayments = BigDecimal.ZERO;
            for (Payment p : payments) {
                rows.add(List.of(
                        p.getPaidAt().toString(),
                        p.getBill().getInvoiceNumber(),
                        (p.getBill().getResident() != null) ? p.getBill().getResident().getFullName() : "N/A",
                        (p.getBill().getResident() != null) ? p.getBill().getResident().getFlatNumber() : "N/A",
                        (p.getBill().getCommunity() != null) ? p.getBill().getCommunity().getName() : "N/A",
                        "₹" + p.getAmount().setScale(2, RoundingMode.HALF_UP),
                        p.getPaymentMethod(),
                        p.getStatus()
                ));
                totalPayments = totalPayments.add(p.getAmount());
            }
            summary.put("totalTransactionsCount", (long) payments.size());
            summary.put("consolidatedSettlementValue", "₹" + totalPayments.setScale(2, RoundingMode.HALF_UP));

        } else if ("BILLING".equalsIgnoreCase(reportType)) {
            headers.addAll(List.of("Bill Number", "Invoice", "Month", "Resident", "Flat", "Usage (L)", "Net Amount (₹)", "Due Date", "Status"));
            for (WaterBill b : bills) {
                rows.add(List.of(
                        b.getBillNumber() != null ? b.getBillNumber() : "N/A",
                        b.getInvoiceNumber() != null ? b.getInvoiceNumber() : "N/A",
                        b.getBillingMonth().toString(),
                        (b.getResident() != null) ? b.getResident().getFullName() : "N/A",
                        (b.getResident() != null) ? b.getResident().getFlatNumber() : "N/A",
                        b.getTotalUsage().setScale(0, RoundingMode.HALF_UP) + " L",
                        "₹" + b.getAmount().setScale(2, RoundingMode.HALF_UP),
                        b.getDueDate().toString(),
                        b.getStatus()
                ));
            }
            summary.put("billsCountInFilter", (long) bills.size());

        } else if ("METER".equalsIgnoreCase(reportType)) {
            headers.addAll(List.of("Resident Name", "Flat", "Community", "Reading Date", "Current Value", "Usage (L)", "Anomaly State"));
            for (MeterReading r : readings) {
                rows.add(List.of(
                        (r.getResident() != null) ? r.getResident().getFullName() : "N/A",
                        (r.getResident() != null) ? r.getResident().getFlatNumber() : "N/A",
                        (r.getCommunity() != null) ? r.getCommunity().getName() : "N/A",
                        r.getReadingDate().toString(),
                        r.getCurrentReading().setScale(2, RoundingMode.HALF_UP),
                        r.getUsageLitres().setScale(0, RoundingMode.HALF_UP) + " L",
                        r.getIsAnomaly() ? "Anomaly Detected" : "Normal"
                ));
            }
            summary.put("totalReadingsSummarized", (long) readings.size());

        } else { // COMMUNITY report
            headers.addAll(List.of("Community ID", "Community Name", "Residents Enrolled", "Total Consumption (L)", "Revenue Paid (₹)", "Outstanding (₹)", "Billing Settings (L/Rate)"));

            List<Community> communities = communityRepository.findAll();
            for (Community c : communities) {
                long resCount = userRepository.findAll().stream()
                        .filter(u -> u.getCommunity() != null && u.getCommunity().getId().equals(c.getId()) && u.getRole() == Role.RESIDENT)
                        .count();

                BigDecimal usage = meterReadingRepository.findByCommunityId(c.getId()).stream()
                        .map(MeterReading::getUsageLitres)
                        .filter(Objects::nonNull)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);

                List<WaterBill> commBills = waterBillRepository.findByCommunityId(c.getId());
                BigDecimal revPaid = commBills.stream()
                        .filter(b -> "PAID".equalsIgnoreCase(b.getStatus()))
                        .map(WaterBill::getAmount)
                        .filter(Objects::nonNull)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);

                BigDecimal revUnpaid = commBills.stream()
                        .filter(b -> "UNPAID".equalsIgnoreCase(b.getStatus()))
                        .map(WaterBill::getAmount)
                        .filter(Objects::nonNull)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);

                rows.add(List.of(
                        "#" + c.getId(),
                        c.getName(),
                        resCount + " residents",
                        usage.setScale(0, RoundingMode.HALF_UP) + " L",
                        "₹" + revPaid.setScale(2, RoundingMode.HALF_UP),
                        "₹" + revUnpaid.setScale(2, RoundingMode.HALF_UP),
                        "₹" + c.getTariffRate().setScale(2, RoundingMode.HALF_UP) + "/L"
                ));

                Map<String, Object> chartPoint = new HashMap<>();
                chartPoint.put("name", c.getName());
                chartPoint.put("residents", resCount);
                chartPoint.put("usage", usage.setScale(0, RoundingMode.HALF_UP));
                chartPoint.put("revenue", revPaid.setScale(2, RoundingMode.HALF_UP));
                chartData.add(chartPoint);
            }

            summary.put("communitiesRegistered", (long) communities.size());
            summary.put("platformUsage", readings.stream().map(MeterReading::getUsageLitres).reduce(BigDecimal.ZERO, BigDecimal::add).setScale(0, RoundingMode.HALF_UP) + " L");
        }

        data.put("headers", headers);
        data.put("rows", rows);
        data.put("chartData", chartData);
        data.put("summary", summary);

        return data;
    }

    public byte[] generateCsvReport(Map<String, Object> data) throws IOException {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        CSVFormat format = CSVFormat.DEFAULT.builder().build();

        try (
                PrintWriter writer = new PrintWriter(out);
                CSVPrinter csvPrinter = new CSVPrinter(writer, format)
        ) {
            csvPrinter.printRecord(List.of("=== " + data.get("title").toString() + " ==="));
            
            // Print Summary metrics
            Map<?, ?> summary = (Map<?, ?>) data.get("summary");
            for (Map.Entry<?, ?> entry : summary.entrySet()) {
                csvPrinter.printRecord(List.of(entry.getKey().toString() + ":", entry.getValue().toString()));
            }
            csvPrinter.printRecord(List.of("")); // Empty row

            // Print Headers and Table
            List<String> headers = (List<String>) data.get("headers");
            csvPrinter.printRecord(headers);

            List<List<Object>> rows = (List<List<Object>>) data.get("rows");
            for (List<Object> row : rows) {
                csvPrinter.printRecord(row);
            }
            csvPrinter.flush();
        }
        return out.toByteArray();
    }

    public byte[] generateExcelReport(Map<String, Object> data) throws IOException {
        Workbook workbook = new XSSFWorkbook();
        Sheet sheet = workbook.createSheet("Report Sheet");

        // Font and styles
        org.apache.poi.ss.usermodel.Font headerFont = workbook.createFont();
        headerFont.setBold(true);
        headerFont.setFontHeightInPoints((short) 11);

        CellStyle headerStyle = workbook.createCellStyle();
        headerStyle.setFont(headerFont);
        headerStyle.setBorderBottom(BorderStyle.MEDIUM);

        int rowIdx = 0;

        // Title row
        Row titleRow = sheet.createRow(rowIdx++);
        Cell titleCell = titleRow.createCell(0);
        titleCell.setCellValue(data.get("title").toString());
        
        // Summary metrics
        Map<?, ?> summary = (Map<?, ?>) data.get("summary");
        for (Map.Entry<?, ?> entry : summary.entrySet()) {
            Row sumRow = sheet.createRow(rowIdx++);
            sumRow.createCell(0).setCellValue(entry.getKey().toString() + ":");
            sumRow.createCell(1).setCellValue(entry.getValue().toString());
        }
        rowIdx++; // empty row

        // Headers row
        Row headerRow = sheet.createRow(rowIdx++);
        List<String> headers = (List<String>) data.get("headers");
        for (int i = 0; i < headers.size(); i++) {
            Cell cell = headerRow.createCell(i);
            cell.setCellValue(headers.get(i));
            cell.setCellStyle(headerStyle);
        }

        // Data rows
        List<List<Object>> rows = (List<List<Object>>) data.get("rows");
        for (List<Object> row : rows) {
            Row sheetRow = sheet.createRow(rowIdx++);
            for (int j = 0; j < row.size(); j++) {
                sheetRow.createCell(j).setCellValue(row.get(j) != null ? row.get(j).toString() : "");
            }
        }

        // Autosize columns
        for (int i = 0; i < headers.size(); i++) {
            sheet.autoSizeColumn(i);
        }

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        workbook.write(out);
        workbook.close();
        return out.toByteArray();
    }

    public byte[] generatePdfReport(Map<String, Object> data) throws DocumentException {
        Document document = new Document(PageSize.A4.rotate()); // Landscape
        ByteArrayOutputStream out = new ByteArrayOutputStream();

        PdfWriter.getInstance(document, out);
        document.open();

        // Report Title
        Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 16, Font.BOLD);
        Paragraph title = new Paragraph(data.get("title").toString(), titleFont);
        title.setAlignment(Element.ALIGN_CENTER);
        title.setSpacingAfter(15);
        document.add(title);

        // Summary details
        Map<?, ?> summary = (Map<?, ?>) data.get("summary");
        Paragraph sumBlock = new Paragraph("Key Highlights Summary:\n", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, Font.BOLD));
        for (Map.Entry<?, ?> entry : summary.entrySet()) {
            sumBlock.add(new Phrase(" - " + entry.getKey().toString() + ": " + entry.getValue().toString() + "\n", FontFactory.getFont(FontFactory.HELVETICA, 10)));
        }
        sumBlock.setSpacingAfter(20);
        document.add(sumBlock);

        // Data table
        List<String> headers = (List<String>) data.get("headers");
        PdfPTable table = new PdfPTable(headers.size());
        table.setWidthPercentage(100);

        // Headers
        Font boldCellFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, Font.BOLD);
        for (String h : headers) {
            PdfPCell cell = new PdfPCell(new Phrase(h, boldCellFont));
            cell.setBackgroundColor(new java.awt.Color(220, 220, 220));
            cell.setHorizontalAlignment(Element.ALIGN_CENTER);
            cell.setPadding(6);
            table.addCell(cell);
        }

        // Rows
        Font cellFont = FontFactory.getFont(FontFactory.HELVETICA, 9);
        List<List<Object>> rows = (List<List<Object>>) data.get("rows");
        for (List<Object> row : rows) {
            for (Object obj : row) {
                PdfPCell cell = new PdfPCell(new Phrase(obj != null ? obj.toString() : "", cellFont));
                cell.setPadding(5);
                cell.setHorizontalAlignment(Element.ALIGN_LEFT);
                table.addCell(cell);
            }
        }

        document.add(table);
        document.close();
        return out.toByteArray();
    }
}
