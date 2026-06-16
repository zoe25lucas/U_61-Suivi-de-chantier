// Reformate les numéros de chantier au format final :
//   - Principal     : K729.{codeAffaire}        (sans parenthèses)
//   - Sous-chantier : K729.{codeAffaire}.{NNNNNN}  (6 chiffres)
//
// Exécution : node --use-system-ca scripts/update-chantier-codes.mjs
// Idempotent : retire un éventuel préfixe K729. existant avant de reconstruire.

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://wjrjevusbyiynrquxgeu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqcmpldnVzYnlpeW5ycXV4Z2V1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4MTA2MzAsImV4cCI6MjA5MjM4NjYzMH0.0r0AF-0qrjQXSO-gfzYWFqb_c4lHwgbI9KzHjBLc9Mg'
);

const pad6 = (n) => String(n).padStart(6, '0');
// Code d'affaire « nu » : sans préfixe K729., sans parenthèse, premier segment
const bareAffaire = (numero) =>
  String(numero || '')
    .replace(/^K729\./, '')
    .replace(/\s*\(.*\)\s*$/, '')
    .split('.')[0]
    .trim();

async function main() {
  const { data, error } = await supabase.from('chantiers').select('id, numero, nom, parent_id');
  if (error) { console.error('Erreur lecture:', error.message); process.exit(1); }

  // Code d'affaire de chaque parent
  const affaireById = {};
  data.forEach(c => { if (!c.parent_id && c.numero) affaireById[c.id] = bareAffaire(c.numero); });

  let updated = 0, skipped = 0;
  for (const c of data) {
    if (!c.numero) { continue; } // anciens chantiers sans numéro : on ne touche pas

    let newNumero;
    if (!c.parent_id) {
      newNumero = `K729.${bareAffaire(c.numero)}`;
    } else {
      const affaire = affaireById[c.parent_id];
      if (!affaire) { console.log(`! parent introuvable pour ${c.nom}, ignoré`); continue; }
      const idx = parseInt(String(c.numero).split('.').pop(), 10); // 05 ou ...000005 -> 5
      newNumero = `K729.${affaire}.${pad6(idx)}`;
    }

    if (newNumero === c.numero) { skipped++; continue; }
    const { error: upErr } = await supabase.from('chantiers').update({ numero: newNumero }).eq('id', c.id);
    if (upErr) { console.error(`✗ ${c.nom}:`, upErr.message); continue; }
    console.log(`~ ${c.nom}: ${c.numero}  ->  ${newNumero}`);
    updated++;
  }
  console.log(`\nTerminé. Mis à jour: ${updated}, déjà conformes: ${skipped}.`);
}

main();
