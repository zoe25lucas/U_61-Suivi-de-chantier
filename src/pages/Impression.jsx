import React, { useState, useEffect, Fragment } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Mail, Phone, MapPin, User, Clock, BookOpen, Award, ExternalLink, Building2, Globe, Star, Users, CheckSquare, Square, Briefcase, List, FileText
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix pour les icônes Leaflet par défaut
if (L && L.Icon && L.Icon.Default) {
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  });
}

const DEFAULT_COMPANY = {
  name: "Sogea Environnement",
  eyebrow: "UNE ENTITÉ DE VINCI CONSTRUCTION",
  sub: "L'expert des métiers de l'hydraulique en France",
  website: "sogea-environnement.fr",
  description: "Sogea Environnement intervient sur l'ensemble du cycle de l'eau, de la conception à la maintenance, pour le compte de clients publics et privés. Forte d'un ancrage territorial historique, l'entreprise s'appuie sur un réseau de 70 agences pour proposer des solutions innovantes et durables dans les domaines de l'eau potable, de l'assainissement et des réseaux secs.",
  sections: [
    {
      id: 's1',
      type: 'SKILLS',
      title: 'Engagement RSE 2030',
      groups: [
        { title: 'NOS PRIORITÉS ENVIRONNEMENTALES', pills: ['Décarbonation', 'Économie circulaire', 'Biodiversité', 'Sobriété numérique'] },
        { title: 'SÉCURITÉ & SOCIÉTAL', pills: ['Zéro Accident', 'Mixité & Diversité', 'Insertion professionnelle'] }
      ]
    },
    {
      id: 's2',
      type: 'TIMELINE',
      title: 'Activités Principales',
      content: [
        { title: 'Cycle de l\'eau', date_label: 'Production & Distribution', description: 'Production et distribution d\'eau potable, captage, stockage et traitement des eaux usées.' },
        { title: 'Réseaux enterrés', date_label: 'Secs & Humides', description: 'Réseaux secs (fibre, gaz), réseaux de chaleur et de froid urbains.' },
        { title: 'Services & Maintenance', date_label: 'Expertise Technique', description: 'Réhabilitation, entretien et exploitation d\'équipements hydrauliques complexes.' }
      ]
    }
  ],
  org_data: {
    name: "PHILIPPE LAMBERT",
    role: "Directeur d'activité",
    children: [
      { name: "ALEXANDRA NAZZARO", role: "Animatrice Qualité" },
      { name: "ANTHONY ABERGEL", role: "Assistant d'agence" },
      { name: "NAJAT AMEZRHER", role: "Assistante d'agence" },
      { name: "CHRISTIAN KOELL", role: "Chef d'agence" },
      {
        name: "BENOIT HERTZOG",
        role: "Chef de secteur",
        children: [
          { name: "ZOÉ LUCAS", role: "Alternante aide chef de chantier", isUser: true },
          { name: "FLORINE DIGNIEL", role: "Alternante bureau d'études" },
          { name: "JOSE VALENTE FERREIRA", role: "Chef d'équipe" },
          { name: "NUNO DA SILVA", role: "Chef de chantier" },
          {
            name: "INES SCHALCK",
            role: "Conductrice de travaux",
            children: [
              { name: "CÉLESTIN VERNIER", role: "Alternant assistant chef d'équipe" },
              { name: "LUCAS UEBERSCHLAG", role: "Alternant" }
            ]
          }
        ]
      },
      { name: "THOMAS SCHLOTZER", role: "Chef de secteur" },
      { name: "MARIE BOUSSE", role: "Cheffe de secteur" },
      { name: "THIBAUT KLEIN", role: "Chef d'agence" }
    ]
  }
};

const CHECKLIST_SECTIONS = {
  diagnostics: {
    title: "Liste Documents",
    items: ["Règlement de la Consultation (RC)", "Décomposition du Prix Global et Forfaitaire (DPGF)", "Plan Général de Coordination (PGC)"]
  },
  planifications: {
    title: "Planifications Chantier",
    items: ["Modes opératoires / SAFE", "Budget d'exécution", "Fiche « appel en cas d'accident »", "Plan d'Installation de Chantier (PIC) :"]
  },
  securite: {
    title: "Sécurité et Qualité",
    items: ["PPSPS", "PPSPS Simplifie", "Examen d'adéquation de pelle utilisée en levage", "Plan d'Assurance Qualité", "Plan de Respect de l'Environnement", "Conduite à tenir en cas d'accident", "Analyse des risques particuliers du chantier", "Protocole de sécurité", "Convention utilisation des déchets inertes à des fins d'aménagement"]
  }
};

const PrintMapUpdater = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 18);
    setTimeout(() => map.invalidateSize(), 500);
  }, [center, map]);
  return null;
};

const extractCompId = (compStr) => {
  if (!compStr) return null;
  const match = String(compStr).match(/^(C\d+\.\d+|C\d+)/);
  return match ? match[1] : null;
};

// Ordonne une liste de chantiers en arborescence : parent puis ses sous-chantiers
const buildHierarchy = (chantiers) => {
  const byParent = {};
  chantiers.forEach(c => { if (c.parent_id) { (byParent[c.parent_id] = byParent[c.parent_id] || []).push(c); } });
  const sortSub = (a, b) => String(a.numero || '').localeCompare(String(b.numero || ''), 'fr', { numeric: true });
  const ordered = [];
  chantiers.filter(c => !c.parent_id).forEach(root => {
    const kids = (byParent[root.id] || []).slice().sort(sortSub);
    ordered.push({ ...root, depth: 0, isParent: kids.length > 0 });
    kids.forEach(k => ordered.push({ ...k, depth: 1, isParent: false }));
  });
  return ordered;
};

// Référentiel officiel U61 (couleurs + libellés), partagé carte chantier / tableau
const COMPETENCES_REF = {
  C2: {
    title: "C2 - Exprimer techniquement le besoin du client", color: "#92bce3",
    items: [
      { id: "C2.1", label: "Recueillir les données" },
      { id: "C2.2", label: "Traduire techniquement le besoin" },
      { id: "C2.3", label: "Présenter et justifier les solutions proposées" },
      { id: "C2.4", label: "Proposer des variantes techniques" },
    ]
  },
  C15: {
    title: "C15 - Gérer les dépenses et les recettes d'un chantier", color: "#fce83a",
    items: [
      { id: "C15.1", label: "Établir l'avancement des travaux y compris les travaux modificatifs" },
      { id: "C15.2", label: "Établir une situation de travaux y compris les travaux modificatifs" },
      { id: "C15.3", label: "Valider les factures des fournisseurs (bons de livraison – factures)" },
      { id: "C15.4", label: "Récupérer et saisir les coûts réels des dépenses" },
    ]
  },
  C16: {
    title: "C16 - Conduire les travaux en phase de gros œuvre", color: "#a4e174",
    items: [
      { id: "C16.1", label: "Analyser les écarts sur la base des tableaux de bord établis" },
      { id: "C16.2", label: "Contrôler l'exécution des ouvrages y compris les interfaces entre les corps d'états." },
      { id: "C16.3", label: "Adapter les moyens en main d'œuvre et en matériel" },
      { id: "C16.4", label: "Planifier et coordonner des interventions et des approvisionnements" },
      { id: "C16.5", label: "Mettre à jour l'avancement des travaux et établir les mesures correctives." },
      { id: "C16.6", label: "Gérer les imprévus." },
      { id: "C16.7", label: "Compléter les documents du chantier (PPSPS, PAJ, fiches,...)" },
      { id: "C16.8", label: "Vérifier la conformité des équipements, matériaux et matériels livrés" },
      { id: "C16.9", label: "Faire respecter les dispositions d'hygiène, de sécurité et de protection de l'environnement." },
    ]
  },
  C18: {
    title: "C18 - Assurer la coordination avec les intervenants du chantier", color: "#f5b085",
    items: [
      { id: "C18.1", label: "Planifier et coordonner les interventions des corps d'état." },
      { id: "C18.2", label: "Conduire une réunion de travail" },
    ]
  }
};

const Impression = () => {
  const [data, setData] = useState({ profile: null, certifications: [], formation: null, entreprise: null, chantiers: [], journal: [], themes: [] });
  const [loading, setLoading] = useState(true);

  const [selection, setSelection] = useState({
    profil: true,
    formation: true,
    entreprise: true,
    chantiers: false,
    themes: false,
    competences: false
  });

  const [selectedChantierIds, setSelectedChantierIds] = useState([]);
  const [selectedThemeIds, setSelectedThemeIds] = useState([]);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [
          resProfile,
          resCerts,
          resForm,
          resEnt,
          resProjects,
          resJournals,
          resThemes
        ] = await Promise.all([
          supabase.from('profiles').select('*').maybeSingle(),
          supabase.from('certifications').select('*'),
          supabase.from('formations').select('*').maybeSingle(),
          supabase.from('entreprise').select('*').maybeSingle(),
          supabase.from('chantiers').select('*').order('created_at', { ascending: false }),
          supabase.from('journal_entries').select('*'),
          supabase.from('themes').select('*').order('created_at', { ascending: true })
        ]);

        setData({
          profile: resProfile.data,
          certifications: resCerts.data || [],
          formation: resForm.data,
          entreprise: resEnt.data,
          chantiers: resProjects.data || [],
          journal: resJournals.data || [],
          themes: resThemes.data || []
        });

        if (resProjects.data) {
          setSelectedChantierIds(resProjects.data.map(c => c.id));
        }
        if (resThemes.data) {
          setSelectedThemeIds(resThemes.data.map(t => t.id));
        }
      } catch (err) {
        console.error("Error fetching all data for print:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  if (loading || !data.profile) return <div className="loading-print">Génération du book technique...</div>;

  const profile = data.profile;
  const formation = data.formation || {};
  const entreprise = { ...DEFAULT_COMPANY, ...data.entreprise };
  const chantiersSelectionnes = data.chantiers.filter(c => selectedChantierIds.includes(c.id));
  
  const sections = profile.sections || [];
  const formSections = formation.sections || [];
  const entSections = entreprise.sections || DEFAULT_COMPANY.sections;
  const avatarStyle = profile.avatar_style || { scale: 1, x: 0, y: 0 };

  // --- Sommaire intelligent + pagination X/Y (selon la sélection) ---
  const selectedSet = new Set(selection.chantiers ? selectedChantierIds : []);
  // Arborescence des chantiers sélectionnés (parents inclus si un enfant est coché)
  const orderedChantierRows = buildHierarchy(data.chantiers).filter(row =>
    selectedSet.has(row.id) ||
    (row.isParent && data.chantiers.some(c => c.parent_id === row.id && selectedSet.has(c.id)))
  );
  // Chantiers réellement imprimés = feuilles (sous-chantiers + chantiers indépendants), pas les groupes
  const renderableChantiers = orderedChantierRows.filter(r => selectedSet.has(r.id) && !r.isParent);
  const themesToPrint = selection.themes ? (data.themes || []).filter(t => selectedThemeIds.includes(t.id)) : [];

  // Compétences réalisées par chantier (depuis le journal) — pour la matrice récap
  const chantierCompsMap = {};
  (data.journal || []).forEach(entry => {
    let arr = entry.tasks;
    if (typeof arr === 'string') { try { arr = JSON.parse(arr); } catch { arr = []; } }
    if (!Array.isArray(arr)) arr = [];
    arr.forEach(t => {
      if (t && t.chantier_id) {
        (Array.isArray(t.competences) ? t.competences : []).forEach(code => {
          const id = extractCompId(code);
          if (id) { (chantierCompsMap[t.chantier_id] = chantierCompsMap[t.chantier_id] || new Set()).add(id); }
        });
      }
    });
  });

  // Récap chantiers scindé en blocs de colonnes pour tenir sur l'A4
  const RECAP_CHUNK = 8;
  const chantierChunks = [];
  for (let i = 0; i < renderableChantiers.length; i += RECAP_CHUNK) {
    chantierChunks.push(renderableChantiers.slice(i, i + RECAP_CHUNK));
  }
  const showRecapChantiers = selection.chantiers && renderableChantiers.length > 0;
  const showRecapThemes = themesToPrint.length > 0;

  const pagesProfil = selection.profil ? 2 : 0;
  const pagesFormation = selection.formation ? 1 : 0;
  const pagesEntreprise = selection.entreprise ? 2 : 0;
  const pagesChantiers = renderableChantiers.length * 2; // 2 pages / chantier
  const pagesRecapChantiers = showRecapChantiers ? chantierChunks.length : 0;
  const pagesRecapThemes = showRecapThemes ? 1 : 0;
  const pagesThemes = themesToPrint.length; // 1 page / thème
  const pagesComp = selection.competences ? 1 : 0;
  const hasAnySelection = (pagesProfil + pagesFormation + pagesEntreprise + pagesChantiers + pagesRecapChantiers + pagesRecapThemes + pagesThemes + pagesComp) > 0;

  // Page 1 = couverture (toujours), page 2 = sommaire (si sélection), contenu ensuite
  let pageCursor = 2 + (hasAnySelection ? 1 : 0);
  const sectionPages = {};
  if (pagesProfil) { sectionPages.profil = pageCursor; pageCursor += pagesProfil; }
  if (pagesFormation) { sectionPages.formation = pageCursor; pageCursor += pagesFormation; }
  if (pagesEntreprise) { sectionPages.entreprise = pageCursor; pageCursor += pagesEntreprise; }
  // Récap chantiers AVANT les pages chantiers
  if (pagesRecapChantiers) { sectionPages.recapChantiers = pageCursor; pageCursor += pagesRecapChantiers; }
  const chantierPageMap = {};
  renderableChantiers.forEach(r => { chantierPageMap[r.id] = pageCursor; pageCursor += 2; });
  // Récap thèmes AVANT les pages thèmes
  if (pagesRecapThemes) { sectionPages.recapThemes = pageCursor; pageCursor += pagesRecapThemes; }
  const themePageMap = {};
  themesToPrint.forEach(t => { themePageMap[t.id] = pageCursor; pageCursor += 1; });
  if (pagesComp) { sectionPages.competences = pageCursor; pageCursor += pagesComp; }
  const totalPages = pageCursor - 1;

  // Numérotation séquentielle des thèmes IMPRIMÉS (si on en saute un, les suivants se renumérotent)
  const themeNumberMap = {};
  themesToPrint.forEach((t, i) => { themeNumberMap[t.id] = i + 1; });

  // Sommaire cliquable : défile vers la page voulue (aperçu écran)
  const goToPage = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const renderTimeline = (content) => (
    <div className="print-timeline">
      {(content || []).map((item, i) => (
        <div key={i} className="print-tl-item">
          <div className="print-tl-dot"></div>
          <div className="print-tl-content">
            <div className="print-tl-meta"><span className="p-date">{item.date_label}</span></div>
            <div className="print-tl-title">{item.title}</div>
            <div className="print-tl-desc">{item.description}</div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderSkills = (groups) => (
    <div className="print-skills-wrap">
      {(groups || []).map((g, i) => (
        <div key={i} className="print-skill-group">
          <div className="p-skill-title">{g.title}</div>
          <div className="p-skill-pills">
            {(g.pills || []).map((p, pi) => <span key={pi} className="p-pill">{p}</span>)}
          </div>
        </div>
      ))}
    </div>
  );

  const renderLanguages = () => {
    const list = data.certifications.length > 0 ? data.certifications : [
      { titre: 'Français', niveau: 'NATIF' },
      { titre: 'Allemand', niveau: 'B2 - C1' },
      { titre: 'Anglais', niveau: 'COURANT' }
    ];
    return (
      <div className="p-languages-list">
        {list.map((l, i) => {
           const getPct = (lvl) => {
             const s = lvl?.toUpperCase() || '';
             if (s.includes('NATIF')) return 100;
             if (s.includes('C1')) return 88;
             if (s.includes('B2')) return 72;
             if (s.includes('COURANT')) return 85;
             return 50;
           };
           return (
            <div key={i} className="p-lang-row">
              <div className="p-lang-head"><span className="l-name">{l.titre}</span><span className="l-lvl">{l.niveau}</span></div>
              <div className="p-lang-bar"><div className="fill" style={{ width: `${getPct(l.niveau)}%` }}></div></div>
            </div>
           );
        })}
      </div>
    );
  };

  const renderOrgNode = (node, depth = 0) => {
    if (!node) return null;
    return (
      <div className="print-org-node-wrap" key={node.name + depth}>
        <div className={`print-org-card ${node.isUser || node.name?.includes('ZOÉ') ? 'user-highlight' : ''}`}>
          <div className="org-name">{node.name}</div>
          <div className="org-role">{node.role}</div>
        </div>
        {node.children && node.children.length > 0 && (
          <div className="print-org-children">
            {node.children.map(child => renderOrgNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const renderSection = (s) => {
    const getIcon = () => {
      const t = s.title?.toLowerCase() || '';
      if (t.includes('formation')) return <BookOpen size={20} />;
      if (t.includes('expérience')) return <Clock size={20} />;
      if (t.includes('compétence') || t.includes('certif')) return <Award size={20} />;
      if (t.includes('langue')) return <ExternalLink size={20} />;
      if (t.includes('activité')) return <Star size={20} />;
      return <Star size={20} />;
    };
    const isLang = s.title?.toLowerCase().includes('langue') || s.id === 'lang';
    return (
      <div key={s.id} className="print-card">
        <div className="p-card-head">{getIcon()} <span>{s.title}</span></div>
        {isLang ? renderLanguages() :
         s.type === 'TEXT' ? <p className="p-card-text">{s.content}</p> :
         s.type === 'TIMELINE' ? renderTimeline(s.content) : renderSkills(s.groups)}
      </div>
    );
  };

  const groupJournalEntries = (entries) => {
    const grouped = [];
    if (!entries) return grouped;
    const sorted = [...entries].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    sorted.forEach(entry => {
      const last = grouped[grouped.length - 1];
      if (last && last.content === entry.content && (last.competence_id === entry.competence_id || last.competences === entry.competences)) {
        last.endDate = entry.date;
      } else {
        grouped.push({ ...entry, startDate: entry.date, endDate: entry.date });
      }
    });
    return grouped;
  };

  const renderChantierPage = (c) => {
    try {
      // Correct Journal Task Extraction
      const journalTasks = [];
      (data.journal || []).forEach(entry => {
        let tasksArr = entry.tasks;
        if (typeof tasksArr === 'string') {
          try { tasksArr = JSON.parse(tasksArr); } catch(e) { tasksArr = []; }
        }
        if (Array.isArray(tasksArr)) {
          tasksArr.forEach(t => {
            if (t && String(t.chantier_id || '') === String(c.id)) {
              journalTasks.push({ ...t, date: entry.date });
            }
          });
        }
      });

      const groupedJournal = groupJournalEntries(journalTasks);

      // Compétences réellement mobilisées (depuis le journal), groupées par catégorie
      const realizedIds = new Set();
      journalTasks.forEach(t => {
        (Array.isArray(t.competences) ? t.competences : []).forEach(code => {
          const id = extractCompId(code);
          if (id) realizedIds.add(id);
        });
      });
      // Repli : si rien dans le journal, on prend les compétences cochées sur le chantier
      if (realizedIds.size === 0) {
        (c.competencesMobilisees || []).forEach(code => { const id = extractCompId(code); if (id) realizedIds.add(id); });
      }
      const realizedByCat = Object.entries(COMPETENCES_REF).map(([cat, data]) => ({
        cat,
        color: data.color,
        title: data.title,
        items: data.items.filter(it => realizedIds.has(it.id)),
      })).filter(g => g.items.length > 0);
      const realizedCount = realizedByCat.reduce((n, g) => n + g.items.length, 0);

      const hasValidCoords = Array.isArray(c.coordinates) && c.coordinates.length === 2 && !isNaN(c.coordinates[0]) && !isNaN(c.coordinates[1]);

      return (
        <React.Fragment key={c.id}>
          {/* PAGE 1: HEADER + MAP + INFO */}
          <div className="print-page-wrap" id={`pg-ch-${c.id}`}>
            <div className="p-header-top">
               <div className="p-header-left">
                  <div className="p-company-logo">SOGEA</div>
                  <div className="p-eyebrow">UNE ENTITÉ DE VINCI CONSTRUCTION</div>
               </div>
            </div>

            <div className="p-chantier-header-extended">
              <div className="p-header-left">
                <h1 className="p-chantier-title-main">{c.nom || "Sans nom"}</h1>
                <div className="p-address-row">
                  <MapPin size={14} color="var(--accent)" />
                  <span>{c.lieu} {hasValidCoords ? `(${c.coordinates[0].toFixed(6)}, ${c.coordinates[1].toFixed(6)})` : ""}</span>
                </div>
                <div className="p-meta-chips-row">
                  <div className="p-meta-chip"><Briefcase size={12}/> <span>{c.typeProjet || "Sous-traitant – suivi de chantier"}</span></div>
                  <div className="p-meta-chip"><User size={12}/> <span>Conducteur non assigné</span></div>
                </div>
                <div className="p-status-badge">CHANTIER EN COURS</div>
              </div>
              <div className="p-header-right-photo">
                {c.photo_principale ? (
                  <div className="p-main-photo-frame">
                     <img src={c.photo_principale} style={{
                       transform: c.photo_principale_style ? `scale(${c.photo_principale_style.scale || 1}) translate(${c.photo_principale_style.x || 0}px, ${c.photo_principale_style.y || 0}px)` : 'none',
                       transformOrigin: 'center'
                     }} />
                  </div>
                ) : <div className="p-no-photo">Pas de photo</div>}
              </div>
            </div>

            {/* COMPÉTENCES MOBILISÉES — en tête de page, visibles au premier coup d'œil */}
            <div className="print-card p-comp-top">
              <div className="p-card-head"><Award size={18}/> <span>Compétences mobilisées ({realizedCount})</span></div>
              {realizedByCat.length > 0 ? (
                <div className="p-comp-cats">
                  {realizedByCat.map(g => (
                    <div key={g.cat} className="p-comp-cat" style={{ borderLeft: `4px solid ${g.color}` }}>
                      <div className="p-comp-cat-title">{g.title}</div>
                      <div className="p-comp-pills">
                        {g.items.map(it => (
                          <span key={it.id} className="p-comp-pill" style={{ background: `${g.color}33`, borderColor: g.color }}>
                            <strong>{it.id}</strong> {it.label}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="p-card-text" style={{ opacity: 0.6 }}>Aucune compétence enregistrée pour ce chantier.</p>
              )}
            </div>

            <div className="p-large-map-section">
               {hasValidCoords ? (
                 <MapContainer 
                   center={c.coordinates} 
                   zoom={18} 
                   zoomControl={false} 
                   dragging={false} 
                   scrollWheelZoom={false}
                   doubleClickZoom={false}
                   style={{ width: '100%', height: '100%', borderRadius: '32px' }}
                 >
                   <TileLayer
                     url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                     attribution='&copy; Esri'
                   />
                   <Marker position={c.coordinates} />
                   <PrintMapUpdater center={c.coordinates} />
                 </MapContainer>
               ) : (
                 <div className="p-map-placeholder-satellite">
                    <div className="p-map-marker-center"></div>
                    <div className="p-map-info-overlay">VUE SATELLITE DU CHANTIER (COORDONNÉES N/C)</div>
                 </div>
               )}
            </div>

            <div className="p-cards-grid-4">
               <div className="print-card">
                  <div className="p-card-head"><Clock size={18}/> <span>Chronologie</span></div>
                  <div className="p-data-table-mini">
                     <div className="p-dt-row"><span>APPEL D'OFFRE</span><strong>{c.datesChantier?.appelOffre || "Non renseigné"}</strong></div>
                     <div className="p-dt-row"><span>ATTRIBUÉ LE</span><strong>{c.datesChantier?.gagne || "-"}</strong></div>
                     <div className="p-dt-row"><span>DÉBUT</span><strong>{c.datesChantier?.debut || "-"}</strong></div>
                     <div className="p-dt-row"><span>FIN</span><strong>{c.datesChantier?.fin || "-"}</strong></div>
                  </div>
               </div>
               <div className="print-card">
                  <div className="p-card-head"><Award size={18}/> <span>Mon Rôle</span></div>
                  <p className="p-card-text">{c.roleApprenti || "Rôle non défini"}</p>
               </div>
               <div className="print-card">
                  <div className="p-card-head"><Building2 size={18}/> <span>Intervenants</span></div>
                  <div className="p-data-table-mini">
                     <div className="p-dt-row"><span>MOA</span><strong>{c.maitreOuvrage || "-"}</strong></div>
                     <div className="p-dt-row"><span>MOE</span><strong>{c.maitreOeuvre || "-"}</strong></div>
                     <div className="p-dt-row"><span>CSPS</span><strong>-</strong></div>
                     <div className="p-dt-row"><span>CT</span><strong>-</strong></div>
                     <div className="p-dt-row"><span>MARCHÉ</span><strong>{c.marche || "-"}</strong></div>
                  </div>
               </div>
               <div className="print-card">
                  <div className="p-card-head"><Star size={18}/> <span>Description Technique</span></div>
                  <div className="p-card-text-small">
                     {c.descriptionProjet?.projet ? (
                       <div dangerouslySetInnerHTML={{ __html: String(c.descriptionProjet.projet).replace(/\\n/g, '<br/>') }} />
                     ) : "Aucune description technique renseignée."}
                  </div>
               </div>
            </div>
            <div className="page-context-footer">Mes Chantiers — {c.nom}</div>
            <div className="page-number-footer"></div>
          </div>

          {/* PAGE 2: GALLERY, SKILLS, JOURNAL & CHECKLISTS */}
          <div className="print-page-wrap">
             <div className="p-cards-grid-mixed">
                <div className="p-mixed-col">
                   {c.illustrations && c.illustrations.length > 1 && (
                     <div className="print-card">
                        <div className="p-card-head"><Globe size={18}/> <span>Galerie (suite)</span></div>
                        <div className="p-gallery-preview-mini">
                           <img src={c.illustrations[1].url} style={{ width: '100%', borderRadius: '10px' }} />
                        </div>
                     </div>
                   )}
                </div>
                <div className="p-mixed-col">
                   {c.illustrations && c.illustrations.length > 0 && (
                     <div className="print-card">
                        <div className="p-card-head"><Globe size={18}/> <span>Galerie Visuelle</span></div>
                        <div className="p-gallery-preview-mini">
                           <img src={c.illustrations[0].url} style={{ width: '100%', borderRadius: '10px' }} />
                        </div>
                     </div>
                   )}
                   {groupedJournal.length > 0 && (
                     <div className="print-card">
                        <div className="p-card-head"><List size={18}/> <span>Journal de tâche</span></div>
                        <div className="p-journal-list-mini">
                           {groupedJournal.map((j, idx) => (
                             <div key={idx} className="p-journal-item-mini">
                                <div className="p-journal-date-box">
                                   DU {new Date(j.startDate).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })} AU {new Date(j.endDate).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                                </div>
                                <div className="p-journal-desc-box">
                                   <strong>{j.content}</strong>
                                   {(j.competence_id || j.competences) && <div className="p-journal-comp-badge">{j.competence_id || (Array.isArray(j.competences) ? j.competences[0] : j.competences)}</div>}
                                </div>
                             </div>
                           ))}
                        </div>
                     </div>
                   )}
                </div>
             </div>

             <div className="p-checklists-row" style={{ marginTop: '2rem' }}>
                {Object.values(CHECKLIST_SECTIONS).map((section, sidx) => (
                  <div key={sidx} className="print-card checklist-card">
                     <div className="p-card-head-mini">{section.title.toUpperCase()}</div>
                     <ul className="p-checklist-dots">
                        {section.items.map((item, iidx) => (
                          <li key={iidx}>• {item}</li>
                        ))}
                     </ul>
                  </div>
                ))}
             </div>
             <div className="page-context-footer">Mes Chantiers — {c.nom}</div>
             <div className="page-number-footer"></div>
          </div>
        </React.Fragment>
      );
    } catch (error) {
      console.error("Error rendering chantier page:", error);
      return <div className="print-page-wrap">Erreur lors de la génération de la page du chantier {c.nom}</div>;
    }
  };

  // Tableau officiel U61 (Annexe 12) — version impression
  const renderCompetencesU61 = () => (
    <div className="print-page-wrap p-comp-table-page" id="pg-competences">
      <div className="competences-header-text">
        <h1>Annexe 12 - BTS « BÂTIMENT » - Épreuve U61 SUIVI DE CHANTIER – SESSION 2027</h1>
        <h2>Fiche de cadrage et de suivi de période en entreprise (apprentissage)</h2>
      </div>
      <table className="competences-table">
        <colgroup>
          <col style={{ width: '9%' }} />
          <col style={{ width: '23%' }} />
          <col style={{ width: '4%' }} />
          <col style={{ width: '4%' }} />
          <col style={{ width: '4%' }} />
          <col style={{ width: '6%' }} />
          <col style={{ width: '6%' }} />
          <col style={{ width: '6%' }} />
          <col style={{ width: '6%' }} />
          <col style={{ width: '7%' }} />
          <col style={{ width: '12.5%' }} />
          <col style={{ width: '12.5%' }} />
        </colgroup>
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
            <th></th><th></th><th></th>
          </tr>
        </thead>
        <tbody>
          {/* C2 */}
          <tr>
            <td rowSpan="4" className="bg-c2 cat-cell"><strong>C2</strong><br/>Exprimer techniquement le besoin du client</td>
            <td><strong>C2.1 Recueillir</strong> les données</td>
            <td></td><td></td><td className="text-center bold-text">R</td><td></td><td></td><td></td><td></td>
            <td rowSpan="8" className="text-center bold-text">Tuteur entreprise</td>
            <td rowSpan="8" className="signature-cell">
              <div style={{ fontSize: '11px', lineHeight: '1.4', textAlign: 'left' }}>
                Accueil et présentation à l'agence réalisé au démarrage, suivi d'un accueil sécurité avec la RSE sur les attendus de l'entreprise.<br/><br/>
                Dans un premier temps Zoé réalisera des études et assistera les conducteurs de travaux dans les préparations de chantier.<br/><br/>
                Dans un 2ème temps Zoé participera +/- en autonomie aux suivis et organisation de chantier de petite et grande importance en fonction de ses acquis et de la complexité des chantiers.<br/><br/>
                <strong>Benoît HERTZOG chef de secteur</strong><br/>Le 06/02/2026
              </div>
            </td>
            <td rowSpan="8" className="signature-cell"></td>
          </tr>
          <tr><td><strong>C2.2 Traduire</strong> techniquement le besoin</td><td></td><td></td><td className="text-center bold-text">R</td><td></td><td></td><td></td><td></td></tr>
          <tr><td><strong>C2.3 Présenter</strong> et <strong>justifier</strong> les solutions proposées</td><td></td><td></td><td className="text-center bold-text">R</td><td></td><td></td><td></td><td></td></tr>
          <tr><td><strong>C2.4 Proposer</strong> des variantes techniques</td><td></td><td></td><td className="text-center bold-text">R</td><td></td><td></td><td></td><td></td></tr>

          {/* C15 */}
          <tr>
            <td rowSpan="4" className="bg-c15 cat-cell"><strong>C15</strong><br/>Gérer les dépenses et les recettes d'un chantier</td>
            <td><strong>C15.1 Établir</strong> l'avancement des travaux y compris les travaux modificatifs</td>
            <td></td><td></td><td className="text-center bold-text">R</td><td></td><td></td><td></td><td></td>
          </tr>
          <tr><td><strong>C15.2 Établir</strong> une situation de travaux y compris les travaux modificatifs</td><td></td><td></td><td className="text-center bold-text">R</td><td></td><td></td><td></td><td></td></tr>
          <tr><td><strong>C15.3 Valider</strong> les factures des fournisseurs (bons de livraison – factures)</td><td></td><td></td><td className="text-center bold-text">R</td><td></td><td></td><td></td><td></td></tr>
          <tr><td><strong>C15.4 Récupérer</strong> et <strong>saisir</strong> les coûts réels des dépenses</td><td></td><td></td><td className="text-center bold-text">R</td><td></td><td></td><td></td><td></td></tr>

          {/* C16 */}
          <tr>
            <td rowSpan="9" className="bg-c16 cat-cell"><strong>C16</strong><br/>Conduire les travaux en phase de gros œuvre</td>
            <td><strong>C16.1 Analyser</strong> les écarts sur la base des tableaux de bord établis</td>
            <td></td><td></td><td className="text-center bold-text">R</td><td></td><td></td><td></td><td></td>
            <td rowSpan="4" className="text-center bold-text">Apprenti</td>
            <td rowSpan="4" className="signature-cell"><div style={{ fontSize: '11px', textAlign: 'center' }}>Le 06.02.26<br/><br/><em>(Signature)</em></div></td>
            <td rowSpan="4" className="signature-cell"></td>
          </tr>
          <tr><td><strong>C16.2 Contrôler</strong> l'exécution des ouvrages y compris les interfaces entre les corps d'états.</td><td></td><td></td><td className="text-center bold-text">R</td><td></td><td></td><td></td><td></td></tr>
          <tr><td><strong>C16.3 Adapter</strong> les moyens en main d'œuvre et en matériel</td><td></td><td></td><td className="text-center bold-text">R</td><td></td><td></td><td></td><td></td></tr>
          <tr><td><strong>C16.4 Planifier</strong> et <strong>coordonner</strong> des interventions et des approvisionnements</td><td></td><td></td><td className="text-center bold-text">R</td><td></td><td></td><td></td><td></td></tr>
          <tr>
            <td><strong>C16.5 Mettre à jour</strong> l'avancement des travaux et <strong>établir</strong> les mesures correctives.</td>
            <td></td><td></td><td className="text-center bold-text">R</td><td></td><td></td><td></td><td></td>
            <td rowSpan="5" className="text-center bold-text">Entreprise</td>
            <td rowSpan="5" className="signature-cell"><div style={{ fontSize: '10px', textAlign: 'center' }}>Le 06.02.2026<br/><br/><strong>SOGEA EST BTP</strong><br/>Route de Krautersheim<br/>67880 KRAUTERGERSHEIM</div></td>
            <td rowSpan="5" className="signature-cell"></td>
          </tr>
          <tr><td><strong>C16.6 Gérer</strong> les imprévus.</td><td></td><td></td><td className="text-center bold-text">R</td><td></td><td></td><td></td><td></td></tr>
          <tr><td><strong>C16.7 Compléter</strong> les documents du chantier (PPSPS, PAJ, fiches,...)</td><td></td><td></td><td className="text-center bold-text">R</td><td></td><td></td><td></td><td></td></tr>
          <tr><td><strong>C16.8 Vérifier</strong> la conformité des équipements, matériaux et matériels livrés</td><td></td><td></td><td className="text-center bold-text">R</td><td></td><td></td><td></td><td></td></tr>
          <tr><td><strong>C16.9 Faire respecter</strong> les dispositions d'hygiène, de sécurité et de protection de l'environnement.</td><td></td><td></td><td className="text-center bold-text">R</td><td></td><td></td><td></td><td></td></tr>

          {/* C18 */}
          <tr>
            <td rowSpan="2" className="bg-c18 cat-cell"><strong>C18</strong><br/>Assurer la coordination avec les intervenants du chantier</td>
            <td><strong>C18.1 Planifier</strong> et <strong>coordonner</strong> les interventions des corps d'état.</td>
            <td></td><td></td><td className="text-center bold-text">R</td><td></td><td></td><td></td><td></td>
            <td rowSpan="2" className="text-center bold-text text-sm">Centre de formation</td>
            <td rowSpan="2" className="signature-cell center-bold">ROUSSEY FREDERIC</td>
            <td rowSpan="2" className="signature-cell text-xs">(nom, remarques et signature du responsable du suivi du centre de formation)</td>
          </tr>
          <tr><td><strong>C18.2 Conduire</strong> une réunion de travail</td><td></td><td></td><td className="text-center bold-text">R</td><td></td><td></td><td></td><td></td></tr>
        </tbody>
      </table>
      <div className="competences-footer" style={{ marginTop: '12px', fontSize: '10px', fontStyle: 'italic', opacity: 0.7 }}>
        Document à renvoyer par l'entreprise au centre de formation en début de stage, et une seconde copie en fin de stage.
      </div>
      <div className="page-context-footer">Compétences — Tableau U61</div>
      <div className="page-number-footer"></div>
    </div>
  );

  // Page d'un thème d'étude
  const renderThemePage = (theme) => {
    const comps = theme.competences || [];
    const linkedCh = data.chantiers.find(c => c.id === theme.chantier_id);
    return (
      <div className="print-page-wrap" key={theme.id} id={`pg-theme-${theme.id}`}>
        <div className="p-header-top">
          <div className="p-header-left">
            <div className="p-company-logo">SOGEA</div>
            <div className="p-eyebrow">THÈME D'ÉTUDE · THÈME N°{themeNumberMap[theme.id] || ''}</div>
          </div>
        </div>
        <h1 className="p-chantier-title-main" style={{ marginBottom: '8px' }}>Thème N°{themeNumberMap[theme.id] || ''} — {theme.title}</h1>
        {linkedCh && (
          <div className="p-address-row" style={{ marginBottom: '14px' }}>
            <Building2 size={14} color="var(--accent)" /> <span>Chantier associé : {linkedCh.nom}</span>
          </div>
        )}
        {comps.length > 0 && (
          <div className="print-card p-comp-top" style={{ marginBottom: '1.2rem' }}>
            <div className="p-card-head"><Award size={18} /> <span>Compétences visées</span></div>
            <div className="p-comp-pills" style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {comps.map(code => {
                let color = '#cccccc';
                Object.values(COMPETENCES_REF).forEach(g => { if (g.items.find(it => it.id === code)) color = g.color; });
                return <span key={code} className="p-comp-pill" style={{ background: `${color}33`, borderColor: color }}><strong>{code}</strong></span>;
              })}
            </div>
          </div>
        )}
        {(theme.sections || []).map(sec => (
          <div className="print-card" key={sec.id}>
            <div className="p-card-head"><FileText size={18} /> <span>{sec.title}</span></div>
            {String(sec.text || '').split('\n').map((p, i) => (
              <p className="p-card-text" key={i} style={{ margin: '2px 0' }}>{p}</p>
            ))}
            {(sec.images || []).length > 0 && (
              <div className="p-theme-imgs">
                {sec.images.slice(0, 3).map(img => <img key={img.id} src={img.url} alt={img.caption || ''} />)}
              </div>
            )}
          </div>
        ))}
        <div className="page-context-footer">Thèmes — {theme.title}</div>
        <div className="page-number-footer"></div>
      </div>
    );
  };

  // Matrice récap : compétences (lignes) × entités (colonnes numérotées), ✓ coloré
  const renderRecapMatrix = (columns, compsOf, title, contextLabel, keyId, domId) => (
    <div className="print-page-wrap p-comp-table-page" key={keyId} id={domId}>
      <div className="competences-header-text">
        <h1>{title}</h1>
      </div>

      {/* Légende : numéro → nom complet */}
      <div className="recap-legend">
        {columns.map((col, i) => (
          <div className="recap-legend-item" key={col.id}>
            <span className="recap-legend-num">{i + 1}</span>
            <span className="recap-legend-name">{col.label}</span>
          </div>
        ))}
      </div>

      <table className="recap-table">
        <colgroup>
          <col style={{ width: '46%' }} />
          {columns.map(c => <col key={c.id} />)}
        </colgroup>
        <thead>
          <tr>
            <th className="recap-comp-col">Compétences U61</th>
            {columns.map((col, i) => (
              <th key={col.id} className="recap-num-th">{i + 1}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Object.entries(COMPETENCES_REF).map(([cat, cdata]) => (
            <React.Fragment key={cat}>
              <tr className="recap-cat-row" style={{ background: `${cdata.color}55` }}>
                <td colSpan={columns.length + 1}>{cdata.title}</td>
              </tr>
              {cdata.items.map(it => (
                <tr key={it.id}>
                  <td className="recap-comp-col"><strong>{it.id}</strong> {it.label}</td>
                  {columns.map(col => {
                    const has = compsOf(col.id)?.has(it.id);
                    return (
                      <td key={col.id} style={{ textAlign: 'center' }}>
                        {has ? <span className="recap-x" style={{ background: cdata.color }}>✓</span> : <span style={{ opacity: 0.25 }}>–</span>}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </React.Fragment>
          ))}
        </tbody>
      </table>
      <div className="page-context-footer">{contextLabel}</div>
      <div className="page-number-footer"></div>
    </div>
  );

  return (
    <div className="impression-page">
      <div className="impression-sidebar no-print">
        <div className="sidebar-header">
           <h2 style={{ fontFamily: 'Playfair Display, serif', fontStyle: 'italic', fontSize: '22px' }}>Dossier</h2>
           <p>Prêt pour l'export</p>
        </div>
        <div className="selection-list">
           <label className="select-item"><input type="checkbox" checked={selection.profil} onChange={e => setSelection({...selection, profil: e.target.checked})} /><span>Mon Profil</span></label>
           <label className="select-item"><input type="checkbox" checked={selection.formation} onChange={e => setSelection({...selection, formation: e.target.checked})} /><span>Ma Formation</span></label>
           <label className="select-item"><input type="checkbox" checked={selection.entreprise} onChange={e => setSelection({...selection, entreprise: e.target.checked})} /><span>Mon Entreprise</span></label>
           <label className="select-item"><input type="checkbox" checked={selection.chantiers} onChange={e => setSelection({...selection, chantiers: e.target.checked})} /><span>Mes Chantiers</span></label>
           <label className="select-item"><input type="checkbox" checked={selection.themes} onChange={e => setSelection({...selection, themes: e.target.checked})} /><span>Thèmes d'étude</span></label>
           <label className="select-item"><input type="checkbox" checked={selection.competences} onChange={e => setSelection({...selection, competences: e.target.checked})} /><span>Compétences (Tableau U61)</span></label>
        </div>

        {selection.chantiers && (
          <div className="chantiers-selector">
             <div className="sel-head">
                <span>SÉLECTION DES PROJETS</span>
                <div className="sel-head-actions">
                  <button onClick={() => setSelectedChantierIds(data.chantiers.map(c => c.id))}>TOUT</button>
                  <button onClick={() => setSelectedChantierIds([])}>AUCUN</button>
                </div>
             </div>
             <div className="sel-list">
                {buildHierarchy(data.chantiers).map(c => (
                  <label key={c.id} className={`sel-chantier-item ${c.depth === 1 ? 'is-sub' : ''} ${c.isParent ? 'is-parent' : ''}`}>
                    <input
                      type="checkbox"
                      checked={selectedChantierIds.includes(c.id)}
                      onChange={e => {
                        if (e.target.checked) {
                          // cocher un parent coche aussi ses sous-chantiers
                          const ids = c.isParent
                            ? [c.id, ...data.chantiers.filter(x => x.parent_id === c.id).map(x => x.id)]
                            : [c.id];
                          setSelectedChantierIds([...new Set([...selectedChantierIds, ...ids])]);
                        } else {
                          const ids = c.isParent
                            ? new Set([c.id, ...data.chantiers.filter(x => x.parent_id === c.id).map(x => x.id)])
                            : new Set([c.id]);
                          setSelectedChantierIds(selectedChantierIds.filter(id => !ids.has(id)));
                        }
                      }}
                    />
                    <span>{c.numero ? `Nº ${c.numero} · ` : ''}{c.nom}</span>
                  </label>
                ))}
             </div>
          </div>
        )}

        {selection.themes && (data.themes || []).length > 0 && (
          <div className="chantiers-selector">
             <div className="sel-head">
                <span>SÉLECTION DES THÈMES</span>
                <div className="sel-head-actions">
                  <button onClick={() => setSelectedThemeIds((data.themes || []).map(t => t.id))}>TOUT</button>
                  <button onClick={() => setSelectedThemeIds([])}>AUCUN</button>
                </div>
             </div>
             <div className="sel-list">
                {(data.themes || []).map(t => (
                  <label key={t.id} className="sel-chantier-item">
                    <input
                      type="checkbox"
                      checked={selectedThemeIds.includes(t.id)}
                      onChange={e => {
                        if (e.target.checked) setSelectedThemeIds([...new Set([...selectedThemeIds, t.id])]);
                        else setSelectedThemeIds(selectedThemeIds.filter(id => id !== t.id));
                      }}
                    />
                    <span>{t.title}</span>
                  </label>
                ))}
             </div>
          </div>
        )}

        <button className="btn-print-action" onClick={() => window.print()}>IMPRIMER LE DOSSIER</button>
      </div>

      <div className="impression-preview">
        <div className="print-document" style={{ '--total-pages': `"${totalPages}"` }}>
          {/* PAGE DE GARDE (toujours présente) */}
          <div className="print-page-wrap p-cover">
            <div className="p-cover-accent"></div>

            {/* Bandeau de logos en haut de page */}
            <div className="p-cover-logos">
              <div className="p-cover-logo-card">
                <img src="/logo sogea.jpg" alt="SOGEA" />
                <span className="p-cover-logo-sep"></span>
                <img src={formation.avatar_url || '/UFA + CFA Acdemique.avif'} alt="CFA / Lycée Le Corbusier" />
              </div>
            </div>

            <div className="p-cover-inner">
              <div className="p-cover-eyebrow">Dossier professionnel · Épreuve U61 — Suivi de chantier</div>
              <h1 className="p-cover-name">{(data.profile?.full_name || 'Zoé Lucas')}</h1>
              <div className="p-cover-rule"></div>
              <div className="p-cover-formation">BTS Bâtiment · Alternance</div>
              <div className="p-cover-year">2025 — 2027</div>

              {data.profile?.avatar_url && (
                <div className="p-cover-portrait">
                  <img
                    src={data.profile.avatar_url}
                    alt={data.profile.full_name}
                    style={{ transform: avatarStyle ? `translate(-50%, -50%) translate(${avatarStyle.x || 0}px, ${avatarStyle.y || 0}px) scale(${avatarStyle.scale || 1})` : 'translate(-50%, -50%)' }}
                  />
                </div>
              )}

              <div className="p-cover-info">
                <div className="p-cover-info-item">
                  <span className="p-cover-info-label">Établissement de formation</span>
                  <span className="p-cover-info-value">Lycée polyvalent Le Corbusier</span>
                </div>
                <div className="p-cover-info-item">
                  <span className="p-cover-info-label">Entreprise d'accueil</span>
                  <span className="p-cover-info-value">{entreprise.name || 'SOGEA Environnement'}</span>
                </div>
                <div className="p-cover-info-item">
                  <span className="p-cover-info-label">Maître d'apprentissage</span>
                  <span className="p-cover-info-value">Benoît HERTZOG</span>
                </div>
                <div className="p-cover-info-item">
                  <span className="p-cover-info-label">Période</span>
                  <span className="p-cover-info-value">Septembre 2025 — Août 2027</span>
                </div>
              </div>
            </div>
          </div>

          {/* SOMMAIRE INTELLIGENT (généré selon la sélection) */}
          {hasAnySelection && (
            <div className="print-page-wrap p-toc-page">
              <div className="p-header-main" style={{ marginBottom: '3rem' }}>
                <div className="p-info-box">
                  <div className="p-eyebrow">DOSSIER TECHNIQUE U61</div>
                  <h1 className="p-name">Sommaire</h1>
                  <div className="p-sub">{data.profile?.full_name || 'ZOÉ LUCAS'} — BTS Bâtiment en alternance</div>
                </div>
              </div>
              <div className="p-toc-list">
                {sectionPages.profil && (
                  <div className="p-toc-row clickable" onClick={() => goToPage('pg-profil')}><span className="p-toc-label">Mon Profil</span><span className="p-toc-dots"></span><span className="p-toc-page">p. {sectionPages.profil}</span></div>
                )}
                {sectionPages.formation && (
                  <div className="p-toc-row clickable" onClick={() => goToPage('pg-formation')}><span className="p-toc-label">Ma Formation</span><span className="p-toc-dots"></span><span className="p-toc-page">p. {sectionPages.formation}</span></div>
                )}
                {sectionPages.entreprise && (
                  <div className="p-toc-row clickable" onClick={() => goToPage('pg-entreprise')}><span className="p-toc-label">Mon Entreprise</span><span className="p-toc-dots"></span><span className="p-toc-page">p. {sectionPages.entreprise}</span></div>
                )}

                {/* Arborescence des chantiers (récap avant) */}
                {orderedChantierRows.length > 0 && (
                  <>
                    <div className="p-toc-section-head">Mes Chantiers</div>
                    {sectionPages.recapChantiers && (
                      <div className="p-toc-row clickable" onClick={() => goToPage('pg-recap-chantiers')}><span className="p-toc-label">Récapitulatif des compétences</span><span className="p-toc-dots"></span><span className="p-toc-page">p. {sectionPages.recapChantiers}</span></div>
                    )}
                    {orderedChantierRows.map(row => (
                      <div key={row.id} className={`p-toc-row toc-depth-${row.depth} ${row.isParent ? 'is-parent' : 'clickable'}`} onClick={row.isParent ? undefined : () => goToPage(`pg-ch-${row.id}`)}>
                        <span className="p-toc-label">{row.nom}</span>
                        {!row.isParent && <span className="p-toc-dots"></span>}
                        {!row.isParent && <span className="p-toc-page">p. {chantierPageMap[row.id]}</span>}
                      </div>
                    ))}
                  </>
                )}

                {/* Thèmes d'étude (récap avant) */}
                {themesToPrint.length > 0 && (
                  <>
                    <div className="p-toc-section-head">Thèmes d'étude</div>
                    {sectionPages.recapThemes && (
                      <div className="p-toc-row clickable" onClick={() => goToPage('pg-recap-themes')}><span className="p-toc-label">Récapitulatif des compétences</span><span className="p-toc-dots"></span><span className="p-toc-page">p. {sectionPages.recapThemes}</span></div>
                    )}
                    {themesToPrint.map(t => (
                      <div key={t.id} className="p-toc-row toc-depth-1 clickable" onClick={() => goToPage(`pg-theme-${t.id}`)}>
                        <span className="p-toc-label">Thème N°{themeNumberMap[t.id]} — {t.title}</span>
                        <span className="p-toc-dots"></span>
                        <span className="p-toc-page">p. {themePageMap[t.id]}</span>
                      </div>
                    ))}
                  </>
                )}

                {sectionPages.competences && (
                  <div className="p-toc-row clickable" style={{ marginTop: '8px' }} onClick={() => goToPage('pg-competences')}><span className="p-toc-label">Compétences — Tableau U61</span><span className="p-toc-dots"></span><span className="p-toc-page">p. {sectionPages.competences}</span></div>
                )}
              </div>
              <div className="page-context-footer">Sommaire</div>
              <div className="page-number-footer"></div>
            </div>
          )}

          {selection.profil && (
            <>
              <div className="print-page-wrap" id="pg-profil">
                <div className="p-header-main">
                  <div className="p-avatar-box"><div className="p-avatar-ring">
                    <img src={profile.avatar_url} style={{ position: 'absolute', top: '50%', left: '50%', transform: `translate(-50%, -50%) translate(${avatarStyle.x}px, ${avatarStyle.y}px) scale(${avatarStyle.scale})`, minWidth: '100%', minHeight: '100%', width: 'auto', height: 'auto', maxWidth: 'none', maxHeight: 'none' }} />
                  </div></div>
                  <div className="p-info-box">
                    <div className="p-eyebrow">{profile.eyebrow}</div>
                    <h1 className="p-name">{profile.full_name}</h1>
                    <div className="p-sub">{profile.age_text}</div>
                    <div className="p-contact-row">
                       <div className="p-chip"><Mail size={12}/> <span>{profile.email}</span></div>
                       <div className="p-chip"><Phone size={12}/> <span>{profile.phone}</span></div>
                       <div className="p-chip"><MapPin size={12}/> <span>{profile.address}</span></div>
                    </div>
                  </div>
                </div>
                <div className="p-content-grid">
                   <div className="p-col-left">
                      <div className="print-card"><div className="p-card-head"><User size={20}/> <span>À propos de moi</span></div><p className="p-card-text">{profile.description}</p></div>
                   </div>
                   <div className="p-col-right">
                      {sections.filter(s => s.column === 'RIGHT' && s.title?.includes('Expériences')).map(renderSection)}
                   </div>
                </div>
                <div className="page-context-footer">Mon Profil — {profile.full_name}</div>
                <div className="page-number-footer"></div>
              </div>
              <div className="print-page-wrap">
                <div className="p-content-grid" style={{ marginTop: '0' }}>
                   <div className="p-col-left">
                      {sections.filter(s => s.column === 'LEFT' && s.title?.includes('Formation')).map(renderSection)}
                      {sections.filter(s => s.column === 'LEFT' && s.title?.includes('Compétences')).map(renderSection)}
                   </div>
                   <div className="p-col-right">
                      {sections.filter(s => s.column === 'RIGHT' && !s.title?.includes('Expériences')).map(renderSection)}
                      {!sections.find(s => s.title?.toLowerCase().includes('langue')) && renderSection({ id: 'lang', title: 'Langues', type: 'CUSTOM' })}
                   </div>
                </div>
                <div className="page-context-footer">Mon Profil — {profile.full_name}</div>
                <div className="page-number-footer"></div>
              </div>
            </>
          )}

          {selection.formation && (
            <div className="print-page-wrap" id="pg-formation">
               <div className="p-header-main formation-header">
                  <div className="p-avatar-box formation-logo-box">
                     <div className="logo-stripes-bg"><img src={formation.avatar_url} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} /></div>
                  </div>
                  <div className="p-info-box">
                     <div className="p-eyebrow">{formation.eyebrow || 'FORMATION PROFESSIONNELLE'}</div>
                     <h1 className="p-name">{formation.name || 'BTS Bâtiment'}</h1>
                     <div className="p-sub">{formation.sub || 'En alternance'}</div>
                     <div className="p-contacts">
                        <div className="p-chip"><Globe size={12}/> <span>{formation.website}</span></div>
                     </div>
                  </div>
               </div>
               <div className="p-content-grid">
                  <div className="p-col-left">
                     <div className="print-card"><div className="p-card-head"><Building2 size={20}/> <span>À propos de la formation</span></div><p className="p-card-text">{formation.description}</p></div>
                     {formSections.filter(s => s.column === 'LEFT').map(renderSection)}
                  </div>
                  <div className="p-col-right">{formSections.filter(s => s.column === 'RIGHT').map(renderSection)}</div>
               </div>
               <div className="page-context-footer">Ma Formation</div>
               <div className="page-number-footer"></div>
            </div>
          )}

          {selection.entreprise && (
            <>
              <div className="print-page-wrap" id="pg-entreprise">
                <div className="p-header-main formation-header">
                  <div className="p-avatar-box">
                    <div className="p-avatar-ring" style={{ width: '130px', height: '130px', background: 'white !important', border: '3.5px solid var(--accent)' }}>
                      <img src="/logo sogea.jpg" style={{ width: '100%', height: '100%', position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', objectFit: 'contain', borderRadius: '50%' }} />
                    </div>
                  </div>
                  <div className="p-info-box">
                    <div className="p-eyebrow">{entreprise.eyebrow}</div>
                    <h1 className="p-name">{entreprise.name}</h1>
                    <div className="p-sub">{entreprise.sub}</div>
                    <div className="p-contacts">
                        <div className="p-chip"><Globe size={12}/> <span>{entreprise.website}</span></div>
                    </div>
                  </div>
                </div>
                <div className="p-content-grid">
                  <div className="p-col-left">
                    <div className="print-card"><div className="p-card-head"><Building2 size={20}/> <span>À propos de l'entreprise</span></div><p className="p-card-text">{entreprise.description}</p></div>
                    <div className="print-card" style={{ padding: '20px 25px' }}>
                      <div className="p-card-head"><MapPin size={20}/> <span>Implantations Nationales</span></div>
                      <div className="print-national-map">
                         <img src="/carte-sogea-environnement.webp" alt="Carte France SOGEA" style={{ width: '100%', height: 'auto', borderRadius: '12px' }} />
                      </div>
                      <div className="map-legend-print" style={{ borderTop: '1px solid var(--border)', paddingTop: '10px', marginTop: '15px' }}>
                         <div className="leg-item"><div className="dot" style={{ background: '#E63946 !important' }}></div> <span>Maillage National — Plus de 80 implantations</span></div>
                      </div>
                    </div>
                  </div>
                  <div className="p-col-right">
                    {entSections.map(renderSection)}
                  </div>
                </div>
                <div className="page-context-footer">Mon Entreprise</div>
                <div className="page-number-footer"></div>
              </div>

              <div className="print-page-wrap">
                <div className="p-card-head" style={{ marginBottom: '3rem' }}><Users size={24}/> <span style={{ fontSize: '24px' }}>Organigramme de l'agence</span></div>
                <div className="print-org-tree-container">
                  {entreprise.org_data ? renderOrgNode(entreprise.org_data) : renderOrgNode(DEFAULT_COMPANY.org_data)}
                </div>
                <div className="page-context-footer">Mon Entreprise — Organigramme</div>
                <div className="page-number-footer"></div>
              </div>
            </>
          )}

          {/* Récapitulatif des compétences par chantier (AVANT les pages chantiers, scindé si nécessaire) */}
          {showRecapChantiers && chantierChunks.map((chunk, i) => renderRecapMatrix(
            chunk.map(c => ({ id: c.id, label: c.nom })),
            (id) => chantierCompsMap[id],
            `Récapitulatif des compétences — Chantiers${chantierChunks.length > 1 ? ` (${i + 1}/${chantierChunks.length})` : ''}`,
            'Récapitulatif — Chantiers',
            `recap-ch-${i}`,
            i === 0 ? 'pg-recap-chantiers' : undefined
          ))}

          {/* Pages chantiers (feuilles uniquement, dans l'ordre de l'arborescence) */}
          {renderableChantiers.map(renderChantierPage)}

          {/* Récapitulatif des compétences par thème (AVANT les pages thèmes) */}
          {showRecapThemes && renderRecapMatrix(
            themesToPrint.map(t => ({ id: t.id, label: `Thème N°${themeNumberMap[t.id]} — ${t.title}` })),
            (id) => new Set((themesToPrint.find(t => t.id === id)?.competences) || []),
            'Récapitulatif des compétences — Thèmes',
            'Récapitulatif — Thèmes',
            'recap-themes',
            'pg-recap-themes'
          )}

          {/* Pages thèmes (avant les compétences) */}
          {themesToPrint.map(renderThemePage)}

          {selection.competences && renderCompetencesU61()}
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,800;0,900;1,400;1,700&family=Syne:wght@600;700;800&family=Inter:wght@300;400;500;600;700;800&display=swap');
        :root { --bg: #EDE5D8; --bg-card: #F5EFE4; --ink: #2C2318; --accent: #8B6E4E; --border: rgba(44,35,24,0.12); }
        @media print {
          @page { margin: 0; size: A4; }
          html, body { background-color: var(--bg) !important; margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .impression-sidebar { display: none !important; }
        }
        body { margin: 0; background: #111; counter-reset: page; }
        .print-document { width: 210mm; margin: 0 auto; }
        .print-page-wrap { 
          width: 210mm; min-height: 297mm; padding: 60px 70px 100px; box-sizing: border-box;
          page-break-after: always; position: relative; background: var(--bg) !important; -webkit-print-color-adjust: exact;
          counter-increment: page;
        }
        @media screen {
          .print-document { padding: 40px 0; background: #d6cfc1; min-height: 100vh; display: flex; flex-direction: column; align-items: center; gap: 40px; }
          .print-page-wrap {
            box-shadow: 0 15px 45px rgba(0,0,0,0.15);
            border-radius: 2px;
            margin-bottom: 0;
          }
        }
        .page-number-footer { position: absolute; bottom: 30px; right: 60px; font-size: 11px; font-family: 'Inter', sans-serif; font-weight: 800; color: var(--accent); letter-spacing: 1.5px; opacity: 0.6; text-transform: uppercase; z-index: 100; }
        .page-number-footer::after { content: "PAGE " counter(page) " / " var(--total-pages, ""); }
        .page-context-footer { position: absolute; bottom: 30px; left: 70px; font-size: 10px; font-family: 'Inter', sans-serif; font-weight: 800; color: var(--accent); letter-spacing: 1.2px; opacity: 0.55; text-transform: uppercase; z-index: 100; max-width: 60%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .p-comp-table-page .page-context-footer { left: 28px; }
        .p-eyebrow { font-family: 'Inter', sans-serif; font-weight: 500; font-size: 11px; color: var(--accent); margin-bottom: 8px; letter-spacing: 3.5px; text-transform: uppercase; }
        .p-contact-row { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 15px; }
        .p-chip { background: white !important; border: 1px solid var(--border); border-radius: 20px; padding: 6px 12px; font-size: 10.5px; display: inline-flex; align-items: center; gap: 6px; font-weight: 600; width: auto; -webkit-print-color-adjust: exact; }
        .p-chip svg { color: var(--accent); opacity: 0.8; }
        .p-header-main { display: flex; gap: 3rem; align-items: center; margin-bottom: 2rem; border-bottom: 1.5px solid var(--border); padding-bottom: 2rem; }
        .p-avatar-ring { width: 150px; height: 150px; border-radius: 50%; border: 3px solid var(--accent); overflow: hidden; position: relative; flex-shrink: 0; }
        .formation-logo-box { width: 240px !important; height: 100px !important; }
        .logo-stripes-bg { width: 100%; height: 100%; border-radius: 16px; border: 2.5px solid var(--accent); background: repeating-linear-gradient(45deg, rgba(139,110,78,0.05), rgba(139,110,78,0.05) 10px, transparent 10px, transparent 20px) !important; display: flex; align-items: center; justify-content: center; padding: 12px; }
        .p-name { font-family: 'Playfair Display', serif; font-size: 54px; font-weight: 900; margin: 0; line-height: 1; }
        .p-sub { font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 700; color: var(--accent); margin: 5px 0 10px; opacity: 0.8; text-transform: uppercase; }
        .p-content-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-top: 0.5rem; }
        .print-card { background: var(--bg-card) !important; border: 1px solid var(--border); border-radius: 28px; padding: 25px; margin-bottom: 1.5rem; -webkit-print-color-adjust: exact; break-inside: avoid; }
        .p-card-head { display: flex; align-items: center; gap: 12px; font-family: 'Playfair Display', serif; font-size: 20px; font-weight: 800; margin-bottom: 1.2rem; }
        .p-card-head svg { color: var(--accent); }
        .p-card-text { font-size: 13px; line-height: 1.6; opacity: 0.9; }
        .print-tl-item { position: relative; padding-left: 24px; border-left: 2px solid var(--accent); margin-bottom: 1.2rem; }
        .print-tl-dot { position: absolute; left: -7px; top: 6px; width: 11px; height: 11px; background: white !important; border: 2.5px solid var(--accent); border-radius: 50%; }
        .p-date { font-weight: 800; font-size: 11px; color: var(--accent); }
        .print-tl-title { font-weight: 800; font-size: 15px; margin: 2px 0; }
        .print-tl-desc { font-size: 12px; opacity: 0.7; }
        .p-skill-title { font-size: 10px; font-weight: 800; opacity: 0.5; margin-bottom: 8px; text-transform: uppercase; }
        .p-skill-pills { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 15px; }
        .p-pill { background: #E2D7C5 !important; padding: 5px 12px; border-radius: 20px; font-size: 11px; font-weight: 600; }
        .p-lang-row { margin-bottom: 20px; }
        .p-lang-head { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 6px; }
        .l-name { font-size: 14px; font-family: 'Inter', sans-serif; color: var(--ink); }
        .l-lvl { font-size: 9px; font-family: 'Inter', sans-serif; font-weight: 800; color: var(--accent); opacity: 0.6; text-transform: uppercase; letter-spacing: 1px; }
        .p-lang-bar { height: 5px; background: rgba(139,110,78,0.08) !important; border-radius: 3px; overflow: hidden; }
        .p-lang-bar .fill { height: 100%; background: var(--accent) !important; }

        .print-national-map { background: white !important; border-radius: 20px; position: relative; border: 1.5px solid var(--border); display: flex; align-items: center; justify-content: center; overflow: hidden; padding: 10px; }
        .map-legend-print { font-size: 10px; margin-top: 10px; padding: 0 10px; }
        .leg-item { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; font-weight: 600; }
        .dot { width: 8px; height: 8px; border-radius: 50%; }

        .print-org-tree-container { display: flex; flex-direction: column; gap: 0.5rem; margin-top: 1rem; }
        .print-org-node-wrap { display: flex; flex-direction: column; position: relative; padding-left: 24px; }
        .print-org-node-wrap::before { content: ""; position: absolute; left: 0; top: 0; width: 1.5px; height: 100%; background: var(--border); }
        .print-org-node-wrap::after { content: ""; position: absolute; left: 0; top: 20px; width: 24px; height: 1.5px; background: var(--border); }
        .print-org-node-wrap:last-child::before { height: 20px; }
        .print-org-card { background: var(--bg-card) !important; border: 1.5px solid var(--border); border-radius: 10px; padding: 10px 16px; width: 280px; -webkit-print-color-adjust: exact; margin-bottom: 8px; z-index: 2; position: relative; }
        .print-org-card.user-highlight { border: 2px solid var(--accent); background: white !important; box-shadow: 0 4px 10px rgba(139,110,78,0.1); }
        .org-name { font-weight: 800; font-size: 11px; text-transform: uppercase; color: var(--ink); line-height: 1.2; }
        .org-role { font-size: 8px; color: var(--accent); font-weight: 700; margin-top: 2px; text-transform: uppercase; letter-spacing: 0.5px; }
        .print-org-children { display: flex; flex-direction: column; gap: 4px; }

        /* Styles Chantiers */
        .p-chantier-header { margin-bottom: 2rem; }
        .p-chantier-title { font-family: 'Playfair Display', serif; font-size: 40px; font-weight: 900; margin: 5px 0; }
        .p-chantier-meta { display: flex; gap: 15px; font-size: 12px; font-weight: 700; color: var(--accent); opacity: 0.8; text-transform: uppercase; }
        .p-chantier-hero { height: 280px; background: #EEE; border-radius: 32px; overflow: hidden; margin-bottom: 2.5rem; border: 1px solid var(--border); }
        .no-photo-banner { height: 100%; display: flex; align-items: center; justify-content: center; font-style: italic; opacity: 0.3; }
        .p-details-list { display: flex; flex-direction: column; gap: 12px; }
        .p-det-item { font-size: 13px; border-bottom: 1px solid rgba(139,110,78,0.1); padding-bottom: 8px; }
        .p-det-item strong { color: var(--accent); }
        .p-sommaire-grid { display: flex; flex-direction: column; gap: 1.5rem; }
        .p-sommaire-item { display: flex; gap: 2rem; align-items: center; padding: 20px; border-bottom: 1.5px solid var(--border); }
        .p-som-num { font-family: 'Syne', sans-serif; font-size: 32px; font-weight: 800; color: var(--accent); opacity: 0.3; }
        .p-som-name { font-family: 'Inter', sans-serif; font-weight: 800; font-size: 18px; text-transform: uppercase; }
        .p-som-meta { font-size: 12px; opacity: 0.6; margin-top: 4px; font-weight: 500; }

        /* Arborescence du sommaire des réalisations */
        .p-som-tree { display: flex; flex-direction: column; }
        .p-som-row { display: flex; align-items: baseline; gap: 12px; padding: 11px 8px; border-bottom: 1px solid var(--border); }
        .p-som-row.depth-1 { padding-left: 38px; border-bottom: 1px dashed var(--border); }
        .p-som-row.depth-1::before { content: "└"; color: var(--accent); opacity: 0.5; margin-right: 2px; }
        .p-som-row.is-parent { background: rgba(139,110,78,0.06) !important; -webkit-print-color-adjust: exact; border-radius: 8px; margin-top: 8px; }
        .p-som-row .p-som-numero { font-family: 'Courier New', monospace; font-size: 11px; font-weight: 700; color: var(--accent); flex-shrink: 0; }
        .p-som-row .p-som-name { font-family: 'Playfair Display', serif; font-size: 15px; font-weight: 700; text-transform: none; }
        .p-som-row.is-parent .p-som-name { font-size: 16px; font-weight: 900; }
        .p-som-row .p-som-meta { margin: 0 0 0 auto; font-size: 11px; opacity: 0.6; text-align: right; max-width: 45%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

        /* Styles Sidebar Extension */
        .impression-sidebar { position: fixed; left: 0; top: 0; width: 300px; height: 100vh; background: #1A1A1A; padding: 30px; color: white; box-sizing: border-box; display: flex; flex-direction: column; gap: 1.5rem; border-right: 1px solid rgba(255,255,255,0.1); overflow-y: auto; }
        .select-item { display: flex; align-items: center; gap: 12px; cursor: pointer; padding: 8px 10px; border-radius: 8px; transition: 0.2s; font-family: 'Inter'; font-weight: 600; font-size: 14px; }
        .chantiers-selector { border-top: 1px solid rgba(255,255,255,0.1); padding-top: 1.5rem; display: flex; flex-direction: column; gap: 1rem; }
        .sel-head { display: flex; justify-content: space-between; align-items: center; font-size: 10px; font-weight: 800; letter-spacing: 1px; color: rgba(255,255,255,0.4); }
        .sel-head button { background: none; border: none; color: var(--accent); font-weight: 900; cursor: pointer; font-size: 10px; text-decoration: underline; }
        .sel-head-actions { display: flex; gap: 10px; }
        .sel-list { display: flex; flex-direction: column; gap: 6px; max-height: 200px; overflow-y: auto; padding-right: 5px; }
        .sel-chantier-item { display: flex; align-items: center; gap: 10px; font-size: 12px; cursor: pointer; padding: 4px; opacity: 0.7; }
        .sel-chantier-item:hover { opacity: 1; }
        .sel-chantier-item.is-parent { opacity: 1; font-weight: 800; }
        .sel-chantier-item.is-sub { padding-left: 22px; font-size: 11px; opacity: 0.6; }
        .sel-chantier-item.is-sub::before { content: "└"; opacity: 0.5; margin-right: -4px; }
        .btn-print-action { margin-top: auto; padding: 18px; background: var(--accent); color: white; border: none; border-radius: 12px; font-weight: 800; cursor: pointer; font-family: 'Syne'; flex-shrink: 0; }
        @media screen { .impression-preview { margin-left: 300px; padding: 40px; } }

        /* Nouveaux Styles Chantiers Print */
        .p-chantier-header-extended { display: flex; justify-content: space-between; gap: 2rem; margin-bottom: 2rem; border-bottom: 1.5px solid var(--border); padding-bottom: 2rem; }
        .p-header-left { flex: 1; }
        .p-chantier-title-main { font-family: 'Playfair Display', serif; font-size: 38px; font-weight: 900; line-height: 1.1; margin: 0 0 15px; color: var(--ink); }
        .p-address-row { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 600; color: var(--ink-muted); margin-bottom: 15px; }
        .p-meta-chips-row { display: flex; gap: 15px; margin-bottom: 20px; }
        .p-meta-chip { display: flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 700; color: var(--accent); opacity: 0.8; text-transform: uppercase; }
        .p-status-badge { display: inline-block; padding: 6px 12px; background: #D1FAE5 !important; color: #065F46; border-radius: 20px; font-size: 10px; font-weight: 800; letter-spacing: 0.5px; -webkit-print-color-adjust: exact; }
        
        .p-header-right-photo { width: 220px; height: 160px; flex-shrink: 0; }
        .p-main-photo-frame { width: 100%; height: 100%; border-radius: 20px; overflow: hidden; border: 2px solid var(--accent); }
        .p-main-photo-frame img { width: 100%; height: 100%; object-fit: cover; }
        
        .p-large-map-section { width: 100%; height: 380px; border-radius: 32px; overflow: hidden; margin-bottom: 2rem; border: 2px solid white; box-shadow: 0 10px 30px rgba(0,0,0,0.15); position: relative; background: #1a222c !important; }
        .p-map-placeholder-satellite { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; position: relative; background-image: url('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/16/35160/24185') !important; background-size: cover !important; background-position: center !important; -webkit-print-color-adjust: exact; }
        .p-map-marker-center { width: 32px; height: 42px; background: #ef4444 !important; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; z-index: 20; border: 4px solid white; box-shadow: 0 6px 15px rgba(0,0,0,0.5); }
        .p-map-marker-center::after { content: ''; width: 10px; height: 10px; background: white; border-radius: 50%; transform: rotate(45deg); }
        .p-map-info-overlay { position: absolute; bottom: 20px; right: 20px; background: white !important; padding: 6px 14px; border-radius: 10px; font-size: 11px; font-weight: 800; color: #111; box-shadow: 0 2px 8px rgba(0,0,0,0.1); -webkit-print-color-adjust: exact; }
        
        .p-cards-grid-4 { display: grid; grid-template-columns: 1fr 1fr; gap: 1.2rem; }
        .p-data-table-mini { display: flex; flex-direction: column; gap: 8px; margin-top: 10px; }
        .p-dt-row { display: flex; flex-direction: column; gap: 4px; border-bottom: 1px solid rgba(0,0,0,0.05); padding: 8px 0; font-size: 11px; }
        .p-dt-row span { font-weight: 700; color: var(--accent); opacity: 0.7; font-size: 9px; }
        .p-dt-row strong { color: var(--ink); }
        .p-card-text-small { font-size: 12px; line-height: 1.5; color: var(--ink); opacity: 0.85; }

        .p-cards-grid-mixed { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
        .p-mixed-col { display: flex; flex-direction: column; gap: 1.5rem; }
        .p-bullets-list { list-style: none; padding: 0; margin: 10px 0 0; display: flex; flex-direction: column; gap: 8px; }
        .p-bullets-list li { font-size: 13px; font-weight: 700; display: flex; align-items: center; gap: 10px; color: var(--ink); }
        .p-bullets-list li svg { color: var(--accent); }
        
        .p-skills-list-mini { display: flex; flex-direction: column; gap: 6px; margin-top: 10px; }
        .p-skill-item-mini { padding: 10px 15px; border-radius: 12px; font-size: 12px; font-weight: 700; color: #2C2318; -webkit-print-color-adjust: exact; }
        
        .p-journal-list-mini { display: flex; flex-direction: column; gap: 0.8rem; margin-top: 15px; }
        .p-journal-item-mini { display: flex; gap: 20px; background: white !important; padding: 12px 18px; border-radius: 20px; border: 1.5px solid var(--border); -webkit-print-color-adjust: exact; align-items: center; }
        .p-journal-date-box { width: 95px; flex-shrink: 0; background: #E5E1D8 !important; border-radius: 10px; padding: 8px; font-size: 9px; font-weight: 900; text-align: center; color: var(--ink); -webkit-print-color-adjust: exact; display: flex; flex-direction: column; align-items: center; justify-content: center; line-height: 1.3; letter-spacing: 0.3px; }
        .p-journal-desc-box { flex: 1; font-size: 12.5px; line-height: 1.3; display: flex; flex-direction: column; gap: 4px; }
        .p-journal-desc-box strong { font-weight: 800; color: var(--ink); }
        .p-journal-comp-badge { display: inline-block; padding: 3px 10px; background: #F3F4F6 !important; border-radius: 5px; font-size: 9.5px; font-weight: 700; color: #4B5563; -webkit-print-color-adjust: exact; width: fit-content; border: 1px solid rgba(0,0,0,0.05); }
        
        .p-checklists-row { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1.2rem; }
        .checklist-card { height: auto; min-height: 100px; padding: 25px 20px !important; }
        .p-card-head-mini { font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 800; color: var(--accent); opacity: 0.5; margin-bottom: 1.5rem; letter-spacing: 1px; }
        .p-checklist-dots { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 14px; }
        .p-checklist-dots li { font-size: 12px; font-weight: 600; line-height: 1.4; color: var(--ink); opacity: 0.9; }

        /* Compétences en tête de page chantier */
        .p-comp-top { margin-bottom: 1.5rem; }
        .p-comp-cats { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .p-comp-cat { background: white !important; border: 1px solid var(--border); border-left-width: 4px; border-radius: 14px; padding: 12px 14px; -webkit-print-color-adjust: exact; break-inside: avoid; }
        .p-comp-cat-title { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.03em; color: var(--ink); margin-bottom: 8px; }
        .p-comp-pills { display: flex; flex-direction: column; gap: 6px; }
        .p-comp-pill { font-size: 10.5px; line-height: 1.35; color: var(--ink); padding: 5px 9px; border-radius: 7px; border: 1px solid; -webkit-print-color-adjust: exact; }
        .p-comp-pill strong { margin-right: 5px; }

        /* PAGE DE GARDE */
        .p-cover { display: flex; align-items: center; justify-content: center; overflow: hidden; }
        .p-cover-accent { position: absolute; top: -120px; right: -120px; width: 320px; height: 320px; background: var(--accent) !important; opacity: 0.08; transform: rotate(45deg); -webkit-print-color-adjust: exact; }
        .p-cover::before { content: ''; position: absolute; bottom: -130px; left: -130px; width: 300px; height: 300px; background: var(--accent) !important; opacity: 0.06; transform: rotate(45deg); -webkit-print-color-adjust: exact; }
        .p-cover-inner { position: relative; z-index: 2; width: 100%; max-width: 520px; text-align: center; display: flex; flex-direction: column; align-items: center; padding: 20px; }
        .p-cover-logos { position: absolute; top: 56px; left: 0; right: 0; z-index: 3; display: flex; justify-content: center; }
        .p-cover-logo-card { background: #ffffff !important; border: 1px solid var(--border); border-radius: 18px; padding: 16px 34px; display: flex; align-items: center; justify-content: center; gap: 30px; box-shadow: 0 6px 18px rgba(44,35,24,0.06); -webkit-print-color-adjust: exact; }
        .p-cover-logo-card img { height: 58px; width: auto; max-width: 170px; object-fit: contain; }
        .p-cover-logo-sep { width: 1px; height: 50px; background: var(--border); flex-shrink: 0; }
        .p-cover-eyebrow { font-family: 'Inter', sans-serif; font-size: 11px; font-weight: 600; letter-spacing: 3px; text-transform: uppercase; color: var(--accent); margin-bottom: 18px; }
        .p-cover-name { font-family: 'Playfair Display', serif; font-size: 64px; font-weight: 900; color: var(--ink); line-height: 1; margin: 0; }
        .p-cover-rule { width: 80px; height: 3px; background: var(--accent) !important; border-radius: 3px; margin: 22px 0 18px; -webkit-print-color-adjust: exact; }
        .p-cover-formation { font-family: 'Syne', sans-serif; font-size: 16px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: var(--ink); opacity: 0.85; }
        .p-cover-year { font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 700; color: var(--accent); margin-top: 6px; letter-spacing: 1px; }
        .p-cover-portrait { width: 150px; height: 150px; border-radius: 50%; border: 3px solid var(--accent); overflow: hidden; position: relative; margin: 38px 0; flex-shrink: 0; -webkit-print-color-adjust: exact; }
        .p-cover-portrait img { position: absolute; top: 50%; left: 50%; min-width: 100%; min-height: 100%; width: auto; height: auto; }
        .p-cover-info { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; width: 100%; margin-top: 14px; }
        .p-cover-info-item { background: var(--bg-card) !important; border: 1px solid var(--border); border-radius: 16px; padding: 14px 18px; text-align: left; -webkit-print-color-adjust: exact; }
        .p-cover-info-label { display: block; font-family: 'Inter', sans-serif; font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: var(--accent); margin-bottom: 4px; }
        .p-cover-info-value { display: block; font-family: 'Playfair Display', serif; font-size: 15px; font-weight: 700; color: var(--ink); line-height: 1.2; }

        /* SOMMAIRE intelligent */
        .p-toc-list { display: flex; flex-direction: column; gap: 2px; margin-top: 1rem; }
        .p-toc-row { display: flex; align-items: baseline; gap: 14px; padding: 10px 6px; border-bottom: 1px solid var(--border); }
        .p-toc-row.clickable { cursor: pointer; border-radius: 8px; transition: background 0.15s ease; }
        @media screen { .p-toc-row.clickable:hover { background: rgba(139,110,78,0.08); } .p-toc-row.clickable:hover .p-toc-label { color: var(--accent); } }
        .p-toc-label { font-family: 'Playfair Display', serif; font-size: 17px; font-weight: 700; color: var(--ink); }
        .p-toc-dots { flex: 1; border-bottom: 2px dotted var(--border); align-self: flex-end; margin-bottom: 4px; }
        .p-toc-page { font-size: 13px; font-weight: 700; color: var(--accent); flex-shrink: 0; }
        .p-toc-section-head { font-family: 'Syne', sans-serif; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; color: var(--accent); margin: 18px 0 4px; }
        .p-toc-row.toc-depth-1 { padding-left: 26px; border-bottom: 1px dashed var(--border); }
        .p-toc-row.toc-depth-1 .p-toc-label { font-size: 14px; font-weight: 600; font-family: 'Inter', sans-serif; }
        .p-toc-row.toc-depth-1::before { content: "└"; color: var(--accent); opacity: 0.5; }
        .p-toc-row.is-parent .p-toc-label { font-size: 15px; font-weight: 900; }
        .p-theme-imgs { display: flex; gap: 8px; margin-top: 10px; }
        .p-theme-imgs img { flex: 1; max-width: 33%; border-radius: 10px; max-height: 130px; object-fit: cover; }

        /* Matrice récapitulative des compétences */
        .recap-legend { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 18px; margin: 6px 0 14px; padding: 12px 14px; background: var(--bg-card) !important; border: 1px solid var(--border); border-radius: 12px; -webkit-print-color-adjust: exact; }
        .recap-legend-item { display: flex; align-items: baseline; gap: 8px; font-size: 10px; }
        .recap-legend-num { flex-shrink: 0; width: 18px; height: 18px; line-height: 18px; text-align: center; border-radius: 5px; background: var(--accent) !important; color: #fff !important; font-weight: 800; font-size: 9px; -webkit-print-color-adjust: exact; }
        .recap-legend-name { color: var(--ink); line-height: 1.25; }
        .recap-table { width: 100%; border-collapse: collapse; font-size: 10px; table-layout: fixed; background: #fff !important; -webkit-print-color-adjust: exact; }
        .recap-table th, .recap-table td { border: 1px solid var(--border); padding: 5px 4px; }
        .recap-comp-col { text-align: left; vertical-align: middle; }
        .recap-comp-col strong { color: var(--ink); margin-right: 4px; }
        .recap-num-th { text-align: center; font-weight: 800; font-size: 11px; color: var(--accent); background: var(--bg-card) !important; -webkit-print-color-adjust: exact; }
        .recap-cat-row td { font-weight: 800; font-size: 10px; text-transform: uppercase; letter-spacing: 0.04em; color: var(--ink); -webkit-print-color-adjust: exact; }
        .recap-x { display: inline-block; width: 17px; height: 17px; line-height: 17px; border-radius: 4px; font-weight: 900; font-size: 10px; color: #000; -webkit-print-color-adjust: exact; }

        /* Tableau officiel U61 — PORTRAIT, condensé pour tenir sur une page A4 */
        .p-comp-table-page { padding: 35px 28px 80px !important; }
        .competences-header-text { text-align: center; margin-bottom: 10px; }
        .competences-header-text h1 { font-size: 12px; font-weight: bold; margin: 0 0 3px; text-transform: uppercase; }
        .competences-header-text h2 { font-size: 13px; font-weight: bold; margin: 0; }
        .competences-table { width: 100%; border-collapse: collapse; font-size: 9px; border: 2px solid #000; background: #fff !important; -webkit-print-color-adjust: exact; table-layout: fixed; }
        .competences-table th, .competences-table td { border: 1px solid #000; padding: 2px 3px; vertical-align: middle; word-wrap: break-word; }
        .competences-table thead th { background-color: #f2f2f2 !important; -webkit-print-color-adjust: exact; }
        .competences-table tbody td { height: 16px; line-height: 1.2; }
        .table-header-left { text-align: left; vertical-align: top !important; font-size: 9px; }
        .etablissement-info { display: flex; flex-direction: column; margin-bottom: 6px; gap: 2px; }
        .nom-prenom-info { display: flex; justify-content: space-between; }
        .competences-table .text-center { text-align: center; }
        .sub-th { font-weight: normal; font-style: italic; font-size: 8px; }
        .sub-headers th { font-size: 8px; font-weight: normal; }
        .col-n, .col-o, .col-r { color: red; }
        .col-fin { font-size: 7.5px; }
        .cat-cell { text-align: center; font-weight: bold; }
        .bg-c2 { background-color: #92bce3 !important; -webkit-print-color-adjust: exact; }
        .bg-c15 { background-color: #fce83a !important; -webkit-print-color-adjust: exact; }
        .bg-c16 { background-color: #a4e174 !important; -webkit-print-color-adjust: exact; }
        .bg-c18 { background-color: #f5b085 !important; -webkit-print-color-adjust: exact; }
        .bold-text { font-weight: bold; }
        .competences-table .text-sm { font-size: 8px; }
        .competences-table .text-xs { font-size: 7.5px; text-align: center; }
        .signature-cell { font-size: 8px; font-style: italic; text-align: center; }
        .signature-cell div { font-size: 8px !important; line-height: 1.25 !important; }
        .center-bold { font-weight: bold; text-align: center; font-style: normal; }
      `}</style>
    </div>
  );
};

export default Impression;
