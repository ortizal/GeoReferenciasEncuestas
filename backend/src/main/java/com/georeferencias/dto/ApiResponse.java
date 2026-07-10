package com.georeferencias.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApiResponse<T> {
    private boolean exitoso;
    private String mensaje;
    private T datos;
    private String error;

    public static <T> ApiResponse<T> exito(T datos, String mensaje) {
        return ApiResponse.<T>builder()
                .exitoso(true)
                .mensaje(mensaje)
                .datos(datos)
                .build();
    }

    public static <T> ApiResponse<T> error(String mensaje) {
        return ApiResponse.<T>builder()
                .exitoso(false)
                .mensaje(mensaje)
                .build();
    }
}
