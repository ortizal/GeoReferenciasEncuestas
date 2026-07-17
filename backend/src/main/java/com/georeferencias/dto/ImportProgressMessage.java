package com.georeferencias.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ImportProgressMessage {
    private String sessionId;
    private int current;
    private int total;
    private String rowKey;
    private String rowStatus;
    private int imported;
    private int duplicated;
    private int errors;
    private int notFound;
    private int autoCreated;
    private boolean completed;
}
