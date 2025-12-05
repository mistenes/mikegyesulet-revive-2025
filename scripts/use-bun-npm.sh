#!/usr/bin/env bash
# Add the Bun-backed npm shim to PATH so `npm` commands work even when npm is absent.
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
SHIM_DIR="$SCRIPT_DIR/shims"
if [[ ":$PATH:" != *":$SHIM_DIR:"* ]]; then
  export PATH="$SHIM_DIR:$PATH"
fi
echo "Using Bun-backed npm shim (npm -> bun)."
