-- Mise à jour et initialisation des tables Supabase pour le Portfolio U61

-- 1. Table des Profils (Ajustée pour le Mode Édition)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT auth.uid(),
  full_name TEXT NOT NULL,
  eyebrow TEXT,
  job_title TEXT,
  age_text TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  description TEXT,
  avatar_url TEXT,
  birth_date DATE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Active RLS for Profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- 2. Table des Compétences (Skills)
CREATE TABLE IF NOT EXISTS skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL, -- 'outils', 'qualites', 'langue'
  level INTEGER DEFAULT 100, -- Utilisé pour le % des langues
  label TEXT, -- 'NATIF', 'B2', etc.
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public skills are viewable by everyone" ON skills FOR SELECT USING (true);
CREATE POLICY "Users can manage own skills" ON skills FOR ALL USING (auth.uid() = profile_id);

-- 3. Table du Parcours (Timeline)
CREATE TABLE IF NOT EXISTS timeline_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  category TEXT NOT NULL, -- 'formation', 'experience', 'certification'
  title TEXT NOT NULL,
  description TEXT,
  date_label TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE timeline_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public timeline items are viewable by everyone" ON timeline_items FOR SELECT USING (true);
CREATE POLICY "Users can manage own timeline" ON timeline_items FOR ALL USING (auth.uid() = profile_id);
