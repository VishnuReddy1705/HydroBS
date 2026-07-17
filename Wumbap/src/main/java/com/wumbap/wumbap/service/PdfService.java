package com.wumbap.wumbap.service;

import com.lowagie.text.*;
import com.lowagie.text.Font;
import com.lowagie.text.Rectangle;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import com.wumbap.wumbap.entity.WaterBill;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;

@Service
public class PdfService {

    public byte[] generateWaterBillPdf(WaterBill bill) throws DocumentException, IOException {
        Document document = new Document(PageSize.A4, 36, 36, 36, 36);
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        
        PdfWriter.getInstance(document, out);
        document.open();

        // Colors
        Color primaryColor = new Color(15, 76, 129); // #0F4C81
        Color secondaryColor = new Color(0, 180, 216); // #00B4D8
        Color textMuted = new Color(100, 116, 139); // #64748B
        Color borderLight = new Color(226, 232, 240); // #E2E8F0

        // Title and Header block
        Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 22, Font.BOLD, primaryColor);
        Paragraph title = new Paragraph("INVOICE", titleFont);
        title.setSpacingAfter(4);
        document.add(title);

        Font brandFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, Font.BOLD, secondaryColor);
        Paragraph branding = new Paragraph("HydroBS Water Utility Platform", brandFont);
        branding.setSpacingAfter(20);
        document.add(branding);

        // Header Divider line
        PdfPTable headerDivider = new PdfPTable(1);
        headerDivider.setWidthPercentage(100);
        PdfPCell dividerCell = new PdfPCell();
        dividerCell.setBorder(Rectangle.BOTTOM);
        dividerCell.setBorderWidth(2f);
        dividerCell.setBorderColor(secondaryColor);
        dividerCell.setPadding(0);
        headerDivider.addCell(dividerCell);
        document.add(headerDivider);
        document.add(new Paragraph(" "));

        // Metadata grid
        PdfPTable metaTable = new PdfPTable(2);
        metaTable.setWidthPercentage(100);
        metaTable.setSpacingAfter(20);
        
        String invNo = bill.getInvoiceNumber() != null ? bill.getInvoiceNumber() : "INV-2026-" + bill.getId();
        String billNo = bill.getBillNumber() != null ? bill.getBillNumber() : "HB-2026-" + bill.getId();
        String tModel = bill.getTariffModel() != null ? bill.getTariffModel() : "PER_UNIT";

        // Invoice Info (Left Column)
        PdfPTable infoLeft = new PdfPTable(1);
        infoLeft.addCell(getMetaCell("Invoice Number: " + invNo, Font.BOLD, primaryColor));
        infoLeft.addCell(getMetaCell("Ref Number: " + billNo, Font.NORMAL, textMuted));
        infoLeft.addCell(getMetaCell("Status: " + bill.getStatus(), Font.BOLD, "PAID".equalsIgnoreCase(bill.getStatus()) ? new Color(34, 197, 94) : new Color(239, 68, 68)));
        PdfPCell leftContainer = new PdfPCell(infoLeft);
        leftContainer.setBorder(Rectangle.NO_BORDER);
        metaTable.addCell(leftContainer);

        // Date Info (Right Column)
        PdfPTable infoRight = new PdfPTable(1);
        infoRight.addCell(getMetaCellRight("Billing Month: " + bill.getBillingMonth().toString(), Font.NORMAL, textMuted));
        infoRight.addCell(getMetaCellRight("Due Date: " + (bill.getDueDate() != null ? bill.getDueDate().toString() : "N/A"), Font.BOLD, new Color(239, 68, 68)));
        infoRight.addCell(getMetaCellRight("Community: " + bill.getCommunity().getName(), Font.NORMAL, textMuted));
        PdfPCell rightContainer = new PdfPCell(infoRight);
        rightContainer.setBorder(Rectangle.NO_BORDER);
        metaTable.addCell(rightContainer);

        document.add(metaTable);

        // Billed To Section
        Paragraph billedTo = new Paragraph("BILLED TO:", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, Font.BOLD, textMuted));
        billedTo.setSpacingAfter(4);
        document.add(billedTo);

        Font nameFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, Font.BOLD, primaryColor);
        Paragraph residentName = new Paragraph(bill.getResident().getFullName(), nameFont);
        document.add(residentName);

        String address = "Flat No. " + (bill.getResident().getFlatNumber() != null ? bill.getResident().getFlatNumber() : "N/A") +
                ", Building " + (bill.getResident().getBuilding() != null ? bill.getResident().getBuilding() : "N/A") +
                ", Block " + (bill.getResident().getBlock() != null ? bill.getResident().getBlock() : "N/A");
        document.add(new Paragraph(address, FontFactory.getFont(FontFactory.HELVETICA, 10, textMuted)));
        document.add(new Paragraph("Email: " + bill.getResident().getEmail(), FontFactory.getFont(FontFactory.HELVETICA, 10, textMuted)));
        document.add(new Paragraph(" "));

        // Usage details panel
        PdfPTable usageTable = new PdfPTable(3);
        usageTable.setWidthPercentage(100);
        usageTable.setSpacingBefore(10);
        usageTable.setSpacingAfter(15);
        usageTable.addCell(getTableHeaderCell("Previous Index"));
        usageTable.addCell(getTableHeaderCell("Current Index"));
        usageTable.addCell(getTableHeaderCell("Total Consumption"));

        BigDecimal prevRead = bill.getPreviousReading() != null ? bill.getPreviousReading() : BigDecimal.ZERO;
        BigDecimal currRead = bill.getCurrentReading() != null ? bill.getCurrentReading() : BigDecimal.ZERO;

        usageTable.addCell(getTableCell(prevRead.setScale(0, java.math.RoundingMode.HALF_UP) + " Litres", Element.ALIGN_CENTER));
        usageTable.addCell(getTableCell(currRead.setScale(0, java.math.RoundingMode.HALF_UP) + " Litres", Element.ALIGN_CENTER));
        usageTable.addCell(getTableCell(bill.getTotalUsage().setScale(0, java.math.RoundingMode.HALF_UP) + " Litres", Element.ALIGN_CENTER));
        document.add(usageTable);

        // Line Items Table
        PdfPTable lineItems = new PdfPTable(2);
        lineItems.setWidthPercentage(100);
        lineItems.setSpacingAfter(20);

        lineItems.addCell(getTableHeaderCellLeft("Description"));
        lineItems.addCell(getTableHeaderCellRight("Amount (INR)"));

        // Base Usage Charge
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

        lineItems.addCell(getLineItemCell("Water Consumption Charges (" + bill.getTotalUsage().setScale(0, java.math.RoundingMode.HALF_UP) + " L)"));
        lineItems.addCell(getLineItemCellRight("₹" + baseUsageCharge.setScale(2, java.math.RoundingMode.HALF_UP)));

        // Fixed service charge
        BigDecimal serviceCharge = bill.getServiceCharge() != null ? bill.getServiceCharge() : BigDecimal.ZERO;
        lineItems.addCell(getLineItemCell("Fixed Service Charge"));
        lineItems.addCell(getLineItemCellRight("₹" + serviceCharge.setScale(2, java.math.RoundingMode.HALF_UP)));

        // Maintenance charge
        BigDecimal maintenanceCharge = bill.getMaintenanceCharge() != null ? bill.getMaintenanceCharge() : BigDecimal.ZERO;
        lineItems.addCell(getLineItemCell("Maintenance Charge"));
        lineItems.addCell(getLineItemCellRight("₹" + maintenanceCharge.setScale(2, java.math.RoundingMode.HALF_UP)));

        // Sewage charge
        BigDecimal sewageCharge = bill.getSewageCharge() != null ? bill.getSewageCharge() : BigDecimal.ZERO;
        lineItems.addCell(getLineItemCell("Sewage Utility Charge"));
        lineItems.addCell(getLineItemCellRight("₹" + sewageCharge.setScale(2, java.math.RoundingMode.HALF_UP)));

        // Taxes
        lineItems.addCell(getLineItemCell("Government Surcharges & Taxes"));
        lineItems.addCell(getLineItemCellRight("₹" + bill.getTaxAmount().setScale(2, java.math.RoundingMode.HALF_UP)));

        // Interest
        lineItems.addCell(getLineItemCell("Late Fee Interest Surcharge"));
        lineItems.addCell(getLineItemCellRight("₹" + bill.getLateFee().setScale(2, java.math.RoundingMode.HALF_UP)));

        // Deductions
        lineItems.addCell(getLineItemCell("Promotional Discount Deductions"));
        lineItems.addCell(getLineItemCellRight("- ₹" + bill.getDiscountAmount().setScale(2, java.math.RoundingMode.HALF_UP)));

        // Grand Total row
        lineItems.addCell(getBoldLineItemCell("Total Invoice Amount Due"));
        lineItems.addCell(getBoldLineItemCellRight("₹" + bill.getAmount().setScale(2, java.math.RoundingMode.HALF_UP)));

        document.add(lineItems);

        // QR Code & Signoff bottom panel
        PdfPTable footerGrid = new PdfPTable(2);
        footerGrid.setWidthPercentage(100);
        footerGrid.setSpacingBefore(10);

        // Left box (Notes & Thank You)
        PdfPTable notesBox = new PdfPTable(1);
        notesBox.addCell(getMetaCell("Thank you for conserving water!", Font.BOLD, primaryColor));
        notesBox.addCell(getMetaCell("Please pay on time to avoid disruption of service.", Font.NORMAL, textMuted));
        PdfPCell notesContainer = new PdfPCell(notesBox);
        notesContainer.setBorder(Rectangle.NO_BORDER);
        footerGrid.addCell(notesContainer);

        // Right box (QR Code Mockup)
        PdfPTable qrBox = new PdfPTable(1);
        PdfPCell qrSquare = new PdfPCell(new Phrase("QR PLACEHOLDER\nSCAN TO PAY", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8, Font.BOLD, textMuted)));
        qrSquare.setHorizontalAlignment(Element.ALIGN_CENTER);
        qrSquare.setVerticalAlignment(Element.ALIGN_MIDDLE);
        qrSquare.setBackgroundColor(new Color(248, 250, 252));
        qrSquare.setBorderWidth(1f);
        qrSquare.setBorderColor(borderLight);
        qrSquare.setFixedHeight(60f);
        qrSquare.setPadding(10);
        qrBox.addCell(qrSquare);
        PdfPCell qrContainer = new PdfPCell(qrBox);
        qrContainer.setBorder(Rectangle.NO_BORDER);
        qrContainer.setHorizontalAlignment(Element.ALIGN_RIGHT);
        footerGrid.addCell(qrContainer);

        document.add(footerGrid);

        document.close();
        return out.toByteArray();
    }

    private PdfPCell getMetaCell(String text, int style, Color color) {
        PdfPCell cell = new PdfPCell(new Phrase(text, FontFactory.getFont(FontFactory.HELVETICA, 10, style, color)));
        cell.setBorder(Rectangle.NO_BORDER);
        cell.setPadding(3);
        return cell;
    }

    private PdfPCell getMetaCellRight(String text, int style, Color color) {
        PdfPCell cell = new PdfPCell(new Phrase(text, FontFactory.getFont(FontFactory.HELVETICA, 10, style, color)));
        cell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        cell.setBorder(Rectangle.NO_BORDER);
        cell.setPadding(3);
        return cell;
    }

    private PdfPCell getTableHeaderCell(String text) {
        PdfPCell cell = new PdfPCell(new Phrase(text, FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, Font.BOLD, Color.WHITE)));
        cell.setBackgroundColor(new Color(15, 76, 129));
        cell.setHorizontalAlignment(Element.ALIGN_CENTER);
        cell.setPadding(6);
        cell.setBorderColor(new Color(24, 46, 70));
        return cell;
    }

    private PdfPCell getTableHeaderCellLeft(String text) {
        PdfPCell cell = new PdfPCell(new Phrase(text, FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, Font.BOLD, Color.WHITE)));
        cell.setBackgroundColor(new Color(15, 76, 129));
        cell.setHorizontalAlignment(Element.ALIGN_LEFT);
        cell.setPadding(8);
        cell.setBorderColor(new Color(24, 46, 70));
        return cell;
    }

    private PdfPCell getTableHeaderCellRight(String text) {
        PdfPCell cell = new PdfPCell(new Phrase(text, FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, Font.BOLD, Color.WHITE)));
        cell.setBackgroundColor(new Color(15, 76, 129));
        cell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        cell.setPadding(8);
        cell.setBorderColor(new Color(24, 46, 70));
        return cell;
    }

    private PdfPCell getTableCell(String text, int alignment) {
        PdfPCell cell = new PdfPCell(new Phrase(text, FontFactory.getFont(FontFactory.HELVETICA, 10)));
        cell.setHorizontalAlignment(alignment);
        cell.setPadding(6);
        cell.setBorderColor(new Color(226, 232, 240));
        return cell;
    }

    private PdfPCell getLineItemCell(String text) {
        PdfPCell cell = new PdfPCell(new Phrase(text, FontFactory.getFont(FontFactory.HELVETICA, 9)));
        cell.setPadding(6);
        cell.setBorderColor(new Color(226, 232, 240));
        return cell;
    }

    private PdfPCell getLineItemCellRight(String text) {
        PdfPCell cell = new PdfPCell(new Phrase(text, FontFactory.getFont(FontFactory.HELVETICA, 9)));
        cell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        cell.setPadding(6);
        cell.setBorderColor(new Color(226, 232, 240));
        return cell;
    }

    private PdfPCell getBoldLineItemCell(String text) {
        PdfPCell cell = new PdfPCell(new Phrase(text, FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, Font.BOLD)));
        cell.setPadding(8);
        cell.setBorderColor(new Color(15, 76, 129));
        cell.setBackgroundColor(new Color(241, 245, 249));
        return cell;
    }

    private PdfPCell getBoldLineItemCellRight(String text) {
        PdfPCell cell = new PdfPCell(new Phrase(text, FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, Font.BOLD, new Color(15, 76, 129))));
        cell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        cell.setPadding(8);
        cell.setBorderColor(new Color(15, 76, 129));
        cell.setBackgroundColor(new Color(241, 245, 249));
        return cell;
    }
}
