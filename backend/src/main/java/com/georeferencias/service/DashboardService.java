package com.georeferencias.service;

import com.georeferencias.dto.DashboardDTO;

public interface DashboardService {
    DashboardDTO obtenerDashboard();
    DashboardDTO obtenerDashboardPorUsuario(Long idUsuario);
    DashboardDTO obtenerDashboardPorManzana(Long idManzana);
}
