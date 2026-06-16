import { Link } from 'react-router-dom';
import { Building2, BookOpen, Star, User, GraduationCap, Briefcase, FolderOpen, Printer } from 'lucide-react';

const Home = () => {
  return (
    <div className="page active" id="page-accueil">
      <div className="hero">
        <div className="hero-left">
          <div className="hero-eyebrow">
            <div className="hero-eyebrow-line"></div>
            <span className="hero-eyebrow-text">BTS Bâtiment · Alternance 2025–2027</span>
          </div>
          <h1 className="hero-title">
            <span className="line1">SUIVI DE</span>
            <span className="line2">CHANTIER</span>
          </h1>
          <p className="hero-desc">
            Bienvenue sur mon portfolio U61. Retrouvez ici mon parcours, mes chantiers, 
            mes tâches quotidiennes et mes compétences développées en alternance.
          </p>
          <div className="hero-ctas">
            <Link to="/chantiers" className="btn-primary">
              <Building2 size={16} strokeWidth={2} style={{ marginRight: '8px' }} />
              Voir les chantiers
            </Link>
            <Link to="/profil" className="btn-ghost">Mon profil →</Link>
          </div>
        </div>
        <div className="hero-right">
          <Link to="/profil" className="stat-card">
            <div className="stat-icon"><User size={15} strokeWidth={1.7} /></div>
            <span className="stat-title">Mon profil</span>
          </Link>
          <Link to="/formation" className="stat-card">
            <div className="stat-icon"><GraduationCap size={15} strokeWidth={1.7} /></div>
            <span className="stat-title">Formation</span>
          </Link>
          <Link to="/entreprise" className="stat-card">
            <div className="stat-icon"><Briefcase size={15} strokeWidth={1.7} /></div>
            <span className="stat-title">Entreprise</span>
          </Link>
          <Link to="/journal" className="stat-card">
            <div className="stat-icon"><BookOpen size={15} strokeWidth={1.7} /></div>
            <span className="stat-title">Journal quotidien</span>
          </Link>
          <Link to="/chantiers" className="stat-card">
            <div className="stat-icon"><Building2 size={15} strokeWidth={1.7} /></div>
            <span className="stat-title">Mes chantiers</span>
          </Link>
          <Link to="/themes" className="stat-card">
            <div className="stat-icon"><FolderOpen size={15} strokeWidth={1.7} /></div>
            <span className="stat-title">Thèmes d'étude</span>
          </Link>
          <Link to="/competences" className="stat-card">
            <div className="stat-icon"><Star size={15} strokeWidth={1.7} /></div>
            <span className="stat-title">Compétences</span>
          </Link>
          <Link to="/impression" className="stat-card">
            <div className="stat-icon"><Printer size={15} strokeWidth={1.7} /></div>
            <span className="stat-title">Impression</span>
          </Link>
        </div>
      </div>
      <div className="hero-status">
        <div className="status-dot"></div>
        <span className="status-text">U61 — Suivi de chantier en cours</span>
        <div className="status-sep"></div>
        <span className="status-text">BTS Bâtiment · 2025–2027</span>
      </div>
    </div>
  );
};

export default Home;
