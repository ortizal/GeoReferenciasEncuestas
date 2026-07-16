package com.georeferencias.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardDTO {
    private Long totalManzanas;
    private Long totalPredios;
    private Long totalVisitas;
    private Long positivos;
    private Long negativos;
    private Long indecisos;
    private Long enBlanco;
    private Long pendientes;
    private Long reprogramadas;
    private Long noTrabajables;
    private Long rechazadas;
    private Long finalizadas;
    private Long apoyosAlcalde;
    private Long estrellas;
    private Double porcentajeCobertura;
    private List<Map<String, Object>> visitasPorEstado;
    private List<Map<String, Object>> visitasPorMes;
    private List<Map<String, Object>> visitasPorUsuario;
    private List<Map<String, Object>> visitasPorDia;
    private List<Map<String, Object>> topManzanas;
    private List<Map<String, Object>> visitasRecientes;
}
