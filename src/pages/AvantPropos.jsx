import { useEffect, useState } from 'react';
import { Heart, BookOpen, Briefcase, Calendar, CheckCircle, Edit2, Check, Clock, X, Plus, Trash2 } from 'lucide-react';
import { usePeriodesAlternance } from '../lib/usePeriodesAlternance';
import { useAvantPropos } from '../lib/useAvantPropos';
import CalendrierAlternance from '../components/CalendrierAlternance';
import './AvantPropos.css';

// Liste de paragraphes modifiables
function ParagraphesEditor({ value, onChange }) {
  const update = (i, txt) => onChange(value.map((p, j) => (j === i ? txt : p)));
  return (
    <div className="ap-edit-list">
      {value.map((p, i) => (
        <div key={i} className="ap-edit-para">
          <textarea className="profil-edit-input" rows={7} value={p} onChange={e => update(i, e.target.value)} />
          <button className="ap-icon-btn" title="Supprimer ce paragraphe" onClick={() => onChange(value.filter((_, j) => j !== i))}><Trash2 size={14} /></button>
        </div>
      ))}
      <button className="profil-add-btn" onClick={() => onChange([...value, ''])}><Plus size={14} /> Ajouter un paragraphe</button>
    </div>
  );
}

function MissionEditor({ mission, onChange }) {
  const set = (patch) => onChange({ ...mission, ...patch });
  const setInfo = (i, patch) => set({ infos: mission.infos.map((x, j) => (j === i ? { ...x, ...patch } : x)) });
  const setGroupe = (i, patch) => set({ groupes: mission.groupes.map((x, j) => (j === i ? { ...x, ...patch } : x)) });

  return (
    <div className="ap-edit-list">
      <label className="ap-edit-label">Intitulé du poste</label>
      <input className="profil-edit-input" value={mission.poste} onChange={e => set({ poste: e.target.value })} />
      <label className="ap-edit-label">Sous-titre</label>
      <input className="profil-edit-input" value={mission.posteReel} onChange={e => set({ posteReel: e.target.value })} />

      <label className="ap-edit-label">Informations</label>
      {mission.infos.map((info, i) => (
        <div key={i} className="ap-edit-row">
          <input className="profil-edit-input" placeholder="Libellé" value={info.label} onChange={e => setInfo(i, { label: e.target.value })} />
          <input className="profil-edit-input" placeholder="Valeur" value={info.value} onChange={e => setInfo(i, { value: e.target.value })} />
          <button className="ap-icon-btn" title="Supprimer" onClick={() => set({ infos: mission.infos.filter((_, j) => j !== i) })}><Trash2 size={14} /></button>
        </div>
      ))}
      <button className="profil-add-btn" onClick={() => set({ infos: [...mission.infos, { label: '', value: '' }] })}><Plus size={14} /> Ajouter une information</button>

      <label className="ap-edit-label">Missions</label>
      {mission.groupes.map((g, i) => (
        <div key={i} className="ap-edit-groupe">
          <div className="ap-edit-row">
            <input className="profil-edit-input" placeholder="Titre du groupe" value={g.titre} onChange={e => setGroupe(i, { titre: e.target.value })} />
            <button className="ap-icon-btn" title="Supprimer ce groupe" onClick={() => set({ groupes: mission.groupes.filter((_, j) => j !== i) })}><Trash2 size={14} /></button>
          </div>
          <input className="profil-edit-input" placeholder="Compétences (ex : C16.7, C16.9)" value={g.competences.join(', ')}
            onChange={e => setGroupe(i, { competences: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} />
          <textarea className="profil-edit-input" rows={4} placeholder="Une mission par ligne" value={g.items.join('\n')}
            onChange={e => setGroupe(i, { items: e.target.value.split('\n') })} />
        </div>
      ))}
      <button className="profil-add-btn" onClick={() => set({ groupes: [...mission.groupes, { titre: '', items: [], competences: [] }] })}><Plus size={14} /> Ajouter un groupe de missions</button>
    </div>
  );
}

export default function AvantPropos() {
  const periods = usePeriodesAlternance();
  const { content, save } = useAvantPropos();
  const [isAdmin, setIsAdmin] = useState(localStorage.getItem('isAdmin') === 'true');
  const [draft, setDraft] = useState(null); // non nul = mode édition
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const onChange = () => setIsAdmin(localStorage.getItem('isAdmin') === 'true');
    window.addEventListener('adminModeChanged', onChange);
    return () => window.removeEventListener('adminModeChanged', onChange);
  }, []);

  const isEditing = !!draft;
  const view = draft || content;
  const { mission } = view;

  const handleSave = async () => {
    setSaving(true);
    try {
      const clean = {
        ...draft,
        remerciements: draft.remerciements.filter(p => p.trim()),
        introduction: draft.introduction.filter(p => p.trim()),
        mission: {
          ...draft.mission,
          infos: draft.mission.infos.filter(x => x.label.trim() || x.value.trim()),
          groupes: draft.mission.groupes
            .map(g => ({ ...g, items: g.items.map(s => s.trim()).filter(Boolean) }))
            .filter(g => g.titre.trim()),
        },
      };
      await save(clean);
      setDraft(null);
    } catch (err) {
      console.error("Erreur de sauvegarde de l'avant-propos :", err);
      alert('Erreur lors de la sauvegarde : ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="profil-wrap avant-propos">
      <div className="profil-header">
        <div className="profil-header-info">
          <div className="profil-eyebrow">RAPPORT D'ACTIVITÉS · ÉPREUVE U61</div>
          <h1 className="profil-name">Avant-propos</h1>
          <div className="profil-sub">Remerciements, introduction, ma mission et mon calendrier d'alternance</div>
        </div>
        <div className="profil-header-actions">
          {isAdmin && (
            <>
              {isEditing && (
                <button className="profil-edit-toggle" onClick={() => setDraft(null)} disabled={saving}><X size={18} /> Annuler</button>
              )}
              <button className={`profil-edit-toggle ${isEditing ? 'active' : ''}`} onClick={() => (isEditing ? handleSave() : setDraft(structuredClone(content)))} disabled={saving}>
                {saving ? <Clock className="animate-spin" size={18} /> : isEditing ? <Check size={18} /> : <Edit2 size={18} />}
                {isEditing ? 'Enregistrer' : "Modifier l'avant-propos"}
              </button>
            </>
          )}
        </div>
      </div>

      <div className="profil-body">
        <div className="profil-col-left">
          <div className="profil-card">
            <h3 className="profil-card-title"><Heart size={15} /> Remerciements</h3>
            {isEditing
              ? <ParagraphesEditor value={draft.remerciements} onChange={v => setDraft({ ...draft, remerciements: v })} />
              : view.remerciements.map((p, i) => <p key={i} className="ap-text">{p}</p>)}
          </div>

          <div className="profil-card">
            <h3 className="profil-card-title"><Briefcase size={15} /> Ma mission</h3>
            {isEditing ? (
              <MissionEditor mission={draft.mission} onChange={m => setDraft({ ...draft, mission: m })} />
            ) : (
              <>
                <div className="ap-poste">{mission.poste}</div>
                <div className="ap-poste-reel">{mission.posteReel}</div>
                <div className="ap-infos">
                  {mission.infos.map((info, i) => (
                    <div key={i} className="ap-info"><span>{info.label}</span><strong>{info.value}</strong></div>
                  ))}
                </div>
                {mission.groupes.map((g, i) => (
                  <div key={i} className="ap-groupe">
                    <div className="ap-groupe-head">
                      <span className="ap-groupe-titre">{g.titre}</span>
                      <span className="ap-comps">{g.competences.map(c => <span key={c} className="ap-comp">{c}</span>)}</span>
                    </div>
                    <ul>{g.items.map((it, j) => <li key={j}><CheckCircle size={12} /> {it}</li>)}</ul>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        <div className="profil-col-right">
          <div className="profil-card">
            <h3 className="profil-card-title"><BookOpen size={15} /> Introduction</h3>
            {isEditing
              ? <ParagraphesEditor value={draft.introduction} onChange={v => setDraft({ ...draft, introduction: v })} />
              : view.introduction.map((p, i) => <p key={i} className="ap-text">{p}</p>)}
          </div>
        </div>
      </div>

      <div className="profil-card ap-calendrier">
        <h3 className="profil-card-title"><Calendar size={15} /> Calendrier d'alternance</h3>
        <CalendrierAlternance periods={periods} />
        {isEditing ? (
          <>
            <label className="ap-edit-label" style={{ marginTop: '1rem' }}>Note sous le calendrier</label>
            <input className="profil-edit-input" value={draft.note_examens || ''} onChange={e => setDraft({ ...draft, note_examens: e.target.value })} />
            <p className="ap-note">Les jours du calendrier se modifient dans le Journal (configuration des périodes).</p>
          </>
        ) : (
          view.note_examens && <p className="ap-note">{view.note_examens}</p>
        )}
      </div>
    </div>
  );
}
