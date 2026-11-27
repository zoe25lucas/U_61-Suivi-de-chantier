// Thèmes dont le contenu est un document mis en page (générés depuis les fichiers Word).
// key   : dossier dans public/themes-doc/
// pages : nombre de pages du document (pour l'impression)
// Les informations sensibles (montants, n° de commande, codes chantier, coordonnées) sont masquées.
export const THEME_DOCS = {
  '56004993-938c-4225-8398-a8081774bb67': { key: 't1', pages: 16 }, // Réaliser une commande de matériaux
  '1980eb6d-fb3a-4858-9a0e-cc9cc5b76be0': { key: 't5', pages: 21 }, // Levage de dalles
  '32a4a32b-ce8d-459c-a86d-c2914a90d62a': { key: 't6', pages: 17 }, // Rehausse de la crête de surverse
};

export const themeDocPages = (doc) =>
  Array.from({ length: doc.pages }, (_, i) => `/themes-doc/${doc.key}/print/p-${String(i + 1).padStart(2, '0')}.jpg`);
