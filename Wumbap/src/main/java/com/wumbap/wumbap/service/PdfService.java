package com.wumbap.wumbap.service;

import com.lowagie.text.*;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import com.wumbap.wumbap.entity.WaterBill;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;

@Service
public class PdfService {

    public byte[] generateWaterBillPdf(WaterBill bill) throws DocumentException, IOException {
        Document document = new Document(PageSize.A4);
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        
        PdfWriter.getInstance(document, out);
        document.open();

        // Title
        Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 20, Font.BOLD);
        Paragraph title = new Paragraph("HYDROBS WATER UTILITY INVOICE", titleFont);
        title.setAlignment(Element.ALIGN_CENTER);
        title.setSpacingAfter(20);
        document.add(title);

        // Metadata table (Invoice details)
        PdfPTable metaTable = new PdfPTable(2);
        metaTable.setWidthPercentage(100);
        metaTable.setSpacingAfter(15);
        
        String invNo = bill.getInvoiceNumber() != null ? bill.getInvoiceNumber() : "INV-2026-" + bill.getId();
        String billNo = bill.getBillNumber() != null ? bill.getBillNumber() : "HB-2026-" + bill.getId();
        String tModel = bill.getTariffModel() != null ? bill.getTariffModel() : "PER_UNIT";

        metaTable.addCell(getCell("Invoice No: " + invNo, Element.ALIGN_LEFT));
        metaTable.addCell(getCell("Billing Month: " + bill.getBillingMonth().toString(), Element.ALIGN_RIGHT));
        
        metaTable.addCell(getCell("Bill Reference: " + billNo, Element.ALIGN_LEFT));
        metaTable.addCell(getCell("Due Date: " + (bill.getDueDate() != null ? bill.getDueDate().toString() : "N/A"), Element.ALIGN_RIGHT));
        
        metaTable.addCell(getCell("Tariff Model: " + tModel, Element.ALIGN_LEFT));
        metaTable.addCell(getCell("Community: " + bill.getCommunity().getName(), Element.ALIGN_RIGHT));

        metaTable.addCell(getCell("Status: " + bill.getStatus(), Element.ALIGN_LEFT));
        metaTable.addCell(getCell("Generated: " + bill.getGeneratedAt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")), Element.ALIGN_RIGHT));
        
        document.add(metaTable);

        // Divider
        document.add(new Paragraph("----------------------------------------------------------------------------------------------------------------------------------"));

        // Resident Details
        Paragraph residentHeading = new Paragraph("Billed To:", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, Font.BOLD));
        residentHeading.setSpacingBefore(10);
        residentHeading.setSpacingAfter(5);
        document.add(residentHeading);

        document.add(new Paragraph("Resident Name: " + bill.getResident().getFullName()));
        document.add(new Paragraph("Email: " + bill.getResident().getEmail()));
        
        String address = "Flat: " + (bill.getResident().getFlatNumber() != null ? bill.getResident().getFlatNumber() : "N/A") +
                " | Building: " + (bill.getResident().getBuilding() != null ? bill.getResident().getBuilding() : "N/A") +
                " | Block: " + (bill.getResident().getBlock() != null ? bill.getResident().getBlock() : "N/A") +
                " | Floor: " + (bill.getResident().getFloor() != null ? bill.getResident().getFloor() : "N/A");
        document.add(new Paragraph(address));
        document.add(new Paragraph(" "));

        // Meter Readings Snapshot Header
        Paragraph meterHeading = new Paragraph("Consumption Period Readings:", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11, Font.BOLD));
        meterHeading.setSpacingBefore(5);
        meterHeading.setSpacingAfter(5);
        document.add(meterHeading);

        BigDecimal prevRead = bill.getPreviousReading() != null ? bill.getPreviousReading() : BigDecimal.ZERO;
        BigDecimal currRead = bill.getCurrentReading() != null ? bill.getCurrentReading() : BigDecimal.ZERO;
        document.add(new Paragraph("Previous Reading Index: " + prevRead.setScale(2, java.math.RoundingMode.HALF_UP) + " L"));
        document.add(new Paragraph("Current Reading Index: " + currRead.setScale(2, java.math.RoundingMode.HALF_UP) + " L"));
        document.add(new Paragraph("Total Water Consumed: " + bill.getTotalUsage().setScale(2, java.math.RoundingMode.HALF_UP) + " L"));
        document.add(new Paragraph(" "));

        // Billing Details Table
        PdfPTable table = new PdfPTable(2);
        table.setWidthPercentage(100);
        table.setSpacingBefore(10);
        table.setSpacingAfter(20);

        // Table Headers
        table.addCell(getBoldCell("Charge Description", Element.ALIGN_LEFT));
        table.addCell(getBoldCell("Amount", Element.ALIGN_RIGHT));

        // Consumption calculation rows
        if ("FIXED".equalsIgnoreCase(tModel)) {
            table.addCell(getCell("Fixed Consumption Tariff Price", Element.ALIGN_LEFT));
            table.addCell(getCell("₹" + bill.getAmount().setScale(2, java.math.RoundingMode.HALF_UP), Element.ALIGN_RIGHT));
        } else {
            table.addCell(getCell("Water Usage Charges (Consumed " + bill.getTotalUsage().setScale(0, java.math.RoundingMode.HALF_UP) + " L)", Element.ALIGN_LEFT));
            
            BigDecimal baseUsageCharge = bill.getAmount()
                    .subtract(bill.getTaxAmount())
                    .subtract(bill.getLateFee())
                    .subtract(bill.getPenalty())
                    .subtract(bill.getServiceCharge())
                    .subtract(bill.getMaintenanceCharge())
                    .subtract(bill.getSewageCharge())
                    .add(bill.getDiscountAmount())
                    .add(bill.getSubsidyAmount());
            if (baseUsageCharge.compareTo(BigDecimal.ZERO) < 0) baseUsageCharge = BigDecimal.ZERO;
            
            table.addCell(getCell("₹" + baseUsageCharge.setScale(2, java.math.RoundingMode.HALF_UP), Element.ALIGN_RIGHT));
        }

        // Additional charges
        BigDecimal servCharge = bill.getServiceCharge() != null ? bill.getServiceCharge() : BigDecimal.ZERO;
        table.addCell(getCell("Fixed Service Charge", Element.ALIGN_LEFT));
        table.addCell(getCell("₹" + servCharge.setScale(2, java.math.RoundingMode.HALF_UP), Element.ALIGN_RIGHT));

        BigDecimal maintCharge = bill.getMaintenanceCharge() != null ? bill.getMaintenanceCharge() : BigDecimal.ZERO;
        table.addCell(getCell("Maintenance Charge", Element.ALIGN_LEFT));
        table.addCell(getCell("₹" + maintCharge.setScale(2, java.math.RoundingMode.HALF_UP), Element.ALIGN_RIGHT));

        BigDecimal sewCharge = bill.getSewageCharge() != null ? bill.getSewageCharge() : BigDecimal.ZERO;
        table.addCell(getCell("Sewage Utility Charge", Element.ALIGN_LEFT));
        table.addCell(getCell("₹" + sewCharge.setScale(2, java.math.RoundingMode.HALF_UP), Element.ALIGN_RIGHT));

        // Taxes & Fees
        table.addCell(getCell("Government Surcharge / Taxes", Element.ALIGN_LEFT));
        table.addCell(getCell("₹" + bill.getTaxAmount().setScale(2, java.math.RoundingMode.HALF_UP), Element.ALIGN_RIGHT));

        table.addCell(getCell("Late Fee Interest", Element.ALIGN_LEFT));
        table.addCell(getCell("₹" + bill.getLateFee().setScale(2, java.math.RoundingMode.HALF_UP), Element.ALIGN_RIGHT));

        BigDecimal penCharge = bill.getPenalty() != null ? bill.getPenalty() : BigDecimal.ZERO;
        table.addCell(getCell("Penalty Surcharge", Element.ALIGN_LEFT));
        table.addCell(getCell("₹" + penCharge.setScale(2, java.math.RoundingMode.HALF_UP), Element.ALIGN_RIGHT));

        // Deductions
        table.addCell(getCell("Promotional Discount Deductions", Element.ALIGN_LEFT));
        table.addCell(getCell("- ₹" + bill.getDiscountAmount().setScale(2, java.math.RoundingMode.HALF_UP), Element.ALIGN_RIGHT));

        BigDecimal subCharge = bill.getSubsidyAmount() != null ? bill.getSubsidyAmount() : BigDecimal.ZERO;
        table.addCell(getCell("State Water Subsidy Benefit", Element.ALIGN_LEFT));
        table.addCell(getCell("- ₹" + subCharge.setScale(2, java.math.RoundingMode.HALF_UP), Element.ALIGN_RIGHT));

        // Total
        table.addCell(getBoldCell("Total Invoice Amount Due", Element.ALIGN_LEFT));
        table.addCell(getBoldCell("₹" + bill.getAmount().setScale(2, java.math.RoundingMode.HALF_UP), Element.ALIGN_RIGHT));

        document.add(table);

        // Notes if present
        if (bill.getNotes() != null && !bill.getNotes().trim().isEmpty()) {
            Paragraph notesHeading = new Paragraph("Important Notes:", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, Font.BOLD));
            notesHeading.setSpacingBefore(5);
            notesHeading.setSpacingAfter(2);
            document.add(notesHeading);
            document.add(new Paragraph(bill.getNotes(), FontFactory.getFont(FontFactory.HELVETICA, 9)));
            document.add(new Paragraph(" "));
        }

        // Footer
        Paragraph footer = new Paragraph("Thank you for conserving water! HydroBS Water Utility Solutions.", FontFactory.getFont(FontFactory.HELVETICA_OBLIQUE, 10, Font.ITALIC));
        footer.setAlignment(Element.ALIGN_CENTER);
        document.add(footer);

        document.close();
        return out.toByteArray();
    }

    private PdfPCell getCell(String text, int alignment) {
        PdfPCell cell = new PdfPCell(new Phrase(text, FontFactory.getFont(FontFactory.HELVETICA, 10)));
        cell.setHorizontalAlignment(alignment);
        cell.setBorder(Rectangle.NO_BORDER);
        cell.setPadding(5);
        return cell;
    }

    private PdfPCell getBoldCell(String text, int alignment) {
        PdfPCell cell = new PdfPCell(new Phrase(text, FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, Font.BOLD)));
        cell.setHorizontalAlignment(alignment);
        cell.setBorder(Rectangle.BOTTOM);
        cell.setPadding(8);
        return cell;
    }
}
