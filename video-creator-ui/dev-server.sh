#!/bin/bash
cd "$(dirname "$0")"
echo "Current directory: $(pwd)"
echo "Checking Next.js binary..."
ls -la node_modules/next/dist/bin/next
echo "Starting Next.js..."
unset NODE_OPTIONS
exec node node_modules/next/dist/bin/next dev "$@"
