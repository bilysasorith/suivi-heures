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
    prestataire: "",               // ton nom (vide = masqué, page publique)
    client: "",                    // le client (vide = masqué, page publique)
    debut: "2026-09-01",           // 1er jour de la mission (un LUNDI de préférence)
    heuresParSemaine: 10,          // objectif hebdomadaire
    tarifHoraire: 30,              // € par heure
    devise: "€",

    // Objectif d'un mois précis (en heures). Par défaut, l'objectif du mois
    // = nombre de semaines du mois × heuresParSemaine. Ici on force décembre.
    // Clé = numéro du mois (1 = janvier … 12 = décembre).
    objectifsMois: {
      12: 40,   // décembre : 40 h
    },
  },

  // Ajoute tes séances ici (les plus récentes en haut ou en bas, peu importe) :
  heures: [
    { date: "2026-08-31", heures: 0.5, note: "Échanges avec Anne pour l'article Coaching + recherches codes NAF à utiliser" },
    { date: "2026-09-01", heures: 1.5, note: "PPT Août 2026" },
    { date: "2026-09-04", heures: 1,   note: "Réunion CNGTC" },
    { date: "2026-09-06", heures: 2,   note: "PPT coaching et salle de sport" },
    { date: "2026-09-07", heures: 0.5, note: "Échanges avec Nicolas François et Philippe LOPEZ + test requête SQL" },
    { date: "2026-09-08", heures: 2,   note: "Accès et analyse fichier Marketplace PCL à la demande de Katrin TILLMANS" },
    { date: "2026-09-08", heures: 1,   note: "Extraction, requête SQL WS EE + call avec Philippe LOPEZ + début tutoriel DBeaver" },
  ],
};
