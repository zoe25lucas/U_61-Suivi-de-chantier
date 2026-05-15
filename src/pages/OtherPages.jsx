import { Hammer, ShieldCheck, ShieldAlert, Lock, Unlock, Mail, Key, UserPlus, LogIn, LogOut, Printer, BookOpen, Building2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import './Admin.css';

const PlaceholderPage = ({ title }) => (
  <div className="page-placeholder">
    <div className="placeholder-ring">
      <Hammer size={26} strokeWidth={1.5} />
    </div>
    <h2>{title}</h2>
    <p>Cette section est en cours de développement.</p>
    <div className="coming-pill">
      <div className="coming-dot"></div>
      Prochainement
    </div>
  </div>
);

export const Admin = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState(null);
  const [allUsers, setAllUsers] = useState([]);

  // Local state for the edit toggle
  const [isEditMode, setIsEditMode] = useState(localStorage.getItem('isAdmin') === 'true');

  useEffect(() => {
    checkUser();

    // SÉCURITÉ ULTIME : Force l'affichage après 3 secondes si Supabase ne répond pas
    const safetyTimeout = setTimeout(() => {
      setLoading(false);
    }, 3000);

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        checkAdminStatus(session.user.id);
      } else {
        setIsAdminUser(false);
        disableEditMode();
      }
    });

    return () => {
      clearTimeout(safetyTimeout);
      authListener.subscription.unsubscribe();
    };
  }, []);

  const checkUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      
      if (currentUser) {
        await checkAdminStatus(currentUser.id);
      }
    } catch (err) {
      console.error("Auth check failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      localStorage.clear();
      window.location.href = '/';
    } catch (err) {
      console.error("Logout error:", err);
      // Force clear even if supabase fails
      localStorage.clear();
      window.location.href = '/';
    }
  };

  const checkAdminStatus = async (userId) => {
    try {
      // SÉCURITÉ SUPRÊME : Bypass total pour vous
      const { data: { user } } = await supabase.auth.getUser();
      if (userId === '81753517-96f7-4238-b38f-959066ba7ca1' || user?.email === 'zoe25.lucas@gmail.com') {
        console.log("🔓 Bypass Admin activé pour Zoé");
        setIsAdminUser(true);
        fetchUsers();
        return;
      }

      const { data } = await supabase.from('profiles').select('is_admin').eq('id', userId).maybeSingle();
      if (data?.is_admin) {
        setIsAdminUser(true);
        fetchUsers();
      } else {
        setIsAdminUser(false);
      }
    } catch (err) {
      console.error("Erreur checkAdminStatus:", err);
      // En cas d'erreur de réseau, on essaie quand même de garder l'admin si l'email correspond
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email === 'zoe25.lucas@gmail.com') setIsAdminUser(true);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data } = await supabase.from('profiles').select('id, email, is_admin');
      if (data) setAllUsers(data);
    } catch (err) {
      console.error("Fetch users failed:", err);
    }
  };

  const promoteUser = async (targetId, status) => {
    await supabase.from('profiles').update({ is_admin: status }).eq('id', targetId);
    fetchUsers();
    // Also dispatch event to update current UI if it's the current user
    if (targetId === user.id) {
       setIsAdminUser(status);
       if (!status) disableEditMode();
    }
  };

  const disableEditMode = () => {
    setIsEditMode(false);
    localStorage.setItem('isAdmin', 'false');
    window.dispatchEvent(new Event('adminModeChanged'));
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setMessage({ type: 'info', text: 'Opération en cours...' });
    
    try {
      if (authMode === 'register') {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage({ type: 'success', text: 'Compte créé ! Attendez que l\'administrateur valide votre accès.' });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        setMessage(null);
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    }
  };


  const toggleEditMode = () => {
    if (!isAdminUser) return;
    const newValue = !isEditMode;
    setIsEditMode(newValue);
    localStorage.setItem('isAdmin', newValue.toString());
    window.dispatchEvent(new Event('adminModeChanged'));
  };

  // if (loading) return <div className="admin-page-container"><div className="spinner-xs"></div></div>;

  if (!user) {
    return (
      <div className="admin-page-container">
        <div className="admin-card auth-card">
          <div className="admin-header">
            <Lock size={48} className="text-muted" />
            <h1>Accès Restreint</h1>
            <p>Connectez-vous pour accéder aux outils d'administration.</p>
          </div>

          <form onSubmit={handleAuth} className="auth-form">
            <div className="input-group">
              <Mail size={18} />
              <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div className="input-group">
              <Key size={18} />
              <input type="password" placeholder="Mot de passe" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            
            {message && <div className={`auth-message ${message.type}`}>{message.text}</div>}
            
            <button type="submit" className="btn-primary auth-btn">
              {authMode === 'login' ? <LogIn size={18} /> : <UserPlus size={18} />}
              {authMode === 'login' ? 'Se connecter' : "S'inscrire"}
            </button>
          </form>

          <div className="auth-footer">
            <button onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}>
              {authMode === 'login' ? "Pas de compte ? S'inscrire" : "Déjà un compte ? Se connecter"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // SÉCURITÉ ABSOLUE : Bypass au niveau du rendu
  const isSuperAdmin = user?.id === '81753517-96f7-4238-b38f-959066ba7ca1' || user?.email === 'zoe25.lucas@gmail.com' || isAdminUser;

  if (!isSuperAdmin) {
    return (
      <div className="admin-page-container">
        <div className="admin-card">
          <div className="admin-header">
            <ShieldAlert size={48} className="text-red" />
            <h1>Accès en attente</h1>
            <p>Votre compte ({user.email}) est créé, mais vous n'avez pas encore les droits d'administrateur.</p>
          </div>
          <div className="admin-warning">
            <p>L'administrateur principal doit valider votre accès.</p>
            <p style={{ marginTop: '10px', fontSize: '10px', opacity: 0.6 }}>Votre ID : {user.id}</p>
          </div>
          <button 
            onClick={() => {
              localStorage.clear();
              supabase.auth.signOut();
              window.location.href = '/';
            }} 
            className="btn-primary"
            style={{ marginTop: '20px', width: '100%', background: '#ef4444' }}
          >
            <LogOut size={16} /> FORCER LA DÉCONNEXION
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page-container">
      <div className="admin-card">
        <div className="admin-header">
          <div className="admin-user-info">
            <ShieldCheck size={24} className="text-green" />
            <span>Connecté en tant que <strong>{user.email}</strong></span>
          </div>
          <h1>Contrôle Administrateur</h1>
          <p>Le mode édition est déverrouillé pour votre compte.</p>
        </div>

        <div className={`admin-toggle-box ${isEditMode ? 'active' : ''}`} onClick={toggleEditMode}>
          <div className="toggle-status">
            {isEditMode ? <Unlock size={20} /> : <Lock size={20} />}
            <span>Mode Édition : <strong>{isEditMode ? 'ACTIVÉ' : 'DÉSACTIVÉ'}</strong></span>
          </div>
          <div className="toggle-switch">
            <div className="toggle-handle"></div>
          </div>
        </div>

        <div className="admin-warning">
          <p><strong>Note :</strong> Une fois activé, vous verrez apparaître les boutons "Modifier" sur tout le site.</p>
        </div>

        <button onClick={handleLogout} className="btn-ghost mt-1">
          <LogOut size={16} /> Se déconnecter
        </button>

        <div className="admin-users-section">
           <h3><UserPlus size={16} /> Gestion des utilisateurs</h3>
           <div className="users-list">
             {allUsers.filter(u => u.id !== user.id).map(u => (
               <div key={u.id} className="user-item">
                 <div className="user-item-info">
                   <div className="user-email">{u.email || u.full_name || 'Utilisateur sans nom'}</div>
                   <div className={`user-badge ${u.is_admin ? 'admin' : 'pending'}`}>
                     {u.is_admin ? 'ADMIN' : 'EN ATTENTE'}
                   </div>
                 </div>
                 <button 
                   className={u.is_admin ? "btn-ghost text-red" : "btn-primary"} 
                   style={{ padding: '4px 8px', fontSize: '11px' }}
                   onClick={() => promoteUser(u.id, !u.is_admin)}
                 >
                   {u.is_admin ? 'Révoquer' : 'Accepter'}
                 </button>
               </div>
             ))}
             {allUsers.filter(u => u.id !== user.id).length === 0 && (
               <p className="no-users">Aucun autre utilisateur inscrit.</p>
             )}
           </div>
        </div>
      </div>
    </div>
  );
};


