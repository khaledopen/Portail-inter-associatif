# Backend du portail

Projet de référence : `portail-inter-associatif` (`tlybokihwpshqsdtbnot`), région Paris (`eu-west-3`), créé le 17/11/2026. Les six migrations y sont appliquées et la fonction `send-portal-sms` y est déployée. Les tâches Cron `portal-booking-sms` et `portal-purge-expired` sont programmées. L'URL du projet et le secret du Cron sont dans Vault : `portal_project_url` et `portal_cron_secret`.

Le frontend React et Vite utilise le client officiel Supabase. PostgreSQL gère les associations, créneaux, réservations, demandes de référencement, conversations, accès professionnels, passeports de liaison, consentements et indicateurs. Supabase Auth gère les sessions et Supabase Storage conserve les justificatifs dans un bucket privé. La fonction Edge envoie les SMS métier avec Twilio.

## Démarrer avec un projet de test

1. Activer la Data API pour le schéma `public`. Garder `portal_private` hors des schémas exposés.
2. Appliquer les migrations sous `supabase/migrations/` dans l’ordre de leur nom. Pour un projet géré avec la CLI, utiliser son flux de migration. Si la première migration a été appliquée depuis le SQL Editor, reprendre avec les fichiers suivants depuis le même éditeur ou aligner l’historique de la CLI avant de l’utiliser.
3. Copier `.env.example` dans `.env.local` à la racine. Renseigner `VITE_SUPABASE_URL` et `VITE_SUPABASE_PUBLISHABLE_KEY` avec les valeurs du panneau Connect. Les variables Vite sont publiques.
4. Activer le fournisseur Phone dans Supabase Auth et configurer le fournisseur SMS pour les codes de connexion. Pour les comptes pro et pilote, créer et vérifier les utilisateurs e-mail avec un mot de passe dans le tableau de bord Auth.
5. Associer le premier pilote à son identifiant Supabase Auth depuis le SQL Editor.

```sql
insert into portal_private.pilots(user_id)
values ('UUID_DU_COMPTE_PILOTE') on conflict do nothing;
```

6. Exécuter `npm ci` puis `npm run dev`. Avec le compte pilote, ouvrir `/observatoire`, créer ou approuver une fiche, ajouter l’adresse et des coordonnées, puis activer la publication. Dans la fiche, associer à l’organisation l’identifiant Auth d’un professionnel. Dans `/espace-pro`, ce professionnel peut ouvrir les créneaux et répondre aux demandes. Les fiches et les lieux d’aide commencent vides pour que le portail ne présente pas de données fictives comme des services réels.

Les ACL métier sont vérifiées côté PostgreSQL à chaque opération. Le rôle pilote donne accès à la modération et aux indicateurs agrégés. Il ne donne pas accès aux rendez-vous individuels, au coffre-fort ni aux passeports. Le partage d’un passeport et l’orientation sont deux accords distincts, révocables et valables 30 jours. L’accès au passeport, son écriture et les actions sur l’accord sont journalisés. Les justificatifs sont accessibles depuis le compte qui les dépose.

## Démarches et documents

L’éditeur de fiche accepte une liste de démarches dans le champ « Catalogue JSON ». La liste affichée lors de la réservation utilise la langue sélectionnée si elle existe, puis le français, puis la checklist générale du motif.

```json
[
  {
    "code": "logement-social",
    "title": "Demande de logement social",
    "description": "Préparer une première demande.",
    "documents": {
      "fr": ["Pièce d’identité"],
      "en": ["Proof of identity"]
    }
  }
]
```

Le catalogue local, les coordonnées, les arrêts TAO, les liens officiels et les traductions sont à renseigner par les partenaires. Les indicateurs utilisent le quartier de la structure qui reçoit la demande. Ils ne décrivent pas le quartier de résidence de l’usager.

## Activer les confirmations, rappels et annulations par SMS

Vonage peut être utilisé à la place de Twilio. Dans **Supabase → Authentication → Providers → Phone**, choisir **Vonage** et renseigner la clé API, le secret API et le nom d’expéditeur autorisé. Pour les notifications de réservation, définir `PORTAL_SMS_PROVIDER=vonage`, `VONAGE_API_KEY`, `VONAGE_API_SECRET` et `VONAGE_SMS_FROM` dans les secrets de la fonction Edge. Définir aussi `PORTAL_URL` et `PORTAL_CRON_SECRET`, puis reprendre ci-dessous à l’étape 2. Consulter les journaux Vonage pour vérifier la livraison réelle sur le téléphone de test.

Les codes de connexion sont gérés par Supabase Auth séparément. La fonction `send-portal-sms` traite les confirmations, les rappels environ 24 heures avant le rendez-vous et les confirmations d’annulation. Elle réclame les travaux par lots et réessaie les envois en échec. Une confirmation enregistrée vaut réservation même si le prestataire SMS est indisponible. Un envoi accepté par le prestataire peut être répété si l’accusé en base échoue.

1. Dans Twilio, créer ou sélectionner un **Messaging Service** et lui associer un expéditeur capable d’envoyer des SMS dans le pays du téléphone de test. Pour utiliser le même service pour les codes de connexion, sélectionner le fournisseur **Twilio** dans **Supabase → Authentication → Providers → Phone** et renseigner l’Account SID (`AC…`), l’Auth Token et le Messaging Service SID (`MG…`). Dans les secrets de la fonction Edge, définir `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_MESSAGING_SERVICE_SID`, `PORTAL_URL` et `PORTAL_CRON_SECRET`. Utiliser un secret aléatoire pour ce dernier, réservé au planificateur. Supabase injecte les identifiants d’accès à son API côté fonction.
2. Lier le projet à la CLI, puis exécuter `supabase functions deploy send-portal-sms`. La configuration laisse le contrôle d’accès au secret du planificateur.
3. Dans Supabase Cron, programmer chaque minute un POST vers `/functions/v1/send-portal-sms`, avec le secret `x-portal-cron-secret`. Avec pg_cron et pg_net, stocker le secret et l’URL de base dans Vault, puis utiliser la requête suivante comme définition du job.

```sql
select net.http_post(
  url := (select decrypted_secret from vault.decrypted_secrets where name = 'portal_project_url')
    || '/functions/v1/send-portal-sms',
  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'x-portal-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'portal_cron_secret')
  ),
  body := '{}'::jsonb
);
```

Le lien d’annulation contient un jeton individuel dans le fragment URL. La page demande de confirmer l’annulation puis remet le créneau à disposition. Surveiller les envois en échec via les compteurs de la fonction et `portal_private.sms_jobs`.

## Inclusion, bourse aux créneaux et RGPD (migration `20261117040000_inclusion_rgpd.sql`)

Cette migration déplace les anciennes fonctions `portal_user` et `portal_staff` dans `portal_private` (`user_core`, `staff_core`). De nouvelles fonctions publiques du même nom les remplacent et ajoutent les actions suivantes.

- **Mode aidant** : `portal_user('book')` accepte `helper: true` et `contactPhone`. Les SMS partent vers ce numéro. Un compte peut avoir au plus 5 rendez-vous à venir pris pour des proches.
- **Réservation au guichet** : `portal_staff('book_walk_in')` réserve pour une personne présente, sans compte, avec `consent: true`. L’action est journalisée dans `portal_private.audit`. Un professionnel peut faire 40 réservations de ce type par jour au maximum.
- **Bourse aux créneaux** : `create_slot` accepte `partnerOnly` et `repeatWeeks` (1 à 26). Les créneaux réservés aux partenaires sont absents de l’annuaire public. Ils apparaissent dans `dashboard.exchange` de l’espace pro.
- **Passeport** : `read_passport` renvoie aussi `history`, c’est-à-dire les rendez-vous et orientations liés à la structure qui a rédigé le passeport.
- **Usager** : actions `visit`, `export` et `delete_account` (avec `confirm: "SUPPRIMER"`, après avoir vidé le coffre-fort par l’API Storage). Le tableau de bord ajoute `visited`, `passports` et `accessLog`. Les rendez-vous passés d’un compte supprimé restent comptés dans les statistiques, sans nom ni téléphone.
- **Observatoire** : `portal_observatory('stats')` est réservé aux pilotes. `save_district` et `remove_district` gèrent la liste des quartiers et des QPV proposée aux usagers, également publiée dans `portal_directory().districts`.
- **Formulaire de référencement** : limité à 3 demandes par heure et par adresse IP (hachée avec un sel), et à 30 par heure au total. Erreur HTTP 429.
- **Conservation** : `portal_private.purge_expired()` anonymise les rendez-vous après 24 mois et supprime les conversations inactives après 24 mois, le journal après 12 mois, ainsi que les alertes, les visites et les accords expirés. Si `pg_cron` est activé avant la migration, la purge est planifiée chaque nuit à 3 h 17. Sinon, la planifier avec `select cron.schedule('portal-purge-expired','17 3 * * *','select portal_private.purge_expired()');`. Les durées et les plafonds sont modifiables dans `portal_private.settings`.

Le script `tests/inclusion_rgpd.sql` vérifie ces règles et annule ses écritures.

## Comptes des associations et invitations par e-mail

1. L’association demande son référencement sur `/inscription-association`. Le bouton « Inscrire mon association » est dans l’en-tête.
2. Dans `/observatoire`, le pilote clique sur « Valider et inviter l’association ». La fiche brouillon est créée et la fonction Edge `portal-invite` envoie une invitation Supabase à l’e-mail de contact de la demande.
3. La personne clique sur le lien reçu, arrive sur `/bienvenue` et choisit son mot de passe. Un déclencheur sur `auth.users` relie automatiquement son compte à l’association (`portal_private.staff_invitations`).
4. Le pilote peut inviter d’autres membres depuis la fiche (« Équipe de l’association »), renvoyer une invitation, l’annuler ou retirer un accès. « Mot de passe oublié » sur `/espace-pro` envoie un lien vers `/bienvenue`.

Prérequis côté Supabase :
- dans **Authentication → URL Configuration**, l’URL du site et les URL de redirection doivent inclure l’adresse du portail, par exemple `http://localhost:5173/**` et l’adresse Vercel ;
- les e-mails partent par le SMTP Gmail du compte pilote (mot de passe d’application Google), avec les modèles français de `supabase/templates/`. Avant l’ouverture au public, passer à une adresse sur un domaine dédié (Brevo + DKIM/SPF/DMARC) pour garantir la délivrabilité.

## Vérifications

`npm run build` vérifie TypeScript et la compilation Vite. Sur un projet Supabase de test, les scripts `tests/association_applications.sql`, `tests/portal.sql` et `tests/inclusion_rgpd.sql` créent leurs propres données et annulent leurs écritures. Ils vérifient notamment les droits des rôles, la réservation et la révocation des consentements.

Pour un test navigateur avec de vrais SMS, exécuter `tests/setup_booking_demo.sql` depuis le SQL Editor du projet de test. Ce fichier conserve une fiche et un créneau fictifs pour permettre la réservation depuis le navigateur.

1. Ouvrir `/parcours-rapide`, choisir Droits et démarches, puis l’association de test et un créneau.
2. Entrer le numéro de l’appareil qui reçoit le test et saisir le code reçu. Si le compte Twilio est en essai, vérifier d’abord que ce destinataire est autorisé dans la console Twilio.
3. Réserver avec un prénom fictif. Vérifier que le rendez-vous apparaît dans l’espace usager et que le créneau n’est plus proposé.
4. Attendre l’exécution du job Cron. Vérifier la réception du SMS de confirmation sur l’appareil et consulter les journaux Twilio s’il n’arrive pas.
5. Ouvrir le lien d’annulation depuis un navigateur qui peut atteindre `PORTAL_URL`, confirmer et vérifier que le créneau réapparaît. Si Vite écoute seulement en local, ouvrir le lien sur le PC hôte.

Avant de traiter des données réelles, vérifier l’emplacement du projet, la gestion de la conservation et la configuration des plafonds d’envoi chez le fournisseur SMS. Le formulaire public de référencement reste accessible sans compte. Il est seulement limité en débit et ne comporte pas de captcha.
