package com.georeferencias.service.impl;

import com.georeferencias.dto.GrupoDTO;
import com.georeferencias.entity.Grupo;
import com.georeferencias.exception.BadRequestException;
import com.georeferencias.exception.ResourceNotFoundException;
import com.georeferencias.repository.GrupoRepository;
import com.georeferencias.service.GrupoService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class GrupoServiceImpl implements GrupoService {

    private final GrupoRepository grupoRepository;

    @Override
    @Transactional
    public GrupoDTO crear(GrupoDTO dto) {
        if (grupoRepository.existsByNombre(dto.getNombre())) {
            throw new BadRequestException("Ya existe un grupo con el nombre: " + dto.getNombre());
        }
        Grupo grupo = Grupo.builder()
                .nombre(dto.getNombre())
                .descripcion(dto.getDescripcion())
                .color(dto.getColor() != null ? dto.getColor() : "#6366f1")
                .icono(dto.getIcono() != null ? dto.getIcono() : "bi-people")
                .maximoUsuarios(dto.getMaximoUsuarios())
                .activo(dto.getActivo() != null ? dto.getActivo() : true)
                .build();
        grupo = grupoRepository.save(grupo);
        return mapToDTO(grupo);
    }

    @Override
    @Transactional
    public GrupoDTO actualizar(Long id, GrupoDTO dto) {
        Grupo grupo = grupoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Grupo no encontrado"));
        if (!grupo.getNombre().equals(dto.getNombre()) && grupoRepository.existsByNombre(dto.getNombre())) {
            throw new BadRequestException("Ya existe un grupo con el nombre: " + dto.getNombre());
        }
        grupo.setNombre(dto.getNombre());
        grupo.setDescripcion(dto.getDescripcion());
        if (dto.getColor() != null) grupo.setColor(dto.getColor());
        if (dto.getIcono() != null) grupo.setIcono(dto.getIcono());
        grupo.setMaximoUsuarios(dto.getMaximoUsuarios());
        if (dto.getActivo() != null) grupo.setActivo(dto.getActivo());
        grupo = grupoRepository.save(grupo);
        return mapToDTO(grupo);
    }

    @Override
    @Transactional
    public void eliminar(Long id) {
        if (!grupoRepository.existsById(id)) {
            throw new ResourceNotFoundException("Grupo no encontrado");
        }
        grupoRepository.deleteById(id);
    }

    @Override
    @Transactional(readOnly = true)
    public GrupoDTO obtenerPorId(Long id) {
        Grupo grupo = grupoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Grupo no encontrado"));
        return mapToDTO(grupo);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<GrupoDTO> buscar(String busqueda, Pageable pageable) {
        return grupoRepository.buscarConFiltros(busqueda, pageable).map(this::mapToDTO);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<GrupoDTO> listarTodos(Pageable pageable) {
        return grupoRepository.findAll(pageable).map(this::mapToDTO);
    }

    private GrupoDTO mapToDTO(Grupo grupo) {
        return GrupoDTO.builder()
                .idGrupo(grupo.getIdGrupo())
                .nombre(grupo.getNombre())
                .descripcion(grupo.getDescripcion())
                .color(grupo.getColor())
                .icono(grupo.getIcono())
                .maximoUsuarios(grupo.getMaximoUsuarios())
                .activo(grupo.getActivo())
                .usuariosAsignados(grupo.getUsuarios() != null ? grupo.getUsuarios().size() : 0)
                .build();
    }
}
