#!/usr/bin/env bash
set -euo pipefail

# Clear proxy-related variables that can force npm through a MITM proxy
unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY npm_config_http_proxy npm_config_https_proxy

# Force the official npm registry even if a mirror override is present in the environment
unset NPM_CONFIG_REGISTRY npm_config_registry
REGISTRY_URL=https://registry.npmjs.org/

echo "Installing dependencies without proxy using registry $REGISTRY_URL" >&2
npm install --include=dev --no-progress --registry="$REGISTRY_URL"
