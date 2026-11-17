import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, CheckCircle2, ShieldCheck, ArrowLeft, Loader2 } from 'lucide-react';
import { CategoryId } from '../data/mockData';
import { submitAssociationApplication } from '../data/associationApplications';

export const AssociationSignupPage: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedNumber, setSubmittedNumber] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [name, setName] = useState('');
  const [rna, setRna] = useState('');
  const [category, setCategory] = useState<CategoryId>('papiers');
  const [address, setAddress] = useState('');
  const [taoStop, setTaoStop] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [hours, setHours] = useState('');
  const [mission, setMission] = useState('');
  const [rgpdAccepted, setRgpdAccepted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rgpdAccepted || isSubmitting) return;
    setIsSubmitting(true);
    setSubmitError('');
    try {
      await submitAssociationApplication({
        name, rna, category, address, taoStop, phone, email, hours, mission, rgpdAccepted,
      });
      setSubmittedNumber(rna.trim());
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'L’envoi a échoué. Réessayez.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:py-10">
      <Link
        to="/espace-pro"
        className="inline-flex items-center gap-2 text-secondary font-bold hover:underline mb-6 min-h-[44px]"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>Retour à l’Espace Associations</span>
      </Link>

      <div className="comfort-card bg-white rounded-card p-6 sm:p-8 border border-border shadow-card">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-[10px] bg-primary-light text-primary flex items-center justify-center shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-secondary">
              Inscrire mon association sur le portail
            </h1>
            <p className="text-sm text-ink-muted">
              Réseau solidaire d’Orléans Métropole & du Loiret (45)
            </p>
          </div>
        </div>

        {submittedNumber ? (
          <div role="status" className="mt-6 p-6 rounded-card bg-primary-light border border-primary/30 space-y-4">
            <div className="flex items-center gap-3 text-primary">
              <CheckCircle2 className="w-8 h-8 shrink-0" />
              <h2 className="font-display font-extrabold text-xl">
                Demande d’inscription enregistrée !
              </h2>
            </div>
            <p className="text-sm text-ink">
              Une demande pour le numéro <strong>{submittedNumber}</strong> est en attente de vérification. Si une demande existait déjà, elle reste inchangée.
            </p>
            <p className="text-sm text-ink">
              Après validation par l’équipe de coordination, vous recevrez à l’adresse e-mail de contact une invitation pour choisir votre mot de passe et accéder à l’espace associations.
            </p>
            <Link
              to="/"
              className="inline-flex items-center justify-center bg-secondary text-white font-bold px-6 py-3 rounded-btn min-h-[48px]"
            >
              Retour à l’accueil
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="association-name" className="block text-sm font-bold text-ink mb-1.5">
                  Nom de l’association *
                </label>
                <input
                  type="text"
                  required
                  id="association-name"
                  value={name}
                  maxLength={160}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex : Entraide Solidaire Loiret"
                  className="w-full px-4 py-3 min-h-[48px] rounded-btn border border-border bg-surface"
                />
              </div>

              <div>
                <label htmlFor="association-rna" className="block text-sm font-bold text-ink mb-1.5">
                  Numéro RNA ou SIRET *
                </label>
                <input
                  type="text"
                  required
                  id="association-rna"
                  value={rna}
                  maxLength={24}
                  onChange={(e) => setRna(e.target.value)}
                  placeholder="Ex : W452001234"
                  className="w-full px-4 py-3 min-h-[48px] rounded-btn border border-border bg-surface"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="association-category" className="block text-sm font-bold text-ink mb-1.5">
                  Thématique principale *
                </label>
                <select
                  id="association-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as CategoryId)}
                  className="w-full px-4 py-3 min-h-[48px] rounded-btn border border-border bg-surface"
                >
                  <option value="papiers">Mes Papiers & Séjour</option>
                  <option value="logement">Mon Logement & Énergie</option>
                  <option value="sante">Santé & Handicap</option>
                  <option value="travail">Travail & Formation</option>
                  <option value="famille">Famille & Budget</option>
                  <option value="droits">Mes Droits & Médiation numérique</option>
                </select>
              </div>

              <div>
                <label htmlFor="association-phone" className="block text-sm font-bold text-ink mb-1.5">
                  Téléphone d’accueil *
                </label>
                <input
                  type="tel"
                  required
                  id="association-phone"
                  value={phone}
                  maxLength={30}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Ex : 02 38 00 00 00"
                  className="w-full px-4 py-3 min-h-[48px] rounded-btn border border-border bg-surface"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="association-address" className="block text-sm font-bold text-ink mb-1.5">
                  Adresse complète (Orléans / Loiret) *
                </label>
                <input
                  type="text"
                  required
                  id="association-address"
                  value={address}
                  maxLength={250}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Ex : 12 Rue de la République, 45000 Orléans"
                  className="w-full px-4 py-3 min-h-[48px] rounded-btn border border-border bg-surface"
                />
              </div>

              <div>
                <label htmlFor="association-taoStop" className="block text-sm font-bold text-ink mb-1.5">
                  Arrêt Tram / Bus TAO le plus proche *
                </label>
                <input
                  type="text"
                  required
                  id="association-taoStop"
                  value={taoStop}
                  maxLength={160}
                  onChange={(e) => setTaoStop(e.target.value)}
                  placeholder="Ex : Tram A — Arrêt République"
                  className="w-full px-4 py-3 min-h-[48px] rounded-btn border border-border bg-surface"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="association-email" className="block text-sm font-bold text-ink mb-1.5">
                  Email du référent *
                </label>
                <input
                  type="email"
                  required
                  id="association-email"
                  value={email}
                  maxLength={254}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contact@association.fr"
                  className="w-full px-4 py-3 min-h-[48px] rounded-btn border border-border bg-surface"
                />
              </div>

              <div>
                <label htmlFor="association-hours" className="block text-sm font-bold text-ink mb-1.5">
                  Horaires d’ouverture *
                </label>
                <input
                  type="text"
                  required
                  id="association-hours"
                  value={hours}
                  maxLength={300}
                  onChange={(e) => setHours(e.target.value)}
                  placeholder="Ex : Lun - Ven : 9h00 - 17h00"
                  className="w-full px-4 py-3 min-h-[48px] rounded-btn border border-border bg-surface"
                />
              </div>
            </div>

            <div>
              <label htmlFor="association-mission" className="block text-sm font-bold text-ink mb-1.5">
                Missions et public accueilli (en langage simple) *
              </label>
              <textarea
                rows={3}
                required
                id="association-mission"
                value={mission}
                maxLength={2000}
                onChange={(e) => setMission(e.target.value)}
                placeholder="Décrivez en quelques phrases comment votre association aide les habitants..."
                className="w-full p-3.5 rounded-btn border border-border bg-surface"
              />
            </div>

            <label className="flex items-start gap-3 p-4 rounded-btn bg-surface border border-border cursor-pointer">
              <input
                type="checkbox"
                required
                checked={rgpdAccepted}
                onChange={(e) => setRgpdAccepted(e.target.checked)}
                className="w-5 h-5 mt-0.5 accent-primary"
              />
              <span className="text-sm text-ink">
                <strong className="flex items-center gap-1.5 text-secondary mb-0.5">
                  <ShieldCheck className="w-4 h-4 text-primary" />
                  Engagement RGPD & Charte Inter-Associative
                </strong>
                Notre association s’engage à respecter la confidentialité des données usagers et à recueillir leur consentement explicite avant tout partage via le Passeport de liaison.
              </span>
            </label>

            {submitError && <p role="alert" className="text-sm font-semibold text-ink">{submitError}</p>}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary hover:bg-primary-hover disabled:opacity-70 text-white font-bold py-4 min-h-[54px] rounded-btn text-base transition-colors flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Envoi de la demande en cours...</span>
                </>
              ) : (
                <span>Envoyer la demande d’inscription</span>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
