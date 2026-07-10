package com.georeferencias.enums;

public enum RolEnum {
    ADMINISTRADOR("Administrador"),
    SUPERVISOR("Supervisor"),
    VISITADOR("Visitador");

    private final String descripcion;

    RolEnum(String descripcion) {
        this.descripcion = descripcion;
    }

    public String getDescripcion() {
        return descripcion;
    }
}
