let tree = null;
let admiralKey = null;
let visitedPath = [];
let foundKey = null;
let newNodeKey = null;

const NODE_COLORS = {
  admiral: {
    fill: "var(--admiral-fill)",
    stroke: "var(--admiral-stroke)",
    text: "var(--admiral-text)",
  },
  visited: {
    fill: "var(--visited-fill)",
    stroke: "var(--visited-stroke)",
    text: "var(--visited-text)",
  },
  found: {
    fill: "var(--found-fill)",
    stroke: "var(--found-stroke)",
    text: "var(--found-text)",
  },
  newship: {
    fill: "var(--new-fill)",
    stroke: "var(--new-stroke)",
    text: "var(--new-text)",
  },
  normal: {
    fill: "var(--normal-fill)",
    stroke: "var(--normal-stroke)",
    text: "var(--normal-text)",
  },
};

function buildFleet() {
  const n = clamp(
    parseInt(document.getElementById("n-ships").value) || 7,
    3,
    19,
  );
  const step = Math.floor(180 / (n + 1));

  let sailors = [];
  for (let i = 1; i <= n; i++) sailors.push(i * step);

  sailors = shuffle(sailors);

  const sorted = [...sailors].sort((a, b) => a - b);
  admiralKey = sorted[Math.floor(sorted.length / 2)];

  tree = new BST();
  tree.insert(admiralKey);
  for (const k of sailors) {
    if (k !== admiralKey) tree.insert(k);
  }

  visitedPath = [];
  foundKey = null;
  newNodeKey = null;

  const all = tree.inorder();
  setLog(
    `<b>Матросів на кораблях:</b> [${all.join(", ")}]<br>` +
      `<b>Адміральський корвет</b> (медіана): <b>${admiralKey}</b> матросів`,
  );
  clearPath();
  hideResult();
  renderTree();
}

function attack() {
  if (!tree) {
    buildFleet();
    return;
  }

  const pirates = clamp(
    parseInt(document.getElementById("n-pirates").value) || 55,
    1,
    9999,
  );

  const res = tree.searchMinGe(pirates);
  visitedPath = res.path;

  if (res.found) {
    foundKey = res.key;
    newNodeKey = null;

    showResult(
      "success",
      `Корабель з <b>${res.key}</b> матросами атакує <b>${pirates}</b> піратів. Перемога.`,
    );
    setLog(
      `Адмірал (${admiralKey}) подає сигнал атаки.<br>` +
        `Шукаємо корабель з кількістю матросів ≥ ${pirates}.<br>` +
        `Шлях сигналу: ${res.path.join(" → ")}<br>` +
        `<b>Корабель знайдено:</b> ${res.key} матросів — іде в атаку!`,
    );
    renderPath(res.path, res.key, null, pirates);
  } else {
    const firstPath = [...res.path];
    newNodeKey = pirates;
    tree.insert(pirates);
    foundKey = pirates;

    const res2 = tree.searchMinGe(pirates);
    visitedPath = res2.path;

    showResult(
      "info",
      `Підходящого корабля не знайдено! З'явився <b>новий корабель</b> з ${pirates} матросами. ` +
        `Сигнал повторено — атакує!`,
    );
    setLog(
      `Адмірал (${admiralKey}) подає сигнал атаки.<br>` +
        `Шукаємо корабель з кількістю матросів ≥ ${pirates}.<br>` +
        `Перший обхід: ${firstPath.join(" → ")} — не знайдено!<br>` +
        `<b>З'являється новий корабель</b> з ${pirates} матросами → вставляємо у флот.<br>` +
        `Другий обхід: ${res2.path.join(" → ")} — атакує!`,
    );
    renderPath(res2.path, pirates, pirates, pirates);
  }

  renderTree();
}

function renderPath(path, found, newKey, pirates) {
  const container = document.getElementById("path-list");
  let html = "";

  path.forEach((key, i) => {
    if (i > 0) html += `<span class="chip chip-arrow">›</span>`;

    let cls = "chip-normal";
    if (key === admiralKey && i === 0) cls = "chip-admiral";
    else if (key === newKey) cls = "chip-new";
    else if (key === found) cls = "chip-found";
    else if (visitedPath.includes(key)) cls = "chip-visit";

    const label = key === admiralKey && i === 0 ? `${key} ★` : `${key}`;
    html += `<span class="chip ${cls}">${label}</span>`;
  });

  if (newKey !== null && !path.includes(newKey)) {
    html += `<span class="chip chip-arrow">›</span>`;
    html += `<span class="chip chip-new">+${newKey} (новий)</span>`;
  }

  container.innerHTML = html;
}

function renderTree() {
  if (!tree || !tree.root) return;

  const svg = document.getElementById("tree-svg");
  const W = 680;
  const depth = tree.maxDepth();
  const nodeR = clamp(30 - depth, 18, 30);
  const levelH = clamp(Math.floor(340 / Math.max(depth, 1)), 55, 90);
  const H = 40 + (depth - 1) * levelH + nodeR * 2 + 30;

  svg.setAttribute("viewBox", `0 0 ${W} ${Math.max(160, H)}`);

  const positions = tree.toLayout();
  let edgesSVG = "";
  let nodesSVG = "";

  drawEdges(tree.root, positions, levelH, nodeR, (line) => {
    edgesSVG += line;
  });

  drawNodes(tree.root, positions, levelH, nodeR, (node) => {
    nodesSVG += node;
  });

  svg.innerHTML = `
    <defs>
      <marker id="arr" viewBox="0 0 10 10" refX="8" refY="5"
        markerWidth="5" markerHeight="5" orient="auto-start-reverse">
        <path d="M2 1L8 5L2 9" fill="none" stroke="context-stroke"
          stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </marker>
    </defs>
    ${edgesSVG}
    ${nodesSVG}
  `;
}

function drawEdges(node, positions, levelH, nodeR, emit) {
  if (!node) return;
  const p = positions[node.key];
  const cx1 = 40 + p.x * 600;
  const cy1 = 40 + p.depth * levelH;

  [node.left, node.right].forEach((child) => {
    if (!child) return;
    const c = positions[child.key];
    const cx2 = 40 + c.x * 600;
    const cy2 = 40 + c.depth * levelH;

    const onPath =
      visitedPath.includes(node.key) &&
      visitedPath.includes(child.key) &&
      Math.abs(
        visitedPath.indexOf(child.key) - visitedPath.indexOf(node.key),
      ) === 1;

    const stroke = onPath ? "var(--visited-stroke)" : "var(--border-2)";
    const sw = onPath ? "2" : "1";

    emit(`<line x1="${cx1}" y1="${cy1}" x2="${cx2}" y2="${cy2}"
            stroke="${stroke}" stroke-width="${sw}" fill="none"/>`);

    drawEdges(child, positions, levelH, nodeR, emit);
  });
}

function drawNodes(node, positions, levelH, nodeR, emit) {
  if (!node) return;

  const p = positions[node.key];
  const cx = 40 + p.x * 600;
  const cy = 40 + p.depth * levelH;

  const col = getNodeColor(node.key);
  const isAdmiral = node.key === admiralKey;
  const isFound = node.key === foundKey;
  const isNew = node.key === newNodeKey;
  const strokeW = isAdmiral || isFound || isNew ? "2" : "0.5";

  emit(`<circle cx="${cx}" cy="${cy}" r="${nodeR}"
          fill="${col.fill}" stroke="${col.stroke}" stroke-width="${strokeW}"/>`);

  emit(`<text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="central"
          font-size="${nodeR >= 26 ? 13 : 11}" font-weight="${isAdmiral || isFound ? "600" : "400"}"
          fill="${col.text}">${node.key}</text>`);

  if (isAdmiral) {
    emit(`<text x="${cx}" y="${cy + nodeR + 12}" text-anchor="middle"
            font-size="9" fill="var(--admiral-stroke)" font-weight="600">адмірал</text>`);
  }
  if (isNew) {
    emit(`<text x="${cx}" y="${cy - nodeR - 6}" text-anchor="middle"
            font-size="9" fill="var(--new-stroke)" font-weight="600">новий</text>`);
  }

  drawNodes(node.left, positions, levelH, nodeR, emit);
  drawNodes(node.right, positions, levelH, nodeR, emit);
}

function getNodeColor(key) {
  if (key === newNodeKey) return NODE_COLORS.newship;
  if (key === foundKey) return NODE_COLORS.found;
  if (visitedPath.includes(key)) return NODE_COLORS.visited;
  if (key === admiralKey) return NODE_COLORS.admiral;
  return NODE_COLORS.normal;
}

function clamp(v, min, max) {
  return Math.min(max, Math.max(min, v));
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function setLog(html) {
  document.getElementById("log-box").innerHTML = html;
}

function clearPath() {
  document.getElementById("path-list").innerHTML =
    '<span class="muted"></span>';
}

function showResult(type, html) {
  const sec = document.getElementById("result-section");
  const ban = document.getElementById("result-banner");
  sec.classList.remove("hidden");
  ban.className = `result-banner ${type}`;
  ban.innerHTML = html;
}

function hideResult() {
  document.getElementById("result-section").classList.add("hidden");
}

window.addEventListener("DOMContentLoaded", buildFleet);
