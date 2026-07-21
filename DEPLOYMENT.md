# Deployment

## Architecture

- `backend` -> Railway
- `frontend` -> Vercel
- `frontend-admin` -> Vercel

## Backend on Railway

Service root: `backend`

Recommended Railway components:

- 1 web service for Laravel
- 1 worker service for the Laravel scheduler
- 1 PostgreSQL database

### Web service Railway

Le service web Laravel doit etre servi par Nixpacks avec PHP-FPM + Caddy. Ne configurez pas `php artisan serve` comme commande de production.

Le fichier `backend/nixpacks.toml` force le document root PHP vers le dossier public Laravel:

```toml
[variables]
NIXPACKS_PHP_ROOT_DIR = "/app/public"
```

Dans Railway, laissez le start command du service web vide, sauf besoin operationnel explicite. Si une ancienne commande custom contient `php artisan serve --host=0.0.0.0 --port=$PORT`, supprimez-la pour permettre a Nixpacks de generer la commande PHP-FPM + Caddy.

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
MOBILE_MONEY_MODE=production
MOBILE_MONEY_AUTO_CONFIRM_DEV=false
MOBILE_MONEY_WEBHOOK_SECRET=change-me
MOBILE_MONEY_SIGNATURE_HEADER=X-MobileMoney-Signature
MOBILE_MONEY_TIMESTAMP_HEADER=X-MobileMoney-Timestamp
MOBILE_MONEY_ENFORCE_TIMESTAMP=true
MOBILE_MONEY_MAX_SKEW_SECONDS=300
MOBILE_MONEY_REPLAY_TTL_SECONDS=600
MOBILE_MONEY_WEBHOOK_URL=https://your-backend-domain.up.railway.app/api/webhook/mobile-money

DEXPAY_ENABLED=true
DEXPAY_MODE=live
DEXPAY_AUTO_CONFIRM_DEV=false
DEXPAY_PUBLIC_KEY=pk_live_xxx
DEXPAY_SECRET_KEY=sk_live_xxx
DEXPAY_WEBHOOK_SECRET=
DEXPAY_WEBHOOK_URL=https://your-backend-domain.up.railway.app/api/webhook/dexpay
DEXPAY_SUCCESS_URL=https://your-user-frontend.vercel.app/paiement/retour
DEXPAY_FAILURE_URL=https://your-user-frontend.vercel.app/paiement/annule
DEXPAY_CURRENCY=XOF
DEXPAY_COUNTRY_ISO=SN
ADHESION_APPLICATION_EXPIRATION_HOURS=24

ADMIN_PORTAL_REGISTRATION_SECRET=
NOTIFICATIONS_EMAIL_ENABLED=false
```

### Garde-fous production

Avant ouverture publique, ces valeurs doivent etre strictement verifiees sur Railway:

- `APP_ENV=production`
- `APP_DEBUG=false`
- `LOG_LEVEL=info` ou plus restrictif, jamais `debug`
- `DB_CONNECTION=pgsql` avec les variables PostgreSQL Railway
- Le service web ne doit pas utiliser `php artisan serve` en production; Nixpacks doit servir `public/` via PHP-FPM + Caddy
- `APP_URL`, `FRONTEND_URL`, `ADMIN_FRONTEND_URL` en HTTPS et sans domaine exemple `your-*`
- CORS limite implicitement aux deux URLs `FRONTEND_URL` et `ADMIN_FRONTEND_URL`
- `FRONTEND_URL` et `ADMIN_FRONTEND_URL` doivent etre les domaines Vercel finaux de production, sans slash final
- Ne pas utiliser de domaine preview Vercel, localhost, adresse IP locale ou wildcard `*` dans les variables CORS de production
- `API_TOKEN_TTL_MINUTES` superieur a `0` et inferieur ou egal a `10080`
- `ADMIN_PORTAL_REGISTRATION_SECRET` renseigne avec une valeur longue et non partagee
- `DEXPAY_ENABLED=true`, `DEXPAY_MODE=live`, `DEXPAY_AUTO_CONFIRM_DEV=false`
- `DEXPAY_WEBHOOK_SECRET` renseigne avec le secret de signature attendu
- `DEXPAY_WEBHOOK_URL`, `DEXPAY_SUCCESS_URL`, `DEXPAY_FAILURE_URL` en HTTPS
- `ADHESION_APPLICATION_EXPIRATION_HOURS` entre `1` et `168`

La commande de diagnostic applique ces controles stricts:

```bash
php artisan app:diagnose-readiness --production
```

Elle doit retourner `0 erreur(s)` avant de lancer des paiements reels. Les avertissements restants doivent etre justifies manuellement, notamment le service scheduler Railway.

`DexPay` est le prestataire de paiement officiel. Les paiements sont crees par redirection Checkout Session et confirmes par webhook signe sur `/api/webhook/dexpay`; le canal choisi reste stocke separement (`wave`, `orange_money`, etc.).
La recuperation du PIN est assistee par l'administration: un admin verifie l'identite du membre, genere un lien unique depuis la fiche membre, puis transmet ce lien manuellement au membre.

After the first deploy, run:

```bash
php artisan key:generate --show
php artisan migrate --force
php artisan app:diagnose-readiness --production
```

Copy the generated app key into Railway as `APP_KEY`, then redeploy if needed. For this release, production starts with an empty database: `php artisan migrate --force` creates the schema only; no existing members, payments or cotisations are imported. The diagnostic command must return `0 erreur(s)` before opening real DexPay payments.

### Scheduler Railway

The Laravel scheduler does not run from the web process. Create a second Railway service for the same `backend` root and set its start command to:

```bash
php artisan schedule:work
```

The scheduler currently runs:

- `cotisations:mark-overdue` daily at `00:10`
- `adhesion-applications:expire-stale` hourly
- `memberships:diagnose-payment-defaults --notify` daily at `00:20`
- `memberships:notify-expiration` daily at `08:00`

After deployment, verify the scheduler service logs on Railway and run:

```bash
php artisan schedule:list
```

The release is not complete until the scheduler service is active and its logs show the planned commands.

### Test DexPay sandbox/live

Before opening real payments, verify:

```env
DEXPAY_ENABLED=true
DEXPAY_MODE=live
DEXPAY_AUTO_CONFIRM_DEV=false
DEXPAY_PUBLIC_KEY=pk_live_xxx
DEXPAY_SECRET_KEY=sk_live_xxx
DEXPAY_WEBHOOK_SECRET=...
DEXPAY_WEBHOOK_URL=https://your-backend-domain.up.railway.app/api/webhook/dexpay
DEXPAY_SUCCESS_URL=https://your-user-frontend.vercel.app/paiement/retour
DEXPAY_FAILURE_URL=https://your-user-frontend.vercel.app/paiement/annule
MOBILE_MONEY_MODE=production
```

Manual test with a real DexPay sandbox/live account:

1. Open the member frontend `/register`.
2. Complete the adhesion form with a new phone number and a CNI of 10 to 15 digits.
3. Choose Wave or Orange Money and start the adhesion payment.
4. Confirm the API creates an `adhesion_application` with status `payment_pending` and redirects to the returned `payment_url`.
5. Cancel once and verify the user lands on `/paiement/annule`.
6. Start again, complete the payment, and verify the user lands on `/paiement/retour?reference=...`.
7. Verify Railway receives the signed webhook on `/api/webhook/dexpay`.
8. Verify the `adhesion_application` becomes `paid`.
9. Verify a member `actif` is created with matricule, payment record, annual cotisations, `card_token`, and no configured PIN yet.
10. On `/register/success` or `/paiement/retour`, verify the matricule is displayed.
11. Open `/login`, use the matricule or phone number, click first login, create a 6-digit PIN, then log in.
12. Verify `/dashboard`, `/cotisations`, and `/carte` are accessible.
13. In the admin dashboard, verify the paid member no longer appears in "Inscriptions adhesion non finalisees".
14. In the admin finance page, verify the payment appears with provider `DexPay`, the chosen channel, and status `succes`.

Also test one failed or expired payment from DexPay if available. The member frontend must show the failed reason and allow a new attempt before `ADHESION_APPLICATION_EXPIRATION_HOURS`.

## User frontend on Vercel

Project root: `frontend`

Environment variable:

```env
NEXT_PUBLIC_API_BASE_URL=https://your-backend-domain.up.railway.app
```

Framework preset: `Next.js`

Use the final production domain in Railway `FRONTEND_URL`, for example:

```env
FRONTEND_URL=https://teranga-business-hub.vercel.app
```

Do not put a Vercel preview deployment URL here.

## Admin frontend on Vercel

Project root: `frontend-admin`

Environment variable:

```env
NEXT_PUBLIC_API_BASE_URL=https://your-backend-domain.up.railway.app
```

Framework preset: `Next.js`

Use the final production domain in Railway `ADMIN_FRONTEND_URL`, for example:

```env
ADMIN_FRONTEND_URL=https://teranga-business-hub-admin.vercel.app
```

Do not put a Vercel preview deployment URL here.

## Order

1. Deploy the Railway backend and PostgreSQL service.
2. Set `APP_KEY`, database variables, and frontend URLs on Railway.
3. Run database migrations on Railway.
4. Deploy `frontend` on Vercel with `NEXT_PUBLIC_API_BASE_URL`.
5. Deploy `frontend-admin` on Vercel with the same API base URL.
6. Update Railway `FRONTEND_URL` and `ADMIN_FRONTEND_URL` with the final Vercel domains.
7. Redeploy the backend so CORS uses the final domains.
