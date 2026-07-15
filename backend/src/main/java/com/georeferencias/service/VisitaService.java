package com.georeferencias.service;

import com.georeferencias.dto.VisitaDTO;
import com.georeferencias.enums.EstadoVisita;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import org.springframework.web.multipart.MultipartFile;

public interface VisitaService {
    VisitaDTO crear(VisitaDTO dto);
    VisitaDTO actualizar(Long id, VisitaDTO dto);
    void eliminar(Long id);
    VisitaDTO obtenerPorId(Long id);
    List<VisitaDTO> listarPorPredio(Long idPredio);
    List<VisitaDTO> listarPorUsuario(Long idUsuario);
    List<VisitaDTO> listarPorManzana(Long idManzana);
    List<VisitaDTO> listarPorEstado(EstadoVisita estado);
    Page<VisitaDTO> buscar(String busqueda, Pageable pageable);
    Map<String, Long> contarPorEstado();
    Map<String, Object> obtenerEstadisticas();
    List<Map<String, Object>> obtenerVisitasPorUsuario(LocalDateTime inicio, LocalDateTime fin);
    List<Map<String, Object>> obtenerVisitasPorSector(LocalDateTime inicio, LocalDateTime fin);
    VisitaDTO obtenerUltimaVisitaPredio(Long idPredio);
    int importarVisitas(MultipartFile file);
    List<VisitaDTO> leerExcelBrigada(MultipartFile file);
    Map<String, Object> confirmarImportacion(List<VisitaDTO> visitas, String sessionId);
    byte[] generarReporteNoEncontrados(List<VisitaDTO> visitas);
    byte[] exportarExcel(LocalDateTime fechaInicio, LocalDateTime fechaFin);
    byte[] exportarPDF(LocalDateTime fechaInicio, LocalDateTime fechaFin);
}
