package com.georeferencias.service;

import com.georeferencias.dto.DashboardDTO;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public interface DashboardService {
    DashboardDTO obtenerDashboard();
    DashboardDTO obtenerDashboardPorUsuario(Long idUsuario);
    DashboardDTO obtenerDashboardPorManzana(Long idManzana);
    List<Map<String, Object>> obtenerVisitasPorDia(LocalDateTime inicio, LocalDateTime fin);
    List<Map<String, Object>> obtenerVisitasPorSemana(LocalDateTime inicio, LocalDateTime fin);
    List<Map<String, Object>> obtenerVisitasPorMes(LocalDateTime inicio, LocalDateTime fin);
    List<Map<String, Object>> obtenerStatsPorGrupo();
    List<Map<String, Object>> obtenerPrediosPorEstado(String estado);
    List<Map<String, Object>> obtenerPrediosPorEstadoYFecha(String estado, String fecha);
    List<Map<String, Object>> topManzanasByPositivos();
    List<Map<String, Object>> topManzanasByArEstrellas();
}
