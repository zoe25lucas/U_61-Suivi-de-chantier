import { useEffect, useState } from 'react';
import { supabase } from './supabase';
import { REMERCIEMENTS, INTRODUCTION, MISSION, NOTE_EXAMENS } from '../data/avantPropos';

export const AVANT_PROPOS_ID = '550e8400-e29b-41d4-a716-446655442222';

export const DEFAULT_AVANT_PROPOS = {
  id: AVANT_PROPOS_ID,
  remerciements: REMERCIEMENTS,
  introduction: INTRODUCTION,
  mission: MISSION,
  note_examens: NOTE_EXAMENS,
};

// Contenu de l'avant-propos : base de données si elle existe, sinon texte par défaut
export const useAvantPropos = () => {
  const [content, setContent] = useState(DEFAULT_AVANT_PROPOS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    supabase.from('avant_propos').select('*').eq('id', AVANT_PROPOS_ID).maybeSingle()
      .then(({ data }) => {
        if (data) {
          setContent({
            ...DEFAULT_AVANT_PROPOS,
            ...data,
            remerciements: data.remerciements?.length ? data.remerciements : REMERCIEMENTS,
            introduction: data.introduction?.length ? data.introduction : INTRODUCTION,
            mission: { ...MISSION, ...(data.mission || {}) },
            note_examens: data.note_examens ?? NOTE_EXAMENS,
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const save = async (next) => {
    const { error } = await supabase.from('avant_propos').upsert({
      id: AVANT_PROPOS_ID,
      remerciements: next.remerciements,
      introduction: next.introduction,
      mission: next.mission,
      note_examens: next.note_examens,
      updated_at: new Date().toISOString(),
    });
    if (error) throw error;
    setContent(next);
  };

  return { content, setContent, save, loaded };
};
