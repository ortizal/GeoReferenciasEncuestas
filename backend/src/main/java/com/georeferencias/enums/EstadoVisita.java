package com.georeferencias.enums;

public enum EstadoVisita {
    EN_BLANCO("En Blanco"),
    PENDIENTE("Pendiente"),
    POSITIVO("Positivo"),
    NEGATIVO("Negativo"),
    INDECISO("Indeciso"),
    REPROGRAMADA("Reprogramada"),
    NO_TRABAJABLE("No Trabajable"),
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
