/* ===== State ===== */
let bst   = null;   // plain BST (from KP7)
let bbal  = null;   // balanced BST
let rb    = null;   // red-black tree

let activeTree = 'balanced'; // 'bst' | 'balanced' | 'rb'
let admiralKey  = null;
let groundedKey = null;      // ship on sandbar
let visitedPath = [];
let foundKey    = null;
let newNodeKey  = null;
let allSailors  = [];        // sorted array for display

const NODE_COLORS = {
  admiral:  { fill:'var(--admiral-fill)',  stroke:'var(--admiral-stroke)',  text:'var(--admiral-text)'  },
  visited:  { fill:'var(--visited-fill)',  stroke:'var(--visited-stroke)',  text:'var(--visited-text)'  },
  found:    { fill:'var(--found-fill)',    stroke:'var(--found-stroke)',    text:'var(--found-text)'    },
  newship:  { fill:'var(--new-fill)',      stroke:'var(--new-stroke)',      text:'var(--new-text)'      },
  grounded: { fill:'var(--grounded-fill)', stroke:'var(--grounded-stroke)', text:'var(--grounded-text)' },
  normal:   { fill:'var(--normal-fill)',   stroke:'var(--normal-stroke)',   text:'var(--normal-text)'   },
};

/* ===== Helpers ===== */
function clamp(v, min, max) { return Math.min(max, Math.max(min, v)); }
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length-1; i > 0; i--) {
    const j = Math.floor(Math.random()*(i+1));
    [a[i],a[j]] = [a[j],a[i]];
  }
  return a;
}
function setLog(html) { document.getElementById('log-box').innerHTML = html; }
function clearPath()  { document.getElementById('path-list').innerHTML = '<span class="muted"></span>'; }
function showResult(type, html) {
  const sec = document.getElementById('result-section');
  const ban = document.getElementById('result-banner');
  sec.classList.remove('hidden');
  ban.className = `result-banner ${type}`;
  ban.innerHTML = html;
}
function hideResult() { document.getElementById('result-section').classList.add('hidden'); }

function getActiveTree() {
  if (activeTree === 'rb')       return rb;
  if (activeTree === 'balanced') return bbal;
  return bst;
}

/* ===== Build Fleet ===== */
function buildFleet() {
  const n = clamp(parseInt(document.getElementById('n-ships').value)||7, 3, 19);
  const step = Math.floor(180/(n+1));

  let sailors = [];
  for (let i = 1; i <= n; i++) sailors.push(i * step);
  sailors = shuffle(sailors);

  const sorted = [...sailors].sort((a,b)=>a-b);
  admiralKey  = sorted[Math.floor(sorted.length/2)];
  groundedKey = null;
  allSailors  = sorted;

  // Build all three trees
  bst = new BST();
  sailors.forEach(k => bst.insert(k));

  bbal = new BalancedBST();
  bbal.buildFromSorted([...sorted]);

  rb = new RedBlackTree();
  sailors.forEach(k => rb.insert(k));

  visitedPath = []; foundKey = null; newNodeKey = null;

  setLog(
    `<b>Матросів на кораблях:</b> [${sorted.join(', ')}]<br>` +
    `<b>Адміральський корвет</b> (медіана): <b>${admiralKey}</b> матросів<br>` +
    `<span class="muted">Активне дерево: ${treeLabel()}</span>`
  );
  clearPath(); hideResult();
  renderTree();
  updateBenchmark();
}

function treeLabel() {
  return activeTree === 'rb'       ? 'Червоно-чорне'
       : activeTree === 'balanced' ? 'Збалансоване'
       : 'Звичайне BST';
}

/* ===== Switch Tree Type ===== */
function switchTree(type) {
  activeTree = type;
  visitedPath = []; foundKey = null; newNodeKey = null;
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('tab-'+type).classList.add('active');
  setLog(`<span class="muted">Кораблі: [${allSailors.join(', ')}]</span>`);
  clearPath(); hideResult();
  renderTree();
}

/* ===== Sandbar: ground a ship ===== */
function groundShip() {
  const tree = getActiveTree();
  if (!tree) { buildFleet(); return; }
  const keys = tree.inorder().filter(k => k !== admiralKey && k !== groundedKey);
  if (!keys.length) { setLog('<b>Немає кораблів для посадки на мілину!</b>'); return; }

  const victim = keys[Math.floor(Math.random() * keys.length)];
  groundedKey = victim;

  bst.delete(victim);
  bbal.delete(victim);
  rb.delete(victim);
  allSailors = allSailors.filter(k => k !== victim);

  visitedPath = []; foundKey = null; newNodeKey = null;
  showResult('warn',
    `⚓ Корабель з <b>${victim}</b> матросами сів на мілину і вибув з армади!`
  );
  setLog(
    `<b>НАДЗВИЧАЙНА ПОДІЯ!</b><br>` +
    `Корабель з <b>${victim}</b> матросами сів на мілину - стає непрацездатним.<br>` +
    `Він повідомляє армаду і вибуває. Дерево перебудовано.<br>` +
    `<span class="muted">Залишилось кораблів: ${allSailors.join(', ')}</span>`
  );
  clearPath();
  renderTree();
  updateBenchmark();
}

/* ===== Attack ===== */
function attack() {
  if (!bst) { buildFleet(); return; }

  const pirates = clamp(parseInt(document.getElementById('n-pirates').value)||55, 1, 9999);
  const tree = getActiveTree();
  const res  = tree.searchMinGe(pirates);

  visitedPath = res.path;

  if (res.found) {
    foundKey   = res.key;
    newNodeKey = null;
    showResult('success',
      `Корабель з <b>${res.key}</b> матросами атакує <b>${pirates}</b> піратів. Перемога!`
    );
    setLog(
      `Подан сигнал атаки` +
      `Шлях сигналу: ${res.path.join(' → ')}<br>` +
      `<b>Корабель знайдено:</b> ${res.key} матросів`
    );
    renderPath(res.path, res.key, null, pirates);
  } else {
    const firstPath = [...res.path];
    newNodeKey = pirates;
    // insert into all trees so they stay in sync
    bst.insert(pirates);
    bbal.insert(pirates);
    rb.insert(pirates);
    allSailors.push(pirates);
    allSailors.sort((a,b)=>a-b);
    foundKey = pirates;

    const res2 = getActiveTree().searchMinGe(pirates);
    visitedPath = res2.path;

    showResult('info',
      `Підходящого корабля не знайдено! З'явився <b>новий корабель</b> з ${pirates} матросами. Атакує!`
    );
    setLog(
      `Адмірал (<b>${admiralKey}</b>) подає сигнал атаки [<i>${treeLabel()}</i>].<br>` +
      `Перший обхід: ${firstPath.join(' → ')} - не знайдено!<br>` +
      `<b>З'являється новий корабель</b> з ${pirates} матросами → вставляємо у флот.<br>` +
      `Другий обхід: ${res2.path.join(' → ')} - атакує!`
    );
    renderPath(res2.path, pirates, pirates, pirates);
  }
  renderTree();
  updateBenchmark();
}

/* ===== Render Path ===== */
function renderPath(path, found, newKey, pirates) {
  const container = document.getElementById('path-list');
  let html = '';
  path.forEach((key, i) => {
    if (i > 0) html += `<span class="chip chip-arrow">›</span>`;
    let cls = 'chip-normal';
    if (key === admiralKey && i === 0) cls = 'chip-admiral';
    else if (key === newKey)  cls = 'chip-new';
    else if (key === found)   cls = 'chip-found';
    else cls = 'chip-visit';
    const label = (key === admiralKey && i === 0) ? `${key} ★` : `${key}`;
    html += `<span class="chip ${cls}">${label}</span>`;
  });
  if (newKey !== null && !path.includes(newKey))
    html += `<span class="chip chip-arrow">›</span><span class="chip chip-new">+${newKey} (новий)</span>`;
  container.innerHTML = html;
}

/* ===== Render Tree ===== */
function renderTree() {
  const tree = getActiveTree();
  if (!tree || tree.root === null || tree.root === tree.NIL) return;

  const svg   = document.getElementById('tree-svg');
  const W     = 680;
  const depth = tree.maxDepth();
  const nodeR = clamp(30 - depth, 16, 28);
  const levelH= clamp(Math.floor(320/Math.max(depth,1)), 50, 85);
  const H     = 40 + (depth-1)*levelH + nodeR*2 + 30;

  svg.setAttribute('viewBox', `0 0 ${W} ${Math.max(160,H)}`);

  const positions = tree.toLayout();
  const isRB = activeTree === 'rb';
  let edgesSVG = '', nodesSVG = '';

  drawEdges(tree, tree.root, positions, levelH, nodeR, s => edgesSVG += s);
  drawNodes(tree, tree.root, positions, levelH, nodeR, isRB, s => nodesSVG += s);

  svg.innerHTML = `<defs>
    <marker id="arr" viewBox="0 0 10 10" refX="8" refY="5"
      markerWidth="5" markerHeight="5" orient="auto-start-reverse">
      <path d="M2 1L8 5L2 9" fill="none" stroke="context-stroke"
        stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    </marker>
  </defs>${edgesSVG}${nodesSVG}`;
}

function isNilNode(tree, node) {
  return !node || (activeTree === 'rb' && node === tree.NIL);
}

function drawEdges(tree, node, positions, levelH, nodeR, emit) {
  if (isNilNode(tree, node)) return;
  const p   = positions[node.key];
  const cx1 = 40 + p.x * 600;
  const cy1 = 40 + p.depth * levelH;

  [node.left, node.right].forEach(child => {
    if (isNilNode(tree, child)) return;
    const c   = positions[child.key];
    const cx2 = 40 + c.x * 600;
    const cy2 = 40 + c.depth * levelH;
    const onPath = visitedPath.includes(node.key) && visitedPath.includes(child.key) &&
      Math.abs(visitedPath.indexOf(child.key) - visitedPath.indexOf(node.key)) === 1;
    emit(`<line x1="${cx1}" y1="${cy1}" x2="${cx2}" y2="${cy2}"
      stroke="${onPath ? 'var(--visited-stroke)' : 'var(--border-2)'}"
      stroke-width="${onPath ? 2 : 1}" fill="none"/>`);
    drawEdges(tree, child, positions, levelH, nodeR, emit);
  });
}

function drawNodes(tree, node, positions, levelH, nodeR, isRB, emit) {
  if (isNilNode(tree, node)) return;

  const p  = positions[node.key];
  const cx = 40 + p.x * 600;
  const cy = 40 + p.depth * levelH;

  const col     = getNodeColor(node.key);
  const isAdmiral = node.key === admiralKey;
  const isFound   = node.key === foundKey;
  const isNew     = node.key === newNodeKey;
  const sw = (isAdmiral || isFound || isNew) ? '2.5' : '1';

  // For RB tree: inner fill = rb color ring
  if (isRB) {
    const rbRingColor = node.color === RED ? 'var(--rb-red)' : 'var(--rb-black)';
    emit(`<circle cx="${cx}" cy="${cy}" r="${nodeR+3}" fill="${rbRingColor}" opacity="0.25"/>`);
  }

  emit(`<circle cx="${cx}" cy="${cy}" r="${nodeR}"
    fill="${col.fill}" stroke="${col.stroke}" stroke-width="${sw}"/>`);
  emit(`<text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="central"
    font-size="${nodeR >= 24 ? 13 : 11}" font-weight="${isAdmiral || isFound ? '700' : '400'}"
    fill="${col.text}">${node.key}</text>`);

  if (isAdmiral)
    emit(`<text x="${cx}" y="${cy+nodeR+12}" text-anchor="middle" font-size="9"
      fill="var(--admiral-stroke)" font-weight="600">адмірал</text>`);
  if (isNew)
    emit(`<text x="${cx}" y="${cy-nodeR-6}" text-anchor="middle" font-size="9"
      fill="var(--new-stroke)" font-weight="600">новий</text>`);
  if (isRB)
    emit(`<text x="${cx+nodeR-4}" y="${cy-nodeR+4}" text-anchor="middle" font-size="8"
      fill="${node.color === RED ? 'var(--rb-red)' : 'var(--rb-black)'}" font-weight="700"
      >${node.color === RED ? '●' : '○'}</text>`);

  drawNodes(tree, node.left,  positions, levelH, nodeR, isRB, emit);
  drawNodes(tree, node.right, positions, levelH, nodeR, isRB, emit);
}

function getNodeColor(key) {
  if (key === newNodeKey)  return NODE_COLORS.newship;
  if (key === foundKey)    return NODE_COLORS.found;
  if (visitedPath.includes(key)) return NODE_COLORS.visited;
  if (key === admiralKey)  return NODE_COLORS.admiral;
  if (key === groundedKey) return NODE_COLORS.grounded;
  return NODE_COLORS.normal;
}

/* ===== Benchmark ===== */
function updateBenchmark() {
  if (!bst) return;
  const sizes = [100, 500, 1000, 5000, 10000];
  const results = [];

  sizes.forEach(n => {
    const data = Array.from({length:n}, (_,i) => i+1);
    const shuffled = shuffle([...data]);
    const target = Math.floor(n * 0.6);

    // Plain BST
    let t0 = performance.now();
    const tb = new BST();
    shuffled.forEach(k => tb.insert(k));
    for(let i=0;i<100;i++) tb.searchMinGe(target);
    const bstTime = ((performance.now()-t0)/100).toFixed(4);
    const bstDepth = tb.maxDepth();

    // Balanced BST
    t0 = performance.now();
    const tbal = new BalancedBST();
    tbal.buildFromSorted([...data]);
    for(let i=0;i<100;i++) tbal.searchMinGe(target);
    const balTime = ((performance.now()-t0)/100).toFixed(4);
    const balDepth = tbal.maxDepth();

    // Red-Black
    t0 = performance.now();
    const trb = new RedBlackTree();
    shuffled.forEach(k => trb.insert(k));
    for(let i=0;i<100;i++) trb.searchMinGe(target);
    const rbTime = ((performance.now()-t0)/100).toFixed(4);
    const rbDepth = trb.maxDepth();

    results.push({ n, bstTime, bstDepth, balTime, balDepth, rbTime, rbDepth });
  });

}

window.addEventListener('DOMContentLoaded', () => {
  buildFleet();
  document.getElementById('tab-balanced').classList.add('active');
});
