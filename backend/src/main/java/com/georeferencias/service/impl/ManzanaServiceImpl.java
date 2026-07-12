package com.georeferencias.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.georeferencias.dto.ManzanaDTO;
import com.georeferencias.entity.Manzana;
import com.georeferencias.exception.BadRequestException;
import com.georeferencias.exception.ResourceNotFoundException;
import com.georeferencias.repository.ManzanaRepository;
import com.georeferencias.repository.PredioRepository;
import com.georeferencias.service.ManzanaService;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.Geometry;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.LinearRing;
import org.locationtech.jts.geom.Polygon;
import org.locationtech.jts.io.geojson.GeoJsonReader;
import org.locationtech.jts.io.geojson.GeoJsonWriter;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.util.ArrayList;
import java.util.Arrays;
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
            Geometry geometry = parseGeoJSON(dto.getPoligonoGeoJSON());
            manzana.setPoligono(transformToWgs84IfNeeded(geometry));
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
        return new byte[0];
    }

    @Override
    public byte[] exportarPDF(String busqueda) {
        return new byte[0];
    }

    private Manzana mapToEntity(ManzanaDTO dto) {
        Manzana manzana = new Manzana();
        manzana.setClaveCatastralManzana(dto.getClaveCatastralManzana());
        manzana.setNombre(dto.getNombre());
        manzana.setSector(dto.getSector());
        manzana.setBarrio(dto.getBarrio());
        manzana.setActivo(true);

        String poligonoGeoJSON = dto.getPoligonoGeoJSON();
        if (poligonoGeoJSON != null && !poligonoGeoJSON.isBlank()) {
            try {
                Geometry geometry = parseGeoJSON(poligonoGeoJSON);
                manzana.setPoligono(transformToWgs84IfNeeded(geometry));
            } catch (BadRequestException ex) {
                manzana.setPoligono(null);
            }
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
        if (geoJSON == null || geoJSON.isBlank()) {
            return null;
        }

        String trimmed = geoJSON.trim();

        try {
            if (trimmed.startsWith("{")) {
                try {
                    GeoJsonReader reader = new GeoJsonReader();
                    return reader.read(trimmed);
                } catch (Exception ignored) {
                    return parseGeometryNode(trimmed);
                }
            }

            if (trimmed.startsWith("[")) {
                return parseGeometryNode(trimmed);
            }

            throw new BadRequestException("GeoJSON inválido: formato no soportado");
        } catch (BadRequestException ex) {
            throw ex;
        } catch (Exception e) {
            throw new BadRequestException("GeoJSON inválido: " + e.getMessage());
        }
    }

    private Geometry parseGeometryNode(String value) {
        try {
            JsonNode root = new ObjectMapper().readTree(value);
            return parseGeometryNode(root);
        } catch (BadRequestException ex) {
            throw ex;
        } catch (Exception e) {
            throw new BadRequestException("GeoJSON inválido: " + e.getMessage());
        }
    }

    private Geometry parseGeometryNode(JsonNode node) {
        if (node == null || node.isNull() || node.isMissingNode()) {
            throw new BadRequestException("GeoJSON inválido: sin contenido");
        }

        if (node.isObject()) {
            JsonNode geometryNode = node.get("geometry");
            if (geometryNode != null && geometryNode.isObject()) {
                return parseGeometryNode(geometryNode);
            }

            JsonNode featuresNode = node.get("features");
            if (featuresNode != null && featuresNode.isArray() && !featuresNode.isEmpty()) {
                return parseGeometryNode(featuresNode.get(0));
            }

            JsonNode coordinatesNode = node.get("coordinates");
            if (coordinatesNode != null) {
                return parseCoordinateArray(coordinatesNode);
            }
        }

        if (node.isArray()) {
            return parseCoordinateArray(node);
        }

        throw new BadRequestException("GeoJSON inválido: formato no soportado");
    }

    private Geometry parseCoordinateArray(JsonNode coordinatesNode) {
        JsonNode ringNode = extractFirstRing(coordinatesNode);
        if (ringNode == null) {
            throw new BadRequestException("GeoJSON inválido: anillo exterior vacío");
        }

        List<Coordinate> shell = new ArrayList<>();
        for (JsonNode pointNode : ringNode) {
            if (!pointNode.isArray() || pointNode.size() < 2) {
                throw new BadRequestException("GeoJSON inválido: coordenada incompleta");
            }

            JsonNode xNode = pointNode.get(0);
            JsonNode yNode = pointNode.get(1);
            if (xNode == null || yNode == null || !xNode.isNumber() || !yNode.isNumber()) {
                throw new BadRequestException("GeoJSON inválido: coordenada no numérica");
            }

            shell.add(new Coordinate(xNode.doubleValue(), yNode.doubleValue()));
        }

        if (shell.size() < 4) {
            throw new BadRequestException("GeoJSON inválido: el polígono debe tener al menos 4 puntos");
        }

        if (!sameCoordinate(shell.get(0), shell.get(shell.size() - 1))) {
            shell.add(new Coordinate(shell.get(0).x, shell.get(0).y));
        }

        GeometryFactory factory = new GeometryFactory();
        LinearRing ring = factory.createLinearRing(shell.toArray(new Coordinate[0]));
        return factory.createPolygon(ring);
    }

    private Geometry transformToWgs84IfNeeded(Geometry geometry) {
        if (geometry == null || !(geometry instanceof Polygon polygon)) {
            return geometry;
        }

        Coordinate[] coordinates = polygon.getExteriorRing().getCoordinates();
        boolean needsTransform = Arrays.stream(coordinates)
                .anyMatch(coord -> Math.abs(coord.x) > 180 || Math.abs(coord.y) > 90);

        if (!needsTransform) {
            return geometry;
        }

        Coordinate[] transformed = Arrays.stream(coordinates)
                .map(this::utm17nToWgs84)
                .toArray(Coordinate[]::new);

        GeometryFactory factory = new GeometryFactory();
        LinearRing ring = factory.createLinearRing(transformed);
        return factory.createPolygon(ring);
    }

    private Coordinate utm17nToWgs84(Coordinate coordinate) {
        double easting = coordinate.x;
        double northing = coordinate.y;
        int zone = 17;
        double lon0 = Math.toRadians((zone * 6) - 183);
        double a = 6378137.0;
        double ecc2 = 0.00669438;
        double eccPrime2 = ecc2 / (1 - ecc2);
        double e1 = (1 - Math.sqrt(1 - ecc2)) / (1 + Math.sqrt(1 - ecc2));

        double m = northing;
        double mu = m / (a * (1 - ecc2 / 4 - 3 * ecc2 * ecc2 / 64 - 5 * ecc2 * ecc2 * ecc2 / 256));
        double phi1 = mu + (3 * e1 / 2 - 27 * e1 * e1 * e1 / 32) * Math.sin(2 * mu)
                + (21 * e1 * e1 / 16 - 55 * e1 * e1 * e1 * e1 / 32) * Math.sin(4 * mu)
                + (151 * e1 * e1 * e1 / 96) * Math.sin(6 * mu);

        double c1 = eccPrime2 * Math.cos(phi1) * Math.cos(phi1);
        double t1 = Math.tan(phi1) * Math.tan(phi1);
        double n1 = a / Math.sqrt(1 - ecc2 * Math.sin(phi1) * Math.sin(phi1));
        double r1 = a * (1 - ecc2) / Math.pow(1 - ecc2 * Math.sin(phi1) * Math.sin(phi1), 1.5);
        double d = easting / (n1 * 1.0);
        double lat = phi1 - (n1 * Math.tan(phi1) / r1) * (
                d * d / 2
                - (5 + 3 * t1 + 10 * c1 - 4 * c1 * c1 - 9 * eccPrime2) * Math.pow(d, 4) / 24
                + (61 + 90 * t1 + 298 * c1 + 45 * t1 * t1 - 252 * eccPrime2 - 3 * c1 * c1) * Math.pow(d, 6) / 720
        );
        double lon = lon0 + (
                d - (1 + 2 * t1 + c1) * Math.pow(d, 3) / 6
                + (5 - 2 * c1 + 28 * t1 - 3 * c1 * c1 + 8 * eccPrime2 + 24 * t1 * t1) * Math.pow(d, 5) / 120
        ) / Math.cos(phi1);

        return new Coordinate(Math.toDegrees(lon), Math.toDegrees(lat));
    }

    private JsonNode extractFirstRing(JsonNode node) {
        if (node == null || !node.isArray() || node.isEmpty()) {
            return null;
        }

        JsonNode first = node.get(0);
        if (first == null || !first.isArray()) {
            return null;
        }

        JsonNode firstInner = first.get(0);
        if (firstInner != null && firstInner.isNumber()) {
            return node;
        }

        if (firstInner != null && firstInner.isArray()) {
            JsonNode nested = firstInner.get(0);
            if (nested != null && nested.isNumber()) {
                return first;
            }
        }

        return null;
    }

    private boolean sameCoordinate(Coordinate a, Coordinate b) {
        return Double.compare(a.x, b.x) == 0 && Double.compare(a.y, b.y) == 0;
    }

    @Override
    @Transactional
    public int importarExcel(MultipartFile file) {
        try (Workbook workbook = new XSSFWorkbook(file.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0);
            int importadas = 0;

            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;

                String clave = getCellStringValue(row.getCell(0));
                String nombre = getCellStringValue(row.getCell(1));

                if (clave == null || nombre == null) continue;
                if (manzanaRepository.existsByClaveCatastralManzana(clave)) continue;

                ManzanaDTO dto = ManzanaDTO.builder()
                        .claveCatastralManzana(clave)
                        .nombre(nombre)
                        .sector(getCellStringValue(row.getCell(2)))
                        .barrio(getCellStringValue(row.getCell(3)))
                        .build();

                try {
                    crear(dto);
                    importadas++;
                } catch (Exception ignored) {}
            }

            return importadas;
        } catch (Exception e) {
            throw new BadRequestException("Error al procesar Excel: " + e.getMessage());
        }
    }

    @Override
    public byte[] descargarPlantillaExcel() {
        try {
            XSSFWorkbook wb = new XSSFWorkbook();
            Sheet sheet = wb.createSheet("Manzanas");

            String[] headers = {"claveCatastral", "nombre", "sector", "barrio"};
            Row headerRow = sheet.createRow(0);
            for (int i = 0; i < headers.length; i++) {
                headerRow.createCell(i).setCellValue(headers[i]);
            }

            Row exampleRow = sheet.createRow(1);
            exampleRow.createCell(0).setCellValue("MZ-001");
            exampleRow.createCell(1).setCellValue("Manzana Ejemplo");
            exampleRow.createCell(2).setCellValue("Norte");
            exampleRow.createCell(3).setCellValue("Centro");

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
