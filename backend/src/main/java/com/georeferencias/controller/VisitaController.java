package com.georeferencias.controller;

import com.georeferencias.dto.ApiResponse;
import com.georeferencias.dto.VisitaDTO;
import com.georeferencias.enums.EstadoVisita;
import com.georeferencias.service.VisitaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/visitas")
@RequiredArgsConstructor
@Tag(name = "Visitas", description = "CRUD de visitas de campo")
public class VisitaController {

    private final VisitaService visitaService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMINISTRADOR', 'SUPERVISOR', 'VISITADOR')")
    @Operation(summary = "Crear visita")
    public ResponseEntity<ApiResponse<VisitaDTO>> crear(@Valid @RequestBody VisitaDTO dto) {
        VisitaDTO resultado = visitaService.crear(dto);
        return ResponseEntity.ok(ApiResponse.exito(resultado, "Visita creada exitosamente"));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMINISTRADOR', 'SUPERVISOR', 'VISITADOR')")
    @Operation(summary = "Actualizar visita")
    public ResponseEntity<ApiResponse<VisitaDTO>> actualizar(
            @PathVariable Long id, @Valid @RequestBody VisitaDTO dto) {
        VisitaDTO resultado = visitaService.actualizar(id, dto);
        return ResponseEntity.ok(ApiResponse.exito(resultado, "Visita actualizada exitosamente"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    @Operation(summary = "Eliminar visita")
    public ResponseEntity<ApiResponse<Void>> eliminar(@PathVariable Long id) {
        visitaService.eliminar(id);
        return ResponseEntity.ok(ApiResponse.exito(null, "Visita eliminada exitosamente"));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtener visita por ID")
    public ResponseEntity<ApiResponse<VisitaDTO>> obtenerPorId(@PathVariable Long id) {
        VisitaDTO resultado = visitaService.obtenerPorId(id);
        return ResponseEntity.ok(ApiResponse.exito(resultado, "Visita obtenida"));
    }

    @GetMapping("/predio/{idPredio}")
    @Operation(summary = "Listar visitas por predio")
    public ResponseEntity<ApiResponse<List<VisitaDTO>>> listarPorPredio(@PathVariable Long idPredio) {
        List<VisitaDTO> resultado = visitaService.listarPorPredio(idPredio);
        return ResponseEntity.ok(ApiResponse.exito(resultado, "Visitas obtenidas"));
    }

    @GetMapping("/usuario/{idUsuario}")
    @Operation(summary = "Listar visitas por usuario")
    public ResponseEntity<ApiResponse<List<VisitaDTO>>> listarPorUsuario(@PathVariable Long idUsuario) {
        List<VisitaDTO> resultado = visitaService.listarPorUsuario(idUsuario);
        return ResponseEntity.ok(ApiResponse.exito(resultado, "Visitas obtenidas"));
    }

    @GetMapping("/manzana/{idManzana}")
    @Operation(summary = "Listar visitas por manzana")
    public ResponseEntity<ApiResponse<List<VisitaDTO>>> listarPorManzana(@PathVariable Long idManzana) {
        List<VisitaDTO> resultado = visitaService.listarPorManzana(idManzana);
        return ResponseEntity.ok(ApiResponse.exito(resultado, "Visitas obtenidas"));
    }

    @GetMapping("/estado/{estado}")
    @Operation(summary = "Listar visitas por estado")
    public ResponseEntity<ApiResponse<List<VisitaDTO>>> listarPorEstado(@PathVariable EstadoVisita estado) {
        List<VisitaDTO> resultado = visitaService.listarPorEstado(estado);
        return ResponseEntity.ok(ApiResponse.exito(resultado, "Visitas obtenidas"));
    }

    @GetMapping
    @Operation(summary = "Buscar visitas con paginación y filtros")
    public ResponseEntity<ApiResponse<Page<VisitaDTO>>> buscar(
            @RequestParam(defaultValue = "") String busqueda,
            @RequestParam(defaultValue = "") String estado,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") java.time.LocalDate desde,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") java.time.LocalDate hasta,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        java.time.LocalDateTime desdeLdt = desde != null ? desde.atStartOfDay() : null;
        java.time.LocalDateTime hastaLdt = hasta != null ? hasta.plusDays(1).atStartOfDay() : null;
        Page<VisitaDTO> resultado = visitaService.buscar(
                busqueda, estado, desdeLdt, hastaLdt, PageRequest.of(page, size));
        return ResponseEntity.ok(ApiResponse.exito(resultado, "Visitas obtenidas"));
    }

    @GetMapping("/estadisticas")
    @Operation(summary = "Obtener estadísticas de visitas")
    public ResponseEntity<ApiResponse<Map<String, Long>>> contarPorEstado() {
        Map<String, Long> resultado = visitaService.contarPorEstado();
        return ResponseEntity.ok(ApiResponse.exito(resultado, "Estadísticas obtenidas"));
    }

    @GetMapping("/ultima/{idPredio}")
    @Operation(summary = "Obtener última visita de un predio")
    public ResponseEntity<ApiResponse<VisitaDTO>> obtenerUltimaVisita(@PathVariable Long idPredio) {
        VisitaDTO resultado = visitaService.obtenerUltimaVisitaPredio(idPredio);
        return ResponseEntity.ok(ApiResponse.exito(resultado, "Última visita obtenida"));
    }

    @GetMapping("/reportes/por-usuario")
    @Operation(summary = "Reporte de visitas por usuario")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> reportePorUsuario(
            @RequestParam LocalDateTime fechaInicio,
            @RequestParam LocalDateTime fechaFin) {
        List<Map<String, Object>> resultado = visitaService.obtenerVisitasPorUsuario(fechaInicio, fechaFin);
        return ResponseEntity.ok(ApiResponse.exito(resultado, "Reporte generado"));
    }

    @GetMapping("/reportes/por-sector")
    @Operation(summary = "Reporte de visitas por sector")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> reportePorSector(
            @RequestParam LocalDateTime fechaInicio,
            @RequestParam LocalDateTime fechaFin) {
        List<Map<String, Object>> resultado = visitaService.obtenerVisitasPorSector(fechaInicio, fechaFin);
        return ResponseEntity.ok(ApiResponse.exito(resultado, "Reporte generado"));
    }

    @GetMapping("/exportar/excel")
    @Operation(summary = "Exportar visitas a Excel")
    public ResponseEntity<byte[]> exportarExcel(
            @RequestParam LocalDateTime fechaInicio,
            @RequestParam LocalDateTime fechaFin) {
        byte[] datos = visitaService.exportarExcel(fechaInicio, fechaFin);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment;filename=visitas.xlsx")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(datos);
    }

    @GetMapping("/exportar/pdf")
    @Operation(summary = "Exportar visitas a PDF")
    public ResponseEntity<byte[]> exportarPDF(
            @RequestParam LocalDateTime fechaInicio,
            @RequestParam LocalDateTime fechaFin) {
        byte[] datos = visitaService.exportarPDF(fechaInicio, fechaFin);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment;filename=visitas.pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(datos);
    }

    @PostMapping("/importar/visitas")
    @PreAuthorize("hasAnyRole('ADMINISTRADOR', 'SUPERVISOR')")
    @Operation(summary = "Vista previa de importación de visitas desde Excel")
    public ResponseEntity<ApiResponse<List<VisitaDTO>>> previsualizarImportacion(@RequestParam("file") MultipartFile file) {
        List<VisitaDTO> resultado = visitaService.leerExcelBrigada(file);
        return ResponseEntity.ok(ApiResponse.exito(resultado, "Se encontraron " + resultado.size() + " registros"));
    }

    @PostMapping("/importar/confirmar")
    @PreAuthorize("hasAnyRole('ADMINISTRADOR', 'SUPERVISOR')")
    @Operation(summary = "Confirmar importación de visitas")
    public ResponseEntity<ApiResponse<Map<String, Object>>> confirmarImportacion(
            @RequestBody List<VisitaDTO> visitas,
            @RequestHeader(value = "X-Import-Session", required = false) String sessionId) {
        try {
            Map<String, Object> resultado = visitaService.confirmarImportacion(visitas, sessionId);
            return ResponseEntity.ok(ApiResponse.exito(resultado, "Importación completada"));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("Error en importación: " + e.getMessage()));
        }
    }

    @PostMapping("/importar/reporte-no-encontrados")
    @PreAuthorize("hasAnyRole('ADMINISTRADOR', 'SUPERVISOR')")
    @Operation(summary = "Descargar reporte de predios no encontrados")
    public ResponseEntity<byte[]> reporteNoEncontrados(@RequestBody List<VisitaDTO> visitas) {
        byte[] datos = visitaService.generarReporteNoEncontrados(visitas);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment;filename=predios_no_encontrados.xlsx")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(datos);
    }
}
