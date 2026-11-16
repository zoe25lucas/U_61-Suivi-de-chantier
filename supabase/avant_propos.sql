-- Table de l'Avant-propos (remerciements, introduction, mission) — modifiable depuis le mode admin
-- À exécuter une fois dans Supabase : SQL Editor > New query > coller > Run

CREATE TABLE IF NOT EXISTS avant_propos (
  id UUID PRIMARY KEY,
  remerciements JSONB NOT NULL DEFAULT '[]'::jsonb,
  introduction JSONB NOT NULL DEFAULT '[]'::jsonb,
  mission JSONB NOT NULL DEFAULT '{}'::jsonb,
  note_examens TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE avant_propos ENABLE ROW LEVEL SECURITY;

-- Lecture publique (le site et le PDF l'affichent)
CREATE POLICY "Avant-propos lisible par tous" ON avant_propos
  FOR SELECT USING (true);

-- Écriture réservée au compte de Zoé
CREATE POLICY "Avant-propos modifiable par Zoe (insert)" ON avant_propos
  FOR INSERT WITH CHECK ((auth.jwt() ->> 'email') = 'zoe25.lucas@gmail.com');
CREATE POLICY "Avant-propos modifiable par Zoe (update)" ON avant_propos
  FOR UPDATE USING ((auth.jwt() ->> 'email') = 'zoe25.lucas@gmail.com');
