package com.georeferencias.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ModuloDTO {
    private Long idModulo;
    private String nombre;
    private String descripcion;
    private Boolean activo;
    private List<PermisoDTO> permisos;
}
