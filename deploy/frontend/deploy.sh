#!/usr/bin/env bash
# ============================================
# deploy-frontend.sh — Build Angular & deploy to Nginx
# Ejecutar desde: deploy/frontend/
# ============================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
FRONTEND_DIR="$PROJECT_ROOT/frontend"
NGINX_CONF="$SCRIPT_DIR/nginx.conf"
DEPLOY_DIR="/var/www/georeferencias"
NGINX_SITE="/etc/nginx/conf.d/georeferencias.conf"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log()  { echo -e "${GREEN}[DEPLOY-FRONTEND]${NC} $*"; }
warn() { echo -e "${YELLOW}[WARNING]${NC} $*"; }
err()  { echo -e "${RED}[ERROR]${NC} $*" >&2; }

# ---- Verificar dependencias ----
check_deps() {
    for cmd in nginx node npm; do
        if ! command -v "$cmd" &>/dev/null; then
            err "Falta '$cmd'. Instalarlo antes de continuar."
            exit 1
        fi
    done
    log "Dependencias verificadas"
}

# ---- Construir Angular ----
build_frontend() {
    log "Construyendo Angular..."
    cd "$FRONTEND_DIR"
    npm install --silent 2>/dev/null
    npm run build -- --configuration production
    log "Build completado en: $FRONTEND_DIR/dist/"
}

# ---- Desplegar en Nginx ----
deploy_to_nginx() {
    log "Desplegando en Nginx..."

    # Verificar permisos
    if [ ! -w "/var/www" ] && [ "$(id -u)" -ne 0 ]; then
        err "Se necesitan permisos root para deploy en /var/www"
        echo "Ejecutar: sudo $0 ${1:-}"
        exit 1
    fi

    # Copiar build
    rm -rf "$DEPLOY_DIR"
    mkdir -p "$DEPLOY_DIR"
    cp -r "$FRONTEND_DIR/dist/geo-referencias-frontend/"* "$DEPLOY_DIR/"
    log "Archivos copiados a $DEPLOY_DIR"

    # Copiar configuracion Nginx
    cp "$NGINX_CONF" "$NGINX_SITE"
    log "Configuracion Nginx instalada en $NGINX_SITE"

    # Verificar configuracion
    if nginx -t 2>/dev/null; then
        systemctl reload nginx 2>/dev/null || nginx -s reload 2>/dev/null
        log "Nginx recargado"
    else
        err "Configuracion Nginx invalida"
        nginx -t
        exit 1
    fi
}

# ---- Verificar despliegue ----
verify() {
    log "Verificando despliegue..."
    if curl -sf http://localhost/ &>/dev/null; then
        log "Frontend accesible en http://localhost"
    else
        warn "No se pudo verificar. Verificar que Nginx este activo: systemctl status nginx"
    fi
}

# ---- Main ----
usage() {
    echo "Uso: $0 {build|deploy|start|stop|status}"
    echo ""
    echo "  build  - Solo construir Angular (sin deploy)"
    echo "  deploy - Construir + copiar a Nginx"
    echo "  start  - Iniciar Nginx"
    echo "  stop   - Detener Nginx"
    echo "  status - Ver estado de Nginx"
}

case "${1:-}" in
    build)
        check_deps
        build_frontend
        ;;
    deploy)
        check_deps
        build_frontend
        deploy_to_nginx
        verify
        ;;
    start)
        systemctl start nginx 2>/dev/null || nginx
        log "Nginx iniciado"
        ;;
    stop)
        systemctl stop nginx 2>/dev/null || nginx -s stop 2>/dev/null
        log "Nginx detenido"
        ;;
    status)
        systemctl status nginx 2>/dev/null || nginx -t 2>/dev/null
        ;;
    *)
        usage
        exit 1
        ;;
esac
