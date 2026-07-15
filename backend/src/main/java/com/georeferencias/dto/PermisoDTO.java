package com.georeferencias.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PermisoDTO {
    private Long idPermiso;
    private String nombre;
    private String descripcion;
    private Long idModulo;
    private String nombreModulo;
    private Boolean activo;
}
