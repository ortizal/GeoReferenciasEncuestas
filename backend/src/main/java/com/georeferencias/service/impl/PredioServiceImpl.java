package com.georeferencias.service.impl;

import com.georeferencias.dto.PredioDTO;
import com.georeferencias.entity.Manzana;
import com.georeferencias.entity.Predio;
import com.georeferencias.exception.BadRequestException;
import com.georeferencias.exception.ResourceNotFoundException;
import com.georeferencias.repository.ManzanaRepository;
import com.georeferencias.repository.PredioRepository;
import com.georeferencias.service.PredioService;
import lombok.RequiredArgsConstructor;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.geom.PrecisionModel;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PredioServiceImpl implements PredioService {

    private final PredioRepository predioRepository;
    private final ManzanaRepository manzanaRepository;

    private static final GeometryFactory geometryFactory = new GeometryFactory(new PrecisionModel(), 4326);

    @Override
    @Transactional
    public PredioDTO crear(PredioDTO dto) {
        if (predioRepository.existsByClaveCatastral(dto.getClaveCatastral())) {
            throw new BadRequestException("Ya existe un predio con esa clave catastral");
        }

        Manzana manzana = manzanaRepository.findById(dto.getIdManzana())
                .orElseThrow(() -> new ResourceNotFoundException("Manzana no encontrada"));

        Predio predio = mapToEntity(dto);
        predio.setManzana(manzana);
        predio = predioRepository.save(predio);
        return mapToDTO(predio);
    }

    @Override
    @Transactional
    public PredioDTO actualizar(Long id, PredioDTO dto) {
        Predio predio = predioRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Predio no encontrada"));

        predio.setClaveCatastral(dto.getClaveCatastral());
        predio.setPropietario(dto.getPropietario());
        predio.setDireccion(dto.getDireccion());
        predio.setTelefono(dto.getTelefono());
        predio.setObservaciones(dto.getObservaciones());

        if (dto.getLatitud() != null && dto.getLongitud() != null) {
            Point point = geometryFactory.createPoint(
                    new Coordinate(dto.getLongitud(), dto.getLatitud()));
            predio.setGeoreferencia(point);
        }

        predio = predioRepository.save(predio);
        return mapToDTO(predio);
    }

    @Override
    @Transactional
    public void eliminar(Long id) {
        Predio predio = predioRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Predio no encontrada"));
        predio.setActivo(false);
        predioRepository.save(predio);
    }

    @Override
    @Transactional(readOnly = true)
    public PredioDTO obtenerPorId(Long id) {
        Predio predio = predioRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Predio no encontrada"));
        return mapToDTO(predio);
    }

    @Override
    @Transactional(readOnly = true)
    public PredioDTO obtenerPorClave(String claveCatastral) {
        Predio predio = predioRepository.findByClaveCatastral(claveCatastral)
                .orElseThrow(() -> new ResourceNotFoundException("Predio no encontrada"));
        return mapToDTO(predio);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<PredioDTO> buscar(String busqueda, Boolean activo, Pageable pageable) {
        return predioRepository.buscarConFiltros(busqueda, activo, pageable)
                .map(this::mapToDTO);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PredioDTO> listarPorManzana(Long idManzana) {
        return predioRepository.findByManzanaIdManzanaAndActivoTrue(idManzana).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<PredioDTO> listarTodos() {
        return predioRepository.findAll().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<PredioDTO> listarConGeoreferencia() {
        return predioRepository.findAllConGeoreferencia().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<PredioDTO> listarPrediosSinVisitar(Long idManzana) {
        return predioRepository.findPrediosSinVisitar(idManzana).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Override
    public byte[] exportarExcel(String busqueda) {
        return new byte[0];
    }

    @Override
    public byte[] exportarPDF(String busqueda) {
        return new byte[0];
    }

    private Predio mapToEntity(PredioDTO dto) {
        Predio predio = new Predio();
        predio.setClaveCatastral(dto.getClaveCatastral());
        predio.setPropietario(dto.getPropietario());
        predio.setDireccion(dto.getDireccion());
        predio.setTelefono(dto.getTelefono());
        predio.setObservaciones(dto.getObservaciones());
        predio.setActivo(true);

        if (dto.getLatitud() != null && dto.getLongitud() != null) {
            Point point = geometryFactory.createPoint(
                    new Coordinate(dto.getLongitud(), dto.getLatitud()));
            predio.setGeoreferencia(point);
        }

        return predio;
    }

    private PredioDTO mapToDTO(Predio predio) {
        PredioDTO.PredioDTOBuilder builder = PredioDTO.builder()
                .idPredio(predio.getIdPredio())
                .idManzana(predio.getManzana().getIdManzana())
                .nombreManzana(predio.getManzana().getNombre())
                .claveCatastral(predio.getClaveCatastral())
                .propietario(predio.getPropietario())
                .direccion(predio.getDireccion())
                .telefono(predio.getTelefono())
                .observaciones(predio.getObservaciones())
                .activo(predio.getActivo())
                .fechaCreacion(predio.getFechaCreacion())
                .fechaActualizacion(predio.getFechaActualizacion())
                .usuarioCreacion(predio.getUsuarioCreacion());

        if (predio.getGeoreferencia() != null) {
            Point point = (Point) predio.getGeoreferencia();
            builder.latitud(point.getY());
            builder.longitud(point.getX());
        }

        return builder.build();
    }
}
