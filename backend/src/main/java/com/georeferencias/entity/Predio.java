package com.georeferencias.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.locationtech.jts.geom.Geometry;

@Entity
@Table(name = "predios")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Predio {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idPredio;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_manzana", nullable = false)
    private Manzana manzana;

    @Column(nullable = false, unique = true, length = 30)
    private String claveCatastral;

    @Column(nullable = false, length = 150)
    private String propietario;

    @Column(nullable = false, length = 200)
    private String direccion;

    @Column(length = 20)
    private String telefono;

    @Column(columnDefinition = "geometry(Point, 4326)")
    private Geometry georeferencia;

    @Column(length = 500)
    private String observaciones;

    @Column(nullable = false)
    private Boolean activo = true;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime fechaCreacion;

    @UpdateTimestamp
    private LocalDateTime fechaActualizacion;

    @Column(length = 50)
    private String usuarioCreacion;

    @OneToMany(mappedBy = "predio", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<Visita> visitas = new ArrayList<>();
}
