package com.georeferencias.service.impl;

import com.georeferencias.dto.ModuloDTO;
import com.georeferencias.dto.PermisoDTO;
import com.georeferencias.dto.RolPermisosDTO;
import com.georeferencias.entity.Modulo;
import com.georeferencias.entity.Permiso;
import com.georeferencias.entity.Rol;
import com.georeferencias.exception.ResourceNotFoundException;
import com.georeferencias.repository.ModuloRepository;
import com.georeferencias.repository.PermisoRepository;
import com.georeferencias.repository.RolRepository;
import com.georeferencias.service.ConfiguracionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ConfiguracionServiceImpl implements ConfiguracionService {

    private final ModuloRepository moduloRepository;
    private final PermisoRepository permisoRepository;
    private final RolRepository rolRepository;

    @Override
    @Transactional(readOnly = true)
    public List<ModuloDTO> listarModulos() {
        return moduloRepository.findAllByOrderByNombreAsc().stream()
                .map(this::toModuloDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<PermisoDTO> listarTodosPermisos() {
        return permisoRepository.findAllByOrderByModuloNombreAscNombreAsc().stream()
                .map(this::toPermisoDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<RolPermisosDTO> listarRolesConPermisos() {
        return rolRepository.findAll().stream()
                .map(this::toRolPermisosDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public RolPermisosDTO obtenerPermisosPorRol(Long idRol) {
        Rol rol = rolRepository.findById(idRol)
                .orElseThrow(() -> new ResourceNotFoundException("Rol no encontrado con id: " + idRol));
        return toRolPermisosDTO(rol);
    }

    @Override
    @Transactional
    public RolPermisosDTO actualizarPermisosRol(Long idRol, Set<Long> idsPermisos) {
        Rol rol = rolRepository.findById(idRol)
                .orElseThrow(() -> new ResourceNotFoundException("Rol no encontrado con id: " + idRol));

        Set<Permiso> permisos = new HashSet<>(permisoRepository.findAllById(idsPermisos));
        rol.setPermisos(permisos);
        rolRepository.save(rol);

        return toRolPermisosDTO(rol);
    }

    private ModuloDTO toModuloDTO(Modulo modulo) {
        return ModuloDTO.builder()
                .idModulo(modulo.getIdModulo())
                .nombre(modulo.getNombre())
                .descripcion(modulo.getDescripcion())
                .activo(modulo.getActivo())
                .build();
    }

    private PermisoDTO toPermisoDTO(Permiso permiso) {
        return PermisoDTO.builder()
                .idPermiso(permiso.getIdPermiso())
                .nombre(permiso.getNombre())
                .descripcion(permiso.getDescripcion())
                .idModulo(permiso.getModulo().getIdModulo())
                .nombreModulo(permiso.getModulo().getNombre())
                .activo(permiso.getActivo())
                .build();
    }

    private RolPermisosDTO toRolPermisosDTO(Rol rol) {
        Set<PermisoDTO> permisosDTO = rol.getPermisos().stream()
                .map(this::toPermisoDTO)
                .collect(Collectors.toSet());
        return RolPermisosDTO.builder()
                .idRol(rol.getIdRol())
                .nombre(rol.getNombre())
                .descripcion(rol.getDescripcion())
                .permisos(permisosDTO)
                .build();
    }
}
