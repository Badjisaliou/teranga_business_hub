# Backlog de solidification

Ce fichier sert de feuille de route pour corriger les incoherences relevees pendant l'audit du backend, du frontend membre et du frontend admin.

## P0 - Avant mise en production

- [x] Valider DexPay en reel : creation checkout session, redirection, retour, annulation et webhook signe avec un vrai compte sandbox/live.
- [x] Clarifier `frontend-admin/register` : decider si cet ecran cree un admin ou un membre, puis aligner l'interface et le backend.
- [x] Ajouter des confirmations admin pour rejeter, bloquer, debloquer, relancer paiement et modifier les parametres metier.
- [x] Faire remonter `error_code` depuis le backend vers les deux frontends.
- [x] Gerer proprement les cas session expiree, compte bloque, inscription rejetee, adhesion requise et role interdit.
- [x] Ajouter un mecanisme de rafraichissement de session/statut utilisateur apres validation admin, paiement, blocage ou rejet.
- [x] Verifier que le scheduler Laravel tourne en production sur Railway.
- [x] Tester Cloudinary en production : upload photo, affichage profil et generation de carte membre.

## P1 - Robustesse metier

- [x] Clarifier le KYC : photo de profil uniquement ou documents CNI recto/verso avec validation. Decision retenue : photo de profil uniquement pour le profil et la carte membre; pas de collecte CNI recto/verso a ce stade.
- [x] Decider si Wave/Orange Money restent comme canaux visibles pendant que DexPay devient le prestataire officiel.
- [x] Harmoniser la terminologie : utilisateur, membre, admin, adhesion, cotisation, bloque, rejete.
- [x] Revalider regulierement le statut utilisateur/admin aupres du backend au lieu de depend uniquement du `localStorage`.
- [x] Centraliser l'export CSV admin dans un helper partage avec la logique API/token.
- [x] Remplacer les ecrans blancs des guards par des loaders coherents.

## P2 - Securite et deploiement

- [x] Evaluer une migration des tokens vers cookies `httpOnly`, ou renforcer expiration et deconnexion automatique. Decision retenue a ce stade : option B, conservation des Bearer tokens avec expiration serveur, revalidation frontend et tests backend dedies.
- [x] Remplacer `php artisan serve` en production par une configuration plus robuste.
- [x] Durcir les variables d'environnement de production.
- [x] Verifier `APP_DEBUG=false`, `DEXPAY_ENABLED=true`, `DEXPAY_MODE=live`, URLs HTTPS et secrets configures.
- [x] Controler CORS avec uniquement les domaines Vercel finaux.
- [x] Ajouter un second niveau de confirmation pour creation admin, blocage membre et changement des seuils metier.

## P3 - Tests

- [x] Ajouter des tests backend pour webhook DexPay invalide, reference absente, role admin interdit, scheduler, erreurs 401/403 et creation admin portal.
- [x] Ajouter des tests e2e membre avec Playwright : inscription, login, paiement adhesion simule, dashboard, cotisation et carte membre.
- [x] Ajouter des tests e2e admin avec Playwright : login admin, validation membre, rejet, blocage/deblocage, relance paiement et export CSV.
- [x] Tester les pages critiques en responsive/mobile reel.

## P4 - Qualite produit

- [x] Ameliorer SEO et metadata : descriptions, Open Graph, favicon et logo coherents.
- [x] Finaliser les textes legaux : confidentialite, conditions d'utilisation, donnees personnelles et paiements.
- [x] Rendre l'audit trail admin plus visible, filtrable et exploitable.
- [x] Creer un guide operateur : valider membre, gerer paiement echoue, bloquer/debloquer, changer les seuils, exporter les paiements.
- [x] Creer une checklist release : tests, build, migrations, diagnostic backend, test DexPay et test login admin.
