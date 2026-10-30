#!/usr/bin/env bash
# Instala o actualiza el servicio del parte diario en un servidor con Docker.
#   curl -fsSL https://raw.githubusercontent.com/cmm2025-dev/visionaria-website/<rama>/tools/parte-diario/instalar.sh | bash -s -- <rama>
# o, con el repositorio ya clonado:   tools/parte-diario/instalar.sh
set -euo pipefail

RAMA="${1:-main}"
REPO=https://github.com/cmm2025-dev/visionaria-website.git
DESTINO=/opt/visionaria-website

if [ -f "$(dirname "$0")/docker-compose.yml" ]; then
  cd "$(dirname "$0")"
else
  if [ -d "$DESTINO/.git" ]; then
    git -C "$DESTINO" fetch --depth 1 origin "$RAMA" && git -C "$DESTINO" checkout -q FETCH_HEAD
  else
    sudo mkdir -p "$DESTINO" && sudo chown "$USER" "$DESTINO"
    git clone --depth 1 -b "$RAMA" "$REPO" "$DESTINO"
  fi
  cd "$DESTINO/tools/parte-diario"
fi

if [ ! -f .env ]; then
  cp .env.ejemplo .env && chmod 600 .env
  echo ">> Se creó .env. Completa las credenciales de Dropbox y PARTE_DB_PASSWORD, y vuelve a ejecutar."; exit 1
fi
if [ ! -f comunas.json ]; then
  cp comunas.ejemplo.json comunas.json
  echo ">> Se creó comunas.json con la configuración de prueba. Revísalo y vuelve a ejecutar."; exit 1
fi

docker compose up -d --build
docker compose ps
echo ">> Registro del servicio:  docker compose logs -f parte"
echo ">> Comandos:               ./parte.sh estado --comuna Tocopilla"
