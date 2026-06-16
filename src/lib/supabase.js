import { createClient } from '@supabase/supabase-js'

// Verrou "pass-through" : exécute directement l'action sans passer par
// navigator.locks. Évite le deadlock multi-onglets qui bloquait toutes les
// requêtes (page figée sur "Chargement..." sans erreur).
const passthroughLock = async (_name, _acquireTimeout, fn) => fn()

export const supabase = createClient(
  'https://wjrjevusbyiynrquxgeu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqcmpldnVzYnlpeW5ycXV4Z2V1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4MTA2MzAsImV4cCI6MjA5MjM4NjYzMH0.0r0AF-0qrjQXSO-gfzYWFqb_c4lHwgbI9KzHjBLc9Mg',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
      lock: passthroughLock
    }
  }
)
