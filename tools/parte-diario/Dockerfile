FROM debian:bookworm-slim

# LibreOffice sin ventanas con su enlace Python (python3-uno), el cliente de PostgreSQL para los respaldos
# y psycopg. Todo desde los paquetes de Debian para que la imagen sea reproducible.
RUN apt-get update && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
      libreoffice-calc python3-uno python3-psycopg postgresql-client-15 fonts-dejavu-core ca-certificates \
    && rm -rf /var/lib/apt/lists/*

ENV LANG=C.UTF-8 PYTHONUNBUFFERED=1 PARTE_SOFFICE=/usr/bin/soffice
WORKDIR /app
COPY parte/ /app/parte/
COPY schema.sql /app/schema.sql

RUN useradd -r -m -d /home/parte parte && mkdir -p /var/lib/parte-diario && chown parte /var/lib/parte-diario
USER parte

CMD ["sh", "-c", "python3 -m parte migrar && exec python3 -m parte ciclo"]
