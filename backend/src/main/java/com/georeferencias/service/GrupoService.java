package com.georeferencias.service;

import com.georeferencias.dto.GrupoDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface GrupoService {
    GrupoDTO crear(GrupoDTO dto);
    GrupoDTO actualizar(Long id, GrupoDTO dto);
    void eliminar(Long id);
    GrupoDTO obtenerPorId(Long id);
    Page<GrupoDTO> buscar(String busqueda, Pageable pageable);
    Page<GrupoDTO> listarTodos(Pageable pageable);
}
