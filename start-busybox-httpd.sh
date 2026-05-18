#!/usr/bin/env sh

set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
PORT="${PORT:-4000}"
HOST="${HOST:-0.0.0.0}"
PID_FILE="${SCRIPT_DIR}/.busybox-httpd.pid"

if ! command -v busybox >/dev/null 2>&1; then
  echo "Erro: busybox nao encontrado no PATH." >&2
  exit 1
fi

if [ -f "$PID_FILE" ]; then
  OLD_PID=$(cat "$PID_FILE" 2>/dev/null || true)
  if [ -n "${OLD_PID:-}" ] && kill -0 "$OLD_PID" 2>/dev/null; then
    echo "Servidor ja esta em execucao em http://${HOST}:${PORT} (PID ${OLD_PID})."
    exit 0
  fi
  rm -f "$PID_FILE"
fi

busybox httpd -f -p "${HOST}:${PORT}" -h "$SCRIPT_DIR" &
HTTPD_PID=$!
echo "$HTTPD_PID" > "$PID_FILE"

echo "Servidor iniciado em http://${HOST}:${PORT}"
echo "PID: ${HTTPD_PID}"
echo "Raiz: ${SCRIPT_DIR}"
