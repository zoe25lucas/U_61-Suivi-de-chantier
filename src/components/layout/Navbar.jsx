import { NavLink } from 'react-router-dom';
import { Home, User, GraduationCap, Briefcase, BookOpen, Building2, Star, Printer, Settings } from 'lucide-react';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

const Navbar = () => {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAdmin(localStorage.getItem('isAdmin') === 'true');
    };
    checkUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        // On laisse la page Admin gérer le statut
      } else if (event === 'SIGNED_OUT') {
        setIsAdmin(false);
        localStorage.removeItem('isAdmin');
      }
    });

    const handleAdminChange = () => {
      setIsAdmin(localStorage.getItem('isAdmin') === 'true');
    };
    window.addEventListener('adminModeChanged', handleAdminChange);

    return () => {
      authListener.subscription.unsubscribe();
      window.removeEventListener('adminModeChanged', handleAdminChange);
    };
  }, []);

  const checkAdmin = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const { data } = await supabase.from('profiles').select('is_admin').eq('id', session.user.id).maybeSingle();
      setIsAdmin(data?.is_admin || false);
    }
  };
  const navItems = [
    { to: '/', icon: Home, label: 'Accueil' },
    { to: '/profil', icon: User, label: 'Mon profil' },
    { to: '/formation', icon: GraduationCap, label: 'Formation' },
    { to: '/entreprise', icon: Briefcase, label: 'Entreprise' },
    { to: '/journal', icon: BookOpen, label: 'Journal' },
    { to: '/chantiers', icon: Building2, label: 'Chantiers' },
    { to: '/competences', icon: Star, label: 'Compétences' },
    { to: '/impression', icon: Printer, label: 'Impression' },
  ];

  return (
    <nav>
      <div className="nav-inner">
        <NavLink to="/" className="nav-logo">
          <div className="nav-logo-badge">U61</div>
          <div className="nav-logo-right">
            <span className="nav-logo-title">Suivi de Chantier</span>
            <span className="nav-logo-sub">BTS Bâtiment · Alternance</span>
          </div>
        </NavLink>
        <div className="nav-sep"></div>
        <ul className="nav-items">
          {navItems.map((item) => (
            <li key={item.to} className="nav-item">
              <NavLink 
                to={item.to} 
                data-label={item.label}
                className={({ isActive }) => (isActive ? 'active' : '')}
              >
                <item.icon className="nav-icon" strokeWidth={1.7} />
              </NavLink>
            </li>
          ))}
          <li className="nav-item admin">
            <NavLink 
              to="/admin" 
              data-label="Admin"
              className={({ isActive }) => (isActive ? 'active' : '')}
            >
              <Settings className="nav-icon" strokeWidth={1.7} />
            </NavLink>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
