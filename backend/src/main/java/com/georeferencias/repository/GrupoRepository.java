package com.georeferencias.repository;

import com.georeferencias.entity.Grupo;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface GrupoRepository extends JpaRepository<Grupo, Long> {

    boolean existsByNombre(String nombre);

    @Query("SELECT g FROM Grupo g WHERE " +
           "(:busqueda IS NULL OR :busqueda = '' OR " +
           "LOWER(g.nombre) LIKE LOWER(CONCAT('%', :busqueda, '%')) OR " +
           "LOWER(g.descripcion) LIKE LOWER(CONCAT('%', :busqueda, '%')))")
    Page<Grupo> buscarConFiltros(@Param("busqueda") String busqueda, Pageable pageable);

}
