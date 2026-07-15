package com.georeferencias.service.impl;

import com.georeferencias.dto.NotificacionVisitaDTO;
import com.georeferencias.dto.VisitaDTO;
import com.georeferencias.entity.Predio;
import com.georeferencias.entity.Usuario;
import com.georeferencias.entity.Visita;
import com.georeferencias.enums.EstadoVisita;
import com.georeferencias.exception.BadRequestException;
import com.georeferencias.exception.ResourceNotFoundException;
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

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class VisitaServiceImpl implements VisitaService {

    private final VisitaRepository visitaRepository;
    private final PredioRepository predioRepository;
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
    public Page<VisitaDTO> buscar(String busqueda, Pageable pageable) {
        // Implementar búsqueda
        return visitaRepository.findAll(pageable).map(this::mapToDTO);
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

    private VisitaDTO mapToDTO(Visita visita) {
        return VisitaDTO.builder()
                .idVisita(visita.getIdVisita())
                .idPredio(visita.getPredio().getIdPredio())
                .claveCatastralPredio(visita.getPredio().getClaveCatastral())
                .propietarioPredio(visita.getPredio().getPropietario())
                .idUsuarioVisitador(visita.getUsuarioVisitador().getIdUsuario())
                .nombreVisitador(visita.getUsuarioVisitador().getNombre() + " " +
                                 visita.getUsuarioVisitador().getApellido())
                .fechaVisita(visita.getFechaVisita())
                .estadoVisita(visita.getEstadoVisita().name())
                .observaciones(visita.getObservaciones())
                .fotografia(visita.getFotografia())
                .latitudVisita(visita.getLatitudVisita())
                .longitudVisita(visita.getLongitudVisita())
                .horaInicio(visita.getHoraInicio())
                .horaFin(visita.getHoraFin())
                .viviendaTrabajable(visita.getViviendaTrabajable())
                .fechaCreacion(visita.getFechaCreacion())
                .build();
    }
}
