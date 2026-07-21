# Production Readiness

Derniere verification locale:

```bash
php artisan app:diagnose-readiness --production
```

Resultat actuel en environnement local: `11 erreur(s), 1 avertissement(s)`.

Ces erreurs ne sont pas des erreurs applicatives: elles indiquent que l'environnement courant n'est pas encore configure avec les variables de production Railway/Vercel/DexPay.

## Variables Railway Backend A Renseigner

```env
APP_ENV=production
APP_DEBUG=false
LOG_LEVEL=info

APP_URL=https://web-production-a89f01.up.railway.app
FRONTEND_URL=https://teranga-business-hub.vercel.app
ADMIN_FRONTEND_URL=https://teranga-business-hub-admin.vercel.app

DB_CONNECTION=pgsql
DB_HOST=<railway-postgres-host>
DB_PORT=5432
DB_DATABASE=<railway-postgres-database>
DB_USERNAME=<railway-postgres-user>
DB_PASSWORD=<railway-postgres-password>

ADMIN_PORTAL_REGISTRATION_SECRET=<secret-long-et-unique>

DEXPAY_ENABLED=true
DEXPAY_MODE=live
DEXPAY_AUTO_CONFIRM_DEV=false
DEXPAY_PUBLIC_KEY=<pk-live-dexpay>
DEXPAY_SECRET_KEY=<sk-live-dexpay>
DEXPAY_WEBHOOK_SECRET=<secret-webhook-dexpay>
DEXPAY_WEBHOOK_URL=https://web-production-a89f01.up.railway.app/api/webhook/dexpay
DEXPAY_SUCCESS_URL=https://teranga-business-hub.vercel.app/paiement/retour
DEXPAY_FAILURE_URL=https://teranga-business-hub.vercel.app/paiement/annule

MOBILE_MONEY_MODE=production
MOBILE_MONEY_AUTO_CONFIRM_DEV=false
```

## Variables Vercel

Frontend membre:

```env
NEXT_PUBLIC_API_BASE_URL=https://web-production-a89f01.up.railway.app
```

Frontend admin:

```env
NEXT_PUBLIC_API_BASE_URL=https://web-production-a89f01.up.railway.app
```

## Scheduler Railway

Creer un second service Railway sur le dossier `backend` avec la commande:

```bash
php artisan schedule:work
```

Puis verifier les logs du service scheduler.

## Validation Finale

Apres configuration Railway/Vercel:

```bash
php artisan migrate --force
php artisan app:diagnose-readiness --production
php artisan schedule:list
```

Le diagnostic production doit retourner `0 erreur(s)`.

L'avertissement scheduler peut etre accepte uniquement si le service Railway `schedule:work` est bien actif et verifie dans les logs.
