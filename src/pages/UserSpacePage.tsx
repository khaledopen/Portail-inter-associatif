import React, { useState } from 'react';
import {
  Smartphone,
  ShieldCheck,
  Calendar,
  FolderLock,
  MessageSquare,
  HelpCircle,
  User,
  Phone,
  MapPin,
  TrainFront,
  FileText,
  Upload,
  CheckCircle2,
  LogOut,
} from 'lucide-react';
import {
  USER_DEMO_APPOINTMENTS,
  USER_PAST_APPOINTMENTS,
  USER_VAULT_DOCUMENTS,
} from '../data/mockData';

export const UserSpacePage: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [phoneInput, setPhoneInput] = useState('06 12 34 56 78');
  const [smsStep, setSmsStep] = useState<'phone' | 'code'>('phone');
  const [smsCode, setSmsCode] = useState('');
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'rdv' | 'vault' | 'messages' | 'complex' | 'profile'
  >('dashboard');
  const [complexStep, setComplexStep] = useState<1 | 2 | 3>(1);
  const [complexSent, setComplexSent] = useState(false);
  const [appointments, setAppointments] = useState(USER_DEMO_APPOINTMENTS);

  const handleCancelAppointment = (id: string) => {
    setAppointments((prev) => prev.filter((rdv) => rdv.id !== id));
  };

  const handleSendCode = (e: React.FormEvent) => {
    e.preventDefault();
    setSmsStep('code');
  };

  const handleVerifyCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (smsCode.trim().length >= 4) {
      setIsAuthenticated(true);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto px-4 py-12">
        <div className="comfort-card bg-white rounded-card p-6 sm:p-8 border border-border shadow-card">
          <div className="w-14 h-14 rounded-full bg-primary-light text-primary flex items-center justify-center mx-auto mb-4">
            <Smartphone className="w-7 h-7" />
          </div>
          <h1 className="font-display font-extrabold text-2xl text-secondary text-center mb-2">
            Mon Espace Usager
          </h1>
          <p className="text-sm text-ink-muted text-center mb-6">
            Connexion simple avec votre numéro de téléphone. Aucune adresse email ni mot de passe obligatoire.
          </p>

          {smsStep === 'phone' ? (
            <form onSubmit={handleSendCode} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-ink mb-1.5">
                  Numéro de téléphone mobile
                </label>
                <input
                  type="tel"
                  required
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  className="w-full px-4 py-3.5 min-h-[52px] rounded-btn border border-border bg-surface text-base"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-3.5 min-h-[52px] rounded-btn"
              >
                Recevoir mon code par SMS
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyCode} className="space-y-4">
              <div className="p-3 rounded-btn bg-primary-light text-primary text-sm font-medium">
                Code de démonstration envoyé au {phoneInput} : <strong>4500</strong>
              </div>
              <div>
                <label className="block text-sm font-bold text-ink mb-1.5">
                  Entrez le code à 4 chiffres reçu par SMS
                </label>
                <input
                  type="text"
                  maxLength={4}
                  required
                  value={smsCode}
                  onChange={(e) => setSmsCode(e.target.value)}
                  placeholder="Ex : 4500"
                  className="w-full px-4 py-3.5 min-h-[52px] rounded-btn border border-border bg-surface text-center text-2xl font-bold tracking-widest"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-3.5 min-h-[52px] rounded-btn"
              >
                Me connecter
              </button>
            </form>
          )}

          <div className="mt-5 pt-4 border-t border-border text-center">
            <button
              type="button"
              onClick={() => setIsAuthenticated(true)}
              className="text-sm font-bold text-secondary hover:underline"
            >
              Accès rapide démonstration (sans code)
            </button>
          </div>
        </div>
      </div>
    );
  }

  const nextRdv = appointments[0];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-secondary">
            Bonjour, Fatou K.
          </h1>
          <p className="text-sm text-ink-muted">
            Espace personnel sécurisé • Connectée avec le {phoneInput}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsAuthenticated(false)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-btn border border-border bg-white text-ink font-semibold text-sm min-h-[44px]"
        >
          <LogOut className="w-4 h-4" />
          <span>Se déconnecter</span>
        </button>
      </div>

      {/* Onglets de navigation simples */}
      <div className="flex flex-wrap gap-2 mb-6">
        {[
          { id: 'dashboard', label: 'Tableau de bord', icon: <Calendar className="w-4 h-4" /> },
          { id: 'rdv', label: 'Mes rendez-vous', icon: <CheckCircle2 className="w-4 h-4" /> },
          { id: 'vault', label: 'Coffre-fort documents', icon: <FolderLock className="w-4 h-4" /> },
          { id: 'messages', label: 'Messagerie', icon: <MessageSquare className="w-4 h-4" /> },
          { id: 'complex', label: 'Cas complexes', icon: <HelpCircle className="w-4 h-4" /> },
          { id: 'profile', label: 'Mes informations', icon: <User className="w-4 h-4" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`px-4 py-2.5 rounded-btn font-bold text-sm min-h-[48px] inline-flex items-center gap-2 transition-colors ${
              activeTab === tab.id
                ? 'bg-secondary text-white'
                : 'bg-white text-ink border border-border hover:bg-surface'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Contenu : Tableau de bord simplifié */}
      {activeTab === 'dashboard' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 comfort-card bg-white rounded-card p-6 border-2 border-primary/30 shadow-card">
            <span className="inline-block text-xs font-bold px-3 py-1 rounded-full bg-primary-light text-primary mb-3">
              Mon prochain rendez-vous
            </span>
            <h2 className="font-display font-extrabold text-2xl text-secondary mb-2">
              {nextRdv.date} à {nextRdv.time}
            </h2>
            <p className="font-bold text-lg text-ink mb-3">{nextRdv.associationName}</p>
            <div className="space-y-2 text-sm text-ink-muted mb-5">
              <p className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-secondary" />
                <span>{nextRdv.address}</span>
              </p>
              <p className="flex items-center gap-2 text-primary font-semibold">
                <TrainFront className="w-4 h-4" />
                <span>{nextRdv.taoStop}</span>
              </p>
            </div>
            <a
              href={`tel:${nextRdv.phone.replace(/\s/g, '')}`}
              className="inline-flex items-center gap-2 bg-primary text-white font-bold px-5 py-3 rounded-btn min-h-[48px]"
            >
              <Phone className="w-4 h-4" />
              <span>Appeler l’association ({nextRdv.phone})</span>
            </a>
          </div>

          <div className="comfort-card bg-white rounded-card p-6 border border-border shadow-card space-y-4">
            <h3 className="font-bold text-lg text-secondary">Suivi de mes démarches</h3>
            <div className="p-3.5 rounded-btn bg-surface border border-border">
              <div className="text-xs font-bold text-primary">En cours</div>
              <div className="font-bold text-sm text-ink">Renouvellement titre de séjour</div>
              <div className="text-xs text-ink-muted mt-1">ADEL 45 • Pièces vérifiées</div>
            </div>
            <div className="p-3.5 rounded-btn bg-surface border border-border">
              <div className="text-xs font-bold text-secondary">Terminé</div>
              <div className="font-bold text-sm text-ink">Ouverture dossier CAF / APL</div>
              <div className="text-xs text-ink-muted mt-1">PIMMS Loiret • 28/10/2026</div>
            </div>
          </div>
        </div>
      )}

      {/* Mes rendez-vous */}
      {activeTab === 'rdv' && (
        <div className="space-y-6">
          <div className="comfort-card bg-white rounded-card p-6 border border-border">
            <h2 className="font-bold text-xl text-secondary mb-4">Rendez-vous à venir</h2>
            <div className="space-y-3">
              {appointments.length === 0 ? (
                <p className="text-sm text-ink-muted">Aucun rendez-vous à venir.</p>
              ) : (
                appointments.map((rdv) => (
                  <div key={rdv.id} className="p-4 rounded-btn bg-surface border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="font-bold text-secondary">{rdv.date} — {rdv.time}</div>
                      <div className="font-semibold text-ink">{rdv.associationName}</div>
                      <div className="text-sm text-ink-muted">{rdv.motif}</div>
                    </div>
                    <div className="flex items-center gap-2 self-start sm:self-center">
                      <span className="px-3 py-1.5 rounded-full bg-primary-light text-primary text-xs font-bold">
                        {rdv.status}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCancelAppointment(rdv.id)}
                        className="px-3 py-1.5 rounded-btn bg-urgent-light text-urgent text-xs font-bold hover:bg-urgent hover:text-white transition-colors min-h-[36px]"
                      >
                        Annuler en 1 clic
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="comfort-card bg-white rounded-card p-6 border border-border">
            <h2 className="font-bold text-xl text-secondary mb-4">Historique & Associations consultées</h2>
            <div className="space-y-3">
              {USER_PAST_APPOINTMENTS.map((rdv) => (
                <div key={rdv.id} className="p-4 rounded-btn bg-surface border border-border flex items-center justify-between">
                  <div>
                    <div className="font-bold text-ink">{rdv.associationName}</div>
                    <div className="text-sm text-ink-muted">{rdv.date} • {rdv.motif}</div>
                  </div>
                  <span className="text-xs font-bold text-ink-muted">{rdv.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Coffre-fort de documents */}
      {activeTab === 'vault' && (
        <div className="comfort-card bg-white rounded-card p-6 border border-border">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
            <div>
              <h2 className="font-bold text-xl text-secondary">Mon Coffre-fort de documents</h2>
              <p className="text-sm text-ink-muted">
                Stockez vos justificatifs en sécurité pour les présenter lors de vos rendez-vous.
              </p>
            </div>
            <button
              type="button"
              onClick={() => alert('Démonstration : sélection de fichier simulée.')}
              className="bg-primary text-white font-bold px-4 py-2.5 rounded-btn min-h-[48px] inline-flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              <span>Ajouter un document</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {USER_VAULT_DOCUMENTS.map((doc) => (
              <div key={doc.id} className="p-4 rounded-btn bg-surface border border-border flex items-start gap-3">
                <FileText className="w-6 h-6 text-secondary shrink-0" />
                <div>
                  <div className="font-bold text-sm text-ink break-all">{doc.name}</div>
                  <div className="text-xs text-primary font-semibold mt-1">{doc.category}</div>
                  <div className="text-xs text-ink-muted mt-1">Ajouté le {doc.addedAt} • {doc.size}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Messagerie */}
      {activeTab === 'messages' && (
        <div className="comfort-card bg-white rounded-card p-6 border border-border space-y-4">
          <h2 className="font-bold text-xl text-secondary">Messagerie avec les associations</h2>
          <div className="p-4 rounded-btn bg-primary-light/50 border border-primary/20">
            <div className="text-xs font-bold text-primary mb-1">ADEL 45 — Hier à 15h20</div>
            <p className="text-sm text-ink">
              Bonjour Fatou, n’oubliez pas d’apporter votre récépissé actuel et votre justificatif de domicile pour votre rendez-vous de mardi à 14h00.
            </p>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Écrire une réponse simple à l’association..."
              className="flex-1 px-4 py-3 rounded-btn border border-border bg-surface"
            />
            <button
              type="button"
              onClick={() => alert('Message envoyé (mode démonstration).')}
              className="bg-secondary text-white font-bold px-6 py-3 rounded-btn min-h-[48px]"
            >
              Envoyer
            </button>
          </div>
        </div>
      )}

      {/* Formulaire Cas Complexes */}
      {activeTab === 'complex' && (
        <div className="comfort-card bg-white rounded-card p-6 border border-border max-w-2xl">
          <h2 className="font-bold text-xl text-secondary mb-2">Formulaire « Cas complexes »</h2>
          <p className="text-sm text-ink-muted mb-5">
            Votre situation concerne plusieurs problèmes en même temps ? Répondez en 3 étapes pour être orienté vers un référent unique.
          </p>

          {complexSent ? (
            <div className="p-5 rounded-btn bg-primary-light text-primary font-semibold">
              Votre demande a bien été transmise à un référent social d’Orléans (démonstration). Vous serez rappelé sous 48h.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-sm font-bold text-secondary">Étape {complexStep} sur 3</div>
              {complexStep === 1 && (
                <div>
                  <label className="block text-sm font-bold mb-2">1. Quelles difficultés rencontrez-vous ?</label>
                  <textarea
                    rows={3}
                    placeholder="Ex : J'ai un problème de titre de séjour ET de logement..."
                    className="w-full p-3 rounded-btn border border-border bg-surface"
                  />
                  <button
                    type="button"
                    onClick={() => setComplexStep(2)}
                    className="mt-3 bg-primary text-white font-bold px-6 py-3 rounded-btn min-h-[48px]"
                  >
                    Étape suivante
                  </button>
                </div>
              )}
              {complexStep === 2 && (
                <div>
                  <label className="block text-sm font-bold mb-2">2. Avez-vous une urgence cette semaine ?</label>
                  <select className="w-full p-3 rounded-btn border border-border bg-surface min-h-[48px]">
                    <option>Oui, risque d’expulsion ou sans hébergement</option>
                    <option>Oui, besoin alimentaire immédiat</option>
                    <option>Non, mais j’ai besoin d’un suivi global</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => setComplexStep(3)}
                    className="mt-3 bg-primary text-white font-bold px-6 py-3 rounded-btn min-h-[48px]"
                  >
                    Étape suivante
                  </button>
                </div>
              )}
              {complexStep === 3 && (
                <div>
                  <label className="block text-sm font-bold mb-2">3. Préférence de contact</label>
                  <p className="text-sm text-ink-muted mb-3">Un référent vous contactera par téléphone au {phoneInput}.</p>
                  <button
                    type="button"
                    onClick={() => setComplexSent(true)}
                    className="bg-primary text-white font-bold px-6 py-3 rounded-btn min-h-[48px]"
                  >
                    Envoyer ma demande
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Informations personnelles */}
      {activeTab === 'profile' && (
        <div className="comfort-card bg-white rounded-card p-6 border border-border max-w-2xl space-y-4">
          <h2 className="font-bold text-xl text-secondary">Mes informations personnelles</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="p-3.5 rounded-btn bg-surface border border-border">
              <div className="text-ink-muted">Prénom & Nom</div>
              <div className="font-bold text-ink">Fatou K.</div>
            </div>
            <div className="p-3.5 rounded-btn bg-surface border border-border">
              <div className="text-ink-muted">Téléphone mobile</div>
              <div className="font-bold text-ink">{phoneInput}</div>
            </div>
            <div className="p-3.5 rounded-btn bg-surface border border-border sm:col-span-2 flex items-center gap-3">
              <ShieldCheck className="w-6 h-6 text-primary shrink-0" />
              <div>
                <div className="font-bold text-ink">Consentement RGPD actif</div>
                <div className="text-xs text-ink-muted">
                  Vous avez autorisé le partage de votre Passeport de liaison entre les associations qui vous accompagnent.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
