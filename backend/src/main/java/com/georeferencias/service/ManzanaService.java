package com.georeferencias.service;

import com.georeferencias.dto.ManzanaDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface ManzanaService {
    ManzanaDTO crear(ManzanaDTO dto);
    ManzanaDTO actualizar(Long id, ManzanaDTO dto);
    void eliminar(Long id);
    ManzanaDTO obtenerPorId(Long id);
    ManzanaDTO obtenerPorClave(String claveCatastral);
    Page<ManzanaDTO> buscar(String busqueda, Boolean activo, Pageable pageable);
    List<ManzanaDTO> listarTodas();
    List<ManzanaDTO> listarActivas();
    List<ManzanaDTO> listarConPoligono();
    byte[] exportarExcel(String busqueda);
    byte[] exportarPDF(String busqueda);
    int importarExcel(MultipartFile file);
    byte[] descargarPlantillaExcel();
}
