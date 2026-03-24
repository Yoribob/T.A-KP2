const locationNames = [
  "Червоний університет",   // 0
  "Андріївська церква",     // 1
  "Михайлівський собор",    // 2
  "Золоті ворота",          // 3
  "Лядські ворота",         // 4
  "Фунікулер",              // 5
  "Київська політехніка",   // 6
  "Фонтан на Хрещатику",    // 7
  "Софія київська",         // 8
  "Національна філармонія", // 9
  "Музей однієї вулиці"     // 10
];

const coordinates = [
  { x: 490, y: 680 }, // 0  Червоний університет
  { x: 490, y: 175 }, // 1  Андріївська церква
  { x: 660, y: 310 }, // 2  Михайлівський собор
  { x: 550, y: 500 }, // 3  Золоті ворота
  { x: 660, y: 430 }, // 4  Лядські ворота
  { x: 750, y: 205 }, // 5  Фунікулер
  { x:  80, y: 700 }, // 6  Київська політехніка
  { x: 800, y: 520 }, // 7  Фонтан на Хрещатику
  { x: 295, y: 390 }, // 8  Софія київська
  { x: 870, y: 370 }, // 9  Національна філармонія
  { x: 620, y:  60 }  // 10 Музей однієї вулиці
];

const edgesDefinition = [
  // Односторонні
  { from: 10, to: 1,  weight: 0.6,  oneway: true  },
  { from: 10, to: 5,  weight: 0.8,  oneway: true  },
  { from: 1,  to: 2,  weight: 0.6,  oneway: true  },
  { from: 5,  to: 2,  weight: 0.5,  oneway: true  },
  { from: 2,  to: 8,  weight: 0.5,  oneway: true  },
  { from: 8,  to: 4,  weight: 0.6,  oneway: true  },
  { from: 4,  to: 2,  weight: 0.5,  oneway: true  },
  { from: 3,  to: 7,  weight: 1.0,  oneway: true  },

  // Двосторонні
  { from: 6,  to: 0,  weight: 3.5,  oneway: false },
  { from: 0,  to: 1,  weight: 6,  oneway: false },
  { from: 0,  to: 3,  weight: 0.85,  oneway: false },
  { from: 3,  to: 8,  weight: 0.8,  oneway: false },
  { from: 7,  to: 4,  weight: 0.8,  oneway: false },
  { from: 4,  to: 9,  weight: 0.55,  oneway: false },
];

const NODE_COUNT = locationNames.length;
const xmlNamespace = "http://www.w3.org/2000/svg";
const svg = document.getElementById("graphSvg");

const sccColors = [
  "#7c6cf8", "#e05b9b", "#2da874", "#e5882a", "#3b82d0",
  "#d65c5c", "#9333ea", "#0891b2", "#65a30d", "#d97706", "#6b7280"
];
const sccLightColors = [
  "#ede9ff", "#fde8f4", "#d1fae5", "#fff3e0", "#dbeafe",
  "#fee2e2", "#f3e8ff", "#e0f2fe", "#ecfccb", "#fffbeb", "#f3f4f6"
];

let currentSCCs = [];

function buildAdjacency() {
  const adj = Array.from({ length: NODE_COUNT }, () => []);
  for (const edge of edgesDefinition) {
    adj[edge.from].push(edge.to);
    if (!edge.oneway) {
      adj[edge.to].push(edge.from);
    }
  }
  return adj;
}

function tarjanSCC(adj) {
  const disc    = Array(NODE_COUNT).fill(-1);
  const low     = Array(NODE_COUNT).fill(0);
  const onStack = Array(NODE_COUNT).fill(false);
  const stack   = [];
  const sccs    = [];
  let timer     = 0;

  function dfs(v) {
    disc[v] = low[v] = timer++;
    stack.push(v);
    onStack[v] = true;

    for (const u of adj[v]) {
      if (disc[u] === -1) {
        dfs(u);
        low[v] = Math.min(low[v], low[u]);
      } else if (onStack[u]) {
        low[v] = Math.min(low[v], disc[u]);
      }
    }

    if (low[v] === disc[v]) {
      const scc = [];
      let w;
      do {
        w = stack.pop();
        onStack[w] = false;
        scc.push(w);
      } while (w !== v);
      sccs.push(scc);
    }
  }

  for (let v = 0; v < NODE_COUNT; v++) {
    if (disc[v] === -1) dfs(v);
  }

  return sccs;
}

function pathBasedSCC(adj) {
  const rindex    = Array(NODE_COUNT).fill(-1);
  const comp      = Array(NODE_COUNT).fill(-1);
  const stack     = [];
  const boundaries = [];
  const sccs      = [];
  let counter     = 0;
  let sccCount    = 0;

  function dfs(v) {
    rindex[v] = counter++;
    stack.push(v);
    boundaries.push(rindex[v]);

    for (const w of adj[v]) {
      if (rindex[w] === -1) {
        dfs(w);
      } else if (comp[w] === -1) {
        while (boundaries[boundaries.length - 1] > rindex[w]) {
          boundaries.pop();
        }
      }
    }

    if (boundaries[boundaries.length - 1] === rindex[v]) {
      boundaries.pop();
      const scc = [];
      let w;
      do {
        w = stack.pop();
        comp[w] = sccCount;
        scc.push(w);
      } while (w !== v);
      sccs.push(scc);
      sccCount++;
    }
  }

  for (let v = 0; v < NODE_COUNT; v++) {
    if (rindex[v] === -1) dfs(v);
  }

  return sccs;
}

function measureTime(fn, runs = 50000) {
  const t0 = performance.now();
  for (let i = 0; i < runs; i++) fn();
  return (performance.now() - t0) / runs;
}

function getComponentIndex(vertex) {
  for (let i = 0; i < currentSCCs.length; i++) {
    if (currentSCCs[i].includes(vertex)) return i % sccColors.length;
  }
  return sccColors.length - 1;
}

function clearSvg() {
  svg.innerHTML = "";
}

function createArrowMarker(id, color) {
  const marker = document.createElementNS(xmlNamespace, "marker");
  marker.setAttribute("id", id);
  marker.setAttribute("viewBox", "0 0 10 10");
  marker.setAttribute("refX", "9");
  marker.setAttribute("refY", "5");
  marker.setAttribute("markerWidth", "5");
  marker.setAttribute("markerHeight", "5");
  marker.setAttribute("orient", "auto-start-reverse");
  marker.setAttribute("markerUnits", "strokeWidth");

  const path = document.createElementNS(xmlNamespace, "path");
  path.setAttribute("d", "M 0 0 L 10 5 L 0 10 z");
  path.setAttribute("fill", color);
  marker.appendChild(path);
  return marker;
}

function setupDefs() {
  const defs = document.createElementNS(xmlNamespace, "defs");

  defs.appendChild(createArrowMarker("arrowGray", "#9ca3af"));

  for (let i = 0; i < sccColors.length; i++) {
    defs.appendChild(createArrowMarker("arrowScc" + i, sccColors[i]));
  }

  svg.appendChild(defs);
}

function drawEdge(x1, y1, x2, y2, color, markerId, dashed = false) {
  const dx = x2 - x1, dy = y2 - y1;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const ux = dx / dist, uy = dy / dist;
  const pad = 22;

  const line = document.createElementNS(xmlNamespace, "line");
  line.setAttribute("x1", x1 + ux * pad);
  line.setAttribute("y1", y1 + uy * pad);
  line.setAttribute("x2", x2 - ux * pad);
  line.setAttribute("y2", y2 - uy * pad);
  line.setAttribute("stroke", color);
  line.setAttribute("stroke-width", "1.5");
  line.setAttribute("marker-end", `url(#${markerId})`);
  if (dashed) line.setAttribute("stroke-dasharray", "4 3");
  svg.appendChild(line);
}

function drawWeightLabel(x1, y1, x2, y2, weight) {
  const label = document.createElementNS(xmlNamespace, "text");
  label.setAttribute("x", (x1 + x2) / 2 + 4);
  label.setAttribute("y", (y1 + y2) / 2 - 5);
  label.setAttribute("font-size", "10");
  label.setAttribute("text-anchor", "middle");
  label.setAttribute("fill", "#9ca3af");
  label.setAttribute("paint-order", "stroke");
  label.setAttribute("stroke", "#f3f4ff");
  label.setAttribute("stroke-width", "3");
  label.textContent = weight;
  svg.appendChild(label);
}

function drawGraph() {
  clearSvg();
  setupDefs();

  const hasSCC = currentSCCs.length > 0;

  for (const edge of edgesDefinition) {
    const s = coordinates[edge.from];
    const e = coordinates[edge.to];

    const fromComp = hasSCC ? getComponentIndex(edge.from) : -1;
    const toComp   = hasSCC ? getComponentIndex(edge.to)   : -1;
    const sameComp = hasSCC && fromComp === toComp;

    if (edge.oneway) {
      const color    = sameComp ? sccColors[fromComp] : "#9ca3af";
      const markerId = sameComp ? "arrowScc" + fromComp : "arrowGray";
      drawEdge(s.x, s.y, e.x, e.y, color, markerId);
    } else {
      for (const [from, to] of [[edge.from, edge.to], [edge.to, edge.from]]) {
        const fs = coordinates[from];
        const ft = coordinates[to];
        const fdx = ft.x - fs.x, fdy = ft.y - fs.y;
        const fd  = Math.sqrt(fdx * fdx + fdy * fdy);
        const fux = fdx / fd, fuy = fdy / fd;
        const ox  = -fuy * 3, oy = fux * 3;

        const ci       = hasSCC ? getComponentIndex(from) : -1;
        const ti       = hasSCC ? getComponentIndex(to)   : -1;
        const same     = hasSCC && ci === ti;
        const color    = same ? sccColors[ci] : "#9ca3af";
        const markerId = same ? "arrowScc" + ci : "arrowGray";

        const pad = 22;
        const dist = fd;
        const line = document.createElementNS(xmlNamespace, "line");
        line.setAttribute("x1", fs.x + fux * pad + ox);
        line.setAttribute("y1", fs.y + fuy * pad + oy);
        line.setAttribute("x2", ft.x - fux * pad + ox);
        line.setAttribute("y2", ft.y - fuy * pad + oy);
        line.setAttribute("stroke", color);
        line.setAttribute("stroke-width", "1.5");
        line.setAttribute("marker-end", `url(#${markerId})`);
        svg.appendChild(line);
      }
    }

    drawWeightLabel(s.x, s.y, e.x, e.y, edge.weight);
  }

  const shortNames = [
    "Черв. ун-т", "Андр. церква", "Михайл. собор", "Золоті ворота",
    "Лядські вор.", "Фунікулер", "КПІ", "Фонтан",
    "Софія", "Нац. філарм.", "Музей вулиці"
  ];

  locationNames.forEach((name, i) => {
    const p  = coordinates[i];
    const ci = hasSCC ? getComponentIndex(i) : sccColors.length - 1;
    const fillColor   = hasSCC ? sccLightColors[ci] : "#f0f1ff";
    const strokeColor = hasSCC ? sccColors[ci]      : "#7a87ff";

    const group = document.createElementNS(xmlNamespace, "g");
    group.style.cursor = "pointer";
    group.setAttribute("data-index", i);

    const circle = document.createElementNS(xmlNamespace, "circle");
    circle.setAttribute("cx", p.x);
    circle.setAttribute("cy", p.y);
    circle.setAttribute("r", "21");
    circle.setAttribute("fill", fillColor);
    circle.setAttribute("stroke", strokeColor);
    circle.setAttribute("stroke-width", "1.8");
    group.appendChild(circle);

    const numText = document.createElementNS(xmlNamespace, "text");
    numText.setAttribute("x", p.x);
    numText.setAttribute("y", p.y);
    numText.setAttribute("font-size", "12");
    numText.setAttribute("font-weight", "600");
    numText.setAttribute("text-anchor", "middle");
    numText.setAttribute("dominant-baseline", "central");
    numText.setAttribute("fill", strokeColor);
    numText.setAttribute("pointer-events", "none");
    numText.textContent = i + 1;
    group.appendChild(numText);

    const nameText = document.createElementNS(xmlNamespace, "text");
    nameText.setAttribute("x", p.x);
    nameText.setAttribute("y", p.y + 28);
    nameText.setAttribute("font-size", "9.5");
    nameText.setAttribute("text-anchor", "middle");
    nameText.setAttribute("fill", "#555a7d");
    nameText.setAttribute("pointer-events", "none");
    nameText.textContent = shortNames[i];
    group.appendChild(nameText);

    group.addEventListener("click", () => highlightListItem(i));
    svg.appendChild(group);
  });
}

function highlightListItem(index) {
  const items = document.querySelectorAll("#placesList li");
  items.forEach(li => li.style.backgroundColor = "transparent");
  if (items[index]) {
    items[index].scrollIntoView({ behavior: "smooth", block: "center" });
    items[index].style.backgroundColor = "rgba(124, 108, 248, 0.15)";
  }
}

function displayResults(sccs, elapsed) {
  document.getElementById("timeOutput").textContent  = elapsed.toFixed(6);
  document.getElementById("countOutput").textContent = sccs.length;

  const container = document.getElementById("sccOutput");
  container.innerHTML = "";

  sccs.forEach((scc, i) => {
    const ci  = i % sccColors.length;
    const div = document.createElement("div");
    div.className = "scc-comp";
    div.style.background   = sccLightColors[ci];
    div.style.borderColor  = sccColors[ci];

    const nodes = scc.map(v => `${v + 1} ${locationNames[v]}`).join(" → ");
    div.innerHTML =
      `<span class="scc-label" style="color:${sccColors[ci]}">КСЗ ${i + 1} (${scc.length} вер.):</span> ` +
      `<span style="color:#333">${nodes}</span>`;

    container.appendChild(div);
  });

  const algName = document.getElementById("algorithmSelect").value === "tarjan"
    ? "Алгоритм Тар'яна O(V+E)"
    : "Алгоритм по шляхах O(V+E)";

  document.getElementById("perfHint").textContent =
    `${algName} | Час: ${elapsed.toFixed(6)} мс (середній з 50 000 запусків) | КСЗ знайдено: ${sccs.length}`;
}

function executeSearch() {
  const algorithm = document.getElementById("algorithmSelect").value;
  const adj = buildAdjacency();

  const fn = algorithm === "tarjan"
    ? () => tarjanSCC(adj)
    : () => pathBasedSCC(adj);

  const elapsed = measureTime(fn, 50000);
  const sccs    = fn();

  currentSCCs = sccs;

  drawGraph();
  displayResults(sccs, elapsed);
}

function initUI() {
  const list = document.getElementById("placesList");
  locationNames.forEach((name, i) => {
    const li = document.createElement("li");
    li.textContent = name;
    list.appendChild(li);
  });

  // Підрахунок ребер
  const totalEdges = edgesDefinition.reduce((sum, e) => sum + (e.oneway ? 1 : 2), 0);
  document.getElementById("edgeCountOutput").textContent = totalEdges;
}

function startApp() {
  initUI();
  drawGraph();
  document.getElementById("runButton").addEventListener("click", executeSearch);
}

document.addEventListener("DOMContentLoaded", startApp);