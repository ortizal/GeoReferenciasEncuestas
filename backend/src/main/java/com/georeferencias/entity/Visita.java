package com.georeferencias.entity;

import jakarta.persistence.*;
import lombok.*;

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

    private Double latitudVisita;

    private Double longitudVisita;

    @Column
    private LocalTime horaInicio;

    @Column
    private LocalTime horaFin;

    @Column(nullable = false)
    private Boolean viviendaTrabajable;

    @Column(length = 10)
    private String grupoBrigada;

    @Column(length = 100)
    private String nombreBrigada;

    private LocalDateTime fechaBrigada;

    @Column(length = 200)
    private String comentarioBrigada;

    @Column(length = 50)
    private String numCasasBrigada;

    @Column(length = 100)
    private String parroquia;

    @Column(length = 100)
    private String barrio;

    private Boolean apoyaAlcalde;

    private Boolean estrella;

    @Column(updatable = false)
    private LocalDateTime fechaCreacion;
}
