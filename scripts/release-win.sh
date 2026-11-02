#!/usr/bin/env bash
set -e

# ==============================================================================
# RD POS System - Script de Release para Windows desde Host Linux / macOS
# ==============================================================================

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

echo "======================================================================"
echo "🚀 Iniciando proceso de Release para plataforma Windows (x64)"
echo "======================================================================"

# 1. Cargar variables de entorno desde .env si existe
if [ -f ".env" ]; then
  echo "📄 Leyendo variables de entorno desde .env..."
  export $(grep -v '^#' .env | xargs -d '\n' 2>/dev/null || true)
fi

# 2. Verificar GITHUB_TOKEN
if [ -z "$GITHUB_TOKEN" ]; then
  echo "⚠️  ADVERTENCIA: No se encontró la variable GITHUB_TOKEN."
  echo "   Si deseas publicar en GitHub Releases, añade tu token en .env o ejecuta:"
  echo "   export GITHUB_TOKEN=\"ghp_...\""
  echo "----------------------------------------------------------------------"
  if [ "$1" != "--make-only" ] && [ "$1" != "--dry-run" ]; then
    echo "Deseas continuar sólo generando los instaladores locales (--make-only)? [s/N]"
    read -r response
    if [[ "$response" =~ ^([sS][iI]?|[yY][eE]?[sS]?)$ ]]; then
      MAKE_ONLY=true
    else
      echo "❌ Operación cancelada. Configura GITHUB_TOKEN e intenta nuevamente."
      exit 1
    fi
  fi
fi

# 3. Detectar gestor de paquetes (pnpm o npm)
if command -v pnpm &> /dev/null; then
  PKG_MGR="pnpm"
else
  PKG_MGR="npm"
fi
echo "📦 Usando gestor de paquetes: $PKG_MGR"

# 4. Compilar Backend TypeScript y Frontend Vite
echo "🔨 Compilando servidor TypeScript y frontend Vite..."
$PKG_MGR run build

# 5. Ejecutar Make o Publish según los argumentos
if [ "$MAKE_ONLY" = true ] || [ "$1" == "--make-only" ]; then
  echo "🛠️  Generando instaladores de Windows (make --platform=win32 --arch=x64)..."
  npx electron-forge make --platform=win32 --arch=x64
  echo "✅ Distribuibles locales de Windows generados con éxito en la carpeta: out/make/"
elif [ "$1" == "--dry-run" ]; then
  echo "🧪 Ejecutando publicación en modo simulación (--dry-run)..."
  npx electron-forge publish --platform=win32 --arch=x64 --dry-run
  echo "✅ Simulación de publicación para Windows finalizada."
else
  echo "📤 Publicando release para Windows en GitHub Releases..."
  EXTRA_ARGS=""
  if [ -n "$1" ]; then
    EXTRA_ARGS="$@"
  fi
  npx electron-forge publish --platform=win32 --arch=x64 $EXTRA_ARGS
  echo "🎉 Release para Windows publicado exitosamente en GitHub!"
fi

