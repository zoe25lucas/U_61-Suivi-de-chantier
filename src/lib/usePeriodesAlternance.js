import { useEffect, useState } from 'react';
import { supabase } from './supabase';
import { PLANNING_ANNEE_2 } from './calendar';

// Périodes du journal + planning officiel de 2e année (le journal a priorité)
export const usePeriodesAlternance = () => {
  const [periods, setPeriods] = useState(PLANNING_ANNEE_2);
  useEffect(() => {
    supabase.from('journal_settings').select('periods').maybeSingle()
      .then(({ data }) => { if (data?.periods) setPeriods([...PLANNING_ANNEE_2, ...data.periods]); })
      .catch(() => {});
  }, []);
  return periods;
};
