import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { supabase } from '../lib/supabase';
import './Competences.css';

const CATEGORY_COLORS = {
  global: ['#3b82f6', '#f59e0b', '#10b981', '#f97316'], // Bleu, Jaune, Vert, Orange
  C2: [
    '#1e3a8a', // Bleu Nuit
    '#3b82f6', // Bleu Moyen
    '#0ea5e9', // Bleu Ciel
    '#93c5fd'  // Bleu Clair
  ],
  C15: [
    '#92400e', // Ambre Sombre
    '#d97706', // Ambre
    '#f59e0b', // Jaune Foncé
    '#fbbf24'  // Jaune
  ],
  C16: [
    '#064e3b', // Vert Émeraude Sombre
    '#059669', // Vert Émeraude
    '#10b981', // Vert Moyen
    '#34d399', // Vert Menthe
    '#166534', // Vert Forêt
    '#15803d', // Vert Jungle
    '#22c55e', // Vert Flash
    '#4ade80', // Vert Herbe
    '#a7f3d0'  // Vert Très Clair
  ],
  C18: [
    '#9a3412', // Orange Brûlé
    '#ea580c', // Orange Vif
    '#fb923c', // Corail
    '#fdba74'  // Pêche
  ]
};

const COMPETENCES_GROUPS = [
  {
    id: "C2",
    name: "C2 - Exprimer techniquement le besoin du client",
    items: [
      "C2.1 Recueillir les données",
      "C2.2 Traduire techniquement le besoin",
      "C2.3 Présenter et justifier les solutions",
      "C2.4 Proposer des variantes techniques"
    ]
  },
  {
    id: "C15",
    name: "C15 - Gérer les dépenses et recettes d'un chantier",
    items: [
      "C15.1 Établir l'avancement des travaux",
      "C15.2 Établir une situation de travaux",
      "C15.3 Valider les factures des fournisseurs",
      "C15.4 Récupérer et saisir les coûts réels"
    ]
  },
  {
    id: "C16",
    name: "C16 - Conduire les travaux en phase de gros œuvre",
    items: [
      "C16.1 Analyser les écarts",
      "C16.2 Contrôler l'exécution des ouvrages",
      "C16.3 Adapter les moyens",
      "C16.4 Planifier et coordonner",
      "C16.5 Mettre à jour l'avancement",
      "C16.6 Gérer les imprévus",
      "C16.7 Compléter les documents du chantier",
      "C16.8 Vérifier la conformité",
      "C16.9 Faire respecter les dispositions (hygiène/sécurité)"
    ]
  },
  {
    id: "C18",
    name: "C18 - Assurer la coordination avec les intervenants",
    items: [
      "C18.1 Planifier et coordonner les interventions",
      "C18.2 Conduire une réunion de travail"
    ]
  }
];

const Competences = () => {
  const [activeTab, setActiveTab] = useState('tableau');
  const [stats, setStats] = useState({ global: [], c2: [], c15: [], c16: [], c18: [] });

  useEffect(() => {
    async function loadStats() {
      try {
        const { data, error } = await supabase.from('journal_entries').select('tasks');
        if (error || !data) return;

        const counts = {};
        // Initialisation à 0 pour toutes les compétences
        COMPETENCES_GROUPS.forEach(group => {
          group.items.forEach(item => {
            counts[item] = 0;
          });
        });

        data.forEach(entry => {
          if (entry.tasks) {
            entry.tasks.forEach(task => {
              if (task.competences) {
                task.competences.forEach(comp => {
                  counts[comp] = (counts[comp] || 0) + 1;
                });
              }
            });
          }
        });

        let globalCount = { C2: 0, C15: 0, C16: 0, C18: 0 };
        let c2Data = [], c15Data = [], c16Data = [], c18Data = [];

        Object.entries(counts).forEach(([comp, count]) => {
          const shortName = comp.split(' ')[0]; // ex: "C2.1"

          if (comp.startsWith("C2.")) { globalCount.C2 += count; c2Data.push({ shortName, legendName: comp, value: count }); }
          else if (comp.startsWith("C15.")) { globalCount.C15 += count; c15Data.push({ shortName, legendName: comp, value: count }); }
          else if (comp.startsWith("C16.")) { globalCount.C16 += count; c16Data.push({ shortName, legendName: comp, value: count }); }
          else if (comp.startsWith("C18.")) { globalCount.C18 += count; c18Data.push({ shortName, legendName: comp, value: count }); }
        });

        setStats({
          global: [
            { shortName: "C2", legendName: "C2 - Exprimer le besoin du client", value: globalCount.C2 },
            { shortName: "C15", legendName: "C15 - Gérer dépenses et recettes", value: globalCount.C15 },
            { shortName: "C16", legendName: "C16 - Conduire les travaux", value: globalCount.C16 },
            { shortName: "C18", legendName: "C18 - Assurer la coordination", value: globalCount.C18 }
          ],
          c2: c2Data,
          c15: c15Data,
          c16: c16Data,
          c18: c18Data
        });
      } catch (err) {
        console.error("Erreur chargement stats:", err);
      }
    }
    loadStats();
  }, []);

  const renderCustomLegend = (props, chartData) => {
    const { payload } = props;
    if (!payload) return null;
    const total = chartData.reduce((sum, entry) => sum + entry.value, 0);
    
    return (
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {payload.map((entry, index) => {
          if (!entry.payload) return null;
          const percent = total > 0 ? ((entry.payload.value / total) * 100).toFixed(0) : 0;
          const fullName = entry.value || '';
          const shortName = entry.payload.shortName || '';
          const cleanName = fullName.replace(shortName, '').replace('-', '').trim();
          
          return (
            <li key={`item-${index}`} style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '10px', fontSize: '12px', color: 'var(--ink)', opacity: entry.payload.value === 0 ? 0.5 : 1 }}>
              <span style={{ 
                display: 'inline-block', 
                width: '12px', 
                height: '12px', 
                backgroundColor: entry.color, 
                borderRadius: '3px',
                marginRight: '10px',
                flexShrink: 0,
                marginTop: '3px'
              }}></span>
              <div>
                <div style={{ fontWeight: '700', fontFamily: 'Syne', fontSize: '13px' }}>
                  {shortName} <span style={{ color: 'var(--ink-muted)', marginLeft: '4px', fontWeight: '500' }}>{percent}%</span>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--ink-mid)', marginTop: '2px', lineHeight: '1.3' }}>{cleanName}</div>
              </div>
            </li>
          );
        })}
      </ul>
    );
  };

  const renderPie = (data, title, categoryKey = 'global') => {
    // On récupère la palette de couleurs correspondante
    const palette = CATEGORY_COLORS[categoryKey] || CATEGORY_COLORS.global;
    const isGlobal = categoryKey === 'global';

    // On ne montre "Aucune donnée" que si isGlobal et que tout est à 0
    const total = data.reduce((sum, entry) => sum + entry.value, 0);
    
    // Préparation manuelle du payload pour la légende
    const legendPayload = data.map((entry, index) => ({
      color: palette[index % palette.length],
      value: entry.legendName,
      payload: entry
    }));

    return (
      <div className="chart-card">
        <h3>{title}</h3>
        <div className="chart-wrapper" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: '1rem', padding: '0.5rem 0' }}>
          <div style={{ flex: '1 1 140px', height: isGlobal ? '220px' : '180px', minWidth: '140px', maxWidth: '220px', position: 'relative' }}>
            {total > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.filter(i => i.value > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius="55%"
                    outerRadius="80%"
                    paddingAngle={4}
                    dataKey="value"
                    nameKey="legendName"
                    stroke="none"
                  >
                    {data.filter(i => i.value > 0).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={palette[data.indexOf(entry) % palette.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [value + " fois", name]} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px dashed var(--border-mid)', borderRadius: '50%', margin: '20px' }}>
                <span style={{ fontSize: '10px', color: 'var(--ink-muted)' }}>0%</span>
              </div>
            )}
          </div>
          <div style={{ flex: '2 1 180px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            {renderCustomLegend({ payload: legendPayload }, data)}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="page content competences-page">
      <div className="competences-container">
        
        <div className="journal-header" style={{ marginBottom: '2rem' }}>
          <div>
            <h1 className="journal-title">Compétences U61</h1>
            <div className="journal-subtitle">Suivi et grille d'évaluation de la période en entreprise.</div>
          </div>
          <div className="journal-tabs">
            <button className={`journal-tab ${activeTab === 'tableau' ? 'active' : ''}`} onClick={() => setActiveTab('tableau')}>Tableau Officiel</button>
            <button className={`journal-tab ${activeTab === 'stats' ? 'active' : ''}`} onClick={() => setActiveTab('stats')}>Statistiques d'Apprentissage</button>
          </div>
        </div>

        {activeTab === 'stats' && (
          <div className="stats-container">
            <div className="stats-global-row">
              {renderPie(stats.global, "Répartition Globale par Catégorie", 'global')}
            </div>
            <div className="stats-grid">
              {renderPie(stats.c2, "Détail C2 - Besoin Client", 'C2')}
              {renderPie(stats.c15, "Détail C15 - Gestion Dépenses", 'C15')}
              {renderPie(stats.c16, "Détail C16 - Gros Œuvre", 'C16')}
              {renderPie(stats.c18, "Détail C18 - Coordination", 'C18')}
            </div>
          </div>
        )}

        <div style={{ display: activeTab === 'tableau' ? 'block' : 'none' }}>
          <div className="competences-header-text">
          <h1>Annexe 12 - BTS « BÂTIMENT » - Epreuve U61 SUIVI DE CHANTIER – SESSION 2027</h1>
          <h2>Fiche de cadrage et de suivi de période en entreprise (apprentissage)</h2>
          <p>
            Annexe à imprimer au format A3 et à compléter <strong>PAR LE TUTEUR AVEC SON APPRENTI</strong> en <strong>DEBUT</strong> et en <strong>FIN</strong> de période en entreprise. En début d'immersion, noter <strong>N, O</strong> ou <strong>R</strong> dans la colonne de début et apporter les commentaires complémentaires. En fin de période en entreprise, apporter des commentaires sur le déroulement et l'implication du candidat. <strong>Une copie de ce document est conservée par le candidat.</strong> Cette annexe est à insérer complétée et signée dans le rapport d'activités U61.
          </p>
        </div>

        <table className="competences-table">
          <thead>
            <tr>
              <th colSpan="2" className="table-header-left">
                <div className="etablissement-info">
                  <span>Etablissement : <strong>SOGEA EST BTP</strong></span>
                  <span>Ville : <em>KRAUTERGERSHEIM</em></span>
                </div>
                <div className="nom-prenom-info">
                  <span>Nom : <strong>LUCAS</strong></span>
                  <span>Prénom : <strong>Zoé</strong></span>
                </div>
              </th>
              <th colSpan="3" className="text-center">DEBUT</th>
              <th colSpan="4" className="text-center">FIN<br/><span className="sub-th">de stage ou apprentissage</span></th>
              <th className="text-center">A compléter<br/>par :</th>
              <th className="text-center">ATTESTATION DE DEBUT<br/><span className="sub-th">(d'apprentissage)</span></th>
              <th className="text-center">ATTESTATION DE FIN<br/><span className="sub-th">(d'apprentissage)</span></th>
            </tr>
            <tr className="sub-headers">
              <th colSpan="2" className="text-center">Compétences observables ou mobilisables qui doivent être présentées par le candidat pour l'épreuve U61.</th>
              <th className="col-n">Non faisable<br/><strong>N</strong></th>
              <th className="col-o">Observable<br/><strong>O</strong></th>
              <th className="col-r">Réalisable<br/><strong>R</strong></th>
              <th className="col-fin">n'a pas été confronté au problème</th>
              <th className="col-fin">a entendu son tuteur en parler</th>
              <th className="col-fin">a assisté son tuteur dans cette tâche</th>
              <th className="col-fin">est intervenu en autonomie</th>
              <th></th>
              <th></th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {/* C2 Section */}
            <tr>
              <td rowSpan="4" className="bg-c2 cat-cell">
                <strong>C2</strong><br/>
                Exprimer techniquement le besoin du client
              </td>
              <td><strong>C2.1 Recueillir</strong> les données</td>
              <td></td><td></td><td className="text-center bold-text">R</td><td></td><td></td><td></td><td></td>
              <td rowSpan="8" className="text-center bold-text">Tuteur entreprise</td>
              <td rowSpan="8" className="signature-cell">
                <div style={{ fontSize: '11px', lineHeight: '1.4', textAlign: 'left' }}>
                  Accueil et présentation à l'agence réalisé au démarrage, suivi d'un accueil sécurité avec la RSE sur les attendus de l'entreprise.<br/><br/>
                  Dans un premier temps Zoé réalisera des études et assistera les conducteurs de travaux dans les préparations de chantier.<br/><br/>
                  Dans un 2ème temps Zoé participera +/- en autonomie aux suivis et organisation de chantier de petite et grande importance en fonction de ses acquis et de la complexité des chantiers.<br/><br/>
                  <strong>Benoît HERTZOG chef de secteur</strong><br/>
                  Le 06/02/2026
                </div>
              </td>
              <td rowSpan="8" className="signature-cell"></td>
            </tr>
            <tr>
              <td><strong>C2.2 Traduire</strong> techniquement le besoin</td>
              <td></td><td></td><td className="text-center bold-text">R</td><td></td><td></td><td></td><td></td>
            </tr>
            <tr>
              <td><strong>C2.3 Présenter</strong> et <strong>justifier</strong> les solutions proposées</td>
              <td></td><td></td><td className="text-center bold-text">R</td><td></td><td></td><td></td><td></td>
            </tr>
            <tr>
              <td><strong>C2.4 Proposer</strong> des variantes techniques</td>
              <td></td><td></td><td className="text-center bold-text">R</td><td></td><td></td><td></td><td></td>
            </tr>

            {/* C15 Section */}
            <tr>
              <td rowSpan="4" className="bg-c15 cat-cell">
                <strong>C15</strong><br/>
                Gérer les dépenses et les recettes d'un chantier
              </td>
              <td><strong>C15.1 Établir</strong> l'avancement des travaux y compris les travaux modificatifs</td>
              <td></td><td></td><td className="text-center bold-text">R</td><td></td><td></td><td></td><td></td>
            </tr>
            <tr>
              <td><strong>C15.2 Établir</strong> une situation de travaux y compris les travaux modificatifs</td>
              <td></td><td></td><td className="text-center bold-text">R</td><td></td><td></td><td></td><td></td>
            </tr>
            <tr>
              <td><strong>C15.3 Valider</strong> les factures des fournisseurs (bons de livraison – factures)</td>
              <td></td><td></td><td className="text-center bold-text">R</td><td></td><td></td><td></td><td></td>
            </tr>
            <tr>
              <td><strong>C15.4 Récupérer</strong> et <strong>saisir</strong> les coûts réels des dépenses</td>
              <td></td><td></td><td className="text-center bold-text">R</td><td></td><td></td><td></td><td></td>
            </tr>

            {/* C16 Apprenti Section */}
            <tr>
              <td rowSpan="9" className="bg-c16 cat-cell">
                <strong>C16</strong><br/>
                Conduire les travaux en phase de gros œuvre
              </td>
              <td><strong>C16.1 Analyser</strong> les écarts sur la base des tableaux de bord établis</td>
              <td></td><td></td><td className="text-center bold-text">R</td><td></td><td></td><td></td><td></td>
              <td rowSpan="4" className="text-center bold-text">Apprenti</td>
              <td rowSpan="4" className="signature-cell">
                <div style={{ fontSize: '11px', textAlign: 'center' }}>
                  Le 06.02.26
                  <br/><br/>
                  <em>(Signature)</em>
                </div>
              </td>
              <td rowSpan="4" className="signature-cell"></td>
            </tr>
            <tr>
              <td><strong>C16.2 Contrôler</strong> l'exécution des ouvrages y compris les interfaces entre les corps d'états.</td>
              <td></td><td></td><td className="text-center bold-text">R</td><td></td><td></td><td></td><td></td>
            </tr>
            <tr>
              <td><strong>C16.3 Adapter</strong> les moyens en main d'œuvre et en matériel</td>
              <td></td><td></td><td className="text-center bold-text">R</td><td></td><td></td><td></td><td></td>
            </tr>
            <tr>
              <td><strong>C16.4 Planifier</strong> et <strong>coordonner</strong> des interventions et des approvisionnements</td>
              <td></td><td></td><td className="text-center bold-text">R</td><td></td><td></td><td></td><td></td>
            </tr>

            {/* C16 Entreprise Section */}
            <tr>
              <td><strong>C16.5 Mettre à jour</strong> l'avancement des travaux et <strong>établir</strong> les mesures correctives.</td>
              <td></td><td></td><td className="text-center bold-text">R</td><td></td><td></td><td></td><td></td>
              <td rowSpan="5" className="text-center bold-text">Entreprise</td>
              <td rowSpan="5" className="signature-cell">
                <div style={{ fontSize: '10px', textAlign: 'center' }}>
                  Le 06.02.2026<br/><br/>
                  <strong>SOGEA EST BTP</strong><br/>
                  Route de Krautersheim<br/>
                  67880 KRAUTERGERSHEIM
                </div>
              </td>
              <td rowSpan="5" className="signature-cell"></td>
            </tr>
            <tr>
              <td><strong>C16.6 Gérer</strong> les imprévus.</td>
              <td></td><td></td><td className="text-center bold-text">R</td><td></td><td></td><td></td><td></td>
            </tr>
            <tr>
              <td><strong>C16.7 Compléter</strong> les documents du chantier (PPSPS, PAJ, fiches,...)</td>
              <td></td><td></td><td className="text-center bold-text">R</td><td></td><td></td><td></td><td></td>
            </tr>
            <tr>
              <td><strong>C16.8 Vérifier</strong> la conformité des équipements, matériaux et matériels livrés</td>
              <td></td><td></td><td className="text-center bold-text">R</td><td></td><td></td><td></td><td></td>
            </tr>
            <tr>
              <td><strong>C16.9 Faire respecter</strong> les dispositions d'hygiène, de sécurité et de protection de l'environnement.</td>
              <td></td><td></td><td className="text-center bold-text">R</td><td></td><td></td><td></td><td></td>
            </tr>

            {/* C18 Section */}
            <tr>
              <td rowSpan="2" className="bg-c18 cat-cell">
                <strong>C18</strong><br/>
                Assurer la coordination avec les intervenants du chantier
              </td>
              <td><strong>C18.1 Planifier</strong> et <strong>coordonner</strong> les interventions des corps d'état.</td>
              <td></td><td></td><td className="text-center bold-text">R</td><td></td><td></td><td></td><td></td>
              <td rowSpan="2" className="text-center bold-text text-sm">Centre de formation</td>
              <td rowSpan="2" className="signature-cell center-bold">
                ROUSSEY FREDERIC
              </td>
              <td rowSpan="2" className="signature-cell text-xs">
                (nom, remarques et signature du responsable du suivi du centre de formation)
              </td>
            </tr>
            <tr>
              <td><strong>C18.2 Conduire</strong> une réunion de travail</td>
              <td></td><td></td><td className="text-center bold-text">R</td><td></td><td></td><td></td><td></td>
            </tr>
          </tbody>
        </table>
        
        <div className="competences-footer">
          <p><em>Document à renvoyer par l'entreprise au centre de formation en début de stage, et une seconde copie en fin de stage.</em></p>
        </div>
        
        </div>
      </div>
    </div>
  );
};

export default Competences;
