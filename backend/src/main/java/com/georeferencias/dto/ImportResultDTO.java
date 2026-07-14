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
public class ImportResultDTO {
    private int totalRows;
    private int successCount;
    private int errorCount;
    private List<ImportRowResult> results;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ImportRowResult {
        private int rowNum;
        private String claveCatastral;
        private boolean success;
        private String error;
    }
}
