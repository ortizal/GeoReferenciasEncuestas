package com.georeferencias.service;

import com.georeferencias.dto.DashboardDTO;
import com.itextpdf.io.font.PdfEncodings;
import com.itextpdf.io.image.ImageDataFactory;
import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.colors.DeviceGray;
import com.itextpdf.kernel.colors.DeviceRgb;
import com.itextpdf.kernel.font.PdfFont;
import com.itextpdf.kernel.font.PdfFontFactory;
import com.itextpdf.kernel.geom.PageSize;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.borders.Border;
import com.itextpdf.layout.borders.SolidBorder;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.element.Image;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.HorizontalAlignment;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class DashboardPdfService {

    private final DashboardService dashboardService;

    private static final DeviceRgb PRIMARY = new DeviceRgb(37, 99, 235);
    private static final DeviceRgb PRIMARY_LIGHT = new DeviceRgb(239, 246, 255);
    private static final DeviceRgb SUCCESS = new DeviceRgb(34, 197, 94);
    private static final DeviceRgb DANGER = new DeviceRgb(220, 38, 38);
    private static final DeviceRgb WARNING = new DeviceRgb(245, 158, 11);
    private static final DeviceRgb DARK = new DeviceRgb(28, 28, 28);
    private static final DeviceGray LIGHT_GRAY = new DeviceGray(0.95f);
    private static final DeviceGray MEDIUM_GRAY = new DeviceGray(0.6f);

    public byte[] generarReporteDashboard() {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        PdfWriter writer = new PdfWriter(out);
        PdfDocument pdf = new PdfDocument(writer);
        pdf.setDefaultPageSize(PageSize.A4);
        Document doc = new Document(pdf);
        doc.setMargins(20, 20, 20, 20);

        PdfFont fontBold;
        PdfFont fontRegular;
        try {
            fontBold = PdfFontFactory.createFont();
            fontRegular = PdfFontFactory.createFont();
        } catch (Exception e) {
            throw new RuntimeException("Error creando fuentes PDF", e);
        }
        this.fontRef = fontRegular;

        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
        String fechaGeneracion = LocalDateTime.now().format(dtf);

        // === HEADER ===
        addHeader(doc, fontBold, fontRegular, fechaGeneracion);

        // === KPIs ===
        DashboardDTO dash = dashboardService.obtenerDashboard();
        addKPIs(doc, dash, fontBold, fontRegular);

        // === DISTRIBUCIÓN POR ESTADO ===
        addDistribucion(doc, dash, fontBold, fontRegular);

        // === TOP MANZANAS POSITIVOS ===
        List<Map<String, Object>> topPos = dashboardService.topManzanasByPositivos();
        addTopManzanas(doc, "TOP 10 Manzanas con más Positivos", topPos, "total", "positivos", fontBold, fontRegular);

        // === TOP MANZANAS AR/ESTRELLAS ===
        List<Map<String, Object>> topAR = dashboardService.topManzanasByArEstrellas();
        addTopManzanas(doc, "TOP 10 Manzanas con más AR y Estrellas", topAR, "total", "ar/estrellas", fontBold, fontRegular);

        // === ESTADÍSTICAS POR GRUPO ===
        List<Map<String, Object>> grupoStats = dashboardService.obtenerStatsPorGrupo();
        addGrupoStats(doc, grupoStats, fontBold, fontRegular);

        // === VISITAS RECIENTES ===
        addVisitasRecientes(doc, dash.getVisitasRecientes(), fontBold, fontRegular);

        // === FOOTER ===
        addFooter(doc, fontRegular, fechaGeneracion);

        doc.close();
        return out.toByteArray();
    }

    private void addHeader(Document doc, PdfFont fontBold, PdfFont fontRegular, String fecha) {
        Table headerTable = new Table(UnitValue.createPercentArray(new float[]{70, 30}))
                .useAllAvailableWidth();

        Cell leftCell = new Cell()
                .add(new Paragraph("REPORTE DE DASHBOARD")
                        .setFont(fontBold).setFontSize(18).setFontColor(PRIMARY))
                .add(new Paragraph("Sistema de Georreferenciación - Resumen General")
                        .setFont(fontRegular).setFontSize(10).setFontColor(MEDIUM_GRAY))
                .add(new Paragraph("Fecha: " + fecha)
                        .setFont(fontRegular).setFontSize(9).setFontColor(MEDIUM_GRAY))
                .setBorder(Border.NO_BORDER)
                .setPaddingRight(10);

        Cell rightCell = new Cell()
                .add(new Paragraph("GEOREFERENCIAS")
                        .setFont(fontBold).setFontSize(14).setFontColor(PRIMARY)
                        .setTextAlignment(TextAlignment.RIGHT))
                .add(new Paragraph("Encuestas de Campo")
                        .setFont(fontRegular).setFontSize(9).setFontColor(MEDIUM_GRAY)
                        .setTextAlignment(TextAlignment.RIGHT))
                .setBorder(Border.NO_BORDER);

        headerTable.addCell(leftCell);
        headerTable.addCell(rightCell);
        doc.add(headerTable);

        doc.add(new com.itextpdf.layout.element.LineSeparator(
                new com.itextpdf.kernel.pdf.canvas.draw.SolidLine(2))
                .setStrokeColor(PRIMARY)
                .setMarginTop(5)
                .setMarginBottom(10));
    }

    private void addKPIs(Document doc, DashboardDTO dash, PdfFont fontBold, PdfFont fontRegular) {
        doc.add(new Paragraph("INDICADORES PRINCIPALES")
                .setFont(fontBold).setFontSize(12).setFontColor(PRIMARY)
                .setMarginBottom(8));

        Table kpiTable = new Table(UnitValue.createPercentArray(new float[]{16.6f, 16.6f, 16.6f, 16.6f, 16.6f, 16.6f}))
                .useAllAvailableWidth()
                .setMarginBottom(10);

        addKpiCell(kpiTable, "Manzanas", String.valueOf(dash.getTotalManzanas()), fontBold, fontRegular);
        addKpiCell(kpiTable, "Predios", String.valueOf(dash.getTotalPredios()), fontBold, fontRegular);
        addKpiCell(kpiTable, "Visitas", String.valueOf(dash.getTotalVisitas()), fontBold, fontRegular);
        addKpiCell(kpiTable, "Cobertura", String.format("%.1f%%", dash.getPorcentajeCobertura()), fontBold, fontRegular);
        addKpiCell(kpiTable, "Apoya Alcalde", String.valueOf(dash.getApoyosAlcalde()), fontBold, fontRegular);
        addKpiCell(kpiTable, "Estrellas", String.valueOf(dash.getEstrellas()), fontBold, fontRegular);

        doc.add(kpiTable);
    }

    private void addKpiCell(Table table, String label, String value, PdfFont fontBold, PdfFont fontRegular) {
        Cell cell = new Cell()
                .add(new Paragraph(value).setFont(fontBold).setFontSize(16).setFontColor(PRIMARY))
                .add(new Paragraph(label).setFont(fontRegular).setFontSize(8).setFontColor(MEDIUM_GRAY))
                .setBackgroundColor(PRIMARY_LIGHT)
                .setPadding(8)
                .setTextAlignment(TextAlignment.CENTER)
                .setBorder(new SolidBorder(new DeviceGray(0.9f), 0.5f));
        table.addCell(cell);
    }

    private void addDistribucion(Document doc, DashboardDTO dash, PdfFont fontBold, PdfFont fontRegular) {
        doc.add(new Paragraph("DISTRIBUCIÓN POR ESTADO DE VISITA")
                .setFont(fontBold).setFontSize(12).setFontColor(PRIMARY)
                .setMarginBottom(8));

        Table distTable = new Table(UnitValue.createPercentArray(new float[]{35, 15, 15, 35}))
                .useAllAvailableWidth()
                .setMarginBottom(10);

        addTableHeader(distTable, "Estado", "Cantidad", "Porcentaje", "Barra");

        long total = dash.getTotalVisitas() > 0 ? dash.getTotalVisitas() : 1;
        addDistRow(distTable, "Positivos", dash.getPositivos(), total, SUCCESS, fontRegular);
        addDistRow(distTable, "Negativos", dash.getNegativos(), total, DANGER, fontRegular);
        addDistRow(distTable, "Indecisos", dash.getIndecisos(), total, WARNING, fontRegular);
        addDistRow(distTable, "En Blanco", dash.getEnBlanco(), total, new DeviceRgb(150, 150, 150), fontRegular);
        addDistRow(distTable, "No Trabajables", dash.getNoTrabajables(), total, DARK, fontRegular);
        addDistRow(distTable, "Reprogramadas", dash.getReprogramadas(), total, new DeviceRgb(14, 165, 233), fontRegular);
        addDistRow(distTable, "Rechazadas", dash.getRechazadas(), total, new DeviceRgb(190, 18, 60), fontRegular);
        addDistRow(distTable, "Finalizadas", dash.getFinalizadas(), total, new DeviceRgb(5, 150, 105), fontRegular);

        doc.add(distTable);
    }

    private void addDistRow(Table table, String estado, long count, long total, DeviceRgb color, PdfFont font) {
        double pct = total > 0 ? (double) count / total * 100 : 0;

        DeviceRgb lightBg = new DeviceRgb(
                Math.min(255, color.getColorValue()[0] + 180),
                Math.min(255, color.getColorValue()[1] + 180),
                Math.min(255, color.getColorValue()[2] + 180));

        table.addCell(new Cell().add(new Paragraph(estado).setFont(font).setFontSize(9))
                .setBackgroundColor(lightBg).setPadding(6).setBorder(new SolidBorder(new DeviceGray(0.9f), 0.5f)));
        table.addCell(new Cell().add(new Paragraph(String.valueOf(count)).setFont(font).setFontSize(9))
                .setTextAlignment(TextAlignment.CENTER).setPadding(6).setBorder(new SolidBorder(new DeviceGray(0.9f), 0.5f)));
        table.addCell(new Cell().add(new Paragraph(String.format("%.1f%%", pct)).setFont(font).setFontSize(9))
                .setTextAlignment(TextAlignment.CENTER).setPadding(6).setBorder(new SolidBorder(new DeviceGray(0.9f), 0.5f)));

        Table barTable = new Table(1).useAllAvailableWidth();
        barTable.setBorder(Border.NO_BORDER);
        Cell barCell = new Cell()
                .setBackgroundColor(color)
                .setHeight(12)
                .setBorder(Border.NO_BORDER);
        barTable.addCell(barCell);

        Cell barWrapper = new Cell()
                .add(barTable)
                .setBackgroundColor(LIGHT_GRAY)
                .setPadding(3)
                .setBorder(new SolidBorder(new DeviceGray(0.9f), 0.5f));
        table.addCell(barWrapper);
    }

    private void addTopManzanas(Document doc, String title, List<Map<String, Object>> data, String countField, String label, PdfFont fontBold, PdfFont fontRegular) {
        if (data == null || data.isEmpty()) return;

        doc.add(new Paragraph(title.toUpperCase())
                .setFont(fontBold).setFontSize(12).setFontColor(PRIMARY)
                .setMarginBottom(8));

        Table table = new Table(UnitValue.createPercentArray(new float[]{8, 47, 25, 20}))
                .useAllAvailableWidth()
                .setMarginBottom(10);

        addTableHeader(table, "#", "Manzana", label, "AR");

        int limit = Math.min(data.size(), 10);
        for (int i = 0; i < limit; i++) {
            Map<String, Object> row = data.get(i);
            DeviceRgb bg = i % 2 == 0 ? PRIMARY_LIGHT : new DeviceRgb(255, 255, 255);

            table.addCell(createDataCell(String.valueOf(i + 1), fontRegular, bg, TextAlignment.CENTER));
            table.addCell(createDataCell(String.valueOf(row.get("nombre")), fontRegular, bg, TextAlignment.LEFT));
            table.addCell(createDataCell(String.valueOf(row.get("total")), fontRegular, bg, TextAlignment.CENTER));

            String arEst = "";
            if (row.containsKey("arCount") && row.containsKey("estrellaCount")) {
                arEst = row.get("arCount") + " / " + row.get("estrellaCount");
            }
            table.addCell(createDataCell(arEst, fontRegular, bg, TextAlignment.CENTER));
        }

        doc.add(table);
    }

    private void addGrupoStats(Document doc, List<Map<String, Object>> grupoStats, PdfFont fontBold, PdfFont fontRegular) {
        if (grupoStats == null || grupoStats.isEmpty()) return;

        doc.add(new Paragraph("ESTADÍSTICAS POR GRUPO DE BRIGADA")
                .setFont(fontBold).setFontSize(12).setFontColor(PRIMARY)
                .setMarginBottom(8));

        Table table = new Table(UnitValue.createPercentArray(new float[]{12, 12, 12, 12, 12, 12, 12, 12}))
                .useAllAvailableWidth()
                .setMarginBottom(10);

        addTableHeader(table, "Grupo", "Total", "Positivos", "Negativos", "Indecisos", "En Blanco", "No Trab.");

        for (Map<String, Object> row : grupoStats) {
            DeviceRgb bg = grupoStats.indexOf(row) % 2 == 0 ? PRIMARY_LIGHT : new DeviceRgb(255, 255, 255);
            table.addCell(createDataCell(String.valueOf(row.get("grupo")), fontBold, bg, TextAlignment.CENTER));
            table.addCell(createDataCell(String.valueOf(row.get("total")), fontRegular, bg, TextAlignment.CENTER));
            table.addCell(createDataCell(String.valueOf(row.get("positivos")), fontRegular, bg, TextAlignment.CENTER));
            table.addCell(createDataCell(String.valueOf(row.get("negativos")), fontRegular, bg, TextAlignment.CENTER));
            table.addCell(createDataCell(String.valueOf(row.get("indecisos")), fontRegular, bg, TextAlignment.CENTER));
            table.addCell(createDataCell(String.valueOf(row.get("enBlanco")), fontRegular, bg, TextAlignment.CENTER));
            table.addCell(createDataCell(String.valueOf(row.get("noTrabajables")), fontRegular, bg, TextAlignment.CENTER));
            table.addCell(createDataCell(
                    "AR:" + row.get("apoyosAlcalde") + " ★" + row.get("estrellas"),
                    fontRegular, bg, TextAlignment.CENTER));
        }

        doc.add(table);
    }

    private void addVisitasRecientes(Document doc, List<Map<String, Object>> recientes, PdfFont fontBold, PdfFont fontRegular) {
        if (recientes == null || recientes.isEmpty()) return;

        doc.add(new Paragraph("ACTIVIDAD RECIENTE (ÚLTIMAS 10 VISITAS)")
                .setFont(fontBold).setFontSize(12).setFontColor(PRIMARY)
                .setMarginBottom(8));

        Table table = new Table(UnitValue.createPercentArray(new float[]{6, 18, 25, 25, 14, 12}))
                .useAllAvailableWidth()
                .setMarginBottom(10);

        addTableHeader(table, "#", "Predio", "Propietario", "Visitador", "Estado", "Fecha");

        int limit = Math.min(recientes.size(), 10);
        for (int i = 0; i < limit; i++) {
            Map<String, Object> row = recientes.get(i);
            DeviceRgb bg = i % 2 == 0 ? PRIMARY_LIGHT : new DeviceRgb(255, 255, 255);

            table.addCell(createDataCell(String.valueOf(i + 1), fontRegular, bg, TextAlignment.CENTER));
            table.addCell(createDataCell(String.valueOf(row.get("predio")), fontRegular, bg, TextAlignment.LEFT));
            table.addCell(createDataCell(String.valueOf(row.get("propietario")), fontRegular, bg, TextAlignment.LEFT));
            table.addCell(createDataCell(String.valueOf(row.get("visitador")), fontRegular, bg, TextAlignment.LEFT));
            table.addCell(createDataCell(String.valueOf(row.get("estado")), fontRegular, bg, TextAlignment.CENTER));
            table.addCell(createDataCell(
                    row.get("fecha") != null ? row.get("fecha").toString().substring(0, 16) : "-",
                    fontRegular, bg, TextAlignment.CENTER));
        }

        doc.add(table);
    }

    private PdfFont fontRef;

    private void addTableHeader(Table table, String... headers) {
        for (String h : headers) {
            Cell cell = new Cell()
                    .add(new Paragraph(h).setFont(fontRef).setFontSize(8).setFontColor(ColorConstants.WHITE).setBold())
                    .setBackgroundColor(PRIMARY)
                    .setPadding(6)
                    .setTextAlignment(TextAlignment.CENTER)
                    .setBorder(new SolidBorder(PRIMARY, 0.5f));
            table.addCell(cell);
        }
    }

    private Cell createDataCell(String text, PdfFont font, DeviceRgb bg, TextAlignment align) {
        return new Cell()
                .add(new Paragraph(text != null ? text : "-").setFont(font).setFontSize(8))
                .setBackgroundColor(bg)
                .setPadding(5)
                .setTextAlignment(align)
                .setBorder(new SolidBorder(new DeviceGray(0.9f), 0.5f));
    }

    private void addFooter(Document doc, PdfFont font, String fecha) {
        doc.add(new com.itextpdf.layout.element.LineSeparator(
                new com.itextpdf.kernel.pdf.canvas.draw.SolidLine(1))
                .setStrokeColor(PRIMARY)
                .setMarginTop(10)
                .setMarginBottom(5));

        Paragraph footer = new Paragraph("Generado el " + fecha + " — Sistema de Georreferenciación Encuestas")
                .setFont(font).setFontSize(8).setFontColor(MEDIUM_GRAY)
                .setTextAlignment(TextAlignment.CENTER);
        doc.add(footer);
    }
}
