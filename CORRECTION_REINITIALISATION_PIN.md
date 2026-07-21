# Correction du parcours de reinitialisation du PIN

## Objectif

Rendre le parcours de reinitialisation du PIN fiable de bout en bout, sans introduire de reinitialisation automatique non controlee. La verification de l'identite reste effectuee par un administrateur avant la generation du lien.

## Parcours cible

1. Le membre saisit son matricule ou son telephone sur la page de connexion.
2. Il choisit `PIN oublie`.
3. L'API retourne toujours une reponse neutre, que le membre existe ou non.
4. L'interface propose une demande d'assistance WhatsApp pre-remplie avec l'identifiant saisi.
5. Apres verification de l'identite, l'administrateur genere un lien unique depuis la fiche membre.
6. Le backend construit une URL absolue vers le portail membre, y compris lorsque la configuration Laravel est mise en cache.
7. L'administrateur copie et transmet le lien au membre.
8. Le membre choisit et confirme un PIN de six chiffres.
9. Le token devient inutilisable, le verrouillage PIN est leve et les anciennes sessions sont invalidees.
10. Si le compte est bloque, le PIN est modifie mais le compte reste bloque.

## Anomalies a corriger

- [x] Diagnostic du parcours existant.
- [x] Remplacer l'appel direct a `env('FRONTEND_URL')` dans le controleur.
- [x] Exiger une URL frontend publique valide pour generer le lien.
- [x] Ne plus retourner le matricule d'un membre existant dans `/api/pin/forgot`.
- [x] Rendre la demande d'assistance actionnable depuis la page de connexion.
- [x] Configurer le numero WhatsApp du support via `NEXT_PUBLIC_SUPPORT_WHATSAPP`.
- [x] Permettre la modification du PIN d'un compte bloque sans le debloquer.
- [x] Adapter le message final au statut du compte.
- [x] Ajouter une action de copie du lien dans l'administration.
- [x] Couvrir les URLs absolues, la confidentialite et les comptes bloques par des tests.
- [x] Executer les tests backend et les controles frontend.

## Criteres d'acceptation

- Le lien retourne par l'API commence par le domaine configure du portail membre.
- Le lien reste correct apres `php artisan config:cache`.
- Un identifiant existant et un identifiant inconnu produisent la meme forme de reponse publique.
- Un token expire ou deja utilise est refuse.
- Un lien ne peut servir qu'une fois.
- Le nouveau PIN permet la connexion d'un membre actif.
- La reinitialisation ne debloque jamais un compte bloque.
- Les anciennes sessions du membre sont invalidees.
- L'administrateur peut copier le lien sans selection manuelle.

## Verification

- Syntaxe PHP : valide sur les controleurs, le service, la configuration et les tests modifies.
- Tests Laravel `PinAuthenticationTest` : 7 tests passes, 59 assertions.
- TypeScript portail membre : valide.
- TypeScript portail admin : valide.
- Build Next.js portail membre : reussi, route `/reset-pin` generee.
- Build Next.js portail admin : reussi, route `/users/[id]` generee.
- Cache de configuration Laravel : `app.frontend_url` reste disponible apres `config:cache`.

## Deploiement production

Deploiement effectue le 15 juillet 2026 :

- Backend Railway : succes, migration executee (`Nothing to migrate` au dernier passage).
- Portail membre Vercel : `https://terangabusinesshub.com`.
- Portail admin Vercel : `https://teranga-business-hub-admin.vercel.app`.
- API Railway : `https://web-production-a89f01.up.railway.app`.
- Test public `/reset-pin` : HTTP 200.
- Test public `/api/pin/forgot` : HTTP 200, reponse neutre sans identifiant.
- CORS portail membre vers API : valide.

## Incident production du 15 juillet 2026

- Symptome : `POST /api/admin/pin-reset-link` retournait HTTP 500.
- Cause : contrainte PostgreSQL historique sur `admin_actions.action` refusant la valeur `pin_reset_link`.
- Correction : migration additive supprimant la contrainte historique et conservant une colonne `VARCHAR(50)` ; les valeurs nouvelles restent validees par l'application.
- Solidification : creation du token et journalisation regroupees dans une transaction atomique.
