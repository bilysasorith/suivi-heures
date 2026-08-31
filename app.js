/* Suivi des heures — logique de calcul et rendu (aucune dépendance externe) */
(function () {
  "use strict";

  const DATA = window.SUIVI || { config: {}, heures: [] };
  const cfg = DATA.config;
  const rate = Number(cfg.tarifHoraire) || 0;
  const target = Number(cfg.heuresParSemaine) || 0;
  const devise = cfg.devise || "€";

  // ---------- Helpers dates (ISO week, lundi = début de semaine) ----------
  function parseDate(s) {
    const [y, m, d] = String(s).split("-").map(Number);
    return new Date(y, (m || 1) - 1, d || 1);
  }
  function startOfWeek(date) {
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const day = (d.getDay() + 6) % 7; // lundi = 0
    d.setDate(d.getDate() - day);
    return d;
  }
  function addDays(date, n) {
    const d = new Date(date);
    d.setDate(d.getDate() + n);
    return d;
  }
  function fmtDate(date) {
    return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
  }
  function fmtDateShort(date) {
    return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
  }
  function weekKey(date) {
    const s = startOfWeek(date);
    return `${s.getFullYear()}-${String(s.getMonth() + 1).padStart(2, "0")}-${String(s.getDate()).padStart(2, "0")}`;
  }
  function fmtH(h) {
    const val = Math.round(h * 100) / 100;
    return (Number.isInteger(val) ? val : val.toFixed(2).replace(/0$/, "")) + " h";
  }
  function fmtMoney(n) {
    return new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(n) + " " + devise;
  }

  // ---------- Calculs ----------
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const debut = startOfWeek(parseDate(cfg.debut));

  const entries = (DATA.heures || [])
    .filter((e) => e && e.date && Number(e.heures) > 0)
    .map((e) => ({ date: parseDate(e.date), heures: Number(e.heures), note: e.note || "" }))
    .sort((a, b) => a.date - b.date);

  const totalHeures = entries.reduce((s, e) => s + e.heures, 0);
  const totalGains = totalHeures * rate;

  // Nombre de semaines écoulées (semaine en cours incluse) depuis le début
  let weeksElapsed = 0;
  if (today >= debut) {
    weeksElapsed = Math.floor((startOfWeek(today) - debut) / (7 * 864e5)) + 1;
  }
  const attendu = weeksElapsed * target;
  const avance = totalHeures - attendu; // >0 = en avance, <0 = en retard

  // Regroupement par semaine
  const byWeek = new Map();
  entries.forEach((e) => {
    const k = weekKey(e.date);
    if (!byWeek.has(k)) byWeek.set(k, { start: startOfWeek(e.date), heures: 0, entries: [] });
    const w = byWeek.get(k);
    w.heures += e.heures;
    w.entries.push(e);
  });

  const currentWeekKey = weekKey(today);
  const currentWeek = byWeek.get(currentWeekKey) || { heures: 0, entries: [] };
  const semaineHeures = currentWeek.heures;
  const semaineReste = Math.max(0, target - semaineHeures);
  const semainePct = target > 0 ? Math.min(100, (semaineHeures / target) * 100) : 0;

  // ---------- Rendu ----------
  const $ = (id) => document.getElementById(id);

  $("titrePrestataire").textContent = cfg.prestataire || "Prestataire";
  $("titreClient").textContent = cfg.client || "";
  $("sousTitre").textContent =
    `Objectif : ${fmtH(target)}/semaine · ${fmtMoney(rate)}/heure · depuis le ${fmtDate(debut)}`;
  $("maj").textContent = "Mis à jour : " + now.toLocaleString("fr-FR", { dateStyle: "long", timeStyle: "short" });

  // Carte semaine en cours
  $("semaineHeures").textContent = fmtH(semaineHeures);
  $("semaineObjectif").textContent = "/ " + fmtH(target);
  $("semaineBar").style.width = semainePct + "%";
  $("semaineBar").classList.toggle("full", semaineHeures >= target);
  const lundi = startOfWeek(today);
  $("semainePeriode").textContent = `Semaine du ${fmtDateShort(lundi)} au ${fmtDateShort(addDays(lundi, 6))}`;
  $("semaineReste").textContent =
    semaineHeures >= target
      ? "🎉 Objectif de la semaine atteint !"
      : `Il te reste ${fmtH(semaineReste)} à faire cette semaine`;

  // Carte avance
  const avanceEl = $("avanceValeur");
  const enAvance = avance >= 0;
  avanceEl.textContent = (enAvance ? "+" : "−") + fmtH(Math.abs(avance)).replace(" h", "") + " h";
  avanceEl.classList.add(enAvance ? "pos" : "neg");
  $("avanceLabel").textContent = enAvance ? "d'avance" : "de retard";
  $("avanceDetail").textContent =
    weeksElapsed === 0
      ? "La mission n'a pas encore commencé."
      : `${fmtH(totalHeures)} faites sur ${fmtH(attendu)} attendues (${weeksElapsed} sem.)`;
  $("cardAvance").classList.add(enAvance ? "ok" : "warn");

  // Cartes totaux
  $("totalHeures").textContent = fmtH(totalHeures);
  $("totalGains").textContent = fmtMoney(totalGains);
  $("nbSemaines").textContent = String(weeksElapsed);

  // Tableau par semaine (du début à aujourd'hui, incluant semaines à 0h)
  const weekRows = [];
  if (weeksElapsed > 0) {
    for (let i = 0; i < weeksElapsed; i++) {
      const start = addDays(debut, i * 7);
      const k = weekKey(start);
      const w = byWeek.get(k);
      const h = w ? w.heures : 0;
      weekRows.push({ start, heures: h });
    }
  }
  // Ajoute aussi d'éventuelles semaines saisies hors période (avant début / futur)
  byWeek.forEach((w, k) => {
    if (!weekRows.some((r) => weekKey(r.start) === k)) weekRows.push({ start: w.start, heures: w.heures });
  });
  weekRows.sort((a, b) => b.start - a.start); // plus récentes en haut

  const tbodyWeeks = $("tbodyWeeks");
  tbodyWeeks.innerHTML = "";
  let cumul = 0;
  const cumuls = {};
  [...weekRows].sort((a, b) => a.start - b.start).forEach((r) => { cumul += r.heures; cumuls[weekKey(r.start)] = cumul; });

  weekRows.forEach((r, idx) => {
    const objAtteint = r.heures >= target;
    const isCurrent = weekKey(r.start) === currentWeekKey;
    const numSemaine = weeksElapsed - idx; // approx numéro de semaine
    const tr = document.createElement("tr");
    if (isCurrent) tr.classList.add("current");
    tr.innerHTML = `
      <td class="mono">${fmtDateShort(r.start)} – ${fmtDateShort(addDays(r.start, 6))}${isCurrent ? ' <span class="tag">en cours</span>' : ""}</td>
      <td class="right ${objAtteint ? "good" : r.heures > 0 ? "" : "muted"}">${fmtH(r.heures)}</td>
      <td class="right muted">${fmtH(target)}</td>
      <td class="right">${statusPill(r.heures, target)}</td>
      <td class="right mono">${fmtMoney(r.heures * rate)}</td>
    `;
    tbodyWeeks.appendChild(tr);
  });
  if (weekRows.length === 0) {
    tbodyWeeks.innerHTML = `<tr><td colspan="5" class="muted center">Aucune semaine à afficher pour le moment.</td></tr>`;
  }

  function statusPill(h, t) {
    if (h >= t) return `<span class="pill good">Atteint</span>`;
    if (h === 0) return `<span class="pill neutral">—</span>`;
    return `<span class="pill warn">${fmtH(t - h)} manquantes</span>`;
  }

  // Détail des séances (les plus récentes en haut)
  const tbodyLog = $("tbodyLog");
  tbodyLog.innerHTML = "";
  [...entries].sort((a, b) => b.date - a.date).forEach((e) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="mono">${fmtDate(e.date)}</td>
      <td class="right mono">${fmtH(e.heures)}</td>
      <td>${escapeHtml(e.note)}</td>
      <td class="right mono muted">${fmtMoney(e.heures * rate)}</td>
    `;
    tbodyLog.appendChild(tr);
  });
  if (entries.length === 0) {
    tbodyLog.innerHTML = `<tr><td colspan="4" class="muted center">Aucune séance saisie. Ajoute tes heures dans le fichier data.js.</td></tr>`;
  }

  // Mini graphique en barres (heures par semaine)
  const chart = $("chart");
  chart.innerHTML = "";
  const chartWeeks = [...weekRows].sort((a, b) => a.start - b.start).slice(-12); // 12 dernières
  const maxH = Math.max(target, ...chartWeeks.map((w) => w.heures), 1);
  chartWeeks.forEach((w) => {
    const col = document.createElement("div");
    col.className = "bar-col";
    const barWrap = document.createElement("div");
    barWrap.className = "bar-wrap";
    const bar = document.createElement("div");
    bar.className = "bar" + (w.heures >= target ? " good" : "");
    bar.style.height = (w.heures / maxH) * 100 + "%";
    bar.title = `${fmtDateShort(w.start)} : ${fmtH(w.heures)}`;
    barWrap.appendChild(bar);
    const lbl = document.createElement("div");
    lbl.className = "bar-lbl";
    lbl.textContent = fmtDateShort(w.start);
    col.appendChild(barWrap);
    col.appendChild(lbl);
    chart.appendChild(col);
  });
  // ligne d'objectif
  if (chartWeeks.length) {
    const line = document.createElement("div");
    line.className = "chart-target";
    line.style.bottom = (target / maxH) * 100 + "%";
    line.innerHTML = `<span>objectif ${fmtH(target)}</span>`;
    chart.appendChild(line);
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }
})();
