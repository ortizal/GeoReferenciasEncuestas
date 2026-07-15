package com.georeferencias.service;

import com.georeferencias.dto.PredioDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface PredioService {
    PredioDTO crear(PredioDTO dto);
    PredioDTO actualizar(Long id, PredioDTO dto);
    void eliminar(Long id);
    PredioDTO obtenerPorId(Long id);
    PredioDTO obtenerPorClave(String claveCatastral);
    Page<PredioDTO> buscar(String busqueda, Boolean activo, Pageable pageable);
    List<PredioDTO> listarPorManzana(Long idManzana);
    List<PredioDTO> listarTodos();
    List<PredioDTO> listarTodosActivos();
    List<PredioDTO> listarConGeoreferencia();
    List<PredioDTO> listarPrediosSinVisitar(Long idManzana);
    byte[] exportarExcel(String busqueda);
    byte[] exportarPDF(String busqueda);
    int importarExcel(MultipartFile file);
    byte[] descargarPlantillaExcel();
}
