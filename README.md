# Learning Center Management Platform

Custom platform for a Tashkent-area IT/English learning center: public
website, CRM, groups & scheduling, payments, teacher/student panels, chat,
attendance, Telegram notifications, and role-based access control.

See [docs/data-model.md](docs/data-model.md) for the confirmed data model and
module plan, built from the client's Technical Task (TZ).

## Repository layout

```
apps/
  backend/          NestJS modular monolith (REST + WebSocket API)
  web/              React web app (planned)
  mobile-android/   Native Android app (planned)
  mobile-ios/       Native iOS app (planned)
docs/
  data-model.md     Confirmed entities, modules, and decisions
nginx/              Reverse proxy config + TLS setup steps
docker-compose.yml  Full single-server stack (TT §2.5)
```

## Backend — local development

Requires Node.js 22+, PostgreSQL 16, Redis 7 (installed directly in this
sandbox; production uses Docker Compose per the TT's recommended stack).

```bash
cd apps/backend
cp .env.example .env   # adjust as needed
npm install
npm run start:dev
```

On first boot with an empty database, the app seeds the permission catalog,
the default role→permission grant matrix (from TT §4.1, with the client's
confirmed change that Administrative Staff may record payments), and — if
`BOOTSTRAP_ADMIN_EMAIL`/`BOOTSTRAP_ADMIN_PASSWORD` are set — an initial Full
Administrator account.

`GET /health` is the only public route besides `/auth/*`; every other
endpoint requires a JWT and passes through the configurable RBAC guard.

**Note:** `TypeOrmModule` uses `synchronize: true` outside of `production`
for fast local iteration. In production it's `false` — see Migrations below.

**Housekeeping note:** verifying the migration generated two throwaway
databases in this sandbox's local Postgres — `learning_center_migration_gen`
and `learning_center_migration_gen2` (used to confirm the migration builds
the schema correctly from empty, once via the dev path and once via the
exact compiled command production runs). They hold no real data and aren't
referenced anywhere; drop them whenever convenient.

### Migrations

Production doesn't use `synchronize`. `src/migrations/` holds the schema as
versioned migrations instead, starting from `Init`, generated from and
verified against a real empty Postgres database (every table/enum/FK applied
with zero errors, and the resulting schema diffed identical to a
`synchronize`-built one).

```bash
npm run migration:generate -- src/migrations/SomeDescriptiveName  # after changing entities
npm run migration:run                                             # dev, via ts-node
npm run migration:run:prod                                        # prod, via compiled dist/ — see data-source.ts
```

The production Docker image has no `ts-node` (a devDependency); its
entrypoint runs `migration:run:prod` against the compiled
`dist/data-source.js` before starting the server — verified working against
a real empty database, matching the exact command the container runs.

### Object storage

Production uses real MinIO (per the TT's recommended stack). Real MinIO
server binaries aren't freely downloadable in this sandbox (GitHub releases
are source-only; `dl.min.io` returns 410 Gone), so local development here
uses [`s3rver`](https://github.com/jamhall/s3rver) (a devDependency, Node-
based S3-compatible mock) instead — the application code is written against
the standard MinIO/S3 SDK and needs no changes to run against real MinIO.
To run it locally:

```bash
AWS_ACCESS_KEY_ID=S3RVER AWS_SECRET_ACCESS_KEY=S3RVER \
  node -e "new (require('s3rver'))({port: 9000, directory: '/tmp/s3rver-data'}).run()"
```

Then set `MINIO_ACCESS_KEY=S3RVER` / `MINIO_SECRET_KEY=S3RVER` in `.env`
(s3rver hardcodes these, ignoring the env vars above for its own internal
credential check — they're only read by the AWS SDK machinery s3rver is
built on). Against real MinIO, use real generated credentials instead.

## Deployment (Docker Compose)

Matches the TT's recommended stack (§2.5): Nginx + Let's Encrypt in front,
Postgres, Redis, MinIO, and the backend, all on the Client's own Ubuntu
server.

```bash
cp .env.example .env   # fill in real secrets — see the file's own comments
docker compose up -d --build
```

The backend's `docker-entrypoint.sh` runs pending migrations against the
compiled app before starting the server, every time the container starts.

First-time TLS setup has a chicken-and-egg step (Nginx wants a cert that
doesn't exist yet) — see [nginx/README.md](nginx/README.md) for the exact
sequence.

**Sandbox note:** this environment's own container runtime blocks nested
containers outright (`runc` fails on `pivot_root`, even with
`--privileged`) — a hard host-level restriction, not something fixable from
inside the sandbox. So while `docker`, `docker compose`, and the Compose
file itself were all installed and verified here (`docker compose config`
resolves the full stack — services, env var substitution, healthchecks,
volumes — with no errors), an actual `docker compose up` could not be run
end-to-end in this sandbox. It should be run for real on the target Ubuntu
server before considering deployment finished. The two pieces that are
already verified independently, for real, outside Docker: the Postgres
migrations (against genuine empty databases, both the dev ts-node path and
the exact compiled-JS command the container's entrypoint runs) and every
application module (against real Postgres/Redis, and MinIO via a
verified-equivalent SDK-compatible mock — see Object storage above).
