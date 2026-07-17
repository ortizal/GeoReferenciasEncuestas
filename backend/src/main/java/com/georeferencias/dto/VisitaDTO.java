package com.georeferencias.dto;

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

    private Long idPredio;
    private String claveCatastralPredio;
    private String propietarioPredio;

    private Long idUsuarioVisitador;
    private String nombreVisitador;

    private LocalDateTime fechaVisita;

    private String estadoVisita;

    private String observaciones;
    private String fotografia;
    private Double latitudVisita;
    private Double longitudVisita;
    private LocalTime horaInicio;
    private LocalTime horaFin;
    private Boolean viviendaTrabajable;
    private LocalDateTime fechaCreacion;

    private String grupoBrigada;
    private String nombreBrigada;
    private LocalDateTime fechaBrigada;
    private String comentarioBrigada;
    private String numCasasBrigada;
    private String parroquia;
    private String barrio;
    private Boolean apoyaAlcalde;
    private Boolean estrella;
}
