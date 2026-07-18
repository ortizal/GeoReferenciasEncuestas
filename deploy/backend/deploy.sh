#!/usr/bin/env bash
# ============================================
# deploy-backend.sh — Build & deploy backend
# Ejecutar desde: deploy/backend/
# ============================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
COMPOSE_FILE="$SCRIPT_DIR/docker-compose.yml"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

log()  { echo -e "${GREEN}[DEPLOY-BACKEND]${NC} $*"; }
warn() { echo -e "${YELLOW}[WARNING]${NC} $*"; }
err()  { echo -e "${RED}[ERROR]${NC} $*" >&2; }

# ---- Verificar dependencias ----
check_deps() {
    for cmd in docker mvn; do
        if ! command -v "$cmd" &>/dev/null; then
            err "Falta '$cmd'. Instalarlo antes de continuar."
            exit 1
        fi
    done
    log "Dependencias verificadas"
}

# ---- Parar servicios anteriores ----
stop_existing() {
    log "Parando servicios existentes..."
    docker compose -f "$COMPOSE_FILE" down --remove-orphans 2>/dev/null || true
}

# ---- Construir backend (JAR) ----
build_jar() {
    log "Construyendo JAR..."
    cd "$PROJECT_ROOT/backend"
    mvn clean package -DskipTests -q
    log "JAR generado: $(ls target/*.jar | head -1)"
}

# ---- Levantar servicios ----
start_services() {
    log "Levantando PostgreSQL + Backend..."
    cd "$SCRIPT_DIR"
    docker compose -f "$COMPOSE_FILE" up -d --build

    log "Esperando a que el backend este listo..."
    local retries=30
    until curl -sf http://localhost:8080/api/actuator/health &>/dev/null; do
        retries=$((retries - 1))
        if [ $retries -le 0 ]; then
            err "Backend no respondio en 60s"
            docker compose -f "$COMPOSE_FILE" logs backend
            exit 1
        fi
        sleep 2
    done
    log "Backend listo en http://localhost:8080/api"
}

# ---- Verificar estado ----
status() {
    echo ""
    log "=== Estado de servicios ==="
    docker compose -f "$COMPOSE_FILE" ps
    echo ""
    log "Health check:"
    curl -s http://localhost:8080/api/actuator/health 2>/dev/null | python3 -m json.tool 2>/dev/null || warn "No se pudo verificar health"
}

# ---- Main ----
usage() {
    echo "Uso: $0 {start|stop|restart|status|logs|build}"
    echo ""
    echo "  start   - Levantar PostgreSQL + Backend"
    echo "  stop    - Parar todos los servicios"
    echo "  restart - Reiniciar servicios"
    echo "  status  - Ver estado de servicios"
    echo "  logs    - Ver logs del backend"
    echo "  build   - Solo construir el JAR"
}

case "${1:-}" in
    start)
        check_deps
        stop_existing
        start_services
        status
        ;;
    stop)
        stop_existing
        log "Servicios detenidos"
        ;;
    restart)
        check_deps
        stop_existing
        start_services
        status
        ;;
    status)
        status
        ;;
    logs)
        docker compose -f "$COMPOSE_FILE" logs -f --tail=100 backend
        ;;
    build)
        build_jar
        ;;
    *)
        usage
        exit 1
        ;;
esac
