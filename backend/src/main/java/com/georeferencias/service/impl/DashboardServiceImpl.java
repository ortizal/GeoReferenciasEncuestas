package com.georeferencias.service.impl;

import com.georeferencias.dto.DashboardDTO;
import com.georeferencias.enums.EstadoVisita;
import com.georeferencias.repository.ManzanaRepository;
import com.georeferencias.repository.PredioRepository;
import com.georeferencias.repository.VisitaRepository;
import com.georeferencias.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class DashboardServiceImpl implements DashboardService {

    private final ManzanaRepository manzanaRepository;
    private final PredioRepository predioRepository;
    private final VisitaRepository visitaRepository;

    @Override
    @Transactional(readOnly = true)
    public DashboardDTO obtenerDashboard() {
        Long totalManzanas = manzanaRepository.count();
        Long totalPredios = predioRepository.count();
        Long totalVisitas = visitaRepository.count();

        Map<String, Long> conteoPorEstado = new HashMap<>();
        for (EstadoVisita estado : EstadoVisita.values()) {
            conteoPorEstado.put(estado.name(), visitaRepository.countByEstado(estado));
        }

        Long enBlanco = totalPredios - totalVisitas;
        if (enBlanco < 0) enBlanco = 0L;

        Double porcentajeCobertura = totalPredios > 0 ?
                (double) totalVisitas / totalPredios * 100 : 0.0;

        Long apoyosAlcalde = visitaRepository.countApoyaAlcalde();
        Long estrellas = visitaRepository.countEstrellas();

        List<Map<String, Object>> visitasPorMes = obtenerVisitasPorMes();
        List<Map<String, Object>> visitasPorDia = obtenerVisitasPorDia();
        List<Map<String, Object>> visitasPorUsuario = obtenerVisitasPorUsuario();
        List<Map<String, Object>> visitasRecientes = obtenerVisitasRecientes();

        return DashboardDTO.builder()
                .totalManzanas(totalManzanas)
                .totalPredios(totalPredios)
                .totalVisitas(totalVisitas)
                .positivos(conteoPorEstado.getOrDefault(EstadoVisita.POSITIVO.name(), 0L))
                .negativos(conteoPorEstado.getOrDefault(EstadoVisita.NEGATIVO.name(), 0L))
                .indecisos(conteoPorEstado.getOrDefault(EstadoVisita.INDECISO.name(), 0L))
                .enBlanco(enBlanco)
                .pendientes(conteoPorEstado.getOrDefault(EstadoVisita.PENDIENTE.name(), 0L))
                .reprogramadas(conteoPorEstado.getOrDefault(EstadoVisita.REPROGRAMADA.name(), 0L))
                .noTrabajables(conteoPorEstado.getOrDefault(EstadoVisita.NO_TRABAJABLE.name(), 0L))
                .rechazadas(conteoPorEstado.getOrDefault(EstadoVisita.RECHAZADA.name(), 0L))
                .finalizadas(conteoPorEstado.getOrDefault(EstadoVisita.FINALIZADA.name(), 0L))
                .apoyosAlcalde(apoyosAlcalde)
                .estrellas(estrellas)
                .porcentajeCobertura(porcentajeCobertura)
                .visitasPorMes(visitasPorMes)
                .visitasPorDia(visitasPorDia)
                .visitasPorUsuario(visitasPorUsuario)
                .visitasRecientes(visitasRecientes)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public DashboardDTO obtenerDashboardPorUsuario(Long idUsuario) {
        return obtenerDashboard();
    }

    @Override
    @Transactional(readOnly = true)
    public DashboardDTO obtenerDashboardPorManzana(Long idManzana) {
        return obtenerDashboard();
    }

    private List<Map<String, Object>> obtenerVisitasPorMes() {
        List<Map<String, Object>> resultado = new ArrayList<>();
        YearMonth actual = YearMonth.now();

        for (int i = 5; i >= 0; i--) {
            YearMonth mes = actual.minusMonths(i);
            LocalDateTime inicio = mes.atDay(1).atStartOfDay();
            LocalDateTime fin = mes.atEndOfMonth().atTime(LocalTime.MAX);

            Long total = visitaRepository.countByFechaRango(inicio, fin);

            Map<String, Object> item = new HashMap<>();
            item.put("mes", mes.getMonth().name());
            item.put("anio", mes.getYear());
            item.put("total", total);
            resultado.add(item);
        }

        return resultado;
    }

    @Override
    @Transactional(readOnly = true)
    public List<Map<String, Object>> obtenerVisitasPorDia(LocalDateTime inicio, LocalDateTime fin) {
        if (inicio == null) inicio = YearMonth.now().minusMonths(1).atDay(1).atStartOfDay();
        if (fin == null) fin = LocalDateTime.now();

        List<Object[]> datos = visitaRepository.countVisitasByDiaYEstado(inicio, fin);
        List<Map<String, Object>> resultado = new ArrayList<>();

        for (Object[] fila : datos) {
            Map<String, Object> item = new HashMap<>();
            item.put("fecha", fila[0].toString());
            item.put("estado", fila[1].toString());
            item.put("total", fila[2]);
            resultado.add(item);
        }

        return resultado;
    }

    private List<Map<String, Object>> obtenerVisitasPorDia() {
        return obtenerVisitasPorDia(null, null);
    }

    private List<Map<String, Object>> obtenerVisitasPorUsuario() {
        LocalDateTime inicio = YearMonth.now().atDay(1).atStartOfDay();
        LocalDateTime fin = LocalDateTime.now();

        List<Object[]> datos = visitaRepository.countVisitasByUsuario(inicio, fin);
        List<Map<String, Object>> resultado = new ArrayList<>();

        for (Object[] fila : datos) {
            Map<String, Object> item = new HashMap<>();
            item.put("idUsuario", fila[0]);
            item.put("total", fila[1]);
            resultado.add(item);
        }

        return resultado;
    }

    private List<Map<String, Object>> obtenerVisitasRecientes() {
        List<com.georeferencias.entity.Visita> visitas = visitaRepository.findAll();
        List<Map<String, Object>> resultado = new ArrayList<>();

        int limite = Math.min(visitas.size(), 10);
        for (int i = 0; i < limite; i++) {
            com.georeferencias.entity.Visita v = visitas.get(i);
            Map<String, Object> item = new HashMap<>();
            item.put("idVisita", v.getIdVisita());
            item.put("predio", v.getPredio().getClaveCatastral());
            item.put("propietario", v.getPredio().getPropietario());
            item.put("estado", v.getEstadoVisita().name());
            item.put("fecha", v.getFechaVisita());
            item.put("visitador", v.getUsuarioVisitador().getNombre());
            resultado.add(item);
        }

        return resultado;
    }

    @Override
    @Transactional(readOnly = true)
    public List<Map<String, Object>> topManzanasByPositivos() {
        List<Object[]> datos = visitaRepository.topManzanasByPositivos();
        List<Map<String, Object>> resultado = new ArrayList<>();
        int limite = Math.min(datos.size(), 10);
        for (int i = 0; i < limite; i++) {
            Object[] fila = datos.get(i);
            Map<String, Object> item = new HashMap<>();
            item.put("idManzana", fila[0]);
            item.put("nombre", fila[1]);
            item.put("total", fila[2]);
            resultado.add(item);
        }
        return resultado;
    }

    @Override
    @Transactional(readOnly = true)
    public List<Map<String, Object>> topManzanasByArEstrellas() {
        List<Object[]> datos = visitaRepository.topManzanasByArEstrellas();
        List<Map<String, Object>> resultado = new ArrayList<>();
        int limite = Math.min(datos.size(), 10);
        for (int i = 0; i < limite; i++) {
            Object[] fila = datos.get(i);
            Map<String, Object> item = new HashMap<>();
            item.put("idManzana", fila[0]);
            item.put("nombre", fila[1]);
            item.put("arCount", fila[2]);
            item.put("estrellaCount", fila[3]);
            item.put("total", fila[4]);
            resultado.add(item);
        }
        return resultado;
    }
}
