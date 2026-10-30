#!/usr/bin/env bash
# Ejecuta un comando del parte diario dentro del contenedor del servicio. Ej.:
#   ./parte.sh estado --comuna Tocopilla
#   ./parte.sh anular TOC-P0012 --por cmejias@visionaria.cl --motivo "Punto equivocado"
#   ./parte.sh importar --comuna Tocopilla
#   ./parte.sh resolver --comuna Tocopilla --prevalece bd
cd "$(dirname "$0")" && exec docker compose exec parte python3 -m parte "$@"
