package com.georeferencias.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PredioDTO {
    private Long idPredio;
    private Long idManzana;
    private String nombreManzana;

    @NotBlank(message = "La clave catastral es obligatoria")
    private String claveCatastral;

    @NotBlank(message = "El propietario es obligatorio")
    private String propietario;

    @NotBlank(message = "La dirección es obligatoria")
    private String direccion;

    private String telefono;
    private Double latitud;
    private Double longitud;
    private String observaciones;
    private Boolean activo;
    private LocalDateTime fechaCreacion;
    private LocalDateTime fechaActualizacion;
    private String usuarioCreacion;
    private String estadoVisita;
    private LocalDateTime fechaUltimaVisita;
    private Integer totalVisitas;
}
