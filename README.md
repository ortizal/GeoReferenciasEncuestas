# GeoReferencias Encuestas

Sistema GIS Web profesional para la administración de manzanas, predios y visitas de campo.

## Características

- **Mapa GIS interactivo** con OpenStreetMap + Leaflet
- **Dibujo de polígonos** para delimitar manzanas
- **Marcadores inteligentes** con colores según estado de visita
- **Dashboard ejecutivo** con indicadores en tiempo real
- **Reportes** exportables a PDF y Excel
- **Seguridad JWT** con roles y permisos
- **Diseño responsive** moderno y profesional

## Requisitos

- Java 21+
- Node.js 18+
- PostgreSQL 15+ con PostGIS
- Maven 3.8+

## Instalación Rápida

```bash
# 1. Crear base de datos
psql -U postgres -c "CREATE DATABASE georeferencias_db;"
psql -U postgres -d georeferencias_db -c "CREATE EXTENSION postgis;"
psql -U postgres -d georeferencias_db -f sql/001_create_schema.sql

# 2. Backend
cd backend
mvn clean install
mvn spring-boot:run

# 3. Frontend
cd frontend
npm install
ng serve
```

## Acceso

- **Frontend:** http://localhost:4200
- **Backend API:** http://localhost:8080/api
- **Swagger:** http://localhost:8080/api/swagger-ui.html

## Usuario por Defecto

- **Username:** admin
- **Password:** admin123

## Documentación

Ver [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) para detalles de arquitectura.
