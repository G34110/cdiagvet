# Règles Fonctionnelles - CDiagVet

Document de référence des règles métier de l'application CDiagVet, avec les cas de tests associés.

**Version:** 1.0  
**Date:** 06/02/2026

---

## Table des matières

1. [Authentification](#1-authentification)
2. [Gestion des Rôles et Permissions](#2-gestion-des-rôles-et-permissions)
3. [Gestion des Clients](#3-gestion-des-clients)
4. [Gestion des RDV et Visites](#4-gestion-des-rdv-et-visites)
5. [Tableau de Bord et Alertes](#5-tableau-de-bord-et-alertes)
6. [Interface Utilisateur](#6-interface-utilisateur)

---

## 1. Authentification

### R1.1 - Connexion avec email et mot de passe
**Description:** Un utilisateur doit pouvoir se connecter avec son email et son mot de passe.

| Cas de test | Actions | Résultat attendu |
|-------------|---------|------------------|
| CT1.1.1 | Saisir un email valide et un mot de passe correct, puis cliquer sur "Connexion" | L'utilisateur est redirigé vers le tableau de bord |
| CT1.1.2 | Saisir un email inexistant | Message d'erreur "Identifiants invalides" |
| CT1.1.3 | Saisir un mot de passe incorrect | Message d'erreur "Identifiants invalides" |

### R1.2 - Compte désactivé
**Description:** Un utilisateur dont le compte est désactivé ne peut pas se connecter.

| Cas de test | Actions | Résultat attendu |
|-------------|---------|------------------|
| CT1.2.1 | Tenter de se connecter avec un compte désactivé | Message d'erreur "Identifiants invalides" |

---

## 2. Gestion des Rôles et Permissions

### R2.1 - Rôles disponibles
**Description:** L'application gère 3 rôles principaux avec des permissions différentes.

| Rôle | Description |
|------|-------------|
| **ADMIN** | Administrateur - Accès complet à toutes les données du tenant |
| **RESPONSABLE_FILIERE** | Responsable d'une ou plusieurs filières - Accès aux clients de ses filières |
| **COMMERCIAL** | Commercial - Accès uniquement à ses propres clients |

### R2.2 - Accès aux clients selon le rôle
**Description:** Chaque rôle voit uniquement les clients auxquels il a droit.

| Cas de test | Prérequis | Actions | Résultat attendu |
|-------------|-----------|---------|------------------|
| CT2.2.1 | Connecté en tant que COMMERCIAL | Aller sur la page "Clients" | Seuls les clients créés par ce commercial sont visibles |
| CT2.2.2 | Connecté en tant que RESPONSABLE_FILIERE (ex: BOVINE) | Aller sur la page "Clients" | Seuls les clients ayant la filière BOVINE sont visibles |
| CT2.2.3 | Connecté en tant que RESPONSABLE_FILIERE multi-filières (ex: AVICULTURE + APICULTURE) | Aller sur la page "Clients" | Les clients ayant AVICULTURE OU APICULTURE sont visibles |
| CT2.2.4 | Connecté en tant qu'ADMIN | Aller sur la page "Clients" | Tous les clients du tenant sont visibles |

### R2.3 - Accès aux visites selon le rôle
**Description:** Chaque rôle voit uniquement les visites auxquelles il a droit.

| Cas de test | Prérequis | Actions | Résultat attendu |
|-------------|-----------|---------|------------------|
| CT2.3.1 | Connecté en tant que COMMERCIAL | Aller sur le "Calendrier" | Toutes ses visites (clients + RDV personnels) sont visibles |
| CT2.3.2 | Connecté en tant que RESPONSABLE_FILIERE | Aller sur le "Calendrier" | Seules les visites clients de ses filières sont visibles (pas les RDV personnels des commerciaux) |
| CT2.3.3 | Connecté en tant qu'ADMIN | Aller sur le "Calendrier" | Toutes les visites clients sont visibles (pas les RDV personnels) |

---

## 3. Gestion des Clients

### R3.1 - Création d'un client
**Description:** Un client doit avoir au minimum un nom et au moins une filière.

| Cas de test | Actions | Résultat attendu |
|-------------|---------|------------------|
| CT3.1.1 | Créer un client avec un nom et une filière | Le client est créé avec succès |
| CT3.1.2 | Créer un client sans nom | Le formulaire bloque la soumission (champ obligatoire) |
| CT3.1.3 | Créer un client sans filière | Message d'alerte "Veuillez sélectionner au moins une filière" |

### R3.2 - Filières multiples pour un client
**Description:** Un client peut appartenir à plusieurs filières.

| Cas de test | Actions | Résultat attendu |
|-------------|---------|------------------|
| CT3.2.1 | Créer un client avec 2 filières (ex: BOVINE + PORCINE) | Le client est créé avec les 2 filières |
| CT3.2.2 | Modifier un client pour ajouter une filière supplémentaire | La nouvelle filière est ajoutée |
| CT3.2.3 | Vérifier que le client apparaît dans les 2 filtres de filière | Le client apparaît quand on filtre par BOVINE ET quand on filtre par PORCINE |

### R3.3 - Géocodage automatique de l'adresse
**Description:** Lorsqu'une adresse est saisie, les coordonnées GPS sont calculées automatiquement.

| Cas de test | Actions | Résultat attendu |
|-------------|---------|------------------|
| CT3.3.1 | Créer un client avec une adresse valide | Le client apparaît sur la carte avec un marqueur |
| CT3.3.2 | Modifier l'adresse d'un client | Le marqueur sur la carte se déplace vers la nouvelle position |

### R3.4 - Suppression logique (soft delete)
**Description:** Un client supprimé n'est pas effacé de la base mais marqué comme supprimé.

| Cas de test | Actions | Résultat attendu |
|-------------|---------|------------------|
| CT3.4.1 | Supprimer un client | Le client n'apparaît plus dans la liste |
| CT3.4.2 | Vérifier en base de données | Le client a une date de suppression (deletedAt) renseignée |

### R3.5 - Statut Actif/Inactif
**Description:** Un client peut être marqué comme actif ou inactif.

| Cas de test | Actions | Résultat attendu |
|-------------|---------|------------------|
| CT3.5.1 | Créer un nouveau client | Le client est actif par défaut |
| CT3.5.2 | Modifier un client et le passer en "Inactif" | Le statut est mis à jour, badge "Inactif" affiché |
| CT3.5.3 | Filtrer par "Actifs uniquement" | Seuls les clients actifs sont affichés |

### R3.6 - Filtrage des clients par filière
**Description:** L'utilisateur peut filtrer les clients par filière dans la liste.

| Cas de test | Actions | Résultat attendu |
|-------------|---------|------------------|
| CT3.6.1 | Cliquer sur le bouton filtre "BOVINE" | Seuls les clients de la filière BOVINE sont affichés |
| CT3.6.2 | Cliquer sur un second filtre "PORCINE" (en plus de BOVINE) | Les clients BOVINE ET PORCINE sont affichés |
| CT3.6.3 | Cliquer sur "Réinitialiser" | Tous les clients sont à nouveau affichés |

### R3.7 - Pays et format d'adresse adapté
**Description:** Le formulaire s'adapte au pays sélectionné (labels, format code postal, régions).

| Cas de test | Actions | Résultat attendu |
|-------------|---------|------------------|
| CT3.7.1 | Sélectionner "France" comme pays | Le label affiche "Code postal", format 5 chiffres |
| CT3.7.2 | Sélectionner "États-Unis" comme pays | Le label affiche "ZIP Code", liste des États disponible |
| CT3.7.3 | Changer de pays | Le champ "Région" est réinitialisé |

---

## 4. Gestion des RDV et Visites

### R4.1 - Types de RDV
**Description:** Il existe deux types de RDV : les visites clients et les RDV personnels.

| Type | Description |
|------|-------------|
| **Visite client** | RDV associé à un client (sélection d'un client obligatoire) |
| **RDV personnel** | RDV sans client (usage interne du commercial) |

| Cas de test | Actions | Résultat attendu |
|-------------|---------|------------------|
| CT4.1.1 | Créer un RDV en sélectionnant un client | Une visite client est créée |
| CT4.1.2 | Créer un RDV sans sélectionner de client (champ "-- Aucun client --") | Un RDV personnel est créé |

### R4.2 - Champs obligatoires selon le type
**Description:** Les champs obligatoires varient selon qu'il s'agit d'une visite ou d'un RDV personnel.

| Cas de test | Actions | Résultat attendu |
|-------------|---------|------------------|
| CT4.2.1 | Créer une visite client sans objet | La visite est créée (l'objet est facultatif) |
| CT4.2.2 | Créer un RDV personnel sans objet | Le bouton "Enregistrer" est désactivé (l'objet est obligatoire) |
| CT4.2.3 | Créer un RDV personnel avec un objet | Le RDV est créé avec succès |

### R4.3 - Interdiction de créer un RDV dans le passé
**Description:** Pour un nouveau RDV, la date et l'heure doivent être dans le futur.

| Cas de test | Actions | Résultat attendu |
|-------------|---------|------------------|
| CT4.3.1 | Créer un RDV avec une date/heure passée | Message d'alerte "La date et l'heure ne peuvent pas être antérieures à maintenant" |
| CT4.3.2 | Créer un RDV avec une date/heure future | Le RDV est créé avec succès |
| CT4.3.3 | Modifier un RDV existant avec une date passée | La modification est autorisée (règle uniquement à la création) |

### R4.4 - Visibilité des RDV personnels
**Description:** Les RDV personnels (sans client) ne sont visibles que par leur créateur.

| Cas de test | Prérequis | Actions | Résultat attendu |
|-------------|-----------|---------|------------------|
| CT4.4.1 | Commercial A crée un RDV personnel | Commercial B se connecte et consulte le calendrier | Le RDV personnel de A n'est pas visible |
| CT4.4.2 | Commercial A crée un RDV personnel | Le RESPONSABLE_FILIERE se connecte | Le RDV personnel de A n'est pas visible |
| CT4.4.3 | Commercial A crée un RDV personnel | L'ADMIN se connecte | Le RDV personnel de A n'est pas visible |

### R4.5 - Affichage dans le calendrier
**Description:** Le calendrier affiche les RDV avec le nom du client ou l'objet.

| Cas de test | Actions | Résultat attendu |
|-------------|---------|------------------|
| CT4.5.1 | Créer une visite pour "Client ABC" avec objet "Suivi annuel" | Le calendrier affiche "Client ABC - Suivi annuel" |
| CT4.5.2 | Créer une visite pour "Client ABC" sans objet | Le calendrier affiche "Client ABC" |
| CT4.5.3 | Créer un RDV personnel avec objet "Réunion équipe" | Le calendrier affiche "Réunion équipe" |

---

## 5. Tableau de Bord et Alertes

### R5.1 - Statistiques selon le rôle
**Description:** Les statistiques du tableau de bord sont filtrées selon le rôle de l'utilisateur.

| Cas de test | Prérequis | Actions | Résultat attendu |
|-------------|-----------|---------|------------------|
| CT5.1.1 | Connecté en tant que COMMERCIAL avec 5 clients | Consulter le tableau de bord | "Total clients" affiche 5 |
| CT5.1.2 | Connecté en tant que RESPONSABLE_FILIERE BOVINE (10 clients bovins) | Consulter le tableau de bord | "Total clients" affiche 10 |
| CT5.1.3 | Connecté en tant qu'ADMIN (25 clients au total) | Consulter le tableau de bord | "Total clients" affiche 25 |

### R5.2 - Règle d'alerte pour les visites
**Description:** Une alerte est générée si un client actif n'a pas eu de visite depuis 30 jours ET n'a pas de visite prévue dans les 60 prochains jours.

| Cas de test | Prérequis | Résultat attendu |
|-------------|-----------|------------------|
| CT5.2.1 | Client avec dernière visite il y a 25 jours, pas de visite prévue | Pas d'alerte (moins de 30 jours) |
| CT5.2.2 | Client avec dernière visite il y a 35 jours, visite prévue dans 30 jours | Pas d'alerte (visite prévue dans les 60 jours) |
| CT5.2.3 | Client avec dernière visite il y a 35 jours, pas de visite prévue | **Alerte générée** "Aucune visite depuis 30 jours et pas de visite prévue dans les 60 prochains jours" |
| CT5.2.4 | Client inactif sans visite depuis 60 jours | Pas d'alerte (client inactif) |

### R5.3 - Alerte lots expirant
**Description:** Une alerte est générée si un lot livré à un client expire dans les 30 prochains jours.

| Cas de test | Prérequis | Résultat attendu |
|-------------|-----------|------------------|
| CT5.3.1 | Lot livré au client, expiration dans 45 jours | Pas d'alerte |
| CT5.3.2 | Lot livré au client, expiration dans 15 jours | Alerte "Lot XXX expire bientôt" |

### R5.4 - Sélection du type de graphique par KPI
**Description:** L'utilisateur peut choisir le type de graphique (Barres, Courbe, Camembert) pour chaque KPI individuellement. Le choix est sauvegardé et persiste entre les sessions.

| Cas de test | Actions | Résultat attendu |
|-------------|---------|------------------|
| CT5.4.1 | Sur le graphique "Évolution du CA", cliquer sur l'icône "Barres" | Le graphique s'affiche en barres |
| CT5.4.2 | Sur le graphique "Évolution du CA", cliquer sur l'icône "Courbe" | Le graphique s'affiche en courbe |
| CT5.4.3 | Sur le graphique "Évolution du CA", cliquer sur l'icône "Camembert" | Le graphique s'affiche en camembert avec légende |
| CT5.4.4 | Changer le type de graphique puis rafraîchir la page | Le type de graphique choisi est conservé |
| CT5.4.5 | Se déconnecter, se reconnecter sur le même navigateur | Le type de graphique choisi est conservé |

### R5.5 - Filtrage du tableau de bord par période
**Description:** L'utilisateur peut filtrer les données du tableau de bord par période prédéfinie ou personnalisée. Les KPIs et graphiques sont recalculés selon la période sélectionnée.

| Périodes disponibles | Description |
|---------------------|-------------|
| **Ce mois** | Mois en cours (par défaut) |
| **Mois précédent** (M-1) | Le mois calendaire précédent |
| **Trimestre précédent** (Q-1) | Les 3 mois du trimestre précédent |
| **Année précédente** (Y-1) | L'année calendaire précédente |
| **Personnalisé** | Dates de début et fin au choix |

| Cas de test | Actions | Résultat attendu |
|-------------|---------|------------------|
| CT5.5.1 | Ouvrir le tableau de bord | La période "Ce mois" est sélectionnée par défaut |
| CT5.5.2 | Cliquer sur le sélecteur de période et choisir "Mois précédent" | Les KPIs "Visites (période)" et "CA (période)" affichent les valeurs du mois précédent |
| CT5.5.3 | Sélectionner "Trimestre précédent" | Le graphique "Évolution du CA" affiche 3 mois de données |
| CT5.5.4 | Sélectionner "Année précédente" | Le graphique affiche les 12 mois de l'année précédente |
| CT5.5.5 | Sélectionner "Personnalisé" puis choisir une date de début et de fin | Les champs de date apparaissent et les données sont filtrées sur la période choisie |
| CT5.5.6 | Changer de période plusieurs fois | Les données se mettent à jour à chaque changement |

### R5.6 - Génération de rapport personnalisé
**Description:** L'utilisateur peut générer un rapport PDF ou Excel contenant les KPIs et l'évolution du CA pour la période sélectionnée.

| Format | Contenu |
|--------|---------|
| **PDF** | Document formaté avec en-tête, KPIs en tableau, évolution CA, pied de page |
| **Excel** | Classeur avec onglet KPIs et onglet CA par mois |

| Cas de test | Actions | Résultat attendu |
|-------------|---------|------------------|
| CT5.6.1 | Cliquer sur "Exporter rapport" puis "Télécharger PDF" | Un fichier PDF est téléchargé avec les KPIs et graphiques |
| CT5.6.2 | Cliquer sur "Exporter rapport" puis "Télécharger Excel" | Un fichier Excel est téléchargé avec 2 onglets |
| CT5.6.3 | Sélectionner "Mois précédent" puis exporter | Le rapport mentionne "Mois précédent" et contient les données de cette période |
| CT5.6.4 | Exporter avec période personnalisée | Le rapport mentionne les dates personnalisées |
| CT5.6.5 | Vérifier le contenu du PDF | Le PDF contient: nom utilisateur, date de génération, KPIs, évolution CA |
| CT5.6.6 | Vérifier le contenu de l'Excel | L'Excel contient 2 onglets: "KPIs" et "CA par Mois" avec les données |

---

## 6. Interface Utilisateur

### R6.1 - Sidebar rétractable
**Description:** Le panneau latéral gauche peut être réduit pour gagner de l'espace.

| Cas de test | Actions | Résultat attendu |
|-------------|---------|------------------|
| CT6.1.1 | Cliquer sur le bouton de réduction de la sidebar | La sidebar se réduit, seules les icônes sont visibles |
| CT6.1.2 | Cliquer à nouveau sur le bouton | La sidebar se déploie avec les libellés |
| CT6.1.3 | En mode réduit, le logo doit être masqué | Le logo n'est pas visible |

### R6.2 - Bouton Annuler dans les formulaires
**Description:** Chaque formulaire dispose d'un bouton "Annuler" pour revenir en arrière.

| Cas de test | Actions | Résultat attendu |
|-------------|---------|------------------|
| CT6.2.1 | Dans le formulaire de création client, cliquer sur "Annuler" | Retour à la liste des clients |
| CT6.2.2 | Dans le formulaire de RDV (modal), cliquer sur "Annuler" | La modal se ferme |

### R6.3 - Export CSV
**Description:** La liste des clients peut être exportée au format CSV.

| Cas de test | Prérequis | Actions | Résultat attendu |
|-------------|-----------|---------|------------------|
| CT6.3.1 | Liste de 10 clients affichée | Cliquer sur "Exporter CSV" | Un fichier CSV est téléchargé avec les 10 clients |
| CT6.3.2 | RESPONSABLE_FILIERE avec accès à 5 clients | Cliquer sur "Exporter CSV" | Le CSV contient uniquement les 5 clients accessibles |
| CT6.3.3 | Filtres actifs (ex: filière BOVINE) | Cliquer sur "Exporter CSV" | Le CSV contient uniquement les clients filtrés |

### R6.4 - Suppression massive (ADMIN uniquement)
**Description:** Seul l'administrateur peut supprimer tous les clients.

| Cas de test | Prérequis | Actions | Résultat attendu |
|-------------|-----------|---------|------------------|
| CT6.4.1 | Connecté en tant qu'ADMIN | Le bouton "Supprimer tous les clients" est visible | Bouton présent |
| CT6.4.2 | Connecté en tant que COMMERCIAL | Vérifier la présence du bouton | Bouton non visible |
| CT6.4.3 | Connecté en tant que RESPONSABLE_FILIERE | Vérifier la présence du bouton | Bouton non visible |

---

## Annexe : Comptes de test

| Email | Mot de passe | Rôle | Filières |
|-------|--------------|------|----------|
| admin@cdiagvet.local | admin123 | ADMIN | Toutes |
| commercial@cdiagvet.local | admin123 | COMMERCIAL | - |
| responsable-bov@cdiagvet.local | admin123 | RESPONSABLE_FILIERE | BOVINE |
| responsable-porc@cdiagvet.local | admin123 | RESPONSABLE_FILIERE | PORCINE |
| responsable-ov@cdiagvet.local | admin123 | RESPONSABLE_FILIERE | OVINE |
| responsable-can@cdiagvet.local | admin123 | RESPONSABLE_FILIERE | CANINE |
| responsable-avi@cdiagvet.local | admin123 | RESPONSABLE_FILIERE | AVICULTURE, APICULTURE |

---

*Document généré automatiquement à partir du code source de l'application.*
