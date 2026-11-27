import React, { useEffect, useState } from 'react';
import './ThemeDocument.css';

// Affiche un thème mis en page (HTML généré à partir du document Word).
const ThemeDocument = ({ docKey, onImageClick }) => {
  const [state, setState] = useState({ key: null, html: '', error: false });

  useEffect(() => {
    let cancelled = false;
    fetch(`/themes-doc/${docKey}/content.html`)
      .then(r => { if (!r.ok) throw new Error(r.status); return r.text(); })
      .then(t => { if (!cancelled) setState({ key: docKey, html: t, error: false }); })
      .catch(() => { if (!cancelled) setState({ key: docKey, html: '', error: true }); });
    return () => { cancelled = true; };
  }, [docKey]);

  const ready = state.key === docKey;
  const html = ready ? state.html : '';
  const error = ready && state.error;

  const handleClick = (e) => {
    const img = e.target.closest && e.target.closest('img');
    if (img && onImageClick) {
      const cap = img.closest('td')?.querySelector('p + p')?.textContent || '';
      onImageClick({ url: img.getAttribute('src'), caption: cap });
    }
  };

  if (error) return <div className="theme-doc-sheet theme-doc-msg">Impossible de charger ce thème.</div>;
  if (!html) return <div className="theme-doc-sheet theme-doc-msg">Chargement du thème…</div>;
  return (
    <div className="theme-doc-sheet" onClick={handleClick} dangerouslySetInnerHTML={{ __html: html }} />
  );
};

export default ThemeDocument;
