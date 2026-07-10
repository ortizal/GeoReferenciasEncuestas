package com.georeferencias.service.impl;

import com.georeferencias.dto.ManzanaDTO;
import com.georeferencias.entity.Manzana;
import com.georeferencias.exception.BadRequestException;
import com.georeferencias.exception.ResourceNotFoundException;
import com.georeferencias.repository.ManzanaRepository;
import com.georeferencias.repository.PredioRepository;
import com.georeferencias.service.ManzanaService;
import lombok.RequiredArgsConstructor;
import org.locationtech.jts.geom.Geometry;
import org.locationtech.jts.io.geojson.GeoJsonReader;
import org.locationtech.jts.io.geojson.GeoJsonWriter;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ManzanaServiceImpl implements ManzanaService {

    private final ManzanaRepository manzanaRepository;
    private final PredioRepository predioRepository;

    @Override
    @Transactional
    public ManzanaDTO crear(ManzanaDTO dto) {
        if (manzanaRepository.existsByClaveCatastralManzana(dto.getClaveCatastralManzana())) {
            throw new BadRequestException("Ya existe una manzana con esa clave catastral");
        }

        Manzana manzana = mapToEntity(dto);
        manzana = manzanaRepository.save(manzana);
        return mapToDTO(manzana);
    }

    @Override
    @Transactional
    public ManzanaDTO actualizar(Long id, ManzanaDTO dto) {
        Manzana manzana = manzanaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Manzana no encontrada"));

        manzana.setNombre(dto.getNombre());
        manzana.setSector(dto.getSector());
        manzana.setBarrio(dto.getBarrio());

        if (dto.getPoligonoGeoJSON() != null) {
            manzana.setPoligono(parseGeoJSON(dto.getPoligonoGeoJSON()));
        }

        manzana = manzanaRepository.save(manzana);
        return mapToDTO(manzana);
    }

    @Override
    @Transactional
    public void eliminar(Long id) {
        Manzana manzana = manzanaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Manzana no encontrada"));
        manzana.setActivo(false);
        manzanaRepository.save(manzana);
    }

    @Override
    @Transactional(readOnly = true)
    public ManzanaDTO obtenerPorId(Long id) {
        Manzana manzana = manzanaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Manzana no encontrada"));
        return mapToDTO(manzana);
    }

    @Override
    @Transactional(readOnly = true)
    public ManzanaDTO obtenerPorClave(String claveCatastral) {
        Manzana manzana = manzanaRepository.findByClaveCatastralManzana(claveCatastral)
                .orElseThrow(() -> new ResourceNotFoundException("Manzana no encontrada"));
        return mapToDTO(manzana);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ManzanaDTO> buscar(String busqueda, Boolean activo, Pageable pageable) {
        return manzanaRepository.buscarConFiltros(busqueda, activo, pageable)
                .map(this::mapToDTO);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ManzanaDTO> listarTodas() {
        return manzanaRepository.findAll().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ManzanaDTO> listarActivas() {
        return manzanaRepository.findAllActivas().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ManzanaDTO> listarConPoligono() {
        return manzanaRepository.findAllConPoligono().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Override
    public byte[] exportarExcel(String busqueda) {
        // Implementación con Apache POI
        return new byte[0];
    }

    @Override
    public byte[] exportarPDF(String busqueda) {
        // Implementación con iText
        return new byte[0];
    }

    private Manzana mapToEntity(ManzanaDTO dto) {
        Manzana manzana = new Manzana();
        manzana.setClaveCatastralManzana(dto.getClaveCatastralManzana());
        manzana.setNombre(dto.getNombre());
        manzana.setSector(dto.getSector());
        manzana.setBarrio(dto.getBarrio());
        manzana.setActivo(true);

        if (dto.getPoligonoGeoJSON() != null) {
            manzana.setPoligono(parseGeoJSON(dto.getPoligonoGeoJSON()));
        }

        return manzana;
    }

    private ManzanaDTO mapToDTO(Manzana manzana) {
        ManzanaDTO.ManzanaDTOBuilder builder = ManzanaDTO.builder()
                .idManzana(manzana.getIdManzana())
                .claveCatastralManzana(manzana.getClaveCatastralManzana())
                .nombre(manzana.getNombre())
                .sector(manzana.getSector())
                .barrio(manzana.getBarrio())
                .area(manzana.getArea())
                .activo(manzana.getActivo())
                .fechaCreacion(manzana.getFechaCreacion())
                .fechaActualizacion(manzana.getFechaActualizacion())
                .usuarioCreacion(manzana.getUsuarioCreacion());

        if (manzana.getPoligono() != null) {
            GeoJsonWriter writer = new GeoJsonWriter();
            builder.poligonoGeoJSON(writer.write(manzana.getPoligono()));
        }

        Long totalPredios = predioRepository.countByManzana(manzana.getIdManzana());
        builder.totalPredios(totalPredios.intValue());

        return builder.build();
    }

    private Geometry parseGeoJSON(String geoJSON) {
        try {
            GeoJsonReader reader = new GeoJsonReader();
            return reader.read(geoJSON);
        } catch (Exception e) {
            throw new BadRequestException("GeoJSON inválido: " + e.getMessage());
        }
    }
}
