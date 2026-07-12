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
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.geom.PrecisionModel;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
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

    @Override
    @Transactional
    public int importarExcel(MultipartFile file) {
        try (Workbook workbook = new XSSFWorkbook(file.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0);
            int importados = 0;

            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;

                String clave = getCellStringValue(row.getCell(0));
                String propietario = getCellStringValue(row.getCell(1));
                String direccion = getCellStringValue(row.getCell(2));
                String claveManzana = getCellStringValue(row.getCell(3));

                if (clave == null || propietario == null || direccion == null || claveManzana == null) continue;
                if (predioRepository.existsByClaveCatastral(clave)) continue;

                try {
                    Manzana manzana = manzanaRepository.findByClaveCatastralManzana(claveManzana)
                            .orElse(null);
                    if (manzana == null) continue;

                    PredioDTO dto = PredioDTO.builder()
                            .idManzana(manzana.getIdManzana())
                            .claveCatastral(clave)
                            .propietario(propietario)
                            .direccion(direccion)
                            .telefono(getCellStringValue(row.getCell(4)))
                            .observaciones(getCellStringValue(row.getCell(7)))
                            .build();

                    String latStr = getCellStringValue(row.getCell(5));
                    String lonStr = getCellStringValue(row.getCell(6));
                    if (latStr != null && lonStr != null) {
                        dto.setLatitud(Double.parseDouble(latStr));
                        dto.setLongitud(Double.parseDouble(lonStr));
                    }

                    crear(dto);
                    importados++;
                } catch (Exception ignored) {}
            }

            return importados;
        } catch (Exception e) {
            throw new BadRequestException("Error al procesar Excel: " + e.getMessage());
        }
    }

    @Override
    public byte[] descargarPlantillaExcel() {
        try {
            XSSFWorkbook wb = new XSSFWorkbook();
            Sheet sheet = wb.createSheet("Predios");

            String[] headers = {"claveCatastral", "propietario", "direccion", "claveManzana",
                    "telefono", "latitud", "longitud", "observaciones"};
            Row headerRow = sheet.createRow(0);
            for (int i = 0; i < headers.length; i++) {
                headerRow.createCell(i).setCellValue(headers[i]);
            }

            Row exampleRow = sheet.createRow(1);
            exampleRow.createCell(0).setCellValue("PR-001");
            exampleRow.createCell(1).setCellValue("Juan Perez");
            exampleRow.createCell(2).setCellValue("Av. Principal 123");
            exampleRow.createCell(3).setCellValue("MZ-001");
            exampleRow.createCell(4).setCellValue("555-0101");
            exampleRow.createCell(5).setCellValue(-17.7833);
            exampleRow.createCell(6).setCellValue(-63.1821);
            exampleRow.createCell(7).setCellValue("");

            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            wb.write(out);
            wb.close();
            return out.toByteArray();
        } catch (Exception e) {
            throw new BadRequestException("Error al generar plantilla Excel: " + e.getMessage());
        }
    }

    private String getCellStringValue(Cell cell) {
        if (cell == null) return null;
        return switch (cell.getCellType()) {
            case STRING -> cell.getStringCellValue().trim();
            case NUMERIC -> String.valueOf((long) cell.getNumericCellValue());
            case BOOLEAN -> String.valueOf(cell.getBooleanCellValue());
            default -> null;
        };
    }
}
