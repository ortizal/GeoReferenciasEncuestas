package com.georeferencias.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GrupoDTO {
    private Long idGrupo;
    private String nombre;
    private String descripcion;
    private String color;
    private String icono;
    private Integer maximoUsuarios;
    private Boolean activo;
    private Integer usuariosAsignados;
}
