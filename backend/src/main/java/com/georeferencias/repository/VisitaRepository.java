package com.georeferencias.repository;

import com.georeferencias.entity.Visita;
import com.georeferencias.enums.EstadoVisita;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface VisitaRepository extends JpaRepository<Visita, Long> {

    List<Visita> findByPredioIdPredioOrderByFechaVisitaDesc(Long idPredio);

    Optional<Visita> findFirstByPredioIdPredioOrderByFechaVisitaDesc(Long idPredio);

    List<Visita> findByUsuarioVisitadorIdUsuarioOrderByFechaVisitaDesc(Long idUsuario);

    @Query("SELECT v FROM Visita v WHERE v.usuarioVisitador.idUsuario = :idUsuario AND " +
           "v.fechaVisita BETWEEN :fechaInicio AND :fechaFin ORDER BY v.fechaVisita DESC")
    List<Visita> findByUsuarioYFecha(@Param("idUsuario") Long idUsuario,
                                      @Param("fechaInicio") LocalDateTime fechaInicio,
                                      @Param("fechaFin") LocalDateTime fechaFin);

    @Query("SELECT v FROM Visita v WHERE v.estadoVisita = :estado")
    List<Visita> findByEstado(@Param("estado") EstadoVisita estado);

    @Query("SELECT COUNT(v) FROM Visita v WHERE v.estadoVisita = :estado")
    Long countByEstado(@Param("estado") EstadoVisita estado);

    @Query("SELECT COUNT(v) FROM Visita v WHERE v.fechaVisita BETWEEN :inicio AND :fin")
    Long countByFechaRango(@Param("inicio") LocalDateTime inicio, @Param("fin") LocalDateTime fin);

    @Query("SELECT v.estadoVisita, COUNT(v) FROM Visita v GROUP BY v.estadoVisita")
    List<Object[]> countByEstadoGroup();

    @Query("SELECT v FROM Visita v WHERE v.predio.manzana.idManzana = :idManzana ORDER BY v.fechaVisita DESC")
    List<Visita> findByManzana(@Param("idManzana") Long idManzana);

    @Query(value = "SELECT v.* FROM visitas v " +
           "INNER JOIN predios p ON v.id_predio = p.id_predio " +
           "WHERE p.id_manzana = :idManzana " +
           "ORDER BY v.fecha_visita DESC LIMIT 1", nativeQuery = true)
    Optional<Visita> findUltimaVisitaByManzana(@Param("idManzana") Long idManzana);

    @Query("SELECT v.usuarioVisitador.idUsuario, COUNT(v) FROM Visita v " +
           "WHERE v.fechaVisita BETWEEN :inicio AND :fin " +
           "GROUP BY v.usuarioVisitador.idUsuario")
    List<Object[]> countVisitasByUsuario(@Param("inicio") LocalDateTime inicio,
                                          @Param("fin") LocalDateTime fin);

    @Query("SELECT v.predio.manzana.sector, v.estadoVisita, COUNT(v) FROM Visita v " +
           "WHERE v.fechaVisita BETWEEN :inicio AND :fin " +
           "GROUP BY v.predio.manzana.sector, v.estadoVisita")
    List<Object[]> countVisitasBySectorYEstado(@Param("inicio") LocalDateTime inicio,
                                                @Param("fin") LocalDateTime fin);

    @Query("SELECT COUNT(v) > 0 FROM Visita v WHERE v.predio.idPredio = :idPredio AND v.fechaBrigada = :fechaBrigada")
    boolean existsByPredioAndFechaBrigada(@Param("idPredio") Long idPredio,
                                           @Param("fechaBrigada") LocalDateTime fechaBrigada);

    @Query("SELECT FUNCTION('DATE', v.fechaCreacion) as fecha, v.estadoVisita, COUNT(v) " +
           "FROM Visita v " +
           "WHERE v.fechaCreacion BETWEEN :inicio AND :fin " +
           "GROUP BY FUNCTION('DATE', v.fechaCreacion), v.estadoVisita " +
           "ORDER BY FUNCTION('DATE', v.fechaCreacion)")
    List<Object[]> countVisitasByDiaYEstado(@Param("inicio") LocalDateTime inicio,
                                             @Param("fin") LocalDateTime fin);
}
