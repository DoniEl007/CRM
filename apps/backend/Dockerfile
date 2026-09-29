# Multi-stage build: compile with full devDependencies, ship only the
# compiled output + production dependencies in the runtime image.

FROM node:22-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh
EXPOSE 3000
# Runs pending migrations (against the compiled dist/data-source.js — no
# ts-node in this image, see data-source.ts) before starting the server.
ENTRYPOINT ["./docker-entrypoint.sh"]
