# Deployment

## Architecture

- `backend` -> Railway
- `frontend` -> Vercel
- `frontend-admin` -> Vercel

## Backend on Railway

Service root: `backend`

Recommended Railway components:

- 1 web service for Laravel
- 1 PostgreSQL database

Environment variables to set on Railway:

```env
APP_NAME=Teranga Business Hub
APP_ENV=production
APP_DEBUG=false
APP_URL=https://your-backend-domain.up.railway.app
FRONTEND_URL=https://your-user-frontend.vercel.app
ADMIN_FRONTEND_URL=https://your-admin-frontend.vercel.app

DB_CONNECTION=pgsql
DB_HOST=...
DB_PORT=5432
DB_DATABASE=...
DB_USERNAME=...
DB_PASSWORD=...

SESSION_DRIVER=database
CACHE_STORE=database
QUEUE_CONNECTION=database

API_TOKEN_TTL_MINUTES=10080
MOBILE_MONEY_MODE=dev
MOBILE_MONEY_AUTO_CONFIRM_DEV=true
MOBILE_MONEY_WEBHOOK_SECRET=change-me
MOBILE_MONEY_SIGNATURE_HEADER=X-MobileMoney-Signature
MOBILE_MONEY_TIMESTAMP_HEADER=X-MobileMoney-Timestamp
MOBILE_MONEY_ENFORCE_TIMESTAMP=true
MOBILE_MONEY_MAX_SKEW_SECONDS=300
MOBILE_MONEY_REPLAY_TTL_SECONDS=600
MOBILE_MONEY_WEBHOOK_URL=https://your-backend-domain.up.railway.app/api/webhook/mobile-money

WAVE_BASE_URL=https://api.wave.com
WAVE_API_KEY=
ORANGE_MONEY_ENABLED=false
ORANGE_MONEY_BASE_URL=https://api.orange.com
ORANGE_MONEY_API_KEY=
ADMIN_PORTAL_REGISTRATION_SECRET=
NOTIFICATIONS_EMAIL_ENABLED=false
```

`Wave` est la methode active. `Orange Money` peut rester desactive (`ORANGE_MONEY_ENABLED=false`) jusqu'a son integration effective.

After the first deploy, run:

```bash
php artisan key:generate --show
php artisan migrate --force
```

Copy the generated app key into Railway as `APP_KEY`, then redeploy if needed.

## User frontend on Vercel

Project root: `frontend`

Environment variable:

```env
NEXT_PUBLIC_API_BASE_URL=https://your-backend-domain.up.railway.app
```

Framework preset: `Next.js`

## Admin frontend on Vercel

Project root: `frontend-admin`

Environment variable:

```env
NEXT_PUBLIC_API_BASE_URL=https://your-backend-domain.up.railway.app
```

Framework preset: `Next.js`

## Order

1. Deploy the Railway backend and PostgreSQL service.
2. Set `APP_KEY`, database variables, and frontend URLs on Railway.
3. Run database migrations on Railway.
4. Deploy `frontend` on Vercel with `NEXT_PUBLIC_API_BASE_URL`.
5. Deploy `frontend-admin` on Vercel with the same API base URL.
6. Update Railway `FRONTEND_URL` and `ADMIN_FRONTEND_URL` with the final Vercel domains.
7. Redeploy the backend so CORS uses the final domains.
