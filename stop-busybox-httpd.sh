#!/usr/bin/env sh

set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
PID_FILE="${SCRIPT_DIR}/.busybox-httpd.pid"

if [ ! -f "$PID_FILE" ]; then
  echo "Nenhum servidor em execucao."
  exit 0
fi

PID=$(cat "$PID_FILE" 2>/dev/null || true)

if [ -z "${PID:-}" ]; then
  rm -f "$PID_FILE"
  echo "Arquivo de PID invalido removido."
  exit 0
fi

if kill -0 "$PID" 2>/dev/null; then
  kill "$PID"
  echo "Servidor parado (PID ${PID})."
else
  echo "Processo ${PID} nao estava em execucao."
fi

rm -f "$PID_FILE"
