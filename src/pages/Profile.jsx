import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { 
  Mail, Phone, MapPin, User, Star, BookOpen, Clock, ExternalLink, 
  Edit2, Check, Plus, Trash2, Camera, Maximize, ChevronRight, ChevronLeft, ChevronUp, ChevronDown, Award 
} from 'lucide-react';

const DEFAULT_PROFILE = {
  full_name: "Zoé Lucas",
  eyebrow: "BTS BÂTIMENT · ALTERNANCE 2025-2027",
  job_title: "Étudiante",
  age_text: "Étudiante - 20 ans (25.04.2005)",
  email: "zoe25.lucas@gmail.com",
  phone: "+33 7 60 90 75 54",
  address: "2b rue de la forge, 57 200 Rémelfing (France)",
  description: "Après avoir effectué 2 ans de médecine en Allemagne, j'ai su que ce n'était pas vraiment fait pour moi. Au lieu de s'en rendre compte dans 10 ans, je préfère changer de voie maintenant. Je me suis rendue compte qu'il valait mieux suivre ses passions, plutôt que de courir derrière la notoriété et la reconnaissance sociale.",
  avatar_url: "/photo.jpg",
};

export default function Profile() {
  const [profile, setProfile] = useState(DEFAULT_PROFILE);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPhotoEditor, setShowPhotoEditor] = useState(false);
  const [avatarStyle, setAvatarStyle] = useState({ scale: 1, x: 0, y: 0 });
  const [photoToEdit, setPhotoToEdit] = useState(null);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isAdmin, setIsAdmin] = useState(localStorage.getItem('isAdmin') === 'true');

  useEffect(() => {
    const handleAdminChange = () => {
      setIsAdmin(localStorage.getItem('isAdmin') === 'true');
    };
    window.addEventListener('adminModeChanged', handleAdminChange);
    return () => window.removeEventListener('adminModeChanged', handleAdminChange);
  }, []);

  useEffect(() => {
    async function loadData() {
      try {
        // 1. On tente de trouver le profil de l'utilisateur connecté
        const { data: { session } } = await supabase.auth.getSession();
        let query = supabase.from('profiles').select('*');
        
        if (session?.user) {
          query = query.eq('id', session.user.id);
        }
        
        const { data: profs } = await query;
        let prof = profs && profs.length > 0 ? profs[0] : null;

        // 2. Si rien n'est trouvé, on prend le tout premier profil existant dans la base
        if (!prof) {
          const { data: allProfs } = await supabase.from('profiles').select('*').limit(1);
          if (allProfs && allProfs.length > 0) prof = allProfs[0];
        }

        if (prof) {
          setProfile(prev => ({ ...prev, ...prof }));
          if (prof.avatar_style) setAvatarStyle(prof.avatar_style);
          // ... reste du chargement
          if (prof.sections && Array.isArray(prof.sections)) {
            const mapped = prof.sections.map(s => {
              if (!s.column) {
                return { ...s, column: (s.id === 'experience' || s.id === 'languages') ? 'RIGHT' : 'LEFT' };
              }
              return s;
            });
            setSections(mapped);
            setLoading(false);
            return;
          }
        }
        
        // Fallback to legacy or defaults if no JSON sections
        const { data: tl } = await supabase.from("timeline_items").select("*").order('sort_order', { ascending: true });
        const { data: sk } = await supabase.from("skills").select("*").order('sort_order', { ascending: true });
        
        let initial = [];
        if ((tl && tl.length > 0) || (sk && sk.length > 0)) {
           initial = [
             { id: 's1', title: 'Formation', type: 'TIMELINE', icon: 'BookOpen', column: 'LEFT', content: (tl || []).filter(it => it.category === 'formation') },
             { id: 's2', title: 'Expériences', type: 'TIMELINE', icon: 'Clock', column: 'RIGHT', content: (tl || []).filter(it => it.category === 'experience') },
             { id: 's3', title: 'Compétences', type: 'SKILLS', icon: 'Award', column: 'LEFT', groups: [{ title: 'Outils', pills: (sk || []).filter(it => it.category === 'outil').map(it => it.name) }] }
           ];
        } else {
           initial = [
             { id: 's1', title: 'Formation', type: 'TIMELINE', icon: 'BookOpen', column: 'LEFT', content: [] },
             { id: 's2', title: 'Expériences', type: 'TIMELINE', icon: 'Clock', column: 'RIGHT', content: [] }
           ];
        }
        setSections(initial);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const id = profile.id || user?.id || 'id-' + Date.now();
      const { error } = await supabase.from("profiles").upsert({
        ...profile, id, sections, avatar_style: avatarStyle, updated_at: new Date()
      });
      if (error) throw error;
      alert("✅ Profil mis à jour avec succès !");
      setIsEditing(false);
    } catch (e) {
      alert("Erreur: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const addSection = (type) => {
    const newS = { id: 's' + Date.now(), title: 'Nouveau', type, column: 'LEFT', icon: 'Plus', content: type === 'TIMELINE' ? [] : type === 'SKILLS' ? { groups: [] } : '' };
    setSections([...sections, newS]);
    setShowTemplatePicker(false);
  };

  return (
    <div className="profil-wrap" onMouseUp={() => setIsDragging(false)} onMouseLeave={() => setIsDragging(false)}>
      {loading && (
        <div style={{ position: 'absolute', top: '10px', right: '10px', opacity: 0.5, fontSize: '12px' }}>
          Mise à jour...
        </div>
      )}
      {showPhotoEditor && (
        <div className="photo-editor-overlay">
          <div className="photo-editor-modal">
            <h2 style={{ marginBottom: '1rem', fontFamily: 'Syne' }}>Recadrer votre photo</h2>
            <div 
              className="photo-editor-canvas"
              onMouseDown={(e) => { setIsDragging(true); setDragStart({ x: e.clientX - avatarStyle.x, y: e.clientY - avatarStyle.y }); }}
              onMouseMove={(e) => { if (isDragging) setAvatarStyle(prev => ({ ...prev, x: e.clientX - dragStart.x, y: e.clientY - dragStart.y })); }}
              style={{ cursor: isDragging ? 'grabbing' : 'grab', height: '300px', backgroundColor: '#000', position: 'relative', overflow: 'hidden' }}
            >
              <img src={photoToEdit || profile.avatar_url} className="photo-editor-source" alt="" style={{ opacity: 0.15 }} />
              <div className="photo-editor-preview-wrap">
                <div style={{ width: '130px', height: '130px', borderRadius: '50%', overflow: 'hidden', position: 'relative', border: '2px solid #fff' }}>
                  <img 
                    src={photoToEdit || profile.avatar_url} 
                    style={{
                      position: 'absolute', top: '50%', left: '50%',
                      transform: `translate(-50%, -50%) translate(${avatarStyle.x}px, ${avatarStyle.y}px) scale(${avatarStyle.scale})`,
                      minWidth: '100%', minHeight: '100%', width: 'auto', height: 'auto', maxWidth: 'none', maxHeight: 'none'
                    }}
                  />
                </div>
              </div>
            </div>
            <div style={{ padding: '20px' }}>
              <div className="control-row">
                <label>Zoom</label>
                <input type="range" min="0.1" max="5" step="0.01" value={avatarStyle.scale} onChange={e => setAvatarStyle({...avatarStyle, scale: parseFloat(e.target.value)})} />
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '1.5rem' }}>
                <button className="btn-save-photo" onClick={() => { if (photoToEdit) setProfile({...profile, avatar_url: photoToEdit}); setShowPhotoEditor(false); }}>Valider</button>
                <button onClick={() => { setAvatarStyle({ scale: 1, x: 0, y: 0 }); }}>Centrer</button>
                <button onClick={() => setShowPhotoEditor(false)}>Annuler</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="profil-header">
        <div className="profil-avatar-wrap">
          <div className="profil-avatar-ring" style={{ position: 'relative' }}>
            <img 
              src={profile.avatar_url} 
              style={{
                position: 'absolute', top: '50%', left: '50%',
                transform: `translate(-50%, -50%) translate(${avatarStyle.x}px, ${avatarStyle.y}px) scale(${avatarStyle.scale})`,
                minWidth: '100%', minHeight: '100%', width: 'auto', height: 'auto', maxWidth: 'none', maxHeight: 'none'
              }}
              alt={profile.full_name}
            />
          </div>
          {isEditing && (
            <div className="profil-avatar-edit-group">
                <label className="profil-avatar-btn"><Camera size={14} /><input type="file" style={{ display: 'none' }} onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => { setPhotoToEdit(reader.result); setShowPhotoEditor(true); };
                    reader.readAsDataURL(file);
                  }
                }}/></label>
                <button className="profil-avatar-btn" onClick={() => setShowPhotoEditor(true)}><Maximize size={14} /></button>
            </div>
          )}
        </div>

        <div className="profil-header-info">
          {isEditing ? (
            <>
              <input className="profil-edit-input eyebrow" value={profile.eyebrow} onChange={e => setProfile({...profile, eyebrow: e.target.value})} />
              <input className="profil-edit-input title" value={profile.full_name} onChange={e => setProfile({...profile, full_name: e.target.value})} />
              <input className="profil-edit-input info" value={profile.age_text} onChange={e => setProfile({...profile, age_text: e.target.value})} />
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <input className="profil-edit-input chip" value={profile.email} onChange={e => setProfile({...profile, email: e.target.value})} />
                <input className="profil-edit-input chip" value={profile.phone} onChange={e => setProfile({...profile, phone: e.target.value})} />
                <input className="profil-edit-input chip" value={profile.address} onChange={e => setProfile({...profile, address: e.target.value})} placeholder="Adresse" />
              </div>
            </>
          ) : (
            <>
              <div className="profil-eyebrow">{profile.eyebrow}</div>
              <h1 className="profil-name">{profile.full_name}</h1>
              <div className="profil-sub">{profile.age_text}</div>
              <div className="profil-contacts">
                <a href={`mailto:${profile.email}`} className="profil-contact-chip"><Mail size={12} /> {profile.email}</a>
                <a href={`tel:${profile.phone}`} className="profil-contact-chip"><Phone size={12} /> {profile.phone}</a>
                <a href={`https://maps.google.com/?q=${encodeURIComponent(profile.address)}`} target="_blank" rel="noopener noreferrer" className="profil-contact-chip"><MapPin size={12} /> {profile.address}</a>
              </div>
            </>
          )}
        </div>

        {isAdmin && (
          <div className="profil-header-actions">
            <button className={`profil-edit-toggle ${isEditing ? 'active' : ''}`} onClick={() => isEditing ? handleSave() : setIsEditing(true)}>
              {saving ? <Clock className="animate-spin" size={18} /> : isEditing ? <Check size={18} /> : <Edit2 size={18} />}
              {isEditing ? 'Enregistrer' : 'Modifier le profil'}
            </button>
          </div>
        )}
      </div>

      <div className="profil-body">
        <div className="profil-col-left">
          <div className="profil-card">
            <h3 className="profil-card-title"><User size={15} /> À propos de moi</h3>
            {isEditing ? (
              <textarea className="profil-edit-input" style={{ minHeight: '120px' }} value={profile.description} onChange={e => setProfile({...profile, description: e.target.value})} />
            ) : <p className="profil-about-text">{profile.description}</p>}
          </div>

          {(sections || []).filter(s => s?.column === 'LEFT').map((s, idx) => (
            <DynamicSection key={s?.id || idx} section={s} isEditing={isEditing} setSections={setSections} sections={sections} />
          ))}
        </div>

        <div className="profil-col-right">
          {(sections || []).filter(s => s?.column === 'RIGHT').map((s, idx) => (
            <DynamicSection key={s?.id || idx} section={s} isEditing={isEditing} setSections={setSections} sections={sections} />
          ))}

          {isEditing && (
            <div className="template-picker-wrap">
              <button className="profil-add-btn" onClick={() => setShowTemplatePicker(!showTemplatePicker)}><Plus size={16} /> Ajouter une section</button>
              {showTemplatePicker && (
                <div className="template-picker-grid">
                  <button className="template-btn" onClick={() => addSection('TEXT')}>Texte</button>
                  <button className="template-btn" onClick={() => addSection('TIMELINE')}>Parcours</button>
                  <button className="template-btn" onClick={() => addSection('SKILLS')}>Compétences</button>
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
        <div className="edit-actions-overlay" style={{ display: 'flex', gap: '4px' }}>
          {section.column === 'RIGHT' && <button className="btn-icon-sm" onClick={() => update({ column: 'LEFT' })} title="Déplacer à gauche"><ChevronLeft size={12} /></button>}
          <button className="btn-icon-sm" onClick={moveUp} title="Monter"><ChevronUp size={12} /></button>
          <button className="btn-icon-sm" onClick={moveDown} title="Descendre"><ChevronDown size={12} /></button>
          {section.column === 'LEFT' && <button className="btn-icon-sm" onClick={() => update({ column: 'RIGHT' })} title="Déplacer à droite"><ChevronRight size={12} /></button>}
          <button className="btn-icon-sm delete" onClick={() => setSections(sections.filter(s => s.id !== section.id))} title="Supprimer"><Trash2 size={12} /></button>
        </div>
      )}
      <h3 className="profil-card-title">
        {section.type === 'TIMELINE' ? <BookOpen size={15} /> : section.type === 'SKILLS' ? <Award size={15} /> : section.type === 'LANGUAGES' ? <ExternalLink size={15} /> : <Star size={15} />}
        {isEditing ? <input className="profil-edit-input" style={{ fontWeight: 700 }} value={section.title} onChange={e => update({ title: e.target.value })} /> : section.title}
      </h3>

      {section.type === 'TEXT' && (
        isEditing ? <textarea className="profil-edit-input" value={section.content} onChange={e => update({ content: e.target.value })} /> : <p className="profil-about-text">{section.content}</p>
      )}

      {section.type === 'SKILLS' && (
        <div className="profil-skills">
          {(section.groups || []).map((group, idx) => (
            <div key={idx} className="profil-skill-group" style={{ marginBottom: '15px', width: '100%' }}>
              <h4 className="profil-skill-title" style={{ fontSize: '13px', marginBottom: '8px', color: 'var(--ink)' }}>
                {isEditing ? <input className="profil-edit-input" style={{ fontSize: '13px', width: '100%' }} value={group.title} onChange={e => { const g = [...section.groups]; g[idx].title = e.target.value; update({ groups: g }); }} /> : group.title}
              </h4>
              <div className="profil-skills">
                {(group.pills || []).map((pill, pIdx) => (
                  <span key={pIdx} className="profil-skill-pill">
                    {isEditing ? <input className="profil-edit-input" style={{ width: '80px', padding: '2px' }} value={pill} onChange={e => { const g = [...section.groups]; g[idx].pills[pIdx] = e.target.value; update({ groups: g }); }} /> : pill}
                    {isEditing && <button className="btn-icon-sm delete" onClick={() => { const g = [...section.groups]; g[idx].pills = g[idx].pills.filter((_, i) => i !== pIdx); update({ groups: g }); }}><Trash2 size={12}/></button>}
                  </span>
                ))}
                {isEditing && <button className="profil-add-btn" style={{ padding: '4px 8px', fontSize: '11px' }} onClick={() => { const g = [...section.groups]; g[idx].pills.push('Nouveau'); update({ groups: g }); }}>+ Tag</button>}
              </div>
            </div>
          ))}
          {isEditing && <button className="profil-add-btn" onClick={() => update({ groups: [...(section.groups || []), { title: 'Nouveau', pills: [] }] })}>+ Groupe</button>}
        </div>
      )}

      {section.type === 'LANGUAGES' && (
        <div className="profil-langs">
          {(section.content || []).map((lang, idx) => (
            <div key={idx} style={{ marginBottom: '10px' }}>
              <div className="profil-lang-row">
                {isEditing ? (
                  <>
                    <input className="profil-edit-input" style={{ width: '40%' }} value={lang.name} onChange={e => { const c = [...section.content]; c[idx].name = e.target.value; update({ content: c }); }} />
                    <input className="profil-edit-input" style={{ width: '40%', fontSize: '11px', textAlign: 'right' }} value={lang.label} onChange={e => { const c = [...section.content]; c[idx].label = e.target.value; update({ content: c }); }} />
                  </>
                ) : (
                  <>
                    <span className="profil-lang-name">{lang.name}</span>
                    <span className="profil-lang-level">{lang.label}</span>
                  </>
                )}
              </div>
              <div className="profil-lang-bar-wrap" style={{ marginTop: '5px' }}>
                <div className="profil-lang-bar" style={{ width: `${lang.level}%` }}></div>
              </div>
              {isEditing && (
                <div style={{ display: 'flex', gap: '5px', marginTop: '5px' }}>
                  <input type="range" min="0" max="100" value={lang.level} onChange={e => { const c = [...section.content]; c[idx].level = parseInt(e.target.value); update({ content: c }); }} style={{ flex: 1 }} />
                  <button className="btn-icon-sm delete" onClick={() => { const c = [...section.content]; c.splice(idx, 1); update({ content: c }); }}><Trash2 size={12}/></button>
                </div>
              )}
            </div>
          ))}
          {isEditing && <button className="profil-add-btn" onClick={() => update({ content: [...(section.content || []), { name: 'Langue', label: 'Niveau', level: 50 }] })}>+ Langue</button>}
        </div>
      )}

      {section.type === 'TIMELINE' && (
        <div className="profil-timeline">
          {(section.content || []).map((item, idx) => (
            <div key={idx} className="profil-tl-item">
              <div className="profil-tl-dot"></div>
              <div className="profil-tl-content">
                {isEditing ? (
                  <>
                    <input className="profil-edit-input" style={{ fontSize: '12px' }} value={item.date_label} onChange={e => { const c = [...section.content]; c[idx].date_label = e.target.value; update({ content: c }); }} />
                    <input className="profil-edit-input" style={{ fontWeight: 600 }} value={item.title} onChange={e => { const c = [...section.content]; c[idx].title = e.target.value; update({ content: c }); }} />
                    <textarea className="profil-edit-input" value={item.description} onChange={e => { const c = [...section.content]; c[idx].description = e.target.value; update({ content: c }); }} />
                  </>
                ) : (
                  <>
                    <div className="profil-tl-date">{item.date_label}</div>
                    <div className="profil-tl-label">{item.title}</div>
                    <div className="profil-tl-desc">{item.description}</div>
                  </>
                )}
              </div>
            </div>
          ))}
          {isEditing && <button className="profil-add-btn" onClick={() => update({ content: [...(section.content || []), { title: 'Nouveau', date_label: 'Date', description: '...' }] })}>+ Ajouter</button>}
        </div>
      )}
    </div>
  );
}
