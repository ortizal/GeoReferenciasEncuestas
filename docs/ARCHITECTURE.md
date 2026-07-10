# GeoReferencias Encuestas

Sistema GIS Web para administración de manzanas, predios y visitas de campo.

## Arquitectura

```
georeferencias/
├── backend/                    # Spring Boot 3 + Java 21
│   ├── src/main/java/com/georeferencias/
│   │   ├── config/            # Configuraciones (Security, Swagger)
│   │   ├── controller/        # REST Controllers
│   │   ├── dto/               # Data Transfer Objects
│   │   ├── entity/            # JPA Entities + PostGIS
│   │   ├── enums/             # Enumeraciones
│   │   ├── exception/         # Manejo de excepciones
│   │   ├── repository/        # Spring Data JPA Repositories
│   │   ├── security/          # JWT + Spring Security
│   │   ├── service/           # Business Logic
│   │   │   └── impl/          # Service Implementations
│   │   └── util/              # Utilidades
│   └── src/main/resources/
│       └── application.properties
├── frontend/                   # Angular 20
│   └── src/app/
│       ├── core/              # Core Module
│       │   ├── guards/        # Auth, Role, Login Guards
│       │   ├── interceptors/  # JWT, Error Interceptors
│       │   ├── models/        # TypeScript Models
│       │   └── services/      # API Services
│       ├── layout/            # Layout Components
│       │   ├── header/
│       │   ├── sidebar/
│       │   └── footer/
│       ├── pages/             # Page Components
│       │   ├── login/
│       │   ├── dashboard/
│       │   ├── manzanas/
│       │   ├── predios/
│       │   ├── visitas/
│       │   ├── mapa/
│       │   ├── reportes/
│       │   └── usuarios/
│       └── shared/            # Shared Components
├── sql/                       # Database Scripts
│   └── 001_create_schema.sql
└── docs/                      # Documentation
    └── ARCHITECTURE.md
```

## Tecnologías

### Backend
- Java 21
- Spring Boot 3.3
- Spring Security + JWT
- Spring Data JPA + Hibernate
- PostgreSQL + PostGIS
- MapStruct + Lombok
- Swagger OpenAPI

### Frontend
- Angular 20
- TypeScript
- Bootstrap 5
- Leaflet + ngx-leaflet
- RxJS + Angular Signals

## Base de Datos

PostgreSQL con extensión PostGIS para manejo espacial:
- `geometry(Polygon, 4326)` para manzanas
- `geometry(Point, 4326)` para predios
- Consultas espaciales: ST_Contains, ST_Intersects, ST_Distance

## Seguridad

- Autenticación JWT
- 3 roles: Administrador, Supervisor, Visitador
- Permisos por módulo
- Bloqueo de usuario por intentos fallidos

## Endpoints Principales

### Auth
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh Token
- `POST /api/auth/logout` - Logout

### Manzanas
- `GET /api/manzanas` - Listar
- `POST /api/manzanas` - Crear
- `PUT /api/manzanas/{id}` - Actualizar
- `DELETE /api/manzanas/{id}` - Eliminar

### Predios
- `GET /api/predios` - Listar
- `POST /api/predios` - Crear
- `PUT /api/predios/{id}` - Actualizar
- `DELETE /api/predios/{id}` - Eliminar

### Visitas
- `GET /api/visitas` - Listar
- `POST /api/visitas` - Crear
- `GET /api/visitas/estadisticas` - Estadísticas

### Dashboard
- `GET /api/dashboard` - Indicadores

## Instalación

### Backend
```bash
cd backend
mvn clean install
mvn spring-boot:run
```

### Frontend
```bash
cd frontend
npm install
ng serve
```

### Base de Datos
```bash
psql -U postgres -d postgres -f sql/001_create_schema.sql
```

## Variables de Entorno

### Backend (application.properties)
```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/georeferencias_db
spring.datasource.username=postgres
spring.datasource.password=postgres
jwt.secret=tu_clave_secreta
```

### Frontend (proxy.conf.json)
```json
{
  "/api": {
    "target": "http://localhost:8080",
    "secure": false
  }
}
```
