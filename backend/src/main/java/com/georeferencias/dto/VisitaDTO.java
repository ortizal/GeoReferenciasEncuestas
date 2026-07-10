package com.georeferencias.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.time.LocalTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VisitaDTO {
    private Long idVisita;

    @NotNull(message = "El predio es obligatorio")
    private Long idPredio;
    private String claveCatastralPredio;
    private String propietarioPredio;

    private Long idUsuarioVisitador;
    private String nombreVisitador;

    @NotNull(message = "La fecha de visita es obligatoria")
    private LocalDateTime fechaVisita;

    @NotNull(message = "El estado es obligatorio")
    private String estadoVisita;

    private String observaciones;
    private String fotografia;
    private Double latitudVisita;
    private Double longitudVisita;
    private LocalTime horaInicio;
    private LocalTime horaFin;
    private Boolean viviendaTrabajable;
    private LocalDateTime fechaCreacion;
}
