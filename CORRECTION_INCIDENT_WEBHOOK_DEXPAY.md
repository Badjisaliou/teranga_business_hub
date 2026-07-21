# Correction de l'incident d'inscription DexPay

## Contexte

Le 14 juillet 2026, un paiement de test de 10 000 XOF a ete confirme par DexPay avec la reference `DEXPAY_D3BC1DAAC9AF6C7A`, mais le membre n'a pas ete cree.

Les trois livraisons du webhook `checkout.completed` ont recu une reponse HTTP 401 `Signature DexPay invalide.`. La demande d'adhesion d'origine (`id = 15`, `public_id = 0e1cfa8d-d249-4e44-b8e7-5033cad12490`) avait egalement disparu de `adhesion_applications`.

## Causes confirmees

1. Le backend supprimait une demande `payment_pending` lorsqu'une inscription etait recommencee avec le meme telephone ou la meme CNI.
2. Le secret utilise pour verifier la signature pouvait differer de la secret key DexPay utilisee pour signer les webhooks.
3. Le controleur attendait `data.reference` et `data.status`, alors que le webhook de production les envoie a la racine.
4. Une reference inconnue pouvait etre traitee silencieusement comme une transaction classique.

## Plan de correction

- [x] Ne plus supprimer une demande qui possede une reference de paiement.
- [x] Ne plus supprimer les demandes `payment_pending`.
- [x] Reprendre une demande `payment_pending` existante au lieu d'en creer une nouvelle.
- [x] Accepter les payloads DexPay avec les champs a la racine ou dans `data`.
- [x] Verifier la signature avec le secret webhook configure et, en compatibilite, la secret key DexPay.
- [x] Accepter le header configure ainsi que les noms de headers DexPay usuels.
- [x] Retourner une erreur explicite et journaliser une reference de webhook inconnue.
- [x] Ajouter des tests de non-regression.
- [x] Confirmer qu'un header de signature compatible est accepte en production.
- [x] Verifier la presence et la coherence des secrets Railway sans les exposer.
- [x] Deployer le backend corrige.
- [x] Envoyer un webhook de diagnostic signe en production (HTTP 409 attendu pour une reference fictive).
- [ ] Rejouer un webhook sandbox ou effectuer un nouveau paiement de test controle.
- [ ] Verifier la creation du membre, du paiement et des douze echeances.

## Configuration Railway attendue

```env
DEXPAY_ENABLED=true
DEXPAY_MODE=live
DEXPAY_AUTO_CONFIRM_DEV=false
DEXPAY_PUBLIC_KEY=pk_live_...
DEXPAY_SECRET_KEY=sk_live_...
DEXPAY_WEBHOOK_SECRET=...
DEXPAY_SIGNATURE_HEADER=X-Dexchange-Signature
DEXPAY_WEBHOOK_URL=https://web-production-a89f01.up.railway.app/api/webhook/dexpay
```

`DEXPAY_WEBHOOK_SECRET` doit contenir le secret indique par DexPay pour les webhooks. Si DexPay signe directement avec la secret key du compte, sa valeur doit correspondre a `DEXPAY_SECRET_KEY`.

Apres toute modification des variables Railway :

```bash
php artisan optimize:clear
php artisan config:cache
```

## Validation avant reouverture des paiements

1. Demarrer une nouvelle inscription de test.
2. Verifier la ligne `adhesion_applications` en statut `payment_pending`.
3. Recommencer l'inscription avec le meme telephone et verifier que la ligne n'est pas supprimee.
4. Terminer le paiement DexPay.
5. Verifier que le webhook retourne HTTP 200.
6. Verifier que la demande passe a `paid`.
7. Verifier la creation d'une ligne dans `users` et `paiements`.
8. Verifier les douze echeances de cotisation.
9. Rejouer le webhook et verifier l'absence de doublon.
10. Tester la connexion avec le matricule et le PIN choisis.

## Etat du deploiement du 14 juillet 2026

- Deploiement Railway `dc684998-8fd3-49e9-a0b0-348e098c5d39` : `SUCCESS`.
- Les variables DexPay requises sont presentes dans le service `web`.
- `DEXPAY_SECRET_KEY` et `DEXPAY_WEBHOOK_SECRET` sont differentes ; le backend verifie maintenant les deux secrets en compatibilite.
- Un webhook de diagnostic au format production, signe avec `DEXPAY_SECRET_KEY`, a atteint le controleur et retourne HTTP 409 pour la reference fictive `DEXPAY_DEPLOYMENT_PROBE_20260714`.
- Ce HTTP 409 confirme que la signature et le parsing du payload sont corriges. Il ne correspond a aucune transaction financiere.
- Un second paiement controle (`DEXPAY_EEFC9A523E46072C`, demande `18`) atteint la finalisation mais retourne HTTP 500. Une journalisation explicite des exceptions API a ete ajoutee pour identifier la cause SQL exacte sans exposer le detail au client.
- Cause du HTTP 500 identifiee : la colonne historique `users.password` etait encore `NOT NULL` dans PostgreSQL de production, tandis que les nouveaux membres utilisent uniquement `pin_hash`. La migration `2026_07_15_000001_make_user_password_nullable_for_pin_members.php` corrige le schema existant.
- Migration deployee avec succes. Le rejeu signe de `DEXPAY_EEFC9A523E46072C` a retourne HTTP 200 le 15 juillet 2026 a 00:38 UTC.
- Demande `18` passee a `paid`, membre `12` cree en statut `actif`, matricule `TBH2607156241`.
- La journalisation d'erreur finale ne conserve que la classe et le code d'exception, sans message SQL ni donnees personnelles.

## Regle d'exploitation

Un paiement confirme par DexPay ne doit jamais etre demande une seconde fois. Toute reference inconnue ou tout webhook en erreur doit etre traite comme un incident de rapprochement et faire l'objet d'une verification dans le dashboard DexPay.
