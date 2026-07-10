package com.georeferencias.security;

import com.georeferencias.entity.Usuario;
import com.georeferencias.enums.EstadoUsuario;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.Set;
import java.util.stream.Collectors;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class JwtUserDetails implements UserDetails {

    private Long id;
    private String username;
    private String password;
    private String email;
    private Boolean activo;
    private Boolean primerLogin;
    private EstadoUsuario estado;
    private Set<GrantedAuthority> authorities;

    public static JwtUserDetails build(Usuario usuario) {
        Set<GrantedAuthority> authorities = usuario.getRoles().stream()
                .flatMap(rol -> rol.getPermisos().stream())
                .map(permiso -> new SimpleGrantedAuthority("PERMISO_" + permiso.getNombre()))
                .collect(Collectors.toSet());

        usuario.getRoles().forEach(rol ->
            authorities.add(new SimpleGrantedAuthority("ROLE_" + rol.getNombre()))
        );

        return new JwtUserDetails(
                usuario.getIdUsuario(),
                usuario.getUsername(),
                usuario.getPassword(),
                usuario.getEmail(),
                usuario.getActivo(),
                usuario.getPrimerLogin(),
                usuario.getEstado(),
                authorities
        );
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    @Override
    public String getPassword() {
        return password;
    }

    @Override
    public String getUsername() {
        return username;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return !EstadoUsuario.BLOQUEADO.equals(estado);
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return activo && !EstadoUsuario.INACTIVO.equals(estado);
    }
}
