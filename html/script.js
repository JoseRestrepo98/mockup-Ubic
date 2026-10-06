/* ============================================================
   RutaViva — Centro de Control
   Datos de demostración + render del mapa esquemático
   (preparado para reemplazar por fetch a una API real)
   ============================================================ */

const SVGNS = "http://www.w3.org/2000/svg";

const STATUS_COLOR = {
  ontime: "#21A179",
  early:  "#9FD356",
  late:   "#C99A2E",
  out:    "#C4433A"
};
const STATUS_LABEL = {
  ontime: "A tiempo",
  early:  "Adelantado",
  late:   "Retrasado",
  out:    "Fuera de servicio"
};
const STATUS_BADGE_CLASS = {
  ontime: "fleet-badge--ontime",
  early:  "fleet-badge--early",
  late:   "fleet-badge--late",
  out:    "fleet-badge--out"
};

/* ---------- Roads (background corridors) ---------- */
const ROADS = [
  "M 40 480 L 720 480",
  "M 40 300 L 720 300",
  "M 40 120 L 720 120",
  "M 130 40 L 130 540",
  "M 300 40 L 300 540",
  "M 470 40 L 470 540",
  "M 640 40 L 640 540",
  "M 130 120 L 470 480",
  "M 640 120 L 300 480"
];

/* ---------- Routes (colored transit lines, follow the road grid) ---------- */
const ROUTES = [
  {
    id: "R10", color: "#247BA0",
    path: "M 40 300 L 300 300 L 300 120 L 640 120",
    stops: [ {x:130,y:300,name:"Terminal Sur"}, {x:300,y:300,name:"Centro"}, {x:300,y:120,name:"Riverside Park"}, {x:470,y:120,name:"Oak St"} ],
    terminals: [ {x:40,y:300,name:"Terminal Sur"}, {x:640,y:120,name:"Terminal Norte"} ]
  },
  {
    id: "M404", color: "#21A179",
    path: "M 130 40 L 130 480 L 470 480",
    stops: [ {x:130,y:120,name:"Oak St"}, {x:130,y:300,name:"Centro"}, {x:130,y:480,name:"South Street"}, {x:300,y:480,name:"Calle 5"} ],
    terminals: [ {x:130,y:40,name:"Terminal Norte"}, {x:470,y:480,name:"Terminal Sur-Este"} ]
  },
  {
    id: "L12", color: "#9FD356",
    path: "M 470 40 L 470 300 L 720 300",
    stops: [ {x:470,y:120,name:"Oak St"}, {x:470,y:300,name:"Malecón"}, {x:600,y:300,name:"Av. Central"} ],
    terminals: [ {x:470,y:40,name:"Terminal Oak"}, {x:720,y:300,name:"Terminal Este"} ]
  },
  {
    id: "X55", color: "#7C6FB0",
    path: "M 130 120 L 470 480",
    stops: [ {x:220,y:216,name:"Cruce 45"}, {x:300,y:300,name:"Centro"}, {x:390,y:390,name:"Bellavista"} ],
    terminals: [ {x:130,y:120,name:"Terminal Norte"}, {x:470,y:480,name:"Terminal Sur-Este"} ]
  },
  {
    id: "X52", color: "#C99A2E",
    path: "M 640 120 L 300 480",
    stops: [ {x:530,y:230,name:"Av. Central"}, {x:470,y:300,name:"Malecón"}, {x:380,y:390,name:"Bellavista"} ],
    terminals: [ {x:640,y:120,name:"Terminal Norte"}, {x:300,y:480,name:"South Street"} ]
  }
];

/* ---------- Fleet demo data ---------- */
const ROUTE_IDS = ROUTES.map(r => r.id);
const NEXT_STOPS = ["Centro","Terminal Sur","Riverside Park","Oak St","South Street","Calle 5","Av. Central","Malecón","Bellavista","Cruce 45"];
const STATUSES = ["ontime","ontime","ontime","ontime","early","late","late","out"];

function pseudoRandom(seed) {
  let x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function buildFleet(n) {
  const fleet = [];
  for (let i = 0; i < n; i++) {
    const status = STATUSES[Math.floor(pseudoRandom(i * 3.1) * STATUSES.length)];
    const route = ROUTE_IDS[Math.floor(pseudoRandom(i * 5.7) * ROUTE_IDS.length)];
    const next = NEXT_STOPS[Math.floor(pseudoRandom(i * 7.3) * NEXT_STOPS.length)];
    let detail = STATUS_LABEL[status];
    if (status === "late") detail = `Retrasado +${1 + Math.floor(pseudoRandom(i * 9.1) * 6)} min`;
    if (status === "early") detail = `Adelantado -${1 + Math.floor(pseudoRandom(i * 11) * 3)} min`;
    fleet.push({
      id: `B-${1000 + Math.floor(pseudoRandom(i * 13.2) * 3000)}`,
      route, next, status, detail
    });
  }
  return fleet;
}

const FLEET = buildFleet(22);

/* ============================================================
   Live clock
   ============================================================ */
function updateClock() {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  const ss = String(now.getSeconds()).padStart(2, "0");
  const timeStr = `${hh}:${mm}:${ss}`;
  document.getElementById("clockTime").textContent = timeStr;
  document.getElementById("lastUpdate").textContent = timeStr;
  const dateStr = now.toLocaleDateString("es-CO", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
  document.getElementById("clockDate").textContent = dateStr;
}
updateClock();
setInterval(updateClock, 1000);

/* ============================================================
   Sidebar toggle (mobile)
   ============================================================ */
document.getElementById("menuToggle").addEventListener("click", () => {
  document.getElementById("sidebar").classList.toggle("is-open");
});

/* ============================================================
   Network map render
   ============================================================ */
function el(tag, attrs, parent) {
  const node = document.createElementNS(SVGNS, tag);
  for (const k in attrs) node.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(node);
  return node;
}

function renderMap() {
  const svg = document.getElementById("networkMap");
  svg.innerHTML = "";

  const zonesLayer = el("g", {}, svg);
  const roadsLayer = el("g", {}, svg);
  const routesLayer = el("g", {}, svg);
  const stopsLayer = el("g", {}, svg);
  const terminalsLayer = el("g", {}, svg);
  const labelsLayer = el("g", {}, svg);
  const busesLayer = el("g", { id: "busesLayer" }, svg);

  /* soft zone tints */
  const zones = [
    { x: 40, y: 40, w: 260, h: 160, fill: "#EAF3F7", label: "Zona Norte" },
    { x: 480, y: 40, w: 240, h: 160, fill: "#E7F6F0", label: "Zona Oak" },
    { x: 40, y: 340, w: 260, h: 180, fill: "#F4FAEA", label: "Zona Sur" },
    { x: 480, y: 340, w: 240, h: 180, fill: "#FBF3E2", label: "Zona Este" }
  ];
  zones.forEach(z => {
    el("rect", { x: z.x, y: z.y, width: z.w, height: z.h, rx: 14, fill: z.fill, opacity: 0.55 }, zonesLayer);
    el("text", { x: z.x + 12, y: z.y + 20, class: "zone-label" }, labelsLayer).textContent = z.label;
  });

  /* roads */
  ROADS.forEach(d => el("path", { d, class: "road" }, roadsLayer));

  /* routes */
  ROUTES.forEach((r, idx) => {
    const path = el("path", { d: r.path, class: "route-line", stroke: r.color, id: `route-${r.id}` }, routesLayer);
    // route id badge near the middle of the path
    const len = path.getTotalLength();
    const mid = path.getPointAtLength(len * (0.5 + idx * 0.06 % 0.3));
    const badgeW = r.id.length * 6.4 + 12;
    el("rect", { x: mid.x - badgeW / 2, y: mid.y - 20, width: badgeW, height: 15, rx: 7, fill: r.color }, labelsLayer);
    const t = el("text", { x: mid.x, y: mid.y - 9, "text-anchor": "middle", class: "route-badge-text" }, labelsLayer);
    t.textContent = r.id;

    /* stops */
    r.stops.forEach(s => {
      el("circle", { cx: s.x, cy: s.y, r: 4.5, class: "stop-dot" }, stopsLayer);
    });
    /* terminals */
    r.terminals.forEach(t2 => {
      el("circle", { cx: t2.x, cy: t2.y, r: 7, class: "terminal-dot", stroke: r.color }, terminalsLayer);
      el("circle", { cx: t2.x, cy: t2.y, r: 2.6, fill: r.color }, terminalsLayer);
    });
  });

  return { busesLayer };
}

const { busesLayer } = renderMap();

/* ---------- Buses animated strictly along route paths ---------- */
const MAP_BUS_STATUSES = ["ontime", "ontime", "ontime", "early", "late", "out"];
function makeMapBuses(perRoute) {
  const buses = [];
  ROUTES.forEach((r, ri) => {
    const pathEl = document.getElementById(`route-${r.id}`);
    const len = pathEl.getTotalLength();
    for (let i = 0; i < perRoute; i++) {
      const status = MAP_BUS_STATUSES[Math.floor(pseudoRandom(ri * 17 + i * 4.4) * MAP_BUS_STATUSES.length)];
      buses.push({
        route: r,
        pathEl,
        len,
        offset: pseudoRandom(ri * 3.3 + i * 1.7) * len,
        speed: 10 + pseudoRandom(ri * 8.8 + i) * 8, // px/sec
        dir: pseudoRandom(ri + i * 2.2) > 0.5 ? 1 : -1,
        status
      });
    }
  });
  return buses;
}

const mapBuses = makeMapBuses(3);

mapBuses.forEach((b, i) => {
  const g = el("g", { class: "bus-icon", "data-i": i }, busesLayer);
  el("circle", { r: 6, fill: STATUS_COLOR[b.status] }, g);
  el("circle", { r: 2, fill: "#fff" }, g);
  b.node = g;
});

let lastTs = null;
function animateBuses(ts) {
  if (lastTs === null) lastTs = ts;
  const dt = (ts - lastTs) / 1000;
  lastTs = ts;

  mapBuses.forEach(b => {
    b.offset += b.speed * b.dir * dt;
    if (b.offset > b.len) b.offset -= b.len;
    if (b.offset < 0) b.offset += b.len;
    const pt = b.pathEl.getPointAtLength(b.offset);
    b.node.setAttribute("transform", `translate(${pt.x} ${pt.y})`);
  });

  requestAnimationFrame(animateBuses);
}
requestAnimationFrame(animateBuses);

/* ============================================================
   Fleet panel
   ============================================================ */
function renderFleet(filter) {
  const list = document.getElementById("fleetList");
  list.innerHTML = "";
  const rows = filter === "retrasado" ? FLEET.filter(b => b.status === "late") : FLEET;
  rows.forEach(b => {
    const row = document.createElement("div");
    row.className = "fleet-row";
    row.innerHTML = `
      <span class="fleet-status-dot" style="background:${STATUS_COLOR[b.status]}"></span>
      <span class="fleet-mid">
        <span class="fleet-id-row">
          <span class="fleet-id">${b.id}</span>
          <span class="fleet-route">${b.route}</span>
        </span>
        <span class="fleet-next">Próximo: ${b.next}</span>
      </span>
      <span class="fleet-badge ${STATUS_BADGE_CLASS[b.status]}">${b.detail}</span>
    `;
    list.appendChild(row);
  });
}
renderFleet("all");

document.querySelectorAll(".fleet-filter .chip-filter, .fleet-panel .chip-filter").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".fleet-panel .chip-filter").forEach(b => b.classList.remove("is-active"));
    btn.classList.add("is-active");
    renderFleet(btn.dataset.filter);
  });
});

/* ============================================================
   Headway chart — target band + real line + bunching/gap flags
   ============================================================ */
function renderHeadwayChart() {
  const svg = document.getElementById("headwayChart");
  svg.innerHTML = "";
  const W = 680, H = 260, padL = 40, padR = 16, padT = 16, padB = 30;
  const chartW = W - padL - padR, chartH = H - padT - padB;

  const target = 8.0;
  const points = [8.1, 7.6, 8.4, 9.6, 10.8, 9.2, 6.4, 5.1, 4.6, 6.8, 8.2, 8.9, 8.0, 7.4, 8.6, 9.9, 11.4, 9.0, 8.1, 7.9];
  const maxY = 13, minY = 2;

  const xAt = i => padL + (chartW * i) / (points.length - 1);
  const yAt = v => padT + chartH - ((v - minY) / (maxY - minY)) * chartH;

  /* gridlines */
  const g = el("g", {}, svg);
  [4, 6, 8, 10, 12].forEach(v => {
    el("line", { x1: padL, x2: W - padR, y1: yAt(v), y2: yAt(v), stroke: "#ECEAE4", "stroke-width": 1 }, g);
    el("text", { x: padL - 8, y: yAt(v) + 3, "text-anchor": "end", "font-size": 9.5, fill: "#7C8579", "font-family": "JetBrains Mono, monospace" }, g).textContent = v;
  });

  /* acceptable band around target (bunching below, gap above) */
  el("rect", { x: padL, y: yAt(target + 1.5), width: chartW, height: yAt(target - 1.5) - yAt(target + 1.5), fill: "#21A179", opacity: 0.08 }, g);

  /* target line */
  el("line", { x1: padL, x2: W - padR, y1: yAt(target), y2: yAt(target), stroke: "#BFBDB1", "stroke-width": 2, "stroke-dasharray": "5 4" }, g);

  /* real line */
  const d = points.map((p, i) => `${i === 0 ? "M" : "L"} ${xAt(i)} ${yAt(p)}`).join(" ");
  el("path", { d, fill: "none", stroke: "#247BA0", "stroke-width": 2.5, "stroke-linecap": "round", "stroke-linejoin": "round" }, g);

  /* highlight bunching (low) and gap (high) points */
  points.forEach((p, i) => {
    if (p <= 5.2) {
      el("circle", { cx: xAt(i), cy: yAt(p), r: 5.5, fill: "#C99A2E", stroke: "#fff", "stroke-width": 1.4 }, g);
    } else if (p >= 10.5) {
      el("circle", { cx: xAt(i), cy: yAt(p), r: 6, fill: "#fff", stroke: "#247BA0", "stroke-width": 2.5 }, g);
    } else {
      el("circle", { cx: xAt(i), cy: yAt(p), r: 3, fill: "#247BA0", stroke: "#fff", "stroke-width": 1.2 }, g);
    }
  });

  /* x labels (hours) */
  const hourLabels = ["16:00","17:00","18:00","19:00","20:00"];
  hourLabels.forEach((lab, i) => {
    const x = padL + (chartW * i) / (hourLabels.length - 1);
    el("text", { x, y: H - 8, "text-anchor": "middle", "font-size": 9.5, fill: "#7C8579", "font-family": "JetBrains Mono, monospace" }, g).textContent = lab;
  });
}
renderHeadwayChart();

/* ============================================================
   Trend chart (small) — cumplimiento últimas 8h
   ============================================================ */
function renderTrendChart() {
  const svg = document.getElementById("trendChart");
  svg.innerHTML = "";
  const W = 340, H = 200, padL = 30, padR = 10, padT = 14, padB = 24;
  const chartW = W - padL - padR, chartH = H - padT - padB;

  const points = [94.2, 95.0, 96.1, 95.4, 97.0, 96.8, 97.6, 97.4];
  const minY = 90, maxY = 100;
  const xAt = i => padL + (chartW * i) / (points.length - 1);
  const yAt = v => padT + chartH - ((v - minY) / (maxY - minY)) * chartH;

  const g = el("g", {}, svg);
  [90, 95, 100].forEach(v => {
    el("line", { x1: padL, x2: W - padR, y1: yAt(v), y2: yAt(v), stroke: "#ECEAE4", "stroke-width": 1 }, g);
    el("text", { x: padL - 6, y: yAt(v) + 3, "text-anchor": "end", "font-size": 9, fill: "#7C8579", "font-family": "JetBrains Mono, monospace" }, g).textContent = v + "%";
  });

  const areaD = `M ${xAt(0)} ${yAt(points[0])} ` +
    points.map((p, i) => `L ${xAt(i)} ${yAt(p)}`).join(" ") +
    ` L ${xAt(points.length - 1)} ${yAt(minY)} L ${xAt(0)} ${yAt(minY)} Z`;
  el("path", { d: areaD, fill: "#21A179", opacity: 0.12 }, g);

  const lineD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${xAt(i)} ${yAt(p)}`).join(" ");
  el("path", { d: lineD, fill: "none", stroke: "#21A179", "stroke-width": 2.5, "stroke-linecap": "round", "stroke-linejoin": "round" }, g);

  points.forEach((p, i) => {
    el("circle", { cx: xAt(i), cy: yAt(p), r: i === points.length - 1 ? 4 : 2.6, fill: "#21A179", stroke: "#fff", "stroke-width": 1.2 }, g);
  });
}
renderTrendChart();

/* ============================================================
   Alerts panel
   ============================================================ */
const ALERT_ICONS = {
  critical: `<path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"/><path d="M12 9v4M12 17h.01"/>`,
  warn: `<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>`,
  info: `<circle cx="12" cy="12" r="9"/><path d="M12 16v-4M12 8h.01"/>`
};

const ALERTS = [
  { level: "critical", title: "Accidente de tránsito · Ruta R10", desc: "Corredor principal Av. Central con 45. Desvío activo, retrasos de hasta 12 min.", time: "hace 4 min" },
  { level: "critical", title: "Botón de pánico activado", desc: "Bus B-2087 (Ruta M404) — conductor reporta incidente en Calle 5.", time: "hace 9 min" },
  { level: "warn", title: "Embotellamiento · Ruta L12", desc: "Congestión sostenida en Malecón, velocidad promedio 8 km/h.", time: "hace 16 min" },
  { level: "warn", title: "Incidencia mecánica", desc: "Bus B-1174 (Ruta X55) detenido por falla de frenos, en espera de grúa.", time: "hace 22 min" },
  { level: "info", title: "Paradero bloqueado", desc: "Obras en paradero Oak St, buses detienen 20 m adelante hasta nuevo aviso.", time: "hace 31 min" },
  { level: "info", title: "Desvío no autorizado detectado", desc: "Bus B-3042 (Ruta X52) se aparta 180 m de la ruta programada.", time: "hace 44 min" }
];

function renderAlerts() {
  const grid = document.getElementById("alertsGrid");
  grid.innerHTML = "";
  ALERTS.forEach(a => {
    const card = document.createElement("div");
    card.className = "alert-card" + (a.level === "critical" ? " alert-card--critical" : "");
    card.innerHTML = `
      <span class="alert-icon alert-icon--${a.level}">
        <svg viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round">${ALERT_ICONS[a.level]}</svg>
      </span>
      <span class="alert-body">
        <span class="alert-title">${a.title}</span>
        <span class="alert-desc">${a.desc}</span>
        <span class="alert-meta">${a.time}</span>
      </span>
    `;
    grid.appendChild(card);
  });
}
renderAlerts();
