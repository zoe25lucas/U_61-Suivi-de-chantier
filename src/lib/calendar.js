// Outils calendrier partagés (journal, avant-propos, impression)

const pad = (n) => String(n).padStart(2, '0');
export const toDateStr = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

// Dimanche de Pâques (algorithme de Meeus / Butcher)
const easterSunday = (year) => {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
};

const shift = (date, days) => { const d = new Date(date); d.setDate(d.getDate() + days); return toDateStr(d); };

// Jours fériés mobiles
export const getPaques = (year) => {
  const p = easterSunday(year);
  return {
    vendrediSaint: shift(p, -2), // férié en Alsace-Moselle
    lundi: shift(p, 1),
    ascension: shift(p, 39),
    pentecote: shift(p, 50),
  };
};

// Jours fériés fixes (France + Alsace-Moselle : 26 décembre et Vendredi saint)
export const getFeries = (year) => [
  `${year}-01-01`, `${year}-05-01`, `${year}-05-08`, `${year}-07-14`, `${year}-08-15`,
  `${year}-11-01`, `${year}-11-11`, `${year}-12-25`, `${year}-12-26`,
  getPaques(year).vendrediSaint,
];

export const getAllFeries = (year) => {
  const p = getPaques(year);
  return [...getFeries(year), p.lundi, p.ascension, p.pentecote];
};

export const isDateInPeriod = (dateStr, startStr, endStr) => dateStr >= startStr && dateStr <= endStr;

// Type d'une journée : weekend / ferie / type de la dernière période qui la couvre
export const getDayType = (dateStr, periods) => {
  const d = new Date(`${dateStr}T12:00:00`);
  const dow = d.getDay();
  if (dow === 0 || dow === 6) return 'weekend';
  if (getAllFeries(d.getFullYear()).includes(dateStr)) return 'ferie';
  const matching = periods.filter(p => isDateInPeriod(dateStr, p.start, p.end));
  return matching.length ? matching[matching.length - 1].type : 'none';
};

// Planning officiel 2e année (ATS2BAT, du 03/08/2026 au 01/08/2027, édité le 28/08/2026).
// Sert de base : les périodes saisies dans le Journal passent par-dessus.
export const PLANNING_ANNEE_2 = [
  { type: 'ecole', start: '2026-09-01', end: '2026-09-04' },
  { type: 'entreprise', start: '2026-09-07', end: '2026-09-18' },
  { type: 'ecole', start: '2026-09-21', end: '2026-10-02' },
  { type: 'entreprise', start: '2026-10-05', end: '2026-10-09' },
  { type: 'ecole', start: '2026-10-12', end: '2026-10-16' },
  { type: 'entreprise', start: '2026-10-19', end: '2026-10-30' },
  { type: 'ecole', start: '2026-11-02', end: '2026-11-13' },
  { type: 'entreprise', start: '2026-11-16', end: '2026-11-27' },
  { type: 'ecole', start: '2026-11-30', end: '2026-12-11' },
  { type: 'entreprise', start: '2026-12-14', end: '2027-01-01' },
  { type: 'ecole', start: '2027-01-04', end: '2027-01-15' },
  { type: 'entreprise', start: '2027-01-18', end: '2027-01-29' },
  { type: 'ecole', start: '2027-02-01', end: '2027-02-12' },
  { type: 'entreprise', start: '2027-02-15', end: '2027-03-19' },
  { type: 'ecole', start: '2027-03-22', end: '2027-04-02' },
  { type: 'entreprise', start: '2027-04-05', end: '2027-05-07' },
  { type: 'ecole', start: '2027-05-10', end: '2027-05-28' },
  { type: 'entreprise', start: '2027-05-31', end: '2027-06-04' },
  { type: 'ecole', start: '2027-06-07', end: '2027-06-18' },
  { type: 'entreprise', start: '2027-06-21', end: '2027-07-30' },
];
