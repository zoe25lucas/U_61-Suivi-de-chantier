// Fonction serverless appelée par le Cron Vercel (voir vercel.json).
// Elle envoie une petite lecture à Supabase pour garder le projet "actif"
// et éviter la mise en pause après 7 jours d'inactivité (plan gratuit).
// Tourne indéfiniment tant que le site est déployé sur Vercel.

const SUPABASE_URL = 'https://wjrjevusbyiynrquxgeu.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqcmpldnVzYnlpeW5ycXV4Z2V1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4MTA2MzAsImV4cCI6MjA5MjM4NjYzMH0.0r0AF-0qrjQXSO-gfzYWFqb_c4lHwgbI9KzHjBLc9Mg';

export default async function handler(req, res) {
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/chantiers?select=id&limit=1`, {
      headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` },
    });
    res.status(200).json({ ok: r.ok, supabaseStatus: r.status, at: new Date().toISOString() });
  } catch (err) {
    // On répond quand même 200 pour que le cron ne soit pas marqué en échec
    res.status(200).json({ ok: false, error: String(err), at: new Date().toISOString() });
  }
}
