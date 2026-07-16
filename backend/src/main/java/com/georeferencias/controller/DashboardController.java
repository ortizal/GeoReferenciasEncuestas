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
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime desde,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime hasta) {
        List<Map<String, Object>> resultado = dashboardService.obtenerVisitasPorDia(desde, hasta);
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
}
