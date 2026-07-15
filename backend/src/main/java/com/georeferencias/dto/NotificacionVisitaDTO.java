package com.georeferencias.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificacionVisitaDTO {
    private Long idVisita;
    private Long idPredio;
    private String claveCatastralPredio;
    private String propietarioPredio;
    private String nombreVisitador;
    private String estadoVisita;
    private LocalDateTime fechaVisita;
    private String mensaje;
}
