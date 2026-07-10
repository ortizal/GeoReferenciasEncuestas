package com.georeferencias.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "auditoria")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Auditoria {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idAuditoria;

    @Column(nullable = false, length = 50)
    private String tabla;

    @Column(nullable = false)
    private Long registroId;

    @Column(nullable = false, length = 20)
    private String operacion;

    @Column(length = 500)
    private String valoresAnteriores;

    @Column(length = 500)
    private String valoresNuevos;

    @Column(length = 50)
    private String usuario;

    @Column(length = 100)
    private String ip;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime fechaCreacion;
}
