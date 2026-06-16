import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { 
  FolderOpen, 
  Search, 
  Filter, 
  Plus, 
  Trash2, 
  Edit, 
  Save, 
  X, 
  Camera, 
  Building2, 
  ArrowLeft,
  Calendar,
  Image as ImageIcon,
  ArrowUp,
  ArrowDown,
  User as UserIcon,
  ChevronLeft,
  Award
} from 'lucide-react';
import './Themes.css';

// Competency Data
const COMPETENCES_DATA = {
  'C2': {
    title: "Exprimer techniquement le besoin du client",
    color: "#aed6f1",
    items: [
      { id: 'C2.1', label: "Recueillir les données" },
      { id: 'C2.2', label: "Traduire techniquement le besoin" },
      { id: 'C2.3', label: "Présenter et justifier les solutions proposées" },
      { id: 'C2.4', label: "Proposer des variantes techniques" },
    ]
  },
  'C15': {
    title: "Gérer les dépenses et les recettes d'un chantier",
    color: "#f7dc6f",
    items: [
      { id: 'C15.1', label: "Établir l'avancement des travaux y compris les travaux modificatifs" },
      { id: 'C15.2', label: "Établir une situation de travaux y compris les travaux modificatifs" },
      { id: 'C15.3', label: "Valider les factures des fournisseurs (bons de livraison – factures)" },
      { id: 'C15.4', label: "Récupérer et saisir les coûts réels des dépenses" },
    ]
  },
  'C16': {
    title: "Conduire les travaux en phase de gros œuvre",
    color: "#82e0aa",
    items: [
      { id: 'C16.1', label: "Analyser les écarts sur la base des tableaux de bord établis" },
      { id: 'C16.2', label: "Contrôler l'exécution des ouvrages y compris les interfaces entre les corps d'états." },
      { id: 'C16.3', label: "Adapter les moyens en main d'œuvre et en matériel" },
      { id: 'C16.4', label: "Planifier et coordonner des interventions et des approvisionnements" },
      { id: 'C16.5', label: "Mettre à jour l'avancement des travaux et établir les mesures correctives." },
      { id: 'C16.6', label: "Gérer les imprévus." },
      { id: 'C16.7', label: "Compléter les documents du chantier (PPSPS, PAJ, fiches,...)" },
      { id: 'C16.8', label: "Vérifier la conformité des équipements, matériaux et matériels livrés" },
      { id: 'C16.9', label: "Faire respecter les dispositions d'hygiène, de sécurité et de protection de l'environnement." },
    ]
  },
  'C18': {
    title: "Assurer la coordination avec les intervenants du chantier",
    color: "#f0b27a",
    items: [
      { id: 'C18.1', label: "Planifier et coordonner les interventions des corps d'état." },
      { id: 'C18.2', label: "Conduire une réunion de travail" },
    ]
  }
};

// Détecte le type de vidéo et renvoie l'élément d'affichage approprié
const renderVideoEmbed = (url) => {
  if (!url) return null;
  const u = url.trim();

  // YouTube
  const yt = u.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})/);
  if (yt) {
    return (
      <iframe
        src={`https://www.youtube.com/embed/${yt[1]}`}
        title="Vidéo"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    );
  }

  // Vimeo
  const vimeo = u.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeo) {
    return (
      <iframe
        src={`https://player.vimeo.com/video/${vimeo[1]}`}
        title="Vidéo"
        frameBorder="0"
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
      />
    );
  }

  // Fichier vidéo direct (mp4, webm, mov...)
  return <video src={u} controls preload="metadata" />;
};

const Themes = () => {
  const [themes, setThemes] = useState([]);
  const [chantiers, setChantiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedChantierFilter, setSelectedChantierFilter] = useState('all');
  const [userFullName, setUserFullName] = useState('');
  const [activeTab, setActiveTab] = useState('summary'); // 'summary' or 'grid'
  const [searchParams, setSearchParams] = useSearchParams();
  const themeIdParam = searchParams.get('id');

  // Detail / Editing state
  const [selectedTheme, setSelectedTheme] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [enlargedImage, setEnlargedImage] = useState(null);
  const [selectedCompInfo, setSelectedCompInfo] = useState(null);
  const [uploadingSectionId, setUploadingSectionId] = useState(null);
  const [uploadingVideoSectionId, setUploadingVideoSectionId] = useState(null);

  useEffect(() => {
    // Check admin status
    setIsAdmin(localStorage.getItem('isAdmin') === 'true');
    const handleAdminChange = () => {
      setIsAdmin(localStorage.getItem('isAdmin') === 'true');
    };
    window.addEventListener('adminModeChanged', handleAdminChange);

    // Fetch user profile name
    const fetchProfile = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { data } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', session.user.id)
            .maybeSingle();
          if (data?.full_name) {
            setUserFullName(data.full_name);
          }
        }
      } catch (err) {
        console.error("Error fetching user profile:", err);
      }
    };
    fetchProfile();

    // Fetch data
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch Chantiers for linking
        const { data: chData, error: chError } = await supabase
          .from('chantiers')
          .select('id, nom')
          .order('created_at', { ascending: false });
        if (chError) console.error("Error fetching chantiers:", chError);
        else setChantiers(chData || []);

        // Fetch Themes — tri côté client par position (puis date) pour rester robuste
        const { data: thData, error: thError } = await supabase
          .from('themes')
          .select('*')
          .order('created_at', { ascending: true });
        if (thError) console.error("Error fetching themes:", thError);
        else {
          const sorted = (thData || []).slice().sort((a, b) =>
            ((a.position ?? 1e9) - (b.position ?? 1e9)) || (new Date(a.created_at || 0) - new Date(b.created_at || 0))
          );
          setThemes(sorted);
        }
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();

    return () => {
      window.removeEventListener('adminModeChanged', handleAdminChange);
    };
  }, []);

  // Numérotation des thèmes selon l'ordre choisi (position) : id -> numéro
  const themeNumberMap = useMemo(() => {
    const map = {};
    themes.forEach((t, i) => { map[t.id] = i + 1; });
    return map;
  }, [themes]);

  // Réorganiser un thème (change sa numérotation)
  const handleMoveTheme = async (theme, dir) => {
    const idx = themes.findIndex(t => t.id === theme.id);
    const target = dir === 'up' ? idx - 1 : idx + 1;
    if (idx < 0 || target < 0 || target >= themes.length) return;
    const a = themes[idx], b = themes[target];
    const posA = a.position ?? (idx + 1);
    const posB = b.position ?? (target + 1);
    // Mise à jour optimiste de l'ordre local
    const newThemes = [...themes];
    newThemes[idx] = { ...a, position: posB };
    newThemes[target] = { ...b, position: posA };
    newThemes.sort((x, y) => (x.position ?? 0) - (y.position ?? 0));
    setThemes(newThemes);
    // Persistance
    try {
      await supabase.from('themes').update({ position: posB }).eq('id', a.id);
      await supabase.from('themes').update({ position: posA }).eq('id', b.id);
    } catch (err) {
      console.error('Erreur réorganisation thème:', err);
    }
  };

  useEffect(() => {
    if (themes.length > 0 && themeIdParam) {
      const found = themes.find(t => String(t.id) === String(themeIdParam));
      if (found) {
        setSelectedTheme(found);
      }
    }
  }, [themes, themeIdParam]);

  const handleAddNew = async () => {
    if (!isAdmin) return;
    const defaultChantierId = chantiers[0]?.id || null;
    const newTheme = {
      title: "Nouveau thème d'étude",
      description: "",
      images: [],
      sections: [
        {
          id: `sec_${Date.now()}`,
          title: "Introduction générale",
          text: "Saisissez vos explications, détails techniques et observations spécifiques...",
          images: []
        }
      ],
      competences: [],
      chantier_id: defaultChantierId
    };

    const { data, error } = await supabase
      .from('themes')
      .insert([newTheme])
      .select();

    if (error) {
      console.error("Error creating theme:", error);
      alert("Erreur lors de la création du thème");
    } else if (data && data.length > 0) {
      setThemes(prev => [data[0], ...prev]);
      setSelectedTheme(data[0]);
      setIsEditing(true);
    }
  };

  const handleUpdateSelected = (field, value) => {
    setSelectedTheme(prev => {
      if (!prev) return prev;
      return { ...prev, [field]: value };
    });
  };

  const handleToggleCompetence = (compId) => {
    const current = selectedTheme.competences || [];
    const updated = current.includes(compId)
      ? current.filter(id => id !== compId)
      : [...current, compId];
    handleUpdateSelected('competences', updated);
  };

  // Section Management
  const handleAddSection = () => {
    const newSec = {
      id: `sec_${Date.now()}`,
      title: "Nouveau titre de paragraphe",
      text: "Explications de la tâche...",
      images: []
    };
    const currentSections = selectedTheme.sections || [];
    handleUpdateSelected('sections', [...currentSections, newSec]);
  };

  const handleUpdateSectionField = (secId, field, value) => {
    const updated = (selectedTheme.sections || []).map(sec => 
      sec.id === secId ? { ...sec, [field]: value } : sec
    );
    handleUpdateSelected('sections', updated);
  };

  const handleRemoveSection = (secId) => {
    if (!window.confirm("Supprimer cette section ?")) return;
    const updated = (selectedTheme.sections || []).filter(sec => sec.id !== secId);
    handleUpdateSelected('sections', updated);
  };

  const handleMoveSection = (index, direction) => {
    const currentSections = [...(selectedTheme.sections || [])];
    if (direction === 'up' && index > 0) {
      const temp = currentSections[index];
      currentSections[index] = currentSections[index - 1];
      currentSections[index - 1] = temp;
    } else if (direction === 'down' && index < currentSections.length - 1) {
      const temp = currentSections[index];
      currentSections[index] = currentSections[index + 1];
      currentSections[index + 1] = temp;
    }
    handleUpdateSelected('sections', currentSections);
  };

  // Section Image Upload
  const handleSectionImageUpload = async (e, secId) => {
    const file = e.target.files?.[0];
    if (!file || !selectedTheme) return;

    setUploadingSectionId(secId);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.floor(Math.random() * 1000)}.${fileExt}`;
      const filePath = `themes/${selectedTheme.id}/${secId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('chantier-assets')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('chantier-assets')
        .getPublicUrl(filePath);

      if (data?.publicUrl) {
        const newImgObj = {
          id: `img_${Date.now()}`,
          url: data.publicUrl,
          caption: "Légende de l'image"
        };
        
        const updatedSections = (selectedTheme.sections || []).map(sec => {
          if (sec.id === secId) {
            const imgs = sec.images || [];
            return { ...sec, images: [...imgs, newImgObj] };
          }
          return sec;
        });

        handleUpdateSelected('sections', updatedSections);
      }
    } catch (error) {
      console.error('Error uploading section image:', error);
      alert('Erreur lors du téléversement : ' + error.message);
    } finally {
      setUploadingSectionId(null);
    }
  };

  // Section Video Upload (fichier déposé dans le bucket)
  const handleSectionVideoUpload = async (e, secId) => {
    const file = e.target.files?.[0];
    if (!file || !selectedTheme) return;

    setUploadingVideoSectionId(secId);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `video_${Date.now()}_${Math.floor(Math.random() * 1000)}.${fileExt}`;
      const filePath = `themes/${selectedTheme.id}/${secId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('chantier-assets')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('chantier-assets')
        .getPublicUrl(filePath);

      if (data?.publicUrl) {
        handleUpdateSectionField(secId, 'video', data.publicUrl);
      }
    } catch (error) {
      console.error('Error uploading section video:', error);
      alert('Erreur lors du téléversement de la vidéo : ' + error.message);
    } finally {
      setUploadingVideoSectionId(null);
    }
  };

  const handleUpdateSectionImageCaption = (secId, imgId, value) => {
    const updatedSections = (selectedTheme.sections || []).map(sec => {
      if (sec.id === secId) {
        const imgs = (sec.images || []).map(img => 
          img.id === imgId ? { ...img, caption: value } : img
        );
        return { ...sec, images: imgs };
      }
      return sec;
    });
    handleUpdateSelected('sections', updatedSections);
  };

  const handleRemoveSectionImage = (secId, imgId) => {
    const updatedSections = (selectedTheme.sections || []).map(sec => {
      if (sec.id === secId) {
        const imgs = (sec.images || []).filter(img => img.id !== imgId);
        return { ...sec, images: imgs };
      }
      return sec;
    });
    handleUpdateSelected('sections', updatedSections);
  };

  const handleSave = async () => {
    if (!selectedTheme) return;
    if (!selectedTheme.chantier_id) {
      alert("Un thème doit obligatoirement être lié à un chantier. Sélectionne un chantier dans « Chantier Associé » avant d'enregistrer.");
      return;
    }
    const payload = {
      title: selectedTheme.title,
      description: selectedTheme.description || "",
      sections: selectedTheme.sections || [],
      competences: selectedTheme.competences || [],
      chantier_id: selectedTheme.chantier_id
    };

    const { error } = await supabase
      .from('themes')
      .update(payload)
      .eq('id', selectedTheme.id);

    if (error) {
      console.error('Error saving theme:', error);
      alert('Erreur de sauvegarde : ' + (error.message || 'Erreur inconnue'));
    } else {
      setThemes(prev => prev.map(t => t.id === selectedTheme.id ? selectedTheme : t));
      setIsEditing(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedTheme) return;
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer définitivement ce thème d'étude ?")) return;

    const { error } = await supabase
      .from('themes')
      .delete()
      .eq('id', selectedTheme.id);

    if (error) {
      console.error('Error deleting theme:', error);
      alert('Erreur lors de la suppression');
    } else {
      setThemes(prev => prev.filter(t => t.id !== selectedTheme.id));
      setSelectedTheme(null);
      setIsEditing(false);
      setSearchParams({});
    }
  };

  // Filtered themes
  const filteredThemes = themes.filter(t => {
    const matchesSearch = 
      t.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (t.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.sections || []).some(sec => 
        sec.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        sec.text.toLowerCase().includes(searchTerm.toLowerCase())
      );
    
    const matchesChantier = 
      selectedChantierFilter === 'all' || 
      t.chantier_id === selectedChantierFilter;

    return matchesSearch && matchesChantier;
  });

  const totalCompetenciesCount = 19;

  // Render Dedicated Detail View
  if (selectedTheme) {
    const linkedCh = chantiers.find(c => c.id === selectedTheme.chantier_id);
    return (
      <div className="page content theme-detail-page">
        <div className="theme-detail-container">
          
          {/* Action Bar */}
          <div className="theme-action-bar">
            <button className="theme-back-list-btn" onClick={() => { setSelectedTheme(null); setIsEditing(false); setSearchParams({}); }}>
              <ChevronLeft size={16} /> Retour aux thèmes
            </button>

            <div style={{ display: 'flex', gap: '10px' }}>
              {isAdmin && (
                <>
                  {isEditing ? (
                    <>
                      <button className="theme-action-btn save" onClick={handleSave}>
                        <Save size={16} /> Enregistrer les modifications
                      </button>
                      <button className="theme-action-btn delete" onClick={handleDelete}>
                        <Trash2 size={16} /> Supprimer
                      </button>
                      <button className="theme-action-btn cancel" onClick={() => setIsEditing(false)}>
                        <X size={16} /> Annuler
                      </button>
                    </>
                  ) : (
                    <button className="theme-action-btn edit" onClick={() => setIsEditing(true)}>
                      <Edit size={16} /> Modifier la fiche
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {isEditing ? (
            // Form Editor View
            <div className="theme-full-editor">
              <div className="editor-dossier-header-card">
                <h2>Éditeur de Fiche Thématique</h2>
                
                <div className="edit-form-field" style={{ marginTop: '1.5rem' }}>
                  <label>Titre Principal du Thème</label>
                  <input 
                    type="text" 
                    value={selectedTheme.title} 
                    onChange={(e) => handleUpdateSelected('title', e.target.value)} 
                    style={{ fontSize: '18px', fontWeight: 700 }}
                  />
                </div>

                <div className="edit-form-field">
                  <label>Chantier Associé <span style={{ color: '#dc2626' }}>* (obligatoire)</span></label>
                  <select
                    value={selectedTheme.chantier_id || ''}
                    onChange={(e) => handleUpdateSelected('chantier_id', e.target.value || null)}
                    style={{ borderColor: selectedTheme.chantier_id ? undefined : '#dc2626' }}
                  >
                    <option value="">Sélectionner un chantier...</option>
                    {chantiers.map(c => (
                      <option key={c.id} value={c.id}>{c.nom}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Competency Links Editor */}
              <div className="editor-dossier-header-card">
                <h3 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--ink)' }}>Compétences mobilisées par ce thème</h3>
                <p style={{ fontSize: '11px', color: 'var(--ink-muted)', marginBottom: '1rem' }}>Cochez les compétences du BTS Bâtiment démontrées dans ce rapport d'étude.</p>
                
                <div className="theme-competence-checklist-grid">
                  {Object.entries(COMPETENCES_DATA).map(([catKey, cat]) => (
                    <div key={catKey} className="theme-editor-comp-group" style={{ borderLeft: `3px solid ${cat.color}`, paddingLeft: '12px', marginBottom: '1.5rem' }}>
                      <h4 style={{ fontSize: '12px', fontWeight: 800, color: 'var(--ink)', marginBottom: '8px' }}>
                        {catKey} - {cat.title}
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {cat.items.map(it => {
                          const isChecked = (selectedTheme.competences || []).includes(it.id);
                          return (
                            <label key={it.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '12px', cursor: 'pointer', color: 'var(--ink-mid)' }}>
                              <input 
                                type="checkbox" 
                                checked={isChecked} 
                                onChange={() => handleToggleCompetence(it.id)}
                                style={{ marginTop: '2px' }}
                              />
                              <span><strong>{it.id}</strong> - {it.label}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sections Editor List */}
              <div className="editor-sections-list">
                <h3>Paragraphes & Développements ({selectedTheme.sections?.length || 0})</h3>
                
                {(selectedTheme.sections || []).map((sec, index) => (
                  <div key={sec.id} className="editor-section-card">
                    <div className="editor-section-header">
                      <span className="section-number">Paragraphe #{index + 1}</span>
                      
                      <div className="section-reorder-buttons">
                        <button 
                          className="reorder-btn" 
                          onClick={() => handleMoveSection(index, 'up')}
                          disabled={index === 0}
                        >
                          <ArrowUp size={14} />
                        </button>
                        <button 
                          className="reorder-btn" 
                          onClick={() => handleMoveSection(index, 'down')}
                          disabled={index === (selectedTheme.sections || []).length - 1}
                        >
                          <ArrowDown size={14} />
                        </button>
                        <button className="section-delete-btn" onClick={() => handleRemoveSection(sec.id)}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    <div className="edit-form-field">
                      <label>Sous-titre / Intitulé</label>
                      <input 
                        type="text" 
                        value={sec.title} 
                        onChange={(e) => handleUpdateSectionField(sec.id, 'title', e.target.value)}
                        placeholder="Ex: Classement des factures et BL..."
                      />
                    </div>

                    <div className="edit-form-field">
                      <label>Corps du texte / Explications</label>
                      <textarea 
                        rows={6} 
                        value={sec.text} 
                        onChange={(e) => handleUpdateSectionField(sec.id, 'text', e.target.value)}
                        placeholder="Lors de la réception..."
                      />
                    </div>

                    {/* Section Images Manager */}
                    <div className="section-images-editor-box">
                      <label style={{ fontSize: '11px', fontWeight: 800, color: 'var(--ink-dim)' }}>Images de cette section</label>
                      
                      <div className="section-image-upload-row">
                        <label className="section-upload-trigger">
                          <Camera size={14} /> 
                          {uploadingSectionId === sec.id ? "Téléversement..." : "Ajouter une image"}
                          <input 
                            type="file" 
                            accept="image/*" 
                            onChange={(e) => handleSectionImageUpload(e, sec.id)}
                            disabled={uploadingSectionId !== null}
                            style={{ display: 'none' }}
                          />
                        </label>
                      </div>

                      <div className="section-images-editor-grid">
                        {(sec.images || []).map(img => (
                          <div key={img.id} className="section-image-edit-row">
                            <img src={img.url} alt={img.caption} />
                            <input 
                              type="text" 
                              value={img.caption} 
                              onChange={(e) => handleUpdateSectionImageCaption(sec.id, img.id, e.target.value)}
                              placeholder="Légende (ex: Facture)"
                            />
                            <button className="img-delete-btn" onClick={() => handleRemoveSectionImage(sec.id, img.id)}>
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Section Video Manager */}
                    <div className="section-images-editor-box">
                      <label style={{ fontSize: '11px', fontWeight: 800, color: 'var(--ink-dim)' }}>Vidéo de cette section (optionnel)</label>

                      <div className="section-video-edit-row">
                        <input
                          type="text"
                          value={sec.video || ''}
                          onChange={(e) => handleUpdateSectionField(sec.id, 'video', e.target.value)}
                          placeholder="Coller un lien YouTube / Vimeo, ou téléverser un fichier →"
                        />
                        <label className="section-upload-trigger">
                          <Camera size={14} />
                          {uploadingVideoSectionId === sec.id ? "Téléversement..." : "Téléverser"}
                          <input
                            type="file"
                            accept="video/*"
                            onChange={(e) => handleSectionVideoUpload(e, sec.id)}
                            disabled={uploadingVideoSectionId !== null}
                            style={{ display: 'none' }}
                          />
                        </label>
                        {sec.video && (
                          <button className="img-delete-btn" onClick={() => handleUpdateSectionField(sec.id, 'video', '')} title="Retirer la vidéo">
                            <X size={14} />
                          </button>
                        )}
                      </div>

                      {sec.video && (
                        <div className="section-video-preview">
                          {renderVideoEmbed(sec.video)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                <button className="add-new-section-btn" onClick={handleAddSection}>
                  <Plus size={16} /> Ajouter un paragraphe / sous-section
                </button>
              </div>
            </div>
          ) : (
            // High-End Structured Dossier View
            <div className="theme-dossier-view">
              
              {/* Document Sheet */}
              <div className="dossier-paper-sheet">
                
                {/* Header block inside sheet */}
                <div className="dossier-header-block">
                  <div className="dossier-meta-header-top">
                    {linkedCh && (
                      <span className="dossier-badge-chantier">
                        <Building2 size={12} /> CHANTIER : {linkedCh.nom}
                      </span>
                    )}
                    <span className="dossier-badge-date">
                      <Calendar size={12} /> {new Date(selectedTheme.created_at).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                  
                  <div style={{ fontFamily: "'Syne', sans-serif", fontSize: '12px', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--accent-cord)', marginBottom: '6px' }}>
                    Thème N°{themeNumberMap[selectedTheme.id] || '—'}
                  </div>
                  <h1 className="dossier-document-title">{selectedTheme.title}</h1>

                  {/* Competence Badges Row in document header */}
                  {selectedTheme.competences && selectedTheme.competences.length > 0 && (
                    <div className="dossier-competences-badges-row">
                      <Award size={12} className="award-icon-dossier" />
                      <span className="dossier-comp-label-prefix">Compétences visées :</span>
                      <div className="dossier-comp-badges-container">
                        {selectedTheme.competences.map(code => {
                          let catColor = '#aaa';
                          let compLabel = '';
                          Object.entries(COMPETENCES_DATA).forEach(([catKey, cat]) => {
                            const it = cat.items.find(i => i.id === code);
                            if (it) {
                              catColor = cat.color;
                              compLabel = it.label;
                            }
                          });
                          return (
                            <span 
                              key={code} 
                              className="dossier-badge-pill" 
                              style={{ backgroundColor: `${catColor}35`, color: 'var(--ink)' }}
                            >
                              {code}
                              {compLabel && <span className="badge-tooltip"><strong>{code}</strong> : {compLabel}</span>}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="dossier-header-divider"></div>
                </div>

                {/* Sections loop */}
                <div className="dossier-body-sections">
                  {(selectedTheme.sections || []).map((sec, idx) => {
                    const imgs = sec.images || [];
                    const hasImages = imgs.length > 0;
                    
                    return (
                      <div key={sec.id} className="dossier-section-container">
                        
                        {/* Section Heading */}
                        <h2 className="dossier-section-heading">
                          {sec.title}
                        </h2>

                        {/* Section Video (si présente) */}
                        {sec.video && (
                          <div className="dossier-section-video">
                            {renderVideoEmbed(sec.video)}
                          </div>
                        )}

                        {/* Section Layout according to Image count */}
                        {!hasImages ? (
                          // Layout 0: Text Only
                          <div className="section-layout-text-only">
                            {sec.text.split('\n').map((para, pIdx) => (
                              <p key={pIdx} className="dossier-paragraph">{para}</p>
                            ))}
                          </div>
                        ) : imgs.length === 1 ? (
                          // Layout 1: Side-By-Side (Text left 60%, single image right 40%)
                          <div className="section-layout-split">
                            <div className="split-text-col">
                              {sec.text.split('\n').map((para, pIdx) => (
                                <p key={pIdx} className="dossier-paragraph">{para}</p>
                              ))}
                            </div>
                            <div className="split-image-col">
                              <div className="dossier-image-card" onClick={() => setEnlargedImage(imgs[0])}>
                                <img src={imgs[0].url} alt={imgs[0].caption} />
                                {imgs[0].caption && (
                                  <span className="dossier-image-caption">{imgs[0].caption}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        ) : (
                          // Layout 2: Text on top, side-by-side grid of images below
                          <div className="section-layout-grid-stacked">
                            <div className="stacked-text-block">
                              {sec.text.split('\n').map((para, pIdx) => (
                                <p key={pIdx} className="dossier-paragraph">{para}</p>
                              ))}
                            </div>
                            <div className="stacked-images-grid" style={{
                              gridTemplateColumns: `repeat(auto-fit, minmax(220px, 1fr))`
                            }}>
                              {imgs.map(img => (
                                <div key={img.id} className="dossier-image-card" onClick={() => setEnlargedImage(img)}>
                                  <img src={img.url} alt={img.caption} />
                                  {img.caption && (
                                    <span className="dossier-image-caption">{img.caption}</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Paper sheet footer */}
                <div className="dossier-sheet-footer">
                  <div className="dossier-footer-divider"></div>
                  <div className="dossier-footer-meta">
                    <span className="student-name">
                      <UserIcon size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                      {userFullName || "ZOÉ LUCAS"} / BTS BÂTIMENT ALTERNANCE
                    </span>
                    <span className="page-indicator">
                      Page theme_id: {selectedTheme.id.substring(0, 5).toUpperCase()}
                    </span>
                  </div>
                </div>

              </div>
            </div>
          )}
        </div>

        {/* LIGHTBOX FOR FULL IMAGE PREVIEW */}
        {enlargedImage && (
          <div className="themes-lightbox-overlay" onClick={() => setEnlargedImage(null)}>
            <div className="themes-lightbox-content" onClick={(e) => e.stopPropagation()}>
              <img src={enlargedImage.url} alt={enlargedImage.caption} />
              {enlargedImage.caption && (
                <span className="themes-lightbox-caption">{enlargedImage.caption}</span>
              )}
              <button className="themes-lightbox-close" onClick={() => setEnlargedImage(null)}>
                <X size={24} />
              </button>
            </div>
          </div>
        )}


      </div>
    );
  }

  // LIST VIEW
  return (
    <div className="page content themes-page">
      <div className="themes-container">
        
        {/* Header */}
        <div className="themes-header-top">
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <FolderOpen size={36} className="themes-header-icon" />
            <div>
              <h1>Thèmes d'Étude</h1>
              <p>Fiches techniques, thématiques spécifiques et rapports de tâches par chantier.</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="themes-tabs-row" style={{ display: 'flex', gap: '10px', marginTop: '1.5rem' }}>
            <button 
              className={`tab-btn-premium ${activeTab === 'summary' ? 'active' : ''}`}
              onClick={() => setActiveTab('summary')}
              style={{
                padding: '8px 16px',
                borderRadius: '20px',
                border: '1px solid var(--border-mid)',
                background: activeTab === 'summary' ? 'var(--ink)' : 'transparent',
                color: activeTab === 'summary' ? 'white' : 'var(--ink-dim)',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '12px',
                transition: 'all 0.2s ease'
              }}
            >
              Tableau Récapitulatif
            </button>
            <button 
              className={`tab-btn-premium ${activeTab === 'grid' ? 'active' : ''}`}
              onClick={() => setActiveTab('grid')}
              style={{
                padding: '8px 16px',
                borderRadius: '20px',
                border: '1px solid var(--border-mid)',
                background: activeTab === 'grid' ? 'var(--ink)' : 'transparent',
                color: activeTab === 'grid' ? 'white' : 'var(--ink-dim)',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '12px',
                transition: 'all 0.2s ease'
              }}
            >
              Grille des Thèmes
            </button>
          </div>
        </div>

        {activeTab === 'grid' ? (
          <>
            {/* Filters and Controls */}
            <div className="themes-controls-row">
              <div className="search-box-wrapper">
                <Search size={18} className="search-icon" />
                <input 
                  type="text" 
                  placeholder="Rechercher un thème, mot-clé..." 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)} 
                />
              </div>

              <div className="filter-select-wrapper">
                <Filter size={16} className="filter-icon" />
                <select 
                  value={selectedChantierFilter} 
                  onChange={(e) => setSelectedChantierFilter(e.target.value)}
                >
                  <option value="all">Tous les Chantiers</option>
                  {chantiers.map(c => (
                    <option key={c.id} value={c.id}>{c.nom}</option>
                  ))}
                </select>
              </div>

              {isAdmin && (
                <button className="add-theme-btn-action" onClick={handleAddNew}>
                  <Plus size={18} /> Nouveau Thème
                </button>
              )}
            </div>

            {/* Themes Grid */}
            {loading ? (
              <div className="loading-state">Chargement des fiches thématiques...</div>
            ) : filteredThemes.length > 0 ? (
              <div className="themes-grid-list">
                {filteredThemes.map(theme => {
                  const linkedCh = chantiers.find(c => c.id === theme.chantier_id);
                  let firstImage = null;
                  if (theme.sections && theme.sections.length > 0) {
                    for (const sec of theme.sections) {
                      if (sec.images && sec.images.length > 0) {
                        firstImage = sec.images[0].url;
                        break;
                      }
                    }
                  }

                  return (
                    <div key={theme.id} className="theme-card" onClick={() => { setSelectedTheme(theme); setIsEditing(false); }}>
                      <div className="theme-card-image">
                        {firstImage ? (
                          <img src={firstImage} alt={theme.title} />
                        ) : (
                          <div className="no-image-placeholder">
                            <ImageIcon size={32} style={{ opacity: 0.15 }} />
                          </div>
                        )}
                        {linkedCh && (
                          <span className="theme-card-chantier-badge">
                            <Building2 size={12} /> {linkedCh.nom}
                          </span>
                        )}
                      </div>
                      <div className="theme-card-content">
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <div style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--accent-cord)' }}>Thème N°{themeNumberMap[theme.id] || '—'}</div>
                          {isAdmin && (
                            <div style={{ display: 'flex', gap: '4px' }}>
                              <button
                                title="Monter (numéro précédent)"
                                onClick={(e) => { e.stopPropagation(); handleMoveTheme(theme, 'up'); }}
                                disabled={themeNumberMap[theme.id] === 1}
                                style={{ border: '1px solid var(--border-mid)', background: 'white', borderRadius: '6px', cursor: 'pointer', padding: '2px', lineHeight: 0, opacity: themeNumberMap[theme.id] === 1 ? 0.3 : 1 }}
                              >
                                <ArrowUp size={13} />
                              </button>
                              <button
                                title="Descendre (numéro suivant)"
                                onClick={(e) => { e.stopPropagation(); handleMoveTheme(theme, 'down'); }}
                                disabled={themeNumberMap[theme.id] === themes.length}
                                style={{ border: '1px solid var(--border-mid)', background: 'white', borderRadius: '6px', cursor: 'pointer', padding: '2px', lineHeight: 0, opacity: themeNumberMap[theme.id] === themes.length ? 0.3 : 1 }}
                              >
                                <ArrowDown size={13} />
                              </button>
                            </div>
                          )}
                        </div>
                        <h3 className="theme-card-title">{theme.title}</h3>
                        <p className="theme-card-desc">
                          {theme.sections && theme.sections.length > 0 && theme.sections[0].text
                            ? (theme.sections[0].text.length > 100 
                                ? `${theme.sections[0].text.substring(0, 100)}...` 
                                : theme.sections[0].text)
                            : "Aucune section rédigée pour le moment."}
                        </p>
                        <div className="theme-card-footer">
                          <span className="images-count">
                            <Camera size={12} /> {(theme.sections || []).reduce((acc, s) => acc + (s.images?.length || 0), 0)} image(s)
                          </span>
                          <span className="view-more">Consulter la fiche &rarr;</span>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {isAdmin && (
                  <div className="theme-card add-new-theme-placeholder" onClick={handleAddNew}>
                    <div className="add-icon">+</div>
                    <h3>Ajouter un Thème</h3>
                    <p>Créer une nouvelle fiche thématique technique.</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="empty-state-container">
                <FolderOpen size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                <p>Aucun thème trouvé avec ces critères de recherche.</p>
              </div>
            )}
          </>
        ) : (
          // COMPETENCIES SUMMARY MATRIX FOR THEMES
          <div className="themes-summary-table-container" style={{ overflowX: 'auto', background: 'var(--bg-card)', borderRadius: '28px', border: '1px solid var(--border-mid)', padding: '2rem', marginTop: '2rem' }}>
            {themes.length === 0 ? (
              <div className="empty-state-container" style={{ background: 'transparent', border: 'none' }}>
                <p>Aucun thème d'étude disponible pour le tableau récapitulatif.</p>
              </div>
            ) : (
              <table className="summary-matrix-table" style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '12px', borderBottom: '2px solid var(--border-mid)', verticalAlign: 'bottom', fontSize: '14px', fontFamily: 'Playfair Display' }}>
                      Compétences observables / mobilisables (U61)
                    </th>
                    {themes.map(t => (
                      <th 
                        key={t.id} 
                        className="rotated-header-cell" 
                        style={{ borderBottom: '2px solid var(--border-mid)', textAlign: 'center', width: '80px', cursor: 'pointer' }}
                        onClick={() => { setSelectedTheme(t); setIsEditing(false); }}
                      >
                        <div className="rotated-header-content" style={{ color: 'var(--accent-cord)', textDecoration: 'underline', textUnderlineOffset: '3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '120px' }}>
                          {t.title}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(COMPETENCES_DATA).map(([catKey, cat]) => (
                    <React.Fragment key={catKey}>
                      <tr style={{ backgroundColor: `${cat.color}25` }}>
                        <td 
                          colSpan={themes.length + 1} 
                          style={{ 
                            padding: '10px 12px', 
                            fontWeight: 800, 
                            fontSize: '11px', 
                            textTransform: 'uppercase', 
                            letterSpacing: '0.05em', 
                            color: 'var(--ink)',
                            borderBottom: '1px solid var(--border-mid)'
                          }}
                        >
                          {catKey} — {cat.title}
                        </td>
                      </tr>
                      {cat.items.map(it => (
                        <tr key={it.id} className="summary-matrix-row">
                          <td style={{ padding: '10px 12px', fontSize: '12px', borderBottom: '1px solid var(--border)', color: 'var(--ink-mid)' }}>
                            <strong style={{ color: 'var(--ink)', marginRight: '6px' }}>{it.id}</strong> {it.label}
                          </td>
                          {themes.map(t => {
                            const isChecked = (t.competences || []).includes(it.id);
                            return (
                              <td key={t.id} style={{ borderBottom: '1px solid var(--border)', textAlign: 'center', padding: '6px' }}>
                                {isChecked ? (
                                  <div style={{ 
                                    width: '24px', 
                                    height: '24px', 
                                    lineHeight: '24px', 
                                    margin: '0 auto', 
                                    backgroundColor: cat.color, 
                                    color: '#000', 
                                    fontWeight: 900, 
                                    borderRadius: '6px', 
                                    fontSize: '12px',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                  }}>
                                    x
                                  </div>
                                ) : (
                                  <span style={{ color: 'var(--border-str)', fontSize: '14px', opacity: 0.3 }}>-</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                  
                  {/* Summary row */}
                  <tr style={{ borderTop: '2px solid var(--border-mid)' }}>
                    <td style={{ padding: '12px', fontSize: '12px', fontWeight: 700, color: 'var(--ink)' }}>
                      Total compétences visées
                    </td>
                    {themes.map(t => {
                      const count = (t.competences || []).length;
                      return (
                        <td key={t.id} style={{ textAlign: 'center', padding: '6px', fontWeight: 900, fontSize: '13px' }}>
                          {count} / 19
                        </td>
                      );
                    })}
                  </tr>
                  
                  <tr>
                    <td style={{ padding: '12px', fontSize: '12px', fontWeight: 700, color: 'var(--ink)' }}>
                      Taux de couverture
                    </td>
                    {themes.map(t => {
                      const count = (t.competences || []).length;
                      const percentage = Math.round((count / totalCompetenciesCount) * 100);
                      return (
                        <td key={t.id} style={{ textAlign: 'center', padding: '6px' }}>
                          <div style={{ 
                            display: 'inline-block',
                            padding: '4px 8px', 
                            backgroundColor: percentage > 50 ? '#d5f5e3' : percentage > 10 ? '#fcf3cf' : '#fadbd8', 
                            color: percentage > 50 ? '#196f3d' : percentage > 10 ? '#7d6608' : '#78281f', 
                            fontWeight: 900, 
                            borderRadius: '6px', 
                            fontSize: '11px'
                          }}>
                            {percentage}%
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

    </div>
  );
};

export default Themes;
