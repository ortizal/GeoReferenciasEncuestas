package com.georeferencias.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ImportPreviewDTO {
    private int totalRows;
    private int validRows;
    private int duplicateRows;
    private List<ImportRowDTO> rows;
    private List<String> errors;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ImportRowDTO {
        private int rowNum;
        private String claveCatastral;
        private String nombre;
        private String sector;
        private String barrio;
        private String poligonoGeoJSON;
        private boolean valid;
        private boolean duplicate;
        private String error;
    }
}
