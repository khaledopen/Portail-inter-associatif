import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Volume2,
  VolumeX,
  Eye,
  PhoneCall,
  Menu,
  X,
  Building2,
  MapPin,
  ShieldCheck,
  Sparkles,
  TrainFront,
  Clock,
} from 'lucide-react';
import { useAccessibility } from '../context/AccessibilityContext';
import { LANGUAGES } from '../data/translations';
import { DIGITAL_HELP_CENTERS } from '../data/mockData';
import { InteractiveMap } from './InteractiveMap';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    language,
    setLanguage,
    t,
    comfortMode,
    toggleComfortMode,
    isSpeaking,
    toggleSpeakPage,
    emergencyModalOpen,
    setEmergencyModalOpen,
    nearMeModalOpen,
    setNearMeModalOpen,
  } = useAccessibility();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { path: '/', label: t.navHome },
    { path: '/annuaire', label: t.navDirectory },
    { path: '/parcours-rapide', label: t.navQuickFlow },
    { path: '/espace-usager', label: t.navUserSpace },
    { path: '/espace-pro', label: t.navProSpace },
    { path: '/observatoire', label: t.navAdminSpace },
  ];

  const isActive = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  return (
    <div className="min-h-screen flex flex-col bg-surface text-ink overflow-x-clip">
      {/* Barre supérieure d'accessibilité universelle */}
      <div className="bg-secondary text-white py-2 px-4 border-b border-secondary-hover">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2 text-sm">
          {/* Sélecteur de langue */}
          <div className="flex items-center gap-1.5 flex-wrap" role="group" aria-label="Choix de la langue">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => setLanguage(lang.code)}
                className={`px-2.5 py-1.5 rounded-md font-medium transition-colors min-h-[36px] flex items-center gap-1.5 ${
                  language === lang.code
                    ? 'bg-white text-secondary font-bold'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
                aria-pressed={language === lang.code}
                title={lang.label}
              >
                <span aria-hidden="true">{lang.flag}</span>
                <span className="hidden sm:inline">{lang.nativeName}</span>
              </button>
            ))}
          </div>

          {/* Outils d'accessibilité : Synthèse vocale, Mode Confort, Urgence */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => toggleSpeakPage()}
              className={`px-3 py-1.5 rounded-md font-semibold flex items-center gap-2 min-h-[40px] transition-colors ${
                isSpeaking
                  ? 'bg-beige text-ink'
                  : 'bg-white/15 hover:bg-white/25 text-white'
              }`}
              aria-pressed={isSpeaking}
            >
              {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              <span>{isSpeaking ? t.stopListening : t.listenPage}</span>
            </button>

            <button
              type="button"
              onClick={toggleComfortMode}
              className={`px-3 py-1.5 rounded-md font-semibold flex items-center gap-2 min-h-[40px] transition-colors ${
                comfortMode
                  ? 'bg-white text-black border-2 border-black'
                  : 'bg-white/15 hover:bg-white/25 text-white'
              }`}
              aria-pressed={comfortMode}
            >
              <Eye className="w-4 h-4" />
              <span>{comfortMode ? t.comfortModeActive : t.comfortMode}</span>
            </button>

            <button
              type="button"
              onClick={() => setEmergencyModalOpen(true)}
              className="bg-urgent hover:bg-urgent-hover text-white px-3.5 py-1.5 rounded-md font-bold flex items-center gap-2 min-h-[40px] shadow-sm transition-colors"
            >
              <PhoneCall className="w-4 h-4" />
              <span>{t.emergencyBtn}</span>
            </button>
          </div>
        </div>
      </div>

      {/* En-tête institutionnel principal */}
      <header className="bg-white border-b border-border sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-12 h-12 rounded-[10px] bg-primary text-white flex items-center justify-center shrink-0">
              <Building2 className="w-7 h-7" />
            </div>
            <div>
              <div className="font-display font-extrabold text-lg sm:text-xl text-secondary leading-tight">
                {t.portalTitle}
              </div>
              <div className="text-xs sm:text-sm text-ink-muted font-medium">
                {t.portalSubtitle}
              </div>
            </div>
          </Link>

          {/* Navigation Desktop */}
          <nav className="hidden lg:flex items-center gap-1" aria-label="Navigation principale">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-3.5 py-2.5 rounded-btn text-sm font-semibold transition-colors min-h-[44px] flex items-center ${
                  isActive(item.path)
                    ? 'bg-primary-light text-primary border border-primary/20'
                    : 'text-ink hover:bg-surface hover:text-secondary'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Bouton Menu Mobile */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2.5 rounded-btn border border-border text-ink min-h-[48px] min-w-[48px] flex items-center justify-center"
            aria-expanded={mobileMenuOpen}
            aria-label="Ouvrir le menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Navigation Mobile */}
        {mobileMenuOpen && (
          <nav className="lg:hidden bg-white border-t border-border px-4 py-3 space-y-2" aria-label="Navigation mobile">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-4 py-3 rounded-btn text-base font-semibold min-h-[48px] ${
                  isActive(item.path)
                    ? 'bg-primary-light text-primary'
                    : 'text-ink hover:bg-surface'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        )}
      </header>

      {/* Contenu principal */}
      <main className="flex-1">{children}</main>

      {/* Pied de page institutionnel */}
      <footer className="bg-secondary text-white mt-16 border-t border-secondary-hover">
        <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 font-display font-bold text-lg mb-3">
              <Building2 className="w-5 h-5" />
              <span>Portail Inter-Associatif 45</span>
            </div>
            <p className="text-sm text-white/85 leading-relaxed">
              Guichet numérique unique d’Orléans Métropole et du Loiret pour faciliter l’accès aux droits,
              lutter contre le non-recours et coordonner l’accompagnement social.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-base mb-3">Accès rapides</h3>
            <ul className="space-y-2 text-sm text-white/90">
              <li><Link to="/parcours-rapide" className="hover:underline">Parcours guidé en 4 écrans</Link></li>
              <li><Link to="/annuaire" className="hover:underline">Annuaire & Carte TAO</Link></li>
              <li><Link to="/espace-usager" className="hover:underline">Mon Espace Usager (Code SMS)</Link></li>
              <li><Link to="/espace-pro" className="hover:underline">Espace Associations & Relais</Link></li>
              <li><Link to="/inscription-association" className="hover:underline">Inscrire mon association</Link></li>
              <li><Link to="/observatoire" className="hover:underline">Observatoire Préfecture / État</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-base mb-3">Accessibilité & Données</h3>
            <div className="space-y-2 text-sm text-white/85">
              <p className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>Conforme RGPD — Données anonymisées</span>
              </p>
              <p className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 shrink-0" />
                <span>Langage FALC & Accessibilité WCAG 2.2 AA</span>
              </p>
              <p className="text-xs text-white/70 pt-2">
                Maquette de démonstration Frontend — Les réservations, SMS et dossiers présentés utilisent des données fictives cohérentes.
              </p>
            </div>
          </div>
        </div>
      </footer>

      {/* Modale Urgence Sociale */}
      {emergencyModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="emergency-title"
        >
          <div className="bg-white rounded-card max-w-lg w-full p-6 shadow-xl border-2 border-urgent">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex items-center gap-3 text-urgent">
                <PhoneCall className="w-7 h-7" />
                <h2 id="emergency-title" className="font-display font-extrabold text-xl">
                  Numéros d’Urgence Sociale (Gratuit 24h/24)
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setEmergencyModalOpen(false)}
                className="p-2 rounded-btn hover:bg-surface min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Fermer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-3 mb-6">
              <div className="p-4 rounded-btn bg-urgent-light border border-urgent/30 flex items-center justify-between">
                <div>
                  <div className="font-bold text-ink">115 — SAMU Social / Hébergement d’urgence</div>
                  <div className="text-sm text-ink-muted">Si vous êtes sans abri ce soir à Orléans ou dans le Loiret</div>
                </div>
                <a
                  href="tel:115"
                  className="bg-urgent text-white font-bold px-4 py-2.5 rounded-btn min-h-[48px] flex items-center"
                >
                  Appeler 115
                </a>
              </div>

              <div className="p-4 rounded-btn bg-secondary-light border border-secondary/20 flex items-center justify-between">
                <div>
                  <div className="font-bold text-ink">3919 — Violences Femmes Info</div>
                  <div className="text-sm text-ink-muted">Écoute, information et orientation anonyme</div>
                </div>
                <a
                  href="tel:3919"
                  className="bg-secondary text-white font-bold px-4 py-2.5 rounded-btn min-h-[48px] flex items-center"
                >
                  Appeler 3919
                </a>
              </div>

              <div className="p-4 rounded-btn bg-surface border border-border flex items-center justify-between">
                <div>
                  <div className="font-bold text-ink">114 — Urgence par SMS (personnes sourdes/malentendantes)</div>
                  <div className="text-sm text-ink-muted">Numéro national d’urgence accessible par SMS</div>
                </div>
                <span className="font-bold text-secondary">SMS 114</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setEmergencyModalOpen(false)}
              className="w-full py-3 rounded-btn bg-ink text-white font-bold min-h-[48px]"
            >
              Fermer
            </button>
          </div>
        </div>
      )}

      {/* Modale "Me faire aider près de chez moi" */}
      {nearMeModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="nearme-title"
        >
          <div className="bg-white rounded-card max-w-3xl w-full p-6 shadow-xl border border-border max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h2 id="nearme-title" className="font-display font-extrabold text-xl text-secondary">
                  Points d’aide numérique gratuits près de chez vous
                </h2>
                <p className="text-sm text-ink-muted mt-1">
                  Des médiateurs vous accueillent gratuitement sans rendez-vous pour faire vos démarches sur ordinateur.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setNearMeModalOpen(false)}
                className="p-2 rounded-btn hover:bg-surface min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Fermer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-5">
              <InteractiveMap digitalCenters={DIGITAL_HELP_CENTERS} heightClass="h-[260px]" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
              {DIGITAL_HELP_CENTERS.map((center) => (
                <div key={center.id} className="p-3.5 rounded-btn border border-border bg-surface">
                  <div className="font-bold text-secondary text-sm mb-1">{center.name}</div>
                  <div className="text-xs text-primary font-semibold mb-2">{center.type}</div>
                  <div className="text-xs text-ink flex items-start gap-1.5 mb-1">
                    <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5 text-ink-muted" />
                    <span>{center.address}</span>
                  </div>
                  <div className="text-xs text-primary font-medium flex items-start gap-1.5 mb-1">
                    <TrainFront className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>{center.taoStop}</span>
                  </div>
                  <div className="text-xs text-ink-muted flex items-start gap-1.5">
                    <Clock className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>{center.hours}</span>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setNearMeModalOpen(false)}
              className="w-full py-3 rounded-btn bg-primary text-white font-bold min-h-[48px]"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
