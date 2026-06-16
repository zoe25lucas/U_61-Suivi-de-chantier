// Script de migration ponctuel : crée la structure parents / sous-chantiers
// d'après la liste PDF, et réutilise la ligne Contrexéville existante.
//
// Exécution : node --use-system-ca scripts/seed-chantiers.mjs
// Idempotent : relancer ne crée pas de doublon (clé = numero + parent).

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://wjrjevusbyiynrquxgeu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqcmpldnVzYnlpeW5ycXV4Z2V1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4MTA2MzAsImV4cCI6MjA5MjM4NjYzMH0.0r0AF-0qrjQXSO-gfzYWFqb_c4lHwgbI9KzHjBLc9Mg'
);

// Ligne existante à réutiliser (préserve ses 6 tâches de journal)
const CONTREX_ID = '550e8400-e29b-41d4-a716-446655440000';

// Champs JSON par défaut, identiques à handleAddNew dans Chantiers.jsx
const defaults = () => ({
  status: 'chantier_preparation',
  typeProjet: '',
  marche: '',
  maitreOeuvre: '',
  maitreOuvrage: '',
  csps: '',
  controleTechnique: '',
  descriptionProjet: { projet: '', existant: '' },
  illustrations: [],
  documentsEtude: {},
  etudesGeotechniques: {},
  diagnostics: {},
  plansDocuments: {},
  planifications: {},
  securite: {},
  roleApprenti: '',
  travauxEffectues: '',
  competencesMobilisees: [],
  fichiersJoints: [],
  documentsSpecifiques: [],
  datesChantier: { appelOffre: '', gagne: '', debut: '', fin: '' },
  photo_principale: '',
});

// Structure cible (parents + sous-chantiers) issue du PDF
const STRUCTURE = [
  {
    numero: 'BHG2567001', nom: 'DIVERS INDUSTRIELS 2026',
    children: [
      { numero: '04', nom: 'ILLKIRCH TRANSGENE', lieu: "Transgene S.A., Bd Gonthier d'Andernach, 67400 Illkirch-Graffenstaden" },
      { numero: '05', nom: 'MULHOUSE Hôpital Muller', lieu: 'Mulhouse Hôpital Muller, 20 Avenue du Dr René Laennec, 68100 MULHOUSE' },
      { numero: '06', nom: 'CONTREXVILLE Aai', reuseId: CONTREX_ID },
    ],
  },
  { numero: 'ISK2567003', nom: 'SAVERNE RESERVOIR', lieu: "rue du château d'eau, Saverne" },
  { numero: 'BHG2467001 (0136223)', nom: 'WOLFISHEIM BO EMS', lieu: 'WE BED - ZAC de Porte de Masevaux, 68290 MASEVAUX' },
  { numero: 'ISK2567004', nom: 'STRASBOURG STEP NORD', lieu: "Station d'épuration de Strasbourg - La Wantzenau, Rte du Glaserswoerth, 67000 Strasbourg" },
  { numero: 'ISK2568002 (0154755)', nom: 'MASEVAUX AAI', lieu: 'WE BED - ZAC de Porte de Masevaux, 68290 MASEVAUX' },
  { numero: 'MMD2667002', nom: 'NIEDERHASLACH Station Lot1', lieu: 'Niederhaslach station épuration' },
  { numero: 'MMD2667001 (0158378)', nom: 'GERSTHEIM EDF Hall', coordinates: [48.404768, 7.723355], lieu: 'Gerstheim (48.404768, 7.723355)' },
  {
    numero: 'ISK2668001', nom: 'LOT05 2026 MULHOUSE CEA',
    children: [
      { numero: '03', nom: 'P0944 PETIT LANDAU', coordinates: [47.729549, 7.492756], lieu: 'Petit Landau (47.729549, 7.492756)' },
      { numero: '04', nom: 'P0237_CR Bt BERRWILLER', coordinates: [47.849383, 7.202793], lieu: 'Berrwiller (47.849383, 7.202793)' },
      { numero: '05', nom: 'P0255 FELDKIRCH', coordinates: [47.867392, 7.274450], lieu: 'Feldkirch (47.867392, 7.274450)' },
      { numero: '06', nom: 'P0287 RÉGUISHEIM', coordinates: [47.894823, 7.329761], lieu: 'Réguisheim (47.894823, 7.329761)' },
    ],
  },
  {
    numero: 'ISK2668002', nom: 'LOT06 2026 SAINT LOUIS CEA',
    children: [
      { numero: '03', nom: 'P0118 ETEIMBES', coordinates: [47.70460594010576, 7.033525133313809], lieu: 'Eteimbes (47.704606, 7.033525)' },
    ],
  },
  {
    numero: 'ISK2668003', nom: 'LOT07 2026 2x2 CEA',
    children: [
      { numero: '02', nom: 'P2937 & P2938 Ste-Marie-Aux-Mines', coordinates: [48.257328, 7.221373], lieu: 'Sainte-Marie-aux-Mines (48.257328, 7.221373)' },
      { numero: '03', nom: 'P2810 Rohrwiller', coordinates: [48.751761, 7.921000], lieu: 'Rohrwiller (48.751761, 7.921000)' },
      { numero: '05', nom: 'P2825 Neewiller', coordinates: [48.947710, 8.137349], lieu: 'Neewiller (48.947710, 8.137349)' },
    ],
  },
];

async function main() {
  const { data: existing, error } = await supabase.from('chantiers').select('id, numero, nom, parent_id');
  if (error) { console.error('Erreur lecture chantiers:', error.message); process.exit(1); }

  const findParent = (numero) => existing.find(c => c.numero === numero && !c.parent_id);
  const findChild = (parentId, numero) => existing.find(c => c.parent_id === parentId && c.numero === numero);

  let created = 0, updated = 0, skipped = 0;

  for (const item of STRUCTURE) {
    // --- Parent / chantier racine ---
    let parentId;
    const existingParent = findParent(item.numero);
    if (existingParent) {
      parentId = existingParent.id;
      console.log(`= parent existant: N° ${item.numero} ${item.nom}`);
      skipped++;
    } else {
      const row = { ...defaults(), numero: item.numero, nom: item.nom, parent_id: null };
      if (item.lieu) row.lieu = item.lieu;
      if (item.coordinates) row.coordinates = item.coordinates;
      const { data, error: insErr } = await supabase.from('chantiers').insert([row]).select('id').single();
      if (insErr) { console.error(`  ✗ insert parent ${item.numero}:`, insErr.message); continue; }
      parentId = data.id;
      existing.push({ id: parentId, numero: item.numero, nom: item.nom, parent_id: null });
      console.log(`+ parent créé: N° ${item.numero} ${item.nom}`);
      created++;
    }

    // --- Sous-chantiers ---
    for (const child of (item.children || [])) {
      // Cas spécial : réutilisation d'une ligne existante (Contrexéville)
      if (child.reuseId) {
        const patch = { numero: child.numero, nom: child.nom, parent_id: parentId };
        if (child.lieu) patch.lieu = child.lieu;
        const { error: upErr } = await supabase.from('chantiers').update(patch).eq('id', child.reuseId);
        if (upErr) { console.error(`  ✗ réutilisation ${child.numero}:`, upErr.message); continue; }
        console.log(`  ~ sous-chantier réutilisé: ${child.numero} ${child.nom} (id ${child.reuseId})`);
        updated++;
        continue;
      }

      if (findChild(parentId, child.numero)) {
        console.log(`  = sous-chantier existant: ${child.numero} ${child.nom}`);
        skipped++;
        continue;
      }

      const row = { ...defaults(), numero: child.numero, nom: child.nom, parent_id: parentId };
      if (child.lieu) row.lieu = child.lieu;
      if (child.coordinates) row.coordinates = child.coordinates;
      const { data, error: insErr } = await supabase.from('chantiers').insert([row]).select('id').single();
      if (insErr) { console.error(`  ✗ insert sous-chantier ${child.numero}:`, insErr.message); continue; }
      existing.push({ id: data.id, numero: child.numero, nom: child.nom, parent_id: parentId });
      console.log(`  + sous-chantier créé: ${child.numero} ${child.nom}`);
      created++;
    }
  }

  console.log(`\nTerminé. Créés: ${created}, mis à jour: ${updated}, inchangés: ${skipped}.`);
}

main();
