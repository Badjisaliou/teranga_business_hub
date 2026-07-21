# Tests locaux

## Tout preparer et lancer

```powershell
.\scripts\local-dev.ps1
```

Ce script prepare les fichiers `.env`, lance les migrations, cree l'admin local, puis demarre:

- Backend: http://127.0.0.1:8000
- Frontend membre: http://localhost:3000
- Frontend admin: http://localhost:3001

Admin local:

- Email: `test@example.com`
- Mot de passe: `password`

En local, DexPay est simule avec `DEXPAY_ENABLED=false` et `DEXPAY_AUTO_CONFIRM_DEV=true`: les paiements de test passent directement en succes.
La verification automatique du telephone est supprimee. Le reset PIN se teste via un lien unique genere par l'administration.

## Preparation seule

```powershell
.\scripts\local-setup.ps1
```

Pour eviter l'installation des dependances si elles existent deja:

```powershell
.\scripts\local-setup.ps1 -SkipInstall
```

Si la base SQLite locale vient d'une ancienne version du projet, le script la sauvegarde automatiquement dans `.local\backups` et la reconstruit quand le schema est incompatible. Pour forcer une reconstruction propre:

```powershell
.\scripts\local-setup.ps1 -FreshDatabase
```

## Demarrer seulement les serveurs

```powershell
.\scripts\local-start.ps1
```

## Arreter les serveurs

```powershell
.\scripts\local-stop.ps1
```

## Lancer les verifications

```powershell
.\scripts\local-test.ps1
```

Ce script lance les tests backend, puis lint/build des deux frontends.

## Lancer les tests E2E membre

Depuis `frontend`:

```powershell
npm run test:e2e
```

Playwright demarre un backend Laravel dedie sur `http://127.0.0.1:8010` et un frontend membre dedie sur `http://localhost:3010`. Le backend E2E reconstruit une base dediee dans `frontend/.e2e/e2e.sqlite`, avec DexPay simule. Les parcours sont executes en desktop Chrome et en mobile Chrome.

## Lancer les tests E2E admin

Depuis `frontend-admin`:

```powershell
npm run test:e2e
```

Playwright demarre un backend Laravel dedie sur `http://127.0.0.1:8020` et un frontend admin dedie sur `http://localhost:3020`. Le backend E2E reconstruit une base dediee dans `frontend-admin/.e2e/admin-e2e.sqlite`, avec DexPay simule. Les parcours sont executes en desktop Chrome et en mobile Chrome.

## Diagnostiquer la configuration

```powershell
.\scripts\local-diagnose.ps1
```

Pour simuler les controles stricts avant production:

```powershell
.\scripts\local-diagnose.ps1 -Production
```
