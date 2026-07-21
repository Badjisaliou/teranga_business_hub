# 5. Plan de progression sur 12 mois

## Mois 1 — Reprendre le contrôle du dépôt

- Sauvegarder l'état actuel sur une branche clairement nommée.
- Découper et relire les changements avant de créer des commits cohérents.
- Ajouter un README racine avec architecture, installation et commandes.
- Créer des issues pour le reste du travail.
- Ajouter une règle : aucune fonctionnalité terminée sans commit et test associé.

**Preuve :** historique Git lisible et procédure d'installation réussie sur une machine propre.

## Mois 2 — CI et qualité automatique

- Pipeline GitHub Actions pour PHPUnit, lint et builds.
- E2E sur une stratégie adaptée au coût et à la durée.
- Analyse des dépendances et secrets.
- Protection de branche et pull request obligatoire.

**Preuve :** une PR ne peut pas être fusionnée si un contrôle critique échoue.

## Mois 3 — HTTP, auth et sécurité

- Étudier HTTP, TLS, CORS, cookies, tokens, CSRF et XSS.
- Produire un threat model de Teranga.
- Documenter le choix Bearer token contre cookie `httpOnly`.
- Tester les scénarios d'abus sur auth, PIN et webhooks.

**Preuve :** document de menace, tests de sécurité et décisions justifiées.

## Mois 4 — SQL et fiabilité des données

- Étudier transactions, isolation, locks et index.
- Analyser les requêtes principales avec PostgreSQL.
- Vérifier les contraintes métier au niveau base.
- Tester sauvegarde et restauration.

**Preuve :** rapport SQL et restauration chronométrée réussie.

## Mois 5 — Backend avancé

- Cartographier les cas d'usage et invariants.
- Réduire les contrôleurs/services trop chargés si les preuves le justifient.
- Tester les frontières transactionnelles et les erreurs tierces.
- Ajouter analyse statique PHP.

**Preuve :** architecture expliquée en dix minutes sans support de Codex.

## Mois 6 — Frontend avancé

- Approfondir TypeScript et les états d'interface.
- Audit accessibilité et clavier.
- Tests de composants ciblés.
- Analyse de performance et du rendu Next.js.

**Preuve :** audit Lighthouse/accessibilité documenté et corrections mesurées.

## Mois 7 — Production et observabilité

- Logs structurés et corrélation d'une requête au webhook.
- Métriques de paiement, erreurs et latence.
- Alertes actionnables et runbook d'incident.
- Test contrôlé d'un incident de paiement.

**Preuve :** retrouver la cause d'un scénario injecté à partir des outils de production.

## Mois 8 — Docker et Linux

- Construire une image reproductible et minimale.
- Comprendre réseau, volumes, signaux, permissions et health checks.
- Reproduire l'application en environnement conteneurisé local.

**Preuve :** démarrage complet documenté et diagnostic d'un conteneur défaillant.

## Mois 9 — Deuxième projet sans copier Teranga

Créer un produit plus petit avec une autre problématique : stock, réservation ou facturation. Écrire vous-même le modèle, les tests et l'architecture avant de demander une revue à Codex.

**Preuve :** dépôt public propre, CI verte, démo et note d'architecture.

## Mois 10 — Collaboration simulée

- Utiliser issues, milestones et PR.
- Faire relire le code par un humain.
- Répondre aux commentaires avec arguments et tests.
- Contribuer à un petit projet open source si possible.

**Preuve :** au moins trois PR relues et améliorées.

## Mois 11 — Préparation certification ciblée

Choisir GitHub Actions ou AWS Developer Associate selon votre pratique réelle. Faire un examen blanc, combler les lacunes, puis réserver seulement avec des résultats régulièrement supérieurs au seuil visé.

## Mois 12 — Portfolio et entretien

- Préparer deux études de cas : Teranga et le second projet.
- Présenter problème, architecture, compromis, incident et résultats.
- Faire des exercices d'algorithmes raisonnables et de conception système.
- Simuler des entretiens en français et en anglais.

## Rythme hebdomadaire recommandé

- 40 % construction sans IA.
- 20 % lecture et cours.
- 20 % débogage et tests.
- 10 % revue avec Codex ou un humain.
- 10 % rédaction et explication.

Chaque semaine, consignez : ce que vous avez construit, ce que vous pouvez désormais expliquer, l'erreur la plus instructive et la prochaine lacune à traiter.
