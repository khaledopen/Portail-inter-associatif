export type CategoryId = 'papiers' | 'logement' | 'sante' | 'travail' | 'famille' | 'droits';

export interface TimeSlot {
  id: string;
  startsAt?: string;
  motif?: 'firstVisit' | 'followUp' | 'both';
  dayLabel: string;
  dateIso: string;
  time: string;
  available: boolean;
}

export interface Procedure {
  code: string;
  title: string;
  description?: string;
  documents: Partial<Record<string, string[]>>;
}

export interface Association {
  id: string;
  name: string;
  shortName: string;
  category: CategoryId;
  secondaryCategories?: CategoryId[];
  quartier: string;
  address: string;
  city: string;
  lat: number;
  lng: number;
  taoStop: string;
  taoLine: string;
  distanceKm: number;
  phone: string;
  hours: string;
  publicAccueilli: string;
  mission: string;
  procedures?: Procedure[];
  falcSummary: string;
  hasSlotThisWeek: boolean;
  saturationRate: number;
  documentsRequired: {
    firstVisit: string[];
    followUp: string[];
  };
  slots: TimeSlot[];
  languagesSpoken: string[];
}

export interface DigitalHelpCenter {
  id: string;
  name: string;
  type: string;
  address: string;
  quartier: string;
  taoStop: string;
  hours: string;
  phone: string;
  lat: number;
  lng: number;
}

export const ASSOCIATIONS: Association[] = [
  {
    id: 'asso-1',
    name: 'Accueil & Droits des Étrangers du Loiret (ADEL 45)',
    shortName: 'ADEL 45',
    category: 'papiers',
    secondaryCategories: ['droits'],
    quartier: 'Centre-Ville / Carmes',
    address: '14 Rue des Carmes',
    city: '45000 Orléans',
    lat: 47.9012,
    lng: 1.9015,
    taoStop: 'Arrêt De Gaulle (2 min à pied)',
    taoLine: 'Tram A & B',
    distanceKm: 0.8,
    phone: '02 38 54 12 30',
    hours: 'Lun - Ven : 9h00 - 12h30 et 13h30 - 17h00',
    publicAccueilli: 'Personnes étrangères, demandeurs d’asile, réfugiés, familles',
    mission:
      'Accompagnement juridique gratuit pour les demandes de titre de séjour, renouvellements ANEF, regroupement familial, naturalisation et aide juridictionnelle.',
    falcSummary: 'Nous vous aidons à préparer vos papiers de séjour et à remplir vos dossiers sur internet.',
    hasSlotThisWeek: true,
    saturationRate: 78,
    documentsRequired: {
      firstVisit: [
        'Passeport ou pièce d’identité en cours de validité',
        'Titre de séjour actuel ou récépissé (si renouvellement)',
        'Justificatif de domicile de moins de 3 mois (facture, attestation d’hébergement)',
        'Courriers reçus de la Préfecture ou de l’OFPRA'
      ],
      followUp: [
        'Numéro de dossier ANEF ou identifiant étranger',
        'Nouveaux documents demandés par la Préfecture',
        'Récépissé de dépôt précédent'
      ]
    },
    slots: [
      { id: 's1', dayLabel: 'Mardi 17 nov.', dateIso: '2026-11-17', time: '09h30', available: true },
      { id: 's2', dayLabel: 'Mardi 17 nov.', dateIso: '2026-11-17', time: '14h00', available: true },
      { id: 's3', dayLabel: 'Mercredi 18 nov.', dateIso: '2026-11-18', time: '10h30', available: true },
      { id: 's4', dayLabel: 'Jeudi 19 nov.', dateIso: '2026-11-19', time: '15h30', available: true },
      { id: 's5', dayLabel: 'Vendredi 20 nov.', dateIso: '2026-11-20', time: '11h00', available: false }
    ],
    languagesSpoken: ['Français', 'Anglais', 'Arabe', 'Espagnol']
  },
  {
    id: 'asso-2',
    name: 'Maison du Logement & Solidarité Loiret (ADIL / ASLL)',
    shortName: 'Maison du Logement',
    category: 'logement',
    secondaryCategories: ['famille'],
    quartier: 'Argonne',
    address: '42 Boulevard Marie Stuart',
    city: '45000 Orléans',
    lat: 47.9108,
    lng: 1.9265,
    taoStop: 'Arrêt Mozart (3 min à pied)',
    taoLine: 'Tram B',
    distanceKm: 2.1,
    phone: '02 38 62 45 90',
    hours: 'Lun - Jeu : 8h45 - 12h15 et 13h30 - 17h30 • Ven : 9h00 - 16h00',
    publicAccueilli: 'Locataires en difficulté, demandeurs de logement social, personnes sans abri',
    mission:
      'Prévention des expulsions locatives, accompagnement social lié au logement (ASLL), aide aux dossiers DALO, APL/CAF et chèque énergie.',
    falcSummary: 'Nous vous aidons à garder votre logement, payer vos factures d’énergie ou trouver un nouveau logement.',
    hasSlotThisWeek: true,
    saturationRate: 84,
    documentsRequired: {
      firstVisit: [
        'Pièce d’identité',
        'Bail de location et dernières quittances de loyer',
        '3 derniers bulletins de salaire ou attestation CAF',
        'Dernier avis d’imposition'
      ],
      followUp: [
        'Numéro unique de demande de logement social',
        'Courriers du bailleur ou du commissaire de justice'
      ]
    },
    slots: [
      { id: 'l1', dayLabel: 'Mardi 17 nov.', dateIso: '2026-11-17', time: '10h00', available: true },
      { id: 'l2', dayLabel: 'Mercredi 18 nov.', dateIso: '2026-11-18', time: '14h30', available: true },
      { id: 'l3', dayLabel: 'Jeudi 19 nov.', dateIso: '2026-11-19', time: '09h30', available: true },
      { id: 'l4', dayLabel: 'Vendredi 20 nov.', dateIso: '2026-11-20', time: '14h00', available: true }
    ],
    languagesSpoken: ['Français', 'Anglais', 'Portugais']
  },
  {
    id: 'asso-3',
    name: 'Handi-Lien & Santé Solidaire Orléans',
    shortName: 'Handi-Lien 45',
    category: 'sante',
    secondaryCategories: ['droits'],
    quartier: 'La Source',
    address: '8 Avenue du Parc Floral',
    city: '45100 Orléans',
    lat: 47.8442,
    lng: 1.9365,
    taoStop: 'Arrêt Parc Floral (4 min à pied)',
    taoLine: 'Tram A & Bus 1',
    distanceKm: 6.4,
    phone: '02 38 41 77 10',
    hours: 'Lun - Ven : 9h00 - 17h00',
    publicAccueilli: 'Personnes en situation de handicap, aidants familiaux, personnes sans mutuelle',
    mission:
      'Aide complète au remplissage des dossiers MDPH (AAH, PCH, carte mobilité inclusion), ouverture des droits CPAM et Complémentaire Santé Solidaire (CSS).',
    falcSummary: 'Nous vous aidons à remplir votre dossier handicap (MDPH) et à avoir une carte vitale et une mutuelle.',
    hasSlotThisWeek: true,
    saturationRate: 62,
    documentsRequired: {
      firstVisit: [
        'Pièce d’identité',
        'Certificat médical MDPH rempli par votre médecin (moins de 6 mois)',
        'Justificatif de domicile',
        'Attestation de droits CPAM ou carte Vitale'
      ],
      followUp: [
        'Numéro de dossier MDPH',
        'Courrier de notification reçu'
      ]
    },
    slots: [
      { id: 'h1', dayLabel: 'Mardi 17 nov.', dateIso: '2026-11-17', time: '11h00', available: true },
      { id: 'h2', dayLabel: 'Mercredi 18 nov.', dateIso: '2026-11-18', time: '16h00', available: true },
      { id: 'h3', dayLabel: 'Jeudi 19 nov.', dateIso: '2026-11-19', time: '10h30', available: true }
    ],
    languagesSpoken: ['Français', 'Langue des Signes (LSF)', 'Anglais']
  },
  {
    id: 'asso-4',
    name: 'Atelier Emploi & Langue Française (AELF Loiret)',
    shortName: 'AELF Loiret',
    category: 'travail',
    secondaryCategories: ['papiers'],
    quartier: 'Saint-Marceau',
    address: '27 Avenue Dauphine',
    city: '45100 Orléans',
    lat: 47.8891,
    lng: 1.9082,
    taoStop: 'Arrêt Mouillère (2 min à pied)',
    taoLine: 'Tram A & Bus 22',
    distanceKm: 1.7,
    phone: '02 38 56 88 22',
    hours: 'Lun - Ven : 9h00 - 12h30 et 14h00 - 17h30',
    publicAccueilli: 'Demandeurs d’emploi, jeunes, personnes allophones souhaitant apprendre le français',
    mission:
      'Ateliers sociolinguistiques (FLE / alphabétisation), aide à l’inscription France Travail, rédaction de CV, préparation aux entretiens et reconnaissance de diplômes.',
    falcSummary: 'Nous vous aidons à apprendre le français, faire votre CV et trouver un travail ou une formation.',
    hasSlotThisWeek: true,
    saturationRate: 54,
    documentsRequired: {
      firstVisit: [
        'Pièce d’identité ou titre de séjour avec autorisation de travail',
        'CV actuel (si vous en avez un)',
        'Identifiant France Travail (si déjà inscrit)'
      ],
      followUp: [
        'CV mis à jour',
        'Offres d’emploi ou formations repérées'
      ]
    },
    slots: [
      { id: 't1', dayLabel: 'Mardi 17 nov.', dateIso: '2026-11-17', time: '09h00', available: true },
      { id: 't2', dayLabel: 'Mercredi 18 nov.', dateIso: '2026-11-18', time: '13h30', available: true },
      { id: 't3', dayLabel: 'Vendredi 20 nov.', dateIso: '2026-11-20', time: '10h00', available: true }
    ],
    languagesSpoken: ['Français', 'Ukrainien', 'Arabe', 'Anglais']
  },
  {
    id: 'asso-5',
    name: 'Épicerie Solidaire & Entraide Familiale d’Orléans',
    shortName: 'Entraide Familiale',
    category: 'famille',
    secondaryCategories: ['logement'],
    quartier: 'Blossières / Gare',
    address: '19 Rue de la Lionne',
    city: '45000 Orléans',
    lat: 47.9089,
    lng: 1.8942,
    taoStop: 'Arrêt Gare d’Orléans (5 min à pied)',
    taoLine: 'Tram A & Bus 2, 3, 5',
    distanceKm: 1.3,
    phone: '02 38 88 31 05',
    hours: 'Mar - Sam : 9h30 - 13h00 et 14h00 - 18h00',
    publicAccueilli: 'Familles, personnes isolées, étudiants en précarité, parents',
    mission:
      'Distribution de colis alimentaires, accès à l’épicerie solidaire, accompagnement budgétaire, dossiers de surendettement et soutien scolaire.',
    falcSummary: 'Nous vous aidons pour l’alimentation (colis, épicerie à petits prix), les enfants et votre budget.',
    hasSlotThisWeek: true,
    saturationRate: 71,
    documentsRequired: {
      firstVisit: [
        'Pièce d’identité',
        'Justificatif de ressources (CAF, salaire, France Travail)',
        'Justificatif de charges (loyer, factures)',
        'Livret de famille (si enfants à charge)'
      ],
      followUp: [
        'Carte d’accès à l’épicerie solidaire'
      ]
    },
    slots: [
      { id: 'f1', dayLabel: 'Mardi 17 nov.', dateIso: '2026-11-17', time: '14h30', available: true },
      { id: 'f2', dayLabel: 'Jeudi 19 nov.', dateIso: '2026-11-19', time: '10h00', available: true },
      { id: 'f3', dayLabel: 'Samedi 21 nov.', dateIso: '2026-11-21', time: '10h30', available: true }
    ],
    languagesSpoken: ['Français', 'Espagnol', 'Arabe']
  },
  {
    id: 'asso-6',
    name: 'Point Accès aux Droits & Médiation Numérique (PIMMS Loiret)',
    shortName: 'PIMMS Loiret',
    category: 'droits',
    secondaryCategories: ['papiers', 'logement'],
    quartier: 'Saint-Jean-de-Braye / Est',
    address: '5 Place de la Commune',
    city: '45800 Saint-Jean-de-Braye',
    lat: 47.9135,
    lng: 1.9698,
    taoStop: 'Arrêt Léon Blum (1 min à pied)',
    taoLine: 'Tram B',
    distanceKm: 4.8,
    phone: '02 38 22 19 40',
    hours: 'Lun - Ven : 9h00 - 12h30 et 13h30 - 17h00',
    publicAccueilli: 'Tout public, personnes éloignées du numérique, seniors',
    mission:
      'Aide gratuite aux démarches en ligne (CAF, Ameli, impôts, retraite, ANTS), orientation vers les associations partenaires et écrivain public.',
    falcSummary: 'Nous vous aidons gratuitement à faire vos démarches sur ordinateur et à comprendre vos courriers.',
    hasSlotThisWeek: false,
    saturationRate: 48,
    documentsRequired: {
      firstVisit: [
        'Pièce d’identité',
        'Courriers ou identifiants CAF / Ameli / Impôts',
        'Téléphone portable pour recevoir les codes de sécurité'
      ],
      followUp: [
        'Dossier en cours et nouveaux justificatifs'
      ]
    },
    slots: [
      { id: 'd1', dayLabel: 'Lundi 23 nov.', dateIso: '2026-11-23', time: '09h30', available: true },
      { id: 'd2', dayLabel: 'Mardi 24 nov.', dateIso: '2026-11-24', time: '14h00', available: true }
    ],
    languagesSpoken: ['Français', 'Anglais', 'Portugais']
  }
];

export const DIGITAL_HELP_CENTERS: DigitalHelpCenter[] = [
  {
    id: 'dhc-1',
    name: 'France Services Orléans Centre',
    type: 'Médiation numérique gratuite',
    address: '1 Place de l’Étape, 45000 Orléans',
    quartier: 'Centre-Ville',
    taoStop: 'Tram A & B — Arrêt République',
    hours: 'Lun - Ven : 9h00 - 17h00',
    phone: '02 38 79 22 22',
    lat: 47.9029,
    lng: 1.9086
  },
  {
    id: 'dhc-2',
    name: 'Mairie de Proximité & Point Numérique Argonne',
    type: 'Accompagnement physique sans RDV',
    address: '1 Rue de la Mairie-Argonne, 45000 Orléans',
    quartier: 'Argonne',
    taoStop: 'Tram B — Arrêt Grand Villiers',
    hours: 'Lun - Ven : 8h30 - 12h30 / 13h30 - 17h00',
    phone: '02 38 68 44 10',
    lat: 47.9141,
    lng: 1.9345
  },
  {
    id: 'dhc-3',
    name: 'Espace Public Numérique La Source',
    type: 'Ordinateurs en libre accès + médiateur',
    address: '12 Place Choiseul, 45100 Orléans',
    quartier: 'La Source',
    taoStop: 'Tram A — Arrêt Chèques Postaux',
    hours: 'Mar - Sam : 9h30 - 17h30',
    phone: '02 38 69 15 00',
    lat: 47.8385,
    lng: 1.9382
  }
];

export const USER_DEMO_APPOINTMENTS = [
  {
    id: 'rdv-101',
    associationId: 'asso-1',
    associationName: 'Accueil & Droits des Étrangers du Loiret (ADEL 45)',
    date: 'Mardi 17 novembre 2026',
    time: '14h00',
    motif: 'Premier rendez-vous — Renouvellement titre de séjour',
    address: '14 Rue des Carmes, 45000 Orléans',
    taoStop: 'Tram A & B — Arrêt De Gaulle',
    phone: '02 38 54 12 30',
    status: 'Confirmé (SMS envoyé)'
  },
  {
    id: 'rdv-102',
    associationId: 'asso-5',
    associationName: 'Épicerie Solidaire & Entraide Familiale d’Orléans',
    date: 'Jeudi 19 novembre 2026',
    time: '10h00',
    motif: 'Suivi de dossier — Aide alimentaire',
    address: '19 Rue de la Lionne, 45000 Orléans',
    taoStop: 'Tram A — Arrêt Gare d’Orléans',
    phone: '02 38 88 31 05',
    status: 'À venir'
  }
];

export const USER_PAST_APPOINTMENTS = [
  {
    id: 'rdv-088',
    associationName: 'Point Accès aux Droits & Médiation Numérique (PIMMS Loiret)',
    date: '28 octobre 2026',
    motif: 'Création compte CAF et demande APL',
    status: 'Terminé'
  }
];

export const USER_VAULT_DOCUMENTS = [
  { id: 'doc-1', name: 'Passeport_Identite.pdf', category: 'Identité', addedAt: '10/10/2026', size: '1.2 Mo' },
  { id: 'doc-2', name: 'Attestation_Hebergement_Orleans.pdf', category: 'Domicile', addedAt: '02/11/2026', size: '480 Ko' },
  { id: 'doc-3', name: 'Avis_Imposition_2025.pdf', category: 'Ressources', addedAt: '04/11/2026', size: '890 Ko' }
];

export const PRO_DAILY_APPOINTMENTS = [
  { id: 'p1', time: '09h30', userInitials: 'M. K.', phone: '06 12 ** ** 89', motif: '1er RDV — Titre de séjour', status: 'Présent', hasPassport: true },
  { id: 'p2', time: '10h30', userInitials: 'S. B.', phone: '07 84 ** ** 21', motif: 'Suivi — Dossier ANEF', status: 'Confirmé', hasPassport: true },
  { id: 'p3', time: '14h00', userInitials: 'A. D.', phone: '06 45 ** ** 10', motif: '1er RDV — Regroupement familial', status: 'En attente', hasPassport: false },
  { id: 'p4', time: '15h30', userInitials: 'N. T.', phone: '07 51 ** ** 04', motif: 'Orientation — Emploi & FLE', status: 'Confirmé', hasPassport: true }
];

export const PRO_LIAISON_PASSPORTS = [
  {
    id: 'pass-1',
    dossierCode: 'ORL-2026-841',
    initials: 'M. K.',
    rgpdConsent: true,
    consentDate: '12/11/2026',
    summaryLines: [
      '1. Situation : Demande de renouvellement titre de séjour salarié en cours sur ANEF.',
      '2. Démarches réalisées : Pièces scannées et déposées chez ADEL 45 le 04/11/2026.',
      '3. Besoin secondaire identifié : Cours de français (FLE niveau A2) et mise à jour CV.',
      '4. Orientation effectuée : Créneau réservé chez AELF Loiret pour le 20/11/2026.',
      '5. Point de vigilance : Récépissé expire le 15/12/2026 — relance Préfecture si silence.'
    ]
  },
  {
    id: 'pass-2',
    dossierCode: 'ORL-2026-792',
    initials: 'S. B.',
    rgpdConsent: true,
    consentDate: '09/11/2026',
    summaryLines: [
      '1. Situation : Famille monoparentale (2 enfants) en difficulté de paiement de loyer.',
      '2. Démarches réalisées : Dossier FSL déposé avec Maison du Logement le 02/11/2026.',
      '3. Besoin secondaire identifié : Soutien alimentaire immédiat.',
      '4. Orientation effectuée : Carte épicerie solidaire activée à Entraide Familiale.',
      '5. Point de vigilance : Attente réponse CAF pour régularisation APL.'
    ]
  }
];

export const PRO_URGENCY_ALERTS = [
  {
    id: 'urg-1',
    date: 'Aujourd’hui, 11h15',
    sender: 'Maison du Logement (Argonne)',
    type: 'Hébergement d’urgence',
    message: 'Famille avec 2 enfants sans solution ce soir suite à rupture d’hébergement. 115 contacté, besoin d’un colis alimentaire d’urgence avant 17h.',
    status: 'Ouvert'
  },
  {
    id: 'urg-2',
    date: 'Hier, 16h40',
    sender: 'ADEL 45 (Centre-Ville)',
    type: 'Aide alimentaire immédiate',
    message: 'Usager isolé en attente de versement ADA, orientation vers Entraide Familiale pour colis de dépannage.',
    status: 'Pris en charge par Entraide Familiale'
  }
];

export const OBSERVATORY_STATS = {
  totalRequests: 4820,
  completedAppointments: 3945,
  partnerAssociations: 42,
  avgWaitDays: 4.2,
  byTheme: [
    { name: 'Papiers & Séjour', demandes: 1340, color: '#174A73' },
    { name: 'Logement & Énergie', demandes: 1120, color: '#176B57' },
    { name: 'Famille & Budget', demandes: 890, color: '#2E8B57' },
    { name: 'Travail & Formation', demandes: 680, color: '#3B82F6' },
    { name: 'Santé & Handicap', demandes: 510, color: '#8B5CF6' },
    { name: 'Droits & Numérique', demandes: 280, color: '#64748B' }
  ],
  byQuartierQPV: [
    { quartier: 'La Source (QPV)', demandes: 1290, delaiJours: 4.8 },
    { quartier: 'Argonne (QPV)', demandes: 1150, delaiJours: 5.1 },
    { quartier: 'Centre-Ville / Carmes', demandes: 780, delaiJours: 3.4 },
    { quartier: 'Blossières / Gare', demandes: 620, delaiJours: 3.9 },
    { quartier: 'Saint-Jean-de-Braye', demandes: 540, delaiJours: 4.0 },
    { quartier: 'Saran / Fleury / Hors Orléans', demandes: 440, delaiJours: 4.5 }
  ],
  monthlyTrend: [
    { mois: 'Juin', demandes: 610, rdv: 520 },
    { mois: 'Juil', demandes: 580, rdv: 495 },
    { mois: 'Août', demandes: 540, rdv: 460 },
    { mois: 'Sept', demandes: 790, rdv: 670 },
    { mois: 'Oct', demandes: 890, rdv: 750 },
    { mois: 'Nov', demandes: 940, rdv: 810 }
  ]
};
