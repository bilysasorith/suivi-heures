/* ============================================================
   FICHIER À MODIFIER — Suivi des heures Infogreffe
   ------------------------------------------------------------
   1) Adapte la config si besoin (date de début, objectif, tarif).
   2) Ajoute une ligne dans `heures` à chaque séance de travail.
      Format : { date: "AAAA-MM-JJ", heures: 2.5, note: "Ce que j'ai fait" }
      - date   : le jour où tu as travaillé (ex "2026-09-03")
      - heures : nombre d'heures (décimales OK : 1.5 = 1h30)
      - note   : courte description (facultatif)
   3) Enregistre, puis "commit + push" sur GitHub (voir README).
   ============================================================ */

window.SUIVI = {
  config: {
    prestataire: "Bily",           // ton nom (affiché en haut)
    client: "Infogreffe",          // le client
    debut: "2026-09-01",           // 1er jour de la mission (un LUNDI de préférence)
    heuresParSemaine: 10,          // objectif hebdomadaire
    tarifHoraire: 30,              // € par heure
    devise: "€",
  },

  // Ajoute tes séances ici (les plus récentes en haut ou en bas, peu importe) :
  heures: [
    // Exemples — remplace-les par tes vraies séances :
    { date: "2026-09-01", heures: 3,   note: "Mise en place / cartes statistiques" },
    { date: "2026-09-02", heures: 2.5, note: "Traitement des données PowerQuery" },
    { date: "2026-09-04", heures: 4,   note: "Génération des présentations" },
  ],
};
