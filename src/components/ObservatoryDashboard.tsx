import { useEffect, useState, type ReactNode } from 'react';
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, LabelList, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import {
  Activity, ArrowRight, Building2, CalendarCheck, CheckCircle2, Clock, Gauge, HandHelping, Inbox, MapPin, Shuffle,
} from 'lucide-react';
import type { CategoryId } from '../data/types';
import { rpc } from '../data/portal';

// Couleurs : une teinte pour les grandeurs, palette catégorielle validée (ordre fixe) pour les identités.
const MAGNITUDE = '#176B57';
const SERIES = { blue: '#2a78d6', orange: '#eb6834', aqua: '#1baf7a', yellow: '#eda100' };
const GRID = '#E5E9EC';
const INK_MUTED = '#64748B';

export type Stats = {
  total: number | null; completed: number | null; waitDays: number | null; saturation: number | null;
  themes: { theme: CategoryId; volume: number }[]; districts: { district: string; qpv: boolean | null; volume: number }[];
};
type Observatory = {
  threshold: number;
  residentDistricts: { district: string; qpv: boolean; volume: number }[];
  waitByTheme: { theme: CategoryId; volume: number; waitDays: number }[];
  monthly: { month: string; volume: number }[];
  outcomes: { cancelled: number | null; absent: number | null; oriented: number | null; walkIn: number | null };
  saturationByAssociation: { association: string; slots: number; reserved: number; rate: number }[];
};

const themes: Record<CategoryId, string> = {
  papiers: 'Papiers et séjour', logement: 'Logement et énergie', sante: 'Santé et handicap',
  travail: 'Travail et formation', famille: 'Famille et budget', droits: 'Droits et démarches',
};
const monthLabel = new Intl.DateTimeFormat('fr-FR', { month: 'short', year: '2-digit' });
const formatMonth = (value: string) => monthLabel.format(new Date(`${value}-01T12:00:00`));
const fr = new Intl.NumberFormat('fr-FR');

function Card({ title, subtitle, children, table }: { title: string; subtitle?: string; children: ReactNode; table?: ReactNode }) {
  return <section className="comfort-card bg-white rounded-card border border-border shadow-card p-5 flex flex-col gap-3">
    <header>
      <h3 className="font-display font-extrabold text-lg text-secondary">{title}</h3>
      {subtitle && <p className="text-sm text-ink-muted">{subtitle}</p>}
    </header>
    {children}
    {table && <details className="text-sm"><summary className="cursor-pointer text-secondary font-semibold">Voir les données</summary>
      <div className="mt-2 overflow-x-auto">{table}</div></details>}
  </section>;
}

function Empty({ threshold }: { threshold: number }) {
  return <div className="h-48 rounded-btn border border-dashed border-border bg-surface flex flex-col items-center justify-center text-center px-6 gap-1">
    <Inbox className="w-7 h-7 text-ink-muted" aria-hidden="true" />
    <p className="font-semibold text-ink">Pas encore assez de données</p>
    <p className="text-sm text-ink-muted">Chaque groupe doit compter au moins {threshold} demandes pour être affiché, afin de protéger l’anonymat.</p>
  </div>;
}

function DataTable({ head, rows }: { head: string[]; rows: (string | number)[][] }) {
  return <table className="w-full text-left border-collapse">
    <thead><tr>{head.map((cell) => <th key={cell} className="border-b border-border py-1 pr-3 font-semibold">{cell}</th>)}</tr></thead>
    <tbody>{rows.map((row, index) => <tr key={index}>{row.map((cell, i) =>
      <td key={i} className="border-b border-border/60 py-1 pr-3 tabular-nums">{cell}</td>)}</tr>)}</tbody>
  </table>;
}

function Kpi({ icon, label, value, unit, hint, accent = false }: {
  icon: ReactNode; label: string; value: number | null | undefined; unit?: string; hint: string; accent?: boolean;
}) {
  return <div className={`rounded-card border p-4 flex flex-col gap-2 ${accent ? 'bg-primary text-white border-primary' : 'bg-white border-border shadow-card'}`}>
    <div className={`flex items-center gap-2 text-sm font-semibold ${accent ? 'text-white/90' : 'text-ink-muted'}`}>
      <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${accent ? 'bg-white/15' : 'bg-primary-light text-primary'}`} aria-hidden="true">{icon}</span>
      {label}
    </div>
    <div className="font-display font-extrabold text-3xl tabular-nums leading-none">
      {value === null || value === undefined ? '—' : fr.format(value)}
      {value !== null && value !== undefined && unit && <span className="text-lg font-bold ml-1">{unit}</span>}
    </div>
    <p className={`text-xs ${accent ? 'text-white/80' : 'text-ink-muted'}`}>{value === null || value === undefined ? 'Moins de 5 demandes : masqué' : hint}</p>
  </div>;
}

const tooltipStyle = { borderRadius: 10, border: `1px solid ${GRID}`, boxShadow: '0 6px 18px rgba(23,74,115,.12)', fontSize: 13 };

function Flow({ stats, detail, published, pending }: { stats: Stats; detail?: Observatory; published: number; pending: number }) {
  const total = stats.total;
  const steps: { icon: ReactNode; label: string; value: number | null; note: string }[] = [
    { icon: <Inbox className="w-5 h-5" />, label: 'Demandes de référencement', value: pending, note: 'en attente de validation' },
    { icon: <Building2 className="w-5 h-5" />, label: 'Associations publiées', value: published, note: 'visibles dans l’annuaire' },
    { icon: <CalendarCheck className="w-5 h-5" />, label: 'Rendez-vous pris', value: total, note: 'en ligne, par un aidant ou au guichet' },
    { icon: <CheckCircle2 className="w-5 h-5" />, label: 'Rendez-vous effectués', value: stats.completed, note: 'usager reçu' },
  ];
  const branches = [
    { label: 'Orientations entre associations', value: detail?.outcomes.oriented ?? null, color: SERIES.blue },
    { label: 'Réservations au guichet', value: detail?.outcomes.walkIn ?? null, color: SERIES.aqua },
    { label: 'Annulations (créneau libéré)', value: detail?.outcomes.cancelled ?? null, color: SERIES.orange },
    { label: 'Absences', value: detail?.outcomes.absent ?? null, color: SERIES.yellow },
  ];
  return <Card title="Parcours des demandes" subtitle="Du référencement des associations au rendez-vous effectué">
    <ol className="grid grid-cols-1 md:grid-cols-4 gap-3 items-stretch" aria-label="Étapes du parcours">
      {steps.map((step, index) => <li key={step.label} className="relative flex md:block items-center gap-3">
        <div className="flex-1 h-full rounded-card border border-border bg-surface p-4">
          <div className="flex items-center gap-2 text-primary">{step.icon}<span className="text-xs font-bold uppercase tracking-wide">Étape {index + 1}</span></div>
          <p className="mt-2 font-display font-extrabold text-2xl text-ink tabular-nums">{step.value === null ? '—' : fr.format(step.value)}</p>
          <p className="font-semibold text-sm text-ink">{step.label}</p>
          <p className="text-xs text-ink-muted">{step.note}</p>
        </div>
        {index < steps.length - 1 && <ArrowRight className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-primary bg-white rounded-full z-10" aria-hidden="true" />}
      </li>)}
    </ol>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {branches.map((branch) => <div key={branch.label} className="flex items-center gap-3 rounded-btn border border-border p-3">
        <span className="w-2.5 h-10 rounded-full shrink-0" style={{ background: branch.color }} aria-hidden="true" />
        <div>
          <p className="font-bold text-lg tabular-nums leading-tight">{branch.value === null ? '—' : fr.format(branch.value)}</p>
          <p className="text-xs text-ink-muted">{branch.label}</p>
        </div>
      </div>)}
    </div>
  </Card>;
}

export function ObservatoryDashboard({ stats: realStats, published, pending }: { stats: Stats; published: number; pending: number }) {
  const [detail, setDetail] = useState<Observatory>();
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    rpc<Observatory>('portal_observatory', { p_action: 'stats', p_data: {} })
      .then((result) => { if (active) setDetail(result); })
      .catch((cause: Error) => { if (active) setError(cause.message); });
    return () => { active = false; };
  }, [realStats]);

  const stats = realStats;
  const data = detail;
  const threshold = data?.threshold ?? 5;
  const themeSeries = [...stats.themes].sort((a, b) => b.volume - a.volume).map((item) => ({ ...item, name: themes[item.theme] ?? item.theme }));
  const waitSeries = [...(data?.waitByTheme ?? [])].sort((a, b) => b.waitDays - a.waitDays).map((item) => ({ ...item, name: themes[item.theme] ?? item.theme }));
  const monthly = (data?.monthly ?? []).map((item) => ({ ...item, label: formatMonth(item.month) }));
  const districts = [...(data?.residentDistricts ?? [])].sort((a, b) => b.volume - a.volume);
  const saturation = [...(data?.saturationByAssociation ?? [])].sort((a, b) => b.rate - a.rate);
  const barHeight = (count: number) => Math.max(160, count * 44 + 30);

  return <div className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 className="font-display font-extrabold text-2xl text-secondary">Baromètre territorial</h2>
        <p className="text-sm text-ink-muted">Statistiques 100 % anonymisées · groupes de moins de {threshold} demandes masqués</p>
      </div>
    </div>
    {error && <p role="alert" className="text-urgent font-semibold">{error}</p>}

    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <Kpi accent icon={<Activity className="w-4 h-4" />} label="Demandes de rendez-vous" value={stats.total} hint="Depuis l’ouverture du portail" />
      <Kpi icon={<CheckCircle2 className="w-4 h-4" />} label="Rendez-vous effectués" value={stats.completed} hint="Usagers effectivement reçus" />
      <Kpi icon={<Clock className="w-4 h-4" />} label="Délai moyen" value={stats.waitDays} unit="j" hint="Entre la prise de rendez-vous et le créneau" />
      <Kpi icon={<Gauge className="w-4 h-4" />} label="Saturation à 30 jours" value={stats.saturation} unit="%" hint="Part des créneaux déjà réservés" />
      <Kpi icon={<Shuffle className="w-4 h-4" />} label="Orientations" value={data?.outcomes.oriented} hint="Rendez-vous pris par une autre association" />
      <Kpi icon={<HandHelping className="w-4 h-4" />} label="Réservations au guichet" value={data?.outcomes.walkIn} hint="Pour des personnes sans compte" />
      <Kpi icon={<Building2 className="w-4 h-4" />} label="Associations publiées" value={published} hint="Visibles dans l’annuaire" />
      <Kpi icon={<Inbox className="w-4 h-4" />} label="Référencements en attente" value={pending} hint="À valider ci-dessous" />
    </div>

    <Flow stats={stats} detail={data} published={published} pending={pending} />

    <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
      <Card title="Évolution des demandes" subtitle="Rendez-vous pris par mois, sur 12 mois"
        table={monthly.length ? <DataTable head={['Mois', 'Demandes']} rows={monthly.map((m) => [m.label, m.volume])} /> : undefined}>
        {monthly.length < 2 ? <Empty threshold={threshold} /> : <div className="h-60">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={monthly} margin={{ top: 16, right: 16, left: -12, bottom: 0 }}>
              <defs><linearGradient id="obsArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={MAGNITUDE} stopOpacity={0.28} /><stop offset="100%" stopColor={MAGNITUDE} stopOpacity={0.02} />
              </linearGradient></defs>
              <CartesianGrid stroke={GRID} vertical={false} />
              <XAxis dataKey="label" tickLine={false} axisLine={{ stroke: GRID }} tick={{ fill: INK_MUTED, fontSize: 12 }} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: INK_MUTED, fontSize: 12 }} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: MAGNITUDE, strokeDasharray: '3 3' }}
                formatter={(value: number) => [fr.format(value), 'Demandes']} />
              <Area type="monotone" dataKey="volume" stroke={MAGNITUDE} strokeWidth={2} fill="url(#obsArea)"
                dot={{ r: 4, fill: MAGNITUDE, stroke: '#fff', strokeWidth: 2 }} activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>}
      </Card>

      <Card title="Demandes par thème" subtitle="Thématiques prioritaires du territoire"
        table={themeSeries.length ? <DataTable head={['Thème', 'Demandes']} rows={themeSeries.map((t) => [t.name, t.volume])} /> : undefined}>
        {!themeSeries.length ? <Empty threshold={threshold} /> : <div style={{ height: barHeight(themeSeries.length) }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={themeSeries} layout="vertical" margin={{ top: 4, right: 48, left: 8, bottom: 4 }} barCategoryGap={10}>
              <CartesianGrid stroke={GRID} horizontal={false} />
              <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: INK_MUTED, fontSize: 12 }} />
              <YAxis type="category" dataKey="name" width={150} tickLine={false} axisLine={false} tick={{ fill: '#1F2937', fontSize: 13 }} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: '#F1F5F4' }} formatter={(value: number) => [fr.format(value), 'Demandes']} />
              <Bar dataKey="volume" fill={MAGNITUDE} radius={[0, 4, 4, 0]} maxBarSize={26}>
                <LabelList dataKey="volume" position="right" fill="#1F2937" fontSize={12} formatter={(v: number) => fr.format(v)} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>}
      </Card>

      <Card title="Quartiers de résidence des usagers" subtitle="Quartier déclaré lors de la réservation · QPV = quartier prioritaire"
        table={districts.length ? <DataTable head={['Quartier', 'QPV', 'Demandes']} rows={districts.map((d) => [d.district, d.qpv ? 'Oui' : 'Non', d.volume])} /> : undefined}>
        {!districts.length ? <Empty threshold={threshold} /> : <>
          <div className="flex flex-wrap gap-4 text-sm" aria-label="Légende">
            <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm" style={{ background: SERIES.blue }} />Quartier prioritaire (QPV)</span>
            <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm" style={{ background: SERIES.orange }} />Hors QPV</span>
          </div>
          <div style={{ height: barHeight(districts.length) }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={districts} layout="vertical" margin={{ top: 4, right: 48, left: 8, bottom: 4 }} barCategoryGap={10}>
                <CartesianGrid stroke={GRID} horizontal={false} />
                <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: INK_MUTED, fontSize: 12 }} />
                <YAxis type="category" dataKey="district" width={150} tickLine={false} axisLine={false} tick={{ fill: '#1F2937', fontSize: 13 }} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: '#F1F5F4' }}
                  formatter={(value: number, _name, item) => [fr.format(value), item.payload.qpv ? 'Demandes · QPV' : 'Demandes · hors QPV']} />
                <Bar dataKey="volume" radius={[0, 4, 4, 0]} maxBarSize={26}>
                  {districts.map((d) => <Cell key={d.district} fill={d.qpv ? SERIES.blue : SERIES.orange} />)}
                  <LabelList dataKey="volume" position="right" fill="#1F2937" fontSize={12} formatter={(v: number) => fr.format(v)} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>}
      </Card>

      <Card title="Délai moyen d’attente par thème" subtitle="Jours entre la réservation et le rendez-vous"
        table={waitSeries.length ? <DataTable head={['Thème', 'Délai (jours)', 'Demandes']} rows={waitSeries.map((w) => [w.name, w.waitDays, w.volume])} /> : undefined}>
        {!waitSeries.length ? <Empty threshold={threshold} /> : <div style={{ height: barHeight(waitSeries.length) }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={waitSeries} layout="vertical" margin={{ top: 4, right: 56, left: 8, bottom: 4 }} barCategoryGap={10}>
              <CartesianGrid stroke={GRID} horizontal={false} />
              <XAxis type="number" tickLine={false} axisLine={false} tick={{ fill: INK_MUTED, fontSize: 12 }} unit=" j" />
              <YAxis type="category" dataKey="name" width={150} tickLine={false} axisLine={false} tick={{ fill: '#1F2937', fontSize: 13 }} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: '#F1F5F4' }} formatter={(value: number) => [`${fr.format(value)} jours`, 'Délai moyen']} />
              <Bar dataKey="waitDays" fill={SERIES.blue} radius={[0, 4, 4, 0]} maxBarSize={26}>
                <LabelList dataKey="waitDays" position="right" fill="#1F2937" fontSize={12} formatter={(v: number) => `${fr.format(v)} j`} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>}
      </Card>
    </div>

    <Card title="Saturation des structures à 30 jours" subtitle="Part des créneaux déjà réservés · au-delà de 80 %, la structure risque de refuser des usagers"
      table={saturation.length ? <DataTable head={['Association', 'Créneaux', 'Réservés', 'Saturation']} rows={saturation.map((s) => [s.association, s.slots, s.reserved, `${fr.format(s.rate)} %`])} /> : undefined}>
      {!saturation.length ? <Empty threshold={threshold} /> : <div style={{ height: barHeight(saturation.length) + 20 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={saturation} layout="vertical" margin={{ top: 24, right: 56, left: 8, bottom: 4 }} barCategoryGap={10}>
            <CartesianGrid stroke={GRID} horizontal={false} />
            <XAxis type="number" domain={[0, 100]} tickLine={false} axisLine={false} tick={{ fill: INK_MUTED, fontSize: 12 }} unit=" %" />
            <YAxis type="category" dataKey="association" width={200} tickLine={false} axisLine={false} tick={{ fill: '#1F2937', fontSize: 13 }} />
            <ReferenceLine x={80} stroke="#C0392B" strokeDasharray="4 4" label={{ value: 'Seuil 80 %', position: 'top', fill: '#C0392B', fontSize: 12 }} />
            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: '#F1F5F4' }}
              formatter={(value: number, _name, item) => [`${fr.format(value)} % (${item.payload.reserved}/${item.payload.slots})`, 'Saturation']} />
            <Bar dataKey="rate" fill={MAGNITUDE} radius={[0, 4, 4, 0]} maxBarSize={26}>
              <LabelList dataKey="rate" position="right" fill="#1F2937" fontSize={12} formatter={(v: number) => `${fr.format(v)} %`} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>}
    </Card>

    <p className="flex items-start gap-2 text-xs text-ink-muted"><MapPin className="w-4 h-4 shrink-0" aria-hidden="true" />
      Les statistiques ne contiennent aucune donnée nominative. Le quartier de résidence est déclaré librement par l’usager ; le thème correspond à l’association qui reçoit la demande.</p>
  </div>;
}
