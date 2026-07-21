# 6. Tirer le meilleur profit de Codex

## Le bon rôle de Codex

Utilisez Codex comme collègue de revue, enquêteur, générateur de tests et accélérateur de tâches répétitives. Gardez pour vous la responsabilité des exigences, des arbitrages, de la validation et des opérations irréversibles.

Le risque principal est l'illusion de compétence : un produit peut fonctionner sans que vous sachiez le réparer seul. La solution n'est pas d'utiliser moins l'IA, mais de l'utiliser avec une boucle d'apprentissage explicite.

## Avant de demander du code

Écrivez vous-même :

- le problème utilisateur ;
- les critères d'acceptation ;
- les contraintes de sécurité et de données ;
- ce qui est hors périmètre ;
- votre première hypothèse de solution.

Exemple :

> Analyse le flux de paiement actuel. Ne modifie rien. Cartographie les états, identifie les risques de doublon et cite les fichiers concernés. Compare ensuite ton analyse à mon hypothèse : [...].

## La boucle de travail recommandée

1. **Explorer** : demander une cartographie factuelle du code existant.
2. **Spécifier** : faire expliciter critères, cas limites et risques.
3. **Planifier** : obtenir un plan petit, testable et réversible.
4. **Implémenter** : une tranche verticale à la fois.
5. **Vérifier** : lancer tests, lint, build et scénario manuel.
6. **Relire** : demander les défauts et compromis, pas une approbation vague.
7. **Expliquer** : reformuler vous-même la solution sans regarder la réponse.
8. **Tracer** : commit, issue, ADR ou changelog.

## Prompts utiles

### Diagnostic

> Reproduis le problème sans modifier le code. Donne les preuves observées, trois hypothèses classées, puis les expériences minimales pour les départager. Ne propose un correctif qu'après identification de la cause racine.

### Revue de sécurité

> Fais une revue de menace de ce parcours. Identifie actifs, acteurs, frontières de confiance, abus possibles et contrôles existants. Classe les risques par impact et probabilité. Ne change rien.

### Revue de code

> Relis ce diff comme un reviewer exigeant. Recherche d'abord bugs, régressions, failles, concurrence, migrations dangereuses et tests manquants. Cite les lignes. Ignore les préférences purement esthétiques.

### Apprentissage

> Ne me donne pas la solution complète. Pose-moi un exercice progressif, laisse-moi proposer une réponse, puis critique mon raisonnement et donne un indice seulement si nécessaire.

### Architecture

> Compare trois options adaptées à cette taille de projet. Pour chacune : complexité, coût, risques, testabilité, réversibilité. Recommande la plus simple qui satisfait les contraintes.

### Tests

> À partir des invariants métier, génère une matrice de tests incluant succès, limites, autorisations, répétitions, concurrence et échecs du fournisseur. Distingue unitaires, intégration et E2E.

## Ce qu'il faut toujours vérifier vous-même

- Toute commande qui touche production, données ou secrets.
- Toute migration destructive.
- Toute règle financière ou juridique.
- Toute logique d'authentification et d'autorisation.
- Les versions et documentations actuelles des services externes.
- Le diff exact, les tests exécutés et les résultats.
- Le plan de rollback.

## Garder le contexte propre

- Un objectif clair par tâche Codex.
- Fournir les critères d'acceptation et le résultat attendu.
- Demander à Codex d'inspecter le dépôt plutôt que de coller des fragments incomplets.
- Démarrer une nouvelle tâche lorsqu'un sujet est indépendant.
- Enregistrer les décisions durables dans le dépôt : Codex n'est pas votre système documentaire.
- Ne jamais dépendre de l'historique de conversation pour reconstruire une release.

## Utiliser Codex pour progresser, pas seulement livrer

Après chaque changement important, imposez-vous ces questions :

1. Puis-je expliquer le flux de bout en bout ?
2. Puis-je le reconstruire sous une forme simplifiée sans Codex ?
3. Puis-je diagnostiquer trois pannes plausibles ?
4. Quels tests prouvent les invariants ?
5. Quel compromis ai-je accepté ?

Si vous ne pouvez pas répondre, demandez une session pédagogique à Codex puis refaites l'exercice sans assistance.

## Discipline recommandée pour un prochain projet

- Jour 1 : vision, exigences, modèle de données initial et risques.
- Première PR : squelette, CI et conventions avant les fonctionnalités.
- Chaque fonctionnalité : issue → branche → tests → code → revue → commit → PR.
- Chaque décision structurante : mini-ADR.
- Chaque release : checklist, sauvegarde, migration, validation et rollback.
- Chaque incident : chronologie, cause racine, correction et test de non-régression.

La meilleure utilisation de Codex est celle qui augmente simultanément la vitesse du projet, la qualité du dépôt et votre capacité personnelle à raisonner sans lui.
