# Guide operateur Teranga Business Hub

Ce guide decrit les gestes courants a effectuer dans le portail admin Teranga Business Hub. Il est destine aux administrateurs qui gerent les membres, les paiements, les blocages, les parametres metier et les exports.

## Acceder au portail admin

1. Ouvrir le frontend admin.
2. Se connecter avec un compte admin actif.
3. Verifier que le tableau de bord s'affiche.
4. En cas de refus d'acces, verifier le statut du compte admin et le role associe.

## Valider une inscription membre

1. Aller dans `Membres`.
2. Filtrer sur le statut `En attente`.
3. Ouvrir la fiche du membre ou utiliser l'action directe depuis la liste.
4. Verifier les informations principales : nom, prenom, telephone, email si renseigne, photo de profil si disponible.
5. Cliquer sur `Valider`.
6. Confirmer l'action si une confirmation est demandee.

Effet attendu :
- Le membre passe a l'etape de paiement d'adhesion.
- Une action admin `Validation` est ajoutee dans l'audit.
- Le membre devra payer l'adhesion via DexPay avant d'acceder completement a son espace.

## Rejeter une inscription membre

1. Aller dans `Membres`.
2. Filtrer sur le statut `En attente`.
3. Identifier le membre concerne.
4. Cliquer sur `Rejeter`.
5. Confirmer l'action.

Effet attendu :
- Le compte passe au statut `Rejete`.
- Le membre ne poursuit plus le parcours d'inscription avec ce compte.
- Une action admin `Rejet` est ajoutee dans l'audit.

## Gerer un paiement DexPay en attente ou echoue

1. Aller dans `Finance`.
2. Consulter le bloc `Paiements a suivre`.
3. Identifier la reference du paiement.
4. Verifier :
   - le membre concerne ;
   - le montant ;
   - le type de paiement : adhesion ou cotisation ;
   - le statut : en attente ou echoue ;
   - la raison d'echec si disponible.
5. Si le membre doit reprendre le paiement, utiliser l'action `Relancer`.

Effet attendu :
- Le membre recoit une notification de relance.
- Une action admin `Relance paiement` est ajoutee dans l'audit.

Point important :
- DexPay est le prestataire officiel de paiement. Le membre choisit le canal concret, par exemple Wave ou Orange Money.
- Ne pas valider manuellement un paiement sans verification externe fiable.
- En cas de doute sur une reference, comparer le statut dans DexPay et dans le portail admin.

## Bloquer un membre

1. Aller dans `Membres`.
2. Rechercher le membre par nom, telephone, email ou matricule.
3. Verifier que le statut actuel permet le blocage.
4. Cliquer sur `Bloquer`.
5. Saisir la confirmation exacte demandee : `BLOQUER`.
6. Confirmer l'action.

Effet attendu :
- Le membre perd l'acces a l'espace membre actif.
- Une action admin `Blocage` est ajoutee dans l'audit.

Cas frequents :
- retard de paiement important ;
- situation administrative a verifier ;
- demande interne de suspension temporaire.

## Debloquer un membre

1. Aller dans `Membres`.
2. Filtrer sur le statut `Bloque`.
3. Ouvrir la fiche ou utiliser l'action depuis la liste.
4. Verifier la raison du blocage et la situation actuelle.
5. Cliquer sur `Debloquer`.
6. Confirmer l'action.

Effet attendu :
- Le membre reprend un parcours coherent selon son statut de paiement.
- Une action admin `Deblocage` est ajoutee dans l'audit.

## Changer les parametres metier

1. Aller dans `Parametres`.
2. Verifier les valeurs actuelles :
   - montant d'adhesion ;
   - montant mensuel de cotisation ;
   - seuil d'alerte ;
   - seuil de blocage manuel.
3. Modifier uniquement les champs necessaires.
4. Saisir la confirmation demandee.
5. Enregistrer.

Effet attendu :
- Les nouveaux seuils et montants sont appliques aux prochains calculs.
- Les changements peuvent influencer les alertes de retard et les membres a risque.

Precaution :
- Eviter les changements sans validation interne.
- Noter la raison du changement dans le suivi interne de la structure.

## Exporter les paiements CSV

1. Aller dans `Finance`.
2. Appliquer les filtres utiles :
   - type ;
   - statut ;
   - methode officielle DexPay ;
   - dates.
3. Cliquer sur `Exporter CSV`.
4. Conserver le fichier exporte selon les regles internes de suivi financier.

Utilisations typiques :
- rapprochement comptable ;
- suivi des adhesions ;
- controle des cotisations ;
- verification d'une periode donnee.

## Consulter l'audit admin

1. Aller dans `Audit`.
2. Utiliser le filtre par action si besoin :
   - validation ;
   - rejet ;
   - blocage ;
   - deblocage ;
   - relance paiement.
3. Utiliser la recherche pour retrouver un admin, un membre, un matricule, un telephone, un email ou une description.
4. Ouvrir la fiche membre depuis la ligne d'audit si une verification complementaire est necessaire.

Utilisation recommandee :
- verifier qui a effectue une action ;
- retracer une decision admin ;
- controler les relances paiement ;
- confirmer l'historique d'un membre.

## Checklist quotidienne

1. Ouvrir le tableau de bord admin.
2. Verifier les membres en attente.
3. Verifier les paiements a suivre dans `Finance`.
4. Traiter les relances necessaires.
5. Consulter les membres a risque de blocage.
6. Verifier les dernieres actions dans `Audit`.
7. Exporter les paiements si une verification financiere est prevue.

## Checklist avant une operation sensible

Avant de bloquer, debloquer, rejeter ou modifier un parametre metier :

1. Verifier l'identite du membre ou le parametre concerne.
2. Lire l'historique disponible sur la fiche membre.
3. Verifier les paiements et notifications associes si la decision concerne une situation financiere.
4. Confirmer que l'action est justifiee.
5. Effectuer l'action.
6. Controler que l'audit contient bien la trace correspondante.
