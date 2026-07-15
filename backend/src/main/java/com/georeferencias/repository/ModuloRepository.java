package com.georeferencias.repository;

import com.georeferencias.entity.Modulo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ModuloRepository extends JpaRepository<Modulo, Long> {

    Optional<Modulo> findByNombre(String nombre);

    Boolean existsByNombre(String nombre);

    List<Modulo> findByActivoTrue();

    List<Modulo> findAllByOrderByNombreAsc();
}
