package com.georeferencias.service.impl;

import com.georeferencias.dto.ImportProgressMessage;
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
import org.locationtech.jts.geom.*;
import org.locationtech.jts.io.WKTReader;
import org.locationtech.jts.io.geojson.GeoJsonReader;
import org.locationtech.jts.io.geojson.GeoJsonWriter;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
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
    private final SimpMessagingTemplate messagingTemplate;

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

        if (dto.getPoligonoGeoJSON() != null && !dto.getPoligonoGeoJSON().isBlank()) {
            Geometry geometry = parseGeometry(dto.getPoligonoGeoJSON());
            if (geometry != null) {
                predio.setPoligono(geometry);
            }
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
    public List<PredioDTO> listarTodosActivos() {
        return predioRepository.findAllActivos().stream()
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
                "clave_catastral", "propietario", "direccion", "nombre_manzana",
                "telefono", "referencia", "telefono_propietario", "nro_predial",
                "cedula_catastral", "cod_predio", "uso", "servicios_basicos",
                "estado", "observaciones", "latitud", "longitud",
                "area_terreno", "frentes", "norte", "sur", "este", "oeste",
                "area_construccion", "nro_pisos", "poligono"
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
                row.createCell(24).setCellValue(p.getPoligonoGeoJSON() != null ? p.getPoligonoGeoJSON() : "");
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

        if (dto.getPoligonoGeoJSON() != null && !dto.getPoligonoGeoJSON().isBlank()) {
            Geometry geometry = parseGeometry(dto.getPoligonoGeoJSON());
            if (geometry != null) {
                predio.setPoligono(geometry);
            }
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

        if (predio.getPoligono() != null) {
            try {
                GeoJsonWriter writer = new GeoJsonWriter();
                builder.poligonoGeoJSON(writer.write(predio.getPoligono()));
            } catch (Exception ignored) {}
        }

        return builder.build();
    }

    @Override
    @Transactional
    public int importarExcel(MultipartFile file, String sessionId) {
        try (Workbook workbook = new XSSFWorkbook(file.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0);

            int claveCol = findColumnIndex(sheet, "clave_catastral", "claveCatastral");
            int propietarioCol = findColumnIndex(sheet, "propietario");
            int direccionCol = findColumnIndex(sheet, "direccion");
            int claveManzanaCol = findColumnIndex(sheet, "clave_manzana", "claveManzana", "manzana");
            int telefonoCol = findColumnIndex(sheet, "telefono");
            int referenciaCol = findColumnIndex(sheet, "referencia");
            int telefonoPropCol = findColumnIndex(sheet, "telefono_propietario", "telefonoPropietario");
            int nroPredialCol = findColumnIndex(sheet, "nro_predial", "nroPredial");
            int cedulaCatastralCol = findColumnIndex(sheet, "cedula_catastral", "cedulaCatastral");
            int codPredioCol = findColumnIndex(sheet, "cod_predio", "codPredio");
            int usoCol = findColumnIndex(sheet, "uso");
            int serviciosCol = findColumnIndex(sheet, "servicios_basicos", "serviciosBasicos");
            int estadoCol = findColumnIndex(sheet, "estado");
            int observacionesCol = findColumnIndex(sheet, "observaciones");
            int latCol = findColumnIndex(sheet, "latitud", "lat");
            int lonCol = findColumnIndex(sheet, "longitud", "lon", "lng");
            int areaTerrenoCol = findColumnIndex(sheet, "area_terreno", "areaTerreno");
            int frentesCol = findColumnIndex(sheet, "frentes");
            int norteCol = findColumnIndex(sheet, "norte");
            int surCol = findColumnIndex(sheet, "sur");
            int esteCol = findColumnIndex(sheet, "este");
            int oesteCol = findColumnIndex(sheet, "oeste");
            int areaConstrCol = findColumnIndex(sheet, "area_construccion", "areaConstruccion");
            int nroPisosCol = findColumnIndex(sheet, "nro_pisos", "nroPisos");
            int poligonoCol = findColumnIndex(sheet, "poligono", "poligonoGeoJSON", "geojson");

            java.util.Set<String> existingClaves = new java.util.HashSet<>(
                predioRepository.findAllClaveCatastral()
            );

            java.util.Map<String, Manzana> manzanaCache = new java.util.HashMap<>();
            for (Manzana m : manzanaRepository.findAll()) {
                manzanaCache.put(m.getClaveCatastralManzana(), m);
            }

            java.util.List<Predio> batch = new java.util.ArrayList<>();
            int importados = 0;
            int skipped = 0;

            int totalRows = 0;
            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;
                String clave = getCellStringValue(row.getCell(claveCol >= 0 ? claveCol : 0));
                if (clave != null && !clave.isBlank()) totalRows++;
            }

            int processed = 0;
            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;

                String clave = getCellStringValue(row.getCell(claveCol >= 0 ? claveCol : 0));
                String propietario = getCellStringValue(row.getCell(propietarioCol >= 0 ? propietarioCol : 1));
                String direccion = getCellStringValue(row.getCell(direccionCol >= 0 ? direccionCol : 2));
                String claveManzana = getCellStringValue(row.getCell(claveManzanaCol >= 0 ? claveManzanaCol : 3));

                if (clave == null || clave.isBlank() || claveManzana == null || claveManzana.isBlank()) {
                    processed++;
                    sendPredioProgress(sessionId, processed, totalRows, clave != null ? clave : "", "SKIP", importados, skipped, false);
                    continue;
                }
                if (existingClaves.contains(clave)) {
                    skipped++;
                    processed++;
                    sendPredioProgress(sessionId, processed, totalRows, clave, "DUPLICATE", importados, skipped, false);
                    continue;
                }

                Manzana manzana = manzanaCache.get(claveManzana);
                if (manzana == null && claveManzana.length() > 1 && claveManzana.startsWith("0")) {
                    manzana = manzanaCache.get(claveManzana.substring(1));
                }
                if (manzana == null) {
                    skipped++;
                    processed++;
                    sendPredioProgress(sessionId, processed, totalRows, clave, "SKIP", importados, skipped, false);
                    continue;
                }

                try {
                    Predio predio = new Predio();
                    predio.setClaveCatastral(clave);
                    predio.setPropietario(propietario != null ? propietario : "");
                    predio.setDireccion(direccion != null ? direccion : "");
                    predio.setTelefono(getCellOptional(row, telefonoCol));
                    predio.setReferencia(getCellOptional(row, referenciaCol));
                    predio.setTelefonoPropietario(getCellOptional(row, telefonoPropCol));
                    predio.setNroPredial(getCellOptional(row, nroPredialCol));
                    predio.setCedulaCatastral(getCellOptional(row, cedulaCatastralCol));
                    predio.setCodPredio(getCellOptional(row, codPredioCol));
                    predio.setUso(getCellOptional(row, usoCol));
                    predio.setServiciosBasicos(getCellOptional(row, serviciosCol));
                    predio.setEstado(getCellOptional(row, estadoCol));
                    predio.setObservaciones(getCellOptional(row, observacionesCol));
                    predio.setManzana(manzana);
                    predio.setActivo(true);

                    String latStr = getCellOptional(row, latCol);
                    String lonStr = getCellOptional(row, lonCol);
                    if (latStr != null && lonStr != null) {
                        try {
                            double lat = Double.parseDouble(latStr);
                            double lon = Double.parseDouble(lonStr);
                            Point point = geometryFactory.createPoint(new Coordinate(lon, lat));
                            predio.setGeoreferencia(point);
                        } catch (NumberFormatException ignored) {}
                    }

                    predio.setAreaTerreno(parseDouble(getCellOptional(row, areaTerrenoCol)));
                    predio.setFrentes(parseDouble(getCellOptional(row, frentesCol)));
                    predio.setNorte(parseDouble(getCellOptional(row, norteCol)));
                    predio.setSur(parseDouble(getCellOptional(row, surCol)));
                    predio.setEste(parseDouble(getCellOptional(row, esteCol)));
                    predio.setOeste(parseDouble(getCellOptional(row, oesteCol)));
                    predio.setAreaConstruccion(parseDouble(getCellOptional(row, areaConstrCol)));

                    String nroPisosStr = getCellOptional(row, nroPisosCol);
                    if (nroPisosStr != null) {
                        try { predio.setNroPisos(Integer.parseInt(nroPisosStr)); } catch (NumberFormatException ignored) {}
                    }

                    String poligonoStr = getCellOptional(row, poligonoCol);
                    if (poligonoStr != null && !poligonoStr.isBlank()) {
                        Geometry geometry = parseGeometry(poligonoStr);
                        if (geometry != null) {
                            predio.setPoligono(geometry);
                        }
                    }

                    batch.add(predio);
                    existingClaves.add(clave);
                    importados++;

                    if (batch.size() >= 500) {
                        predioRepository.saveAll(batch);
                        batch.clear();
                    }
                } catch (Exception ignored) {}
                processed++;
                sendPredioProgress(sessionId, processed, totalRows, clave, "IMPORTED", importados, skipped, false);
            }

            if (!batch.isEmpty()) {
                predioRepository.saveAll(batch);
            }

            sendPredioProgress(sessionId, totalRows, totalRows, "", "COMPLETED", importados, skipped, true);

            return importados;
        } catch (Exception e) {
            throw new BadRequestException("Error al procesar Excel: " + e.getMessage());
        }
    }

    private void sendPredioProgress(String sessionId, int current, int total, String rowKey, String rowStatus,
                                    int imported, int skipped, boolean completed) {
        if (sessionId == null || sessionId.isBlank()) return;
        try {
            ImportProgressMessage msg = ImportProgressMessage.builder()
                    .sessionId(sessionId)
                    .current(current)
                    .total(total)
                    .rowKey(rowKey)
                    .rowStatus(rowStatus)
                    .imported(imported)
                    .duplicated(skipped)
                    .completed(completed)
                    .build();
            messagingTemplate.convertAndSend("/topic/import-progress/" + sessionId, msg);
        } catch (Exception e) {
            // ignore
        }
    }

    @Override
    public byte[] descargarPlantillaExcel() {
        try {
            XSSFWorkbook wb = new XSSFWorkbook();
            Sheet sheet = wb.createSheet("Predios");

            String[] headers = {
                "clave_catastral", "propietario", "direccion", "clave_manzana",
                "telefono", "referencia", "telefono_propietario", "nro_predial",
                "cedula_catastral", "cod_predio", "uso", "servicios_basicos",
                "estado", "observaciones", "latitud", "longitud",
                "area_terreno", "frentes", "norte", "sur", "este", "oeste",
                "area_construccion", "nro_pisos", "poligono"
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
            exampleRow.createCell(0).setCellValue("40159001002006001");
            exampleRow.createCell(1).setCellValue("Juan Perez");
            exampleRow.createCell(2).setCellValue("Av. Principal 123");
            exampleRow.createCell(3).setCellValue("40159001002006");
            exampleRow.createCell(4).setCellValue("099-123-4567");
            exampleRow.createCell(5).setCellValue("Frente a la iglesia");
            exampleRow.createCell(6).setCellValue("099-987-6543");
            exampleRow.createCell(7).setCellValue("NP-001");
            exampleRow.createCell(8).setCellValue("CC-001");
            exampleRow.createCell(9).setCellValue("P-001");
            exampleRow.createCell(10).setCellValue("Residencial");
            exampleRow.createCell(11).setCellValue("Agua, Luz, Gas");
            exampleRow.createCell(12).setCellValue("POSITIVO");
            exampleRow.createCell(13).setCellValue("Observacion de ejemplo");
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
            exampleRow.createCell(24).setCellValue("MULTIPOLYGON (((-78.468 -0.181, -78.467 -0.181, -78.467 -0.180, -78.468 -0.180, -78.468 -0.181)))");

            Row noteRow = sheet.createRow(3);
            Cell noteCell = noteRow.createCell(0);
            noteCell.setCellValue("Nota: Solo clave_catastral, direccion y clave_manzana son obligatorios. poligono acepta WKT o GeoJSON. Se puede dejar vacio.");
            CellStyle noteStyle = wb.createCellStyle();
            Font noteFont = wb.createFont();
            noteFont.setItalic(true);
            noteFont.setColor(IndexedColors.GREY_25_PERCENT.index);
            noteStyle.setFont(noteFont);
            noteCell.setCellStyle(noteStyle);
            sheet.addMergedRegion(new org.apache.poi.ss.util.CellRangeAddress(3, 3, 0, 24));

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

    private String getCellOptional(Row row, int colIndex) {
        if (colIndex < 0) return null;
        return getCellStringValue(row.getCell(colIndex));
    }

    private Double parseDouble(String value) {
        if (value == null || value.isBlank()) return null;
        try { return Double.parseDouble(value); } catch (NumberFormatException e) { return null; }
    }

    private int findColumnIndex(Sheet sheet, String... possibleNames) {
        Row headerRow = sheet.getRow(0);
        if (headerRow == null) return -1;
        for (int col = 0; col < headerRow.getLastCellNum(); col++) {
            String headerValue = getCellStringValue(headerRow.getCell(col));
            if (headerValue == null) continue;
            String lower = headerValue.toLowerCase().trim();
            for (String name : possibleNames) {
                if (lower.equals(name.toLowerCase())) {
                    return col;
                }
            }
        }
        return -1;
    }

    private Geometry parseGeometry(String input) {
        if (input == null || input.isBlank()) return null;
        String trimmed = input.trim();

        if (trimmed.startsWith("{")) {
            try {
                GeoJsonReader reader = new GeoJsonReader();
                Geometry geom = reader.read(trimmed);
                if (geom instanceof Polygon || geom instanceof MultiPolygon) {
                    return geom;
                }
            } catch (Exception ignored) {}
        }

        try {
            WKTReader reader = new WKTReader();
            Geometry geom = reader.read(trimmed);
            if (geom instanceof Polygon) {
                return geometryFactory.createMultiPolygon(new Polygon[]{(Polygon) geom});
            }
            if (geom instanceof MultiPolygon) {
                return geom;
            }
        } catch (Exception ignored) {}

        return null;
    }
}
