import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Clock,
  Phone,
  TrainFront,
  FileCheck2,
  Calendar,
  CheckCircle2,
  UserCheck,
  Building2,
} from 'lucide-react';
import { ASSOCIATIONS } from '../data/mockData';
import { useAccessibility } from '../context/AccessibilityContext';
import { InteractiveMap } from '../components/InteractiveMap';

export const AssociationDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { t } = useAccessibility();
  const asso = ASSOCIATIONS.find((a) => a.id === id) || ASSOCIATIONS[0];

  const [motif, setMotif] = useState<'firstVisit' | 'followUp'>('firstVisit');
  const [selectedSlotId, setSelectedSlotId] = useState<string>(
    asso.slots.find((s) => s.available)?.id || ''
  );
  const [forSomeoneElse, setForSomeoneElse] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [phone, setPhone] = useState('');
  const [helperName, setHelperName] = useState('');
  const [bookingConfirmed, setBookingConfirmed] = useState(false);

  const selectedSlot = asso.slots.find((s) => s.id === selectedSlotId);
  const docsToBring =
    motif === 'firstVisit' ? asso.documentsRequired.firstVisit : asso.documentsRequired.followUp;

  const handleConfirmBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlotId || !firstName.trim() || !phone.trim()) return;
    setBookingConfirmed(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Link
        to="/annuaire"
        className="inline-flex items-center gap-2 text-secondary font-bold hover:underline mb-6 min-h-[44px]"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>Retour à l’annuaire et la carte</span>
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Colonne gauche : Informations de l'association */}
        <div className="lg:col-span-7 space-y-6">
          <div className="comfort-card bg-white rounded-card p-6 border border-border shadow-card">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-16 h-16 rounded-[12px] bg-primary-light text-primary flex items-center justify-center shrink-0">
                <Building2 className="w-9 h-9" />
              </div>
              <div>
                <span className="inline-block text-xs font-bold px-2.5 py-1 rounded-md bg-secondary-light text-secondary mb-2">
                  {asso.quartier}
                </span>
                <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-secondary">
                  {asso.name}
                </h1>
              </div>
            </div>

            <p className="text-base font-semibold text-primary bg-primary-light/60 p-4 rounded-btn mb-5">
              {asso.falcSummary}
            </p>

            <div className="space-y-4 text-sm sm:text-base">
              <div>
                <h2 className="font-bold text-secondary mb-1">Présentation et missions</h2>
                <p className="text-ink-muted leading-relaxed">{asso.mission}</p>
              </div>

              <div>
                <h2 className="font-bold text-secondary mb-1">Public accueilli</h2>
                <p className="text-ink-muted">{asso.publicAccueilli}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-border">
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-5 h-5 text-secondary shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-ink">Adresse</div>
                    <div className="text-ink-muted">{asso.address}, {asso.city}</div>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <TrainFront className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-ink">Itinéraire TAO</div>
                    <div className="text-primary font-semibold">{asso.taoLine} — {asso.taoStop}</div>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Clock className="w-5 h-5 text-secondary shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-ink">Horaires</div>
                    <div className="text-ink-muted">{asso.hours}</div>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Phone className="w-5 h-5 text-secondary shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-ink">Téléphone</div>
                    <a href={`tel:${asso.phone.replace(/\s/g, '')}`} className="text-secondary font-bold hover:underline">
                      {asso.phone}
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Checklist des documents à apporter */}
          <div className="comfort-card bg-white rounded-card p-6 border border-border shadow-card">
            <h2 className="font-display font-extrabold text-xl text-secondary mb-2 flex items-center gap-2">
              <FileCheck2 className="w-6 h-6 text-primary" />
              <span>Documents à apporter le jour du rendez-vous</span>
            </h2>
            <p className="text-sm text-ink-muted mb-4">
              Liste adaptée selon votre choix :{' '}
              <span className="font-bold text-ink">
                {motif === 'firstVisit' ? 'Premier rendez-vous' : 'Suivi de dossier'}
              </span>
            </p>
            <ul className="space-y-2.5">
              {docsToBring.map((doc, idx) => (
                <li key={idx} className="flex items-start gap-3 p-3 rounded-btn bg-surface border border-border">
                  <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm sm:text-base font-medium text-ink">{doc}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Carte de localisation */}
          <div className="comfort-card bg-white rounded-card p-5 border border-border shadow-card">
            <h2 className="font-bold text-lg text-secondary mb-3">Localisation</h2>
            <InteractiveMap
              associations={[asso]}
              selectedId={asso.id}
              center={[asso.lat, asso.lng]}
              zoom={14}
              heightClass="h-[260px]"
            />
          </div>
        </div>

        {/* Colonne droite : Prise de rendez-vous étape par étape */}
        <div className="lg:col-span-5 lg:sticky lg:top-24">
          <div className="comfort-card bg-white rounded-card p-6 border-2 border-primary/30 shadow-card">
            <h2 className="font-display font-extrabold text-xl text-secondary mb-4 flex items-center gap-2">
              <Calendar className="w-6 h-6 text-primary" />
              <span>Prendre rendez-vous en ligne</span>
            </h2>

            {bookingConfirmed ? (
              <div className="bg-primary-light border border-primary/30 rounded-card p-5 space-y-4">
                <div className="flex items-center gap-3 text-primary">
                  <CheckCircle2 className="w-8 h-8 shrink-0" />
                  <h3 className="font-display font-extrabold text-xl">Rendez-vous enregistré !</h3>
                </div>

                <div className="bg-white p-4 rounded-btn border border-border text-sm space-y-1.5">
                  <p><span className="font-bold">Pour :</span> {firstName} ({phone})</p>
                  {forSomeoneElse && helperName && (
                    <p><span className="font-bold">Réservé par :</span> {helperName}</p>
                  )}
                  <p><span className="font-bold">Association :</span> {asso.shortName}</p>
                  <p><span className="font-bold">Date :</span> {selectedSlot?.dayLabel} à {selectedSlot?.time}</p>
                  <p><span className="font-bold">Motif :</span> {motif === 'firstVisit' ? 'Premier rendez-vous' : 'Suivi de dossier'}</p>
                  <p><span className="font-bold">Adresse :</span> {asso.address}, {asso.city}</p>
                </div>

                <p className="text-xs text-ink-muted bg-white/80 p-3 rounded-lg">
                  <strong>Mode démonstration :</strong> Dans la version finale connectée au serveur, un SMS de confirmation et un rappel la veille avec la liste des papiers sont envoyés automatiquement au {phone}.
                </p>

                <button
                  type="button"
                  onClick={() => setBookingConfirmed(false)}
                  className="w-full py-3 rounded-btn bg-secondary text-white font-bold min-h-[48px]"
                >
                  Prendre un autre rendez-vous
                </button>
              </div>
            ) : (
              <form onSubmit={handleConfirmBooking} className="space-y-5">
                {/* Étape 1 : Motif */}
                <div>
                  <label className="block text-sm font-bold text-secondary mb-2">
                    1. Quel est le motif de votre visite ?
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setMotif('firstVisit')}
                      className={`p-3 rounded-btn border-2 font-bold text-sm min-h-[48px] transition-colors ${
                        motif === 'firstVisit'
                          ? 'bg-primary text-white border-primary'
                          : 'bg-surface text-ink border-border'
                      }`}
                    >
                      Premier rendez-vous
                    </button>
                    <button
                      type="button"
                      onClick={() => setMotif('followUp')}
                      className={`p-3 rounded-btn border-2 font-bold text-sm min-h-[48px] transition-colors ${
                        motif === 'followUp'
                          ? 'bg-primary text-white border-primary'
                          : 'bg-surface text-ink border-border'
                      }`}
                    >
                      Suivi de dossier
                    </button>
                  </div>
                </div>

                {/* Étape 2 : Créneau */}
                <div>
                  <label className="block text-sm font-bold text-secondary mb-2">
                    2. Choisissez un jour et une heure
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {asso.slots.map((slot) => (
                      <button
                        key={slot.id}
                        type="button"
                        disabled={!slot.available}
                        onClick={() => setSelectedSlotId(slot.id)}
                        className={`p-3 rounded-btn border text-left transition-colors min-h-[52px] ${
                          !slot.available
                            ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed line-through'
                            : selectedSlotId === slot.id
                            ? 'bg-primary-light border-2 border-primary text-primary font-bold'
                            : 'bg-surface border-border hover:border-primary text-ink'
                        }`}
                      >
                        <div className="text-xs font-semibold">{slot.dayLabel}</div>
                        <div className="text-base font-bold">{slot.time}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Option : Pour quelqu'un d'autre */}
                <div className="p-3.5 rounded-btn bg-beige/60 border border-border">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={forSomeoneElse}
                      onChange={(e) => setForSomeoneElse(e.target.checked)}
                      className="w-5 h-5 accent-primary"
                    />
                    <span className="text-sm font-bold text-ink flex items-center gap-1.5">
                      <UserCheck className="w-4 h-4 text-secondary" />
                      <span>{t.forSomeoneElse}</span>
                    </span>
                  </label>
                  {forSomeoneElse && (
                    <input
                      type="text"
                      value={helperName}
                      onChange={(e) => setHelperName(e.target.value)}
                      placeholder="Votre prénom / structure (aidant, voisin, travailleur social)"
                      className="mt-3 w-full px-3 py-2.5 rounded-btn border border-border bg-white text-sm"
                    />
                  )}
                </div>

                {/* Étape 3 : Coordonnées */}
                <div className="space-y-3">
                  <label className="block text-sm font-bold text-secondary">
                    3. Vos coordonnées pour recevoir le SMS
                  </label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Prénom de la personne accueillie"
                    className="w-full px-4 py-3 min-h-[48px] rounded-btn border border-border bg-surface text-base"
                  />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Numéro de téléphone mobile (ex : 06 12 34 56 78)"
                    className="w-full px-4 py-3 min-h-[48px] rounded-btn border border-border bg-surface text-base"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-4 min-h-[54px] rounded-btn text-base transition-colors"
                >
                  Confirmer le rendez-vous
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
