package com.georeferencias.controller;

import com.georeferencias.dto.ApiResponse;
import com.georeferencias.dto.GrupoDTO;
import com.georeferencias.service.GrupoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/grupos")
@RequiredArgsConstructor
@Tag(name = "Grupos", description = "CRUD de grupos de trabajo")
public class GrupoController {

    private final GrupoService grupoService;

    @PostMapping
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    @Operation(summary = "Crear grupo")
    public ResponseEntity<ApiResponse<GrupoDTO>> crear(@RequestBody GrupoDTO dto) {
        GrupoDTO resultado = grupoService.crear(dto);
        return ResponseEntity.ok(ApiResponse.exito(resultado, "Grupo creado exitosamente"));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    @Operation(summary = "Actualizar grupo")
    public ResponseEntity<ApiResponse<GrupoDTO>> actualizar(@PathVariable Long id, @RequestBody GrupoDTO dto) {
        GrupoDTO resultado = grupoService.actualizar(id, dto);
        return ResponseEntity.ok(ApiResponse.exito(resultado, "Grupo actualizado exitosamente"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    @Operation(summary = "Eliminar grupo")
    public ResponseEntity<ApiResponse<Void>> eliminar(@PathVariable Long id) {
        grupoService.eliminar(id);
        return ResponseEntity.ok(ApiResponse.exito(null, "Grupo eliminado exitosamente"));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtener grupo por ID")
    public ResponseEntity<ApiResponse<GrupoDTO>> obtenerPorId(@PathVariable Long id) {
        GrupoDTO resultado = grupoService.obtenerPorId(id);
        return ResponseEntity.ok(ApiResponse.exito(resultado, "Grupo obtenido"));
    }

    @GetMapping
    @Operation(summary = "Buscar grupos con paginación")
    public ResponseEntity<ApiResponse<Page<GrupoDTO>>> buscar(
            @RequestParam(defaultValue = "") String busqueda,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<GrupoDTO> resultado;
        if (busqueda.isBlank()) {
            resultado = grupoService.listarTodos(org.springframework.data.domain.PageRequest.of(page, size));
        } else {
            resultado = grupoService.buscar(busqueda, org.springframework.data.domain.PageRequest.of(page, size));
        }
        return ResponseEntity.ok(ApiResponse.exito(resultado, "Grupos obtenidos"));
    }
}
