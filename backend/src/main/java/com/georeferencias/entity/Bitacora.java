package com.georeferencias.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "bitacora")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Bitacora {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idBitacora;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_usuario")
    private Usuario usuario;

    @Column(nullable = false, length = 50)
    private String accion;

    @Column(nullable = false, length = 100)
    private String entidad;

    @Column
    private Long entidadId;

    @Column(length = 500)
    private String descripcion;

    @Column(length = 100)
    private String ip;

    @Column(length = 200)
    private String userAgent;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime fechaCreacion;
}
