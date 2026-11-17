// Types partagés du portail. Les données réelles viennent de Supabase (portal_directory).
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
