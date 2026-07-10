package com.georeferencias.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "menus")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Menu {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idMenu;

    @Column(nullable = false, length = 50)
    private String nombre;

    @Column(length = 200)
    private String ruta;

    @Column(length = 50)
    private String icono;

    @Column(nullable = false)
    private Integer orden;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_menu_padre")
    private Menu menuPadre;

    @Column(nullable = false)
    private Boolean visible = true;

    @Column(nullable = false)
    private Boolean activo = true;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime fechaCreacion;

    @OneToMany(mappedBy = "menuPadre", cascade = CascadeType.ALL)
    @Builder.Default
    private List<Menu> submenus = new ArrayList<>();
}
