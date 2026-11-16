import { getDayType, toDateStr } from '../lib/calendar';
import './CalendrierAlternance.css';

const MOIS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
const JOURS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

const LEGENDE = [
  { type: 'entreprise', label: 'Entreprise' },
  { type: 'ecole', label: 'Formation au CFA' },
  { type: 'conges', label: 'Congés' },
  { type: 'ferie', label: 'Férié / pont' },
];

const displayType = (t) => (t === 'pont' ? 'ferie' : t);

function MoisCal({ year, month, periods }) {
  const first = new Date(year, month, 1);
  const offset = (first.getDay() + 6) % 7; // lundi = 0
  const nbJours = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let d = 1; d <= nbJours; d++) {
    const dateStr = toDateStr(new Date(year, month, d));
    cells.push({ d, type: displayType(getDayType(dateStr, periods)) });
  }
  return (
    <div className="cal-mois">
      <div className="cal-mois-titre">{MOIS[month]} {year}</div>
      <div className="cal-grille">
        {JOURS.map((j, i) => <span key={`h${i}`} className="cal-entete">{j}</span>)}
        {cells.map((c, i) => c
          ? <span key={i} className={`cal-jour t-${c.type}`}>{c.d}</span>
          : <span key={i} className="cal-jour vide" />)}
      </div>
    </div>
  );
}

// Compte les jours ouvrés par type sur une année scolaire (septembre -> août)
const compter = (startYear, periods) => {
  const res = { entreprise: 0, ecole: 0 };
  const d = new Date(startYear, 8, 1);
  const end = new Date(startYear + 1, 7, 31);
  while (d <= end) {
    const t = getDayType(toDateStr(d), periods);
    if (t in res) res[t] += 1;
    d.setDate(d.getDate() + 1);
  }
  return res;
};

export default function CalendrierAlternance({ periods, annees = [2025, 2026], compact = false }) {
  return (
    <div className={`cal-alternance ${compact ? 'compact' : ''}`}>
      {annees.map(startYear => {
        const stats = compter(startYear, periods);
        const mois = Array.from({ length: 12 }, (_, i) => {
          const m = (8 + i) % 12;
          return { year: m >= 8 ? startYear : startYear + 1, month: m };
        });
        return (
          <section key={startYear} className="cal-annee">
            <div className="cal-annee-head">
              <h4>{startYear === annees[0] ? '1re' : '2e'} année · {startYear}–{startYear + 1}</h4>
              <span className="cal-stats">
                <b>{stats.entreprise}</b> j. en entreprise · <b>{stats.ecole}</b> j. au CFA
              </span>
            </div>
            <div className="cal-mois-grille">
              {mois.map(({ year, month }) => <MoisCal key={`${year}-${month}`} year={year} month={month} periods={periods} />)}
            </div>
          </section>
        );
      })}
      <div className="cal-legende">
        {LEGENDE.map(l => (
          <span key={l.type} className="cal-legende-item"><span className={`cal-pastille t-${l.type}`} />{l.label}</span>
        ))}
      </div>
    </div>
  );
}
