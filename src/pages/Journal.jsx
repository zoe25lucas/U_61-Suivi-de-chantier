import { useState, useEffect, useMemo } from 'react';
import { 
  ChevronLeft, ChevronRight, Plus, Trash2, Calendar, Settings, FileText, CheckCircle, Briefcase, GraduationCap, Tent, MapPin, Edit2, ChevronDown
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import './Journal.css';

// ---- CONFIGURATION DES COMPÉTENCES ----
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

// ---- FONCTIONS UTILITAIRES CALENDRIER ----
const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
const getFirstDayOfMonth = (year, month) => {
  let day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1; // 0 = Lundi, 6 = Dimanche
};

// Jours fériés fixes (FR)
const getFeries = (year) => [
  `${year}-01-01`, `${year}-05-01`, `${year}-05-08`, `${year}-07-14`, `${year}-08-15`, `${year}-11-01`, `${year}-11-11`, `${year}-12-25`
];
// Jours fériés mobiles (approximatif pour 2025/2026)
const getPaques = (year) => {
  if (year === 2025) return { lundi: '2025-04-21', ascension: '2025-05-29', pentecote: '2025-06-09' };
  if (year === 2026) return { lundi: '2026-04-06', ascension: '2026-05-14', pentecote: '2026-05-25' };
  return { lundi: '', ascension: '', pentecote: '' };
};

const isDateInPeriod = (dateStr, startStr, endStr) => {
  const d = new Date(dateStr).getTime();
  const s = new Date(startStr).getTime();
  const e = new Date(endStr).getTime();
  return d >= s && d <= e;
};

// ==========================================
// COMPOSANT PRINCIPAL
// ==========================================
export default function Journal() {
  const [activeTab, setActiveTab] = useState('calendar'); // 'calendar' | 'config'
  const [isEditing, setIsEditing] = useState(false);
  
  // Données
  const [periods, setPeriods] = useState([]);
  const [entries, setEntries] = useState({}); // { 'YYYY-MM-DD': { tasks: [...] } }
  const [chantiers, setChantiers] = useState([]);
  const [settingsId, setSettingsId] = useState('550e8400-e29b-41d4-a716-446655449999'); // Default ID
  
  // Navigation Calendrier
  const [currentDate, setCurrentDate] = useState(new Date()); // Affichage
  
  // Modal Journée
  const [selectedDay, setSelectedDay] = useState(null); // { date: 'YYYY-MM-DD', type: 'entreprise' }
  const [newTaskContent, setNewTaskContent] = useState('');
  const [newTaskChantier, setNewTaskChantier] = useState('');
  const [newTaskCompetences, setNewTaskCompetences] = useState([]);
  const [newTaskEndDate, setNewTaskEndDate] = useState('');
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pickerCurrentDate, setPickerCurrentDate] = useState(new Date());

  // Formulaire Config
  const [newPeriodType, setNewPeriodType] = useState('ecole');
  const [newPeriodStart, setNewPeriodStart] = useState('');
  const [newPeriodEnd, setNewPeriodEnd] = useState('');
  const [isAdmin, setIsAdmin] = useState(localStorage.getItem('isAdmin') === 'true');

  useEffect(() => {
    const handleAdminChange = () => {
      setIsAdmin(localStorage.getItem('isAdmin') === 'true');
    };
    window.addEventListener('adminModeChanged', handleAdminChange);
    return () => window.removeEventListener('adminModeChanged', handleAdminChange);
  }, []);

  // 1. CHARGEMENT DES DONNÉES
  useEffect(() => {
    async function fetchData() {
      // Périodes
      try {
        const { data: settings } = await supabase.from('journal_settings').select('*').maybeSingle();
        if (settings) {
          if (settings.periods) setPeriods(settings.periods);
          setSettingsId(settings.id);
        }
      } catch (err) { console.error("Erreur settings:", err); }

      // Entrées du journal
      try {
        const { data: entriesData } = await supabase.from('journal_entries').select('*');
        if (entriesData) {
          const entriesMap = {};
          entriesData.forEach(e => { entriesMap[e.date] = e; });
          setEntries(entriesMap);
        }
      } catch (err) { console.error("Erreur entrées:", err); }

      // Chantiers
      try {
        const { data: chantiersData } = await supabase.from('chantiers').select('id, nom, lieu');
        if (chantiersData) setChantiers(chantiersData);
      } catch (err) { console.error("Erreur chantiers list:", err); }
    }
    fetchData();
  }, []);

  // 2. LOGIQUE CALENDRIER
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToday = () => setCurrentDate(new Date());

  const daysInMonth = getDaysInMonth(year, month);
  const firstDayIndex = getFirstDayOfMonth(year, month);

  // Générer les cellules
  const calendarCells = useMemo(() => {
    const cells = [];
    const feriesFlex = getPaques(year);
    const feriesList = [...getFeries(year), feriesFlex.lundi, feriesFlex.ascension, feriesFlex.pentecote];

    // Jours du mois précédent
    const prevMonthDays = getDaysInMonth(year, month - 1);
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      cells.push({ day: prevMonthDays - i, isCurrentMonth: false, dateStr: '' });
    }

    // Jours du mois en cours
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const dateObj = new Date(year, month, i);
      const dayOfWeek = dateObj.getDay();
      
      let type = 'none';
      if (dayOfWeek === 0 || dayOfWeek === 6) type = 'weekend';
      else if (feriesList.includes(dateStr)) type = 'ferie';
      else {
        // Find all periods that include this date
        const matchingPeriods = periods.filter(p => isDateInPeriod(dateStr, p.start, p.end));
        if (matchingPeriods.length > 0) {
          // The last added period (override) wins
          type = matchingPeriods[matchingPeriods.length - 1].type;
        }
      }

      cells.push({ 
        day: i, 
        isCurrentMonth: true, 
        dateStr, 
        type,
        isToday: dateStr === new Date().toISOString().split('T')[0]
      });
    }

    // Compléter la dernière ligne
    const remaining = 42 - cells.length; // 6 rows of 7 days
    for (let i = 1; i <= remaining; i++) {
      cells.push({ day: i, isCurrentMonth: false, dateStr: '' });
    }

    return cells;
  }, [year, month, periods, daysInMonth, firstDayIndex]);


  // 3. ACTIONS JOURNAL
  const openDayModal = (cell) => {
    if (!cell.isCurrentMonth || cell.dateStr === '') return;
    setSelectedDay({ date: cell.dateStr, type: cell.type });
    setNewTaskContent('');
    setNewTaskChantier('');
    setNewTaskCompetences([]);
    setNewTaskEndDate('');
    setEditingTaskId(null);
  };

  const toggleCompetence = (comp) => {
    if (newTaskCompetences.includes(comp)) {
      setNewTaskCompetences(newTaskCompetences.filter(c => c !== comp));
    } else {
      setNewTaskCompetences([...newTaskCompetences, comp]);
    }
  };

  const saveTask = async () => {
    if (!newTaskContent.trim()) return;

    let datesToUpdate = [selectedDay.date];
    // On permet la duplication même en mode édition si une date de fin est saisie
    if (newTaskEndDate && new Date(newTaskEndDate) > new Date(selectedDay.date)) {
      let curr = new Date(selectedDay.date);
      const end = new Date(newTaskEndDate);
      curr.setDate(curr.getDate() + 1);
      while (curr <= end) {
        const dStr = curr.toISOString().split('T')[0];
        const dayDate = new Date(curr);
        const dayOfWeek = dayDate.getDay();
        const feriesFlex = getPaques(dayDate.getFullYear());
        const feriesList = [...getFeries(dayDate.getFullYear()), feriesFlex.lundi, feriesFlex.ascension, feriesFlex.pentecote];
        
        let isWorking = true;
        if (dayOfWeek === 0 || dayOfWeek === 6 || feriesList.includes(dStr)) isWorking = false;
        else {
          const matchingPeriods = periods.filter(p => isDateInPeriod(dStr, p.start, p.end));
          if (matchingPeriods.length > 0) {
            const lastType = matchingPeriods[matchingPeriods.length - 1].type;
            if (lastType !== 'entreprise') isWorking = false;
          } else {
             isWorking = false;
          }
        }

        if (isWorking) {
          datesToUpdate.push(dStr);
        }
        curr.setDate(curr.getDate() + 1);
      }
    }

    try {
      const upserts = [];
      const updatedEntries = { ...entries };

      for (const d of datesToUpdate) {
        const currentEntry = entries[d] || { date: d, tasks: [] };
        let updatedTasks;

        // Si on édite la tâche d'origine (sur le jour sélectionné)
        if (editingTaskId && d === selectedDay.date) {
          updatedTasks = (currentEntry.tasks || []).map(t => t.id === editingTaskId ? {
            ...t,
            content: newTaskContent,
            chantier_id: newTaskChantier || null,
            competences: newTaskCompetences
          } : t);
        } else {
          // Pour les autres jours (duplication), on crée une nouvelle tâche
          const newTask = {
            id: Date.now().toString() + '-' + Math.random().toString(36).substr(2, 5),
            content: newTaskContent,
            chantier_id: newTaskChantier || null,
            competences: newTaskCompetences
          };
          updatedTasks = [...(currentEntry.tasks || []), newTask];
        }

        upserts.push({
          date: d,
          tasks: updatedTasks
        });
      }

      // Important: on fait l'upsert
      const { data, error } = await supabase.from('journal_entries').upsert(upserts, { onConflict: 'date' }).select();
      if (error) throw error;

      if (data) {
        data.forEach(item => {
          updatedEntries[item.date] = item;
        });
      }

      setEntries(updatedEntries);
      setNewTaskContent('');
      setNewTaskChantier('');
      setNewTaskCompetences([]);
      setNewTaskEndDate('');
      setEditingTaskId(null);
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la sauvegarde de la tâche.");
    }
  };

  const startEditTask = (task) => {
    setEditingTaskId(task.id);
    setNewTaskContent(task.content);
    setNewTaskChantier(task.chantier_id || '');
    setNewTaskCompetences(task.competences || []);
  };

  const cancelEditTask = () => {
    setEditingTaskId(null);
    setNewTaskContent('');
    setNewTaskChantier('');
    setNewTaskCompetences([]);
    setNewTaskEndDate('');
  };

  const deleteTask = async (taskId) => {
    const currentEntry = entries[selectedDay.date];
    if (!currentEntry) return;

    const updatedTasks = currentEntry.tasks.filter(t => t.id !== taskId);
    try {
      const { data, error } = await supabase.from('journal_entries').upsert({
        id: currentEntry.id,
        date: selectedDay.date,
        tasks: updatedTasks
      }).select().single();

      if (error) throw error;
      setEntries({ ...entries, [selectedDay.date]: data });
    } catch (err) {
      console.error(err);
    }
  };

  const handleQuickTypeChange = (newType) => {
    const newPeriod = {
      id: Date.now().toString(),
      type: newType,
      start: selectedDay.date,
      end: selectedDay.date
    };
    savePeriods([...periods, newPeriod]);
    setSelectedDay({ ...selectedDay, type: newType });
  };

  // 4. ACTIONS CONFIGURATION
  const savePeriods = async (newPeriods) => {
    try {
      const { error } = await supabase.from('journal_settings').upsert({
        id: settingsId,
        periods: newPeriods
      });
      if (error) throw error;
      setPeriods(newPeriods);
    } catch (err) {
      console.error("Erreur de sauvegarde des périodes :", err);
      alert("Erreur lors de la sauvegarde des périodes : " + err.message);
    }
  };

  const addPeriod = () => {
    if (!newPeriodStart) return alert("Veuillez sélectionner une date de début.");
    const end = newPeriodEnd || newPeriodStart; // Si pas de fin, c'est un jour unique
    
    // Vérifier si la fin est bien après le début
    if (new Date(end) < new Date(newPeriodStart)) return alert("La date de fin doit être après la date de début.");

    const newPeriod = {
      id: Date.now().toString(),
      type: newPeriodType,
      start: newPeriodStart,
      end: end
    };

    savePeriods([...periods, newPeriod]);
    setNewPeriodStart('');
    setNewPeriodEnd('');
  };

  const deletePeriod = (id) => {
    savePeriods(periods.filter(p => p.id !== id));
  };


  // RENDU
  const renderCalendar = () => (
    <>
      <div className="calendar-controls">
        <div className="calendar-nav">
          <button className="btn-icon-sm" onClick={prevMonth}><ChevronLeft size={18} /></button>
          
          <div className="calendar-month-selector">
            <div className="calendar-select-wrapper">
              <select 
                value={month} 
                onChange={(e) => setCurrentDate(new Date(year, parseInt(e.target.value), 1))}
                className="calendar-select"
              >
                {Array.from({ length: 12 }).map((_, i) => (
                  <option key={i} value={i}>
                    {new Date(2000, i, 1).toLocaleDateString('fr-FR', { month: 'long' })}
                  </option>
                ))}
              </select>
              <ChevronDown className="select-icon" size={14} />
            </div>
            <div className="calendar-select-wrapper">
              <select 
                value={year} 
                onChange={(e) => setCurrentDate(new Date(parseInt(e.target.value), month, 1))}
                className="calendar-select"
              >
                {Array.from({ length: 10 }).map((_, i) => (
                  <option key={i} value={year - 5 + i}>
                    {year - 5 + i}
                  </option>
                ))}
              </select>
              <ChevronDown className="select-icon" size={14} />
            </div>
          </div>

          <button className="btn-icon-sm" onClick={nextMonth}><ChevronRight size={18} /></button>
          <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: '12px', marginLeft: '10px' }} onClick={goToday}>Aujourd'hui</button>
        </div>
        
        <div className="calendar-legend">
          <div className="legend-item"><div className="legend-dot type-entreprise"></div> Entreprise</div>
          <div className="legend-item"><div className="legend-dot type-ecole"></div> École</div>
          <div className="legend-item"><div className="legend-dot type-conges"></div> Congés</div>
          <div className="legend-item"><div className="legend-dot type-ferie"></div> Férié</div>
          <div className="legend-item"><div className="legend-dot type-pont"></div> Pont</div>
        </div>
      </div>

      <div className="calendar-grid">
        <div className="calendar-weekdays">
          {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(d => (
            <div key={d} className="calendar-weekday">{d}</div>
          ))}
        </div>
        <div className="calendar-days">
          {calendarCells.map((cell, idx) => {
            const hasEntry = cell.isCurrentMonth && entries[cell.dateStr]?.tasks?.length > 0;
            return (
              <div 
                key={idx} 
                className={`calendar-day ${!cell.isCurrentMonth ? 'other-month' : ''} ${cell.isToday ? 'today' : ''} type-${cell.type} ${(cell.type === 'weekend' || cell.type === 'ferie' || cell.type === 'pont') ? 'non-working' : ''}`}
                onClick={() => openDayModal(cell)}
              >
                <div className="calendar-day-number">{cell.day}</div>
                {cell.isCurrentMonth && cell.type !== 'none' && cell.type !== 'weekend' && cell.type !== 'ferie' && cell.type !== 'pont' && (
                  <div className={`calendar-day-type type-${cell.type}`}>
                    {cell.type}
                  </div>
                )}
                {cell.isCurrentMonth && cell.type === 'ferie' && (
                  <div className="calendar-day-type type-ferie">Férié</div>
                )}
                {cell.isCurrentMonth && cell.type === 'pont' && (
                  <div className="calendar-day-type type-pont">Pont</div>
                )}
                
                {hasEntry && (
                  <div className="calendar-day-tasks has-tasks">
                    <FileText /> {entries[cell.dateStr].tasks.length} tâche(s)
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );

  const renderConfig = () => (
    <div className="config-layout">
      <div className="config-sidebar">
        <div className="profil-card">
          <h3 className="profil-card-title"><Settings size={15} /> Ajouter une période</h3>
          <p className="profil-about-text" style={{ marginBottom: '1rem' }}>
            Vous pouvez ajouter une journée (laissez la date de fin vide) ou une semaine/période complète.
          </p>
          
          <label className="task-editor-label">Type de journée</label>
          <select className="profil-edit-input" style={{ width: '100%', marginBottom: '1rem', background: '#fff' }} value={newPeriodType} onChange={e => setNewPeriodType(e.target.value)}>
            <option value="entreprise">Entreprise</option>
            <option value="ecole">École</option>
            <option value="conges">Congés</option>
            <option value="pont">Pont</option>
          </select>

          <label className="task-editor-label">Date de début</label>
          <input type="date" className="profil-edit-input" style={{ width: '100%', marginBottom: '1rem', background: '#fff' }} value={newPeriodStart} onChange={e => setNewPeriodStart(e.target.value)} />

          <label className="task-editor-label">Date de fin (optionnel)</label>
          <input type="date" className="profil-edit-input" style={{ width: '100%', marginBottom: '1rem', background: '#fff' }} value={newPeriodEnd} onChange={e => setNewPeriodEnd(e.target.value)} />

          <button className="btn-primary" style={{ width: '100%' }} onClick={addPeriod}>Ajouter</button>
        </div>
      </div>

      <div className="config-main">
        <h3 className="profil-card-title" style={{ marginBottom: '1.5rem' }}><Calendar size={15} /> Vos Périodes Définies</h3>
        <div className="config-period-list">
          {periods.sort((a,b) => new Date(a.start) - new Date(b.start)).map(p => (
            <div key={p.id} className="config-period-item">
              <div>
                <span className={`config-period-type type-${p.type}`}>{p.type}</span>
                <span className="config-period-dates" style={{ marginLeft: '12px' }}>
                  {p.start === p.end ? new Date(p.start).toLocaleDateString('fr-FR') : `Du ${new Date(p.start).toLocaleDateString('fr-FR')} au ${new Date(p.end).toLocaleDateString('fr-FR')}`}
                </span>
              </div>
              <button className="btn-icon-sm delete" onClick={() => deletePeriod(p.id)}><Trash2 size={14} /></button>
            </div>
          ))}
          {periods.length === 0 && <p className="profil-about-text">Aucune période définie.</p>}
        </div>
      </div>
    </div>
  );

  return (
    <div className="journal-wrap">
      <div className="journal-header">
        <div>
          <h1 className="journal-title">Journal de bord</h1>
          <div className="journal-subtitle">Suivez vos journées en entreprise et gardez une trace de vos tâches.</div>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div className="journal-tabs">
            <button className={`journal-tab ${activeTab === 'calendar' ? 'active' : ''}`} onClick={() => setActiveTab('calendar')}>Calendrier & Journal</button>
            {isAdmin && isEditing && (
              <button className={`journal-tab ${activeTab === 'config' ? 'active' : ''}`} onClick={() => setActiveTab('config')}>Configuration Planning</button>
            )}
          </div>
          {isAdmin && (
            <button 
              className={isEditing ? "btn-primary" : "btn-secondary"} 
              style={{ padding: '8px 16px', fontSize: '13px' }}
              onClick={() => {
                setIsEditing(!isEditing);
                if (isEditing && activeTab === 'config') setActiveTab('calendar');
              }}
            >
              {isEditing ? 'Terminer' : 'Modifier'}
            </button>
          )}
        </div>
      </div>

      {activeTab === 'calendar' ? renderCalendar() : renderConfig()}

      {/* MODAL JOURNÉE */}
      {selectedDay && (
        <div className="journal-modal-overlay" onClick={() => setSelectedDay(null)}>
          <div className="journal-modal" onClick={e => e.stopPropagation()}>
            <div className="journal-modal-header">
              <div>
                <span className="journal-modal-date">
                  {new Date(selectedDay.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
                {isAdmin && isEditing ? (
                  <select 
                    value={selectedDay.type} 
                    onChange={(e) => handleQuickTypeChange(e.target.value)}
                    className={`journal-modal-type type-${selectedDay.type}`}
                    style={{ border: 'none', outline: 'none', cursor: 'pointer', appearance: 'auto' }}
                  >
                    <option value="entreprise">Entreprise</option>
                    <option value="ecole">École</option>
                    <option value="conges">Congés</option>
                    <option value="pont">Pont</option>
                    <option value="none">Aucun</option>
                  </select>
                ) : (
                  <span className={`journal-modal-type type-${selectedDay.type}`}>{selectedDay.type}</span>
                )}
              </div>
              <button className="btn-icon-sm" onClick={() => setSelectedDay(null)}>Fermer</button>
            </div>
            
            <div className="journal-modal-body">
              <div className="journal-task-list">
                {(entries[selectedDay.date]?.tasks || []).map(task => {
                  const chantierAssocie = chantiers.find(c => c.id === task.chantier_id);
                  return (
                    <div key={task.id} className="journal-task-card" style={editingTaskId === task.id ? { border: '1px solid var(--accent-cord)' } : {}}>
                      {isAdmin && isEditing && (
                        <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', gap: '6px' }}>
                          <button className="btn-icon-sm" onClick={() => startEditTask(task)}><Edit2 size={14} /></button>
                          <button className="btn-icon-sm delete" onClick={() => deleteTask(task.id)}><Trash2 size={14} /></button>
                        </div>
                      )}
                      <div className="journal-task-header">
                        {chantierAssocie ? (
                          <div className="journal-task-chantier"><MapPin size={12} /> Chantier : {chantierAssocie.nom}</div>
                        ) : (
                          <div className="journal-task-chantier" style={{ color: 'var(--ink-mid)' }}><Briefcase size={12} /> Tâche générale</div>
                        )}
                      </div>
                      <div className="journal-task-content">{task.content}</div>
                      
                      {task.competences && task.competences.length > 0 && (
                        <div className="journal-task-competences">
                          {task.competences.map(comp => (
                            <span key={comp} className="journal-comp-pill">{comp}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
                {(!entries[selectedDay.date]?.tasks || entries[selectedDay.date].tasks.length === 0) && (
                  <p className="profil-about-text" style={{ textAlign: 'center', padding: '2rem 0' }}>Aucune tâche enregistrée pour ce jour.</p>
                )}
              </div>

              {isAdmin && isEditing && selectedDay.type === 'entreprise' ? (
                <div className="task-editor">
                  <h4 style={{ fontFamily: 'Syne', marginBottom: '1rem', color: 'var(--ink)' }}>
                    {editingTaskId ? 'Modifier la tâche' : 'Ajouter une tâche'}
                  </h4>
                  
                  <label className="task-editor-label">Chantier concerné (optionnel)</label>
                  <select value={newTaskChantier} onChange={e => setNewTaskChantier(e.target.value)} style={{ marginBottom: '1rem' }}>
                    <option value="">-- Aucun chantier spécifique --</option>
                    {chantiers.map(c => (
                      <option key={c.id} value={c.id}>{c.nom} ({c.lieu})</option>
                    ))}
                  </select>

                  <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                    <div style={{ flex: 1 }}>
                      <label className="task-editor-label">Date (début)</label>
                      <input type="date" className="profil-edit-input" style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border-mid)', borderRadius: '8px', background: '#f9fafb' }} value={selectedDay.date} disabled />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label className="task-editor-label">Dupliquer jusqu'au (optionnel)</label>
                      <div className="custom-date-picker-container">
                        <div 
                          className="profil-edit-input" 
                          style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border-mid)', borderRadius: '8px', background: '#fff', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                          onClick={() => {
                            setShowDatePicker(!showDatePicker);
                            if (!showDatePicker) setPickerCurrentDate(new Date(selectedDay.date));
                          }}
                        >
                          <span style={{ color: newTaskEndDate ? 'var(--ink)' : 'var(--ink-muted)' }}>
                            {newTaskEndDate ? new Date(newTaskEndDate).toLocaleDateString('fr-FR') : 'Sélectionner une date...'}
                          </span>
                          <Calendar size={14} />
                        </div>

                        {showDatePicker && (
                          <div className="datepicker-dropdown">
                            <div className="datepicker-header">
                              <button className="btn-datepicker-nav" onClick={(e) => { e.stopPropagation(); setPickerCurrentDate(new Date(pickerCurrentDate.getFullYear(), pickerCurrentDate.getMonth() - 1, 1)); }}><ChevronLeft size={14} /></button>
                              <div className="datepicker-title">
                                {pickerCurrentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                              </div>
                              <button className="btn-datepicker-nav" onClick={(e) => { e.stopPropagation(); setPickerCurrentDate(new Date(pickerCurrentDate.getFullYear(), pickerCurrentDate.getMonth() + 1, 1)); }}><ChevronRight size={14} /></button>
                            </div>
                            <div className="datepicker-grid">
                              {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => (
                                <div key={i} className="datepicker-weekday">{d}</div>
                              ))}
                              {(() => {
                                const pYear = pickerCurrentDate.getFullYear();
                                const pMonth = pickerCurrentDate.getMonth();
                                const pDaysInMonth = getDaysInMonth(pYear, pMonth);
                                const pFirstDay = getFirstDayOfMonth(pYear, pMonth);
                                const cells = [];

                                for (let i = 0; i < pFirstDay; i++) {
                                  cells.push(<div key={`empty-${i}`} className="datepicker-day other-month"></div>);
                                }

                                for (let i = 1; i <= pDaysInMonth; i++) {
                                  const dStr = `${pYear}-${String(pMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
                                  const dayDate = new Date(pYear, pMonth, i);
                                  const dayOfWeek = dayDate.getDay();
                                  const feriesFlex = getPaques(pYear);
                                  const feriesList = [...getFeries(pYear), feriesFlex.lundi, feriesFlex.ascension, feriesFlex.pentecote];
                                  
                                  let type = 'none';
                                  if (dayOfWeek === 0 || dayOfWeek === 6) type = 'weekend';
                                  else if (feriesList.includes(dStr)) type = 'ferie';
                                  else {
                                    const matchingPeriods = periods.filter(p => isDateInPeriod(dStr, p.start, p.end));
                                    if (matchingPeriods.length > 0) type = matchingPeriods[matchingPeriods.length - 1].type;
                                  }

                                  const isDisabled = (type !== 'entreprise') || new Date(dStr) <= new Date(selectedDay.date);
                                  const isSelected = newTaskEndDate === dStr;

                                  cells.push(
                                    <div 
                                      key={i} 
                                      className={`datepicker-day ${isDisabled ? 'disabled' : ''} ${isSelected ? 'selected' : ''}`}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (!isDisabled) {
                                          setNewTaskEndDate(dStr);
                                          setShowDatePicker(false);
                                        }
                                      }}
                                    >
                                      {i}
                                    </div>
                                  );
                                }
                                return cells;
                              })()}
                            </div>
                            <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'flex-end' }}>
                               <button className="btn-secondary" style={{ fontSize: '10px', padding: '4px 8px' }} onClick={(e) => { e.stopPropagation(); setNewTaskEndDate(''); setShowDatePicker(false); }}>Effacer</button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <label className="task-editor-label">Description de la tâche</label>
                  <textarea 
                    placeholder="Qu'avez-vous fait aujourd'hui ? Détaillez vos actions..."
                    value={newTaskContent}
                    onChange={e => setNewTaskContent(e.target.value)}
                  />

                  <label className="task-editor-label">Compétences mobilisées</label>
                  <div className="comp-groups-container">
                    {COMPETENCES_GROUPS.map(group => (
                      <div key={group.id} className="comp-group">
                        <div className="comp-group-title">{group.name}</div>
                        <div className="comp-selector">
                          {group.items.map(comp => (
                            <label key={comp}>
                              <input 
                                type="checkbox" 
                                checked={newTaskCompetences.includes(comp)}
                                onChange={() => toggleCompetence(comp)}
                              />
                              {comp}
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                    {editingTaskId && (
                      <button className="btn-secondary" onClick={cancelEditTask}>
                        Annuler
                      </button>
                    )}
                    <button className="btn-primary" onClick={saveTask} disabled={!newTaskContent.trim()}>
                      {editingTaskId ? 'Enregistrer les modifications' : 'Ajouter la tâche'}
                    </button>
                  </div>
                </div>
              ) : isEditing && (
                <div className="non-working-message" style={{ textAlign: 'center', padding: '2rem', background: 'var(--bg-stripe)', borderRadius: '12px', border: '1px dashed var(--border-mid)', marginTop: '1rem' }}>
                  <p style={{ color: 'var(--ink-muted)', fontSize: '14px' }}>
                    Vous ne pouvez pas ajouter de tâches sur un jour de <strong>{selectedDay.type === 'ecole' ? 'cours' : selectedDay.type}</strong>.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
