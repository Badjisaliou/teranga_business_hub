# 3. Référentiel des compétences full-stack

## Fondations indispensables

- Algorithmique, structures de données, complexité et résolution de problèmes.
- Programmation structurée et orientée objet ; notions fonctionnelles.
- Gestion des erreurs, immutabilité, effets de bord, concurrence et asynchronisme.
- Git : branches, commits, merge/rebase, résolution de conflits, pull requests.
- Terminal Linux, processus, permissions, variables d'environnement et réseau de base.
- Lecture de documentation technique en anglais.

## Web et réseau

- HTTP/HTTPS : méthodes, codes, headers, cache, cookies et négociation de contenu.
- DNS, TLS, proxy inverse, CDN, CORS, CSP, CSRF et XSS.
- API REST : ressources, validation, pagination, versionnement, idempotence et erreurs.
- Webhooks : signature, rejeu, ordre, doublons, reprise et observabilité.
- Notions WebSocket/SSE et files de messages.

## Frontend

- HTML sémantique et accessibilité WCAG.
- CSS : cascade, layout, responsive, design system et états d'interaction.
- JavaScript moderne : scope, closures, promesses, event loop et modules.
- TypeScript : generics, narrowing, unions, types utilitaires et contrats d'API.
- React : rendu, état, hooks, composition, formulaires, erreurs et performance.
- Next.js : App Router, Server/Client Components, rendu, cache, metadata et déploiement.
- Tests unitaires, intégration, composants et E2E.
- UX : feedback, chargement, erreurs, accessibilité mobile et parcours critiques.

## Backend

- PHP moderne : types, exceptions, interfaces, traits, Composer et PSR.
- Laravel : container, middleware, validation, Eloquent, transactions, queues, scheduler et tests.
- Conception métier : invariants, cas d'usage, états, permissions et audit.
- Authentification, autorisation, sessions, tokens, rate limiting et gestion des secrets.
- Emails, fichiers, paiements, tâches asynchrones et intégrations tierces.
- Performance : profiling, cache, pagination, N+1 et traitement en lot.

## Données

- Modélisation relationnelle, normalisation et contraintes d'intégrité.
- SQL : jointures, agrégations, sous-requêtes, CTE et fenêtres.
- Transactions, ACID, isolation, verrous et concurrence.
- Index, `EXPLAIN`, migrations sûres, sauvegarde et restauration.
- PostgreSQL en production ; SQLite pour certains tests avec conscience des différences.
- Protection, minimisation et rétention des données personnelles.

## Qualité et architecture

- SOLID, séparation des responsabilités, couplage/cohésion et dette technique.
- Architecture modulaire, couches, ports/adaptateurs et événements, sans sur-ingénierie.
- Revue de code et refactoring progressif.
- Tests selon le risque : unitaires, intégration, contrats, E2E et non-régression.
- Analyse statique, formatage, lint, couverture utile et gestion des dépendances.
- Documentation : README, ADR, schémas, runbooks et changelog.

## Sécurité

- OWASP Top 10 et principes de secure-by-design.
- Modélisation des menaces et classification des données.
- Hachage des mots de passe/PIN, chiffrement, clés et rotation des secrets.
- Validation côté serveur, permissions par défaut minimales et défense en profondeur.
- Sécurité de la chaîne de dépendances et du pipeline CI/CD.
- Logs d'audit, détection, réponse à incident et notification appropriée.

## DevOps, cloud et exploitation

- Docker : images minimales, utilisateurs non-root, health checks et builds multi-stage.
- CI/CD : tests, artefacts, environnements, approbations, migrations et rollback.
- Cloud : calcul, réseau, stockage, base managée, IAM, secrets et coûts.
- Observabilité : logs structurés, métriques, traces, alertes et SLO.
- Sauvegardes testées, reprise après incident et continuité de service.
- Infrastructure as Code à mesure que le projet grandit.

## Compétences professionnelles

- Clarification d'une exigence ambiguë et découpage en petits livrables.
- Estimation avec incertitudes explicites.
- Communication avec utilisateurs, métiers, design et exploitation.
- Capacité à dire « je ne sais pas encore » puis à enquêter méthodiquement.
- Arbitrage délai/qualité/risque et sens des responsabilités.
- Mentorat, revue constructive et apprentissage continu.

## Critère réel de maîtrise

Pour chaque compétence, utilisez quatre niveaux :

1. **Reconnaître** : je comprends le vocabulaire.
2. **Appliquer avec aide** : je peux suivre un exemple ou Codex.
3. **Appliquer seul** : je peux construire et déboguer sans assistance.
4. **Expliquer et arbitrer** : je peux enseigner, comparer les options et gérer les incidents.

Votre objectif professionnel doit être le niveau 3 sur toute la chaîne principale, et le niveau 4 sur deux ou trois spécialités, par exemple backend métier, sécurité/paiement et architecture frontend.
