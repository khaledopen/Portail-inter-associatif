import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Search,
  FileText,
  Home,
  HeartHandshake,
  Briefcase,
  Users,
  ShieldCheck,
  ArrowRight,
  MapPin,
  CalendarCheck,
  CheckCircle2,
  HelpCircle,
  TrainFront,
} from 'lucide-react';
import { useAccessibility } from '../context/AccessibilityContext';
import { CategoryId, DIGITAL_HELP_CENTERS } from '../data/mockData';

export const HomePage: React.FC = () => {
  const { t, setNearMeModalOpen } = useAccessibility();
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/annuaire?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  const themes: {
    id: CategoryId;
    icon: React.ReactNode;
    bgClass: string;
    iconBgClass: string;
  }[] = [
    {
      id: 'papiers',
      icon: <FileText className="w-8 h-8" />,
      bgClass: 'border-secondary/25 hover:border-secondary',
      iconBgClass: 'bg-secondary-light text-secondary',
    },
    {
      id: 'logement',
      icon: <Home className="w-8 h-8" />,
      bgClass: 'border-primary/25 hover:border-primary',
      iconBgClass: 'bg-primary-light text-primary',
    },
    {
      id: 'sante',
      icon: <HeartHandshake className="w-8 h-8" />,
      bgClass: 'border-secondary/25 hover:border-secondary',
      iconBgClass: 'bg-secondary-light text-secondary',
    },
    {
      id: 'travail',
      icon: <Briefcase className="w-8 h-8" />,
      bgClass: 'border-primary/25 hover:border-primary',
      iconBgClass: 'bg-primary-light text-primary',
    },
    {
      id: 'famille',
      icon: <Users className="w-8 h-8" />,
      bgClass: 'border-secondary/25 hover:border-secondary',
      iconBgClass: 'bg-secondary-light text-secondary',
    },
    {
      id: 'droits',
      icon: <ShieldCheck className="w-8 h-8" />,
      bgClass: 'border-primary/25 hover:border-primary',
      iconBgClass: 'bg-primary-light text-primary',
    },
  ];

  return (
    <div>
      {/* Hero institutionnel et rassurant */}
      <section className="bg-white border-b border-border py-10 sm:py-14 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-light text-primary text-sm font-semibold mb-5">
            <span>{t.heroBadge}</span>
          </div>

          <h1 className="font-display font-extrabold text-3xl sm:text-5xl text-secondary tracking-tight mb-4">
            {t.heroTitle}
          </h1>
          <p className="text-base sm:text-lg text-ink-muted max-w-3xl mx-auto mb-8 leading-relaxed">
            {t.heroSubtitle}
          </p>

          {/* Barre de recherche centrale */}
          <form onSubmit={handleSearch} className="max-w-3xl mx-auto mb-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-5 h-5 text-ink-muted absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t.searchPlaceholder}
                  aria-label={t.searchPlaceholder}
                  className="w-full pl-12 pr-4 py-3.5 min-h-[54px] rounded-btn border-2 border-border focus:border-primary bg-surface text-ink text-base"
                />
              </div>
              <button
                type="submit"
                className="bg-primary hover:bg-primary-hover text-white font-bold px-8 py-3.5 min-h-[54px] rounded-btn transition-colors text-base shrink-0"
              >
                {t.searchButton}
              </button>
            </div>
          </form>

          {/* Actions prioritaires : Parcours 4 écrans + Aide près de chez moi */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/parcours-rapide"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 bg-secondary hover:bg-secondary-hover text-white font-bold px-6 py-3.5 min-h-[52px] rounded-btn transition-colors"
            >
              <CalendarCheck className="w-5 h-5" />
              <span>{t.quickJourneyCta}</span>
              <ArrowRight className="w-5 h-5" />
            </Link>

            <button
              type="button"
              onClick={() => setNearMeModalOpen(true)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-beige hover:bg-beige-dark text-ink font-bold px-6 py-3.5 min-h-[52px] rounded-btn border border-border transition-colors"
            >
              <HelpCircle className="w-5 h-5 text-secondary" />
              <span>{t.helpNearMeBtn}</span>
            </button>
          </div>
        </div>
      </section>

      {/* 6 Grandes Cartes Thématiques */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center max-w-3xl mx-auto mb-9">
          <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-secondary mb-2">
            {t.themesSectionTitle}
          </h2>
          <p className="text-ink-muted text-base">{t.themesSectionSub}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {themes.map((theme) => {
            const catText = t.categoryTitles[theme.id];
            return (
              <Link
                key={theme.id}
                to={theme.id === 'droits' ? '/espace-usager' : `/annuaire?cat=${theme.id}`}
                className={`comfort-card bg-white rounded-card p-6 border-2 ${theme.bgClass} shadow-card hover:shadow-cardHover transition-all flex flex-col justify-between group`}
              >
                <div>
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`w-14 h-14 rounded-[12px] ${theme.iconBgClass} flex items-center justify-center shrink-0`}>
                      {theme.icon}
                    </div>
                    <h3 className="font-display font-extrabold text-xl text-secondary group-hover:text-primary transition-colors">
                      {catText.title}
                    </h3>
                  </div>

                  {/* Phrase FALC */}
                  <p className="text-sm font-semibold text-primary bg-primary-light/60 px-3 py-2 rounded-lg mb-3">
                    {catText.falc}
                  </p>

                  <p className="text-sm text-ink-muted leading-relaxed mb-4">
                    {catText.desc}
                  </p>
                </div>

                <div className="pt-3 border-t border-border flex items-center justify-between text-sm font-bold text-secondary group-hover:text-primary">
                  <span>Voir les associations</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Comment ça marche ? (3 étapes simples) */}
      <section className="bg-white border-y border-border py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-secondary text-center mb-10">
            {t.howItWorksTitle}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="comfort-card p-6 rounded-card bg-surface border border-border text-center">
              <div className="w-14 h-14 rounded-full bg-primary text-white font-display font-extrabold text-xl flex items-center justify-center mx-auto mb-4">
                1
              </div>
              <h3 className="font-bold text-lg text-secondary mb-2">{t.step1Title}</h3>
              <p className="text-sm text-ink-muted leading-relaxed">{t.step1Desc}</p>
            </div>

            <div className="comfort-card p-6 rounded-card bg-surface border border-border text-center">
              <div className="w-14 h-14 rounded-full bg-secondary text-white font-display font-extrabold text-xl flex items-center justify-center mx-auto mb-4">
                2
              </div>
              <h3 className="font-bold text-lg text-secondary mb-2">{t.step2Title}</h3>
              <p className="text-sm text-ink-muted leading-relaxed">{t.step2Desc}</p>
            </div>

            <div className="comfort-card p-6 rounded-card bg-surface border border-border text-center">
              <div className="w-14 h-14 rounded-full bg-primary text-white font-display font-extrabold text-xl flex items-center justify-center mx-auto mb-4">
                3
              </div>
              <h3 className="font-bold text-lg text-secondary mb-2">{t.step3Title}</h3>
              <p className="text-sm text-ink-muted leading-relaxed">{t.step3Desc}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Trouver de l'aide près de chez moi (Médiation numérique) */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="comfort-card bg-beige/60 border border-border rounded-card p-6 sm:p-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-6">
            <div className="max-w-2xl">
              <h2 className="font-display font-extrabold text-2xl text-secondary mb-2">
                {t.nearMeSectionTitle}
              </h2>
              <p className="text-ink-muted text-base leading-relaxed">
                {t.nearMeSectionSub}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setNearMeModalOpen(true)}
              className="bg-secondary hover:bg-secondary-hover text-white font-bold px-6 py-3.5 min-h-[52px] rounded-btn flex items-center justify-center gap-2 shrink-0"
            >
              <MapPin className="w-5 h-5" />
              <span>Voir la carte des lieux d’aide</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {DIGITAL_HELP_CENTERS.map((center) => (
              <div key={center.id} className="bg-white p-4 rounded-btn border border-border">
                <div className="font-bold text-secondary mb-1">{center.name}</div>
                <div className="text-xs font-semibold text-primary mb-2 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{center.type}</span>
                </div>
                <div className="text-sm text-ink mb-1">{center.address}</div>
                <div className="text-xs text-primary font-medium flex items-center gap-1.5">
                  <TrainFront className="w-3.5 h-3.5" />
                  <span>{center.taoStop}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
