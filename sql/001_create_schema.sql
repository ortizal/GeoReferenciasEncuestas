-- ============================================
-- GeoReferencias Encuestas - Script de Base de Datos
-- PostgreSQL + PostGIS
-- ============================================

-- Habilitar extensión PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLAS DE SEGURIDAD
-- ============================================

-- Tabla MODULOS
CREATE TABLE modulos (
    id_modulo BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    descripcion VARCHAR(200),
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla PERMISOS
CREATE TABLE permisos (
    id_permiso BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion VARCHAR(200),
    id_modulo BIGINT NOT NULL REFERENCES modulos(id_modulo),
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla ROLES
CREATE TABLE roles (
    id_rol BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    descripcion VARCHAR(200),
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla ROL_PERMISOS (relación many-to-many)
CREATE TABLE rol_permisos (
    id_rol BIGINT NOT NULL REFERENCES roles(id_rol),
    id_permiso BIGINT NOT NULL REFERENCES permisos(id_permiso),
    PRIMARY KEY (id_rol, id_permiso)
);

-- Tabla USUARIOS
CREATE TABLE usuarios (
    id_usuario BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    telefono VARCHAR(20),
    estado VARCHAR(20) NOT NULL DEFAULT 'ACTIVO',
    primer_login BOOLEAN NOT NULL DEFAULT TRUE,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    intentos_fallidos INTEGER DEFAULT 0,
    fecha_bloqueo TIMESTAMP,
    ultimo_acceso TIMESTAMP,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    usuario_creacion VARCHAR(50)
);

-- Tabla USUARIO_ROLES (relación many-to-many)
CREATE TABLE usuario_roles (
    id_usuario BIGINT NOT NULL REFERENCES usuarios(id_usuario),
    id_rol BIGINT NOT NULL REFERENCES roles(id_rol),
    PRIMARY KEY (id_usuario, id_rol)
);

-- ============================================
-- TABLAS DEL SISTEMA GIS
-- ============================================

-- Tabla MANZANAS
CREATE TABLE manzanas (
    id_manzana BIGSERIAL PRIMARY KEY,
    clave_catastral_manzana VARCHAR(30) NOT NULL UNIQUE,
    nombre VARCHAR(100) NOT NULL,
    sector VARCHAR(50),
    barrio VARCHAR(50),
    poligono GEOMETRY(Polygon, 4326),
    area DOUBLE PRECISION,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    usuario_creacion VARCHAR(50)
);

-- Índice espacial para manzanas
CREATE INDEX idx_manzanas_poligono ON manzanas USING GIST(poligono);

-- Tabla PREDIOS
CREATE TABLE predios (
    id_predio BIGSERIAL PRIMARY KEY,
    id_manzana BIGINT NOT NULL REFERENCES manzanas(id_manzana),
    clave_catastral VARCHAR(30) NOT NULL UNIQUE,
    propietario VARCHAR(150) NOT NULL,
    direccion VARCHAR(200) NOT NULL,
    telefono VARCHAR(20),
    georeferencia GEOMETRY(Point, 4326),
    observaciones VARCHAR(500),
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    usuario_creacion VARCHAR(50)
);

-- Índice espacial para predios
CREATE INDEX idx_predios_georeferencia ON predios USING GIST(georeferencia);
CREATE INDEX idx_predios_manzana ON predios(id_manzana);

-- Tabla VISITAS
CREATE TABLE visitas (
    id_visita BIGSERIAL PRIMARY KEY,
    id_predio BIGINT NOT NULL REFERENCES predios(id_predio),
    id_usuario_visitador BIGINT NOT NULL REFERENCES usuarios(id_usuario),
    fecha_visita TIMESTAMP NOT NULL,
    estado_visita VARCHAR(20) NOT NULL,
    observaciones VARCHAR(500),
    fotografia VARCHAR(255),
    latitud_visita DOUBLE PRECISION,
    longitud_visita DOUBLE PRECISION,
    hora_inicio TIME,
    hora_fin TIME,
    vivienda_trabajable BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_visitas_predio ON visitas(id_predio);
CREATE INDEX idx_visitas_usuario ON visitas(id_usuario_visitador);
CREATE INDEX idx_visitas_estado ON visitas(estado_visita);
CREATE INDEX idx_visitas_fecha ON visitas(fecha_visita);

-- ============================================
-- TABLAS DE AUDITORÍA
-- ============================================

-- Tabla BITACORA
CREATE TABLE bitacora (
    id_bitacora BIGSERIAL PRIMARY KEY,
    id_usuario BIGINT REFERENCES usuarios(id_usuario),
    accion VARCHAR(50) NOT NULL,
    entidad VARCHAR(100) NOT NULL,
    entidad_id BIGINT,
    descripcion VARCHAR(500),
    ip VARCHAR(100),
    user_agent VARCHAR(200),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla AUDITORIA
CREATE TABLE auditoria (
    id_auditoria BIGSERIAL PRIMARY KEY,
    tabla VARCHAR(50) NOT NULL,
    registro_id BIGINT NOT NULL,
    operacion VARCHAR(20) NOT NULL,
    valores_anteriores VARCHAR(500),
    valores_nuevos VARCHAR(500),
    usuario VARCHAR(50),
    ip VARCHAR(100),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- DATOS INICIALES
-- ============================================

-- Módulos
INSERT INTO modulos (nombre, descripcion) VALUES
('DASHBOARD', 'Panel de control y estadísticas'),
('MANZANAS', 'Gestión de manzanas catastrales'),
('PREDIOS', 'Gestión de predios catastrales'),
('VISITAS', 'Gestión de visitas de campo'),
('MAPA', 'Vista GIS del mapa'),
('REPORTES', 'Generación de reportes'),
('USUARIOS', 'Gestión de usuarios'),
('SEGURIDAD', 'Configuración de seguridad'),
('BITACORA', 'Consulta de bitácora'),
('AUDITORIA', 'Consulta de auditoría');

-- Permisos
INSERT INTO permisos (nombre, descripcion, id_modulo) VALUES
-- Dashboard
('DASHBOARD_VER', 'Ver dashboard', 1),
('DASHBOARD_ESTADISTICAS', 'Ver estadísticas', 1),
-- Manzanas
('MANZANAS_LISTAR', 'Listar manzanas', 2),
('MANZANAS_CREAR', 'Crear manzana', 2),
('MANZANAS_EDITAR', 'Editar manzana', 2),
('MANZANAS_ELIMINAR', 'Eliminar manzana', 2),
('MANZANAS_EXPORTAR', 'Exportar manzanas', 2),
-- Predios
('PREDIOS_LISTAR', 'Listar predios', 3),
('PREDIOS_CREAR', 'Crear predio', 3),
('PREDIOS_EDITAR', 'Editar predio', 3),
('PREDIOS_ELIMINAR', 'Eliminar predio', 3),
('PREDIOS_EXPORTAR', 'Exportar predios', 3),
-- Visitas
('VISITAS_LISTAR', 'Listar visitas', 4),
('VISITAS_CREAR', 'Crear visita', 4),
('VISITAS_EDITAR', 'Editar visita', 4),
('VISITAS_ELIMINAR', 'Eliminar visita', 4),
('VISITAS_EXPORTAR', 'Exportar visitas', 4),
('VISITAS_ASIGNAR', 'Asignar visitas', 4),
-- Mapa
('MAPA_VER', 'Ver mapa GIS', 5),
('MAPA_DIBUJAR', 'Dibujar en mapa', 5),
('MAPA_CAPAS', 'Gestionar capas', 5),
-- Reportes
('REPORTES_VER', 'Ver reportes', 6),
('REPORTES_EXPORTAR', 'Exportar reportes', 6),
('REPORTES_VISITAS', 'Reporte de visitas', 6),
('REPORTES_SECTORES', 'Reporte por sectores', 6),
-- Usuarios
('USUARIOS_LISTAR', 'Listar usuarios', 7),
('USUARIOS_CREAR', 'Crear usuario', 7),
('USUARIOS_EDITAR', 'Editar usuario', 7),
('USUARIOS_ELIMINAR', 'Eliminar usuario', 7),
('USUARIOS_BLOQUEAR', 'Bloquear usuario', 7),
-- Seguridad
('SEGURIDAD_ROLES', 'Gestionar roles', 8),
('SEGURIDAD_PERMISOS', 'Gestionar permisos', 8),
('SEGURIDAD_MENUS', 'Gestionar menús', 8),
-- Bitácora
('BITACORA_VER', 'Ver bitácora', 9),
-- Auditoría
('AUDITORIA_VER', 'Ver auditoría', 10);

-- Roles
INSERT INTO roles (nombre, descripcion) VALUES
('ADMINISTRADOR', 'Control total del sistema'),
('SUPERVISOR', 'Supervisión y reportes'),
('VISITADOR', 'Visitas de campo');

-- Asignar permisos a roles
-- Administrador: todos los permisos
INSERT INTO rol_permisos (id_rol, id_permiso)
SELECT 1, id_permiso FROM permisos;

-- Supervisor: permisos limitados
INSERT INTO rol_permisos (id_rol, id_permiso)
SELECT 2, id_permiso FROM permisos WHERE nombre IN (
    'DASHBOARD_VER', 'DASHBOARD_ESTADISTICAS',
    'MANZANAS_LISTAR', 'MANZANAS_EXPORTAR',
    'PREDIOS_LISTAR', 'PREDIOS_EXPORTAR',
    'VISITAS_LISTAR', 'VISITAS_CREAR', 'VISITAS_EDITAR', 'VISITAS_ASIGNAR', 'VISITAS_EXPORTAR',
    'MAPA_VER', 'MAPA_CAPAS',
    'REPORTES_VER', 'REPORTES_EXPORTAR', 'REPORTES_VISITAS', 'REPORTES_SECTORES'
);

-- Visitador: permisos mínimos
INSERT INTO rol_permisos (id_rol, id_permiso)
SELECT 3, id_permiso FROM permisos WHERE nombre IN (
    'MAPA_VER', 'MAPA_DIBUJAR',
    'VISITAS_LISTAR', 'VISITAS_CREAR', 'VISITAS_EDITAR',
    'PREDIOS_LISTAR'
);

-- Usuario administrador por defecto (contraseña: admin123)
INSERT INTO usuarios (username, password, nombre, apellido, email, estado, primer_login, activo)
VALUES ('admin', '$2b$10$bsgtOk5f/f2IEf1ffZnV/.A3d2yYxrFCY1aPTBopQldzDFGblJ.Gm',
        'Administrador', 'Sistema', 'admin@georeferencias.com', 'ACTIVO', TRUE, TRUE);

INSERT INTO usuario_roles (id_usuario, id_rol) VALUES (1, 1);

-- ============================================
-- CONSULTAS ESPACIALES ÚTILES
-- ============================================

-- Buscar manzana que contiene un punto
-- SELECT * FROM manzanas WHERE ST_Contains(poligono, ST_SetSRID(ST_MakePoint(-78.0, -0.2), 4326));

-- Calcular área de una manzana
-- SELECT ST_Area(poligono::geography) AS area_m2 FROM manzanas WHERE id_manzana = 1;

-- Distancia entre dos puntos
-- SELECT ST_Distance(
--     ST_SetSRID(ST_MakePoint(-78.0, -0.2), 4326)::geography,
--     ST_SetSRID(ST_MakePoint(-78.1, -0.3), 4326)::geography
-- ) AS distancia_metros;

-- Predios dentro de un radio
-- SELECT * FROM predios
-- WHERE ST_DWithin(
--     georeferencia::geography,
--     ST_SetSRID(ST_MakePoint(-78.0, -0.2), 4326)::geography,
--     1000  -- 1 km
-- );
