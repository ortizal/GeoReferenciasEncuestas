#!/usr/bin/env bash
# ============================================
# build-apk.sh — Build Flutter APK
# Ejecutar desde: deploy/mobile/
# ============================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
MOBILE_DIR="$PROJECT_ROOT/mobile"
OUTPUT_DIR="$SCRIPT_DIR/output"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log()  { echo -e "${GREEN}[BUILD-APK]${NC} $*"; }
warn() { echo -e "${YELLOW}[WARNING]${NC} $*"; }
err()  { echo -e "${RED}[ERROR]${NC} $*" >&2; }

# ---- Verificar Flutter ----
check_flutter() {
    if ! command -v flutter &>/dev/null; then
        err "Flutter no encontrado. Instalarlo: https://docs.flutter.dev/get-started/install"
        exit 1
    fi
    log "Flutter: $(flutter --version | head -1)"

    # Verificar Android SDK
    if [ -z "${ANDROID_HOME:-}" ] && [ -z "${ANDROID_SDK_ROOT:-}" ]; then
        warn "ANDROID_HOME no configurado. Asegurate de tener Android SDK instalado."
    fi
}

# ---- Verificar calidad del codigo ----
analyze() {
    log "Analizando codigo..."
    cd "$MOBILE_DIR"
    flutter analyze --no-fatal-infos --no-fatal-warnings 2>/dev/null || true
}

# ---- Build APK Release ----
build_release() {
    log "Construyendo APK (release)..."
    cd "$MOBILE_DIR"
    flutter pub get --silent
    flutter build apk --release --split-per-abi

    mkdir -p "$OUTPUT_DIR"
    cp build/app/outputs/flutter-apk/app-arm64-v8a-release.apk "$OUTPUT_DIR/georeferencias-arm64.apk" 2>/dev/null || \
    cp build/app/outputs/flutter-apk/app-release.apk "$OUTPUT_DIR/georeferencias-release.apk" 2>/dev/null || true

    log "APK generado en: $OUTPUT_DIR/"
    ls -lh "$OUTPUT_DIR/"*.apk 2>/dev/null || warn "No se encontro APK"
}

# ---- Build Debug ----
build_debug() {
    log "Construyendo APK (debug)..."
    cd "$MOBILE_DIR"
    flutter pub get --silent
    flutter build apk --debug

    mkdir -p "$OUTPUT_DIR"
    cp build/app/outputs/flutter-apk/app-debug.apk "$OUTPUT_DIR/georeferencias-debug.apk" 2>/dev/null || true

    log "APK debug generado en: $OUTPUT_DIR/"
    ls -lh "$OUTPUT_DIR/"*.apk 2>/dev/null || warn "No se encontro APK"
}

# ---- Build App Bundle (para Play Store) ----
build_appbundle() {
    log "Construyendo App Bundle..."
    cd "$MOBILE_DIR"
    flutter pub get --silent
    flutter build appbundle --release

    mkdir -p "$OUTPUT_DIR"
    cp build/app/outputs/bundle/release/app-release.aab "$OUTPUT_DIR/georeferencias-release.aab" 2>/dev/null || true

    log "AAB generado en: $OUTPUT_DIR/"
    ls -lh "$OUTPUT_DIR/"*.aab 2>/dev/null || warn "No se encontro AAB"
}

# ---- Limpiar ----
clean() {
    log "Limpiando build anterior..."
    cd "$MOBILE_DIR"
    flutter clean
    rm -rf "$OUTPUT_DIR"
    log "Limpieza completada"
}

# ---- Main ----
usage() {
    echo "Uso: $0 {release|debug|appbundle|analyze|clean}"
    echo ""
    echo "  release    - Build APK release (recomendado para instalar)"
    echo "  debug      - Build APK debug (para desarrollo)"
    echo "  appbundle  - Build AAB (para Google Play Store)"
    echo "  analyze    - Analizar codigo sin compilar"
    echo "  clean      - Limpiar builds anteriores"
}

case "${1:-}" in
    release)
        check_flutter
        build_release
        ;;
    debug)
        check_flutter
        build_debug
        ;;
    appbundle)
        check_flutter
        build_appbundle
        ;;
    analyze)
        check_flutter
        analyze
        ;;
    clean)
        clean
        ;;
    *)
        usage
        exit 1
        ;;
esac
