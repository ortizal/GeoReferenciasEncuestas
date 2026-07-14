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

    private String propietario;

    private String direccion;

    private String telefono;
    private Double latitud;
    private Double longitud;
    private String poligonoGeoJSON;
    private String referencia;
    private Double areaTerreno;
    private Double frentes;
    private Double norte;
    private Double sur;
    private Double este;
    private Double oeste;
    private String telefonoPropietario;
    private Double areaConstruccion;
    private Integer nroPisos;
    private String uso;
    private String nroPredial;
    private String cedulaCatastral;
    private String serviciosBasicos;
    private String codPredio;
    private String estado;
    private String observaciones;
    private Boolean activo;
    private LocalDateTime fechaCreacion;
    private LocalDateTime fechaActualizacion;
    private String usuarioCreacion;
    private String estadoVisita;
    private LocalDateTime fechaUltimaVisita;
    private Integer totalVisitas;
}
