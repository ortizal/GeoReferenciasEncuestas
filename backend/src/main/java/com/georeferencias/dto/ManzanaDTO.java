package com.georeferencias.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ManzanaDTO {
    private Long idManzana;

    @NotBlank(message = "La clave catastral es obligatoria")
    private String claveCatastralManzana;

    @NotBlank(message = "El nombre es obligatorio")
    private String nombre;

    private String sector;
    private String barrio;
    private String poligonoGeoJSON;
    private Double area;
    private Boolean activo;
    private LocalDateTime fechaCreacion;
    private LocalDateTime fechaActualizacion;
    private String usuarioCreacion;
    private Integer totalPredios;
    private Integer totalVisitas;
    private Integer prediosVisitados;
    private Integer prediosPendientes;
}
