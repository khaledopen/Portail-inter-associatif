import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Home,
  HeartHandshake,
  Briefcase,
  Users,
  ShieldCheck,
  ArrowLeft,
  TrainFront,
  MapPin,
  CheckCircle2,
  UserCheck,
  MessageSquareText,
} from 'lucide-react';
import { ASSOCIATIONS, Association, CategoryId, TimeSlot } from '../data/mockData';
import { useAccessibility } from '../context/AccessibilityContext';

export const QuickBookingFlowPage: React.FC = () => {
  const { t } = useAccessibility();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedCategory, setSelectedCategory] = useState<CategoryId | null>(null);
  const [selectedAsso, setSelectedAsso] = useState<Association | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [firstName, setFirstName] = useState('');
  const [phone, setPhone] = useState('');
  const [forSomeoneElse, setForSomeoneElse] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const themes: { id: CategoryId; icon: React.ReactNode }[] = [
    { id: 'papiers', icon: <FileText className="w-8 h-8" /> },
    { id: 'logement', icon: <Home className="w-8 h-8" /> },
    { id: 'sante', icon: <HeartHandshake className="w-8 h-8" /> },
    { id: 'travail', icon: <Briefcase className="w-8 h-8" /> },
    { id: 'famille', icon: <Users className="w-8 h-8" /> },
    { id: 'droits', icon: <ShieldCheck className="w-8 h-8" /> },
  ];

  const matchingAssociations = selectedCategory
    ? ASSOCIATIONS.filter(
        (a) => a.category === selectedCategory || a.secondaryCategories?.includes(selectedCategory)
      ).slice(0, 3)
    : [];

  const handleSelectCategory = (cat: CategoryId) => {
    setSelectedCategory(cat);
    setSelectedAsso(null);
    setSelectedSlot(null);
    setStep(2);
  };

  const handleSelectAsso = (asso: Association) => {
    setSelectedAsso(asso);
    setSelectedSlot(null);
    setStep(3);
  };

  const handleSelectSlot = (slot: TimeSlot) => {
    setSelectedSlot(slot);
    setStep(4);
  };

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !phone.trim()) return;
    setConfirmed(true);
  };

  const stepLabels = ['1. Le besoin', '2. Le lieu', '3. Le créneau', '4. La confirmation'];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-10">
      <div className="mb-6">
        <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-secondary mb-2">
          Parcours guidé « Zéro Difficulté »
        </h1>
        <p className="text-ink-muted text-base">
          1 écran = 1 question simple. Laissez-vous guider en 4 étapes.
        </p>
      </div>

      {/* Indicateur de progression */}
      <div className="mb-8" aria-label="Progression">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {stepLabels.map((label, idx) => {
            const stepNum = (idx + 1) as 1 | 2 | 3 | 4;
            const isCurrent = step === stepNum;
            const isDone = step > stepNum || confirmed;
            return (
              <div
                key={label}
                className={`p-3 rounded-btn border text-center text-xs sm:text-sm font-bold transition-colors ${
                  isCurrent
                    ? 'bg-secondary text-white border-secondary'
                    : isDone
                    ? 'bg-primary-light text-primary border-primary/30'
                    : 'bg-white text-ink-muted border-border'
                }`}
              >
                {label}
              </div>
            );
          })}
        </div>
      </div>

      {/* ÉCRAN 1 : LE BESOIN */}
      {step === 1 && (
        <div className="comfort-card bg-white rounded-card p-6 border border-border shadow-card">
          <h2 className="font-display font-extrabold text-xl sm:text-2xl text-secondary mb-5">
            Quel est votre besoin aujourd’hui ?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {themes.map((item) => {
              const cat = t.categoryTitles[item.id];
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectCategory(item.id)}
                  className="p-5 rounded-card border-2 border-border hover:border-primary bg-surface hover:bg-primary-light/40 text-left transition-all flex items-center gap-4 min-h-[96px]"
                >
                  <div className="w-14 h-14 rounded-[12px] bg-primary-light text-primary flex items-center justify-center shrink-0">
                    {item.icon}
                  </div>
                  <div>
                    <div className="font-display font-extrabold text-lg text-secondary">
                      {cat.title}
                    </div>
                    <div className="text-xs text-ink-muted mt-1 line-clamp-2">{cat.falc}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ÉCRAN 2 : LE LIEU */}
      {step === 2 && (
        <div className="comfort-card bg-white rounded-card p-6 border border-border shadow-card space-y-5">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-display font-extrabold text-xl sm:text-2xl text-secondary">
              Choisissez une association proche
            </h2>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="inline-flex items-center gap-1.5 text-sm font-bold text-secondary hover:underline min-h-[44px]"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Retour</span>
            </button>
          </div>

          <div className="space-y-4">
            {matchingAssociations.map((asso) => (
              <div
                key={asso.id}
                className="p-5 rounded-card border-2 border-border bg-surface flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5">
                  <div className="font-display font-extrabold text-lg text-secondary">
                    {asso.name}
                  </div>
                  <div className="text-sm text-ink flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-ink-muted shrink-0" />
                    <span>{asso.address}, {asso.city} (à {asso.distanceKm} km)</span>
                  </div>
                  <div className="text-sm font-bold text-primary flex items-center gap-2">
                    <TrainFront className="w-4 h-4 shrink-0" />
                    <span>{asso.taoLine} — {asso.taoStop}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleSelectAsso(asso)}
                  className="bg-primary hover:bg-primary-hover text-white font-bold px-6 py-3.5 min-h-[52px] rounded-btn shrink-0"
                >
                  Choisir
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ÉCRAN 3 : LE CRÉNEAU */}
      {step === 3 && selectedAsso && (
        <div className="comfort-card bg-white rounded-card p-6 border border-border shadow-card space-y-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="font-display font-extrabold text-xl sm:text-2xl text-secondary">
                Choisissez votre jour et votre heure
              </h2>
              <p className="text-sm text-ink-muted mt-1">{selectedAsso.name}</p>
            </div>
            <button
              type="button"
              onClick={() => setStep(2)}
              className="inline-flex items-center gap-1.5 text-sm font-bold text-secondary hover:underline min-h-[44px]"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Retour</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {selectedAsso.slots
              .filter((s) => s.available)
              .map((slot) => (
                <button
                  key={slot.id}
                  type="button"
                  onClick={() => handleSelectSlot(slot)}
                  className="p-4 rounded-btn border-2 border-primary/40 bg-primary-light/50 hover:bg-primary hover:text-white text-left transition-colors min-h-[64px] group"
                >
                  <div className="text-sm font-semibold opacity-80">{slot.dayLabel}</div>
                  <div className="text-xl font-extrabold">{slot.time}</div>
                </button>
              ))}
          </div>
        </div>
      )}

      {/* ÉCRAN 4 : LA CONFIRMATION */}
      {step === 4 && selectedAsso && selectedSlot && (
        <div className="comfort-card bg-white rounded-card p-6 border border-border shadow-card space-y-5">
          {!confirmed ? (
            <>
              <div className="flex items-center justify-between gap-4">
                <h2 className="font-display font-extrabold text-xl sm:text-2xl text-secondary">
                  Dernière étape : votre prénom et téléphone
                </h2>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="inline-flex items-center gap-1.5 text-sm font-bold text-secondary hover:underline min-h-[44px]"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Retour</span>
                </button>
              </div>

              <div className="p-4 rounded-btn bg-secondary-light text-secondary text-sm font-semibold">
                Rendez-vous choisi : {selectedAsso.shortName} — {selectedSlot.dayLabel} à {selectedSlot.time}
              </div>

              <form onSubmit={handleConfirm} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-ink mb-1.5">Votre prénom</label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Ex : Fatou, Jean, Olena..."
                    className="w-full px-4 py-3.5 min-h-[52px] rounded-btn border border-border bg-surface text-base"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-ink mb-1.5">
                    Votre numéro de téléphone mobile (pour recevoir le SMS)
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Ex : 06 12 34 56 78"
                    className="w-full px-4 py-3.5 min-h-[52px] rounded-btn border border-border bg-surface text-base"
                  />
                </div>

                <label className="flex items-center gap-3 p-3.5 rounded-btn bg-beige/60 border border-border cursor-pointer">
                  <input
                    type="checkbox"
                    checked={forSomeoneElse}
                    onChange={(e) => setForSomeoneElse(e.target.checked)}
                    className="w-5 h-5 accent-primary"
                  />
                  <span className="text-sm font-bold text-ink flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-secondary" />
                    <span>{t.forSomeoneElse}</span>
                  </span>
                </label>

                <button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-4 min-h-[56px] rounded-btn text-lg transition-colors"
                >
                  Valider mon rendez-vous
                </button>
              </form>
            </>
          ) : (
            <div className="space-y-5">
              <div className="flex items-center gap-3 text-primary">
                <CheckCircle2 className="w-10 h-10 shrink-0" />
                <div>
                  <h2 className="font-display font-extrabold text-2xl">
                    C’est confirmé, {firstName} !
                  </h2>
                  <p className="text-sm text-ink-muted">
                    Voici le récapitulatif qui serait envoyé par SMS au {phone} :
                  </p>
                </div>
              </div>

              {/* Aperçu du SMS */}
              <div className="p-5 rounded-card bg-surface border-2 border-primary/30 space-y-2 text-sm">
                <div className="flex items-center gap-2 font-bold text-primary mb-2">
                  <MessageSquareText className="w-5 h-5" />
                  <span>Aperçu du SMS récapitulatif (Démonstration)</span>
                </div>
                <p><strong>Lieu :</strong> {selectedAsso.name}</p>
                <p><strong>Date :</strong> {selectedSlot.dayLabel} à {selectedSlot.time}</p>
                <p><strong>Adresse :</strong> {selectedAsso.address}, {selectedAsso.city}</p>
                <p><strong>Transport :</strong> {selectedAsso.taoLine} — {selectedAsso.taoStop}</p>
                <div className="pt-2 border-t border-border">
                  <strong>Papiers à apporter :</strong>
                  <ul className="list-disc pl-5 mt-1 space-y-1">
                    {selectedAsso.documentsRequired.firstVisit.map((doc, i) => (
                      <li key={i}>{doc}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  to="/"
                  className="flex-1 text-center bg-secondary text-white font-bold py-3.5 min-h-[52px] rounded-btn flex items-center justify-center"
                >
                  Retour à l’accueil
                </Link>
                <Link
                  to="/espace-usager"
                  className="flex-1 text-center bg-primary-light text-primary font-bold py-3.5 min-h-[52px] rounded-btn flex items-center justify-center"
                >
                  Voir Mon Espace Usager
                </Link>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
