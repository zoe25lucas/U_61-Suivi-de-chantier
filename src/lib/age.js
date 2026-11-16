// Calcule l'âge à la date du jour
export const computeAge = (birth, today = new Date()) => {
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age -= 1;
  return age;
};

// Met à jour automatiquement "XX ans" dans un texte du type "Étudiante - 21 ans (25.04.2005)".
// La date de naissance est lue dans le texte (JJ.MM.AAAA ou JJ/MM/AAAA), sinon dans birthDate.
export const withLiveAge = (text, birthDate) => {
  if (!text) return text;
  let birth = null;
  const m = text.match(/(\d{2})[./](\d{2})[./](\d{4})/);
  if (m) birth = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
  else if (birthDate) birth = new Date(`${birthDate}T12:00:00`);
  if (!birth || Number.isNaN(birth.getTime())) return text;
  return text.replace(/\d+\s*ans/, `${computeAge(birth)} ans`);
};
