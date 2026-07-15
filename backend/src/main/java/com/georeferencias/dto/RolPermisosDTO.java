package com.georeferencias.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RolPermisosDTO {
    private Long idRol;
    private String nombre;
    private String descripcion;
    private Set<PermisoDTO> permisos;
}
