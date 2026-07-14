package com.georeferencias.controller;

import com.georeferencias.dto.ApiResponse;
import com.georeferencias.dto.ImportPreviewDTO;
import com.georeferencias.dto.ImportResultDTO;
import com.georeferencias.dto.ManzanaDTO;
import com.georeferencias.service.ManzanaService;
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
@RequestMapping("/manzanas")
@RequiredArgsConstructor
@Tag(name = "Manzanas", description = "CRUD de manzanas catastrales")
public class ManzanaController {

    private final ManzanaService manzanaService;

    @PostMapping
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    @Operation(summary = "Crear manzana")
    public ResponseEntity<ApiResponse<ManzanaDTO>> crear(@Valid @RequestBody ManzanaDTO dto) {
        ManzanaDTO resultado = manzanaService.crear(dto);
        return ResponseEntity.ok(ApiResponse.exito(resultado, "Manzana creada exitosamente"));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    @Operation(summary = "Actualizar manzana")
    public ResponseEntity<ApiResponse<ManzanaDTO>> actualizar(
            @PathVariable Long id, @Valid @RequestBody ManzanaDTO dto) {
        ManzanaDTO resultado = manzanaService.actualizar(id, dto);
        return ResponseEntity.ok(ApiResponse.exito(resultado, "Manzana actualizada exitosamente"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    @Operation(summary = "Eliminar manzana")
    public ResponseEntity<ApiResponse<Void>> eliminar(@PathVariable Long id) {
        manzanaService.eliminar(id);
        return ResponseEntity.ok(ApiResponse.exito(null, "Manzana eliminada exitosamente"));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtener manzana por ID")
    public ResponseEntity<ApiResponse<ManzanaDTO>> obtenerPorId(@PathVariable Long id) {
        ManzanaDTO resultado = manzanaService.obtenerPorId(id);
        return ResponseEntity.ok(ApiResponse.exito(resultado, "Manzana obtenida"));
    }

    @GetMapping("/clave/{clave}")
    @Operation(summary = "Obtener manzana por clave catastral")
    public ResponseEntity<ApiResponse<ManzanaDTO>> obtenerPorClave(@PathVariable String clave) {
        ManzanaDTO resultado = manzanaService.obtenerPorClave(clave);
        return ResponseEntity.ok(ApiResponse.exito(resultado, "Manzana obtenida"));
    }

    @GetMapping
    @Operation(summary = "Buscar manzanas con paginación")
    public ResponseEntity<ApiResponse<Page<ManzanaDTO>>> buscar(
            @RequestParam(defaultValue = "") String busqueda,
            @RequestParam(defaultValue = "true") Boolean activo,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<ManzanaDTO> resultado = manzanaService.buscar(
                busqueda, activo, PageRequest.of(page, size, Sort.by("nombre")));
        return ResponseEntity.ok(ApiResponse.exito(resultado, "Manzanas obtenidas"));
    }

    @GetMapping("/listar")
    @Operation(summary = "Listar todas las manzanas activas")
    public ResponseEntity<ApiResponse<List<ManzanaDTO>>> listar() {
        List<ManzanaDTO> resultado = manzanaService.listarActivas();
        return ResponseEntity.ok(ApiResponse.exito(resultado, "Manzanas obtenidas"));
    }

    @GetMapping("/poligonos")
    @Operation(summary = "Listar manzanas con polígono")
    public ResponseEntity<ApiResponse<List<ManzanaDTO>>> listarConPoligono() {
        List<ManzanaDTO> resultado = manzanaService.listarConPoligono();
        return ResponseEntity.ok(ApiResponse.exito(resultado, "Manzanas obtenidas"));
    }

    @GetMapping("/exportar/excel")
    @Operation(summary = "Exportar manzanas a Excel")
    public ResponseEntity<byte[]> exportarExcel(@RequestParam(defaultValue = "") String busqueda) {
        byte[] datos = manzanaService.exportarExcel(busqueda);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment;filename=manzanas.xlsx")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(datos);
    }

    @GetMapping("/exportar/pdf")
    @Operation(summary = "Exportar manzanas a PDF")
    public ResponseEntity<byte[]> exportarPDF(@RequestParam(defaultValue = "") String busqueda) {
        byte[] datos = manzanaService.exportarPDF(busqueda);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment;filename=manzanas.pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(datos);
    }

    @PostMapping("/importar/preview")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    @Operation(summary = "Vista previa del archivo Excel antes de importar")
    public ResponseEntity<ApiResponse<ImportPreviewDTO>> previewExcel(@RequestParam("file") MultipartFile file) {
        ImportPreviewDTO preview = manzanaService.previewExcel(file);
        return ResponseEntity.ok(ApiResponse.exito(preview, "Vista previa generada"));
    }

    @PostMapping("/importar/excel")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    @Operation(summary = "Importar manzanas desde Excel")
    public ResponseEntity<ApiResponse<ImportResultDTO>> importarExcel(@RequestParam("file") MultipartFile file) {
        ImportResultDTO resultado = manzanaService.importarExcel(file);
        String mensaje = String.format("%d éxitos, %d errores de %d filas",
                resultado.getSuccessCount(), resultado.getErrorCount(), resultado.getTotalRows());
        return ResponseEntity.ok(ApiResponse.exito(resultado, mensaje));
    }

    @GetMapping("/plantilla/excel")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    @Operation(summary = "Descargar plantilla Excel para importar manzanas")
    public ResponseEntity<byte[]> descargarPlantillaExcel() {
        byte[] datos = manzanaService.descargarPlantillaExcel();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment;filename=plantilla_manzanas.xlsx")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(datos);
    }
}
