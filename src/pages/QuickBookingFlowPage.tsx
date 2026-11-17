import { useState } from 'react';
import { Link } from 'react-router-dom';
import { usePortal } from '../context/PortalContext';
import { useAccessibility } from '../context/AccessibilityContext';
import { BookingForm, button, field, panel } from '../components/PortalForms';
import type { Association, CategoryId, TimeSlot } from '../data/mockData';

const categories: CategoryId[] = ['papiers', 'logement', 'sante', 'travail', 'famille', 'droits'];

export function QuickBookingFlowPage() {
  const { associations, directoryStatus, districts } = usePortal();
  const { t } = useAccessibility();
  const [category, setCategory] = useState<CategoryId>();
  const [district, setDistrict] = useState('');
  const [association, setAssociation] = useState<Association>();
  const [slot, setSlot] = useState<TimeSlot>();
  const [motif, setMotif] = useState<'firstVisit' | 'followUp'>('firstVisit');
  const step = slot ? 4 : association ? 3 : category ? 2 : 1;
  const matches = associations.filter((a) =>
    (a.category === category || (category && a.secondaryCategories?.includes(category)))
      && (!district.trim() || `${a.quartier} ${a.city}`.toLowerCase().includes(district.trim().toLowerCase())));
  const current = associations.find((item) => item.id === association?.id);
  const slots = current?.slots.filter((item) => item.motif === 'both' || item.motif === motif) ?? [];
  return <div className="max-w-3xl mx-auto p-4 sm:p-8 space-y-5">
    <h1 className="text-3xl font-display font-extrabold text-secondary">Prendre rendez-vous</h1>
    <p className="font-semibold">Étape {step} sur 4</p>
    {step > 1 && <button className="underline min-h-[44px]" onClick={() => {
      if (slot) setSlot(undefined);
      else if (association) setAssociation(undefined);
      else setCategory(undefined);
    }}>Étape précédente</button>}
    {step === 1 && <section className={panel}>
      <h2 className="text-xl font-bold">De quoi avez-vous besoin ?</h2>
      <div className="grid sm:grid-cols-2 gap-3">{categories.map((item) =>
        <button key={item} className={button} onClick={() => setCategory(item)}>{t.categoryTitles[item].title}</button>)}
      </div>
    </section>}
    {step === 2 && <section className={panel}>
      <h2 className="text-xl font-bold">Où souhaitez-vous aller ?</h2>
      <label className="block">Quartier ou commune
        <input className={field} value={district} list="portal-districts-flow" onChange={(event) => setDistrict(event.target.value)} />
        <datalist id="portal-districts-flow">{districts.map((item) => <option key={item.name} value={item.name} />)}</datalist>
      </label>
      {directoryStatus === 'loading' && <p role="status">Chargement des associations…</p>}
      {directoryStatus === 'error' && <p role="alert">L’annuaire est indisponible.</p>}
      {directoryStatus === 'ready' && matches.length === 0 && <p>Aucune association ne correspond à votre recherche.</p>}
      {matches.map((item) => <div key={item.id} className="border-t pt-3 space-y-1">
        <h3 className="font-bold">{item.name}</h3>
        <p>{item.address}, {item.city} · {item.taoLine} {item.taoStop}</p>
        <button className={button} onClick={() => setAssociation(item)}>Choisir cette association</button>
      </div>)}
    </section>}
    {step === 3 && association && <section className={panel}>
      <h2 className="text-xl font-bold">Quel créneau vous convient ?</h2>
      <p>{association.name}</p>
      <label className="block">Motif
        <select className={field} value={motif}
          onChange={(event) => setMotif(event.target.value === 'followUp' ? 'followUp' : 'firstVisit')}>
          <option value="firstVisit">Premier rendez-vous</option><option value="followUp">Suivi</option>
        </select>
      </label>
      {!slots.length && <p>Aucun créneau disponible pour ce motif.</p>}
      <div className="flex flex-wrap gap-3">{slots.map((item) =>
        <button key={item.id} className={button} onClick={() => setSlot(item)}>{item.dayLabel} à {item.time}</button>)}
      </div>
    </section>}
    {slot && association && <section className={panel}>
      <h2 className="text-xl font-bold">Confirmez votre rendez-vous</h2>
      <p>{association.name} · {slot.dayLabel} à {slot.time}</p>
      <BookingForm association={association} slot={slot} motif={motif} district={district} />
      <Link className="block underline" to="/espace-usager">Voir mes rendez-vous</Link>
    </section>}
  </div>;
}
