#!/usr/bin/env bash
# Start / stop the Speculos emulator (official Ledger device simulator) in Docker,
# running the official Ethereum app ELF and exposing its HTTP API on :5000.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
NAME="ledger-clearsign-speculos"
MODEL="${MODEL:-nanox}"
ELF="ethereum-${MODEL}.elf"
PORT="${SPECULOS_PORT:-5001}"
IMAGE="ghcr.io/ledgerhq/speculos:latest"

cmd="${1:-start}"

case "${cmd}" in
  start)
    if [ ! -f "${ROOT}/apps/${ELF}" ]; then
      echo "Missing apps/${ELF} — run: npm run setup" >&2
      exit 1
    fi
    docker rm -f "${NAME}" >/dev/null 2>&1 || true
    echo "Starting Speculos (${MODEL}) on http://localhost:${PORT} …"
    docker run -d --name "${NAME}" \
      -v "${ROOT}/apps:/apps" \
      -p "${PORT}:5000" \
      "${IMAGE}" \
      --model "${MODEL}" "/apps/${ELF}" \
      --display headless --api-port 5000 >/dev/null

    # Wait until the HTTP API answers.
    for _ in $(seq 1 30); do
      if curl -fsS --max-time 2 "http://localhost:${PORT}/events?currentscreenonly=true" >/dev/null 2>&1; then
        echo "Speculos is up. The Ethereum app is open and ready."
        exit 0
      fi
      sleep 1
    done
    echo "Speculos did not become ready in time. Check: npm run speculos:logs" >&2
    exit 1
    ;;
  stop)
    docker rm -f "${NAME}" >/dev/null 2>&1 && echo "Stopped ${NAME}" || echo "Not running"
    ;;
  logs)
    docker logs -f "${NAME}"
    ;;
  *)
    echo "usage: speculos.sh {start|stop|logs}" >&2
    exit 2
    ;;
esac
