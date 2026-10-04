/* ============================================================
   FICHIER À MODIFIER — Suivi des heures Infogreffe
   ------------------------------------------------------------
   1) Adapte la config si besoin (date de début, objectif, tarif).
   2) Ajoute une ligne dans `heures` à chaque séance de travail.
      Format : { date: "AAAA-MM-JJ", heures: 2.5, note: "Ce que j'ai fait" }
      - date   : le jour où tu as travaillé (ex "2026-09-03")
      - heures : nombre d'heures (décimales OK : 1.5 = 1h30)
      - min    : alternative à `heures`, en minutes exactes (ex : min: 20).
                 À préférer pour les durées < 1h (évite les arrondis).
      - note   : courte description (facultatif)
   3) Enregistre, puis "commit + push" sur GitHub (voir README).
   ============================================================ */

window.SUIVI = {
  config: {
    prestataire: "",               // ton nom (vide = masqué, page publique)
    client: "",                    // le client (vide = masqué, page publique)
    debut: "2026-09-01",           // 1er jour de la mission (un LUNDI de préférence)
    objectifMensuel: 40,           // OBJECTIF RÉEL : 40 h par mois (fixe, quel que soit le mois)
    heuresParSemaine: 10,          // simple repère de rythme (~10 h/semaine)
    tarifHoraire: 30,              // € par heure
    devise: "€",

    // Surcharge ponctuelle de l'objectif d'un mois précis (en heures), si besoin.
    // Clé = numéro du mois (1 = janvier … 12 = décembre). Ex : { 8: 20 } pour août.
    objectifsMois: {},
  },

  // Ajoute tes séances ici (les plus récentes en haut ou en bas, peu importe) :
  heures: [
    { date: "2026-08-31", heures: 0.5, note: "Échanges avec Anne pour l'article Coaching + recherches codes NAF à utiliser" },
    { date: "2026-09-01", heures: 1.5, note: "PPT Août 2026 pour l'équipe communication" },
    { date: "2026-09-04", heures: 1,   note: "Réunion CNGTC avec Jean-Baptiste" },
    { date: "2026-09-06", heures: 2,   note: "PPT coaching et salle de sport pour l'équipe communication" },
    { date: "2026-09-07", heures: 0.5, note: "Échanges avec Nicolas François et Philippe LOPEZ + test requête SQL" },
    { date: "2026-09-07", min: 20, note: "Légère correction PPT + check fichier prévention (présence SIREN ou secteur ?)" },
    { date: "2026-09-08", heures: 2,   note: "Accès et analyse fichier Marketplace PCL à la demande de Katrin TILLMANS" },
    { date: "2026-09-08", heures: 1,   note: "Extraction, requête SQL WS EE + call avec Philippe LOPEZ + début tutoriel DBeaver" },
    { date: "2026-09-09", heures: 1.5, note: "Requête SQL Ventilation par type d'inscription pour Philippe LOPEZ" },
    { date: "2026-09-09", min: 20, note: "Vérification chiffre Gard pour Philippe DAO" },
    { date: "2026-09-11", min: 20, note: "Vérification chiffre article coaching salle pour Delphine" },
    { date: "2026-09-12", heures: 4,    note: "Script Baromètre S1 2026 des principaux territoires économiques français — partie 1 (pour Katrin TILLMANS)" },
    { date: "2026-09-13", heures: 3,    note: "Finalisation Baromètre S1 2026 des principaux territoires économiques français — partie 2 (pour Katrin TILLMANS)" },
    { date: "2026-09-14", heures: 0.75, note: "Requête SQL EE par client pour Philippe LOPEZ" },
    { date: "2026-09-16", min: 30, note: "Extraction hors RCS pour Philippe LOPEZ" },
    { date: "2026-09-16", heures: 1, note: "Requête SQL pour Philippe DAO" },
    { date: "2026-09-22", heures: 2, note: "Analyse PPT de Philippe LOPEZ + ticket pour François NICOLAS" },
    { date: "2026-09-22", min: 20, note: "Point réunion stats CNGTC avec Jean-Baptiste" },
    { date: "2026-09-22", heures: 2.5, note: "Compréhension et analyse de l'écart d'extraction avec Borhane" },
    { date: "2026-09-23", min: 30, note: "Correction infographie chiffres Objectif GARD" },
    { date: "2026-09-24", heures: 1.5, note: "Essai d'extraction avec Borhane (pour Philippe DAO)" },
    { date: "2026-09-27", heures: 1, note: "Reformulation du problème WS EE" },
    { date: "2026-09-28", min: 30, note: "Extraction WS EE CA" },
    { date: "2026-09-28", heures: 1, note: "Voir requête SQL avec Nicolas François" },
    { date: "2026-09-28", min: 30, note: "Extraction Dirigeants" },
    { date: "2026-09-28", min: 30, note: "Extraction WS EE CA" },
    { date: "2026-09-29", heures: 1, note: "Organisation et cadrage des prochains articles, avec Delphine et Anne" },
    { date: "2026-09-29", min: 30, note: "Extraction dirigeant étranger pour Philippe DAO" },
    { date: "2026-09-30", min: 20, note: "Extraction pour Philippe DAO" },
    { date: "2026-09-30", min: 30, note: "Retour aux interrogations de Jérôme" },
    { date: "2026-09-30", min: 50, note: "Rattrapage réunion CNGTC lot 3" },
    { date: "2026-09-30", heures: 1.5, note: "Préparation du script T3" },
    { date: "2026-10-01", heures: 6.5, note: "PPT T3 National, Mensuel Septembre, Gard, Manche + Modification du script + Vérification et identification des anomalies/écarts" },
    { date: "2026-10-03", heures: 6, note: "Script forme juridique (trimestriel, semestriel, mensuel) Commerçant + PPT Services à la personne" },
    { date: "2026-10-04", heures: 4, note: "PPT T3 Régions" },
  ],
};
