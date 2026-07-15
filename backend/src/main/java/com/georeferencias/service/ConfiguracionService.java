package com.georeferencias.service;

import com.georeferencias.dto.ModuloDTO;
import com.georeferencias.dto.PermisoDTO;
import com.georeferencias.dto.RolPermisosDTO;

import java.util.List;
import java.util.Set;

public interface ConfiguracionService {

    List<ModuloDTO> listarModulos();

    List<PermisoDTO> listarTodosPermisos();

    List<RolPermisosDTO> listarRolesConPermisos();

    RolPermisosDTO obtenerPermisosPorRol(Long idRol);

    RolPermisosDTO actualizarPermisosRol(Long idRol, Set<Long> idsPermisos);
}
