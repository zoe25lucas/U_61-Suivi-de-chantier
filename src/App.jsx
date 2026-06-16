import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Home from './pages/Home';
import Profile from './pages/Profile';
import Competences from './pages/Competences';
import Chantiers from './pages/Chantiers';
import Formation from './pages/Formation';
import { Admin } from './pages/OtherPages';
import Impression from './pages/Impression';
import Journal from './pages/Journal';
import Entreprise from './pages/Entreprise';
import Themes from './pages/Themes';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/profil" element={<Profile />} />
          <Route path="/formation" element={<Formation />} />
          <Route path="/entreprise" element={<Entreprise />} />
          <Route path="/journal" element={<Journal />} />
          <Route path="/chantiers" element={<Chantiers />} />
          <Route path="/themes" element={<Themes />} />
          <Route path="/competences" element={<Competences />} />
          <Route path="/impression" element={<Impression />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;