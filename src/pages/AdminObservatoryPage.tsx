import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import { ShieldCheck, Users, CalendarCheck, Building2, Clock, MapPin } from 'lucide-react';
import { ASSOCIATIONS, OBSERVATORY_STATS } from '../data/mockData';
import { InteractiveMap } from '../components/InteractiveMap';

export const AdminObservatoryPage: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* En-tête Préfecture / État */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-secondary-light text-secondary mb-2">
            <ShieldCheck className="w-4 h-4" />
            <span>Accès restreint — Préfecture du Loiret & Services de l’État • Données 100 % anonymisées</span>
          </span>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-secondary">
            Observatoire Social Territorial — Orléans & Loiret
          </h1>
        </div>
      </div>

      {/* KPIs Anonymisés */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="comfort-card bg-white p-5 rounded-card border border-border shadow-card">
          <div className="flex items-center justify-between text-ink-muted text-xs font-bold mb-2">
            <span>DEMANDES REÇUES (ANNÉE)</span>
            <Users className="w-5 h-5 text-secondary" />
          </div>
          <div className="text-3xl font-extrabold text-secondary">{OBSERVATORY_STATS.totalRequests.toLocaleString('fr-FR')}</div>
          <div className="text-xs text-primary font-semibold mt-1">+12 % vs trimestre précédent</div>
        </div>

        <div className="comfort-card bg-white p-5 rounded-card border border-border shadow-card">
          <div className="flex items-center justify-between text-ink-muted text-xs font-bold mb-2">
            <span>RENDEZ-VOUS RÉALISÉS</span>
            <CalendarCheck className="w-5 h-5 text-primary" />
          </div>
          <div className="text-3xl font-extrabold text-primary">{OBSERVATORY_STATS.completedAppointments.toLocaleString('fr-FR')}</div>
          <div className="text-xs text-ink-muted mt-1">Taux d’honorabilité : 81,8 %</div>
        </div>

        <div className="comfort-card bg-white p-5 rounded-card border border-border shadow-card">
          <div className="flex items-center justify-between text-ink-muted text-xs font-bold mb-2">
            <span>ASSOCIATIONS PARTENAIRES</span>
            <Building2 className="w-5 h-5 text-secondary" />
          </div>
          <div className="text-3xl font-extrabold text-secondary">{OBSERVATORY_STATS.partnerAssociations}</div>
          <div className="text-xs text-ink-muted mt-1">Orléans Métropole & Loiret</div>
        </div>

        <div className="comfort-card bg-white p-5 rounded-card border border-border shadow-card">
          <div className="flex items-center justify-between text-ink-muted text-xs font-bold mb-2">
            <span>DÉLAI MOYEN D’ATTENTE</span>
            <Clock className="w-5 h-5 text-primary" />
          </div>
          <div className="text-3xl font-extrabold text-secondary">{OBSERVATORY_STATS.avgWaitDays} jours</div>
          <div className="text-xs text-primary font-semibold mt-1">-1,8 jour depuis le pilote</div>
        </div>
      </div>

      {/* Graphiques Recharts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="comfort-card bg-white p-6 rounded-card border border-border shadow-card">
          <h2 className="font-bold text-lg text-secondary mb-4">
            Répartition des demandes par thématique
          </h2>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={OBSERVATORY_STATS.byTheme} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#DCE5E1" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="demandes" fill="#176B57" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="comfort-card bg-white p-6 rounded-card border border-border shadow-card">
          <h2 className="font-bold text-lg text-secondary mb-4">
            Évolution mensuelle : Demandes vs Rendez-vous réalisés
          </h2>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={OBSERVATORY_STATS.monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#DCE5E1" />
                <XAxis dataKey="mois" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="demandes" name="Demandes" stroke="#174A73" strokeWidth={3} />
                <Line type="monotone" dataKey="rdv" name="RDV réalisés" stroke="#176B57" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* QPV & Carte territoriale */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 comfort-card bg-white p-6 rounded-card border border-border shadow-card">
          <h2 className="font-bold text-lg text-secondary mb-4">
            Répartition géographique par quartier et QPV
          </h2>
          <div className="space-y-3">
            {OBSERVATORY_STATS.byQuartierQPV.map((q) => (
              <div key={q.quartier} className="p-3.5 rounded-btn bg-surface border border-border">
                <div className="flex justify-between text-sm font-bold text-ink mb-1.5">
                  <span>{q.quartier}</span>
                  <span className="text-secondary">{q.demandes} demandes • Délai : {q.delaiJours} j</span>
                </div>
                <div className="w-full bg-border rounded-full h-2.5">
                  <div
                    className="bg-primary h-2.5 rounded-full"
                    style={{ width: `${Math.min(100, (q.demandes / 1350) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-6 comfort-card bg-white p-6 rounded-card border border-border shadow-card">
          <h2 className="font-bold text-lg text-secondary mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            <span>Carte territoriale des structures partenaires</span>
          </h2>
          <InteractiveMap associations={ASSOCIATIONS} heightClass="h-[340px]" />
        </div>
      </div>

      {/* Gestion des fiches associations & Taux de saturation */}
      <div className="comfort-card bg-white p-6 rounded-card border border-border shadow-card">
        <h2 className="font-bold text-lg text-secondary mb-4">
          Taux de saturation & Gestion des fiches associations
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-surface text-ink-muted">
              <tr>
                <th className="p-3">Association</th>
                <th className="p-3">Quartier</th>
                <th className="p-3">Taux de saturation</th>
                <th className="p-3">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {ASSOCIATIONS.map((asso) => (
                <tr key={asso.id}>
                  <td className="p-3 font-bold text-secondary">{asso.name}</td>
                  <td className="p-3">{asso.quartier}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-border rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            asso.saturationRate >= 80 ? 'bg-urgent' : 'bg-primary'
                          }`}
                          style={{ width: `${asso.saturationRate}%` }}
                        />
                      </div>
                      <span className="font-bold">{asso.saturationRate} %</span>
                    </div>
                  </td>
                  <td className="p-3">
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-primary-light text-primary">
                      Fiche validée
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
