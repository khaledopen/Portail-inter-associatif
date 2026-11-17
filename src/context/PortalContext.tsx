import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import type { Association, DigitalHelpCenter, TimeSlot } from '../data/mockData';
import { rpc, supabase } from '../data/portal';

type DirectoryRow = Partial<Omit<Association, 'slots'>> & Pick<Association, 'id' | 'name' | 'category' | 'lat' | 'lng'> & {
  slots: { id: string; startsAt: string; motif: 'firstVisit' | 'followUp' | 'both' }[];
};
export type District = { name: string; city?: string | null };
type Directory = { associations: DirectoryRow[]; helpCenters: DigitalHelpCenter[]; districts?: District[] };

const frenchDay = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'short', timeZone: 'Europe/Paris' });
const frenchTime = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' });
const frenchDate = new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'Europe/Paris' });
const weekday = new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: 'Europe/Paris' });

function convert(row: DirectoryRow): Association {
  const slots: TimeSlot[] = row.slots.map((slot) => {
    const date = new Date(slot.startsAt);
    return { ...slot, dateIso: frenchDate.format(date), dayLabel: frenchDay.format(date), time: frenchTime.format(date), available: true };
  });
  const now = new Date();
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const lastDay = new Date(now.getTime() + (6 - days.indexOf(weekday.format(now))) * 86400000);
  return {
    shortName: row.name, quartier: '', address: '', city: '', taoStop: '', taoLine: '',
    phone: '', hours: '', publicAccueilli: '', mission: '', falcSummary: '',
    distanceKm: 0, saturationRate: 0,
    ...row,
    languagesSpoken: Array.isArray(row.languagesSpoken) ? row.languagesSpoken : [],
    secondaryCategories: Array.isArray(row.secondaryCategories) ? row.secondaryCategories : [],
    procedures: Array.isArray(row.procedures) ? row.procedures : [],
    documentsRequired: {
      firstVisit: row.documentsRequired?.firstVisit ?? [],
      followUp: row.documentsRequired?.followUp ?? [],
    },
    hasSlotThisWeek: slots.some((slot) => slot.dateIso <= frenchDate.format(lastDay)),
    slots,
  };
}

export function PortalProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null | undefined>(supabase ? undefined : null);
  const [directory, setDirectory] = useState({ associations: [] as Association[], helpCenters: [] as DigitalHelpCenter[], districts: [] as District[] });
  const [directoryStatus, setDirectoryStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const requestId = useRef(0);

  useEffect(() => {
    const listener = supabase?.auth.onAuthStateChange((_event, value) => setSession(value));
    return () => listener?.data.subscription.unsubscribe();
  }, []);

  const reloadDirectory = useCallback(async () => {
    const id = ++requestId.current;
    try {
      const data = await rpc<Directory>('portal_directory');
      if (id !== requestId.current) return;
      setDirectory({ associations: data.associations.map(convert), helpCenters: data.helpCenters, districts: data.districts ?? [] });
      setDirectoryStatus('ready');
    } catch {
      if (id === requestId.current) setDirectoryStatus('error');
    }
  }, []);

  useEffect(() => {
    void reloadDirectory();
    const timer = window.setInterval(() => void reloadDirectory(), 60000);
    return () => { ++requestId.current; window.clearInterval(timer); };
  }, [reloadDirectory]);

  return <PortalContext.Provider value={{ ...directory, session, directoryStatus, reloadDirectory }}>{children}</PortalContext.Provider>;
}

interface PortalValue {
  associations: Association[];
  helpCenters: DigitalHelpCenter[];
  districts: District[];
  directoryStatus: 'loading' | 'ready' | 'error';
  reloadDirectory: () => Promise<void>;
  session: Session | null | undefined;
}

const PortalContext = createContext<PortalValue | null>(null);

export function usePortal() {
  const portal = useContext(PortalContext);
  if (!portal) throw new Error('PortalProvider manquant');
  return portal;
}
