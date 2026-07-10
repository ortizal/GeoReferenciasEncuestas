package com.georeferencias.repository;

import com.georeferencias.entity.Auditoria;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AuditoriaRepository extends JpaRepository<Auditoria, Long> {

    @Query("SELECT a FROM Auditoria a WHERE a.tabla = :tabla ORDER BY a.fechaCreacion DESC")
    List<Auditoria> findByTabla(@Param("tabla") String tabla);

    @Query("SELECT a FROM Auditoria a WHERE a.fechaCreacion BETWEEN :inicio AND :fin ORDER BY a.fechaCreacion DESC")
    List<Auditoria> findByFechaRango(@Param("inicio") LocalDateTime inicio,
                                      @Param("fin") LocalDateTime fin);

    @Query("SELECT a FROM Auditoria a WHERE a.usuario = :usuario ORDER BY a.fechaCreacion DESC")
    List<Auditoria> findByUsuario(@Param("usuario") String usuario);

    Page<Auditoria> findAllByOrderByFechaCreacionDesc(Pageable pageable);
}
