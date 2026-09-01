/* Suivi des heures — logique + navigation par onglets (mois) — vanilla JS */
(function () {
  "use strict";

  const DATA = window.SUIVI || { config: {}, heures: [] };
  const cfg = DATA.config;
  const rate = Number(cfg.tarifHoraire) || 0;
  const target = Number(cfg.heuresParSemaine) || 0;
  const devise = cfg.devise || "€";

  // ---------- Helpers dates (lundi = début de semaine) ----------
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
  function addDays(date, n) { const d = new Date(date); d.setDate(d.getDate() + n); return d; }
  function fmtDate(date) { return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }); }
  function fmtDateLong(date) {
    const d = date.getDate();
    return `${d === 1 ? "1er" : d} ${MOIS[date.getMonth()]} ${date.getFullYear()}`;
  }
  function fmtDateShort(date) { return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" }); }
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
  const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
  const MOIS_COURT = ["Janv.", "Févr.", "Mars", "Avr.", "Mai", "Juin", "Juil.", "Août", "Sept.", "Oct.", "Nov.", "Déc."];
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

  // ---------- Données de base ----------
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const debutRaw = parseDate(cfg.debut);
  const debut = startOfWeek(debutRaw);

  const entries = (DATA.heures || [])
    .filter((e) => e && e.date && Number(e.heures) > 0)
    .map((e) => ({ date: parseDate(e.date), heures: Number(e.heures), note: e.note || "" }))
    .sort((a, b) => a.date - b.date);

  // Nombre de lundis (débuts de semaine) sur [from, to] inclus, alignés à debut
  function countWeeksBetween(fromMonday, toDate) {
    if (toDate < fromMonday) return 0;
    return Math.floor((startOfWeek(toDate) - fromMonday) / (7 * 864e5)) + 1;
  }

  // ---------- Onglets (Général + un par mois de la mission jusqu'à décembre) ----------
  const startYear = debutRaw.getFullYear();
  const startMonth = debutRaw.getMonth(); // 0-based
  const months = [];
  for (let m = startMonth; m <= 11; m++) months.push({ y: startYear, m });

  const tabsEl = document.getElementById("tabs");
  const tabDefs = [{ id: "general", label: "Général" }].concat(
    months.map((mm) => ({ id: `${mm.y}-${mm.m}`, label: MOIS_COURT[mm.m] + " " + String(mm.y).slice(2), scope: mm }))
  );
  let activeTab = "general";

  tabDefs.forEach((t) => {
    const b = document.createElement("button");
    b.className = "tab";
    b.type = "button";
    b.textContent = t.label;
    b.dataset.id = t.id;
    b.addEventListener("click", () => selectTab(t.id));
    tabsEl.appendChild(b);
  });

  function selectTab(id) {
    activeTab = id;
    Array.from(tabsEl.children).forEach((b) => b.classList.toggle("active", b.dataset.id === id));
    const def = tabDefs.find((t) => t.id === id);
    render(def && def.scope ? def.scope : "general");
  }

  // ---------- Header (toujours global) ----------
  const $ = (id) => document.getElementById(id);
  const totalHeuresGlobal = entries.reduce((s, e) => s + e.heures, 0);
  const weeksElapsedGlobal = countWeeksBetween(debut, today);
  const attenduGlobal = weeksElapsedGlobal * target;
  const avanceGlobal = totalHeuresGlobal - attenduGlobal;

  const prestataire = cfg.prestataire || "Prestataire";
  $("titrePrestataire").textContent = prestataire;
  const clientNom = (cfg.client || "").trim();
  $("titreClient").textContent = clientNom;
  // Masque le séparateur et le client si aucun client n'est renseigné
  document.querySelectorAll("h1 .sep, h1 .client").forEach((el) => {
    el.style.display = clientNom ? "" : "none";
  });
  $("monogram").textContent = (prestataire.trim()[0] || "•").toUpperCase();
  $("sousTitre").textContent = `Objectif ${fmtH(target)}/semaine · depuis le ${fmtDateLong(debutRaw)}`;
  $("maj").textContent = "Mis à jour le " + now.toLocaleString("fr-FR", { dateStyle: "long", timeStyle: "short" });

  const chip = $("statusChip");
  chip.classList.add(weeksElapsedGlobal === 0 ? "" : avanceGlobal >= 0 ? "ok" : "warn");
  $("statusChipText").textContent =
    weeksElapsedGlobal === 0 ? "Mission à venir"
      : avanceGlobal >= 0 ? `En avance de ${fmtH(avanceGlobal)}` : `En retard de ${fmtH(Math.abs(avanceGlobal))}`;

  // ---------- Rendu d'un scope ('general' | {y,m}) ----------
  const C = 2 * Math.PI * 52;

  function render(scope) {
    const isMonth = scope !== "general";
    const scoped = isMonth
      ? entries.filter((e) => e.date.getFullYear() === scope.y && e.date.getMonth() === scope.m)
      : entries;

    const totalHeures = scoped.reduce((s, e) => s + e.heures, 0);
    const totalGains = totalHeures * rate;

    // Regroupement par semaine
    const byWeek = new Map();
    scoped.forEach((e) => {
      const k = weekKey(e.date);
      if (!byWeek.has(k)) byWeek.set(k, { start: startOfWeek(e.date), heures: 0 });
      byWeek.get(k).heures += e.heures;
    });

    if (isMonth) renderMonth(scope, scoped, totalHeures, totalGains, byWeek);
    else renderGeneral(totalHeures, totalGains, byWeek);
  }

  // ----- Vue Générale -----
  function renderGeneral(totalHeures, totalGains, byWeek) {
    const currentWeekKey = weekKey(today);
    const cur = byWeek.get(currentWeekKey) || { heures: 0 };
    const semaineHeures = cur.heures;
    const semaineReste = Math.max(0, target - semaineHeures);
    const semainePct = target > 0 ? Math.min(100, (semaineHeures / target) * 100) : 0;
    const lundi = startOfWeek(today);

    $("ringCardTitle").textContent = "Cette semaine";
    $("semainePeriode").textContent = `${fmtDateShort(lundi)} – ${fmtDateShort(addDays(lundi, 6))}`;
    setRing(semaineHeures, target, semainePct);
    $("semaineReste").textContent = semaineHeures >= target
      ? "🎉 Objectif de la semaine atteint !"
      : `Il te reste ${fmtH(semaineReste)} à faire cette semaine.`;

    $("avanceCardTitle").textContent = "Avance cumulée";
    setAvance(avanceGlobal, weeksElapsedGlobal === 0
      ? "La mission n'a pas encore commencé."
      : `${fmtH(totalHeures)} réalisées sur ${fmtH(attenduGlobal)} attendues (${weeksElapsedGlobal} sem.)`,
      totalHeures, attenduGlobal, weeksElapsedGlobal === 0);

    // KPIs
    $("lblTotal").textContent = "Total heures réalisées";
    $("totalHeures").textContent = fmtH(totalHeures);
    $("lblMoyenne").textContent = "Moyenne par semaine";
    $("moyenne").textContent = weeksElapsedGlobal > 0 ? fmtH(totalHeures / weeksElapsedGlobal) : fmtH(0);
    $("lblNb").textContent = "Semaines écoulées";
    $("nbSemaines").textContent = String(weeksElapsedGlobal);

    // Récap : toutes les semaines écoulées depuis le début
    const weekRows = [];
    for (let i = 0; i < weeksElapsedGlobal; i++) {
      const start = addDays(debut, i * 7);
      const w = byWeek.get(weekKey(start));
      weekRows.push({ start, heures: w ? w.heures : 0 });
    }
    byWeek.forEach((w, k) => { if (!weekRows.some((r) => weekKey(r.start) === k)) weekRows.push({ start: w.start, heures: w.heures }); });

    renderWeeksTable(weekRows, currentWeekKey);
    renderChart(weekRows.slice().sort((a, b) => a.start - b.start).slice(-12));
    $("panelLog").style.display = "none"; // pas de détail des séances en vue Générale
  }

  // ----- Vue Mois -----
  function renderMonth(scope, scoped, totalHeures, totalGains, byWeek) {
    const nomMois = cap(MOIS[scope.m]) + " " + scope.y;

    // Semaines "possédées" par le mois = celles dont le JEUDI tombe dans le mois
    // (règle ISO). Évite qu'une semaine à cheval fausse le compte.
    const mondays = [];
    let w = startOfWeek(new Date(scope.y, scope.m, 1));
    for (let guard = 0; guard < 8; guard++, w = addDays(w, 7)) {
      const thu = addDays(w, 3);
      if (thu.getFullYear() > scope.y || (thu.getFullYear() === scope.y && thu.getMonth() > scope.m)) break;
      if (thu.getMonth() === scope.m && thu.getFullYear() === scope.y && w >= debut) mondays.push(new Date(w));
    }
    // Objectif du mois : override éventuel dans la config, sinon nb de semaines × cible
    const override = (cfg.objectifsMois || {})[scope.m + 1];
    const objectif = override != null ? Number(override) : mondays.length * target;
    const reste = Math.max(0, objectif - totalHeures);
    const pct = objectif > 0 ? Math.min(100, (totalHeures / objectif) * 100) : (totalHeures > 0 ? 100 : 0);
    const semTravaillees = Array.from(byWeek.values()).filter((x) => x.heures > 0).length;

    // Carte anneau : progression du mois
    $("ringCardTitle").textContent = "Progression — " + nomMois;
    $("semainePeriode").textContent = mondays.length + " sem.";
    setRing(totalHeures, objectif, pct);
    $("semaineReste").textContent = objectif > 0 && totalHeures >= objectif
      ? "🎉 Objectif du mois atteint !"
      : totalHeures > 0 ? `Il reste ${fmtH(reste)} pour l'objectif du mois.` : "Aucune heure saisie ce mois-ci.";

    // Carte 2 : Objectif du mois (neutre, pas d'avance -> pas d'ambiguïté)
    $("avanceCardTitle").textContent = "Objectif — " + nomMois;
    const av = $("avanceValeur");
    av.classList.remove("pos", "neg");
    av.textContent = fmtH(objectif);
    $("avanceLabel").textContent = "visé";
    $("avanceDetail").textContent = `${fmtH(totalHeures)} réalisées · reste ${fmtH(reste)}`;
    const card = $("cardAvance");
    card.classList.remove("ok", "warn");
    $("avanceFill").style.width = pct + "%";

    // KPIs (mois)
    $("lblTotal").textContent = "Total heures du mois";
    $("totalHeures").textContent = fmtH(totalHeures);
    $("lblMoyenne").textContent = "Moyenne par semaine";
    $("moyenne").textContent = semTravaillees > 0 ? fmtH(totalHeures / semTravaillees) : fmtH(0);
    $("lblNb").textContent = "Semaines travaillées";
    $("nbSemaines").textContent = String(semTravaillees);

    // Récap par semaine : toutes les semaines du mois (+ éventuels extras)
    const weekRows = mondays.map((start) => {
      const wk = byWeek.get(weekKey(start));
      return { start, heures: wk ? wk.heures : 0 };
    });
    byWeek.forEach((wk, k) => { if (!weekRows.some((r) => weekKey(r.start) === k)) weekRows.push({ start: wk.start, heures: wk.heures }); });

    renderWeeksTable(weekRows, weekKey(today));
    renderChart(weekRows.slice().sort((a, b) => a.start - b.start));
    $("panelLog").style.display = ""; // détail des séances visible dans la vue mois
    renderLog(scoped.slice(), true);
  }

  // ---------- Sous-rendus partagés ----------
  function setRing(hours, denom, pct) {
    $("semaineHeures").textContent = fmtH(hours);
    $("semaineObjectif").textContent = "/ " + fmtH(denom);
    $("ringFg").style.strokeDashoffset = String(C * (1 - pct / 100));
    $("ringPct").textContent = Math.round(pct) + "%";
    $("ring").classList.toggle("full", denom > 0 && hours >= denom);
  }

  function setAvance(avance, detail, totalH, attendu, neutral) {
    const el = $("avanceValeur");
    el.classList.remove("pos", "neg");
    const pos = avance >= 0;
    el.textContent = (pos ? "+" : "−") + fmtH(Math.abs(avance)).replace(" h", "") + " h";
    el.classList.add(pos ? "pos" : "neg");
    $("avanceLabel").textContent = neutral ? "" : pos ? "d'avance" : "de retard";
    $("avanceDetail").textContent = detail;
    const card = $("cardAvance");
    card.classList.remove("ok", "warn");
    if (!neutral) card.classList.add(pos ? "ok" : "warn");
    const avancePct = attendu > 0 ? Math.min(100, (totalH / attendu) * 100) : totalH > 0 ? 100 : 0;
    $("avanceFill").style.width = avancePct + "%";
  }

  function statusPill(h, t) {
    if (t > 0 && h >= t) return `<span class="pill good">Atteint</span>`;
    if (h === 0) return `<span class="pill neutral">—</span>`;
    return `<span class="pill warn">${fmtH(t - h)} manquantes</span>`;
  }

  function renderWeeksTable(weekRows, currentWeekKey) {
    weekRows.sort((a, b) => b.start - a.start);
    const tb = $("tbodyWeeks");
    tb.innerHTML = "";
    weekRows.forEach((r) => {
      const objAtteint = target > 0 && r.heures >= target;
      const isCurrent = weekKey(r.start) === currentWeekKey;
      const tr = document.createElement("tr");
      if (isCurrent) tr.classList.add("current");
      tr.innerHTML = `
        <td class="mono">${fmtDateShort(r.start)} – ${fmtDateShort(addDays(r.start, 6))}${isCurrent ? ' <span class="tag">en cours</span>' : ""}</td>
        <td class="right ${objAtteint ? "good" : r.heures > 0 ? "" : "muted"}">${fmtH(r.heures)}</td>
        <td class="right muted">${fmtH(target)}</td>
        <td class="right">${statusPill(r.heures, target)}</td>`;
      tb.appendChild(tr);
    });
    if (weekRows.length === 0)
      tb.innerHTML = `<tr><td colspan="4" class="muted center">Aucune semaine à afficher.</td></tr>`;
  }

  function renderChart(chartWeeks) {
    const chart = $("chart");
    chart.innerHTML = "";
    const maxH = Math.max(target, ...chartWeeks.map((w) => w.heures), 1);
    chartWeeks.forEach((w) => {
      const col = document.createElement("div"); col.className = "bar-col";
      const wrap = document.createElement("div"); wrap.className = "bar-wrap";
      const bar = document.createElement("div");
      bar.className = "bar" + (target > 0 && w.heures >= target ? " good" : "");
      bar.style.height = (w.heures / maxH) * 100 + "%";
      bar.title = `${fmtDateShort(w.start)} : ${fmtH(w.heures)}`;
      wrap.appendChild(bar);
      const lbl = document.createElement("div"); lbl.className = "bar-lbl"; lbl.textContent = fmtDateShort(w.start);
      col.appendChild(wrap); col.appendChild(lbl); chart.appendChild(col);
    });
    if (chartWeeks.length) {
      const line = document.createElement("div"); line.className = "chart-target";
      line.style.bottom = (target / maxH) * 100 + "%";
      line.innerHTML = `<span>objectif ${fmtH(target)}</span>`;
      chart.appendChild(line);
    } else {
      chart.innerHTML = `<div class="muted" style="align-self:center;margin:auto">Aucune donnée pour cette période.</div>`;
    }
  }

  function renderLog(list, isMonth) {
    const tb = $("tbodyLog");
    tb.innerHTML = "";
    list.sort((a, b) => a.date - b.date).forEach((e) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td class="mono">${fmtDate(e.date)}</td>
        <td class="right mono">${fmtH(e.heures)}</td>
        <td>${escapeHtml(e.note)}</td>`;
      tb.appendChild(tr);
    });
    if (list.length === 0)
      tb.innerHTML = `<tr><td colspan="3" class="muted center">${isMonth ? "Aucune séance ce mois-ci." : "Aucune séance saisie. Ajoute tes heures dans data.js."}</td></tr>`;
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  // ---------- Démarrage ----------
  selectTab("general");
})();
