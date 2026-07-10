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
@Table(name = "manzanas")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Manzana {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idManzana;

    @Column(nullable = false, unique = true, length = 30)
    private String claveCatastralManzana;

    @Column(nullable = false, length = 100)
    private String nombre;

    @Column(length = 50)
    private String sector;

    @Column(length = 50)
    private String barrio;

    @Column(columnDefinition = "geometry(Polygon, 4326)")
    private Geometry poligono;

    @Column(precision = 12, scale = 2)
    private Double area;

    @Column(nullable = false)
    private Boolean activo = true;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime fechaCreacion;

    @UpdateTimestamp
    private LocalDateTime fechaActualizacion;

    @Column(length = 50)
    private String usuarioCreacion;

    @OneToMany(mappedBy = "manzana", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<Predio> predios = new ArrayList<>();
}
