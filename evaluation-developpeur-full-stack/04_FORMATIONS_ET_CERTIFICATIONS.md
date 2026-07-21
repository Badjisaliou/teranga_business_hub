# 4. Formations et certifications recommandées

## Principe

Une certification ne remplace ni un portfolio démontrable ni la maîtrise. Pour votre profil, l'ordre rentable est : fondamentaux → pratique mesurée → certification ciblée. Évitez d'accumuler des badges couvrant des outils que vous n'utilisez pas.

## Priorité 1 — Git, GitHub et CI/CD

### Formation

- Git en profondeur : objets, index, branches, merge/rebase, bisect et reflog.
- Pull requests, revue de code et stratégie de branches.
- GitHub Actions : lint, PHPUnit, builds Next.js, Playwright et contrôles de sécurité.

### Certification éventuelle

**GitHub Foundations**, puis **GitHub Actions**. Foundations valide collaboration, Git et dépôts ; Actions valide l'automatisation des workflows. Dans votre cas, GitHub Actions apporte davantage de valeur après la remise en ordre de l'historique.

Source officielle : [GitHub Certifications](https://docs.github.com/en/get-started/showcase-your-expertise-with-github-certifications/about-github-certifications).

## Priorité 2 — Sécurité web

### Formation

- OWASP Top 10 et PortSwigger Web Security Academy.
- OAuth 2.0/OIDC, sessions, cookies, CSRF, XSS et CSP.
- Threat modeling, secrets, dépendances et sécurité des webhooks.
- Exercices pratiques appliqués à Teranga Business Hub.

### Certification

Ne commencez pas forcément par une certification sécurité coûteuse. Construisez d'abord un threat model et corrigez votre application. Ensuite, envisagez **GitHub Advanced Security** si vous utilisez réellement les outils GitHub associés. Une certification généraliste comme Security+ peut aider pour les RH, mais elle est moins directement reliée à votre travail quotidien qu'une pratique OWASP sérieuse.

## Priorité 3 — SQL et PostgreSQL

### Formation

- SQL intermédiaire/avancé.
- Transactions et concurrence.
- Indexation et lecture de `EXPLAIN ANALYZE`.
- Sauvegarde, restauration et migrations sans interruption.

Ici, privilégiez une formation avec travaux pratiques plutôt qu'une certification. Livrable attendu : rapport d'analyse de cinq requêtes réelles et exercice de restauration d'une sauvegarde.

## Priorité 4 — Cloud et exploitation

Choisissez **un seul cloud** pendant au moins six mois.

### Option AWS

**AWS Certified Developer – Associate** est cohérente pour un développeur : développement, test, déploiement, débogage et CI/CD d'applications AWS. AWS recommande au moins un an d'expérience pratique ; l'examen coûte actuellement 150 USD.

Source officielle : [AWS Certified Developer – Associate](https://aws.amazon.com/certification/certified-developer-associate/).

### Option Azure

N'investissez pas maintenant dans **AZ-204** : Microsoft annonce la fin de la certification Azure Developer Associate et de son examen le **31 juillet 2026**. Consultez le catalogue Microsoft au moment où vous serez prêt et choisissez sa remplaçante officielle, ou des Applied Skills directement utiles.

Source officielle : [Microsoft Azure Developer Associate](https://learn.microsoft.com/en-us/credentials/certifications/azure-developer/).

### Recommandation personnelle

Votre production actuelle est sur Railway/Vercel : apprenez d'abord Docker, Linux, PostgreSQL managé, DNS/TLS, observabilité et sauvegardes. Passez ensuite AWS Developer Associate si vous avez construit et exploité un petit projet AWS réel. Ne migrez pas Teranga uniquement pour obtenir un badge.

## Priorité 5 — Conteneurs et Kubernetes, plus tard

**CKAD** est une certification pratique et reconnue pour concevoir, construire et déployer des applications cloud-native sur Kubernetes. Elle est pertinente seulement après une vraie maîtrise de Docker et au moins un projet Kubernetes. L'examen est pratique, dure deux heures et coûte actuellement 445 USD ; ce n'est donc pas votre première priorité.

Source officielle : [Linux Foundation CKAD](https://training.linuxfoundation.org/certification/certified-kubernetes-application-developer-ckad/).

## Parcours conseillé

### Dans les 3 prochains mois

1. Git/GitHub et création d'une vraie CI.
2. SQL/PostgreSQL et transactions.
3. HTTP, sécurité web et OWASP.
4. Approfondissement PHP/Laravel et TypeScript/React.

### Entre 4 et 8 mois

1. GitHub Foundations si vous avez besoin d'une validation formelle.
2. GitHub Actions après avoir construit plusieurs pipelines.
3. Docker et exploitation Linux.
4. Observabilité et réponse à incident.

### Entre 9 et 18 mois

1. AWS Developer Associate, si vous avez réellement pratiqué AWS.
2. CKAD seulement si Kubernetes correspond aux emplois que vous ciblez.
3. Spécialisation sécurité ou architecture après consolidation full-stack.

## Formations techniques à rechercher

- Algorithmique et structures de données.
- Clean Code et refactoring, avec esprit critique.
- Domain-Driven Design tactique appliqué, sans sur-ingénierie.
- PHP moderne et Laravel avancé.
- TypeScript avancé, React et Next.js App Router.
- PostgreSQL performance et administration de base.
- Tests automatisés et test design.
- Docker, CI/CD, Linux et observabilité.
- Anglais technique écrit et oral.

## Règle de décision avant de payer

Achetez une certification seulement si au moins deux critères sont vrais : elle apparaît dans les offres d'emploi ciblées ; elle structure une compétence que vous pratiquez déjà ; l'employeur la finance ; elle comporte un examen pratique ; elle vous force à produire un projet vérifiable.
