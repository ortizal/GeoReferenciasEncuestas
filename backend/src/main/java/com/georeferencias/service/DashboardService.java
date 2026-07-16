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
    List<Map<String, Object>> topManzanasByPositivos();
    List<Map<String, Object>> topManzanasByArEstrellas();
}
