import { useState, useEffect } from 'react';
import { 
  Building2, Globe, Edit2, Save, Plus, Trash2, 
  Check, Award, BookOpen, Star, Clock, User,
  ChevronUp, ChevronDown, ChevronLeft, ChevronRight
} from 'lucide-react';
import { supabase } from '../lib/supabase';

const DEFAULT_FORMATION = {
  name: "BTS Bâtiment",
  eyebrow: "FORMATION PROFESSIONNELLE",
  sub: "En alternance",
  website: "lyceelecorbusier.eu",
  description: "Le Brevet de Technicien Supérieur Bâtiment forme des professionnels capables d'intervenir dans les différentes phases de la construction d'un ouvrage. En alternance, la formation allie enseignement théorique (études, méthodes, économie) et pratique sur le terrain en entreprise.",
  avatar_url: "/UFA + CFA Acdemique.avif",
  sections: [
    {
      id: 's_ufa',
      type: 'TEXT',
      title: 'L\'UFA Le Corbusier',
      content: 'L\'Unité de Formation par l\'Apprentissage (UFA) Le Corbusier est située à Illkirch-Graffenstaden (15 Rue Lixenbuhl). Elle est rattachée au Lycée des Métiers de l\'Architecture et du Bâtiment. Elle dispose d\'infrastructures modernes telles que des laboratoires de génie civil et des plateformes techniques adaptées à notre formation.',
      column: 'LEFT'
    },
    {
      id: 's1',
      type: 'SKILLS',
      title: 'Matières enseignées',
      groups: [
        { title: 'TECHNIQUE & PROFESSIONNEL', pills: ['Projet BTS 1 & 2', 'Topographie', 'Mécanique', 'Étude de prix', 'Laboratoire (Génie Civil)', 'Enseignement Professionnel'] },
        { title: 'ENSEIGNEMENT GÉNÉRAL', pills: ['Mathématiques', 'Sciences Physiques', 'Communication et expression', 'Anglais'] }
      ],
      column: 'LEFT'
    },
    {
      id: 's2',
      type: 'TIMELINE',
      title: 'Déroulement de la formation',
      content: [
        { title: 'Rythme d\'alternance', date_label: '2025 - 2027', description: '2 semaines en entreprise / 2 semaines au CFA.' },
        { title: 'Examen final', date_label: 'Juin 2027', description: 'Épreuves écrites, orales et pratiques sanctionnant les 2 années de BTS.' }
      ],
      column: 'RIGHT'
    }
  ]
};

export default function Formation() {
  const [isEditing, setIsEditing] = useState(false);
  const [formation, setFormation] = useState(DEFAULT_FORMATION);
  const [sections, setSections] = useState(DEFAULT_FORMATION.sections);
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [isAdmin, setIsAdmin] = useState(localStorage.getItem('isAdmin') === 'true');

  useEffect(() => {
    const handleAdminChange = () => {
      setIsAdmin(localStorage.getItem('isAdmin') === 'true');
    };
    window.addEventListener('adminModeChanged', handleAdminChange);
    return () => window.removeEventListener('adminModeChanged', handleAdminChange);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 2000);

    async function loadData() {
      try {
        const { data } = await supabase.from('formation_profile').select('*').maybeSingle();
        if (data) {
          setFormation(data);
          setSections(data.sections || DEFAULT_FORMATION.sections);
        }
      } catch (err) { 
        console.log("Using defaults for formation", err); 
      } finally { 
        setIsLoading(false); 
        clearTimeout(timer);
      }
    }
    loadData();
    return () => clearTimeout(timer);
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const toSave = { ...formation, sections };
      // Assign an ID if it doesn't exist
      if (!toSave.id) {
        toSave.id = '550e8400-e29b-41d4-a716-446655441111';
      }
      await supabase.from('formation_profile').upsert(toSave);
      setFormation(toSave);
      setIsEditing(false);
    } catch (err) { alert(err.message); }
    finally { setSaving(false); }
  };


  const addSection = (type) => {
    const newSection = {
      id: Date.now().toString(),
      type,
      title: type === 'TEXT' ? 'Nouvelle Section' : type === 'TIMELINE' ? 'Événements' : 'Matières',
      content: type === 'TEXT' ? 'Contenu ici...' : type === 'TIMELINE' ? [] : undefined,
      groups: type === 'SKILLS' ? [{ title: 'Groupe', pills: [] }] : undefined,
      column: 'LEFT'
    };
    setSections([...sections, newSection]);
    setShowTemplatePicker(false);
  };

  return (
    <div className="profil-wrap">
      {isLoading && (
        <div style={{ position: 'absolute', top: '10px', right: '10px', opacity: 0.5, fontSize: '12px' }}>
          Mise à jour...
        </div>
      )}
      <div className="profil-header">
        <div className="profil-avatar-wrap" style={{ width: '280px', height: '110px' }}>
          <div style={{ width: '100%', height: '100%', background: 'var(--bg-stripe)', border: '3px solid var(--accent-cord)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: '10px' }}>
            <img src={formation.avatar_url} alt="Logo UFA" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
          </div>
        </div>

        <div className="profil-header-info">
          {isEditing ? (
            <>
              <input className="profil-edit-input eyebrow" value={formation.eyebrow} onChange={e => setFormation({...formation, eyebrow: e.target.value})} />
              <input className="profil-edit-input title" value={formation.name} onChange={e => setFormation({...formation, name: e.target.value})} />
              <input className="profil-edit-input info" value={formation.sub} onChange={e => setFormation({...formation, sub: e.target.value})} />
              <input className="profil-edit-input chip" value={formation.website} onChange={e => setFormation({...formation, website: e.target.value})} placeholder="Site web" />
            </>
          ) : (
            <>
              <div className="profil-eyebrow">{formation.eyebrow}</div>
              <h1 className="profil-name">{formation.name}</h1>
              <div className="profil-sub">{formation.sub}</div>
              <div className="profil-contacts">
                 {formation.website && <a href={`https://${formation.website}`} target="_blank" rel="noopener noreferrer" className="profil-contact-chip"><Globe size={12} /> {formation.website}</a>}
              </div>
            </>
          )}
        </div>

        <div className="profil-header-actions">
           {isAdmin && (
             <button className={`profil-edit-toggle ${isEditing ? 'active' : ''}`} onClick={() => isEditing ? handleSave() : setIsEditing(true)}>
               {saving ? <Clock className="animate-spin" size={18} /> : isEditing ? <Check size={18} /> : <Edit2 size={18} />}
               {isEditing ? 'Enregistrer' : 'Modifier la formation'}
             </button>
           )}
        </div>
      </div>

      <div className="profil-body">
        <div className="profil-col-left">
          <div className="profil-card">
            <h3 className="profil-card-title"><Building2 size={15} /> À propos de la formation</h3>
            {isEditing ? (
              <textarea className="profil-edit-input" style={{ minHeight: '120px' }} value={formation.description} onChange={e => setFormation({...formation, description: e.target.value})} />
            ) : <p className="profil-about-text">{formation.description}</p>}
          </div>

          {sections.filter(s => s.column === 'LEFT').map(s => (
            <DynamicSection key={s.id} section={s} isEditing={isEditing} setSections={setSections} sections={sections} />
          ))}
        </div>

        <div className="profil-col-right">
          {sections.filter(s => s.column === 'RIGHT').map(s => (
            <DynamicSection key={s.id} section={s} isEditing={isEditing} setSections={setSections} sections={sections} />
          ))}

          {isEditing && (
            <div className="template-picker-wrap">
              <button className="profil-add-btn" onClick={() => setShowTemplatePicker(!showTemplatePicker)}><Plus size={16} /> Ajouter une section</button>
              {showTemplatePicker && (
                <div className="template-picker-grid">
                  <button className="template-btn" onClick={() => addSection('TEXT')}>Texte</button>
                  <button className="template-btn" onClick={() => addSection('TIMELINE')}>Parcours / Étapes</button>
                  <button className="template-btn" onClick={() => addSection('SKILLS')}>Matières / Compétences</button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DynamicSection({ section, isEditing, setSections, sections }) {
  const update = (newData) => setSections(sections.map(s => s.id === section.id ? { ...s, ...newData } : s));
  
  const moveUp = () => {
    const idx = sections.findIndex(s => s.id === section.id);
    if (idx <= 0) return;
    const newSections = [...sections];
    let prevIdx = -1;
    for (let i = idx - 1; i >= 0; i--) {
      if (newSections[i].column === section.column) {
        prevIdx = i;
        break;
      }
    }
    if (prevIdx !== -1) {
      const temp = newSections[prevIdx];
      newSections[prevIdx] = newSections[idx];
      newSections[idx] = temp;
      setSections(newSections);
    }
  };

  const moveDown = () => {
    const idx = sections.findIndex(s => s.id === section.id);
    if (idx === -1 || idx === sections.length - 1) return;
    const newSections = [...sections];
    let nextIdx = -1;
    for (let i = idx + 1; i < newSections.length; i++) {
      if (newSections[i].column === section.column) {
        nextIdx = i;
        break;
      }
    }
    if (nextIdx !== -1) {
      const temp = newSections[nextIdx];
      newSections[nextIdx] = newSections[idx];
      newSections[idx] = temp;
      setSections(newSections);
    }
  };

  return (
    <div className="profil-card" style={{ position: 'relative' }}>
      {isEditing && (
        <div className="edit-actions-overlay" style={{ display: 'flex', gap: '4px', position: 'absolute', top: '10px', right: '10px' }}>
          {section.column === 'RIGHT' && <button className="btn-icon-sm" onClick={() => update({ column: 'LEFT' })} title="Déplacer à gauche"><ChevronLeft size={12} /></button>}
          <button className="btn-icon-sm" onClick={moveUp} title="Monter"><ChevronUp size={12} /></button>
          <button className="btn-icon-sm" onClick={moveDown} title="Descendre"><ChevronDown size={12} /></button>
          {section.column === 'LEFT' && <button className="btn-icon-sm" onClick={() => update({ column: 'RIGHT' })} title="Déplacer à droite"><ChevronRight size={12} /></button>}
          <button className="btn-icon-sm delete" onClick={() => setSections(sections.filter(s => s.id !== section.id))} title="Supprimer"><Trash2 size={12} /></button>
        </div>
      )}
      <h3 className="profil-card-title">
        {section.type === 'TIMELINE' ? <BookOpen size={15} /> : section.type === 'SKILLS' ? <Award size={15} /> : <Star size={15} />}
        {isEditing ? <input className="profil-edit-input" style={{ fontWeight: 700 }} value={section.title} onChange={e => update({ title: e.target.value })} /> : section.title}
      </h3>
      {section.type === 'TEXT' && (isEditing ? <textarea className="profil-edit-input" value={section.content} onChange={e => update({ content: e.target.value })} /> : <p className="profil-about-text">{section.content}</p>)}
      {section.type === 'SKILLS' && (
        <div className="profil-skills">
          {(section.groups || []).map((group, idx) => (
            <div key={idx} className="profil-skill-group" style={{ marginBottom: '32px', width: '100%' }}>
              <h4 className="profil-skill-title" style={{ marginBottom: '14px', fontSize: '13.5px' }}>{isEditing ? <input className="profil-edit-input" value={group.title} onChange={e => { const g = [...section.groups]; g[idx].title = e.target.value; update({ groups: g }); }} /> : group.title}</h4>
              <div className="profil-skills" style={{ gap: '10px' }}>
                {(group.pills || []).map((pill, pIdx) => (
                  <span key={pIdx} className="profil-skill-pill">
                    {isEditing ? (
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <input className="profil-edit-input" style={{ width: '80px', padding: '2px' }} value={pill} onChange={e => { const g = [...section.groups]; g[idx].pills[pIdx] = e.target.value; update({ groups: g }); }} />
                        <button className="btn-icon-sm delete" onClick={() => { const g = [...section.groups]; g[idx].pills = g[idx].pills.filter((_, i) => i !== pIdx); update({ groups: g }); }}><Trash2 size={10}/></button>
                      </div>
                    ) : pill}
                  </span>
                ))}
                {isEditing && <button className="profil-add-btn" style={{ padding: '4px 8px', fontSize: '11px' }} onClick={() => { const g = [...section.groups]; g[idx].pills = [...(g[idx].pills || []), 'Nouveau']; update({ groups: g }); }}>+ Élément</button>}
              </div>
            </div>
          ))}
          {isEditing && <button className="profil-add-btn" onClick={() => update({ groups: [...(section.groups || []), { title: 'Nouveau', pills: [] }] })}>+ Groupe</button>}
        </div>
      )}
      {section.type === 'TIMELINE' && (
        <div className="profil-timeline">
          {(section.content || []).map((item, idx) => (
            <div key={idx} className="profil-tl-item"><div className="profil-tl-dot"></div><div className="profil-tl-content">
              {isEditing ? (
                <>
                  <input className="profil-edit-input" style={{ fontSize: '12px' }} value={item.date_label} onChange={e => { const c = [...section.content]; c[idx].date_label = e.target.value; update({ content: c }); }} />
                  <input className="profil-edit-input" style={{ fontWeight: 600 }} value={item.title} onChange={e => { const c = [...section.content]; c[idx].title = e.target.value; update({ content: c }); }} />
                  <textarea className="profil-edit-input" value={item.description} onChange={e => { const c = [...section.content]; c[idx].description = e.target.value; update({ content: c }); }} />
                </>
              ) : (<><div className="profil-tl-date">{item.date_label}</div><div className="profil-tl-label">{item.title}</div><div className="profil-tl-desc">{item.description}</div></>)}
            </div></div>
          ))}
          {isEditing && <button className="profil-add-btn" onClick={() => update({ content: [...(section.content || []), { title: 'Nouveau', date_label: 'Date', description: '...' }] })}>+ Ajouter</button>}
        </div>
      )}
    </div>
  );
}
