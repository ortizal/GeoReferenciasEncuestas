package com.georeferencias.repository;

import com.georeferencias.entity.Usuario;
import com.georeferencias.enums.EstadoUsuario;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

    Optional<Usuario> findByUsername(String username);

    Optional<Usuario> findByEmail(String email);

    Boolean existsByUsername(String username);

    Boolean existsByEmail(String email);

    @Query("SELECT u FROM Usuario u WHERE u.activo = :activo AND " +
           "(LOWER(u.username) LIKE LOWER(CONCAT('%', :busqueda, '%')) OR " +
           "LOWER(u.nombre) LIKE LOWER(CONCAT('%', :busqueda, '%')) OR " +
           "LOWER(u.apellido) LIKE LOWER(CONCAT('%', :busqueda, '%')) OR " +
           "LOWER(u.email) LIKE LOWER(CONCAT('%', :busqueda, '%')))")
    Page<Usuario> buscarConFiltros(@Param("busqueda") String busqueda,
                                    @Param("activo") Boolean activo,
                                    Pageable pageable);
}
