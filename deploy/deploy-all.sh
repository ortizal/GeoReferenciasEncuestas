#!/usr/bin/env bash
# ============================================
# deploy-all.sh — Deploy completo del sistema
# Ejecutar desde: deploy/
# ============================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

log()  { echo -e "${GREEN}[DEPLOY]${NC} $*"; }
warn() { echo -e "${YELLOW}[WARNING]${NC} $*"; }
err()  { echo -e "${RED}[ERROR]${NC} $*" >&2; }

header() {
    echo ""
    echo -e "${CYAN}============================================${NC}"
    echo -e "${CYAN}  $*${NC}"
    echo -e "${CYAN}============================================${NC}"
}

# ---- Backend ----
deploy_backend() {
    header "DEPLOY BACKEND (Docker)"
    bash "$SCRIPT_DIR/backend/deploy.sh" start
}

# ---- Frontend ----
deploy_frontend() {
    header "DEPLOY FRONTEND (Nginx)"
    bash "$SCRIPT_DIR/frontend/deploy.sh" deploy
}

# ---- Flutter APK ----
build_apk() {
    header "BUILD FLUTTER APK"
    bash "$SCRIPT_DIR/mobile/build-apk.sh" release
}

# ---- Status ----
show_status() {
    header "ESTADO DEL SISTEMA"
    echo -e "\n${BOLD}Backend (Docker):${NC}"
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "geo|NAMES" || warn "Docker no disponible o sin contenedores"
    echo -e "\n${BOLD}Frontend (Nginx):${NC}"
    systemctl is-active nginx 2>/dev/null && echo "  Nginx: activo" || echo "  Nginx: inactivo"
    echo -e "\n${BOLD}Endpoints:${NC}"
    echo "  Frontend:  http://localhost"
    echo "  Backend:   http://localhost:8080/api"
    echo "  Swagger:   http://localhost:8080/api/swagger-ui.html"
    echo "  Health:    http://localhost:8080/api/actuator/health"
}

# ---- Main ----
usage() {
    echo -e "${BOLD}Uso: $0 {all|backend|frontend|apk|status|stop}${NC}"
    echo ""
    echo "  all       - Deploy completo (backend + frontend + APK)"
    echo "  backend   - Solo deploy backend Docker"
    echo "  frontend  - Solo deploy frontend Nginx"
    echo "  apk       - Solo build APK Flutter"
    echo "  status    - Ver estado de todos los servicios"
    echo "  stop      - Parar backend y frontend"
    echo ""
    echo "  Ejemplos:"
    echo "    $0 all              # Deploy completo"
    echo "    $0 backend          # Solo backend"
    echo "    $0 apk              # Build APK"
}

case "${1:-}" in
    all)
        deploy_backend
        deploy_frontend
        build_apk
        show_status
        log "Deploy completo finalizado!"
        ;;
    backend)
        deploy_backend
        ;;
    frontend)
        deploy_frontend
        ;;
    apk)
        build_apk
        ;;
    status)
        show_status
        ;;
    stop)
        log "Parando servicios..."
        bash "$SCRIPT_DIR/backend/deploy.sh" stop
        bash "$SCRIPT_DIR/frontend/deploy.sh" stop
        log "Servicios detenidos"
        ;;
    *)
        usage
        exit 1
        ;;
esac
