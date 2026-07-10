package com.georeferencias;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;

@SpringBootApplication
@EnableCaching
public class GeoReferenciasApplication {

    public static void main(String[] args) {
        SpringApplication.run(GeoReferenciasApplication.class, args);
    }
}
