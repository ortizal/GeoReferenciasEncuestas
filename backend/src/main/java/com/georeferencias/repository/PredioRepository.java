package com.georeferencias.repository;

import com.georeferencias.entity.Predio;
import com.georeferencias.enums.EstadoVisita;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PredioRepository extends JpaRepository<Predio, Long> {

    Optional<Predio> findByClaveCatastral(String claveCatastral);

    Boolean existsByClaveCatastral(String claveCatastral);

    List<Predio> findByManzanaIdManzanaAndActivoTrue(Long idManzana);

    @Query("SELECT p FROM Predio p WHERE p.manzana.idManzana = :idManzana AND p.activo = true")
    List<Predio> findPrediosByManzana(@Param("idManzana") Long idManzana);

    @Query("SELECT p FROM Predio p WHERE p.activo = :activo AND " +
           "(:busqueda IS NULL OR :busqueda = '' OR " +
           "LOWER(p.claveCatastral) LIKE LOWER(CONCAT('%', :busqueda, '%')) OR " +
           "LOWER(p.propietario) LIKE LOWER(CONCAT('%', :busqueda, '%')) OR " +
           "LOWER(p.direccion) LIKE LOWER(CONCAT('%', :busqueda, '%')))")
    Page<Predio> buscarConFiltros(@Param("busqueda") String busqueda,
                                   @Param("activo") Boolean activo,
                                   Pageable pageable);

    @Query("SELECT p FROM Predio p WHERE p.georeferencia IS NOT NULL AND p.activo = true")
    List<Predio> findAllConGeoreferencia();

    @Query("SELECT p FROM Predio p WHERE p.activo = true")
    List<Predio> findAllActivos();

    @Query("SELECT COUNT(p) FROM Predio p WHERE p.manzana.idManzana = :idManzana AND p.activo = true")
    Long countByManzana(@Param("idManzana") Long idManzana);

    @Query("SELECT p FROM Predio p WHERE p.idPredio NOT IN " +
           "(SELECT v.predio.idPredio FROM Visita v WHERE v.predio.manzana.idManzana = :idManzana) " +
           "AND p.manzana.idManzana = :idManzana AND p.activo = true")
    List<Predio> findPrediosSinVisitar(@Param("idManzana") Long idManzana);

    @Query("SELECT p.claveCatastral FROM Predio p")
    List<String> findAllClaveCatastral();

    @Query(value = "SELECT p.id_predio, v.estado_visita, v.fecha_creacion, v.apoya_alcalde, v.estrella " +
           "FROM predios p LEFT JOIN visitas v ON v.id_predio = p.id_predio " +
           "AND v.fecha_creacion = (SELECT MAX(v2.fecha_creacion) FROM visitas v2 WHERE v2.id_predio = p.id_predio) " +
           "WHERE p.activo = true", nativeQuery = true)
    List<Object[]> findPrediosConEstadoVisita();

    @Query(value = "SELECT p.id_predio, v.estado_visita, v.fecha_creacion, v.apoya_alcalde, v.estrella " +
           "FROM predios p LEFT JOIN visitas v ON v.id_predio = p.id_predio " +
           "AND v.fecha_creacion = (SELECT MAX(v2.fecha_creacion) FROM visitas v2 WHERE v2.id_predio = p.id_predio) " +
           "WHERE p.activo = true " +
           "AND (:busqueda IS NULL OR :busqueda = '' OR " +
           "LOWER(p.clave_catastral) LIKE LOWER(CONCAT('%', :busqueda, '%')) OR " +
           "LOWER(p.propietario) LIKE LOWER(CONCAT('%', :busqueda, '%')) OR " +
           "LOWER(p.direccion) LIKE LOWER(CONCAT('%', :busqueda, '%')))", nativeQuery = true)
    List<Object[]> buscarConEstadoVisita(@Param("busqueda") String busqueda);

    @Query(value = "SELECT p.id_predio, p.clave_catastral, p.propietario, p.direccion, " +
           "v.estado_visita, v.fecha_creacion, v.apoya_alcalde, v.estrella " +
           "FROM predios p INNER JOIN visitas v ON v.id_predio = p.id_predio " +
           "AND v.fecha_creacion = (SELECT MAX(v2.fecha_creacion) FROM visitas v2 WHERE v2.id_predio = p.id_predio) " +
           "WHERE p.activo = true AND v.estado_visita = :estado " +
           "ORDER BY v.fecha_creacion DESC", nativeQuery = true)
    List<Object[]> findPrediosByEstadoVisita(@Param("estado") String estado);

    @Query(value = "SELECT p.id_predio, p.clave_catastral, p.propietario, p.direccion, " +
           "v.estado_visita, v.fecha_creacion, v.apoya_alcalde, v.estrella " +
           "FROM predios p INNER JOIN visitas v ON v.id_predio = p.id_predio " +
           "WHERE p.activo = true AND v.estado_visita = :estado " +
           "AND DATE(v.fecha_creacion) = CAST(:fecha AS DATE) " +
           "ORDER BY v.fecha_creacion DESC", nativeQuery = true)
    List<Object[]> findPrediosByEstadoYFecha(@Param("estado") String estado, @Param("fecha") String fecha);
}
