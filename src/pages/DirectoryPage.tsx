import React, { useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Search,
  MapPin,
  Clock,
  TrainFront,
  CalendarCheck,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { ASSOCIATIONS, CategoryId } from '../data/mockData';
import { useAccessibility } from '../context/AccessibilityContext';
import { InteractiveMap } from '../components/InteractiveMap';

export const DirectoryPage: React.FC = () => {
  const { t } = useAccessibility();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCat = (searchParams.get('cat') as CategoryId | 'all') || 'all';
  const initialQ = searchParams.get('q') || '';

  const [selectedCategory, setSelectedCategory] = useState<CategoryId | 'all'>(initialCat);
  const [searchQuery, setSearchQuery] = useState(initialQ);
  const [onlyThisWeek, setOnlyThisWeek] = useState(false);
  const [selectedAssoId, setSelectedAssoId] = useState<string | undefined>(undefined);

  const categories: { id: CategoryId | 'all'; label: string }[] = [
    { id: 'all', label: 'Toutes les aides' },
    { id: 'papiers', label: t.categoryTitles.papiers.title },
    { id: 'logement', label: t.categoryTitles.logement.title },
    { id: 'sante', label: t.categoryTitles.sante.title },
    { id: 'travail', label: t.categoryTitles.travail.title },
    { id: 'famille', label: t.categoryTitles.famille.title },
    { id: 'droits', label: t.categoryTitles.droits.title },
  ];

  const filteredAssociations = useMemo(() => {
    return ASSOCIATIONS.filter((asso) => {
      const matchesCat =
        selectedCategory === 'all' ||
        asso.category === selectedCategory ||
        asso.secondaryCategories?.includes(selectedCategory);

      const matchesWeek = !onlyThisWeek || asso.hasSlotThisWeek;

      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        asso.name.toLowerCase().includes(q) ||
        asso.mission.toLowerCase().includes(q) ||
        asso.quartier.toLowerCase().includes(q) ||
        asso.falcSummary.toLowerCase().includes(q);

      return matchesCat && matchesWeek && matchesQuery;
    });
  }, [selectedCategory, onlyThisWeek, searchQuery]);

  const handleCategoryChange = (cat: CategoryId | 'all') => {
    setSelectedCategory(cat);
    if (cat === 'all') {
      searchParams.delete('cat');
    } else {
      searchParams.set('cat', cat);
    }
    setSearchParams(searchParams);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-secondary mb-2">
          Annuaire & Carte Interactive — Orléans & Loiret
        </h1>
        <p className="text-ink-muted text-base">
          Trouvez une association près de chez vous avec les arrêts de Tram et Bus TAO.
        </p>
      </div>

      {/* Barre de filtres */}
      <div className="comfort-card bg-white p-4 sm:p-5 rounded-card border border-border shadow-card mb-6 space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-ink-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher par besoin, quartier (La Source, Argonne...) ou nom"
              className="w-full pl-11 pr-4 py-3 min-h-[48px] rounded-btn border border-border bg-surface text-ink"
            />
          </div>

          <button
            type="button"
            onClick={() => setOnlyThisWeek(!onlyThisWeek)}
            aria-pressed={onlyThisWeek}
            className={`px-5 py-3 min-h-[48px] rounded-btn font-bold flex items-center justify-center gap-2 border transition-colors shrink-0 ${
              onlyThisWeek
                ? 'bg-primary text-white border-primary'
                : 'bg-surface text-ink border-border hover:border-primary'
            }`}
          >
            <CalendarCheck className="w-5 h-5" />
            <span>{t.slotThisWeek}</span>
          </button>
        </div>

        {/* Filtres par catégorie */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-ink-muted flex items-center gap-1 mr-1">
            <Filter className="w-4 h-4" />
            <span>Thème :</span>
          </span>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => handleCategoryChange(cat.id)}
              className={`px-3.5 py-2 rounded-btn text-sm font-semibold min-h-[40px] transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-secondary text-white'
                  : 'bg-surface text-ink border border-border hover:bg-secondary-light'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Disposition Liste + Carte */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Liste des associations */}
        <div className="lg:col-span-7 space-y-4">
          <div className="text-sm font-semibold text-ink-muted">
            {filteredAssociations.length} structure{filteredAssociations.length > 1 ? 's' : ''} trouvée{filteredAssociations.length > 1 ? 's' : ''}
          </div>

          {filteredAssociations.length === 0 ? (
            <div className="bg-white p-8 rounded-card border border-border text-center">
              <p className="font-bold text-lg text-secondary mb-2">Aucune association ne correspond à ces critères.</p>
              <p className="text-sm text-ink-muted mb-4">Essayez d’enlever le filtre « Créneau cette semaine » ou de choisir « Toutes les aides ».</p>
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('all');
                  setOnlyThisWeek(false);
                  setSearchQuery('');
                }}
                className="bg-primary text-white font-bold px-5 py-3 rounded-btn min-h-[48px]"
              >
                Réinitialiser les filtres
              </button>
            </div>
          ) : (
            filteredAssociations.map((asso) => (
              <article
                key={asso.id}
                onMouseEnter={() => setSelectedAssoId(asso.id)}
                className={`comfort-card bg-white rounded-card p-5 border-2 transition-all shadow-card ${
                  selectedAssoId === asso.id ? 'border-primary' : 'border-border'
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                  <div>
                    <span className="inline-block text-xs font-bold px-2.5 py-1 rounded-md bg-secondary-light text-secondary mb-2">
                      {asso.quartier} • à {asso.distanceKm} km
                    </span>
                    <h2 className="font-display font-extrabold text-xl text-secondary">
                      {asso.name}
                    </h2>
                  </div>

                  {asso.hasSlotThisWeek && (
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-primary-light text-primary">
                      <CalendarCheck className="w-4 h-4" />
                      <span>{t.slotThisWeek}</span>
                    </span>
                  )}
                </div>

                <p className="text-sm font-medium text-ink bg-surface p-3 rounded-lg border border-border mb-3">
                  {asso.falcSummary}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-ink-muted mb-4">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 shrink-0 mt-0.5 text-secondary" />
                    <span>{asso.address}, {asso.city}</span>
                  </div>
                  <div className="flex items-start gap-2 text-primary font-semibold">
                    <TrainFront className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{asso.taoLine} — {asso.taoStop}</span>
                  </div>
                  <div className="flex items-start gap-2 sm:col-span-2">
                    <Clock className="w-4 h-4 shrink-0 mt-0.5 text-secondary" />
                    <span>{asso.hours}</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border">
                  <div className="text-xs text-ink-muted">
                    Langues : <span className="font-semibold text-ink">{asso.languagesSpoken.join(', ')}</span>
                  </div>
                  <Link
                    to={`/association/${asso.id}`}
                    className="bg-primary hover:bg-primary-hover text-white font-bold px-5 py-3 min-h-[48px] rounded-btn inline-flex items-center gap-2 transition-colors"
                  >
                    <span>{t.seeAssociation}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </article>
            ))
          )}
        </div>

        {/* Carte Interactive */}
        <div className="lg:col-span-5 lg:sticky lg:top-24">
          <div className="comfort-card bg-white p-4 rounded-card border border-border shadow-card">
            <h2 className="font-bold text-base text-secondary mb-3 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              <span>Carte des structures & arrêts TAO</span>
            </h2>
            <InteractiveMap
              associations={filteredAssociations}
              selectedId={selectedAssoId}
              onSelectAssociation={(id) => setSelectedAssoId(id)}
              heightClass="h-[300px] sm:h-[380px] lg:h-[460px]"
            />
            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs font-medium text-ink">
              <div className="flex items-center gap-1.5">
                <span className="inline-block w-3 h-3 rounded-full bg-primary shrink-0" aria-hidden="true" />
                <span>Point vert = Association</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="inline-block w-3 h-3 rounded-full bg-secondary shrink-0" aria-hidden="true" />
                <span>Point bleu = Arrêt Tram/Bus TAO</span>
              </div>
            </div>
            <p className="text-xs text-ink-muted mt-2">
              Cliquez sur un point vert pour afficher l’adresse et l’arrêt de Tram/Bus TAO le plus proche.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
