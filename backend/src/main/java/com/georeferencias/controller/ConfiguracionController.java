package com.georeferencias.controller;

import com.georeferencias.dto.ApiResponse;
import com.georeferencias.dto.ModuloDTO;
import com.georeferencias.dto.PermisoDTO;
import com.georeferencias.dto.RolPermisosDTO;
import com.georeferencias.service.ConfiguracionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Set;

@RestController
@RequestMapping("/configuracion")
@RequiredArgsConstructor
@Tag(name = "Configuración", description = "Gestión de permisos y roles")
public class ConfiguracionController {

    private final ConfiguracionService configuracionService;

    @GetMapping("/modulos")
    @Operation(summary = "Listar módulos")
    public ResponseEntity<ApiResponse<List<ModuloDTO>>> listarModulos() {
        List<ModuloDTO> resultado = configuracionService.listarModulos();
        return ResponseEntity.ok(ApiResponse.exito(resultado, "Módulos obtenidos"));
    }

    @GetMapping("/permisos")
    @Operation(summary = "Listar todos los permisos")
    public ResponseEntity<ApiResponse<List<PermisoDTO>>> listarPermisos() {
        List<PermisoDTO> resultado = configuracionService.listarTodosPermisos();
        return ResponseEntity.ok(ApiResponse.exito(resultado, "Permisos obtenidos"));
    }

    @GetMapping("/roles")
    @Operation(summary = "Listar roles con sus permisos")
    public ResponseEntity<ApiResponse<List<RolPermisosDTO>>> listarRoles() {
        List<RolPermisosDTO> resultado = configuracionService.listarRolesConPermisos();
        return ResponseEntity.ok(ApiResponse.exito(resultado, "Roles obtenidos"));
    }

    @GetMapping("/roles/{idRol}/permisos")
    @Operation(summary = "Obtener permisos de un rol")
    public ResponseEntity<ApiResponse<RolPermisosDTO>> obtenerPermisosRol(@PathVariable Long idRol) {
        RolPermisosDTO resultado = configuracionService.obtenerPermisosPorRol(idRol);
        return ResponseEntity.ok(ApiResponse.exito(resultado, "Permisos del rol obtenidos"));
    }

    @PutMapping("/roles/{idRol}/permisos")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    @Operation(summary = "Actualizar permisos de un rol")
    public ResponseEntity<ApiResponse<RolPermisosDTO>> actualizarPermisos(
            @PathVariable Long idRol,
            @RequestBody Set<Long> idsPermisos) {
        RolPermisosDTO resultado = configuracionService.actualizarPermisosRol(idRol, idsPermisos);
        return ResponseEntity.ok(ApiResponse.exito(resultado, "Permisos actualizados exitosamente"));
    }
}
