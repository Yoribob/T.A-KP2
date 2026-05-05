let scenario = 1;
let currentArr = [];
let sortedArr = [];
let animating = false;

const SCENARIO_LABELS = {
  1: 'Початковий список',
  2: 'Нові кораблі',
  3: 'Повторів матросів',
};

const ALGO_FOR_SCENARIO = {
  1: 'bubble',
  2: 'shell',
  3: 'quick',
};

const ALGO_LABELS = {
  bubble: 'Бульбашкою',
  shell:  'Шелла',
  quick:  'Швидке (Quick Sort)',
};

function setLog(html) { document.getElementById('log-box').innerHTML = html; }
function showResult(type, html) {
  const sec = document.getElementById('result-section');
  const ban = document.getElementById('result-banner');
  sec.classList.remove('hidden');
  ban.className = `result-banner ${type}`;
  ban.innerHTML = html;
}
function hideResult() { document.getElementById('result-section').classList.add('hidden'); }

function generateFleet() {
  if (animating) return;
  const n = Math.min(Math.max(parseInt(document.getElementById('n-ships').value) || 12, 4), 40);
  const algoKey = document.getElementById('algo-select').value;

  if (scenario === 3) {
    const distinct = Math.floor(n / 3) + 1;
    const pool = [];
    for (let i = 0; i < distinct; i++) pool.push(Math.floor(Math.random() * 80) + 20);
    currentArr = [];
    for (let i = 0; i < n; i++) currentArr.push(pool[Math.floor(Math.random() * pool.length)]);
  } else if (scenario === 2) {
    const base = Math.floor(n * 0.6);
    const extra = n - base;
    const baseArr = Array.from({ length: base }, () => Math.floor(Math.random() * 150) + 10).sort((a, b) => a - b);
    const newShips = Array.from({ length: extra }, () => Math.floor(Math.random() * 150) + 10);
    currentArr = [...baseArr, ...newShips];
  } else {
    currentArr = Array.from({ length: n }, () => Math.floor(Math.random() * 150) + 10);
  }

  sortedArr = [];
  hideResult();
  renderBars(currentArr, [], []);
  renderChips(currentArr, []);

  const scenLabel = SCENARIO_LABELS[scenario];
  const algoLabel = ALGO_LABELS[algoKey];

  let logExtra = '';
  if (scenario === 2) {
    const base = Math.floor(n * 0.6);
    const baseStr = currentArr.slice(0, base).join(', ');
    const newStr = currentArr.slice(base).join(', ');
    logExtra = `<br>Відсортована база: <span class="muted">[${baseStr}]</span>` +
               `<br>Нові кораблі: <b>[${newStr}]</b>`;
  }

  setLog(
    `<b>${scenLabel}</b><br>` +
    `Флот: <span class="muted">[${currentArr.join(', ')}]</span>${logExtra}<br>` +
    `Обраний алгоритм: <b>Сортування ${algoLabel}</b>`
  );
}

function sortFleet() {
  if (animating || !currentArr.length) return;
  animating = true;
  const algoKey = document.getElementById('algo-select').value;

  const fns = { bubble: bubbleSort, shell: shellSort, quick: quickSort };

  const t0 = performance.now();
  const result = fns[algoKey]([...currentArr]);
  const elapsed = (performance.now() - t0).toFixed(3);

  sortedArr = result.sorted;
  animateSteps(result.steps, algoKey, elapsed);
}

function animateSteps(steps, algoKey, elapsed) {
  let i = 0;
  const delay = steps.length > 200 ? 10 : steps.length > 80 ? 30 : 60;

  function nextStep() {
    if (i >= steps.length) {
      renderBars(sortedArr, [], Array.from({ length: sortedArr.length }, (_, k) => k));
      renderChips(sortedArr, Array.from({ length: sortedArr.length }, (_, k) => k));
      setLog(
        `<b>Сортування ${ALGO_LABELS[algoKey]} завершено</b><br>` +
        `Кількість кроків: <b>${steps.length}</b> | Час: <b>${elapsed} мс</b><br>` +
        `Результат: <span class="muted">[${sortedArr.join(', ')}]</span>`
      );
      animating = false;
      return;
    }

    const step = steps[i];
    let active = [];
    if (step.swap) active = step.swap;
    else if (step.moved !== undefined) active = [step.moved];

    renderBars(step.arr, active, []);
    renderChips(step.arr, active);
    i++;
    setTimeout(nextStep, delay);
  }

  nextStep();
}

function renderBars(arr, active, sorted) {
  const container = document.getElementById('ships-vis');
  const maxVal = Math.max(...arr, 1);
  const barW = Math.max(12, Math.min(40, Math.floor(880 / arr.length) - 5));

  container.innerHTML = arr.map((v, i) => {
    let cls = 'normal';
    if (sorted.includes(i)) cls = 'sorted';
    else if (active.includes(i)) cls = 'active';
    const h = Math.max(8, Math.floor((v / maxVal) * 110));
    return `<div class="ship-bar ${cls}" style="height:${h}px;width:${barW}px;" title="${v}"></div>`;
  }).join('');
}

function renderChips(arr, active) {
  const container = document.getElementById('fleet-chips');
  container.innerHTML = arr.map((v, i) => {
    const cls = active.includes(i) ? 'chip-active' : 'chip-normal';
    return `<span class="chip ${cls}">${v}</span>`;
  }).join('');
}

function switchScenario(s) {
  if (animating) return;
  scenario = s;
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(`tab-s${s}`).classList.add('active');
  document.getElementById('algo-select').value = ALGO_FOR_SCENARIO[s];

  sortedArr = [];
  currentArr = [];
  hideResult();
  document.getElementById('ships-vis').innerHTML = '';
  document.getElementById('fleet-chips').innerHTML = '<span class="muted">Згенеруйте флот</span>';

  
}

window.addEventListener('DOMContentLoaded', () => {
  switchScenario(1);
  generateFleet();
});