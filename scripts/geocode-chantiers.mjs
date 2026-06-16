// Géocode les chantiers qui ont une adresse (lieu) mais pas de coordonnées,
// afin qu'ils apparaissent sur la carte globale. Approximatif : ajustable
// ensuite à la main dans le mode édition.
//
// Exécution : node --use-system-ca scripts/geocode-chantiers.mjs

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://wjrjevusbyiynrquxgeu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqcmpldnVzYnlpeW5ycXV4Z2V1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4MTA2MzAsImV4cCI6MjA5MjM4NjYzMH0.0r0AF-0qrjQXSO-gfzYWFqb_c4lHwgbI9KzHjBLc9Mg'
);

const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const cleanLieu = (lieu) => String(lieu || '').replace(/\s*\(.*\)\s*$/, '').trim();

async function geocode(q) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&countrycodes=fr&limit=1`;
  const res = await fetch(url, { headers: { 'User-Agent': 'ChantierApp/1.0 (seed)' } });
  const data = await res.json();
  if (data && data.length > 0) return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
  return null;
}

async function main() {
  const { data, error } = await supabase.from('chantiers').select('id, nom, lieu, coordinates');
  if (error) { console.error('Erreur lecture:', error.message); process.exit(1); }

  const todo = data.filter(c =>
    cleanLieu(c.lieu).length > 2 &&
    !(Array.isArray(c.coordinates) && c.coordinates.length === 2)
  );

  console.log(`${todo.length} chantier(s) à géocoder.\n`);
  let ok = 0, ko = 0;
  for (const c of todo) {
    const q = cleanLieu(c.lieu);
    let coords = await geocode(q);
    // repli : si l'adresse complète échoue, tenter le dernier mot (ville)
    if (!coords) {
      const ville = q.split(',').pop().trim();
      if (ville && ville !== q) { await sleep(1100); coords = await geocode(ville); }
    }
    if (coords) {
      const lieuAvecCoords = `${q} (${coords[0].toFixed(6)}, ${coords[1].toFixed(6)})`;
      const { error: upErr } = await supabase.from('chantiers').update({ coordinates: coords, lieu: lieuAvecCoords }).eq('id', c.id);
      if (upErr) { console.error(`✗ ${c.nom}:`, upErr.message); ko++; }
      else { console.log(`✓ ${c.nom} -> [${coords[0].toFixed(5)}, ${coords[1].toFixed(5)}]`); ok++; }
    } else {
      console.log(`? ${c.nom} : adresse introuvable (${q})`);
      ko++;
    }
    await sleep(1100); // respect des limites Nominatim (1 req/s)
  }
  console.log(`\nTerminé. Géocodés: ${ok}, échecs: ${ko}.`);
}

main();
