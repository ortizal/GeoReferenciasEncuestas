package com.georeferencias.controller;

import com.georeferencias.dto.ApiResponse;
import com.georeferencias.dto.UsuarioDTO;
import com.georeferencias.service.UsuarioService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/usuarios")
@RequiredArgsConstructor
@Tag(name = "Usuarios", description = "CRUD de usuarios")
public class UsuarioController {

    private final UsuarioService usuarioService;

    @PostMapping
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    @Operation(summary = "Crear usuario")
    public ResponseEntity<ApiResponse<UsuarioDTO>> crear(@RequestBody UsuarioDTO dto) {
        UsuarioDTO resultado = usuarioService.crear(dto);
        return ResponseEntity.ok(ApiResponse.exito(resultado, "Usuario creado exitosamente"));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    @Operation(summary = "Actualizar usuario")
    public ResponseEntity<ApiResponse<UsuarioDTO>> actualizar(@PathVariable Long id, @RequestBody UsuarioDTO dto) {
        UsuarioDTO resultado = usuarioService.actualizar(id, dto);
        return ResponseEntity.ok(ApiResponse.exito(resultado, "Usuario actualizado exitosamente"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    @Operation(summary = "Eliminar usuario")
    public ResponseEntity<ApiResponse<Void>> eliminar(@PathVariable Long id) {
        usuarioService.eliminar(id);
        return ResponseEntity.ok(ApiResponse.exito(null, "Usuario eliminado exitosamente"));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtener usuario por ID")
    public ResponseEntity<ApiResponse<UsuarioDTO>> obtenerPorId(@PathVariable Long id) {
        UsuarioDTO resultado = usuarioService.obtenerPorId(id);
        return ResponseEntity.ok(ApiResponse.exito(resultado, "Usuario obtenido"));
    }

    @GetMapping
    @Operation(summary = "Buscar usuarios con paginación")
    public ResponseEntity<ApiResponse<Page<UsuarioDTO>>> buscar(
            @RequestParam(defaultValue = "") String busqueda,
            @RequestParam(required = false) Boolean activo,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<UsuarioDTO> resultado = usuarioService.buscar(busqueda, activo,
                org.springframework.data.domain.PageRequest.of(page, size));
        return ResponseEntity.ok(ApiResponse.exito(resultado, "Usuarios obtenidos"));
    }

    @PutMapping("/{id}/bloquear")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    @Operation(summary = "Bloquear usuario")
    public ResponseEntity<ApiResponse<UsuarioDTO>> bloquear(@PathVariable Long id) {
        UsuarioDTO resultado = usuarioService.bloquear(id);
        return ResponseEntity.ok(ApiResponse.exito(resultado, "Usuario bloqueado exitosamente"));
    }

    @PutMapping("/{id}/desbloquear")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    @Operation(summary = "Desbloquear usuario")
    public ResponseEntity<ApiResponse<UsuarioDTO>> desbloquear(@PathVariable Long id) {
        UsuarioDTO resultado = usuarioService.desbloquear(id);
        return ResponseEntity.ok(ApiResponse.exito(resultado, "Usuario desbloqueado exitosamente"));
    }

    @PutMapping("/{id}/grupos")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    @Operation(summary = "Asignar grupos a usuario")
    public ResponseEntity<ApiResponse<UsuarioDTO>> asignarGrupos(
            @PathVariable Long id, @RequestBody List<Long> idsGrupos) {
        UsuarioDTO resultado = usuarioService.asignarGrupos(id, idsGrupos);
        return ResponseEntity.ok(ApiResponse.exito(resultado, "Grupos asignados exitosamente"));
    }
}
