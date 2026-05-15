import React, { useState, useEffect, Fragment } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Mail, Phone, MapPin, User, Clock, BookOpen, Award, ExternalLink, Building2, Globe, Star, Users, CheckSquare, Square, Briefcase, List
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

const Impression = () => {
  const [data, setData] = useState({ profile: null, certifications: [], formation: null, entreprise: null, chantiers: [], journal: [] });
  const [loading, setLoading] = useState(true);
  
  const [selection, setSelection] = useState({
    profil: true,
    formation: true,
    entreprise: true,
    chantiers: false,
    competences: false
  });

  const [selectedChantierIds, setSelectedChantierIds] = useState([]);

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
          resJournals
        ] = await Promise.all([
          supabase.from('profiles').select('*').maybeSingle(),
          supabase.from('certifications').select('*'),
          supabase.from('formations').select('*').maybeSingle(),
          supabase.from('entreprise').select('*').maybeSingle(),
          supabase.from('chantiers').select('*').order('created_at', { ascending: false }),
          supabase.from('journal_entries').select('*')
        ]);

        setData({
          profile: resProfile.data,
          certifications: resCerts.data || [],
          formation: resForm.data,
          entreprise: resEnt.data,
          chantiers: resProjects.data || [],
          journal: resJournals.data || []
        });

        if (resProjects.data) {
          setSelectedChantierIds(resProjects.data.map(c => c.id));
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

      // Correct Skills Labeling
      const COMPETENCES_DATA = {
         "C16": { title: "C16 - RÉALISATION", items: [{ id: "C16.1", label: "Préparer des interventions" }, { id: "C16.2", label: "Extraire, terrasser, charger et transporter des matériaux" }, { id: "C16.3", label: "Poser des canalisations et des fourreaux" }, { id: "C16.4", label: "Planifier et coordonner des interventions et des approvisionnements" }, { id: "C16.5", label: "Clôturer une intervention" }] },
         "C18": { title: "C18 - PILOTAGE", items: [{ id: "C18.1", label: "Planifier et coordonner les interventions des corps d'état" }, { id: "C18.2", label: "Réceptionner les supports de pose" }, { id: "C18.3", label: "Réceptionner l'ouvrage et ses équipements" }] }
      };

      const skillsLabels = (c.competencesMobilisees || []).map(code => {
         if (!code) return "";
         let label = code;
         Object.values(COMPETENCES_DATA).forEach(group => {
            const item = (group.items || []).find(it => it.id === code);
            if (item) label = `${code} - ${item.label}`;
         });
         return label;
      }).filter(l => l !== "");

      const hasValidCoords = Array.isArray(c.coordinates) && c.coordinates.length === 2 && !isNaN(c.coordinates[0]) && !isNaN(c.coordinates[1]);

      return (
        <React.Fragment key={c.id}>
          {/* PAGE 1: HEADER + MAP + INFO */}
          <div className="print-page-wrap">
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
            <div className="page-number-footer"></div>
          </div>

          {/* PAGE 2: GALLERY, SKILLS, JOURNAL & CHECKLISTS */}
          <div className="print-page-wrap">
             <div className="p-cards-grid-mixed">
                <div className="p-mixed-col">
                   {skillsLabels.length > 0 && (
                     <div className="print-card">
                        <div className="p-card-head"><Award size={18}/> <span>Compétences Métier</span></div>
                        <div className="p-skills-list-mini">
                           {skillsLabels.map((s, idx) => {
                              const code = s.split(' - ')[0];
                              const catClass = code.startsWith('C16') ? '#E8F5E9' : code.startsWith('C18') ? '#FFF3E0' : '#f0f0f0';
                              const border = code.startsWith('C16') ? '#C8E6C9' : code.startsWith('C18') ? '#FFE0B2' : '#ddd';
                              return (
                                <div key={idx} className="p-skill-item-mini" style={{ background: catClass, border: `1px solid ${border}` }}>
                                  {s}
                                </div>
                              );
                           })}
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
             <div className="page-number-footer"></div>
          </div>
        </React.Fragment>
      );
    } catch (error) {
      console.error("Error rendering chantier page:", error);
      return <div className="print-page-wrap">Erreur lors de la génération de la page du chantier {c.nom}</div>;
    }
  };

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
        </div>

        {selection.chantiers && (
          <div className="chantiers-selector">
             <div className="sel-head">
                <span>SÉLECTION DES PROJETS</span>
                <button onClick={() => setSelectedChantierIds(data.chantiers.map(c => c.id))}>TOUT</button>
             </div>
             <div className="sel-list">
                {data.chantiers.map(c => (
                  <label key={c.id} className="sel-chantier-item">
                    <input 
                      type="checkbox" 
                      checked={selectedChantierIds.includes(c.id)} 
                      onChange={e => {
                        if(e.target.checked) setSelectedChantierIds([...selectedChantierIds, c.id]);
                        else setSelectedChantierIds(selectedChantierIds.filter(id => id !== c.id));
                      }} 
                    />
                    <span>{c.nom}</span>
                  </label>
                ))}
             </div>
          </div>
        )}

        <button className="btn-print-action" onClick={() => window.print()}>IMPRIMER LE DOSSIER</button>
      </div>

      <div className="impression-preview">
        <div className="print-document">
          {selection.profil && (
            <>
              <div className="print-page-wrap">
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
                <div className="page-number-footer"></div>
              </div>
            </>
          )}

          {selection.formation && (
            <div className="print-page-wrap">
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
               <div className="page-number-footer"></div>
            </div>
          )}

          {selection.entreprise && (
            <>
              <div className="print-page-wrap">
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
                <div className="page-number-footer"></div>
              </div>

              <div className="print-page-wrap">
                <div className="p-card-head" style={{ marginBottom: '3rem' }}><Users size={24}/> <span style={{ fontSize: '24px' }}>Organigramme de l'agence</span></div>
                <div className="print-org-tree-container">
                  {entreprise.org_data ? renderOrgNode(entreprise.org_data) : renderOrgNode(DEFAULT_COMPANY.org_data)}
                </div>
                <div className="page-number-footer"></div>
              </div>
            </>
          )}

          {selection.chantiers && chantiersSelectionnes.length > 0 && (
            <>
              {/* Sommaire des chantiers */}
              <div className="print-page-wrap">
                <div className="p-header-main" style={{ marginBottom: '4rem' }}>
                   <div className="p-info-box">
                      <div className="p-eyebrow">RÉCAPITULATIF TECHNIQUE</div>
                      <h1 className="p-name" style={{ fontSize: '42px' }}>Sommaire des Réalisations</h1>
                   </div>
                </div>
                <div className="p-sommaire-grid">
                   {chantiersSelectionnes.map((c, idx) => (
                     <div key={c.id} className="p-sommaire-item">
                        <div className="p-som-num">{(idx + 1).toString().padStart(2, '0')}</div>
                        <div className="p-som-content">
                           <div className="p-som-name">{c.nom}</div>
                           <div className="p-som-meta">{c.maitreOuvrage || 'Client N/C'} — {c.lieu?.split(',')[0]}</div>
                        </div>
                     </div>
                   ))}
                </div>
                <div className="page-number-footer"></div>
              </div>

              {/* Pages individuelles */}
              {chantiersSelectionnes.map(renderChantierPage)}
            </>
          )}
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
        .page-number-footer::after { content: "| PAGE " counter(page); }
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

        /* Styles Sidebar Extension */
        .impression-sidebar { position: fixed; left: 0; top: 0; width: 300px; height: 100vh; background: #1A1A1A; padding: 30px; color: white; box-sizing: border-box; display: flex; flex-direction: column; gap: 1.5rem; border-right: 1px solid rgba(255,255,255,0.1); overflow-y: auto; }
        .select-item { display: flex; align-items: center; gap: 12px; cursor: pointer; padding: 8px 10px; border-radius: 8px; transition: 0.2s; font-family: 'Inter'; font-weight: 600; font-size: 14px; }
        .chantiers-selector { border-top: 1px solid rgba(255,255,255,0.1); padding-top: 1.5rem; display: flex; flex-direction: column; gap: 1rem; }
        .sel-head { display: flex; justify-content: space-between; align-items: center; font-size: 10px; font-weight: 800; letter-spacing: 1px; color: rgba(255,255,255,0.4); }
        .sel-head button { background: none; border: none; color: var(--accent); font-weight: 900; cursor: pointer; font-size: 10px; text-decoration: underline; }
        .sel-list { display: flex; flex-direction: column; gap: 6px; max-height: 200px; overflow-y: auto; padding-right: 5px; }
        .sel-chantier-item { display: flex; align-items: center; gap: 10px; font-size: 12px; cursor: pointer; padding: 4px; opacity: 0.7; }
        .sel-chantier-item:hover { opacity: 1; }
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
      `}</style>
    </div>
  );
};

export default Impression;
