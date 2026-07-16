package com.georeferencias.service.impl;

import com.georeferencias.dto.NotificacionVisitaDTO;
import com.georeferencias.dto.ImportProgressMessage;
import com.georeferencias.dto.VisitaDTO;
import com.georeferencias.entity.Manzana;
import com.georeferencias.entity.Predio;
import com.georeferencias.entity.Usuario;
import com.georeferencias.entity.Visita;
import com.georeferencias.enums.EstadoVisita;
import com.georeferencias.exception.BadRequestException;
import com.georeferencias.exception.ResourceNotFoundException;
import com.georeferencias.repository.ManzanaRepository;
import com.georeferencias.repository.PredioRepository;
import com.georeferencias.repository.UsuarioRepository;
import com.georeferencias.repository.VisitaRepository;
import com.georeferencias.service.VisitaService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.hssf.usermodel.HSSFWorkbook;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Optional;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class VisitaServiceImpl implements VisitaService {

    private final VisitaRepository visitaRepository;
    private final PredioRepository predioRepository;
    private final ManzanaRepository manzanaRepository;
    private final UsuarioRepository usuarioRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Override
    @Transactional
    public VisitaDTO crear(VisitaDTO dto) {
        Predio predio = predioRepository.findById(dto.getIdPredio())
                .orElseThrow(() -> new ResourceNotFoundException("Predio no encontrado"));

        Usuario usuario = null;
        if (dto.getIdUsuarioVisitador() != null) {
            usuario = usuarioRepository.findById(dto.getIdUsuarioVisitador())
                    .orElse(null);
        }

        Visita visita = new Visita();
        visita.setPredio(predio);
        if (usuario != null) {
            visita.setUsuarioVisitador(usuario);
        }
        visita.setFechaVisita(dto.getFechaVisita());
        visita.setEstadoVisita(EstadoVisita.valueOf(dto.getEstadoVisita()));
        visita.setObservaciones(dto.getObservaciones());
        visita.setFotografia(dto.getFotografia());
        visita.setLatitudVisita(dto.getLatitudVisita());
        visita.setLongitudVisita(dto.getLongitudVisita());
        visita.setHoraInicio(dto.getHoraInicio());
        visita.setHoraFin(dto.getHoraFin());
        visita.setViviendaTrabajable(dto.getViviendaTrabajable());
        visita.setGrupoBrigada(dto.getGrupoBrigada());
        visita.setNombreBrigada(dto.getNombreBrigada());
        visita.setFechaBrigada(dto.getFechaBrigada());
        visita.setComentarioBrigada(dto.getComentarioBrigada());
        visita.setNumCasasBrigada(dto.getNumCasasBrigada());
        visita.setParroquia(dto.getParroquia());
        visita.setBarrio(dto.getBarrio());
        visita.setApoyaAlcalde(dto.getApoyaAlcalde());
        visita.setEstrella(dto.getEstrella());
        visita.setFechaCreacion(LocalDateTime.now());

        visita = visitaRepository.save(visita);

        NotificacionVisitaDTO notificacion = NotificacionVisitaDTO.builder()
                .idVisita(visita.getIdVisita())
                .idPredio(predio.getIdPredio())
                .claveCatastralPredio(predio.getClaveCatastral())
                .propietarioPredio(predio.getPropietario())
                .nombreVisitador(dto.getNombreVisitador() != null ? dto.getNombreVisitador() : (usuario != null ? usuario.getNombre() + " " + usuario.getApellido() : "Sin asignar"))
                .estadoVisita(visita.getEstadoVisita().name())
                .fechaVisita(visita.getFechaVisita())
                .mensaje("Nueva visita registrada en predio " + predio.getClaveCatastral())
                .build();

        try {
            messagingTemplate.convertAndSend("/topic/visitas", notificacion);
            log.info("Notificación de visita enviada por WebSocket: {}", notificacion.getMensaje());
        } catch (Exception e) {
            log.warn("Error al enviar notificación WebSocket: {}", e.getMessage());
        }

        return mapToDTO(visita);
    }

    @Override
    @Transactional
    public VisitaDTO actualizar(Long id, VisitaDTO dto) {
        Visita visita = visitaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Visita no encontrada"));

        visita.setEstadoVisita(EstadoVisita.valueOf(dto.getEstadoVisita()));
        visita.setObservaciones(dto.getObservaciones());
        visita.setFotografia(dto.getFotografia());
        visita.setHoraFin(dto.getHoraFin());

        visita = visitaRepository.save(visita);
        return mapToDTO(visita);
    }

    @Override
    @Transactional
    public void eliminar(Long id) {
        if (!visitaRepository.existsById(id)) {
            throw new ResourceNotFoundException("Visita no encontrada");
        }
        visitaRepository.deleteById(id);
    }

    @Override
    @Transactional(readOnly = true)
    public VisitaDTO obtenerPorId(Long id) {
        Visita visita = visitaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Visita no encontrada"));
        return mapToDTO(visita);
    }

    @Override
    @Transactional(readOnly = true)
    public List<VisitaDTO> listarPorPredio(Long idPredio) {
        return visitaRepository.findByPredioIdPredioOrderByFechaVisitaDesc(idPredio).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<VisitaDTO> listarPorUsuario(Long idUsuario) {
        return visitaRepository.findByUsuarioVisitadorIdUsuarioOrderByFechaVisitaDesc(idUsuario).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<VisitaDTO> listarPorManzana(Long idManzana) {
        return visitaRepository.findByManzana(idManzana).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<VisitaDTO> listarPorEstado(EstadoVisita estado) {
        return visitaRepository.findByEstado(estado).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<VisitaDTO> buscar(String busqueda, String estado, LocalDateTime desde, LocalDateTime hasta, Pageable pageable) {
        return visitaRepository.buscarConFiltros(busqueda, estado, desde, hasta, pageable).map(this::mapToDTO);
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Long> contarPorEstado() {
        Map<String, Long> conteo = new HashMap<>();
        for (EstadoVisita estado : EstadoVisita.values()) {
            conteo.put(estado.name(), visitaRepository.countByEstado(estado));
        }
        return conteo;
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> obtenerEstadisticas() {
        Map<String, Object> estadisticas = new HashMap<>();
        estadisticas.put("conteoPorEstado", contarPorEstado());
        estadisticas.put("totalVisitas", visitaRepository.count());
        return estadisticas;
    }

    @Override
    @Transactional(readOnly = true)
    public List<Map<String, Object>> obtenerVisitasPorUsuario(LocalDateTime inicio, LocalDateTime fin) {
        return visitaRepository.countVisitasByUsuario(inicio, fin).stream()
                .map(row -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("idUsuario", row[0]);
                    map.put("total", row[1]);
                    return map;
                })
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<Map<String, Object>> obtenerVisitasPorSector(LocalDateTime inicio, LocalDateTime fin) {
        return visitaRepository.countVisitasBySectorYEstado(inicio, fin).stream()
                .map(row -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("sector", row[0]);
                    map.put("estado", row[1]);
                    map.put("total", row[2]);
                    return map;
                })
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public VisitaDTO obtenerUltimaVisitaPredio(Long idPredio) {
        return visitaRepository.findFirstByPredioIdPredioOrderByFechaVisitaDesc(idPredio)
                .map(this::mapToDTO)
                .orElse(null);
    }

    @Override
    public byte[] exportarExcel(LocalDateTime fechaInicio, LocalDateTime fechaFin) {
        return new byte[0];
    }

    @Override
    public byte[] exportarPDF(LocalDateTime fechaInicio, LocalDateTime fechaFin) {
        return new byte[0];
    }

    @Override
    @Transactional
    public int importarVisitas(MultipartFile file) {
        List<VisitaDTO> preview = leerExcelBrigada(file);
        Map<String, Object> resultado = confirmarImportacion(preview, null);
        return (int) resultado.get("importadas");
    }

    @Override
    @Transactional
    public Map<String, Object> confirmarImportacion(List<VisitaDTO> visitas, String sessionId) {
        int importadas = 0;
        int actualizadas = 0;
        int noEncontrados = 0;
        Usuario adminUsuario = usuarioRepository.findById(1L).orElse(null);
        int total = visitas.size();
        log.info("Iniciando confirmación de importación: {} registros, sessionId={}", total, sessionId);

        for (int i = 0; i < visitas.size(); i++) {
            VisitaDTO dto = visitas.get(i);
            String rowKey = dto.getClaveCatastralPredio() != null ? dto.getClaveCatastralPredio() : "";

            if (dto.getIdPredio() == null) {
                noEncontrados++;
                sendProgress(sessionId, i + 1, total, rowKey, "NOT_FOUND", importadas, actualizadas, 0, noEncontrados, false);
                continue;
            }

            Predio predio = predioRepository.findById(dto.getIdPredio()).orElse(null);
            if (predio == null) {
                noEncontrados++;
                sendProgress(sessionId, i + 1, total, rowKey, "NOT_FOUND", importadas, actualizadas, 0, noEncontrados, false);
                continue;
            }

            try {
                Optional<Visita> visitaExistente = visitaRepository.findFirstByPredioIdPredioOrderByFechaVisitaDesc(predio.getIdPredio());

                Visita visita;
                boolean esActualizacion = false;
                if (visitaExistente.isPresent()) {
                    visita = visitaExistente.get();
                    esActualizacion = true;
                } else {
                    visita = new Visita();
                    visita.setPredio(predio);
                    if (adminUsuario != null) {
                        visita.setUsuarioVisitador(adminUsuario);
                    }
                    visita.setFechaCreacion(dto.getFechaBrigada() != null ? dto.getFechaBrigada() : LocalDateTime.now());
                }

                if (adminUsuario != null) {
                    visita.setUsuarioVisitador(adminUsuario);
                }
                visita.setFechaVisita(dto.getFechaVisita() != null ? dto.getFechaVisita() : LocalDateTime.now());
                visita.setEstadoVisita(EstadoVisita.valueOf(dto.getEstadoVisita()));
                visita.setViviendaTrabajable(dto.getViviendaTrabajable() != null ? dto.getViviendaTrabajable() : true);
                visita.setGrupoBrigada(dto.getGrupoBrigada());
                visita.setNombreBrigada(dto.getNombreBrigada());
                visita.setFechaBrigada(dto.getFechaBrigada());
                visita.setComentarioBrigada(truncate(dto.getComentarioBrigada(), 500));
                visita.setNumCasasBrigada(truncate(dto.getNumCasasBrigada(), 50));
                visita.setParroquia(truncate(dto.getParroquia(), 100));
                visita.setBarrio(truncate(dto.getBarrio(), 100));
                visita.setApoyaAlcalde(dto.getApoyaAlcalde());
                visita.setEstrella(dto.getEstrella());

                visitaRepository.save(visita);

                Manzana manzana = predio.getManzana();
                if (manzana != null) {
                    boolean manzanaModificada = false;
                    if ((manzana.getSector() == null || manzana.getSector().isBlank())
                            && dto.getParroquia() != null && !dto.getParroquia().isBlank()) {
                        manzana.setSector(truncate(dto.getParroquia(), 50));
                        manzanaModificada = true;
                    }
                    if ((manzana.getBarrio() == null || manzana.getBarrio().isBlank())
                            && dto.getBarrio() != null && !dto.getBarrio().isBlank()) {
                        manzana.setBarrio(truncate(dto.getBarrio(), 50));
                        manzanaModificada = true;
                    }
                    if (manzanaModificada) {
                        manzanaRepository.save(manzana);
                    }
                }

                if (esActualizacion) {
                    actualizadas++;
                    sendProgress(sessionId, i + 1, total, rowKey, "UPDATED", importadas, actualizadas, 0, noEncontrados, false);
                } else {
                    importadas++;
                    sendProgress(sessionId, i + 1, total, rowKey, "IMPORTED", importadas, actualizadas, 0, noEncontrados, false);
                }
            } catch (Exception e) {
                log.error("Error procesando fila {}: clave={}, error={}", i + 1, rowKey, e.getMessage(), e);
                noEncontrados++;
                sendProgress(sessionId, i + 1, total, rowKey, "ERROR", importadas, actualizadas, 0, noEncontrados, false);
            }
        }

        sendProgress(sessionId, total, total, "", "COMPLETED", importadas, actualizadas, 0, noEncontrados, true);

        Map<String, Object> resultado = new java.util.HashMap<>();
        resultado.put("importadas", importadas);
        resultado.put("actualizadas", actualizadas);
        resultado.put("noEncontrados", noEncontrados);
        resultado.put("total", total);
        return resultado;
    }

    private void sendProgress(String sessionId, int current, int total, String rowKey, String rowStatus,
                              int imported, int duplicated, int errors, int notFound, boolean completed) {
        if (sessionId == null || sessionId.isBlank()) return;
        try {
            ImportProgressMessage msg = ImportProgressMessage.builder()
                    .sessionId(sessionId)
                    .current(current)
                    .total(total)
                    .rowKey(rowKey)
                    .rowStatus(rowStatus)
                    .imported(imported)
                    .duplicated(duplicated)
                    .errors(errors)
                    .notFound(notFound)
                    .completed(completed)
                    .build();
            messagingTemplate.convertAndSend("/topic/import-progress/" + sessionId, msg);
        } catch (Exception e) {
            log.warn("Error enviando progreso de importación: {}", e.getMessage());
        }
    }

    @Override
    public byte[] generarReporteNoEncontrados(List<VisitaDTO> visitas) {
        try (Workbook workbook = new org.apache.poi.xssf.usermodel.XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("No Encontrados");

            org.apache.poi.ss.usermodel.CellStyle headerStyle = workbook.createCellStyle();
            org.apache.poi.ss.usermodel.Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor((short) 0xDC3545);
            headerStyle.setFillPattern(org.apache.poi.ss.usermodel.FillPatternType.SOLID_FOREGROUND);

            String[] headers = {"#", "Clave Catastral", "Parroquia", "Barrio", "Estado", "Brigada", "Grupo"};
            org.apache.poi.ss.usermodel.Row headerRow = sheet.createRow(0);
            for (int i = 0; i < headers.length; i++) {
                org.apache.poi.ss.usermodel.Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
                sheet.setColumnWidth(i, 4000);
            }

            int rowNum = 1;
            int num = 1;
            for (VisitaDTO dto : visitas) {
                if (dto.getIdPredio() != null) continue;
                org.apache.poi.ss.usermodel.Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(num++);
                row.createCell(1).setCellValue(dto.getClaveCatastralPredio() != null ? dto.getClaveCatastralPredio() : "");
                row.createCell(2).setCellValue(dto.getParroquia() != null ? dto.getParroquia() : "");
                row.createCell(3).setCellValue(dto.getBarrio() != null ? dto.getBarrio() : "");
                row.createCell(4).setCellValue(dto.getEstadoVisita() != null ? dto.getEstadoVisita() : "");
                row.createCell(5).setCellValue(dto.getNombreBrigada() != null ? dto.getNombreBrigada() : "");
                row.createCell(6).setCellValue(dto.getGrupoBrigada() != null ? dto.getGrupoBrigada() : "");
            }

            java.io.ByteArrayOutputStream bos = new java.io.ByteArrayOutputStream();
            workbook.write(bos);
            return bos.toByteArray();
        } catch (Exception e) {
            log.error("Error generando reporte: {}", e.getMessage());
            return new byte[0];
        }
    }

    @Override
    public List<VisitaDTO> leerExcelBrigada(MultipartFile file) {
        List<VisitaDTO> resultado = new java.util.ArrayList<>();
        try (Workbook workbook = WorkbookFactory.create(file.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0);

            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;

                String claveCata = getCellStringValue(row.getCell(1));
                if (claveCata == null || claveCata.isBlank()) continue;
                claveCata = claveCata.replaceAll("[^0-9]", "").trim();

                String brigada1 = getCellStringValue(row.getCell(7));
                String ar = getCellStringValue(row.getCell(8));
                String estrella = getCellStringValue(row.getCell(9));
                String grupoBrigada = getCellStringValue(row.getCell(10));
                String nombreBrigada = getCellStringValue(row.getCell(11));
                String fechaBrigadaStr = getCellStringValue(row.getCell(12));
                String cometBrigada = getCellStringValue(row.getCell(13));
                String numCasas = getCellStringValue(row.getCell(14));
                String parroquia = getCellStringValue(row.getCell(5));
                String barrio = getCellStringValue(row.getCell(6));

                // Map brigada1 to EstadoVisita
                EstadoVisita estado;
                boolean viviendaTrabajable;
                if (brigada1 == null) {
                    estado = EstadoVisita.EN_BLANCO;
                    viviendaTrabajable = false;
                } else {
                    switch (brigada1.trim().toUpperCase()) {
                        case "P": estado = EstadoVisita.POSITIVO; viviendaTrabajable = true; break;
                        case "N": estado = EstadoVisita.NEGATIVO; viviendaTrabajable = true; break;
                        case "D": estado = EstadoVisita.INDECISO; viviendaTrabajable = true; break;
                        case "NT": estado = EstadoVisita.NO_TRABAJABLE; viviendaTrabajable = false; break;
                        case "B": estado = EstadoVisita.EN_BLANCO; viviendaTrabajable = false; break;
                        default: estado = EstadoVisita.EN_BLANCO; viviendaTrabajable = false; break;
                    }
                }

                boolean apoyaAlcalde = ar != null && (ar.trim().equalsIgnoreCase("AR") || ar.trim().equalsIgnoreCase("ÁR"));
                boolean esEstrella = estrella != null && estrella.trim().equalsIgnoreCase("EST");

                LocalDateTime fechaBrigada = null;
                if (fechaBrigadaStr != null && !fechaBrigadaStr.isBlank()) {
                    try {
                        fechaBrigada = LocalDateTime.parse(fechaBrigadaStr.trim(),
                            DateTimeFormatter.ofPattern("M/d/yyyy H:mm"));
                    } catch (Exception e1) {
                        try {
                            fechaBrigada = LocalDateTime.parse(fechaBrigadaStr.trim(),
                                DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm"));
                        } catch (Exception e2) {
                            try {
                                java.time.LocalDate ld = java.time.LocalDate.parse(fechaBrigadaStr.trim(),
                                    DateTimeFormatter.ofPattern("M/d/yyyy"));
                                fechaBrigada = ld.atStartOfDay();
                            } catch (Exception e3) {
                                try {
                                    java.time.LocalDate ld = java.time.LocalDate.parse(fechaBrigadaStr.trim(),
                                        DateTimeFormatter.ofPattern("dd/MM/yyyy"));
                                    fechaBrigada = ld.atStartOfDay();
                                } catch (Exception e4) { }
                            }
                        }
                    }
                }

                // Check if predio exists for preview
                var predioOpt = predioRepository.findByClaveCatastral(claveCata);
                Long idPredioEncontrado = predioOpt.map(Predio::getIdPredio).orElse(null);
                String nombrePredio = predioOpt.map(Predio::getPropietario).orElse("NO ENCONTRADO");

                VisitaDTO dto = VisitaDTO.builder()
                        .idPredio(idPredioEncontrado)
                        .claveCatastralPredio(claveCata)
                        .propietarioPredio(nombrePredio)
                        .estadoVisita(estado.name())
                        .viviendaTrabajable(viviendaTrabajable)
                        .grupoBrigada(grupoBrigada)
                        .nombreBrigada(nombreBrigada)
                        .fechaBrigada(fechaBrigada)
                        .comentarioBrigada(cometBrigada)
                        .numCasasBrigada(numCasas)
                        .parroquia(parroquia)
                        .barrio(barrio)
                        .apoyaAlcalde(apoyaAlcalde)
                        .estrella(esEstrella)
                        .fechaVisita(fechaBrigada != null ? fechaBrigada : LocalDateTime.now())
                        .build();
                resultado.add(dto);
            }
        } catch (Exception e) {
            log.error("Error leyendo Excel de brigada: {}", e.getMessage());
            throw new RuntimeException("Error al leer archivo: " + e.getMessage());
        }
        return resultado;
    }

    private String getCellStringValue(Cell cell) {
        if (cell == null) return null;
        switch (cell.getCellType()) {
            case STRING: return cell.getStringCellValue();
            case NUMERIC:
                if (DateUtil.isCellDateFormatted(cell)) {
                    return cell.getDateCellValue().toString();
                }
                DataFormatter formatter = new DataFormatter();
                String formatted = formatter.formatCellValue(cell);
                if (formatted != null && !formatted.isBlank()) {
                    return formatted;
                }
                double val = cell.getNumericCellValue();
                if (val == Math.floor(val) && !Double.isInfinite(val)) {
                    return String.valueOf((long) val);
                }
                return String.valueOf(val);
            case BOOLEAN: return String.valueOf(cell.getBooleanCellValue());
            case FORMULA:
                try { return cell.getStringCellValue(); } catch (Exception e) {
                    try { return String.valueOf(cell.getNumericCellValue()); } catch (Exception e2) { return null; }
                }
            default: return null;
        }
    }

    private VisitaDTO mapToDTO(Visita visita) {
        return VisitaDTO.builder()
                .idVisita(visita.getIdVisita())
                .idPredio(visita.getPredio().getIdPredio())
                .claveCatastralPredio(visita.getPredio().getClaveCatastral())
                .propietarioPredio(visita.getPredio().getPropietario())
                .idUsuarioVisitador(visita.getUsuarioVisitador() != null ? visita.getUsuarioVisitador().getIdUsuario() : null)
                .nombreVisitador(visita.getUsuarioVisitador() != null ? visita.getUsuarioVisitador().getNombre() + " " + visita.getUsuarioVisitador().getApellido() : "Sin asignar")
                .fechaVisita(visita.getFechaVisita())
                .estadoVisita(visita.getEstadoVisita().name())
                .observaciones(visita.getObservaciones())
                .fotografia(visita.getFotografia())
                .latitudVisita(visita.getLatitudVisita())
                .longitudVisita(visita.getLongitudVisita())
                .horaInicio(visita.getHoraInicio())
                .horaFin(visita.getHoraFin())
                .viviendaTrabajable(visita.getViviendaTrabajable())
                .grupoBrigada(visita.getGrupoBrigada())
                .nombreBrigada(visita.getNombreBrigada())
                .fechaBrigada(visita.getFechaBrigada())
                .comentarioBrigada(visita.getComentarioBrigada())
                .numCasasBrigada(visita.getNumCasasBrigada())
                .parroquia(visita.getParroquia())
                .barrio(visita.getBarrio())
                .apoyaAlcalde(visita.getApoyaAlcalde())
                .estrella(visita.getEstrella())
                .fechaCreacion(visita.getFechaCreacion())
                .build();
    }

    private String truncate(String value, int maxLength) {
        if (value == null) return null;
        return value.length() <= maxLength ? value : value.substring(0, maxLength);
    }
}
