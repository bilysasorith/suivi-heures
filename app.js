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
  function fmtRange(a, b) {
    const mois = a.toLocaleDateString("fr-FR", { month: "short" });
    if (a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear())
      return `${a.getDate()}–${b.getDate()} ${mois}`;
    return `${fmtDateShort(a)} – ${fmtDateShort(b)}`;
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
  const isFuture = (mm) => mm.y > today.getFullYear() || (mm.y === today.getFullYear() && mm.m > today.getMonth());
  const tabDefs = [{ id: "general", label: "Général" }].concat(
    months.map((mm) => ({ id: `${mm.y}-${mm.m}`, label: MOIS_COURT[mm.m] + " " + String(mm.y).slice(2), scope: mm, future: isFuture(mm) }))
  );
  let activeTab = "general";

  tabDefs.forEach((t) => {
    const b = document.createElement("button");
    b.className = "tab";
    b.type = "button";
    b.textContent = t.label;
    b.dataset.id = t.id;
    if (t.future) {
      b.classList.add("disabled");
      b.disabled = true;
      b.title = "Mois à venir";
    } else {
      b.addEventListener("click", () => selectTab(t.id));
    }
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

  const prestataire = (cfg.prestataire || "").trim();
  const clientNom = (cfg.client || "").trim();
  const eyebrowEl = document.querySelector(".eyebrow");
  if (prestataire) {
    $("titrePrestataire").textContent = prestataire;
    $("titreClient").textContent = clientNom;
    $("monogram").textContent = (prestataire[0] || "•").toUpperCase();
    if (eyebrowEl) eyebrowEl.style.display = "";
  } else {
    // Pas de nom : titre générique, monogramme neutre, on masque l'eyebrow (redondant)
    $("titrePrestataire").textContent = "Suivi des heures";
    $("titreClient").textContent = "";
    $("monogram").textContent = "⏱️";
    if (eyebrowEl) eyebrowEl.style.display = "none";
  }
  // Masque le séparateur et le client si aucun client n'est renseigné
  document.querySelectorAll("h1 .sep, h1 .client").forEach((el) => {
    el.style.display = clientNom ? "" : "none";
  });
  $("sousTitre").textContent = `Objectif ${fmtH(target)}/semaine · depuis le ${fmtDateLong(debut)}`;
  $("maj").textContent = "Mis à jour le " + now.toLocaleString("fr-FR", { dateStyle: "long", timeStyle: "short" });

  const chip = $("statusChip");
  chip.classList.add(weeksElapsedGlobal === 0 ? "" : avanceGlobal >= 0 ? "ok" : "warn");
  $("statusChipText").textContent =
    weeksElapsedGlobal === 0 ? "Mission à venir"
      : avanceGlobal >= 0 ? `En avance de ${fmtH(avanceGlobal)}` : `En retard de ${fmtH(Math.abs(avanceGlobal))}`;

  // ---------- Animations ----------
  const prefersReduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function countUp(el, to, fmt, dur) {
    if (!el) return;
    if (prefersReduced) { el.textContent = fmt(to); return; }
    dur = dur || 850;
    const start = performance.now();
    function tick(now) {
      const t = Math.min(1, (now - start) / dur);
      const e = 1 - Math.pow(1 - t, 3); // easeOutCubic
      el.textContent = fmt(to * e);
      if (t < 1) requestAnimationFrame(tick);
      else el.textContent = fmt(to);
    }
    requestAnimationFrame(tick);
  }

  function reveal() {
    if (prefersReduced) return;
    const els = document.querySelectorAll(".hero > .card, .kpi, .panel");
    els.forEach((el, i) => {
      if (el.offsetParent === null) return; // ignore les éléments masqués
      el.style.animation = "none";
      void el.offsetWidth; // reflow pour rejouer l'animation
      el.style.animation = `riseIn .55s cubic-bezier(.2,.8,.2,1) ${i * 55}ms both`;
      el.addEventListener("animationend", () => { el.style.animation = ""; }, { once: true });
    });
  }

  // ---------- Thème clair/sombre ----------
  (function themeToggle() {
    const btn = document.getElementById("themeBtn");
    if (!btn) return;
    const root = document.documentElement;
    const systemDark = () => window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    function current() {
      return root.getAttribute("data-theme") || (systemDark() ? "dark" : "light");
    }
    function paint() { btn.textContent = current() === "dark" ? "☀️" : "🌙"; }
    paint();
    btn.addEventListener("click", () => {
      const next = current() === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      try { localStorage.setItem("theme", next); } catch (e) {}
      paint();
    });
  })();

  // ---------- Confettis (objectif atteint) ----------
  function launchConfetti() {
    if (prefersReduced) return;
    const cv = document.getElementById("confetti");
    if (!cv) return;
    cv.style.display = "block";
    const ctx = cv.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = innerWidth * dpr; cv.height = innerHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const colors = ["#2b57e6", "#5b8bff", "#0f9d63", "#f0b45c", "#ffffff"];
    const parts = [];
    for (let i = 0; i < 140; i++) {
      parts.push({
        x: innerWidth / 2 + (Math.random() - .5) * 160, y: innerHeight * 0.3,
        vx: (Math.random() - .5) * 11, vy: Math.random() * -10 - 4,
        g: 0.26 + Math.random() * 0.12, s: 5 + Math.random() * 6,
        rot: Math.random() * Math.PI, vr: (Math.random() - .5) * 0.32,
        col: colors[i % colors.length],
      });
    }
    const start = performance.now();
    function frame(now) {
      const t = now - start;
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      let alive = false;
      const a = Math.max(0, 1 - t / 2600);
      parts.forEach((p) => {
        p.vy += p.g; p.x += p.vx; p.y += p.vy; p.rot += p.vr; p.vx *= 0.99;
        if (p.y < innerHeight + 24 && a > 0) alive = true;
        ctx.save(); ctx.globalAlpha = a; ctx.translate(p.x, p.y); ctx.rotate(p.rot);
        ctx.fillStyle = p.col; ctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * 0.6); ctx.restore();
      });
      if (alive && t < 3200) requestAnimationFrame(frame);
      else { ctx.clearRect(0, 0, innerWidth, innerHeight); cv.style.display = "none"; }
    }
    requestAnimationFrame(frame);
  }

  // ---------- Tooltip du graphique ----------
  const tip = document.getElementById("chartTip");
  function showTip(html, x, y) {
    if (!tip) return;
    tip.innerHTML = html; tip.classList.add("show");
    tip.style.left = Math.min(x + 14, innerWidth - 140) + "px";
    tip.style.top = (y - 44) + "px";
  }
  function hideTip() { if (tip) tip.classList.remove("show"); }

  // ---------- Courbe de tendance cumulée (SVG) ----------
  function renderTrend(rows, weeklyTarget) {
    const host = document.getElementById("trend");
    if (!host) return;
    const asc = rows.slice().sort((a, b) => a.start - b.start);
    if (asc.length === 0) { host.innerHTML = `<div class="empty">Aucune donnée pour cette période.</div>`; return; }

    let cum = 0;
    const pts = asc.map((r, i) => { cum += r.heures; return { i, start: r.start, real: cum, obj: (i + 1) * weeklyTarget }; });
    const n = pts.length;
    // Largeur = largeur réelle du conteneur => texte net et non déformé sur mobile
    const W = Math.max(320, Math.round(host.clientWidth || 800));
    const narrow = W < 480;
    const H = narrow ? 200 : 240;
    const PL = narrow ? 34 : 44, PR = 14, PT = 16, PB = 32;
    const maxY = Math.max(pts[n - 1].real, pts[n - 1].obj, 1);
    const x = (i) => PL + (n === 1 ? (W - PL - PR) / 2 : (i / (n - 1)) * (W - PL - PR));
    const y = (v) => PT + (1 - v / maxY) * (H - PT - PB);

    const realPts = pts.map((p) => `${x(p.i).toFixed(1)},${y(p.real).toFixed(1)}`);
    const objPts = pts.map((p) => `${x(p.i).toFixed(1)},${y(p.obj).toFixed(1)}`).join(" ");
    const areaD = `M ${x(0).toFixed(1)},${y(0).toFixed(1)} L ${realPts.join(" L ")} L ${x(n - 1).toFixed(1)},${y(0).toFixed(1)} Z`;
    const lineD = `M ${realPts.join(" L ")}`;

    // repères horizontaux (0, moitié, max)
    const grid = [0, maxY / 2, maxY].map((v) =>
      `<line class="grid-line" x1="${PL}" y1="${y(v).toFixed(1)}" x2="${W - PR}" y2="${y(v).toFixed(1)}"/>` +
      `<text class="axis-lbl" x="${PL - 8}" y="${(y(v) + 3).toFixed(1)}" text-anchor="end">${Math.round(v)} h</text>`
    ).join("");

    // étiquettes X (espacées selon la largeur dispo)
    const step = Math.max(1, Math.ceil(n / Math.max(3, Math.floor((W - PL - PR) / 90))));
    const xlabels = pts.map((p) =>
      (p.i % step === 0 || p.i === n - 1)
        ? `<text class="axis-lbl" x="${x(p.i).toFixed(1)}" y="${H - 12}" text-anchor="middle">${fmtDateShort(p.start)}</text>` : ""
    ).join("");

    const dots = pts.map((p, k) =>
      `<circle class="dot${k === n - 1 ? " last" : ""}" cx="${x(p.i).toFixed(1)}" cy="${y(p.real).toFixed(1)}" r="${k === n - 1 ? 5 : 3.5}"/>`
    ).join("");
    // Zones de survol invisibles pour l'info-bulle
    const hits = pts.map((p) =>
      `<circle class="hit" data-i="${p.i}" cx="${x(p.i).toFixed(1)}" cy="${y(p.real).toFixed(1)}" r="14" fill="transparent" style="pointer-events:all;cursor:pointer"/>`
    ).join("");

    host.innerHTML = `
      <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="Tendance cumulée">
        <defs>
          <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="var(--brand)" stop-opacity="0.28"/>
            <stop offset="1" stop-color="var(--brand)" stop-opacity="0"/>
          </linearGradient>
          <linearGradient id="trendLine" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stop-color="var(--brand-2)"/>
            <stop offset="1" stop-color="var(--brand)"/>
          </linearGradient>
        </defs>
        ${grid}
        <polyline class="obj-line" points="${objPts}"/>
        <path class="real-area" d="${areaD}"/>
        <path class="real-line" d="${lineD}"/>
        ${dots}
        ${xlabels}
        ${hits}
      </svg>`;

    // Info-bulle au survol des points
    host.querySelectorAll(".hit").forEach((c) => {
      const p = pts[+c.getAttribute("data-i")];
      const html = `<b>${fmtDateShort(p.start)}</b> · ${fmtH(p.real)} cumulées`;
      c.addEventListener("mousemove", (e) => showTip(html, e.clientX, e.clientY));
      c.addEventListener("mouseleave", hideTip);
    });

    if (!prefersReduced) {
      const line = host.querySelector(".real-line");
      const len = line.getTotalLength();
      line.style.setProperty("--len", len);
      line.style.strokeDasharray = len;
      line.classList.add("draw");
    }
  }

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
    reveal();
  }

  // ----- Vue Générale -----
  function renderGeneral(totalHeures, totalGains, byWeek) {
    // Vue complète : on réaffiche tout
    $("cardAvance").style.display = "";
    $("panelTrend").style.display = "";
    document.getElementById("hero").classList.remove("solo");

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
    countUp($("totalHeures"), totalHeures, (v) => fmtH(v));
    $("lblMoyenne").textContent = "Moyenne par semaine";
    countUp($("moyenne"), weeksElapsedGlobal > 0 ? totalHeures / weeksElapsedGlobal : 0, (v) => fmtH(v));
    $("lblNb").textContent = "Semaines écoulées";
    countUp($("nbSemaines"), weeksElapsedGlobal, (v) => String(Math.round(v)));

    // Récap : toutes les semaines écoulées depuis le début
    const weekRows = [];
    for (let i = 0; i < weeksElapsedGlobal; i++) {
      const start = addDays(debut, i * 7);
      const w = byWeek.get(weekKey(start));
      weekRows.push({ start, heures: w ? w.heures : 0 });
    }
    byWeek.forEach((w, k) => { if (!weekRows.some((r) => weekKey(r.start) === k)) weekRows.push({ start: w.start, heures: w.heures }); });

    renderWeeksTable(weekRows, currentWeekKey);
    renderChart(weekRows.slice().sort((a, b) => a.start - b.start).slice(-(window.innerWidth < 560 ? 8 : 12)));
    renderTrend(weekRows, target);
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

    // Vue mois épurée : on masque la carte "Objectif" (doublon de l'anneau)
    // et la courbe "Tendance cumulée" (peu utile sur un seul mois).
    $("cardAvance").style.display = "none";
    $("panelTrend").style.display = "none";
    document.getElementById("hero").classList.add("solo");

    // KPIs (mois)
    $("lblTotal").textContent = "Total heures du mois";
    countUp($("totalHeures"), totalHeures, (v) => fmtH(v));
    $("lblMoyenne").textContent = "Moyenne par semaine";
    countUp($("moyenne"), semTravaillees > 0 ? totalHeures / semTravaillees : 0, (v) => fmtH(v));
    $("lblNb").textContent = "Semaines travaillées";
    countUp($("nbSemaines"), semTravaillees, (v) => String(Math.round(v)));

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
    countUp($("semaineHeures"), hours, (v) => fmtH(v));
    $("semaineObjectif").textContent = "/ " + fmtH(denom);
    $("ringFg").style.strokeDashoffset = String(C * (1 - pct / 100));
    countUp($("ringPct"), pct, (v) => Math.round(v) + "%");
    const reached = denom > 0 && hours >= denom;
    $("ring").classList.toggle("full", reached);
    if (reached) setTimeout(launchConfetti, 450); // 🎉 objectif atteint
  }

  function setAvance(avance, detail, totalH, attendu, neutral) {
    const el = $("avanceValeur");
    el.classList.remove("pos", "neg");
    const pos = avance >= 0;
    countUp(el, Math.abs(avance), (v) => (pos ? "+" : "−") + fmtH(v).replace(" h", "") + " h");
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
    return `<span class="pill warn">${fmtH(t - h)}<span class="pill-extra"> manquantes</span></span>`;
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
        <td class="mono nowrap">${fmtRange(r.start, addDays(r.start, 6))}${isCurrent ? ' <span class="tag">en cours</span>' : ""}</td>
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
    const maxH = Math.max(target, ...chartWeeks.map((w) => w.heures), 1) * 1.18; // marge en haut pour les valeurs
    chartWeeks.forEach((w, i) => {
      const good = target > 0 && w.heures >= target;
      const col = document.createElement("div"); col.className = "bar-col";
      const wrap = document.createElement("div"); wrap.className = "bar-wrap";
      const val = document.createElement("div");
      val.className = "bar-val" + (good ? " good" : "");
      val.textContent = w.heures > 0 ? fmtH(w.heures).replace(" h", "") : "";
      const bar = document.createElement("div");
      bar.className = "bar" + (good ? " good" : "");
      const finalH = (w.heures / maxH) * 100 + "%";
      if (prefersReduced) {
        bar.style.height = finalH; val.style.opacity = "1";
      } else {
        bar.style.height = "0%";
        bar.style.transitionDelay = i * 45 + "ms";
        val.style.transitionDelay = (i * 45 + 500) + "ms";
        requestAnimationFrame(() => requestAnimationFrame(() => { bar.style.height = finalH; val.style.opacity = "1"; }));
      }
      wrap.appendChild(val); wrap.appendChild(bar);
      const lbl = document.createElement("div"); lbl.className = "bar-lbl"; lbl.textContent = fmtDateShort(w.start);
      col.appendChild(wrap); col.appendChild(lbl); chart.appendChild(col);
      const tipHtml = `<b>${fmtDateShort(w.start)}</b> · ${fmtH(w.heures)}`;
      col.addEventListener("mousemove", (e) => showTip(tipHtml, e.clientX, e.clientY));
      col.addEventListener("mouseleave", hideTip);
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
        <td class="mono nowrap">${fmtDateShort(e.date)}</td>
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

  // Ombre de la barre d'onglets quand on scrolle
  window.addEventListener("scroll", () => {
    tabsEl.classList.toggle("stuck", window.scrollY > 20);
  }, { passive: true });

  // ---------- Démarrage ----------
  selectTab("general");
})();
