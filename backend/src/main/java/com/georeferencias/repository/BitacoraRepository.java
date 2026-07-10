package com.georeferencias.repository;

import com.georeferencias.entity.Bitacora;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface BitacoraRepository extends JpaRepository<Bitacora, Long> {

    List<Bitacora> findByUsuarioIdUsuarioOrderByFechaCreacionDesc(Long idUsuario);

    @Query("SELECT b FROM Bitacora b WHERE b.fechaCreacion BETWEEN :inicio AND :fin ORDER BY b.fechaCreacion DESC")
    List<Bitacora> findByFechaRango(@Param("inicio") LocalDateTime inicio,
                                     @Param("fin") LocalDateTime fin);

    @Query("SELECT b FROM Bitacora b WHERE b.entidad = :entidad AND b.entidadId = :entidadId ORDER BY b.fechaCreacion DESC")
    List<Bitacora> findByEntidad(@Param("entidad") String entidad, @Param("entidadId") Long entidadId);

    Page<Bitacora> findAllByOrderByFechaCreacionDesc(Pageable pageable);
}
