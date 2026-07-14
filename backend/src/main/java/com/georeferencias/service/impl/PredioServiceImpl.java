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
        predio.setReferencia(dto.getReferencia());
        predio.setAreaTerreno(dto.getAreaTerreno());
        predio.setFrentes(dto.getFrentes());
        predio.setNorte(dto.getNorte());
        predio.setSur(dto.getSur());
        predio.setEste(dto.getEste());
        predio.setOeste(dto.getOeste());
        predio.setTelefonoPropietario(dto.getTelefonoPropietario());
        predio.setAreaConstruccion(dto.getAreaConstruccion());
        predio.setNroPisos(dto.getNroPisos());
        predio.setUso(dto.getUso());
        predio.setNroPredial(dto.getNroPredial());
        predio.setCedulaCatastral(dto.getCedulaCatastral());
        predio.setServiciosBasicos(dto.getServiciosBasicos());
        predio.setCodPredio(dto.getCodPredio());
        predio.setEstado(dto.getEstado());
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
        List<PredioDTO> predios = buscar(busqueda, true, Pageable.unpaged()).getContent();

        try (XSSFWorkbook wb = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = wb.createSheet("Predios");

            String[] headers = {
                "claveCatastral", "propietario", "direccion", "nombreManzana",
                "telefono", "referencia", "telefonoPropietario", "nroPredial",
                "cedulaCatastral", "codPredio", "uso", "serviciosBasicos",
                "estado", "observaciones", "latitud", "longitud",
                "areaTerreno", "frentes", "norte", "sur", "este", "oeste",
                "areaConstruccion", "nroPisos"
            };
            Row headerRow = sheet.createRow(0);
            CellStyle headerStyle = wb.createCellStyle();
            Font headerFont = wb.createFont();
            headerFont.setBold(true);
            headerStyle.setFont(headerFont);
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            int rowNum = 1;
            for (PredioDTO p : predios) {
                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(p.getClaveCatastral() != null ? p.getClaveCatastral() : "");
                row.createCell(1).setCellValue(p.getPropietario() != null ? p.getPropietario() : "");
                row.createCell(2).setCellValue(p.getDireccion() != null ? p.getDireccion() : "");
                row.createCell(3).setCellValue(p.getNombreManzana() != null ? p.getNombreManzana() : "");
                row.createCell(4).setCellValue(p.getTelefono() != null ? p.getTelefono() : "");
                row.createCell(5).setCellValue(p.getReferencia() != null ? p.getReferencia() : "");
                row.createCell(6).setCellValue(p.getTelefonoPropietario() != null ? p.getTelefonoPropietario() : "");
                row.createCell(7).setCellValue(p.getNroPredial() != null ? p.getNroPredial() : "");
                row.createCell(8).setCellValue(p.getCedulaCatastral() != null ? p.getCedulaCatastral() : "");
                row.createCell(9).setCellValue(p.getCodPredio() != null ? p.getCodPredio() : "");
                row.createCell(10).setCellValue(p.getUso() != null ? p.getUso() : "");
                row.createCell(11).setCellValue(p.getServiciosBasicos() != null ? p.getServiciosBasicos() : "");
                row.createCell(12).setCellValue(p.getEstado() != null ? p.getEstado() : "");
                row.createCell(13).setCellValue(p.getObservaciones() != null ? p.getObservaciones() : "");
                row.createCell(14).setCellValue(p.getLatitud() != null ? p.getLatitud() : 0);
                row.createCell(15).setCellValue(p.getLongitud() != null ? p.getLongitud() : 0);
                row.createCell(16).setCellValue(p.getAreaTerreno() != null ? p.getAreaTerreno() : 0);
                row.createCell(17).setCellValue(p.getFrentes() != null ? p.getFrentes() : 0);
                row.createCell(18).setCellValue(p.getNorte() != null ? p.getNorte() : 0);
                row.createCell(19).setCellValue(p.getSur() != null ? p.getSur() : 0);
                row.createCell(20).setCellValue(p.getEste() != null ? p.getEste() : 0);
                row.createCell(21).setCellValue(p.getOeste() != null ? p.getOeste() : 0);
                row.createCell(22).setCellValue(p.getAreaConstruccion() != null ? p.getAreaConstruccion() : 0);
                row.createCell(23).setCellValue(p.getNroPisos() != null ? p.getNroPisos() : 0);
            }

            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            wb.write(out);
            return out.toByteArray();
        } catch (Exception e) {
            throw new BadRequestException("Error al exportar Excel: " + e.getMessage());
        }
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
        predio.setReferencia(dto.getReferencia());
        predio.setAreaTerreno(dto.getAreaTerreno());
        predio.setFrentes(dto.getFrentes());
        predio.setNorte(dto.getNorte());
        predio.setSur(dto.getSur());
        predio.setEste(dto.getEste());
        predio.setOeste(dto.getOeste());
        predio.setTelefonoPropietario(dto.getTelefonoPropietario());
        predio.setAreaConstruccion(dto.getAreaConstruccion());
        predio.setNroPisos(dto.getNroPisos());
        predio.setUso(dto.getUso());
        predio.setNroPredial(dto.getNroPredial());
        predio.setCedulaCatastral(dto.getCedulaCatastral());
        predio.setServiciosBasicos(dto.getServiciosBasicos());
        predio.setCodPredio(dto.getCodPredio());
        predio.setEstado(dto.getEstado());
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
                .referencia(predio.getReferencia())
                .areaTerreno(predio.getAreaTerreno())
                .frentes(predio.getFrentes())
                .norte(predio.getNorte())
                .sur(predio.getSur())
                .este(predio.getEste())
                .oeste(predio.getOeste())
                .telefonoPropietario(predio.getTelefonoPropietario())
                .areaConstruccion(predio.getAreaConstruccion())
                .nroPisos(predio.getNroPisos())
                .uso(predio.getUso())
                .nroPredial(predio.getNroPredial())
                .cedulaCatastral(predio.getCedulaCatastral())
                .serviciosBasicos(predio.getServiciosBasicos())
                .codPredio(predio.getCodPredio())
                .estado(predio.getEstado())
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
                            .referencia(getCellStringValue(row.getCell(5)))
                            .telefonoPropietario(getCellStringValue(row.getCell(6)))
                            .nroPredial(getCellStringValue(row.getCell(7)))
                            .cedulaCatastral(getCellStringValue(row.getCell(8)))
                            .codPredio(getCellStringValue(row.getCell(9)))
                            .uso(getCellStringValue(row.getCell(10)))
                            .serviciosBasicos(getCellStringValue(row.getCell(11)))
                            .estado(getCellStringValue(row.getCell(12)))
                            .observaciones(getCellStringValue(row.getCell(13)))
                            .build();

                    String latStr = getCellStringValue(row.getCell(14));
                    String lonStr = getCellStringValue(row.getCell(15));
                    if (latStr != null && lonStr != null) {
                        try {
                            dto.setLatitud(Double.parseDouble(latStr));
                            dto.setLongitud(Double.parseDouble(lonStr));
                        } catch (NumberFormatException ignored) {}
                    }

                    String areaTerrenoStr = getCellStringValue(row.getCell(16));
                    if (areaTerrenoStr != null) {
                        try { dto.setAreaTerreno(Double.parseDouble(areaTerrenoStr)); } catch (NumberFormatException ignored) {}
                    }

                    String frentesStr = getCellStringValue(row.getCell(17));
                    if (frentesStr != null) {
                        try { dto.setFrentes(Double.parseDouble(frentesStr)); } catch (NumberFormatException ignored) {}
                    }

                    String norteStr = getCellStringValue(row.getCell(18));
                    if (norteStr != null) {
                        try { dto.setNorte(Double.parseDouble(norteStr)); } catch (NumberFormatException ignored) {}
                    }

                    String surStr = getCellStringValue(row.getCell(19));
                    if (surStr != null) {
                        try { dto.setSur(Double.parseDouble(surStr)); } catch (NumberFormatException ignored) {}
                    }

                    String esteStr = getCellStringValue(row.getCell(20));
                    if (esteStr != null) {
                        try { dto.setEste(Double.parseDouble(esteStr)); } catch (NumberFormatException ignored) {}
                    }

                    String oesteStr = getCellStringValue(row.getCell(21));
                    if (oesteStr != null) {
                        try { dto.setOeste(Double.parseDouble(oesteStr)); } catch (NumberFormatException ignored) {}
                    }

                    String areaConstrStr = getCellStringValue(row.getCell(22));
                    if (areaConstrStr != null) {
                        try { dto.setAreaConstruccion(Double.parseDouble(areaConstrStr)); } catch (NumberFormatException ignored) {}
                    }

                    String nroPisosStr = getCellStringValue(row.getCell(23));
                    if (nroPisosStr != null) {
                        try { dto.setNroPisos(Integer.parseInt(nroPisosStr)); } catch (NumberFormatException ignored) {}
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

            String[] headers = {
                "claveCatastral", "propietario", "direccion", "claveManzana",
                "telefono", "referencia", "telefonoPropietario", "nroPredial",
                "cedulaCatastral", "codPredio", "uso", "serviciosBasicos",
                "estado", "observaciones", "latitud", "longitud",
                "areaTerreno", "frentes", "norte", "sur", "este", "oeste",
                "areaConstruccion", "nroPisos"
            };
            Row headerRow = sheet.createRow(0);
            CellStyle headerStyle = wb.createCellStyle();
            Font headerFont = wb.createFont();
            headerFont.setBold(true);
            headerStyle.setFont(headerFont);
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            Row exampleRow = sheet.createRow(1);
            exampleRow.createCell(0).setCellValue("PR-001");
            exampleRow.createCell(1).setCellValue("Juan Perez");
            exampleRow.createCell(2).setCellValue("Av. Principal 123");
            exampleRow.createCell(3).setCellValue("MZ-001");
            exampleRow.createCell(4).setCellValue("555-0101");
            exampleRow.createCell(5).setCellValue("Frente a la iglesia");
            exampleRow.createCell(6).setCellValue("099-123-4567");
            exampleRow.createCell(7).setCellValue("NP-001");
            exampleRow.createCell(8).setCellValue("CC-001");
            exampleRow.createCell(9).setCellValue("P-001");
            exampleRow.createCell(10).setCellValue("Residencial");
            exampleRow.createCell(11).setCellValue("Agua, Luz, Gas");
            exampleRow.createCell(12).setCellValue("POSITIVO");
            exampleRow.createCell(13).setCellValue("Observación de ejemplo");
            exampleRow.createCell(14).setCellValue(-0.1807);
            exampleRow.createCell(15).setCellValue(-78.4678);
            exampleRow.createCell(16).setCellValue(120.5);
            exampleRow.createCell(17).setCellValue(10.0);
            exampleRow.createCell(18).setCellValue(5.0);
            exampleRow.createCell(19).setCellValue(5.0);
            exampleRow.createCell(20).setCellValue(8.0);
            exampleRow.createCell(21).setCellValue(8.0);
            exampleRow.createCell(22).setCellValue(95.0);
            exampleRow.createCell(23).setCellValue(2);

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
