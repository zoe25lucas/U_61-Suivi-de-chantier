// Remplit le thème "Saisie d'un bon de commande" avec la procédure mise en forme.
// Exécution : node --use-system-ca scripts/fill-theme-commande.mjs
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://wjrjevusbyiynrquxgeu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqcmpldnVzYnlpeW5ycXV4Z2V1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4MTA2MzAsImV4cCI6MjA5MjM4NjYzMH0.0r0AF-0qrjQXSO-gfzYWFqb_c4lHwgbI9KzHjBLc9Mg'
);

const THEME_ID = 'a46ae8f9-fdba-499f-b9d5-78b85c5f9218';

const sections = [
  {
    id: 'sec_cmd_1', title: '1. Du besoin au devis', images: [], video: '',
    text: "1) Le chef de chantier ou la conductrice de travaux me communique ses besoins en matériaux.\n2) Je demande un devis auprès du fournisseur concerné.\n3) Si le prix me convient, je valide et je passe à la commande."
  },
  {
    id: 'sec_cmd_2', title: "2. Accéder à l'outil de commande (Connect / SAP)", images: [], video: '',
    text: "4) Je lance notre application « Connect ».\n5) Je me rends dans l'onglet « Applications ».\n6) Je tape « commande » dans la barre de recherche, puis je clique sur la tuile ZPO_Manage77 (« Gérer les commandes d'achat – Vinci »).\n7) Je clique sur le bouton (+) pour créer une nouvelle commande."
  },
  {
    id: 'sec_cmd_3', title: "3. Créer la commande d'achat", images: [], video: '',
    text: "8) Je sélectionne ma MU (groupe d'acheteurs).\n9) Je sélectionne le chantier concerné.\n10) Je sélectionne le fournisseur.\n11) Je renseigne la date de livraison souhaitée.\n12) Je choisis l'article demandé.\n13) Je renseigne le prix et les quantités dont j'ai besoin.\n14) Je soumets la commande."
  },
  {
    id: 'sec_cmd_4', title: '4. Validation et transmission', images: [], video: '',
    text: "15) La commande part en circuit de validation.\n16) Une fois validée, je reçois le bon de commande par e-mail.\n17) Je l'enregistre dans nos dossiers.\n18) Je le renomme selon notre nomenclature.\n19) Je l'envoie au fournisseur."
  },
  {
    id: 'sec_cmd_video', title: '🎥 Démonstration en vidéo', images: [], video: '',
    text: "Vidéo pas à pas de la création d'une commande dans Connect.\n(Pour l'ajouter : ouvrir ce thème en mode édition, puis « Téléverser » une vidéo ou coller un lien YouTube/Vimeo dans cette section.)"
  }
];

const description = "Procédure complète pour réaliser une commande de matériaux via l'outil Connect (SAP) de Vinci Construction : de l'expression du besoin par le chantier jusqu'à l'envoi du bon de commande au fournisseur.";

const { error } = await supabase.from('themes').update({ description, sections }).eq('id', THEME_ID);
if (error) { console.log('ERREUR:', error.message); process.exit(1); }
console.log('✓ Thème mis à jour :', sections.length, 'sections.');
