# Diagnostic de la base de donnees de production

Date de l'audit : 15 juillet 2026  
Moteur : PostgreSQL 18.4  
Base : `railway`  
Perimetre initial : schema `public`, lecture seule, puis corrections et controles autorises consignes dans ce document

## Synthese

- 16 tables actuellement (17 lors de l'inventaire initial).
- 32 migrations appliquees, aucune migration en attente.
- 3 utilisateurs : 1 administrateur actif et 2 membres actifs.
- Aucune relation orpheline detectee entre utilisateurs, adhesions, paiements, cotisations et notifications.
- Le schema metier actuel fonctionne, mais conserve plusieurs elements historiques.
- L'audit initial etait en lecture seule. Le 15 juillet 2026, apres confirmation explicite, les trois transactions de test en attente ont ete supprimees de maniere ciblee (voir le journal en fin de document).

## Priorites identifiees

### Priorite haute

Aucune anomalie de priorite haute ne reste ouverte.

La migration historique `2026_07_10_000006_activate_test_member_user`, qui ciblait directement l'utilisateur `id = 3`, a ete neutralisee dans le depot le 15 juillet 2026 : `up` et `down` sont maintenant sans effet. Le deploiement n'a pas modifie le compte existant en production.

Action terminee le 15 juillet 2026 : la migration `2026_07_15_000002_drop_legacy_phone_verification_schema` a retire la table et la colonne historiques. Le controle du schema de production confirme leur absence.

Action terminee le 15 juillet 2026 : la migration `2026_07_15_000003_restrict_user_statuses_to_final_states` limite desormais `users.statut` a `actif|bloque` et fixe son defaut a `actif`. Le controle PostgreSQL confirme la nouvelle contrainte et les trois comptes existants sont restes `actif`.

### Priorite moyenne

1. Huit demandes d'adhesion sont `expired` ; six possedent une reference de paiement et doivent etre conservees pour rapprochement/audit. Deux n'ont aucune reference et peuvent entrer dans une politique de retention.

Politique deployee et executee le 15 juillet 2026 : suppression quotidienne des sessions/caches expires, effacement du `pin_hash` des adhesions payees et suppression apres 30 jours uniquement des adhesions expirees sans reference de paiement. Les notifications, actions admin et toute adhesion avec reference de paiement sont conservees.

Premiere execution : 13 sessions et 42 entrees de cache supprimees, 1 `pin_hash` de dossier paye efface, aucune adhesion supprimee. Le controle final confirme 11 adhesions intactes, dont 9 avec reference de paiement, et aucun `pin_hash` sur un dossier `paid`.

Decisions terminees le 15 juillet 2026 :

- les membres conservent le PIN et les administrateurs leur mot de passe ; `password_reset_tokens` est gardee provisoirement pour un futur reset admin securise ;
- PayDunya a ete retire du code actif, des interfaces et des contraintes de production ;
- la migration `2026_07_15_000005_add_business_query_indexes` a ajoute 15 index correspondant aux requetes metier observees. Leur presence a ete confirmee directement dans PostgreSQL.

## Revue table par table

## 1. `users`

Volume : 3 lignes. Colonnes : 38.

| Groupe | Colonnes | Decision preliminaire |
|---|---|---|
| Identite | `id`, `matricule`, `civilite`, `nom`, `prenom`, `date_naissance`, `numero_cni` | Conserver |
| Contact/adresse | `email`, `telephone`, `adresse`, `pays_residence`, `region`, `departement`, `commune` | Conserver ; revoir le chevauchement entre `adresse` et l'adresse structuree |
| Authentification admin | `password`, `remember_token` | `password` a conserver pour les admins ; `remember_token` a confirmer avant retrait |
| Authentification membre | `pin_hash`, `pin_configured_at`, `first_login_completed_at`, `pin_failed_attempts`, `pin_locked_until` | Conserver |
| Mise en place/reinitialisation PIN | `pin_setup_token_hash`, `pin_setup_token_expires_at`, `pin_reset_token_hash`, `pin_reset_token_expires_at`, `pin_reset_token_created_at` | Conserver : code actif, meme si valeurs actuellement nulles |
| Jeton API | `api_token`, `api_token_created_at` | Conserver : utilise par les trois comptes |
| Carte et adhesion | `role`, `statut`, `date_adhesion`, `date_expiration`, `card_token`, `card_issued_at`, `cotisation_montant_mensuel` | Conserver ; contrainte et defaut de `statut` nettoyes le 15 juillet 2026 |
| Technique | `created_at`, `updated_at` | Conserver |

Usage reel agrege :

- `password` : 2 comptes sur 3 ; necessaire notamment pour les administrateurs.
- `adresse` : 1 compte sur 3 ; encore exposee dans le profil.
- `remember_token` : 0 compte.
- `pin_setup_token_hash` : 0 compte actuellement, mais mecanisme encore code.
- `pin_reset_token_hash` : 0 compte actuellement, mais mecanisme encore code.
- `cotisation_montant_mensuel` : 2 comptes.

Contrainte historique avant nettoyage :

```text
en_attente | attente_adhesion | actif | bloque | rejete
```

Contrainte actuelle en production :

```text
actif | bloque
```

## 2. `adhesion_applications`

Volume : 11 lignes. Colonnes : 26.

Colonnes : `id`, `public_id`, `civilite`, `prenom`, `nom`, `date_naissance`, `telephone`, `email`, `pays_residence`, `region`, `departement`, `commune`, `numero_cni`, `pin_hash`, `conditions_acceptees`, `statut`, `montant_adhesion`, `payment_reference`, `payment_method`, `payment_channel`, `failure_reason`, `paid_at`, `expires_at`, `user_id`, `created_at`, `updated_at`.

Decision : table centrale du nouveau parcours, a conserver.

Repartition :

- `paid` : 1, avec reference et utilisateur.
- `payment_pending` : 2, toutes avec reference.
- `expired` : 8, dont 6 avec reference et 2 sans reference.
- 9 demandes DexPay/Wave ; 2 demandes sans session de paiement.

Recommandation : definir une retention distincte :

- conserver durablement `paid` et toute ligne avec `payment_reference` ;
- archiver ou purger apres delai les brouillons/expirations sans reference ;
- chiffrer ou reduire la retention de `pin_hash` et des donnees CNI selon la politique juridique.

## 3. `paiements`

Volume : 1 ligne. Colonnes : 14.

Colonnes : `id`, `user_id`, `cotisation_id`, `type`, `montant`, `reference`, `methode_paiement`, `canal_paiement`, `statut`, `failure_reason`, `date_paiement`, `idempotency_key`, `created_at`, `updated_at`.

Decision : conserver. Le paiement present est une adhesion DexPay/Wave en succes.

Point a revoir : ajouter des index de consultation sur `user_id`, `cotisation_id`, `statut`, `date_paiement` selon les requetes admin.

## 4. `mobile_money_transactions`

Volume actuel : 0 ligne. Colonnes : 12.

Colonnes : `id`, `user_id`, `type`, `montant`, `reference`, `methode_paiement`, `canal_paiement`, `statut`, `failure_reason`, `idempotency_key`, `created_at`, `updated_at`.

Decision : conserver. Cette table porte les transactions temporaires avant transformation en paiement final.

Situation actuelle : les trois anciennes transactions `en_attente`, creees uniquement pour des tests, ont ete supprimees le 15 juillet 2026 avec l'accord explicite du responsable. La table est maintenant vide.

## 5. `cotisations`

Volume : 24 lignes. Colonnes : 8.

Colonnes : `id`, `user_id`, `mois`, `annee`, `montant_paye`, `statut`, `created_at`, `updated_at`.

Decision : conserver.

Etat : 23 `non_paye`, 1 `en_retard`, aucun montant paye. La contrainte unique `(user_id, mois, annee)` est correcte.

Index recommande : `user_id`, et eventuellement `(statut, annee, mois)` pour les diagnostics planifies.

## 6. `notifications`

Volume : 7 lignes. Colonnes : 8.

Colonnes : `id`, `user_id`, `message`, `type`, `statut`, `date_envoi`, `created_at`, `updated_at`.

Decision : conserver. Ajouter un index `(user_id, statut, date_envoi)` si le volume augmente.

## 7. `admin_actions`

Volume : 2 lignes. Colonnes : 8.

Colonnes : `id`, `admin_id`, `cible_user_id`, `action`, `description`, `date_action`, `created_at`, `updated_at`.

Decision : conserver comme journal d'audit.

La contrainte historique des valeurs `action` a ete retiree. Il faut definir une liste metier officielle dans une nouvelle migration ou conserver une validation applicative stricte.

## 8. `business_settings`

Volume : 0 ligne. Colonnes : 5.

Colonnes : `id`, `key`, `value`, `created_at`, `updated_at`.

Decision : conserver : service et interface de parametrage actifs, meme si aucun reglage n'est encore surcharge en base.

## 9. `phone_verification_codes` — retiree

Volume avant retrait : 0 ligne. Colonnes : 8.

Colonnes : `id`, `telephone`, `purpose`, `code_hash`, `expires_at`, `verified_at`, `created_at`, `updated_at`.

Decision executee : table supprimee de la production le 15 juillet 2026.

Le retrait corrige la derive qui existait entre l'historique PostgreSQL execute et le contenu actuel du depot.

## 10. `password_reset_tokens`

Volume : 0 ligne. Colonnes : `email`, `token`, `created_at`.

Decision preliminaire : candidat au retrait si aucun futur reset de mot de passe admin n'utilise le broker Laravel. Les endpoints historiques membre sont deja retires.

## 11. `sessions`

Volume actuel : 0 ligne apres purge des 13 sessions expirees. Colonnes : `id`, `user_id`, `ip_address`, `user_agent`, `payload`, `last_activity`.

Decision : conserver, car `SESSION_DRIVER=database`. La purge des sessions expirees est maintenant executee par `data:prune-expired`.

## 12. `cache`

Volume actuel : 0 ligne apres purge des 42 entrees expirees. Colonnes : `key`, `value`, `expiration`.

Decision : conserver, car `CACHE_STORE=database`.

## 13. `cache_locks`

Volume : 0 ligne. Colonnes : `key`, `owner`, `expiration`.

Decision : conserver avec le cache base de donnees.

## 14. `jobs`

Volume : 0 ligne. Colonnes : `id`, `queue`, `payload`, `attempts`, `reserved_at`, `available_at`, `created_at`.

Decision : conserver, car `QUEUE_CONNECTION=database`.

## 15. `job_batches`

Volume : 0 ligne. Colonnes : `id`, `name`, `total_jobs`, `pending_jobs`, `failed_jobs`, `failed_job_ids`, `options`, `cancelled_at`, `created_at`, `finished_at`.

Decision : conserver tant que les queues Laravel sont prevues.

## 16. `failed_jobs`

Volume : 0 ligne. Colonnes : `id`, `uuid`, `connection`, `queue`, `payload`, `exception`, `failed_at`.

Decision : conserver pour l'exploitation des queues.

## 17. `migrations`

Volume : 28 lignes. Colonnes : `id`, `migration`, `batch`.

Decision : conserver absolument.

Observation : deux migrations partagent le prefixe horaire `2026_07_15_000001`. Laravel les distingue par leur nom complet, mais les prochains fichiers doivent utiliser des timestamps uniques pour garantir un ordre lisible.

La migration historique d'activation du membre de test reste enregistree pour conserver la continuite de l'historique Laravel, mais son contenu est desormais inerte. Les comptes de test locaux doivent etre crees exclusivement par les seeders de developpement.

## Elements deja correctement retires

Les colonnes suivantes ne sont plus presentes dans `users` :

- `cni_recto`
- `cni_verso`
- `photo_profil`
- `kyc_statut`

La base ne contient aucune table PayDunya specifique et aucune transaction PayDunya. Les contraintes `paiements_methode_paiement_check` et `mobile_money_transactions_methode_paiement_check` n'autorisent plus que `wave`, `orange_money` et `dexpay`.

## Integrite et contraintes

- Aucun utilisateur orphelin dans les adhesions, paiements, cotisations ou notifications.
- References de paiement uniques.
- Telephone, CNI, matricule, email, API token et carte membre uniques lorsqu'ils sont renseignes.
- Une seule cotisation par utilisateur/mois/annee.
- Idempotence unique par utilisateur dans les paiements et transactions temporaires.

## Plan de nettoyage recommande

Toutes les phases identifiees dans ce diagnostic ont ete traitees. Les prochaines evolutions destructives devront toujours etre precedees d'une nouvelle sauvegarde et d'un test de restauration.

## Conclusion

La base est petite, coherente et sans relations orphelines. Les trois transactions temporaires de test ont ete retirees. Les autres restes de l'ancienne structure sont clairement identifies et peuvent etre nettoyes progressivement, en protegeant notamment l'authentification administrateur.

## Sauvegarde et test de restauration

Operation realisee le 15 juillet 2026 avec les outils PostgreSQL 18.4 officiels :

- format : archive native `pg_dump` custom, compression Zstandard niveau 9 ;
- options : sans proprietaires ni privileges specifiques a Railway ;
- fichier local : `tmp/backups/teranga-production-20260715-052433.dump` ;
- taille : 56 655 octets ;
- SHA-256 : `1875C88F44FF5C290C03C5745B0AEA1569629B6F4C47A5DF5DAADB09C2F06390` ;
- fichier exclu de Git par la regle `tmp/`.

La restauration a ete testee dans une instance PostgreSQL 18.4 locale isolee sur `127.0.0.1:55432`, ensuite arretee et supprimee. Verification apres restauration :

| Controle | Resultat restaure |
|---|---:|
| Tables | 16 |
| Migrations | 32 |
| Utilisateurs | 3 |
| Demandes d'adhesion | 11 |
| Paiements | 1 |
| Transactions temporaires | 0 |
| Cotisations | 24 |
| Notifications | 7 |
| Actions administratives | 2 |
| Sessions | 0 |
| Cache | 0 |

Le dump est valide, lisible par `pg_restore` et restaure l'ensemble des volumes metier attendus. Il contient des donnees personnelles de production et ne doit pas etre partage ni ajoute au depot Git.

## Validation du scheduler Railway

Le service Railway dedie `scheduler` a ete controle et corrige le 15 juillet 2026 :

- service actif et deploiement `SUCCESS` ;
- commande de demarrage confirmee dans le manifeste : `php artisan schedule:work` ;
- pre-deploiement : `php artisan migrate --force` ;
- deploiement valide : `3ed30d3e-aef3-4b0a-980a-794665664624` ;
- logs apres demarrage : `No scheduled commands are ready to run`, comportement normal entre deux echeances ;
- la suite de tests confirme que `data:prune-expired` figure dans le calendrier quotidien a `01:10`.

Un premier redeploiement avait temporairement demarre un serveur web au lieu du scheduler. Ce deploiement a ete remplace par le correctif ci-dessus ; le manifeste final confirme explicitement `schedule:work`.

## Journal du nettoyage des transactions de test

Inventaire extrait en lecture seule le 15 juillet 2026 :

| ID local | Utilisateur | Type | Montant | Reference DexPay | Canal | Creee le | Statut local |
|---:|---:|---|---:|---|---|---|---|
| 2 | 3 | adhesion | 10 000 XOF | `DEXPAY_D95EB22E306BD724` | Wave | 12 juin 2026 14:55 UTC | `en_attente` |
| 3 | 3 | cotisation | 20 000 XOF | `DEXPAY_AE04544657E1C808` | Wave | 10 juillet 2026 23:07 UTC | `en_attente` |
| 4 | 3 | cotisation | 20 000 XOF | `DEXPAY_C5EC5F259169A407` | Wave | 10 juillet 2026 23:32 UTC | `en_attente` |

Les trois lignes concernaient le meme utilisateur de test (`user_id = 3`). Aucune raison d'echec n'etait enregistree localement.

Decision du 15 juillet 2026 : ces donnees provenaient uniquement de tests ; aucun rapprochement DexPay n'etait requis. Les trois lignes ont ete supprimees dans une transaction SQL limitee simultanement a `user_id = 3`, au statut `en_attente` et aux trois references ci-dessus. Une verification independante apres suppression a confirme :

- references cibles restantes : `0` ;
- transactions `en_attente` restantes : `0` ;
- total de lignes dans `mobile_money_transactions` : `0`.

## Correction du faux echec DexPay avant actualisation

Incident confirme le 16 juillet 2026 avec la reference `DEXPAY_490291F05B1E90A6` :

- `10:59:48` : webhook `checkout.initiated`, statut fournisseur `initiated` ;
- `11:00:16` : webhook `checkout.completed`, statut fournisseur `completed` ;
- l'ancienne normalisation transformait tout statut non reussi en `failed`, y compris `initiated` ;
- le frontend ne relisait pas automatiquement le statut final arrive 28 secondes plus tard.

Corrections appliquees :

- statuts DexPay repartis entre `success`, `failed` et `pending` ;
- les evenements intermediaires ou inconnus ne provoquent plus un echec definitif ;
- un webhook `pending` repond HTTP 200 sans modifier la demande d'adhesion ni la transaction ;
- garde supplementaire dans `AdhesionApplicationService` pour conserver `payment_pending` ;
- interrogation automatique toutes les 3 secondes, pendant au maximum 90 secondes, sur les pages de retour et de confirmation ;
- arret automatique des interrogations apres un resultat terminal ;
- les coordonnees du membre sont exclusivement copiees depuis `adhesion_applications`. Les champs `customer` du webhook DexPay ne remplacent jamais le nom, le telephone ou l'email valides lors de l'inscription.

Validation locale :

- tests backend cibles : 20 reussis, 101 assertions ;
- suite backend complete : 81 reussis, 420 assertions, 1 test SQLite ignore ;
- ESLint des deux pages modifiees : reussi ;
- compilation Next.js de production : reussie.

## Solidification du paiement des cotisations

Corrections realisees le 16 juillet 2026 apres comparaison avec l'incident d'adhesion :

- reservation de la reference et creation de `mobile_money_transactions` avant l'appel distant a DexPay ;
- conservation de `checkout_url` et `expires_at` pour permettre la reprise d'une session existante ;
- ajout d'une expiration horaire des transactions abandonnees, conservees comme traces avec le statut `echoue` ;
- verrouillage du membre pendant la finalisation afin de serialiser les webhooks concurrents ;
- rejeu idempotent de `checkout.completed` sans double paiement ni double repartition ;
- ajout de `type=cotisation` dans les URL de retour DexPay ;
- reconnexion obligatoire et retour automatique sur le paiement lorsque la session membre a expire ;
- suppression du numero de telephone editable et trompeur : DexPay recoit le telephone valide du profil membre ;
- reprise avec la meme cle d'idempotence et la meme URL de checkout tant que la session est valide ;
- nouvelle tentative exigee apres un echec definitif ou une expiration.

Validation locale : 84 tests reussis, 430 assertions, 1 test SQLite ignore ; ESLint et compilation Next.js de production reussis.

## Alignement de l'adhesion sur la reprise DexPay

Le parcours d'adhesion a ensuite ete aligne sur le mecanisme robuste des cotisations :

- reservation de `payment_reference` dans `adhesion_applications` avant l'appel a DexPay ;
- passage atomique a `payment_pending` sous verrou de base de donnees ;
- conservation de `checkout_url` et `payment_expires_at` ;
- rejeu d'une initiation renvoyant la meme reference et la meme URL sans creer une deuxieme session ;
- refus de remplacer une reference ayant deja echoue, afin qu'un webhook tardif reste rapprochable ;
- fermeture de l'URL apres echec definitif, paiement confirme ou expiration ;
- conservation de la reference apres expiration pour l'audit et le traitement eventuel d'un webhook tardif ;
- compatibilite maintenue avec les anciennes demandes qui ne possedent pas encore les nouveaux champs.

Validation locale : 86 tests reussis, 442 assertions, 1 test SQLite ignore.
