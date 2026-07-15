package com.georeferencias.controller;

import com.georeferencias.dto.ApiResponse;
import com.georeferencias.dto.PredioDTO;
import com.georeferencias.service.PredioService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/predios")
@RequiredArgsConstructor
@Tag(name = "Predios", description = "CRUD de predios catastrales")
public class PredioController {

    private final PredioService predioService;

    @PostMapping
    @PreAuthorize("hasRole('ADMINISTRADOR') or hasRole('SUPERVISOR')")
    @Operation(summary = "Crear predio")
    public ResponseEntity<ApiResponse<PredioDTO>> crear(@Valid @RequestBody PredioDTO dto) {
        PredioDTO resultado = predioService.crear(dto);
        return ResponseEntity.ok(ApiResponse.exito(resultado, "Predio creado exitosamente"));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMINISTRADOR') or hasRole('SUPERVISOR')")
    @Operation(summary = "Actualizar predio")
    public ResponseEntity<ApiResponse<PredioDTO>> actualizar(
            @PathVariable Long id, @Valid @RequestBody PredioDTO dto) {
        PredioDTO resultado = predioService.actualizar(id, dto);
        return ResponseEntity.ok(ApiResponse.exito(resultado, "Predio actualizado exitosamente"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    @Operation(summary = "Eliminar predio")
    public ResponseEntity<ApiResponse<Void>> eliminar(@PathVariable Long id) {
        predioService.eliminar(id);
        return ResponseEntity.ok(ApiResponse.exito(null, "Predio eliminado exitosamente"));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtener predio por ID")
    public ResponseEntity<ApiResponse<PredioDTO>> obtenerPorId(@PathVariable Long id) {
        PredioDTO resultado = predioService.obtenerPorId(id);
        return ResponseEntity.ok(ApiResponse.exito(resultado, "Predio obtenido"));
    }

    @GetMapping("/clave/{clave}")
    @Operation(summary = "Obtener predio por clave catastral")
    public ResponseEntity<ApiResponse<PredioDTO>> obtenerPorClave(@PathVariable String clave) {
        PredioDTO resultado = predioService.obtenerPorClave(clave);
        return ResponseEntity.ok(ApiResponse.exito(resultado, "Predio obtenido"));
    }

    @GetMapping
    @Operation(summary = "Buscar predios con paginación")
    public ResponseEntity<ApiResponse<Page<PredioDTO>>> buscar(
            @RequestParam(defaultValue = "") String busqueda,
            @RequestParam(defaultValue = "true") Boolean activo,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<PredioDTO> resultado = predioService.buscar(
                busqueda, activo, PageRequest.of(page, size, Sort.by("claveCatastral")));
        return ResponseEntity.ok(ApiResponse.exito(resultado, "Predios obtenidos"));
    }

    @GetMapping("/manzana/{idManzana}")
    @Operation(summary = "Listar predios por manzana")
    public ResponseEntity<ApiResponse<List<PredioDTO>>> listarPorManzana(@PathVariable Long idManzana) {
        List<PredioDTO> resultado = predioService.listarPorManzana(idManzana);
        return ResponseEntity.ok(ApiResponse.exito(resultado, "Predios obtenidos"));
    }

    @GetMapping("/georeferencia")
    @Operation(summary = "Listar predios con georeferencia")
    public ResponseEntity<ApiResponse<List<PredioDTO>>> listarConGeoreferencia() {
        List<PredioDTO> resultado = predioService.listarConGeoreferencia();
        return ResponseEntity.ok(ApiResponse.exito(resultado, "Predios obtenidos"));
    }

    @GetMapping("/todos")
    @Operation(summary = "Listar todos los predios activos")
    public ResponseEntity<ApiResponse<List<PredioDTO>>> listarTodosActivos() {
        List<PredioDTO> resultado = predioService.listarTodosActivos();
        return ResponseEntity.ok(ApiResponse.exito(resultado, "Predios obtenidos"));
    }

    @GetMapping("/sin-visitar/{idManzana}")
    @Operation(summary = "Listar predios sin visitar por manzana")
    public ResponseEntity<ApiResponse<List<PredioDTO>>> listarSinVisitar(@PathVariable Long idManzana) {
        List<PredioDTO> resultado = predioService.listarPrediosSinVisitar(idManzana);
        return ResponseEntity.ok(ApiResponse.exito(resultado, "Predios sin visitar obtenidos"));
    }

    @GetMapping("/exportar/excel")
    @Operation(summary = "Exportar predios a Excel")
    public ResponseEntity<byte[]> exportarExcel(@RequestParam(defaultValue = "") String busqueda) {
        byte[] datos = predioService.exportarExcel(busqueda);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment;filename=predios.xlsx")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(datos);
    }

    @GetMapping("/exportar/pdf")
    @Operation(summary = "Exportar predios a PDF")
    public ResponseEntity<byte[]> exportarPDF(@RequestParam(defaultValue = "") String busqueda) {
        byte[] datos = predioService.exportarPDF(busqueda);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment;filename=predios.pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(datos);
    }

    @PostMapping("/importar/excel")
    @PreAuthorize("hasRole('ADMINISTRADOR') or hasRole('SUPERVISOR')")
    @Operation(summary = "Importar predios desde Excel")
    public ResponseEntity<ApiResponse<String>> importarExcel(
            @RequestParam("file") MultipartFile file,
            @RequestHeader(value = "X-Import-Session", required = false) String sessionId) {
        int importados = predioService.importarExcel(file, sessionId);
        return ResponseEntity.ok(ApiResponse.exito(
                importados + " predios importados", "Importación completada"));
    }

    @GetMapping("/plantilla/excel")
    @PreAuthorize("hasRole('ADMINISTRADOR') or hasRole('SUPERVISOR')")
    @Operation(summary = "Descargar plantilla Excel para importar predios")
    public ResponseEntity<byte[]> descargarPlantillaExcel() {
        byte[] datos = predioService.descargarPlantillaExcel();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment;filename=plantilla_predios.xlsx")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(datos);
    }
}
