package com.georeferencias.service;

import com.georeferencias.dto.UsuarioDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface UsuarioService {
    UsuarioDTO crear(UsuarioDTO dto);
    UsuarioDTO actualizar(Long id, UsuarioDTO dto);
    void eliminar(Long id);
    UsuarioDTO obtenerPorId(Long id);
    Page<UsuarioDTO> buscar(String busqueda, Boolean activo, Pageable pageable);
    UsuarioDTO bloquear(Long id);
    UsuarioDTO desbloquear(Long id);
    UsuarioDTO asignarGrupos(Long idUsuario, List<Long> idsGrupos);
}
