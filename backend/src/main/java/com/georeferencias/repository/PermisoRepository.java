package com.georeferencias.repository;

import com.georeferencias.entity.Permiso;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PermisoRepository extends JpaRepository<Permiso, Long> {

    Optional<Permiso> findByNombre(String nombre);

    Boolean existsByNombre(String nombre);

    List<Permiso> findByModuloIdModulo(Long idModulo);

    List<Permiso> findByActivoTrue();

    List<Permiso> findAllByOrderByModuloNombreAscNombreAsc();
}
