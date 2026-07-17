package com.georeferencias.controller;

import com.georeferencias.dto.ApiResponse;
import com.georeferencias.dto.DashboardDTO;
import com.georeferencias.service.DashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/dashboard")
@RequiredArgsConstructor
@Tag(name = "Dashboard", description = "Indicadores y estadísticas del sistema")
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping
    @Operation(summary = "Obtener dashboard general", description = "Retorna todos los indicadores del sistema")
    public ResponseEntity<ApiResponse<DashboardDTO>> obtenerDashboard() {
        DashboardDTO resultado = dashboardService.obtenerDashboard();
        return ResponseEntity.ok(ApiResponse.exito(resultado, "Dashboard obtenido"));
    }

    @GetMapping("/visitas-por-dia")
    @Operation(summary = "Obtener visitas por día y estado con filtro de fechas")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> obtenerVisitasPorDia(
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") java.time.LocalDate desde,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") java.time.LocalDate hasta) {
        LocalDateTime desdeLdt = desde != null ? desde.atStartOfDay() : null;
        LocalDateTime hastaLdt = hasta != null ? hasta.plusDays(1).atStartOfDay() : null;
        List<Map<String, Object>> resultado = dashboardService.obtenerVisitasPorDia(desdeLdt, hastaLdt);
        return ResponseEntity.ok(ApiResponse.exito(resultado, "Visitas por día obtenidas"));
    }

    @GetMapping("/usuario/{idUsuario}")
    @Operation(summary = "Obtener dashboard por usuario")
    public ResponseEntity<ApiResponse<DashboardDTO>> obtenerDashboardPorUsuario(@PathVariable Long idUsuario) {
        DashboardDTO resultado = dashboardService.obtenerDashboardPorUsuario(idUsuario);
        return ResponseEntity.ok(ApiResponse.exito(resultado, "Dashboard obtenido"));
    }

    @GetMapping("/manzana/{idManzana}")
    @Operation(summary = "Obtener dashboard por manzana")
    public ResponseEntity<ApiResponse<DashboardDTO>> obtenerDashboardPorManzana(@PathVariable Long idManzana) {
        DashboardDTO resultado = dashboardService.obtenerDashboardPorManzana(idManzana);
        return ResponseEntity.ok(ApiResponse.exito(resultado, "Dashboard obtenido"));
    }

    @GetMapping("/top-manzanas-positivos")
    @Operation(summary = "Top manzanas con más visitas positivas")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> topManzanasPositivos() {
        List<Map<String, Object>> resultado = dashboardService.topManzanasByPositivos();
        return ResponseEntity.ok(ApiResponse.exito(resultado, "Top manzanas obtenidas"));
    }

    @GetMapping("/top-manzanas-ar-estrellas")
    @Operation(summary = "Top manzanas con más apoyos alcalde y estrellas")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> topManzanasArEstrellas() {
        List<Map<String, Object>> resultado = dashboardService.topManzanasByArEstrellas();
        return ResponseEntity.ok(ApiResponse.exito(resultado, "Top manzanas AR/Estrellas obtenidas"));
    }

    @GetMapping("/visitas-por-semana")
    @Operation(summary = "Visitas por semana y estado")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> obtenerVisitasPorSemana(
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") java.time.LocalDate desde,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") java.time.LocalDate hasta) {
        LocalDateTime desdeLdt = desde != null ? desde.atStartOfDay() : null;
        LocalDateTime hastaLdt = hasta != null ? hasta.plusDays(1).atStartOfDay() : null;
        List<Map<String, Object>> resultado = dashboardService.obtenerVisitasPorSemana(desdeLdt, hastaLdt);
        return ResponseEntity.ok(ApiResponse.exito(resultado, "Visitas por semana obtenidas"));
    }

    @GetMapping("/visitas-por-mes")
    @Operation(summary = "Visitas por mes y estado")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> obtenerVisitasPorMes(
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") java.time.LocalDate desde,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") java.time.LocalDate hasta) {
        LocalDateTime desdeLdt = desde != null ? desde.atStartOfDay() : null;
        LocalDateTime hastaLdt = hasta != null ? hasta.plusDays(1).atStartOfDay() : null;
        List<Map<String, Object>> resultado = dashboardService.obtenerVisitasPorMes(desdeLdt, hastaLdt);
        return ResponseEntity.ok(ApiResponse.exito(resultado, "Visitas por mes obtenidas"));
    }

    @GetMapping("/grupo-stats")
    @Operation(summary = "Estadísticas de visitas por grupo de brigada")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> obtenerStatsPorGrupo() {
        List<Map<String, Object>> resultado = dashboardService.obtenerStatsPorGrupo();
        return ResponseEntity.ok(ApiResponse.exito(resultado, "Estadísticas por grupo obtenidas"));
    }

    @GetMapping("/predios-por-estado/{estado}")
    @Operation(summary = "Predios filtrados por estado de visita")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> obtenerPrediosPorEstado(@PathVariable String estado) {
        List<Map<String, Object>> resultado = dashboardService.obtenerPrediosPorEstado(estado);
        return ResponseEntity.ok(ApiResponse.exito(resultado, "Predios por estado obtenidos"));
    }

    @GetMapping("/predios-por-estado-fecha")
    @Operation(summary = "Predios filtrados por estado y fecha")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> obtenerPrediosPorEstadoYFecha(
            @RequestParam String estado, @RequestParam String fecha) {
        List<Map<String, Object>> resultado = dashboardService.obtenerPrediosPorEstadoYFecha(estado, fecha);
        return ResponseEntity.ok(ApiResponse.exito(resultado, "Predios por estado y fecha obtenidos"));
    }
}
