package com.georeferencias.repository;

import com.georeferencias.entity.Manzana;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ManzanaRepository extends JpaRepository<Manzana, Long> {

    Optional<Manzana> findByClaveCatastralManzana(String claveCatastralManzana);

    Boolean existsByClaveCatastralManzana(String claveCatastralManzana);

    @Query("SELECT m FROM Manzana m WHERE m.activo = :activo AND " +
           "(LOWER(m.claveCatastralManzana) LIKE LOWER('%' || :busqueda || '%') OR " +
           "LOWER(m.nombre) LIKE LOWER('%' || :busqueda || '%') OR " +
           "LOWER(m.sector) LIKE LOWER('%' || :busqueda || '%') OR " +
           "LOWER(m.barrio) LIKE LOWER('%' || :busqueda || '%'))")
    Page<Manzana> buscarConFiltros(@Param("busqueda") String busqueda,
                                    @Param("activo") Boolean activo,
                                    Pageable pageable);

    @Query("SELECT m FROM Manzana m WHERE m.activo = true")
    List<Manzana> findAllActivas();

    @Query("SELECT m FROM Manzana m WHERE m.poligono IS NOT NULL AND m.activo = true")
    List<Manzana> findAllConPoligono();

    @Query(value = "SELECT * FROM manzanas m WHERE ST_Contains(m.poligono, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)) AND m.activo = true", nativeQuery = true)
    Optional<Manzana> findManzanaByPunto(@Param("lat") Double lat, @Param("lng") Double lng);
}
