# 1. Bilan factuel du projet Teranga Business Hub

## Vue d'ensemble

Le projet est une plateforme métier destinée à gérer l'adhésion et le suivi de membres entrepreneurs. Il ne s'agit plus d'un prototype isolé : le dépôt contient trois applications cohérentes et une documentation d'exploitation.

- Backend : Laravel 12, PHP 8.2+, API REST, base relationnelle, tâches planifiées.
- Frontend membre : Next.js 16, React 19, TypeScript, Tailwind CSS.
- Frontend administrateur : Next.js 16, React 19, TypeScript, Tailwind CSS.
- Production : backend et PostgreSQL sur Railway ; deux frontends sur Vercel.
- Paiements : DexPay comme prestataire, avec Wave et Orange Money comme canaux.

Au moment de l'audit, le dépôt contient environ 128 fichiers PHP, 71 composants/pages TSX, 35 migrations, 46 déclarations de routes API et 27 fichiers de test ou d'infrastructure E2E. Ces nombres donnent une idée de l'ampleur, pas une mesure de qualité.

## Ce qui a été réalisé

### Cadrage métier

- Refonte du parcours d'adhésion : inscription temporaire, paiement, puis création du membre actif.
- Simplification des statuts utilisateur vers `actif` et `bloque`.
- Remplacement du mot de passe membre par un PIN à six chiffres.
- Connexion par matricule ou numéro de téléphone.
- Email rendu optionnel.
- Formalisation du cycle de cotisation, des retards et du blocage.
- Décision explicite de démarrer la version de production avec une base vide.

### Backend et données

- Modèles pour membres, candidatures d'adhésion, paiements, transactions mobile money, cotisations, notifications, paramètres métier et audit admin.
- Services métier séparés pour l'adhésion, DexPay, PIN, paiements, cotisations, risque, rétention des données et administration.
- Migrations successives pour faire évoluer le schéma et supprimer l'ancien modèle métier.
- Index ajoutés pour certaines requêtes métier.
- Commande de diagnostic de préparation à la production.
- Tâches planifiées : expiration des adhésions, détection des retards, notifications et échéances.

### Authentification et sécurité

- Authentification membre par Bearer token avec durée de vie serveur.
- Authentification PIN avec hachage, limitation des tentatives et blocage.
- Première connexion dédiée à la création du PIN.
- Réinitialisation du PIN au moyen d'un lien unique généré après vérification par un administrateur.
- Contrôles de rôle administrateur et d'état du membre.
- Contrôle des origines de cookies et restriction CORS aux domaines attendus.
- Webhook de paiement signé, contrôle temporel et protection contre la répétition documentés.
- Confirmations renforcées pour les actions administratives sensibles.

### Paiement et adhésion

- Création de sessions de paiement DexPay et redirection vers le prestataire.
- Gestion des retours succès, échec et annulation.
- Traitement du webhook comme source de confirmation du paiement.
- Idempotence et suivi des références de transaction.
- Récupération d'une tentative de checkout interrompue.
- Création du membre, du matricule, des cotisations et de la carte après succès.
- Suivi admin des inscriptions non finalisées et des incidents de paiement.

### Expérience membre

- Site vitrine structuré : présentation, équipe, gouvernance, formules, FAQ, accompagnement, contact et pages légales.
- Inscription guidée et paiement intégré.
- Connexion, première connexion et reset PIN.
- Tableau de bord, profil, notifications et support.
- Consultation et paiement des cotisations.
- Carte membre avec QR code et page publique de vérification.
- États dédiés au compte bloqué et aux retours de paiement.
- Travail responsive et scénarios mobile.

### Portail administrateur

- Authentification et garde de rôle.
- Dashboard de pilotage.
- Liste et fiche détaillée des membres.
- Blocage et déblocage.
- Vue finance et paiements.
- Gestion des inscriptions non finalisées et relances.
- Export CSV.
- Paramètres métier.
- Journal d'audit.
- Dialogues de confirmation pour les opérations sensibles.

### Qualité, tests et exploitation

- Suite PHPUnit couvrant notamment authentification, PIN, adhésion, paiement DexPay, carte, cotisations, rôles, index et scheduler.
- Parcours Playwright membre et administrateur, desktop et mobile.
- Scripts PowerShell de préparation, démarrage, arrêt, diagnostic et tests locaux.
- Environnements de test séparés et bases SQLite dédiées aux E2E.
- Dockerfile, Nixpacks et configuration Railway.
- Checklist de release, guide opérateur, guide de test local et diagnostic production.
- Documentation d'incidents et plans de correction.
- Ensemble substantiel de projets de textes juridiques et de gouvernance.

## Ce qui reste objectivement inachevé ou à confirmer

- Le diagnostic strict de production est documenté comme non validé : il doit retourner zéro erreur sur Railway avec les vraies variables.
- Le scheduler Railway doit être confirmé actif par ses logs de production.
- Le parcours DexPay réel doit être revalidé à chaque release critique, indépendamment des tests simulés.
- Une sauvegarde et une procédure de restauration réellement testée doivent être prouvées.
- Le dépôt a un problème majeur de traçabilité : un seul commit initial et un très grand nombre de changements non commités.
- L'absence d'un README racine complet réduit la capacité d'un nouveau développeur à prendre le projet en main.
- Les cases cochées dans les documents constituent des déclarations ; seules une CI, des rapports de tests et une recette datée les rendent durablement vérifiables.
