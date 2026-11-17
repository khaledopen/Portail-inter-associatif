import { useEffect, useState } from 'react';
import { operation } from '../data/portal';
import { Link, useParams } from 'react-router-dom';
import { InteractiveMap } from '../components/InteractiveMap';
import { BookingForm, field, panel } from '../components/PortalForms';
import { usePortal } from '../context/PortalContext';
import type { Association } from '../data/types';

export function AssociationDetailPage() {
  const { id } = useParams();
  const { associations, directoryStatus, session } = usePortal();
  const association = associations.find((item) => item.id === id);
  const visitor = session?.user.phone_confirmed_at ? session.user.id : undefined;
  useEffect(() => {
    if (visitor && association?.id) void operation('user', 'visit', { association: association.id }).catch(() => undefined);
  }, [visitor, association?.id]);
  return <div className="max-w-6xl mx-auto p-4 sm:p-8 space-y-5">
    <Link className="text-secondary font-bold underline" to="/annuaire">Retour à l’annuaire</Link>
    {association ? <AssociationDetails key={association.id} association={association} /> :
      <p role="status">{directoryStatus === 'loading' ? 'Chargement de la fiche…'
        : directoryStatus === 'error' ? 'Impossible de charger la fiche.' : 'Association introuvable.'}</p>}
  </div>;
}

function AssociationDetails({ association }: { association: Association }) {
  const [motif, setMotif] = useState<'firstVisit' | 'followUp'>('firstVisit');
  const [slotId, setSlotId] = useState('');
  const [selection, setSelection] = useState<Association['slots'][number]>();
  const slots = association.slots.filter((slot) => slot.motif === 'both' || slot.motif === motif);
  const slot = selection?.id === slotId ? selection : undefined;
  const documents = association.documentsRequired[motif];

  return <div className="grid md:grid-cols-2 gap-5">
    <div className="space-y-5">
      <section className={panel}>
        <h1 className="text-3xl font-display font-extrabold text-secondary">{association.name}</h1>
        {association.falcSummary && <p className="font-bold">{association.falcSummary}</p>}
        <p>{association.mission}</p>
        {association.publicAccueilli && <p>Public accueilli · {association.publicAccueilli}</p>}
        <p>{association.address}, {association.city}</p>
        <p>{association.taoLine} {association.taoStop}</p>
        <p>{association.hours}</p>
        {association.phone && <a className="underline" href={`tel:${association.phone.replace(/[^+0-9]/g, '')}`}>{association.phone}</a>}
        {association.languagesSpoken.length > 0 && <p>Langues · {association.languagesSpoken.join(', ')}</p>}
      </section>
      <InteractiveMap associations={[association]} selectedId={association.id} />
    </div>
    <section className={panel}>
      <h2 className="text-2xl font-bold text-secondary">Prendre rendez-vous</h2>
      <label className="block font-semibold">Motif
        <select className={field} value={motif} onChange={(event) => {
          setMotif(event.target.value === 'followUp' ? 'followUp' : 'firstVisit');
          setSelection(undefined);
          setSlotId('');
        }}>
          <option value="firstVisit">Premier rendez-vous</option>
          <option value="followUp">Suivi</option>
        </select>
      </label>
      {!slot && documents.length > 0 && <div><h3 className="font-bold">Documents à apporter</h3>
        <ul className="list-disc pl-5">{documents.map((document, index) => <li key={index}>{document}</li>)}</ul>
      </div>}
      <label className="block font-semibold">Créneau
        <select className={field} value={slotId} disabled={!slots.length && !slot} onChange={(event) => {
          setSlotId(event.target.value);
          setSelection(slots.find((item) => item.id === event.target.value));
        }}>
          <option value="">{slots.length ? 'Choisir un créneau' : 'Aucun créneau disponible'}</option>
          {slot && !slots.some((item) => item.id === slot.id) && <option value={slot.id}>{slot.dayLabel} à {slot.time}</option>}
          {slots.map((item) => <option key={item.id} value={item.id}>{item.dayLabel} à {item.time}</option>)}
        </select>
      </label>
      {slot && <BookingForm key={slot.id} association={association} slot={slot} motif={motif} />}
    </section>
  </div>;
}
