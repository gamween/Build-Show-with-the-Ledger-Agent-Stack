#!/usr/bin/env bash
# Download the official Ledger Ethereum app build (Nano X) used by Speculos.
# These ELFs are the real, Ledger-signed app binaries published on GitHub —
# the same code that runs on hardware. We do not build our own.
set -euo pipefail

APP_VERSION="${APP_VERSION:-1.22.1}"
MODEL="${MODEL:-nanox}"
ASSET="app-${APP_VERSION}-${MODEL}.elf"
URL="https://github.com/LedgerHQ/app-ethereum/releases/download/${APP_VERSION}/${ASSET}"

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEST_DIR="${ROOT}/apps"
DEST="${DEST_DIR}/ethereum-${MODEL}.elf"

mkdir -p "${DEST_DIR}"

if [ -f "${DEST}" ]; then
  echo "Already have ${DEST}"
  exit 0
fi

echo "Downloading ${ASSET} (official Ledger Ethereum app)…"
if command -v gh >/dev/null 2>&1; then
  gh release download "${APP_VERSION}" -R LedgerHQ/app-ethereum -p "${ASSET}" -O "${DEST}"
else
  curl -fL "${URL}" -o "${DEST}"
fi

echo "Saved ${DEST}"
