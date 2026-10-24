#!/bin/sh
echo "=== SAAS VALIDATION LAB CONTAINER BOOT ==="
echo "Node version: $(node -v)"
echo "Current directory: $(pwd)"
echo "Listing server/dist:"
ls -la server/dist || true

# Executa aplicação Node
node --experimental-sqlite server/dist/index.js || node server/dist/index.js || {
  EXIT_CODE=$?
  echo "!!! NODE CRASHED WITH EXIT CODE $EXIT_CODE !!!"
  echo "Holding container open for log inspection..."
  sleep 3600
}

