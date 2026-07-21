# Checklist release Teranga Business Hub

Cette checklist sert avant une mise en production, une release importante ou une activation de paiements reels. Elle complete `DEPLOYMENT.md`, `LOCAL_TESTING.md` et `GUIDE_OPERATEUR.md`.

## 1. Etat du code

- [ ] Verifier la branche courante.
- [ ] Verifier les fichiers modifies avec `git status`.
- [ ] Relire les changements sensibles : paiement, auth PIN, inscription adhesion, admin, migrations de schema, variables d'environnement.
- [ ] Confirmer qu'aucun secret reel n'est versionne.
- [ ] Confirmer que les fichiers `.env` locaux ne sont pas ajoutes au depot.

## 2. Tests locaux automatises

Depuis la racine du projet :

```powershell
.\scripts\local-test.ps1
```

La release peut continuer uniquement si :

- [ ] Les tests backend Laravel passent.
- [ ] Le lint du frontend membre passe.
- [ ] Le build du frontend membre passe.
- [ ] Le lint du frontend admin passe.
- [ ] Le build du frontend admin passe.

## 3. Tests E2E membre

Depuis `frontend` :

```powershell
npm run test:e2e
```

Verifier :

- [ ] Inscription membre.
- [ ] Connexion membre.
- [ ] Paiement d'adhesion simule.
- [ ] Dashboard membre.
- [ ] Cotisations.
- [ ] Carte membre.
- [ ] Parcours desktop Chrome.
- [ ] Parcours mobile Chrome.

## 4. Tests E2E admin

Depuis `frontend-admin` :

```powershell
npm run test:e2e
```

Verifier :

- [ ] Login admin.
- [ ] Liste membres actifs/bloques.
- [ ] Blocage membre.
- [ ] Deblocage membre.
- [ ] Inscriptions adhesion non finalisees.
- [ ] Relance paiement.
- [ ] Export CSV.
- [ ] Parcours desktop Chrome.
- [ ] Parcours mobile Chrome.

## 5. Backend Railway

Avant ouverture publique, verifier les variables critiques :

- [ ] `APP_ENV=production`
- [ ] `APP_DEBUG=false`
- [ ] `APP_URL` en HTTPS.
- [ ] `FRONTEND_URL` en HTTPS et sur le domaine Vercel final.
- [ ] `ADMIN_FRONTEND_URL` en HTTPS et sur le domaine Vercel final.
- [ ] `DB_CONNECTION=pgsql`
- [ ] `SESSION_DRIVER=database`
- [ ] `CACHE_STORE=database`
- [ ] `QUEUE_CONNECTION=database`
- [ ] `API_TOKEN_TTL_MINUTES` configure avec une duree limitee.
- [ ] `ADMIN_PORTAL_REGISTRATION_SECRET` renseigne avec une valeur longue.
- [ ] Le service web Railway n'utilise pas `php artisan serve`.
- [ ] `backend/nixpacks.toml` est pris en compte.

Commandes a executer sur Railway si necessaire :

```bash
php artisan migrate --force
php artisan app:diagnose-readiness --production
php artisan schedule:list
```

La release peut continuer uniquement si :

- [ ] Les migrations passent.
- [ ] La base de production neuve contient le schema attendu.
- [ ] Le diagnostic backend retourne `0 erreur(s)`.
- [ ] Les avertissements restants sont compris et acceptes.
- [ ] Le scheduler Railway est actif.
- [ ] Les logs scheduler montrent les commandes planifiees.

## 6. Frontend Vercel

Frontend membre :

- [ ] Le projet Vercel pointe vers le dossier `frontend`.
- [ ] `NEXT_PUBLIC_API_BASE_URL` pointe vers le backend Railway de production.
- [ ] Le domaine final est celui renseigne dans `FRONTEND_URL`.
- [ ] Le build Vercel passe.

Frontend admin :

- [ ] Le projet Vercel pointe vers le dossier `frontend-admin`.
- [ ] `NEXT_PUBLIC_API_BASE_URL` pointe vers le backend Railway de production.
- [ ] Le domaine final est celui renseigne dans `ADMIN_FRONTEND_URL`.
- [ ] Le build Vercel passe.

## 7. Test login admin production

- [ ] Ouvrir le frontend admin de production.
- [ ] Se connecter avec un admin actif.
- [ ] Verifier l'acces au dashboard.
- [ ] Verifier l'acces a `Membres`.
- [ ] Verifier l'acces a `Finance`.
- [ ] Verifier l'acces a `Audit`.
- [ ] Verifier l'acces a `Parametres`.
- [ ] Se deconnecter puis se reconnecter.

## 8. Test inscription membre sans validation admin

- [ ] Ouvrir `/register` sur le frontend membre.
- [ ] Completer l'inscription avec un telephone unique, une CNI de 10 a 15 chiffres et un email optionnel.
- [ ] Verifier que le paiement d'adhesion est demande avant creation du membre actif.
- [ ] Annuler une tentative et verifier que l'inscription reste non finalisee.
- [ ] Verifier dans l'admin que l'inscription apparait parmi les inscriptions adhesion non finalisees.
- [ ] Relancer le paiement d'adhesion depuis le parcours membre.
- [ ] Finaliser le paiement et verifier que le membre passe directement `actif`.
- [ ] Verifier que le matricule est affiche a l'utilisateur.
- [ ] Creer le PIN a la premiere connexion, puis se connecter avec matricule + PIN et telephone + PIN.

## 9. Test DexPay sandbox/live

Variables indispensables :

- [ ] `DEXPAY_ENABLED=true`
- [ ] `DEXPAY_MODE=live`
- [ ] `DEXPAY_AUTO_CONFIRM_DEV=false`
- [ ] `DEXPAY_PUBLIC_KEY` renseigne.
- [ ] `DEXPAY_SECRET_KEY` renseigne.
- [ ] `DEXPAY_WEBHOOK_SECRET` renseigne.
- [ ] `DEXPAY_WEBHOOK_URL` pointe vers `/api/webhook/dexpay` en HTTPS.
- [ ] `DEXPAY_SUCCESS_URL` pointe vers `/paiement/retour` en HTTPS.
- [ ] `DEXPAY_FAILURE_URL` pointe vers `/paiement/annule` en HTTPS.

Parcours a tester :

- [ ] Ouvrir `/register`.
- [ ] Completer le formulaire d'inscription adhesion.
- [ ] Choisir Wave ou Orange Money puis initier le paiement d'adhesion.
- [ ] Verifier la redirection vers l'URL de paiement DexPay.
- [ ] Annuler une tentative et verifier le retour vers `/paiement/annule`.
- [ ] Relancer un paiement.
- [ ] Finaliser le paiement.
- [ ] Verifier le retour vers `/paiement/retour?reference=...`.
- [ ] Verifier que le webhook DexPay signe arrive dans les logs Railway.
- [ ] Verifier que l'inscription adhesion passe `paid`.
- [ ] Verifier que le membre passe `actif`.
- [ ] Verifier que le matricule, le token de carte et les cotisations annuelles sont crees.
- [ ] Verifier que le paiement apparait dans `Finance` avec prestataire `DexPay`, canal choisi et statut `succes`.
- [ ] Tester un paiement echoue ou expire si DexPay le permet.

## 10. Controle admin final

- [ ] `Membres` affiche les statuts attendus.
- [ ] Aucun filtre ou action admin ne depend de `en_attente`, `attente_adhesion` ou `rejete`.
- [ ] Les inscriptions adhesion non finalisees sont visibles pour suivi.
- [ ] `Finance` affiche les paiements recents.
- [ ] `Audit` affiche les actions recentes.
- [ ] Le filtre de l'audit fonctionne.
- [ ] L'export CSV des paiements fonctionne.
- [ ] Les parametres metier affichent les bonnes valeurs.
- [ ] Les confirmations sensibles demandent bien le texte attendu.

## 11. Rollback minimal

Avant la release :

- [ ] Identifier la derniere version stable backend.
- [ ] Identifier les derniers deploiements stables Vercel membre et admin.
- [ ] Confirmer l'acces aux dashboards Railway et Vercel.
- [ ] Confirmer qu'une restauration de base ou un backup recent existe si la release touche aux migrations de schema.
- [ ] Confirmer que le demarrage en base vide est volontaire et valide metier.

En cas de probleme critique :

- [ ] Suspendre l'ouverture publique.
- [ ] Desactiver temporairement les paiements reels si necessaire.
- [ ] Revenir au dernier deploiement stable.
- [ ] Verifier les logs Railway.
- [ ] Documenter l'incident et la correction.

## 13. Validation finale

- [ ] Tous les tests critiques sont verts.
- [ ] Le diagnostic production est vert.
- [ ] DexPay reel est verifie.
- [ ] Le login admin production est verifie.
- [ ] Les domaines frontend et admin sont les domaines finaux.
- [ ] Le scheduler Railway est actif.
- [ ] L'equipe sait ou consulter `GUIDE_OPERATEUR.md`.
- [ ] La release peut etre ouverte aux utilisateurs.
