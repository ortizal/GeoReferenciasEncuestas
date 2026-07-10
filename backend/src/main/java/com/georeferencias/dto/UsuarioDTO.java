package com.georeferencias.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UsuarioDTO {
    private Long idUsuario;
    private String username;
    private String nombre;
    private String apellido;
    private String email;
    private String telefono;
    private String estado;
    private Boolean primerLogin;
    private Boolean activo;
    private Integer intentosFallidos;
    private LocalDateTime fechaBloqueo;
    private LocalDateTime ultimoAcceso;
    private LocalDateTime fechaCreacion;
    private Set<String> roles;
}
