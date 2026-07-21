# Plan d'integration DexPay dans Teranga Business Hub

Ce fichier sert de brief autonome pour un autre clavardage/agent charge d'integrer DexPay dans le projet `teranga_business_hub`.

## 1. Contexte du projet

Le projet est compose de :

- `backend/` : application Laravel qui gere l'authentification, les membres, les cotisations, les paiements, les webhooks et l'administration.
- `frontend/` : espace membre Next.js.
- `frontend-admin/` : espace admin Next.js.

Aujourd'hui, le paiement est integre avec PayDunya. L'objectif est de remplacer PayDunya par DexPay, en gardant la logique metier existante :

- paiement d'adhesion pour activer un membre ;
- paiement de cotisation pour solder une ou plusieurs cotisations ;
- transaction en attente tant que le prestataire n'a pas confirme ;
- confirmation officielle par webhook ;
- stockage de l'historique dans `paiements`.

## 2. Documentation DexPay consultee

Pages a garder ouvertes pendant l'implementation :

- https://docs.dexpay.africa/introduction
- https://docs.dexpay.africa/use-cases
- https://docs.dexpay.africa/architecture
- https://docs.dexpay.africa/authentication
- https://docs.dexpay.africa/error-handling
- https://docs.dexpay.africa/sdks
- https://docs.dexpay.africa/checkout-sdk

Points DexPay importants :

- DexPay/DEXCHANGE PAY permet d'accepter plusieurs moyens de paiement mobile money via une seule integration.
- Le flux principal recommande est la Checkout Session.
- L'application cree une session via l'API DexPay.
- DexPay retourne une `payment_url`.
- Le frontend redirige l'utilisateur vers cette URL.
- Dans Teranga Business Hub, l'utilisateur doit voir les moyens de paiement concrets disponibles au Senegal, par exemple Wave, Orange Money, Free Money, Wizall, etc.
- DexPay reste le prestataire technique/agregateur, mais le choix utilisateur doit etre conserve comme canal de paiement distinct.
- DexPay envoie ensuite un webhook signe pour notifier le statut final.
- Les webhooks doivent etre verifies avec une signature HMAC-SHA256.
- Les paiements doivent etre testes en sandbox avant la production.
- Les cles de test utilisent le format `pk_test_xxx` et `sk_test_xxx`; les cles live utilisent `pk_live_xxx` et `sk_live_xxx`.
- Les cles doivent rester dans les variables d'environnement, jamais dans le code.

## 3. Contrat API DexPay a utiliser

### Creation d'une checkout session

Endpoint :

```http
POST https://api-sandbox.dexpay.africa/api/v1/checkout-sessions
POST https://api.dexpay.africa/api/v1/checkout-sessions
```

Headers attendus :

```http
x-api-key: pk_test_xxx
Content-Type: application/json
```

Payload de base :

```json
{
  "reference": "TBH_ORD_12345",
  "item_name": "Adhesion Teranga Business Hub",
  "amount": 10000,
  "currency": "XOF",
  "countryISO": "SN",
  "payment_method": "wave",
  "webhook_url": "https://backend.example.com/api/webhook/dexpay",
  "success_url": "https://frontend.example.com/paiement/retour",
  "failure_url": "https://frontend.example.com/paiement/annule",
  "customer": {
    "name": "Prenom Nom",
    "email": "membre@example.com",
    "phone": "771234567"
  }
}
```

Attention : verifier dans la documentation DexPay si `amount` est attendu en unite principale ou en plus petite unite. La page d'introduction montre `amount: 10000` pour une transaction en `XOF`. Pour Teranga Business Hub, les montants actuels sont deja stockes comme entiers FCFA, par exemple `10000` pour l'adhesion.

Attention aussi : verifier dans la documentation DexPay le nom exact du champ permettant de preselectionner un moyen de paiement. Dans ce fichier, `payment_method` sert de nom indicatif. Si DexPay ne permet pas de preselectionner le moyen dans l'API Checkout Session, l'application doit tout de meme afficher le choix avant redirection, puis laisser DexPay gerer le choix effectif sur sa page checkout.

Reponse attendue :

- recuperer une reference/session id si fournie ;
- recuperer surtout la `payment_url` ou equivalent ;
- stocker la reference locale dans `mobile_money_transactions.reference`.

### Distinction importante : agregateur vs moyen de paiement

Ne pas confondre :

- `methode_paiement` : prestataire technique utilise par l'application. Pour cette integration, la valeur doit etre `dexpay`.
- `canal_paiement` ou `payment_channel` : moyen choisi par l'utilisateur, par exemple `wave`, `orange_money`, `free_money`, `wizall`, `card`.

Exemple metier :

```json
{
  "methode_paiement": "dexpay",
  "canal_paiement": "wave"
}
```

Dans l'interface, afficher le moyen utilisateur :

- "Payer avec Wave"
- "Payer avec Orange Money"
- "Payer avec Free Money"
- "Payer avec carte bancaire" si DexPay l'active pour le compte marchand

Dans les logs, l'historique et l'administration, conserver les deux niveaux :

- prestataire : DexPay ;
- moyen : Wave, Orange Money, etc.

### Webhook attendu

La documentation presente un evenement du type :

```json
{
  "event": "checkout.completed",
  "data": {
    "reference": "TBH_ORD_12345",
    "amount": 10000,
    "status": "success"
  }
}
```

Le webhook doit :

- verifier la signature HMAC-SHA256 ;
- extraire `data.reference` ;
- normaliser le statut DexPay vers le vocabulaire interne :
  - `success` -> `success`;
  - tout statut d'echec, annulation ou expiration -> `failed`;
- appeler `PaiementService::traiterPaiement($reference, $status, $reason)`.

## 4. Phase 1 - Audit PayDunya existant

Fichiers principaux a consulter avant toute modification :

- `backend/app/Services/PayDunyaService.php`
- `backend/app/Services/PaiementService.php`
- `backend/app/Http/Controllers/WebhookController.php`
- `backend/app/Http/Controllers/PaiementController.php`
- `backend/config/services.php`
- `backend/routes/api.php`
- `backend/routes/console.php`
- `backend/tests/Feature/PayDunyaPaymentTest.php`
- `frontend/src/app/paiement/page.tsx`
- `frontend/src/app/cotisations/paiement/page.tsx`
- `frontend/src/app/paiements/historique/page.tsx`
- `frontend-admin/src/app/finance/page.tsx`

Constat actuel :

- `PayDunyaService` cree une facture PayDunya.
- `PaiementService` orchestre le paiement et accepte `methode_paiement = paydunya`.
- `WebhookController::payDunya()` recoit `/api/webhook/paydunya`.
- Le frontend envoie toujours `paydunya`.
- Plusieurs textes visibles mentionnent PayDunya.

## 5. Phase 2 - Configuration DexPay

Dans `backend/config/services.php`, ajouter un bloc `dexpay` :

```php
'dexpay' => [
    'enabled' => env('DEXPAY_ENABLED', false),
    'mode' => env('DEXPAY_MODE', 'sandbox'),
    'auto_confirm_dev' => env('DEXPAY_AUTO_CONFIRM_DEV', false),
    'public_key' => env('DEXPAY_PUBLIC_KEY', ''),
    'secret_key' => env('DEXPAY_SECRET_KEY', ''),
    'webhook_secret' => env('DEXPAY_WEBHOOK_SECRET', ''),
    'currency' => env('DEXPAY_CURRENCY', 'XOF'),
    'country_iso' => env('DEXPAY_COUNTRY_ISO', 'SN'),
    'webhook_url' => env('DEXPAY_WEBHOOK_URL', env('APP_URL').'/api/webhook/dexpay'),
    'success_url' => env('DEXPAY_SUCCESS_URL', env('FRONTEND_URL').'/paiement/retour'),
    'failure_url' => env('DEXPAY_FAILURE_URL', env('FRONTEND_URL').'/paiement/annule'),
],
```

Variables `.env` a prevoir :

```env
DEXPAY_ENABLED=false
DEXPAY_MODE=sandbox
DEXPAY_AUTO_CONFIRM_DEV=true
DEXPAY_PUBLIC_KEY=pk_test_xxx
DEXPAY_SECRET_KEY=sk_test_xxx
DEXPAY_WEBHOOK_SECRET=
DEXPAY_CURRENCY=XOF
DEXPAY_COUNTRY_ISO=SN
DEXPAY_WEBHOOK_URL=http://localhost:8000/api/webhook/dexpay
DEXPAY_SUCCESS_URL=http://localhost:3000/paiement/retour
DEXPAY_FAILURE_URL=http://localhost:3000/paiement/annule
```

En production :

```env
DEXPAY_ENABLED=true
DEXPAY_MODE=live
DEXPAY_AUTO_CONFIRM_DEV=false
DEXPAY_PUBLIC_KEY=pk_live_xxx
DEXPAY_SECRET_KEY=sk_live_xxx
DEXPAY_WEBHOOK_SECRET=secret_fourni_ou_configure
DEXPAY_WEBHOOK_URL=https://backend.example.com/api/webhook/dexpay
DEXPAY_SUCCESS_URL=https://frontend.example.com/paiement/retour
DEXPAY_FAILURE_URL=https://frontend.example.com/paiement/annule
```

## 6. Phase 3 - Creer `DexPayService`

Ajouter :

```text
backend/app/Services/DexPayService.php
```

Responsabilites du service :

- generer une reference locale unique, par exemple `DEXPAY_` + random bytes ;
- recevoir le canal choisi par l'utilisateur, par exemple `wave` ou `orange_money` ;
- transmettre ce canal a DexPay si l'API Checkout Session expose un champ de preselection ;
- sinon, conserver le canal localement et laisser DexPay afficher/gerer le choix effectif sur sa page checkout ;
- creer une checkout session DexPay ;
- retourner un tableau compatible avec `PaiementService` :

```php
[
    'status' => 'success',
    'reference' => $reference,
    'provider' => 'dexpay',
    'message' => 'Checkout DexPay cree',
    'checkout_url' => $paymentUrl,
    'provider_payload' => $data,
]
```

Methodes recommandees :

- `creerSession(User $user, int $montant, string $type, ?string $canalPaiement = null, array $metadata = []): array`
- `normaliserStatut(string $status, ?string $event = null): string`
- `verifierSignature(string $rawPayload, ?string $signature): bool`
- `checkoutUrl(string $reference): ?string`
- `baseUrl(): string`
- `headers(): array`
- `isDevFallback(): bool`
- `hasCredentials(): bool`
- `simulerSession(int $montant, string $type): array`

Important :

- En mode fallback local, retourner une URL de retour locale avec `?reference=...` et aussi `?token=...` si le frontend actuel attend `token`.
- Ne jamais utiliser `DEXPAY_SECRET_KEY` dans le frontend.
- Loguer les erreurs HTTP avec status et body, sans jamais loguer les cles API.
- Ne pas exposer les secrets DexPay pour afficher la liste des moyens de paiement. La liste peut etre une configuration frontend/backend controlee par l'application.

## 7. Phase 3 bis - Ajouter la notion de canal Mobile Money

Objectif produit :

- l'utilisateur choisit explicitement Wave, Orange Money ou un autre moyen disponible au Senegal ;
- l'application cree ensuite une session DexPay ;
- l'utilisateur est redirige vers DexPay ;
- DexPay l'envoie vers le parcours final du moyen choisi quand c'est possible :
  - ouverture ou deeplink vers l'application Wave ;
  - saisie de code/OTP ou instruction USSD pour Orange Money selon le parcours propose ;
  - autre parcours selon l'operateur.

Ne pas remplacer `methode_paiement = dexpay` par `wave` ou `orange_money`. Le bon modele est :

```text
methode_paiement = dexpay
canal_paiement = wave | orange_money | free_money | wizall | card | autre
```

### Base de donnees

Ajouter une migration pour conserver le canal choisi dans les deux tables :

```text
backend/database/migrations/YYYY_MM_DD_HHMMSS_add_payment_channel_to_payments.php
```

Colonnes recommandees :

```php
Schema::table('mobile_money_transactions', function (Blueprint $table) {
    $table->string('canal_paiement', 50)->nullable()->after('methode_paiement');
});

Schema::table('paiements', function (Blueprint $table) {
    $table->string('canal_paiement', 50)->nullable()->after('methode_paiement');
});
```

Mettre a jour les modeles :

- `backend/app/Models/MobileMoneyTransaction.php`
- `backend/app/Models/Paiement.php`

Ajouter `canal_paiement` dans `$fillable`.

### Valeurs autorisees

Commencer avec une liste simple et explicite :

```php
['wave', 'orange_money', 'free_money', 'wizall', 'card']
```

Adapter selon les moyens reellement actives dans le compte marchand DexPay. Ne pas afficher un moyen indisponible en production si DexPay ne l'a pas active.

### API backend

Dans `PaiementController::initier`, accepter un champ optionnel ou requis :

```php
'canal_paiement' => ['required', Rule::in(['wave', 'orange_money', 'free_money', 'wizall', 'card'])],
```

Si le projet doit rester flexible pendant les tests DexPay, rendre le champ temporairement optionnel :

```php
'canal_paiement' => ['nullable', Rule::in(['wave', 'orange_money', 'free_money', 'wizall', 'card'])],
```

Le transmettre a `PaiementService::initierPaiement()`, puis a `DexPayService::creerSession()`.

### Stockage

Lors de la creation de `MobileMoneyTransaction`, stocker :

```php
'methode_paiement' => 'dexpay',
'canal_paiement' => $canalPaiement,
```

Lors de la transformation en `Paiement`, recopier `canal_paiement`.

Lors de la repartition d'une cotisation, recopier aussi `canal_paiement` sur les paiements enfants si le schema le permet.

## 8. Phase 4 - Adapter `PaiementService`

Dans `backend/app/Services/PaiementService.php` :

- remplacer l'injection `PayDunyaService` par `DexPayService`;
- remplacer toutes les comparaisons `paydunya` par `dexpay`;
- ajouter un parametre `?string $canalPaiement = null` a `initierPaiement()`;
- valider/normaliser le canal si necessaire ;
- remplacer le match provider :

```php
$provider = match ($methodePaiement) {
    'dexpay' => $this->dexPayService->creerSession($user, $montant, $type, $canalPaiement, ['idempotency_key' => $idempotencyKey]),
    default => throw ValidationException::withMessages(['methode_paiement' => ['Methode de paiement non supportee.']]),
};
```

- remplacer `services.paydunya.auto_confirm_dev` par `services.dexpay.auto_confirm_dev`;
- adapter `defaultFailureReason()` :

```php
return $methodePaiement === 'dexpay'
    ? 'DexPay n a pas confirme le paiement. Il peut s agir d une annulation, d un solde insuffisant ou d une validation non finalisee.'
    : 'L operateur de paiement n a pas confirme la transaction.';
```

## 9. Phase 5 - Adapter les controleurs et routes

Dans `backend/app/Http/Controllers/PaiementController.php` :

- remplacer `in:paydunya` par `in:dexpay`;
- ajouter la validation `canal_paiement`;
- inclure `canal_paiement` dans les reponses JSON de paiement, statut, adhesion-state et historique ;
- remplacer les filtres `wave,orange_money,paydunya` par `wave,orange_money,dexpay`, ou ajouter `dexpay` si l'historique ancien PayDunya doit rester filtrable.

Dans `backend/app/Http/Controllers/WebhookController.php` :

- remplacer l'injection `PayDunyaService` par `DexPayService`;
- remplacer `payDunya()` par `dexPay()`;
- lire le payload brut via `$request->getContent()`;
- lire la signature depuis le header documente par DexPay, probablement `x-dexchange-signature` ou le header indique dans la page webhook/architecture ;
- verifier la signature avec `DexPayService::verifierSignature()`;
- extraire `data.reference`, `data.status`, `event`, `data.message` ou champ equivalent ;
- appeler `PaiementService::traiterPaiement()`.
- si le webhook DexPay renvoie le canal/moyen final utilise, le comparer au `canal_paiement` local et loguer une difference sans bloquer le paiement.

Dans `backend/routes/api.php` :

```php
Route::post('/webhook/dexpay', [WebhookController::class, 'dexPay'])
    ->middleware('throttle:webhook-mobile-money');
```

Option possible de compatibilite temporaire :

```php
Route::post('/webhook/paydunya', [WebhookController::class, 'payDunya'])
    ->middleware('throttle:webhook-mobile-money');
```

Garder l'ancienne route uniquement si des paiements PayDunya en attente peuvent encore revenir.

## 10. Phase 6 - Base de donnees

Le projet contient deja une migration qui transforme `methode_paiement` en `VARCHAR(50)` pour `paiements` et `mobile_money_transactions`.

Verifier que cette migration est bien appliquee :

```bash
php artisan migrate:status
```

Si une base neuve echoue a cause des enums initiaux, modifier les migrations initiales ou ajouter une migration explicite pour autoriser `dexpay`.

Important pour l'historique :

- Si aucune transaction PayDunya reelle n'existe, on peut remplacer `paydunya` par `dexpay`.
- Si des transactions PayDunya existent deja, garder les mappings d'affichage pour `paydunya` et ajouter `dexpay`.
- Ajouter `canal_paiement` pour afficher le moyen final choisi par l'utilisateur.
- Ne pas utiliser `methode_paiement` pour stocker `wave` ou `orange_money` dans le nouveau flux DexPay.

## 11. Phase 7 - Adapter le frontend membre

Fichiers principaux :

- `frontend/src/app/paiement/page.tsx`
- `frontend/src/app/cotisations/paiement/page.tsx`
- `frontend/src/app/paiement/retour/page.tsx`
- `frontend/src/app/paiement/annule/page.tsx`
- `frontend/src/app/paiements/historique/page.tsx`
- `frontend/src/app/cotisations/page.tsx`
- `frontend/src/app/page.tsx`
- `frontend/src/app/layout.tsx`
- `frontend/src/app/conditions-utilisation/page.tsx`
- `frontend/src/app/politique-confidentialite/page.tsx`

Modifications :

- envoyer `methode_paiement: "dexpay"` ;
- ajouter un choix utilisateur `canal_paiement` avant de lancer le paiement ;
- envoyer par exemple `{ methode_paiement: "dexpay", canal_paiement: "wave" }` ;
- remplacer les types TypeScript `"paydunya"` par `"dexpay"`, ou par union `"paydunya" | "dexpay"` si historique a conserver ;
- remplacer les textes visibles `PayDunya` par `DexPay`;
- afficher le canal choisi dans le recapitulatif, par exemple `Moyen : Wave via DexPay`;
- adapter le retour paiement pour lire `reference` et/ou `token`.

### UX de selection Mobile Money

Sur les pages d'adhesion et de cotisation, remplacer le champ lecture seule "PayDunya" par une selection claire :

- Wave
- Orange Money
- Free Money
- Wizall
- Carte bancaire, uniquement si activee par DexPay

Le bouton principal doit reprendre le choix :

- `Payer avec Wave`
- `Payer avec Orange Money`
- `Payer par carte`

Microcopie recommandee :

```text
Le paiement est securise par DexPay. Selon le moyen choisi, vous serez redirige vers l'application mobile money ou invite a valider avec un code.
```

Ne pas afficher DexPay comme seul choix de paiement cote utilisateur. DexPay doit etre mentionne comme prestataire de securisation/traitement, pas comme moyen final.

Pour la page retour, recommander une compatibilite :

```ts
const reference = searchParams.get("reference") ?? searchParams.get("token");
```

## 12. Phase 8 - Adapter le frontend admin

Fichiers principaux :

- `frontend-admin/src/app/finance/page.tsx`
- `frontend-admin/src/app/dashboard/page.tsx`
- `frontend-admin/src/app/users/[id]/page.tsx`
- `frontend-admin/e2e/admin-happy-path.spec.ts`
- `frontend-admin/e2e/global-setup.mjs`

Modifications :

- ajouter/remplacer `dexpay` dans les filtres ;
- ajouter un filtre ou une colonne `canal_paiement` si utile pour l'admin finance ;
- afficher `DexPay` dans `humanizePaymentMethod`;
- afficher le moyen final avec `humanizePaymentChannel`, par exemple `Wave`, `Orange Money`, `Carte bancaire`;
- adapter les tests E2E qui simulent le webhook PayDunya ;
- remplacer les variables e2e `PAYDUNYA_*` par `DEXPAY_*`.

## 13. Phase 9 - Diagnostic production

Dans `backend/routes/console.php`, remplacer les checks PayDunya par DexPay :

- `DexPay active en production`
- `DexPay mode live en production`
- `Auto-confirm DexPay desactive en production`
- `Cles DexPay presentes si actif`
- `URLs DexPay HTTPS en production`

Verifier :

- `DEXPAY_ENABLED=true` en production ;
- `DEXPAY_MODE=live` en production ;
- `DEXPAY_AUTO_CONFIRM_DEV=false` en production ;
- `DEXPAY_WEBHOOK_URL`, `DEXPAY_SUCCESS_URL`, `DEXPAY_FAILURE_URL` en HTTPS.

## 14. Phase 10 - Tests backend a ecrire

Renommer ou remplacer :

```text
backend/tests/Feature/PayDunyaPaymentTest.php
```

par :

```text
backend/tests/Feature/DexPayPaymentTest.php
```

Tests minimum :

1. `test_dexpay_payment_initialization_can_auto_confirm_in_dev`
2. `test_dexpay_completed_webhook_activates_adhesion`
3. `test_dexpay_enabled_initialization_creates_remote_checkout_session`
4. `test_dexpay_webhook_rejects_invalid_signature`
5. `test_dexpay_webhook_rejects_invalid_payload`
6. `test_dexpay_webhook_requires_reference`
7. `test_member_can_check_pending_dexpay_payment_status`
8. `test_member_can_view_latest_adhesion_payment_state`
9. `test_failed_dexpay_webhook_stores_failure_reason`
10. `test_member_cannot_check_another_members_payment_status`
11. `test_member_can_choose_wave_as_dexpay_channel`
12. `test_member_can_choose_orange_money_as_dexpay_channel`
13. `test_invalid_payment_channel_is_rejected`
14. `test_payment_channel_is_copied_from_transaction_to_payment`

Pour `Http::fake`, viser l'endpoint :

```text
api-sandbox.dexpay.africa/api/v1/checkout-sessions
```

Verifier que la requete contient :

- header `x-api-key`;
- `reference`;
- `amount`;
- `currency`;
- `countryISO`;
- le champ de canal/preselection DexPay si l'API le supporte ;
- `webhook_url`;
- `success_url`;
- `failure_url`.

## 15. Phase 11 - Tests E2E

Adapter les tests Playwright :

- `frontend/e2e/global-setup.mjs`
- `frontend/e2e/member-happy-path.spec.ts`
- `frontend-admin/e2e/global-setup.mjs`
- `frontend-admin/e2e/admin-happy-path.spec.ts`

Scenarios :

- adhesion avec DexPay simule ;
- selection de Wave puis paiement adhesion ;
- selection de Orange Money puis paiement cotisation ;
- verification que le libelle utilisateur affiche le moyen choisi et pas seulement DexPay ;
- redirection vers page retour ;
- webhook de confirmation ;
- compte membre active ;
- paiement cotisation ;
- affichage admin finance ;
- affichage historique membre.

## 16. Phase 12 - Documentation projet

Remplacer les references PayDunya dans :

- `DEPLOYMENT.md`
- `LOCAL_TESTING.md`
- `RELEASE_CHECKLIST.md`
- `GUIDE_OPERATEUR.md`
- `BACKLOG_SOLIDIFICATION.md`

Ajouter une section "Test DexPay sandbox" :

1. Configurer les cles sandbox.
2. Lancer une adhesion.
3. Verifier la creation d'une checkout session.
4. Verifier la redirection vers DexPay.
5. Simuler ou finaliser le paiement.
6. Verifier le webhook backend.
7. Verifier le statut membre.
8. Tester un paiement echoue/annule.

## 17. Ordre recommande d'implementation

1. Ajouter la config DexPay.
2. Ajouter `DexPayService` avec fallback local.
3. Ajouter la migration `canal_paiement`.
4. Adapter `PaiementService`.
5. Adapter `PaiementController`.
6. Adapter `WebhookController` et `api.php`.
7. Adapter les tests backend.
8. Lancer les tests backend.
9. Adapter le frontend membre avec choix Wave/Orange Money/etc.
10. Adapter le frontend admin.
11. Adapter les tests E2E.
12. Adapter le diagnostic production.
13. Adapter la documentation.
14. Tester en local avec fallback.
15. Tester en sandbox avec vraies cles DexPay.
16. Preparer la production.

## 18. Commandes de verification

Backend :

```bash
cd backend
php artisan test
php artisan app:diagnose-readiness
php artisan app:diagnose-readiness --production
```

Frontend membre :

```bash
cd frontend
npm run lint
npm run build
```

Frontend admin :

```bash
cd frontend-admin
npm run lint
npm run build
```

E2E si disponibles :

```bash
cd frontend
npm run test:e2e

cd ../frontend-admin
npm run test:e2e
```

## 19. Points de vigilance

- Ne jamais confirmer un paiement uniquement avec `success_url`.
- Le webhook signe est la source de verite.
- Ne jamais exposer `DEXPAY_SECRET_KEY` au frontend.
- Ne pas casser l'historique si des paiements PayDunya existent deja.
- Garder l'idempotence existante.
- Garder la protection anti double paiement d'adhesion.
- Logger les erreurs provider sans logger les secrets.
- Tester les echecs, pas seulement les succes.
- Verifier le nom exact du header de signature dans la documentation DexPay avant implementation finale.
- Verifier le format exact de la reponse `checkout-sessions` avant de figer le parsing de `payment_url`.
- Verifier le nom exact du champ DexPay pour preselectionner un moyen de paiement, si cette option existe.
- Ne pas afficher un moyen de paiement non active sur le compte marchand DexPay.
- Garder la distinction `methode_paiement = dexpay` et `canal_paiement = wave/orange_money/...`.

## 20. Definition de termine

L'integration est terminee quand :

- le membre peut initier un paiement d'adhesion avec `dexpay`;
- le membre peut choisir Wave, Orange Money ou un autre canal configure avant la redirection ;
- le membre est redirige vers l'URL DexPay;
- DexPay dirige ensuite le membre vers le parcours du canal choisi quand cette preselection est supportee ;
- le webhook DexPay confirme l'adhesion et active le compte;
- le membre actif peut payer une cotisation;
- le paiement est reparti dans les cotisations;
- l'historique membre affiche `DexPay` comme prestataire et le canal final, par exemple `Wave`;
- l'admin finance affiche `DexPay` comme prestataire et le canal final;
- les tests backend passent;
- les builds frontend et admin passent;
- le diagnostic production verifie DexPay;
- la documentation projet ne parle plus de PayDunya comme methode officielle.
