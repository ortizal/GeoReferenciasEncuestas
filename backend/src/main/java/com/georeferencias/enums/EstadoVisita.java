package com.georeferencias.enums;

public enum EstadoVisita {
    SIN_VISITAR("Sin Visitar"),
    PENDIENTE("Pendiente"),
    POSITIVO("Positivo"),
    NEGATIVO("Negativo"),
    INDECISO("Indeciso"),
    REPROGRAMADA("Reprogramada"),
    NO_LOCALIZADA("No Localizada"),
    RECHAZADA("Rechazada"),
    FINALIZADA("Finalizada");

    private final String descripcion;

    EstadoVisita(String descripcion) {
        this.descripcion = descripcion;
    }

    public String getDescripcion() {
        return descripcion;
    }
}
