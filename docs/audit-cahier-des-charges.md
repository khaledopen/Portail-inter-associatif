# Audit du portail inter-associatif — état au 17/11/2026

Comparaison du code avec le cahier des charges (3 pages) et le volet 2 « Rubriques & Interface Inclusive » (3 pages), après la migration `20261117040000_inclusion_rgpd.sql`. Les migrations et les trois scripts de `supabase/tests/` ont été exécutés sur un PostgreSQL 16 qui simule Auth et Storage. Ils restent à rejouer sur un projet Supabase de test. Un écran présent ne garantit ni son accessibilité réelle ni sa conformité juridique.

Légende : ✅ implémenté et raccordé au backend · 🟡 partiel · ❌ absent.

## 1. Pages du cahier des charges

| Page / exigence | État | Détail |
| --- | --- | --- |
| Accueil : recherche, 6 thèmes illustrés, langues, urgence | ✅ | Le volet 2 fusionne les thèmes handicap et alimentaire dans « Santé » et « Famille ». Le cahier principal les présente séparément : à arbitrer avec les partenaires. |
| Résultats et carte : liste, carte Leaflet, filtre « créneau cette semaine » | 🟡 | Les fiches et les créneaux viennent de `portal_directory`. Les arrêts TAO sont saisis en texte. Aucune couche d’arrêts, aucun itinéraire et aucun calcul de distance. |
| Fiche association et RDV : horaires, checklist, choix du motif | ✅ | La checklist dépend de la démarche et de la langue. La réservation est atomique et un créneau ne peut être pris qu’une fois. |
| Espace usager : prochains RDV, historique, cas complexes, coffre-fort | ✅ | Nouveautés : associations consultées, lecture de son passeport et liste des associations qui ont consulté son dossier. |
| Espace pro : RDV du jour, fiche de liaison RGPD, RDV chez un confrère, messagerie | ✅ | Nouveautés : réservation au guichet pour une personne sans compte, bourse aux créneaux et parcours joint au passeport. |
| Observatoire : graphiques anonymisés par QPV et thème, gestion des fiches, délais | ✅ | Nouveautés : quartier de résidence déclaré, liste des QPV gérée par les pilotes, délais par thème, volumes mensuels, saturation par structure, orientations et réservations au guichet. Les groupes de moins de 5 demandes sont masqués. |

## 2. Rubriques du cahier (section 2)

| Rubrique | État | Détail |
| --- | --- | --- |
| Checklist intelligente et traduction | 🟡 | Mécanisme en place : catalogue JSON par démarche et par langue. Les contenus restent à saisir par les partenaires. |
| Annuaire qualifié et carte mobilité | 🟡 | Voir la carte ci-dessus. Les itinéraires TAO nécessitent une source de données réseau (GTFS ou API TAO), non intégrée. |
| Créneaux en temps réel et SMS (confirmation, rappel la veille, annulation en 1 clic) | ✅ | L’annuaire se recharge toutes les 60 s. L’envoi des SMS passe par la fonction Edge `send-portal-sms` (Twilio ou Vonage) et le Cron. L’annulation libère le créneau. |
| Cas complexes en 3 étapes et coffre-fort | ✅ | La demande est transmise à l’association choisie. Il n’existe pas de « référent » distinct au sein d’une association : tous ses membres voient la demande. |
| Dossier partagé et passeport en 5 lignes | ✅ | Passeport de 5 lignes, avec l’historique des RDV et des orientations de la structure source. Accès soumis à un accord de 30 jours, révocable et journalisé. |
| Orientation directe et relais urgence | ✅ | Deux voies : orientation avec l’accord de l’usager donné dans son espace, ou réservation au guichet avec accord oral attesté et journalisé. Les alertes sont typées (hébergement, alimentaire, santé, violences, autre). |
| Messagerie, agenda de permanence, base Cerfa | ✅ | Les permanences peuvent être répétées jusqu’à 26 semaines. La base documentaire contient des liens HTTPS publiés par les pilotes. |
| Tableau de bord territorial | ✅ | Voir l’observatoire. |
| Consentement explicite, cloisonnement, hébergement en France | 🟡 | Consentement et cloisonnement sont appliqués en base. Nouveautés : export de ses données, suppression de son compte et purge automatique selon les durées de conservation. Restent à vérifier : la région du projet Supabase (Paris, eu-west-3), les transferts vers le prestataire SMS et la nécessité d’un hébergement HDS pour les données de santé (dossiers MDPH). |

## 3. Volet 2 — rubriques et dispositifs inclusifs

| Élément | État | Détail |
| --- | --- | --- |
| Catalogue des sous-démarches (perte de papiers, chèque énergie, reconnaissance de diplômes, surendettement…) | 🟡 | La structure de données existe (`procedures`). Le catalogue reste à remplir par les partenaires, avec les liens ANEF, CAF, ADIL, etc. |
| Coin des associations : annuaire inversé, bourse aux créneaux | ✅ | Filtre par compétence lors de l’orientation. Les créneaux « réservés partenaires » ne sont pas visibles du public. |
| FALC et pictogrammes | 🟡 | Textes simplifiés présents. Relecture FALC par le public visé à prévoir. |
| Traducteur et « Écouter la page » | 🟡 | Six langues pour l’interface et lecture par le navigateur. Les fiches et les écrans privés restent en français. |
| Tunnel 1 question par écran | ✅ | Quatre écrans, quartier proposé à partir de la liste gérée par les pilotes. Aide audio par étape absente. |
| Connexion par code SMS | 🟡 | OTP Supabase Auth. Le volet 2 demande 4 chiffres. Supabase envoie par défaut un code à 6 chiffres. Vérifier les longueurs possibles dans les réglages Auth. |
| Mode Confort | ✅ | Texte à 130 %, contrastes renforcés, éléments décoratifs masqués. |
| « Me faire aider près de chez moi » | ✅ | Les lieux sont gérés par les pilotes et affichés sur la carte. |
| « Je prends RDV pour quelqu’un d’autre » | ✅ | Le SMS part vers le mobile de la personne aidée. Limite de 5 RDV à venir par compte aidant. |
| Parcours « Zéro difficulté » en 4 écrans avec SMS récapitulatif | ✅ | Le SMS contient l’adresse, la liste des papiers et le lien d’annulation. |

## Restant à faire

1. Rejouer les migrations et les tests sur un projet Supabase de test (région Paris), puis valider le parcours SMS de bout en bout.
2. Saisir avec les partenaires les fiches, démarches, checklists traduites, arrêts TAO, quartiers et QPV.
3. Intégrer une source transport (GTFS TAO) pour les arrêts proches et les itinéraires, et calculer les distances.
4. Traduire les contenus des fiches et des espaces privés, ajouter l’audio par étape dans le tunnel et faire relire le FALC.
5. Avant toute donnée réelle : analyse d’impact (AIPD), registre des traitements, contrats de sous-traitance (Supabase, Twilio ou Vonage), avis sur l’hébergement HDS et validation des durées de conservation de `portal_private.settings`.
