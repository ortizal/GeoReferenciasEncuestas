package com.georeferencias.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.time.LocalTime;

import com.georeferencias.enums.EstadoVisita;

@Entity
@Table(name = "visitas")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Visita {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idVisita;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_predio", nullable = false)
    private Predio predio;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_usuario_visitador", nullable = false)
    private Usuario usuarioVisitador;

    @Column(nullable = false)
    private LocalDateTime fechaVisita;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private EstadoVisita estadoVisita;

    @Column(length = 500)
    private String observaciones;

    @Column(length = 255)
    private String fotografia;

    @Column(precision = 10, scale = 8)
    private Double latitudVisita;

    @Column(precision = 11, scale = 8)
    private Double longitudVisita;

    @Column
    private LocalTime horaInicio;

    @Column
    private LocalTime horaFin;

    @Column(nullable = false)
    private Boolean viviendaTrabajable;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime fechaCreacion;
}
