# Nginx / TLS setup

`conf.d/app.conf` assumes a certificate already exists, which is a
chicken-and-egg problem on a brand-new server. First-time setup:

1. Point the domain's DNS A record at the server before doing anything else
   — Let's Encrypt needs to reach it over HTTP.

2. Replace every `your-domain.example` in `conf.d/app.conf` with the real
   domain.

3. Comment out the `server { listen 443 ... }` block in `app.conf` (the
   certs it references don't exist yet) and start just Postgres/Redis/MinIO
   and the HTTP-only Nginx:

   ```bash
   docker compose up -d postgres redis minio backend nginx
   ```

4. Issue the certificate:

   ```bash
   docker compose run --rm certbot certonly --webroot \
     -w /var/www/certbot -d your-domain.example
   ```

5. Uncomment the `443` block back in, then reload:

   ```bash
   docker compose restart nginx
   ```

6. Start the renewal loop (already in `docker-compose.yml`):

   ```bash
   docker compose up -d certbot
   ```

Renewal after that is automatic — `certbot`'s entrypoint checks twice a day
and only renews when the certificate is actually close to expiry.
