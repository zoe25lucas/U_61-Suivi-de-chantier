import { Trash2 } from 'lucide-react';
import './EntrepriseBlocks.css';

// Blocs spécifiques à la page Entreprise : chaîne "du groupe à mon agence",
// chiffres clés et graphique en barres. Utilisés sur le site et dans le PDF.

const fmt = (v) => (typeof v === 'number' ? v.toLocaleString('fr-FR', { maximumFractionDigits: 1 }) : v);

function ChainBlock({ section, isEditing, update }) {
  const items = section.items || [];
  const setItem = (i, patch) => update({ items: items.map((it, j) => (j === i ? { ...it, ...patch } : it)) });
  return (
    <div className="eb-chain">
      {items.map((it, i) => (
        <div key={i} className={`eb-chain-item ${it.highlight ? 'highlight' : ''}`}>
          <span className="eb-chain-dot" />
          {isEditing ? (
            <div className="eb-edit-col">
              <input className="profil-edit-input" placeholder="Niveau" value={it.niveau} onChange={e => setItem(i, { niveau: e.target.value })} />
              <input className="profil-edit-input" placeholder="Nom" value={it.nom} onChange={e => setItem(i, { nom: e.target.value })} />
              <input className="profil-edit-input" placeholder="Détail" value={it.detail} onChange={e => setItem(i, { detail: e.target.value })} />
              <div className="eb-edit-row">
                <label className="eb-check"><input type="checkbox" checked={!!it.highlight} onChange={e => setItem(i, { highlight: e.target.checked })} /> Mettre en avant</label>
                <button className="btn-icon-sm delete" onClick={() => update({ items: items.filter((_, j) => j !== i) })}><Trash2 size={12} /></button>
              </div>
            </div>
          ) : (
            <div>
              <div className="eb-chain-niveau">{it.niveau}</div>
              <div className="eb-chain-nom">{it.nom}</div>
              {it.detail && <div className="eb-chain-detail">{it.detail}</div>}
            </div>
          )}
        </div>
      ))}
      {isEditing && <button className="profil-add-btn" onClick={() => update({ items: [...items, { niveau: 'Niveau', nom: 'Nom', detail: '' }] })}>+ Ajouter un niveau</button>}
    </div>
  );
}

function KpisBlock({ section, isEditing, update }) {
  const items = section.items || [];
  const setItem = (i, patch) => update({ items: items.map((it, j) => (j === i ? { ...it, ...patch } : it)) });
  return (
    <>
      <div className="eb-kpis" style={{ gridTemplateColumns: `repeat(${Math.min(3, Math.max(1, items.length))}, 1fr)` }}>
        {items.map((it, i) => (
          <div key={i} className="eb-kpi">
            {isEditing ? (
              <>
                <input className="profil-edit-input" value={it.value} onChange={e => setItem(i, { value: e.target.value })} />
                <input className="profil-edit-input" value={it.label} onChange={e => setItem(i, { label: e.target.value })} />
                <button className="btn-icon-sm delete" onClick={() => update({ items: items.filter((_, j) => j !== i) })}><Trash2 size={12} /></button>
              </>
            ) : (
              <>
                <div className="eb-kpi-value">{it.value}</div>
                <div className="eb-kpi-label">{it.label}</div>
              </>
            )}
          </div>
        ))}
      </div>
      {isEditing && <button className="profil-add-btn" style={{ marginTop: 10 }} onClick={() => update({ items: [...items, { value: '0', label: 'libellé' }] })}>+ Ajouter un chiffre</button>}
    </>
  );
}

function BarsBlock({ section, isEditing, update }) {
  const items = section.items || [];
  const max = Math.max(...items.map(it => Number(it.value) || 0), 1);
  const setItem = (i, patch) => update({ items: items.map((it, j) => (j === i ? { ...it, ...patch } : it)) });
  return (
    <div className="eb-bars">
      {isEditing && (
        <div className="eb-edit-row" style={{ marginBottom: 8 }}>
          <span className="eb-small">Unité</span>
          <input className="profil-edit-input" style={{ width: 70 }} value={section.unit || ''} onChange={e => update({ unit: e.target.value })} />
        </div>
      )}
      {items.map((it, i) => (
        <div key={i} className="eb-bar-row">
          {isEditing ? (
            <div className="eb-edit-row">
              <input className="profil-edit-input" value={it.label} onChange={e => setItem(i, { label: e.target.value })} />
              <input className="profil-edit-input" style={{ width: 80 }} type="number" step="0.1" value={it.value} onChange={e => setItem(i, { value: parseFloat(e.target.value) || 0 })} />
              <button className="btn-icon-sm delete" onClick={() => update({ items: items.filter((_, j) => j !== i) })}><Trash2 size={12} /></button>
            </div>
          ) : (
            <>
              <div className="eb-bar-label">{it.label}</div>
              <div className="eb-bar-track">
                <div className="eb-bar-fill" style={{ width: `${((Number(it.value) || 0) / max) * 100}%` }} />
                <span className="eb-bar-value">{fmt(it.value)} {section.unit}</span>
              </div>
            </>
          )}
        </div>
      ))}
      {isEditing && <button className="profil-add-btn" onClick={() => update({ items: [...items, { label: 'Libellé', value: 0 }] })}>+ Ajouter une barre</button>}
      {isEditing ? (
        <textarea className="profil-edit-input" style={{ marginTop: 10, minHeight: 90 }} placeholder="Analyse / commentaire" value={section.note || ''} onChange={e => update({ note: e.target.value })} />
      ) : (
        section.note && <p className="eb-note">{section.note}</p>
      )}
    </div>
  );
}

function PhotosBlock({ section, isEditing, update }) {
  const items = section.items || [];
  const cols = section.cols || 2;
  const setItem = (i, patch) => update({ items: items.map((it, j) => (j === i ? { ...it, ...patch } : it)) });
  return (
    <>
      {isEditing && (
        <div className="eb-edit-row" style={{ marginBottom: 8 }}>
          <span className="eb-small">Colonnes</span>
          <select className="profil-edit-input" style={{ width: 70 }} value={cols} onChange={e => update({ cols: Number(e.target.value) })}>
            <option value={1}>1</option><option value={2}>2</option><option value={3}>3</option>
          </select>
        </div>
      )}
      <div className="eb-photos" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {items.map((it, i) => (
          <figure key={i} className="eb-photo">
            {it.src && <img src={it.src} alt={it.caption || ''} style={section.height ? { height: section.height } : undefined} />}
            {isEditing ? (
              <div className="eb-edit-col" style={{ marginTop: 4 }}>
                <input className="profil-edit-input" placeholder="Adresse de l'image (/photos/... ou https://...)" value={it.src} onChange={e => setItem(i, { src: e.target.value })} />
                <div className="eb-edit-row">
                  <input className="profil-edit-input" placeholder="Légende" value={it.caption || ''} onChange={e => setItem(i, { caption: e.target.value })} />
                  <button className="btn-icon-sm delete" onClick={() => update({ items: items.filter((_, j) => j !== i) })}><Trash2 size={12} /></button>
                </div>
              </div>
            ) : (
              it.caption && <figcaption>{it.caption}</figcaption>
            )}
          </figure>
        ))}
      </div>
      {isEditing && <button className="profil-add-btn" style={{ marginTop: 8 }} onClick={() => update({ items: [...items, { src: '', caption: '' }] })}>+ Ajouter une photo</button>}
      {section.note && !isEditing && <p className="eb-note">{section.note}</p>}
    </>
  );
}

export default function EntrepriseBlock({ section, isEditing = false, update = () => {} }) {
  if (section.type === 'CHAIN') return <ChainBlock section={section} isEditing={isEditing} update={update} />;
  if (section.type === 'KPIS') return <KpisBlock section={section} isEditing={isEditing} update={update} />;
  if (section.type === 'BARS') return <BarsBlock section={section} isEditing={isEditing} update={update} />;
  if (section.type === 'PHOTOS') return <PhotosBlock section={section} isEditing={isEditing} update={update} />;
  return null;
}
