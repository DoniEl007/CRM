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

**Note:** `TypeOrmModule` currently uses `synchronize: true` outside of
`production` for fast iteration. Before any production deployment this must
be replaced with proper TypeORM migrations.

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
