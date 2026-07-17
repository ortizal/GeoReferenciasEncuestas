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

    @Override
    @Transactional(readOnly = true)
    public List<Map<String, Object>> obtenerVisitasPorSemana(LocalDateTime inicio, LocalDateTime fin) {
        if (inicio == null) inicio = YearMonth.now().minusMonths(1).atDay(1).atStartOfDay();
        if (fin == null) fin = LocalDateTime.now();

        List<Object[]> datos = visitaRepository.countVisitasBySemanaYEstado(inicio, fin);
        List<Map<String, Object>> resultado = new ArrayList<>();

        for (Object[] fila : datos) {
            Map<String, Object> item = new HashMap<>();
            item.put("semana", fila[0]);
            item.put("anio", fila[1]);
            item.put("estado", fila[2].toString());
            item.put("total", fila[3]);
            resultado.add(item);
        }

        return resultado;
    }

    @Override
    @Transactional(readOnly = true)
    public List<Map<String, Object>> obtenerVisitasPorMes(LocalDateTime inicio, LocalDateTime fin) {
        if (inicio == null) inicio = YearMonth.now().minusMonths(5).atDay(1).atStartOfDay();
        if (fin == null) fin = LocalDateTime.now();

        List<Object[]> datos = visitaRepository.countVisitasByMesYEstado(inicio, fin);
        List<Map<String, Object>> resultado = new ArrayList<>();

        for (Object[] fila : datos) {
            Map<String, Object> item = new HashMap<>();
            item.put("mes", fila[0]);
            item.put("anio", fila[1]);
            item.put("estado", fila[2].toString());
            item.put("total", fila[3]);
            resultado.add(item);
        }

        return resultado;
    }

    @Override
    @Transactional(readOnly = true)
    public List<Map<String, Object>> obtenerStatsPorGrupo() {
        List<Object[]> totales = visitaRepository.countTotalVisitasByGrupo();
        List<Object[]> porEstado = visitaRepository.countVisitasByGrupoYEstado();

        java.util.Map<String, Map<String, Long>> estadoMap = new java.util.LinkedHashMap<>();
        java.util.Map<String, Long> arMap = new java.util.HashMap<>();
        java.util.Map<String, Long> estrellaMap = new java.util.HashMap<>();

        for (Object[] fila : totales) {
            String grupo = (String) fila[0];
            Long total = ((Number) fila[1]).longValue();
            estadoMap.computeIfAbsent(grupo, k -> new java.util.HashMap<>()).put("TOTAL", total);
        }

        for (Object[] fila : porEstado) {
            String grupo = (String) fila[0];
            String estado = fila[1] != null ? fila[1].toString() : "SIN_ESTADO";
            Long count = ((Number) fila[2]).longValue();
            Long ar = ((Number) fila[3]).longValue();
            Long estrella = ((Number) fila[4]).longValue();
            estadoMap.computeIfAbsent(grupo, k -> new java.util.HashMap<>()).put(estado, count);
            arMap.merge(grupo, ar, Long::sum);
            estrellaMap.merge(grupo, estrella, Long::sum);
        }

        List<Map<String, Object>> resultado = new ArrayList<>();
        for (Map.Entry<String, Map<String, Long>> entry : estadoMap.entrySet()) {
            Map<String, Object> item = new HashMap<>();
            item.put("grupo", entry.getKey());
            item.put("total", entry.getValue().getOrDefault("TOTAL", 0L));
            item.put("positivos", entry.getValue().getOrDefault("POSITIVO", 0L));
            item.put("negativos", entry.getValue().getOrDefault("NEGATIVO", 0L));
            item.put("indecisos", entry.getValue().getOrDefault("INDECISO", 0L));
            item.put("enBlanco", entry.getValue().getOrDefault("EN_BLANCO", 0L));
            item.put("noTrabajables", entry.getValue().getOrDefault("NO_TRABAJABLE", 0L));
            item.put("apoyosAlcalde", arMap.getOrDefault(entry.getKey(), 0L));
            item.put("estrellas", estrellaMap.getOrDefault(entry.getKey(), 0L));
            resultado.add(item);
        }

        resultado.sort((a, b) -> Long.compare((Long) b.get("total"), (Long) a.get("total")));
        return resultado;
    }

    @Override
    @Transactional(readOnly = true)
    public List<Map<String, Object>> obtenerPrediosPorEstado(String estado) {
        List<Object[]> datos = predioRepository.findPrediosByEstadoVisita(estado);
        List<Map<String, Object>> resultado = new ArrayList<>();
        for (Object[] fila : datos) {
            Map<String, Object> item = new HashMap<>();
            item.put("idPredio", fila[0]);
            item.put("claveCatastral", fila[1]);
            item.put("propietario", fila[2]);
            item.put("direccion", fila[3]);
            item.put("estadoVisita", fila[4] != null ? fila[4].toString() : null);
            item.put("fechaCreacion", fila[5] != null ? fila[5].toString() : null);
            item.put("apoyaAlcalde", fila[6]);
            item.put("estrella", fila[7]);
            resultado.add(item);
        }
        return resultado;
    }

    @Override
    @Transactional(readOnly = true)
    public List<Map<String, Object>> obtenerPrediosPorEstadoYFecha(String estado, String fecha) {
        List<Object[]> datos = predioRepository.findPrediosByEstadoYFecha(estado, fecha);
        List<Map<String, Object>> resultado = new ArrayList<>();
        for (Object[] fila : datos) {
            Map<String, Object> item = new HashMap<>();
            item.put("idPredio", fila[0]);
            item.put("claveCatastral", fila[1]);
            item.put("propietario", fila[2]);
            item.put("direccion", fila[3]);
            item.put("estadoVisita", fila[4] != null ? fila[4].toString() : null);
            item.put("fechaCreacion", fila[5] != null ? fila[5].toString() : null);
            item.put("apoyaAlcalde", fila[6]);
            item.put("estrella", fila[7]);
            resultado.add(item);
        }
        return resultado;
    }
}
