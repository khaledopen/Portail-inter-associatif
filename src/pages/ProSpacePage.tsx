import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarClock,
  CalendarRange,
  FolderKanban,
  FileBadge2,
  BookOpen,
  Share2,
  AlertTriangle,
  MessageSquare,
  Clock,
  FileText,
  Settings,
  ShieldCheck,
  CheckCircle2,
  Send,
} from 'lucide-react';
import {
  ASSOCIATIONS,
  PRO_DAILY_APPOINTMENTS,
  PRO_LIAISON_PASSPORTS,
  PRO_URGENCY_ALERTS,
} from '../data/mockData';

type ProSection =
  | 'dashboard'
  | 'today'
  | 'manage-rdv'
  | 'dossiers'
  | 'passport'
  | 'directory'
  | 'orientation'
  | 'urgency'
  | 'messages'
  | 'agenda'
  | 'docs'
  | 'settings';

export const ProSpacePage: React.FC = () => {
  const [activeSection, setActiveSection] = useState<ProSection>('dashboard');
  const [orientationSent, setOrientationSent] = useState(false);
  const [urgencyMessage, setUrgencyMessage] = useState('');
  const [urgencySent, setUrgencySent] = useState(false);

  const sidebarItems: { id: ProSection; label: string; icon: React.ReactNode; isUrgent?: boolean }[] = [
    { id: 'dashboard', label: 'Tableau de bord', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'today', label: 'Rendez-vous du jour', icon: <CalendarClock className="w-4 h-4" /> },
    { id: 'manage-rdv', label: 'Gestion des rendez-vous', icon: <CalendarRange className="w-4 h-4" /> },
    { id: 'dossiers', label: 'Dossiers usagers', icon: <FolderKanban className="w-4 h-4" /> },
    { id: 'passport', label: 'Passeport de liaison', icon: <FileBadge2 className="w-4 h-4" /> },
    { id: 'directory', label: 'Annuaire des associations', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'orientation', label: 'Orientation inter-associative', icon: <Share2 className="w-4 h-4" /> },
    { id: 'urgency', label: 'Relais Urgence', icon: <AlertTriangle className="w-4 h-4" />, isUrgent: true },
    { id: 'messages', label: 'Messagerie interne', icon: <MessageSquare className="w-4 h-4" /> },
    { id: 'agenda', label: 'Agenda des permanences', icon: <Clock className="w-4 h-4" /> },
    { id: 'docs', label: 'Base documentaire', icon: <FileText className="w-4 h-4" /> },
    { id: 'settings', label: 'Paramètres de l’association', icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="inline-block text-xs font-bold px-2.5 py-1 rounded bg-secondary-light text-secondary mb-1">
            Espace Professionnel Sécurisé • ADEL 45 (Orléans)
          </span>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-secondary">
            Tableau de bord Associatif & Inter-Structures
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            to="/inscription-association"
            className="bg-primary hover:bg-primary-hover text-white font-bold px-5 py-3 rounded-btn min-h-[48px] inline-flex items-center gap-2"
          >
            <span>+ Inscrire mon association</span>
          </Link>
          <button
            type="button"
            onClick={() => setActiveSection('urgency')}
            className="bg-urgent hover:bg-urgent-hover text-white font-bold px-5 py-3 rounded-btn min-h-[48px] inline-flex items-center gap-2"
          >
            <AlertTriangle className="w-5 h-5" />
            <span>Bouton Relais Urgence</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Navigation latérale (horizontale scrollable sur mobile, verticale sur desktop) */}
        <aside className="lg:col-span-3 comfort-card bg-white rounded-card border border-border p-3 flex lg:flex-col gap-1.5 overflow-x-auto lg:overflow-visible">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveSection(item.id)}
              className={`lg:w-full text-left px-3.5 py-2.5 rounded-btn text-sm font-semibold min-h-[44px] flex items-center gap-2.5 transition-colors whitespace-nowrap lg:whitespace-normal shrink-0 ${
                item.isUrgent
                  ? activeSection === item.id
                    ? 'bg-urgent text-white'
                    : 'text-urgent hover:bg-urgent-light'
                  : activeSection === item.id
                  ? 'bg-secondary text-white'
                  : 'text-ink hover:bg-surface'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </aside>

        {/* Contenu principal */}
        <div className="lg:col-span-9 space-y-6">
          {activeSection === 'dashboard' && (
            <>
              {/* Indicateurs clés */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="comfort-card bg-white p-4 rounded-card border border-border">
                  <div className="text-xs font-bold text-ink-muted">Rendez-vous du jour</div>
                  <div className="text-3xl font-extrabold text-secondary mt-1">4</div>
                  <div className="text-xs text-primary font-semibold mt-1">1 présent en accueil</div>
                </div>
                <div className="comfort-card bg-white p-4 rounded-card border border-border">
                  <div className="text-xs font-bold text-ink-muted">Demandes en attente</div>
                  <div className="text-3xl font-extrabold text-primary mt-1">7</div>
                  <div className="text-xs text-ink-muted mt-1">Dont 2 cas complexes</div>
                </div>
                <div className="comfort-card bg-white p-4 rounded-card border border-border">
                  <div className="text-xs font-bold text-ink-muted">Dossiers suivis</div>
                  <div className="text-3xl font-extrabold text-secondary mt-1">38</div>
                  <div className="text-xs text-primary font-semibold mt-1">Passeports RGPD actifs</div>
                </div>
                <div className="comfort-card bg-white p-4 rounded-card border border-urgent/30 bg-urgent-light/30">
                  <div className="text-xs font-bold text-urgent">Alertes Relais Urgence</div>
                  <div className="text-3xl font-extrabold text-urgent mt-1">1</div>
                  <div className="text-xs text-ink-muted mt-1">Hébergement / Alimentaire</div>
                </div>
              </div>

              {/* RDV du jour */}
              <div className="comfort-card bg-white rounded-card p-5 border border-border">
                <h2 className="font-bold text-lg text-secondary mb-4">Rendez-vous du jour</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-surface text-ink-muted">
                      <tr>
                        <th className="p-3">Heure</th>
                        <th className="p-3">Usager</th>
                        <th className="p-3">Motif</th>
                        <th className="p-3">Passeport</th>
                        <th className="p-3">Statut</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {PRO_DAILY_APPOINTMENTS.map((rdv) => (
                        <tr key={rdv.id}>
                          <td className="p-3 font-bold text-secondary">{rdv.time}</td>
                          <td className="p-3 font-semibold">{rdv.userInitials} ({rdv.phone})</td>
                          <td className="p-3">{rdv.motif}</td>
                          <td className="p-3">
                            {rdv.hasPassport ? (
                              <button
                                type="button"
                                onClick={() => setActiveSection('passport')}
                                className="text-primary font-bold hover:underline"
                              >
                                Voir 5 lignes clés
                              </button>
                            ) : (
                              <span className="text-ink-muted">Non créé</span>
                            )}
                          </td>
                          <td className="p-3">
                            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-primary-light text-primary">
                              {rdv.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {activeSection === 'passport' && (
            <div className="space-y-4">
              <div className="comfort-card bg-white rounded-card p-6 border border-border">
                <h2 className="font-bold text-xl text-secondary mb-2 flex items-center gap-2">
                  <FileBadge2 className="w-6 h-6 text-primary" />
                  <span>Passeport de liaison inter-structures (5 lignes clés)</span>
                </h2>
                <p className="text-sm text-ink-muted mb-5">
                  Évite à l’usager de répéter son histoire à chaque guichet. Partage soumis au consentement explicite RGPD.
                </p>

                <div className="space-y-4">
                  {PRO_LIAISON_PASSPORTS.map((pass) => (
                    <div key={pass.id} className="p-5 rounded-card bg-surface border border-border">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                        <div className="font-bold text-secondary">
                          Dossier {pass.dossierCode} — Usager {pass.initials}
                        </div>
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-primary-light text-primary">
                          <ShieldCheck className="w-4 h-4" />
                          <span>Consentement RGPD validé le {pass.consentDate}</span>
                        </span>
                      </div>
                      <ul className="space-y-1.5 text-sm text-ink">
                        {pass.summaryLines.map((line, i) => (
                          <li key={i}>{line}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeSection === 'orientation' && (
            <div className="comfort-card bg-white rounded-card p-6 border border-border">
              <h2 className="font-bold text-xl text-secondary mb-2">
                Orientation directe chez une association partenaire (en 30 secondes)
              </h2>
              <p className="text-sm text-ink-muted mb-5">
                Réservez directement un créneau chez un confrère pour l’usager présent à votre bureau.
              </p>

              {orientationSent ? (
                <div className="p-5 rounded-btn bg-primary-light text-primary font-semibold flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 shrink-0" />
                  <span>
                    Créneau réservé chez AELF Loiret et Passeport de liaison transmis (démonstration). L’usager a reçu le SMS de confirmation.
                  </span>
                </div>
              ) : (
                <div className="space-y-4 max-w-xl">
                  <div>
                    <label className="block text-sm font-bold mb-1.5">Usager concerné</label>
                    <select className="w-full p-3 rounded-btn border border-border bg-surface min-h-[48px]">
                      <option>M. K. (Dossier ORL-2026-841 — Consentement RGPD actif)</option>
                      <option>S. B. (Dossier ORL-2026-792 — Consentement RGPD actif)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-1.5">Structure partenaire destinataire</label>
                    <select className="w-full p-3 rounded-btn border border-border bg-surface min-h-[48px]">
                      {ASSOCIATIONS.map((a) => (
                        <option key={a.id}>{a.shortName} — {a.quartier}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-1.5">Créneau disponible</label>
                    <select className="w-full p-3 rounded-btn border border-border bg-surface min-h-[48px]">
                      <option>Vendredi 20 nov. à 10h00</option>
                      <option>Lundi 23 nov. à 14h00</option>
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOrientationSent(true)}
                    className="bg-primary text-white font-bold px-6 py-3.5 rounded-btn min-h-[48px] inline-flex items-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    <span>Réserver et transmettre le Passeport</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {activeSection === 'urgency' && (
            <div className="comfort-card bg-white rounded-card p-6 border-2 border-urgent/40 space-y-5">
              <h2 className="font-bold text-xl text-urgent flex items-center gap-2">
                <AlertTriangle className="w-6 h-6" />
                <span>Fil d’alerte « Relais Urgence » inter-associations</span>
              </h2>

              <div className="space-y-3">
                {PRO_URGENCY_ALERTS.map((alert) => (
                  <div key={alert.id} className="p-4 rounded-btn bg-surface border border-border">
                    <div className="flex flex-wrap justify-between gap-2 text-xs font-bold mb-1">
                      <span className="text-urgent">{alert.type} • {alert.sender}</span>
                      <span className="text-ink-muted">{alert.date}</span>
                    </div>
                    <p className="text-sm text-ink mb-2">{alert.message}</p>
                    <span className="text-xs font-bold px-2.5 py-1 rounded bg-primary-light text-primary">
                      Statut : {alert.status}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-border">
                <label className="block text-sm font-bold text-ink mb-2">
                  Signaler une nouvelle urgence sociale aux partenaires
                </label>
                <textarea
                  rows={3}
                  value={urgencyMessage}
                  onChange={(e) => setUrgencyMessage(e.target.value)}
                  placeholder="Décrivez brièvement le besoin immédiat (sans données nominatives sensibles)..."
                  className="w-full p-3 rounded-btn border border-border bg-surface mb-3"
                />
                <button
                  type="button"
                  onClick={() => {
                    setUrgencySent(true);
                    setUrgencyMessage('');
                  }}
                  className="bg-urgent text-white font-bold px-6 py-3 rounded-btn min-h-[48px]"
                >
                  Diffuser l’alerte Relais Urgence
                </button>
                {urgencySent && (
                  <p className="text-sm text-primary font-bold mt-2">
                    Alerte diffusée aux structures partenaires d’Orléans (démonstration).
                  </p>
                )}
              </div>
            </div>
          )}

          {activeSection === 'today' && (
            <div className="comfort-card bg-white rounded-card p-6 border border-border">
              <h2 className="font-bold text-xl text-secondary mb-4">Rendez-vous du jour — Accueil physique</h2>
              <div className="space-y-3">
                {PRO_DAILY_APPOINTMENTS.map((rdv) => (
                  <div key={rdv.id} className="p-4 rounded-btn bg-surface border border-border flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="font-bold text-secondary">{rdv.time} — {rdv.userInitials} ({rdv.phone})</div>
                      <div className="text-sm text-ink-muted">{rdv.motif}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-primary-light text-primary">{rdv.status}</span>
                      <button
                        type="button"
                        onClick={() => setActiveSection('passport')}
                        className="px-3 py-2 rounded-btn bg-secondary text-white text-xs font-bold min-h-[36px]"
                      >
                        Ouvrir Passeport
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSection === 'manage-rdv' && (
            <div className="comfort-card bg-white rounded-card p-6 border border-border space-y-4">
              <h2 className="font-bold text-xl text-secondary">Gestion des rendez-vous & Bourse aux créneaux</h2>
              <p className="text-sm text-ink-muted">
                Confirmez les demandes en attente ou libérez un créneau annulé pour d’autres usagers.
              </p>
              <div className="space-y-3">
                {PRO_DAILY_APPOINTMENTS.map((rdv) => (
                  <div key={rdv.id} className="p-4 rounded-btn bg-surface border border-border flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="font-bold text-ink">{rdv.time} — {rdv.userInitials}</div>
                      <div className="text-xs text-ink-muted">{rdv.motif}</div>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-secondary-light text-secondary">{rdv.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSection === 'dossiers' && (
            <div className="comfort-card bg-white rounded-card p-6 border border-border space-y-4">
              <h2 className="font-bold text-xl text-secondary">Dossiers usagers partagés</h2>
              <div className="space-y-3">
                {PRO_LIAISON_PASSPORTS.map((p) => (
                  <div key={p.id} className="p-4 rounded-btn bg-surface border border-border flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="font-bold text-secondary">{p.dossierCode} — {p.initials}</div>
                      <div className="text-xs text-ink-muted">{p.summaryLines[0]}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveSection('passport')}
                      className="px-4 py-2 rounded-btn bg-primary text-white text-xs font-bold min-h-[40px]"
                    >
                      Consulter le Passeport
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSection === 'directory' && (
            <div className="comfort-card bg-white rounded-card p-6 border border-border space-y-4">
              <h2 className="font-bold text-xl text-secondary">Annuaire inversé par compétence (Orléans & Loiret)</h2>
              <p className="text-sm text-ink-muted">
                Identifiez immédiatement la structure compétente pour orienter un usager en 30 secondes.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {ASSOCIATIONS.map((a) => (
                  <div key={a.id} className="p-4 rounded-btn bg-surface border border-border">
                    <div className="font-bold text-secondary text-sm">{a.shortName} — {a.quartier}</div>
                    <div className="text-xs text-primary font-semibold mt-1">{a.taoLine} • {a.taoStop}</div>
                    <div className="text-xs text-ink-muted mt-1">{a.falcSummary}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSection === 'messages' && (
            <div className="comfort-card bg-white rounded-card p-6 border border-border space-y-4">
              <h2 className="font-bold text-xl text-secondary">Messagerie interne sécurisée inter-associations</h2>
              <div className="p-4 rounded-btn bg-secondary-light/50 border border-secondary/20 text-sm">
                <div className="font-bold text-secondary text-xs mb-1">AELF Loiret → ADEL 45 (Aujourd’hui, 10h15)</div>
                <p>Bonjour, nous avons bien reçu M. K. suite à votre orientation. Son inscription à l’atelier FLE niveau A2 est validée pour lundi.</p>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Écrire un message à une association partenaire..."
                  className="flex-1 px-4 py-3 rounded-btn border border-border bg-surface"
                />
                <button
                  type="button"
                  onClick={() => alert('Message interne envoyé (démonstration).')}
                  className="bg-secondary text-white font-bold px-5 py-3 rounded-btn min-h-[48px]"
                >
                  Envoyer
                </button>
              </div>
            </div>
          )}

          {activeSection === 'agenda' && (
            <div className="comfort-card bg-white rounded-card p-6 border border-border space-y-4">
              <h2 className="font-bold text-xl text-secondary">Agenda des permanences</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                <div className="p-4 rounded-btn bg-surface border border-border">
                  <div className="font-bold text-secondary">Mardi</div>
                  <div className="text-ink-muted mt-1">09h00 - 12h30 : Accueil Papiers</div>
                  <div className="text-ink-muted">14h00 - 17h00 : Permanence ANEF</div>
                </div>
                <div className="p-4 rounded-btn bg-surface border border-border">
                  <div className="font-bold text-secondary">Mercredi</div>
                  <div className="text-ink-muted mt-1">09h30 - 12h30 : Suivi dossiers</div>
                  <div className="text-ink-muted">14h00 - 16h30 : Juriste droit des étrangers</div>
                </div>
                <div className="p-4 rounded-btn bg-surface border border-border">
                  <div className="font-bold text-secondary">Jeudi</div>
                  <div className="text-ink-muted mt-1">09h00 - 12h00 : Sans RDV (Urgences)</div>
                  <div className="text-ink-muted">14h00 - 17h00 : Regroupement familial</div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'docs' && (
            <div className="comfort-card bg-white rounded-card p-6 border border-border space-y-4">
              <h2 className="font-bold text-xl text-secondary">Base documentaire commune (Cerfa & Guides)</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                {[
                  'Cerfa 14069*05 — Demande de logement social',
                  'Cerfa 15692*01 — Dossier MDPH complet',
                  'Modèle — Attestation d’hébergement (Loiret)',
                  'Guide pratique ANEF — Renouvellement titre de séjour',
                ].map((doc) => (
                  <div key={doc} className="p-4 rounded-btn bg-surface border border-border flex items-center justify-between gap-2">
                    <span className="font-semibold text-ink">{doc}</span>
                    <button
                      type="button"
                      onClick={() => alert(`Téléchargement simulé : ${doc}`)}
                      className="text-primary font-bold text-xs hover:underline shrink-0"
                    >
                      Télécharger
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSection === 'settings' && (
            <div className="comfort-card bg-white rounded-card p-6 border border-border space-y-4 max-w-xl">
              <h2 className="font-bold text-xl text-secondary">Paramètres de l’association</h2>
              <div className="space-y-3 text-sm">
                <div>
                  <label className="block font-bold mb-1">Nom de la structure</label>
                  <input type="text" defaultValue="Accueil & Droits des Étrangers du Loiret (ADEL 45)" className="w-full p-3 rounded-btn border border-border bg-surface" />
                </div>
                <div>
                  <label className="block font-bold mb-1">Téléphone d’accueil</label>
                  <input type="text" defaultValue="02 38 54 12 30" className="w-full p-3 rounded-btn border border-border bg-surface" />
                </div>
                <button
                  type="button"
                  onClick={() => alert('Paramètres enregistrés (démonstration).')}
                  className="bg-primary text-white font-bold px-5 py-3 rounded-btn min-h-[48px]"
                >
                  Enregistrer les modifications
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
