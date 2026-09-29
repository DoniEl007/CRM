#!/bin/sh
set -e

echo "Running database migrations..."
npm run migration:run:prod

echo "Starting server..."
exec node dist/main.js
