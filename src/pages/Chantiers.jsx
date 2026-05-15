import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, LayersControl, Polyline, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
const { BaseLayer } = LayersControl;
import { supabase } from '../lib/supabase';
import { 
  Building2, 
  MapPin, 
  ArrowLeft, 
  CheckSquare, 
  Square, 
  Camera,
  Plus,
  Trash2,
  FileText,
  Edit,
  Save,
  X,
  FileUp,
  Maximize,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Navigation,
  Route,
  Clock,
  Award,
  List,
  Star,
  CheckCircle,
  BookOpen,
  Tag,
  User
} from 'lucide-react';
import './Chantiers.css';

// Data structure for competencies
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

const CHECKLISTS = {
  documentsEtude: {
    title: "Liste documents",
    items: [
      "Règlement de la Consultation (RC)", "Acte d’Engagement (AE)", "Décomposition du Prix Global et Forfaitaire (DPGF)",
      "Bordereau des Prix Unitaires pour travaux annexes (BPU)", "Bilan prévisionnel d’exploitation (BPE)",
      "Cahier des Clauses Administratives Particulières (CCAP)", "Cahier des Garanties Souscrites (CGS)",
      "Cahier des Clauses Techniques Particulières (CCTP)", "Plan Général de Coordination (PGC)",
      "Plan de Respect de l’Environnement (PRE)", "Déclaration de Travaux (DT)", "Dossier de consultation des entreprises (DCE)",
      "Planning prévisionnel", "Plan de prévention (QSE(Qualité-sécurité-environnement))", "Permis de construire"
    ]
  },
  etudesGeotechniques: {
    title: "Études géotechniques",
    items: ["G1 et G2-AVP", "G2-PRO"]
  },
  diagnostics: {
    title: "Diagnostics de l’ouvrage existant",
    items: ["Amiante", "Plomb", "HAP", "Environnemental", "Rapport Initial de Contrôle Technique (RICT)"]
  },
  plansDocuments: {
    title: "Plans",
    items: ["Plan de masse – PDF/DWG", "Plan altimétrique – PDF/DWG", "Vue en plan – PDF/DWG", "Coupes – PDF/DWG", "Plans de détails – PDF/DWG"]
  },
  planifications: {
    title: "Planifications Chantier",
    items: [
      "Avis d'ouverture de chantier (Tableau récapitulatif)", "DICT et tableau récapitulatif", "Permission de voirie ....",
      "Arrêté de circulation..", "Constat d'huissier:...", "Diagnostic amiante", "Diagnostic HAP", "Schéma(s) de pose",
      "Profils", "Métrés", "Modes opératoires / SAFE", "Budget d'exécution", "Fiche « appel en cas d'accident »",
      "Planning prévisionnel avec identification des points d'arrêt (Préparation ou Client)", "Copies des bons de commandes",
      "Plans d'éxécutions :.", "Plan d'Installation de Chantier (PIC) :"
    ]
  },
  securite: {
    title: "Sécurité et Qualité",
    items: [
      "PPSPS", "PPSPS Simplifie", "Examen d'adéquation de pelle utilisée en levage", "Plan d'Assurance Qualité",
      "Plan de Respect de l'Environnement", "Conduite à tenir en cas d'accident", "Analyse des risques particuliers du chantier",
      "Analyse du risque d'ensevelissement", "Protocole de sécurité", "Plan de compactage SETRA", "Convention utilisation des déchets inertes à des fins d'aménagement"
    ]
  }
};

const MapAutoBounds = ({ coords }) => {
  const map = useMap();
  useEffect(() => {
    if (coords && coords.length > 0) {
      const bounds = L.polyline(coords).getBounds();
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [coords, map]);
  return null;
};

const MapZoomHandler = () => {
  const map = useMap();
  useEffect(() => {
    // Enable by default but let the MapContainer prop handle the initial state
    map.scrollWheelZoom.enable();
  }, [map]);
  return null;
};


const MapRecentering = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center);
  }, [center]); // Still re-centers, but we can manage it
  return null;
};

// Modern Custom Marker Icon
const modernIcon = L.divIcon({
  className: 'modern-marker destination',
  html: `
    <div class="marker-pin"></div>
    <div class="marker-pulse"></div>
  `,
  iconSize: [30, 30],
  iconAnchor: [15, 15]
});

const modernIconStart = L.divIcon({
  className: 'modern-marker start',
  html: `
    <div class="marker-pin start"></div>
    <div class="marker-pulse start"></div>
  `,
  iconSize: [30, 30],
  iconAnchor: [15, 15]
});

const getFileExtension = (url) => {
  if (!url) return '';
  const parts = url.split('.');
  if (parts.length <= 1) return '';
  // Get extension and remove potential query params
  return parts.pop().split('?')[0].toUpperCase();
};

const formatAddress = (addr) => {
  if (!addr) return '';
  const components = [];
  if (addr.house_number) {
    components.push(addr.house_number);
  }
  if (addr.road) {
    // Clean road name if it's just the house number repeated
    if (addr.road !== addr.house_number) components.push(addr.road);
  }
  if (addr.postcode) components.push(addr.postcode);
  const city = addr.city || addr.town || addr.village || addr.municipality;
  if (city) components.push(city);
  return components.join(', ');
};

const normalizeString = (str) => {
  if (!str) return '';
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
};

const MapClickHandler = ({ onLocationSelected, isEnabled }) => {
  useMapEvents({
    click: async (e) => {
      if (!isEnabled) return;
      const { lat, lng } = e.latlng;
      // Immediate feedback: set coordinates first
      onLocationSelected([lat, lng], "Recherche de l'adresse...");
      
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`, {
          headers: { 'User-Agent': 'ChantierApp/1.0' }
        });
        const data = await res.json();
        const shortAddr = formatAddress(data.address);
        const finalAddr = `${shortAddr || data.display_name} (${lat.toFixed(6)}, ${lng.toFixed(6)})`;
        onLocationSelected([lat, lng], finalAddr);
      } catch (err) {
        console.error("Geocoding error:", err);
        onLocationSelected([lat, lng], `Coordonnées : ${lat.toFixed(6)}, ${lng.toFixed(6)}`);
      }
    }
  });

  return null;
};

const Chantiers = () => {
  const [chantiers, setChantiers] = useState([]);
  const [selectedChantier, setSelectedChantier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isAdmin, setIsAdmin] = useState(localStorage.getItem('isAdmin') === 'true');
  const [uploadingFiles, setUploadingFiles] = useState({}); // { id: true/false }
  const [chantierTasks, setChantierTasks] = useState([]);
  const [enlargedImage, setEnlargedImage] = useState(null);
  const [isMapExpanded, setIsMapExpanded] = useState(false);

  const [showMainPhotoEditor, setShowMainPhotoEditor] = useState(false);
  const [mainPhotoStyle, setMainPhotoStyle] = useState({ scale: 1, x: 0, y: 0 });
  const [isCropping, setIsCropping] = useState(false);
  const [tempStyle, setTempStyle] = useState({ scale: 1, x: 0, y: 0 });
  const [isDraggingBanner, setIsDraggingBanner] = useState(false);
  const [dragStartBanner, setDragStartBanner] = useState({ x: 0, y: 0 });

  const [startAddress, setStartAddress] = useState('');
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [lieuSuggestions, setLieuSuggestions] = useState([]);
  const [selectedStartCoords, setSelectedStartCoords] = useState(null);
  const [travelInfo, setTravelInfo] = useState(null);
  const [routeGeometry, setRouteGeometry] = useState(null);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [isUserTyping, setIsUserTyping] = useState(false);

  // Suggestions logic
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!isUserTyping || startAddress.length < 3) {
        setAddressSuggestions([]);
        return;
      }
      try {
        const normalized = normalizeString(startAddress);
        const headers = { 'User-Agent': 'ChantierApp/1.0' };
        
        // 1. Precise search
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(normalized)}&countrycodes=fr&limit=10&addressdetails=1`, { headers });
        let data = await res.json();
        
        // 2. Phonetic & Fuzzy fallback (Kraft/Krafft, René/Renée)
        if (data.length < 2) {
          let fuzzyQuery = normalized;
          if (fuzzyQuery.includes('kraft')) fuzzyQuery = fuzzyQuery.replace(/kraft/g, 'krafft');
          else if (fuzzyQuery.includes('krafft')) fuzzyQuery = fuzzyQuery.replace(/krafft/g, 'kraft');
          if (fuzzyQuery.includes('renee')) fuzzyQuery = fuzzyQuery.replace(/renee/g, 'rene');
          else if (fuzzyQuery.includes('rene')) fuzzyQuery = fuzzyQuery.replace(/rene/g, 'renee');
          
          if (fuzzyQuery !== normalized) {
            const fRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fuzzyQuery)}&countrycodes=fr&limit=10&addressdetails=1`, { headers });
            const fData = await fRes.json();
            data = [...data, ...fData];
          }
        }
        
        // 3. Keyword-only fallback (Very aggressive reduction)
        if (data.length === 0) {
          const keywords = normalized.split(/\s+/).filter(w => w.length > 2 && !['rue', 'avenue', 'place', 'allée', 'route'].includes(w));
          if (keywords.length > 1) {
            const keywordQuery = keywords.join(' ');
            const kRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(keywordQuery)}&countrycodes=fr&limit=10&addressdetails=1`, { headers });
            data = await kRes.json();
          }
        }
        
        // Unique results
        const uniqueData = Array.from(new Map(data.map(item => [item.place_id, item])).values()).slice(0, 10);
        setAddressSuggestions(uniqueData);
      } catch (error) {
        console.error("Suggestions error:", error);
      }
    };

    const timeoutId = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timeoutId);
  }, [startAddress]);

  // Suggestions d'adresses pour le chantier (lieu)
  useEffect(() => {
    const fetchLieuSuggestions = async () => {
      if (!isUserTyping || !selectedChantier?.lieu || selectedChantier.lieu.length < 3 || !isEditing) {
        setLieuSuggestions([]);
        return;
      }
      try {
        const queryClean = selectedChantier.lieu.replace(/\s*\(.*\)\s*$/, '');
        if (queryClean.length < 3) {
          setLieuSuggestions([]);
          return;
        }
        
        const normalized = normalizeString(queryClean);
        const headers = { 'User-Agent': 'ChantierApp/1.0' };
        
        // 1. Precise search
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(normalized)}&countrycodes=fr&limit=10&addressdetails=1`, { headers });
        let data = await res.json();
        
        // 2. Phonetic & Fuzzy fallback
        if (data.length < 2) {
          let fuzzyQuery = normalized;
          if (fuzzyQuery.includes('kraft')) fuzzyQuery = fuzzyQuery.replace(/kraft/g, 'krafft');
          else if (fuzzyQuery.includes('krafft')) fuzzyQuery = fuzzyQuery.replace(/krafft/g, 'kraft');
          if (fuzzyQuery.includes('renee')) fuzzyQuery = fuzzyQuery.replace(/renee/g, 'rene');
          else if (fuzzyQuery.includes('rene')) fuzzyQuery = fuzzyQuery.replace(/rene/g, 'renee');
          
          if (fuzzyQuery !== normalized) {
            const fRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fuzzyQuery)}&countrycodes=fr&limit=10&addressdetails=1`, { headers });
            const fData = await fRes.json();
            data = [...data, ...fData];
          }
        }
        
        // 3. Keyword-only fallback (Very aggressive)
        if (data.length === 0) {
          const keywords = normalized.split(/\s+/).filter(w => w.length > 2 && !['rue', 'avenue', 'place', 'allée', 'route'].includes(w));
          if (keywords.length > 1) {
            const keywordQuery = keywords.join(' ');
            const kRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(keywordQuery)}&countrycodes=fr&limit=10&addressdetails=1`, { headers });
            data = await kRes.json();
          }
        }
        
        // Unique results
        const uniqueData = Array.from(new Map(data.map(item => [item.place_id, item])).values()).slice(0, 10);
        setLieuSuggestions(uniqueData);
      } catch (err) { console.error("Lieu suggestions error:", err); }
    };
    const timer = setTimeout(fetchLieuSuggestions, 400);
    return () => clearTimeout(timer);
  }, [selectedChantier?.lieu, isEditing]);

  const selectStartSuggestion = (s) => {
    const shortAddr = formatAddress(s.address);
    setStartAddress(shortAddr || s.display_name);
    setSelectedStartCoords([parseFloat(s.lat), parseFloat(s.lon)]);
    setAddressSuggestions([]);
  };

  const selectLieuSuggestion = (s) => {
    const shortAddr = formatAddress(s.address);
    const coords = [parseFloat(s.lat), parseFloat(s.lon)];
    const finalAddr = `${shortAddr || s.display_name} (${coords[0].toFixed(6)}, ${coords[1].toFixed(6)})`;
    handleUpdateSelected('lieu', finalAddr);
    handleUpdateSelected('coordinates', coords);
    setLieuSuggestions([]);
  };

  // Reset selected coords when typing manually
  useEffect(() => {
    if (selectedStartCoords) {
      // If the address in input doesn't contain the core of the selected address, clear it
      // This is a bit complex to do perfectly, so we'll just clear if it changes significantly
    }
  }, [startAddress]);

  const selectSuggestion = (s) => {
    const shortAddr = formatAddress(s.address);
    const coords = [parseFloat(s.lat), parseFloat(s.lon)];
    const finalAddr = `${shortAddr || s.display_name} (${coords[0].toFixed(6)}, ${coords[1].toFixed(6)})`;
    setStartAddress(finalAddr);
    setSelectedStartCoords(coords);
    setAddressSuggestions([]);
  };

  const geocodeAddress = async () => {
    if (!selectedChantier?.lieu) return;
    setIsGeocoding(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(selectedChantier.lieu)}`, {
        headers: { 'User-Agent': 'ChantierApp/1.0' }
      });
      const data = await res.json();
      if (data && data.length > 0) {
        const newCoords = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
        const addr = data[0].display_name;
        handleUpdateSelected('coordinates', newCoords);
        handleUpdateSelected('lieu', `${addr} (${newCoords[0].toFixed(6)}, ${newCoords[1].toFixed(6)})`);
      } else {
        alert("Adresse non trouvée sur la carte.");
      }
    } catch (error) {
      console.error("Geocoding error:", error);
    } finally {
      setIsGeocoding(false);
    }
  };

  const resetItinerary = () => {
    setStartAddress('');
    setAddressSuggestions([]);
    setSelectedStartCoords(null);
    setTravelInfo(null);
    setRouteGeometry(null);
  };

  const calculateRoute = async () => {
    if (!startAddress || !selectedChantier.coordinates) return;
    setIsCalculatingRoute(true);
    setTravelInfo(null);
    setRouteGeometry(null);
    
    try {
      let startLat, startLng;

      // 1. Get coordinates (from selection or geocoding)
      if (selectedStartCoords) {
        [startLat, startLng] = selectedStartCoords;
      } else {
        // Try searching with country code and a bit more flexibility
        const normalized = normalizeString(startAddress);
        const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(normalized)}&limit=1&countrycodes=fr`, {
          headers: { 'User-Agent': 'ChantierApp/1.0' }
        });
        const geoData = await geoRes.json();
        if (geoData && geoData.length > 0) {
          startLat = geoData[0].lat;
          startLng = geoData[0].lon;
        } else {
          // Fuzzy 1: Try swapping common gendered names (René/Renée)
          let fuzzyQuery = normalized.replace(/renee/g, 'rene');
          if (fuzzyQuery === normalized) fuzzyQuery = normalized.replace(/rene/g, 'renee');
          
          let fuzzyRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fuzzyQuery)}&limit=1&countrycodes=fr`, {
            headers: { 'User-Agent': 'ChantierApp/1.0' }
          });
          let fuzzyData = await fuzzyRes.json();
          
          if (fuzzyData && fuzzyData.length > 0) {
            startLat = fuzzyData[0].lat;
            startLng = fuzzyData[0].lon;
          } else {
            // Fuzzy 2: Remove the street number and search for street + city
            const parts = normalized.split(' ');
            const withoutNumber = parts.filter(p => isNaN(p)).join(' ');
            const finalRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(withoutNumber)}&limit=1&countrycodes=fr`, {
              headers: { 'User-Agent': 'ChantierApp/1.0' }
            });
            const finalData = await finalRes.json();
            if (finalData && finalData.length > 0) {
              startLat = finalData[0].lat;
              startLng = finalData[0].lon;
            }
          }
        }
      }

      if (startLat && startLng) {
        const [endLat, endLng] = selectedChantier.coordinates;
        
        // 2. Routing with geometry
        const routeRes = await fetch(`http://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`);
        const routeData = await routeRes.json();
        
        if (routeData.routes && routeData.routes.length > 0) {
          const route = routeData.routes[0];
          setTravelInfo({
            distance: (route.distance / 1000).toFixed(1), // km
            duration: Math.round(route.duration / 60), // minutes
            startCoords: [parseFloat(startLat), parseFloat(startLng)]
          });
          // OSRM returns coordinates as [lng, lat], Leaflet needs [lat, lng]
          const coords = route.geometry.coordinates.map(c => [c[1], c[0]]);
          setRouteGeometry(coords);
        } else {
          alert("Impossible de calculer l'itinéraire.");
        }
      } else {
        alert("Adresse de départ non trouvée.");
      }
    } catch (error) {
      console.error("Routing error:", error);
      alert("Erreur lors du calcul de l'itinéraire.");
    } finally {
      setIsCalculatingRoute(false);
    }
  };

  useEffect(() => {
    async function fetchTasks() {
      if (!selectedChantier?.id) return;
      // Filter directly in Supabase for better performance
      const { data, error } = await supabase
        .from('journal_entries')
        .select('*');
      
      if (error) console.error("Error fetching journal entries:", error);

      if (data) {
        const filteredTasks = [];
        data.forEach(entry => {
          let tasksArr = entry.tasks;
          if (typeof tasksArr === 'string') {
            try { tasksArr = JSON.parse(tasksArr); } catch(e) { tasksArr = []; }
          }
          if (!Array.isArray(tasksArr)) tasksArr = [];

          tasksArr.forEach(t => {
            if (t && String(t.chantier_id || '') === String(selectedChantier.id)) {
              filteredTasks.push({ ...t, date: entry.date });
            }
          });
        });
        filteredTasks.sort((a, b) => new Date(b.date) - new Date(a.date));
        setChantierTasks(filteredTasks);
      }



    }
    fetchTasks();
  }, [selectedChantier?.id]);


  const groupedTasks = React.useMemo(() => {
    if (!chantierTasks || chantierTasks.length === 0) return [];
    
    const groupsMap = new Map();

    chantierTasks.forEach(task => {
      const taskKey = `${task.content}-${(task.competences || []).sort().join(',')}`;
      if (!groupsMap.has(taskKey)) {
        groupsMap.set(taskKey, {
          content: task.content,
          competences: task.competences,
          dates: [new Date(task.date)]
        });
      } else {
        groupsMap.get(taskKey).dates.push(new Date(task.date));
      }
    });

    return Array.from(groupsMap.values()).map(group => {
      group.dates.sort((a, b) => a - b);
      const start = group.dates[0];
      const end = group.dates[group.dates.length - 1];
      return {
        ...group,
        startDate: start,
        endDate: end,
        displayDate: start.getTime() === end.getTime() 
          ? start.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
          : `Du ${start.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })} au ${end.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}`
      };
    }).sort((a, b) => b.endDate - a.endDate);
  }, [chantierTasks]);

  useEffect(() => {
    async function fetchChantiers() {
      setLoading(true);
      const { data, error } = await supabase
        .from('chantiers')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching chantiers:', error);
      } else {
        setChantiers(data || []);
      }
      setLoading(false);
    }
    fetchChantiers();
  }, []);

  const handleUpdateSelected = (field, value) => {
    setSelectedChantier(prev => {
      if (!prev) return prev;
      return { ...prev, [field]: value };
    });
  };

  const handleUpdateNested = (category, key, value) => {
    setSelectedChantier(prev => ({
      ...prev,
      [category]: {
        ...(prev[category] || {}),
        [key]: value
      }
    }));
  };

  const toggleCompetence = (compId) => {
    if (!isEditing) return;
    setSelectedChantier(prev => {
      const current = prev.competencesMobilisees || [];
      const updated = current.includes(compId)
        ? current.filter(id => id !== compId)
        : [...current, compId];
      return { ...prev, competencesMobilisees: updated };
    });
  };

  // Illustrations
  const addIllustration = () => {
    const newIll = { id: `ill_${Date.now()}`, url: '', titre: 'Nouvelle image', description: '' };
    handleUpdateSelected('illustrations', [...(selectedChantier.illustrations || []), newIll]);
  };

  const updateIllustration = (id, field, value) => {
    const updated = selectedChantier.illustrations.map(ill => ill.id === id ? { ...ill, [field]: value } : ill);
    handleUpdateSelected('illustrations', updated);
  };

  const removeIllustration = (id) => {
    const updated = selectedChantier.illustrations.filter(ill => ill.id !== id);
    handleUpdateSelected('illustrations', updated);
  };

  // Fichiers Joints
  const addFichier = () => {
    const newFichier = { id: `file_${Date.now()}`, url: '', titre: 'Nouveau fichier', description: '' };
    handleUpdateSelected('fichiersJoints', [...(selectedChantier.fichiersJoints || []), newFichier]);
  };

  const updateFichier = (id, field, value) => {
    const updated = (selectedChantier.fichiersJoints || []).map(f => f.id === id ? { ...f, [field]: value } : f);
    handleUpdateSelected('fichiersJoints', updated);
  };

  const removeFichier = (id) => {
    const updated = (selectedChantier.fichiersJoints || []).filter(f => f.id !== id);
    handleUpdateSelected('fichiersJoints', updated);
  };

  const handleUpload = async (e, type, id) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileId = id || type; // unique key for loading state
    setUploadingFiles(prev => ({ ...prev, [fileId]: true }));
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.floor(Math.random() * 1000)}.${fileExt}`;
      const filePath = `${selectedChantier.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('chantier-assets')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('chantier-assets')
        .getPublicUrl(filePath);

      if (data?.publicUrl) {
        if (type === 'illustration') {
          updateIllustration(id, 'url', data.publicUrl);
        } else if (type === 'fichier') {
          updateFichier(id, 'url', data.publicUrl);
        } else if (type === 'main') {
          handleUpdateSelected('photo_principale', data.publicUrl);
          setMainPhotoStyle({ scale: 1, x: 0, y: 0 });
        }
      }
    } catch (error) {
      console.error('Error uploading:', error);
      alert('Erreur lors du téléversement : ' + error.message);
    } finally {
      setUploadingFiles(prev => ({ ...prev, [fileId]: false }));
    }
  };

  // Documents spécifiques
  const addDocSpecifique = () => {
    handleUpdateSelected('documentsSpecifiques', [...(selectedChantier.documentsSpecifiques || []), "Nouveau document"]);
  };

  const updateDocSpecifique = (index, value) => {
    const updated = [...(selectedChantier.documentsSpecifiques || [])];
    updated[index] = value;
    handleUpdateSelected('documentsSpecifiques', updated);
  };

  const removeDocSpecifique = (index) => {
    const updated = (selectedChantier.documentsSpecifiques || []).filter((_, i) => i !== index);
    handleUpdateSelected('documentsSpecifiques', updated);
  };


  const handleUpdateCoordinates = (index, value) => {
    const newCoords = [...(selectedChantier.coordinates || [48.183, 5.897])];
    newCoords[index] = parseFloat(value) || 0;
    handleUpdateSelected('coordinates', newCoords);
  };

  const handleDelete = async () => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce chantier ?")) return;
    
    const { error } = await supabase.from('chantiers').delete().eq('id', selectedChantier.id);
      
    if (error) {
      console.error('Error deleting chantier:', error);
      alert('Erreur lors de la suppression');
    } else {
      setChantiers(prev => prev.filter(c => c.id !== selectedChantier.id));
      setSelectedChantier(null);
    }
  };

  const handleBack = () => {
    if (isEditing) {
      if (!window.confirm("Vos modifications non enregistrées seront perdues. Quitter ?")) return;
    }
    setSelectedChantier(null);
    window.scrollTo(0, 0);
  };

  const handleSave = async () => {
    const payload = {
      status: selectedChantier.status,
      nom: selectedChantier.nom,
      lieu: selectedChantier.lieu,
      coordinates: selectedChantier.coordinates,
      typeProjet: selectedChantier.typeProjet,
      marche: selectedChantier.marche,
      maitreOeuvre: selectedChantier.maitreOeuvre,
      maitreOuvrage: selectedChantier.maitreOuvrage,
      csps: selectedChantier.csps,
      controleTechnique: selectedChantier.controleTechnique,
      descriptionProjet: selectedChantier.descriptionProjet,
      illustrations: selectedChantier.illustrations,
      documentsEtude: selectedChantier.documentsEtude,
      etudesGeotechniques: selectedChantier.etudesGeotechniques,
      diagnostics: selectedChantier.diagnostics,
      plansDocuments: selectedChantier.plansDocuments,
      planifications: selectedChantier.planifications,
      securite: selectedChantier.securite,
      roleApprenti: selectedChantier.roleApprenti,
      travauxEffectues: selectedChantier.travauxEffectues,
      competencesMobilisees: selectedChantier.competencesMobilisees,
      conducteurTravaux: selectedChantier.conducteurTravaux,
      fichiersJoints: selectedChantier.fichiersJoints,
      documentsSpecifiques: selectedChantier.documentsSpecifiques,
      datesChantier: selectedChantier.datesChantier,
      photo_principale: selectedChantier.photo_principale,
      photo_principale_style: mainPhotoStyle
    };

    const { error } = await supabase.from('chantiers').update(payload).eq('id', selectedChantier.id);

    if (error) {
      console.error('Error saving chantier:', error);
      alert('Erreur lors de la sauvegarde : ' + (error.message || 'Erreur inconnue'));
    } else {
      setChantiers(prev => prev.map(c => c.id === selectedChantier.id ? selectedChantier : c));
      setIsEditing(false); // Switch back to read mode
    }
  };

  const handleAddNew = async () => {
    const newChantier = {
      status: 'ao_en_cours',
      nom: 'Nouveau chantier',
      lieu: '',
      typeProjet: '',
      conducteurTravaux: '',
      marche: '',
      maitreOeuvre: '',
      maitreOuvrage: '',
      csps: '',
      controleTechnique: '',
      descriptionProjet: { projet: '', existant: '' },
      illustrations: [],
      documentsEtude: {},
      etudesGeotechniques: {},
      diagnostics: {},
      plansDocuments: {},
      planifications: {},
      securite: {},
      roleApprenti: '',
      travauxEffectues: '',
      competencesMobilisees: [],
      fichiersJoints: [],
      documentsSpecifiques: [],
      datesChantier: { appelOffre: '', gagne: '', debut: '', fin: '' },
      photo_principale: ''
    };

    const { data, error } = await supabase.from('chantiers').insert([newChantier]).select();

    if (error) {
      console.error('Error creating chantier:', error);
      alert('Erreur de création de chantier');
    } else if (data && data.length > 0) {
      setChantiers([data[0], ...chantiers]);
      setSelectedChantier(data[0]);
      setIsEditing(true); // Open directly in edit mode
      window.scrollTo(0, 0);
    }
  };

  useEffect(() => {
    const handleAdminChange = () => {
      setIsAdmin(localStorage.getItem('isAdmin') === 'true');
    };
    window.addEventListener('adminModeChanged', handleAdminChange);
    return () => window.removeEventListener('adminModeChanged', handleAdminChange);
  }, []);

  useEffect(() => {
    if (isMapExpanded) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isMapExpanded]);


  const openChantier = (chantier) => {
    setSelectedChantier(chantier);
    setIsEditing(false);
    window.scrollTo(0, 0);
    if (chantier.photo_principale_style) setMainPhotoStyle(chantier.photo_principale_style);
    else setMainPhotoStyle({ scale: 1, x: 0, y: 0 });
  };

  // VIEW RENDERING
  if (selectedChantier) {
    const { 
      nom, lieu, coordinates, typeProjet, conducteurTravaux, marche, maitreOeuvre, maitreOuvrage, csps, controleTechnique, 
      descriptionProjet, illustrations, fichiersJoints, documentsSpecifiques, roleApprenti, 
      travauxEffectues, competencesMobilisees, datesChantier, photo_principale,
      documentsEtude, etudesGeotechniques, diagnostics, plansDocuments, planifications, securite
    } = selectedChantier;
    
    // Normalize old statuses
    let currentStatus = selectedChantier.status;
    if (currentStatus === 'appel_offre') currentStatus = 'ao_en_cours';
    if (currentStatus === 'en_cours') currentStatus = 'chantier_en_cours';
    if (currentStatus === 'perdu') currentStatus = 'ao_perdu';
    
    const isAppelOffre = currentStatus.startsWith('ao_');
    const mainPhase = isAppelOffre ? 'appel_offre' : 'chantier';
    const isPerdu = currentStatus === 'ao_perdu';

    const galleryImages = [
      ...(photo_principale ? [{ url: photo_principale, titre: "Photo Principale", description: nom, id: 'main' }] : []),
      ...(illustrations || [])
    ].filter(img => img.url);

    const handleNextImage = (e) => {
      e?.stopPropagation();
      const currentIndex = galleryImages.findIndex(img => img.url === enlargedImage.url);
      const nextIndex = (currentIndex + 1) % galleryImages.length;
      setEnlargedImage(galleryImages[nextIndex]);
    };

    const handlePrevImage = (e) => {
      e?.stopPropagation();
      const currentIndex = galleryImages.findIndex(img => img.url === enlargedImage.url);
      const prevIndex = (currentIndex - 1 + galleryImages.length) % galleryImages.length;
      setEnlargedImage(galleryImages[prevIndex]);
    };

    const handleMainPhaseChange = (e) => {
      const newPhase = e.target.value;
      if (newPhase === 'appel_offre') handleUpdateSelected('status', 'ao_en_cours');
      else handleUpdateSelected('status', 'chantier_preparation');
    };

    return (
      <>
        <div className={`page content chantiers-detail-page ${isEditing ? 'edit-mode' : 'read-mode'}`}>
          <div className="chantiers-container">
            
            {/* BARRE DE NAVIGATION */}
            <div className="detail-top-bar">
              <button className="btn-ghost back-btn" onClick={handleBack}>
                <ArrowLeft size={16} /> Retour
              </button>
              {isAdmin && (
                !isEditing ? (
                  <button className="btn-primary" onClick={() => setIsEditing(true)}>
                    <Edit size={16} /> Modifier ce chantier
                  </button>
                ) : (
                  <div className="edit-actions">
                    <button className="btn-ghost btn-delete" onClick={handleDelete}>
                      <Trash2 size={16} />
                    </button>
                    <button className="btn-ghost" onClick={() => setIsEditing(false)}>
                      Annuler
                    </button>
                    <button className="btn-primary" onClick={handleSave}>
                      <Save size={16} /> Enregistrer
                    </button>
                  </div>
                )
              )}
            </div>

            {/* EN-TÊTE PRINCIPAL SPLIT (TITRE GAUCHE / PHOTO DROITE) */}
            <div className="chantier-header-split">
              <div className="header-split-left">
                <div className="detail-header-info" style={{ border: 'none', padding: 0, margin: 0 }}>
                  {isEditing ? (
                    <input 
                      type="text" className="chantier-title-input" 
                      value={nom} onChange={(e) => handleUpdateSelected('nom', e.target.value)} 
                      placeholder="Nom du chantier"
                      style={{ width: '100%', fontSize: '32px', fontFamily: 'Playfair Display', fontWeight: 900, border: 'none', background: 'transparent', borderBottom: '1px solid var(--border-mid)' }}
                    />
                  ) : (
                    <h1 className="chantier-title" style={{ fontSize: 'clamp(24px, 3vw, 36px)' }}>{nom}</h1>
                  )}

                  <div className="chantier-subtitle" style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '8px', minHeight: '32px' }}>
                    <MapPin size={14} style={{ flexShrink: 0 }} /> 
                    {isEditing ? (
                      <div style={{ flex: 1, position: 'relative' }}>
                        <input 
                          value={lieu} 
                          onChange={(e) => {
                            handleUpdateSelected('lieu', e.target.value);
                            setIsUserTyping(true);
                          }} 
                          placeholder="Adresse du chantier" 
                          style={{ border: 'none', background: 'transparent', fontSize: '13px', width: '100%', borderBottom: '1px solid var(--border-mid)', padding: '4px 0' }} 
                        />

                        {isUserTyping && lieuSuggestions.length > 0 && (
                          <div className="address-suggestions-dropdown" style={{ top: '100%', left: 0, right: 0, zIndex: 10, background: 'white', border: '1px solid var(--border-mid)', borderRadius: '12px', marginTop: '5px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                            {lieuSuggestions.map((s, i) => (
                              <div key={i} className="suggestion-item" onClick={() => { selectLieuSuggestion(s); setIsUserTyping(false); }} style={{ padding: '10px 15px', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', borderBottom: '1px solid var(--border)' }}>
                                <MapPin size={12} style={{ opacity: 0.5, flexShrink: 0 }} />
                                <span style={{ fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {formatAddress(s.address) || s.display_name}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                    ) : (
                      <span style={{ fontSize: '13px' }}>{lieu || "Lieu non renseigné"}</span>
                    )}
                  </div>


                  <div className="chantier-meta-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1.5rem' }}>
                    <div className="meta-item" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--ink-dim)' }}>
                      <Tag size={14} />
                      {isEditing ? (
                        <input value={typeProjet} onChange={(e) => handleUpdateSelected('typeProjet', e.target.value)} placeholder="Type de projet" style={{ border: 'none', background: 'transparent', borderBottom: '1px solid #eee' }} />
                      ) : (
                        <span>{typeProjet || "Type non défini"}</span>
                      )}
                    </div>
                    <div className="meta-item" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--ink-dim)' }}>
                      <User size={14} />
                      {isEditing ? (
                        <input value={conducteurTravaux} onChange={(e) => handleUpdateSelected('conducteurTravaux', e.target.value)} placeholder="Conducteur de travaux" style={{ border: 'none', background: 'transparent', borderBottom: '1px solid #eee' }} />
                      ) : (
                        <span>{conducteurTravaux || "Conducteur non assigné"}</span>
                      )}
                    </div>
                  </div>

                  <div style={{ marginTop: '1.5rem', display: 'flex', gap: '10px', alignItems: 'center' }}>
                    {isEditing ? (
                      <>
                        <select 
                          value={mainPhase} 
                          onChange={handleMainPhaseChange}
                          style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--border-mid)', fontSize: '12px', background: 'white' }}
                        >
                          <option value="appel_offre">Phase : Appel d'offre</option>
                          <option value="chantier">Phase : Chantier</option>
                        </select>
                        <select 
                          value={currentStatus} 
                          onChange={(e) => handleUpdateSelected('status', e.target.value)}
                          style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--border-mid)', fontSize: '12px', background: 'white' }}
                        >
                          {isAppelOffre ? (
                            <>
                              <option value="ao_en_cours">AO - En cours</option>
                              <option value="ao_gagne">AO - Gagné</option>
                              <option value="ao_perdu">AO - Perdu</option>
                            </>
                          ) : (
                            <>
                              <option value="chantier_preparation">Chantier - Préparation</option>
                              <option value="chantier_en_cours">Chantier - En cours</option>
                              <option value="chantier_termine">Chantier - Terminé</option>
                            </>
                          )}
                        </select>
                      </>
                    ) : (
                      <span className={`status-badge ${currentStatus}`}>
                        {currentStatus === 'ao_en_cours' && "Appel d'offre en cours"}
                        {currentStatus === 'ao_gagne' && "Appel d'offre gagné"}
                        {currentStatus === 'ao_perdu' && "Appel d'offre perdu"}
                        {currentStatus === 'chantier_preparation' && "Préparation de chantier"}
                        {currentStatus === 'chantier_en_cours' && "Chantier en cours"}
                        {currentStatus === 'chantier_termine' && "Chantier terminé"}
                      </span>
                    )}
                  </div>

                </div>
              </div>

              <div className="header-split-right">
                {photo_principale ? (
                  <div className="chantier-hero-photo" 
                       style={{ margin: 0, height: '240px', width: '100%', cursor: isEditing ? 'default' : 'zoom-in', position: 'relative' }}>
                    <img 
                      src={photo_principale} 
                      alt={nom} 
                      style={{
                        transform: `scale(${mainPhotoStyle.scale}) translate(${mainPhotoStyle.x}px, ${mainPhotoStyle.y}px)`,
                        transformOrigin: 'center'
                      }}
                      onClick={() => !isEditing && setEnlargedImage({ url: photo_principale, titre: nom })}
                    />
                    {isEditing && (
                      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', zIndex: 5 }}>
                         <label className="btn-primary" style={{ padding: '8px 16px', fontSize: '11px', cursor: 'pointer' }}>
                           Changer
                           <input type="file" hidden onChange={(e) => handleUpload(e, 'main')} />
                         </label>
                         <button className="btn-primary" onClick={() => { setTempStyle(mainPhotoStyle); setIsCropping(true); }} style={{ padding: '8px 16px', fontSize: '11px', background: 'white', color: 'black' }}>
                           Recadrer
                         </button>
                         <button className="btn-ghost" onClick={() => handleUpdateSelected('photo_principale', null)} style={{ background: 'white', border: 'none', padding: '8px' }}>
                           <Trash2 size={14} color="#dc2626" />
                         </button>
                      </div>
                    )}

                  </div>
                ) : (
                  isEditing && (
                    <div className="chantier-hero-photo no-photo-placeholder" style={{ margin: 0, height: '240px', width: '100%' }}>
                      <label style={{ cursor: 'pointer', textAlign: 'center' }}>
                        <div style={{ fontSize: '11px', color: 'var(--ink-muted)', marginBottom: '8px' }}>Ajouter une photo principale</div>
                        <div className="btn-primary" style={{ padding: '8px 16px', fontSize: '11px' }}>Choisir un fichier</div>
                        <input type="file" hidden onChange={(e) => handleUpload(e, 'main')} />
                      </label>
                    </div>
                  )
                )}
              </div>

            </div>

            <div style={{ height: '1px', background: 'var(--border-mid)', margin: '2rem 0' }}></div>

            {/* CARTE DE LOCALISATION & ITINÉRAIRE */}
            <div className="chantier-map-section" style={{ marginTop: '2rem' }}>
              <div className="map-preview-small" onClick={() => !isEditing && setIsMapExpanded(true)}>
                <MapContainer 
                  center={coordinates || [48.8566, 2.3522]} 
                  zoom={13} 
                  scrollWheelZoom={true} 
                  dragging={true} 
                  zoomControl={true} 
                  style={{ height: '100%', width: '100%' }}
                >
                  <MapZoomHandler />
                  <MapClickHandler isEnabled={isEditing} onLocationSelected={(coords, addr) => {
                    handleUpdateSelected('coordinates', coords);
                    handleUpdateSelected('lieu', addr);
                    setIsUserTyping(false);
                  }} />
                  <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" />
                  {coordinates && <Marker position={coordinates} icon={modernIcon} />}
                </MapContainer>
                
                {!isEditing && (
                  <div className="map-preview-overlay">
                    <div className="btn-primary" style={{ borderRadius: '25px', padding: '12px 24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Maximize2 size={18} /> Agrandir la carte & Itinéraire
                    </div>
                  </div>
                )}
              </div>


            </div>


            {/* GRILLE TECHNIQUE (STYLE PROFIL) */}
            <div className="chantier-detail-grid">
              
              <div className="chantier-col-left" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div className="chantier-section-card">
                  <h3 className="section-card-title"><Clock size={18} /> Chronologie</h3>
                  <div className="data-table">
                    {isEditing ? (
                      <>
                        <div className="data-row">
                          <span className="data-label">Appel d'offre</span>
                          <input 
                            type="date" 
                            value={datesChantier?.appelOffre || ''} 
                            onChange={(e) => handleUpdateNested('datesChantier', 'appelOffre', e.target.value)}
                            style={{ border: 'none', background: 'transparent', textAlign: 'right', borderBottom: '1px solid #eee', fontSize: '12px', width: '120px' }}
                          />
                        </div>
                        <div className="data-row">
                          <span className="data-label">Attribué le</span>
                          <input 
                            type="date" 
                            value={datesChantier?.gagne || ''} 
                            onChange={(e) => handleUpdateNested('datesChantier', 'gagne', e.target.value)}
                            style={{ border: 'none', background: 'transparent', textAlign: 'right', borderBottom: '1px solid #eee', fontSize: '12px', width: '120px' }}
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="data-row">
                          <span className="data-label">Appel d'offre</span>
                          <span className="data-value">{datesChantier?.appelOffre ? new Date(datesChantier.appelOffre).toLocaleDateString('fr-FR') : 'Non renseigné'}</span>
                        </div>
                        <div className="data-row">
                          <span className="data-label">Attribué le</span>
                          <span className="data-value">{datesChantier?.gagne ? new Date(datesChantier.gagne).toLocaleDateString('fr-FR') : '-'}</span>
                        </div>
                      </>
                    )}

                    {!isPerdu && (
                      <div className="data-table">
                        {isEditing ? (
                          <>
                            <div className="data-row">
                              <span className="data-label">Début</span>
                              <input 
                                type="date" 
                                value={datesChantier?.debut || ''} 
                                onChange={(e) => handleUpdateNested('datesChantier', 'debut', e.target.value)}
                                style={{ border: 'none', background: 'transparent', textAlign: 'right', borderBottom: '1px solid #eee', fontSize: '12px', width: '120px' }}
                              />
                            </div>
                            <div className="data-row">
                              <span className="data-label">Fin</span>
                              <input 
                                type="date" 
                                value={datesChantier?.fin || ''} 
                                onChange={(e) => handleUpdateNested('datesChantier', 'fin', e.target.value)}
                                style={{ border: 'none', background: 'transparent', textAlign: 'right', borderBottom: '1px solid #eee', fontSize: '12px', width: '120px' }}
                              />
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="data-row">
                              <span className="data-label">Début</span>
                              <span className="data-value">{datesChantier?.debut ? new Date(datesChantier.debut).toLocaleDateString('fr-FR') : '-'}</span>
                            </div>
                            <div className="data-row">
                              <span className="data-label">Fin</span>
                              <span className="data-value">{datesChantier?.fin ? new Date(datesChantier.fin).toLocaleDateString('fr-FR') : '-'}</span>
                            </div>
                          </>
                        )}
                      </div>
                    )}

                  </div>
                </div>

                <div className="chantier-section-card">
                  <h3 className="section-card-title"><Building2 size={18} /> Intervenants</h3>
                  <div className="data-table">
                    {[
                      { label: 'MOA', key: 'maitreOuvrage', value: maitreOuvrage },
                      { label: 'MOE', key: 'maitreOeuvre', value: maitreOeuvre },
                      { label: 'CSPS', key: 'csps', value: csps },
                      { label: 'CT', key: 'controleTechnique', value: controleTechnique },
                      { label: 'Marché', key: 'marche', value: marche },
                    ].map(field => (
                      <div key={field.key} className="data-row">
                        <span className="data-label">{field.label}</span>
                        {isEditing ? (
                          <input 
                            value={field.value || ''} 
                            onChange={(e) => handleUpdateSelected(field.key, e.target.value)} 
                            style={{ border: 'none', background: 'transparent', textAlign: 'right', borderBottom: '1px solid #eee', fontSize: '12px', width: '120px' }}
                          />
                        ) : (
                          <span className="data-value">{field.value || '-'}</span>
                        )}
                      </div>
                    ))}
                  </div>

                </div>
              </div>

              <div className="chantier-col-right" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div className="chantier-section-card">
                  <h3 className="section-card-title"><Award size={18} /> Mon Rôle</h3>
                  {isEditing ? (
                    <textarea 
                      value={roleApprenti} 
                      onChange={(e) => handleUpdateSelected('roleApprenti', e.target.value)}
                      style={{ width: '100%', minHeight: '100px', border: '1px solid #ddd', borderRadius: '8px', padding: '10px', fontSize: '13px' }}
                    />
                  ) : (
                    <div className="narrative-text">{roleApprenti || 'Rôle non défini pour ce projet.'}</div>
                  )}

                </div>
                <div className="chantier-section-card">
                  <h3 className="section-card-title"><Star size={18} /> Description Technique</h3>
                  <div className="narrative-text">
                    {isEditing ? (
                      <div style={{ display: 'grid', gap: '15px' }}>
                        <div>
                          <label className="data-label" style={{ marginBottom: '5px', display: 'block' }}>Le Projet</label>
                          <textarea 
                            value={descriptionProjet?.projet || ''} 
                            onChange={(e) => handleUpdateNested('descriptionProjet', 'projet', e.target.value)}
                            style={{ width: '100%', minHeight: '80px', border: '1px solid #ddd', borderRadius: '8px', padding: '10px', fontSize: '13px' }}
                          />
                        </div>
                        <div>
                          <label className="data-label" style={{ marginBottom: '5px', display: 'block' }}>L'Existant</label>
                          <textarea 
                            value={descriptionProjet?.existant || ''} 
                            onChange={(e) => handleUpdateNested('descriptionProjet', 'existant', e.target.value)}
                            style={{ width: '100%', minHeight: '80px', border: '1px solid #ddd', borderRadius: '8px', padding: '10px', fontSize: '13px' }}
                          />
                        </div>
                      </div>
                    ) : (
                      <>
                        <p><strong>Le Projet :</strong> {descriptionProjet?.projet || '-'}</p>
                        {descriptionProjet?.existant && <p style={{marginTop:'10px'}}><strong>L'Existant :</strong> {descriptionProjet.existant}</p>}
                      </>
                    )}
                  </div>

                </div>
              </div>
            </div>

            {/* HUB TECHNIQUE & DOCUMENTS */}
            <div id="chantier-journal-section" className="technical-hub-container" style={{ marginTop: '3rem', borderTop: '1px solid var(--border-mid)', paddingTop: '3rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
                
                {/* FICHIERS JOINTS & COMPÉTENCES (COLONNE GAUCHE) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                  {(isEditing || (fichiersJoints && fichiersJoints.length > 0)) && (
                    <div className="premium-card">
                      <h3 className="premium-card-title"><FileText size={20} /> Documents & Pièces Jointes</h3>
                      <div className="fichiers-list">
                        {(fichiersJoints || []).map((f) => (
                          <div key={f.id} className="fichier-item">
                            <FileUp size={18} />
                            <a href={f.url} target="_blank" rel="noreferrer" className="data-value">{f.titre}</a>
                            {isEditing && <button className="btn-icon-sm delete" onClick={() => removeFichier(f.id)}><Trash2 size={14}/></button>}
                          </div>
                        ))}
                        {isEditing && (
                          <button className="btn-ghost-sm" onClick={addFichier} style={{ marginTop: '1rem', width: '100%' }}>
                            + Ajouter un document
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {(competencesMobilisees && competencesMobilisees.length > 0) && (
                    <div className="premium-card">
                      <h3 className="premium-card-title"><Award size={20} /> Compétences Métier</h3>
                      <div className="comp-list">
                        {isEditing ? (
                          <div className="competence-selector-premium" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', maxHeight: '300px', overflowY: 'auto', padding: '10px', background: 'var(--bg-stripe)', borderRadius: '12px' }}>
                            {Object.entries(COMPETENCES_DATA).map(([groupKey, group]) => (
                              <div key={groupKey} style={{ gridColumn: '1 / -1' }}>
                                <h5 style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--ink-dim)', marginBottom: '8px', borderBottom: '1px solid var(--border-mid)', paddingBottom: '4px' }}>{group.title}</h5>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                  {group.items.map(it => (
                                    <label key={it.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '11px', cursor: 'pointer', padding: '4px' }}>
                                      <input 
                                        type="checkbox" 
                                        checked={competencesMobilisees.includes(it.id)}
                                        onChange={() => toggleCompetence(it.id)}
                                      />
                                      <span>{it.id} - {it.label}</span>
                                    </label>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          competencesMobilisees.map((code, i) => {
                            let label = code;
                            Object.values(COMPETENCES_DATA).forEach(group => {
                              const item = group.items.find(it => it.id === code);
                              if (item) label = `${code} - ${item.label}`;
                            });
                            const catClass = code.startsWith('C16') ? 'c16' : code.startsWith('C18') ? 'c18' : '';
                            return (
                              <div key={i} className={`comp-item-row ${catClass}`}>
                                <span style={{ fontSize: '13px', lineHeight: '1.4' }}>{label}</span>
                              </div>
                            );
                          })
                        )}
                      </div>

                    </div>
                  )}
                </div>

                {/* GALERIE (COLONNE DROITE) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                  {(illustrations && illustrations.length > 0) && (
                    <div className="premium-card">
                      <h3 className="premium-card-title"><Camera size={20} /> Galerie Visuelle</h3>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '1rem' }}>
                        {illustrations.map((ill) => (
                          <div key={ill.id} className="gallery-thumbnail-premium" onClick={() => !isEditing && setEnlargedImage(ill)} style={{ position: 'relative' }}>
                            <img src={ill.url} alt={ill.titre} />
                            {!isEditing && (
                              <div className="thumbnail-overlay">
                                <Maximize2 size={16} color="white" />
                              </div>
                            )}
                            {isEditing && (
                              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.7)', padding: '5px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                <input 
                                  value={ill.titre} 
                                  onChange={(e) => updateIllustration(ill.id, 'titre', e.target.value)}
                                  style={{ background: 'transparent', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.3)', color: 'white', fontSize: '10px', width: '100%' }}
                                />
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                  <label style={{ cursor: 'pointer' }}>
                                    <FileUp size={12} color="white" />
                                    <input type="file" hidden onChange={(e) => handleUpload(e, 'illustration', ill.id)} />
                                  </label>
                                  <button onClick={() => removeIllustration(ill.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
                                    <Trash2 size={12} color="#ff4d4d" />
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      {isEditing && (
                        <button className="btn-ghost-sm" onClick={addIllustration} style={{ marginTop: '1rem', width: '100%' }}>
                          + Ajouter une illustration
                        </button>
                      )}
                    </div>
                  )}

                  {/* JOURNAL DE TÂCHE */}
                  <div className="premium-card">
                    <h3 className="premium-card-title"><BookOpen size={20} /> Journal de tâche</h3>
                    <div className="journal-tasks-list-full">
                      {/* Tâches depuis le journal de bord (Groupées) */}

                      {groupedTasks && groupedTasks.length > 0 ? (
                        groupedTasks.map((group, i) => (
                          <div key={i} className="journal-task-item-premium">
                            <div className="task-date-badge" style={{ fontSize: '9px', width: 'auto', padding: '0 10px', minWidth: '50px' }}>
                              {group.displayDate}
                            </div>
                            <div className="task-content-main">
                              <p>{group.content}</p>
                              {group.competences && group.competences.length > 0 && (
                                <div className="task-comps-mini">
                                  {group.competences.map(c => <span key={c} className="mini-comp-tag">{c}</span>)}
                                </div>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="empty-state-journal">Aucune tâche enregistrée dans le journal.</div>
                      )}

                    </div>
                  </div>

                </div>
              </div>

              {/* DOSSIERS TECHNIQUES (LARGEUR TOTALE) */}
              <div className="technical-grid-expanded" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {Object.entries(CHECKLISTS).map(([key, config]) => {
                  const data = selectedChantier[key] || {};
                  const hasContent = config.items.some(item => data[item]);
                  if (!isEditing && !hasContent) return null;

                  return (
                    <div key={key} className="chantier-section-card premium">
                      <h4 className="section-card-title">{config.title}</h4>
                      <div className="checked-grid">
                        {config.items.map((item, i) => {
                          const isChecked = !!data[item];
                          if (!isEditing && !isChecked) return null;
                          return (
                            <div key={i} className="checked-item" style={{ opacity: isChecked || isEditing ? 1 : 0.4 }}>
                              {isEditing ? (
                                <input 
                                  type="checkbox" 
                                  checked={isChecked} 
                                  onChange={(e) => handleUpdateNested(key, item, e.target.checked)} 
                                  style={{ marginTop: '2px' }}
                                />
                              ) : (
                                <span className="premium-bullet-dot"></span>
                              )}
                              <span style={{ fontSize: '12px' }}>{item}</span>
                            </div>
                          );
                        })}

                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </div>
        
        {isCropping && (
          <div className="photo-editor-overlay">
            <div className="photo-editor-window" style={{ background: 'white', padding: '2rem', borderRadius: '30px', width: '100%', maxWidth: '500px' }}>
              <h3 style={{ marginBottom: '1.5rem', fontFamily: 'Syne' }}>Recadrer la photo</h3>
              
              <div className="preview-crop-box" style={{ width: '100%', height: '240px', overflow: 'hidden', borderRadius: '15px', background: '#eee', marginBottom: '2rem' }}>
                <img 
                  src={photo_principale} 
                  alt="Aperçu"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transform: `scale(${tempStyle.scale}) translate(${tempStyle.x}px, ${tempStyle.y}px)`,
                    transformOrigin: 'center'
                  }}
                />
              </div>

              <div className="editor-controls" style={{ display: 'grid', gap: '1.5rem' }}>
                <div className="control-group">
                  <label style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--ink-dim)', display: 'block', marginBottom: '8px' }}>Échelle ({tempStyle.scale.toFixed(2)})</label>
                  <input 
                    type="range" min="1" max="3" step="0.01" 
                    value={tempStyle.scale} 
                    onChange={(e) => setTempStyle(prev => ({ ...prev, scale: parseFloat(e.target.value) }))}
                    style={{ width: '100%' }}
                  />
                </div>
                <div className="control-group">
                  <label style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--ink-dim)', display: 'block', marginBottom: '8px' }}>Position Horizontale ({tempStyle.x}px)</label>
                  <input 
                    type="range" min="-200" max="200" 
                    value={tempStyle.x} 
                    onChange={(e) => setTempStyle(prev => ({ ...prev, x: parseInt(e.target.value) }))}
                    style={{ width: '100%' }}
                  />
                </div>
                <div className="control-group">
                  <label style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--ink-dim)', display: 'block', marginBottom: '8px' }}>Position Verticale ({tempStyle.y}px)</label>
                  <input 
                    type="range" min="-200" max="200" 
                    value={tempStyle.y} 
                    onChange={(e) => setTempStyle(prev => ({ ...prev, y: parseInt(e.target.value) }))}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div className="editor-actions" style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <button className="btn-ghost" onClick={() => setIsCropping(false)} style={{ flex: 1 }}>Annuler</button>
                <button className="btn-primary" onClick={() => { handleUpdateSelected('photo_principale_style', tempStyle); setMainPhotoStyle(tempStyle); setIsCropping(false); }} style={{ flex: 1 }}>Appliquer</button>
              </div>
            </div>
          </div>
        )}

        {enlargedImage && (

          <div className="lightbox-overlay" onClick={() => setEnlargedImage(null)}>
            <button className="close-modal-btn" onClick={() => setEnlargedImage(null)}>
              <X size={24} />
            </button>
            
            <button className="lightbox-nav-btn prev" onClick={(e) => { e.stopPropagation(); handlePrevImage(); }}>
              <ChevronLeft size={32} />
            </button>
            
            <div className="lightbox-content" onClick={e => e.stopPropagation()}>
              <img src={enlargedImage.url} alt={enlargedImage.titre} />
              {enlargedImage.titre && <div className="lightbox-caption">{enlargedImage.titre}</div>}
            </div>

            <button className="lightbox-nav-btn next" onClick={(e) => { e.stopPropagation(); handleNextImage(); }}>
              <ChevronRight size={32} />
            </button>
          </div>
        )}
        {/* MODAL ITINÉRAIRE FENÊTRE CENTRÉE */}
        {isMapExpanded && (
          <div className="itinerary-modal-overlay">
            <div className="itinerary-modal-window">
              <button className="close-modal-btn" onClick={() => setIsMapExpanded(false)}>
                <X size={20} />
              </button>

              <div className="itinerary-modal-map-container">
                <MapContainer center={coordinates || [48.8566, 2.3522]} zoom={13} scrollWheelZoom={true} style={{ height: '100%', width: '100%', zIndex: 1 }}>
                  <MapZoomHandler />
                  <MapClickHandler isEnabled={isEditing} onLocationSelected={(coords, addr) => {
                    handleUpdateSelected('coordinates', coords);
                    handleUpdateSelected('lieu', addr);
                    setIsUserTyping(false);
                  }} />
                  <MapAutoBounds coords={routeGeometry} />

                  <LayersControl position="topright">
                    <BaseLayer checked name="Vue Satellite">
                      <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" />
                    </BaseLayer>
                    <BaseLayer name="Plan">
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{y}/{x}.png" />
                    </BaseLayer>
                  </LayersControl>
                  
                  {coordinates && (
                    <Marker position={coordinates} icon={modernIcon}>
                      <Popup className="premium-popup">
                        <div className="premium-popup-header">
                          <strong style={{ fontSize: '14px', fontFamily: 'Playfair Display', color: 'var(--ink)' }}>{nom}</strong>
                        </div>
                        <div className="premium-popup-body">
                          <div style={{ fontSize: '11px', color: 'var(--ink-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <MapPin size={12} color="var(--vivid-blue)" /> {lieu?.split('(')[0]}
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  )}
                  
                  {travelInfo && travelInfo.startCoords && (
                    <Marker position={travelInfo.startCoords} icon={modernIconStart}>
                      <Popup><strong>Départ</strong><br/>{startAddress}</Popup>
                    </Marker>
                  )}
                  
                  {routeGeometry && <Polyline positions={routeGeometry} color="var(--vivid-blue)" weight={6} opacity={0.8} lineCap="round" />}
                </MapContainer>
              </div>

              <div className="itinerary-sidebar">
                <div className="sidebar-header">
                  <h2>Itinéraire</h2>
                  <p style={{ fontSize: '12px', color: 'var(--ink-dim)' }}>Planifiez votre trajet vers le chantier</p>
                </div>

                <div className="sidebar-content">
                  <div className="itinerary-input-group-vertical" style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                    <div style={{ position: 'relative' }}>
                      <label style={{ display: 'block', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', marginBottom: '6px', color: 'var(--vivid-blue)' }}>Départ</label>
                      <input 
                        type="text" 
                        placeholder="Saisissez une adresse..." 
                        value={startAddress}
                        onChange={(e) => {
                          setStartAddress(e.target.value);
                          setSelectedStartCoords(null);
                        }}
                        onBlur={() => setTimeout(() => setAddressSuggestions([]), 200)}
                        className="itinerary-input"
                        style={{ height: '45px', fontSize: '13px' }}
                      />
                      {addressSuggestions.length > 0 && (
                        <div className="address-suggestions-dropdown" style={{ width: '100%' }}>
                          {addressSuggestions.map((s, i) => (
                            <div key={i} className="suggestion-item" onClick={() => selectStartSuggestion(s)}>
                              <MapPin size={12} style={{ marginRight: '8px', opacity: 0.5 }} />
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {formatAddress(s.address) || s.display_name}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div style={{ position: 'relative' }}>
                      <label style={{ display: 'block', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', marginBottom: '6px', color: 'var(--ink-dim)' }}>Arrivée (Chantier)</label>
                      <div style={{ padding: '10px', background: 'var(--bg-hover)', borderRadius: '10px', fontSize: '12px', color: 'var(--ink)', border: '1px solid var(--border-mid)' }}>
                        {lieu?.split('(')[0] || "Adresse non définie"}
                      </div>
                    </div>

                    <button className="btn-primary" onClick={calculateRoute} disabled={isCalculatingRoute || !startAddress} style={{ height: '50px', borderRadius: '12px', fontSize: '14px', fontWeight: 700 }}>
                      {isCalculatingRoute ? "Calcul en cours..." : "Calculer l'itinéraire"}
                    </button>

                    {travelInfo && (
                      <div className="travel-results-card" style={{ marginTop: '0.5rem', padding: '1.2rem', background: 'var(--vivid-blue)', borderRadius: '15px', color: 'white' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                          <div>
                            <span style={{ fontSize: '9px', textTransform: 'uppercase', opacity: 0.8, fontWeight: 700 }}>Distance</span>
                            <div style={{ fontSize: '20px', fontWeight: 900 }}>{travelInfo.distance} <small style={{ fontSize: '12px' }}>km</small></div>
                          </div>
                          <div>
                            <span style={{ fontSize: '9px', textTransform: 'uppercase', opacity: 0.8, fontWeight: 700 }}>Temps estimé</span>
                            <div style={{ fontSize: '20px', fontWeight: 900 }}>{travelInfo.duration} <small style={{ fontSize: '12px' }}>min</small></div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="sidebar-footer">
                  <p style={{ fontSize: '10px', color: 'var(--ink-dim)', textAlign: 'center' }}>Calcul basé sur les données OpenStreetMap</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </>

    );
  }

  // LIST VIEW
  return (
    <>
      <div className="page content chantiers-list-page">
        <div className="chantiers-container">
          <div className="chantiers-header-top">
            <h1>Mes Chantiers</h1>
            <p>Liste des projets, appels d'offres et suivis de chantiers.</p>
          </div>

      {loading ? (
        <div className="loading-state">Chargement des chantiers...</div>
      ) : (
        <div className="chantiers-grid-list">
          {chantiers.map(chantier => {
            let s = chantier.status;
            if (s === 'appel_offre') s = 'ao_en_cours';
            if (s === 'perdu') s = 'ao_perdu';
            if (s === 'en_cours') s = 'chantier_en_cours';

            let statusLabel = s;
            switch(s) {
              case 'ao_en_cours': statusLabel = "Appel d'offre - En cours"; break;
              case 'ao_gagne': statusLabel = "Appel d'offre - Gagné"; break;
              case 'ao_perdu': statusLabel = "Appel d'offre - Perdu"; break;
              case 'chantier_preparation': statusLabel = "Chantier - Préparation"; break;
              case 'chantier_en_cours': statusLabel = "Chantier - En cours"; break;
              case 'chantier_termine': statusLabel = "Chantier - Terminé"; break;
            }

            return (
              <div key={chantier.id} className="chantier-card" onClick={() => openChantier(chantier)}>
                <div className="chantier-card-image">
                  {chantier.photo_principale ? (
                    <img src={chantier.photo_principale} alt={chantier.nom} />
                  ) : (
                    <div className="no-photo-placeholder">
                      <Building2 size={40} style={{ opacity: 0.1 }} />
                    </div>
                  )}
                </div>
                <div className="chantier-card-content">

                  <div className="chantier-card-header">
                    <span className={`status-badge ${s}`}>
                      {statusLabel}
                    </span>
                    <Building2 className="chantier-icon" size={20} style={{ opacity: 0.3 }} />
                  </div>
                  <h3 className="chantier-card-title">{chantier.nom}</h3>
                  <div className="chantier-card-location"><MapPin size={14} /> <span>{chantier.lieu?.split('(')[0] || 'Lieu non renseigné'}</span></div>
                  <div className="chantier-card-footer">
                    <span className="chantier-type">{chantier.typeProjet || 'Type non défini'}</span>
                    <span className="view-details">Voir les détails &rarr;</span>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Placeholder for adding new */}
          {isAdmin && (
            <div className="chantier-card add-new-card" onClick={handleAddNew}>
              <div className="add-new-icon">+</div>
              <h3>Nouveau chantier</h3>
            </div>
          )}
        </div>
      )}

        </div>
      </div>
    </>
  );
};

export default Chantiers;
