function hideKey(key) {
    let h = 0x811c9dc5;
    for (let i = 0; i < key.length; i++) {
        h ^= key.charCodeAt(i);
        h  = (h * 0x01000193) >>> 0;
    }
    return '0x' + h.toString(16).toUpperCase().padStart(8, '0');
}

function formatDob(dob) {
    if (!dob) return '—';
    return new Date(dob).toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function hashFn1(key, tableSize) {
    let sum = 0;
    for (let i = 0; i < key.length; i++) sum += key.charCodeAt(i);
    return sum % tableSize;
}

function hashFn2(key, tableSize) {
    const C = 0.6180339887;
    let sum = 0;
    for (let i = 0; i < key.length; i++) sum += key.charCodeAt(i);
    return Math.floor(tableSize * ((sum * C) % 1));
}

function hashFnCuckoo2(key, tableSize) {
    let h = 5381;
    for (let i = 0; i < key.length; i++) {
        h = ((h << 5) + h) ^ key.charCodeAt(i);
        h = h >>> 0;
    }
    return h % tableSize;
}

const DELETED = Symbol('DELETED');

class LinearProbingTable {
    constructor(size, mainHashFn) {
        this.size       = size;
        this.hashFn     = mainHashFn;
        this.slots      = new Array(size).fill(null);
        this.count      = 0;
        this.collisions = 0;
        this.probeLog   = [];
    }

    _hash(key) { return this.hashFn(key, this.size); }

    insert(key, value) {
        if (this.count >= this.size) return { ok: false, reason: 'Таблиця повна' };
        const hk      = hideKey(key);
        const start   = this._hash(key);
        let probes    = 0;
        let firstFree = -1;
        this.probeLog = [];

        for (let i = 0; i < this.size; i++) {
            const idx  = (start + i) % this.size;
            const slot = this.slots[idx];
            this.probeLog.push(idx);

            if (slot === null || slot === DELETED) {
                if (firstFree === -1) firstFree = idx;
                if (slot === null) break;
                probes++;
            } else {
                if (slot.hiddenKey === hk) {
                    slot.dob   = value.dob;
                    slot.group = value.group;
                    return { ok: true, idx: idx, probes: i, collision: false, updated: true };
                }
                probes++;
            }
        }

        if (firstFree === -1) return { ok: false, reason: 'Таблиця повна' };

        const isCollision = firstFree !== start || this.slots[start] === DELETED;
        if (isCollision) this.collisions++;
        this.slots[firstFree] = { hiddenKey: hk, dob: value.dob, group: value.group };
        this.count++;
        return { ok: true, idx: firstFree, probes, collision: isCollision };
    }

    search(key) {
        const hk    = hideKey(key);
        const start = this._hash(key);
        this.probeLog = [];

        for (let i = 0; i < this.size; i++) {
            const idx  = (start + i) % this.size;
            const slot = this.slots[idx];
            this.probeLog.push(idx);

            if (slot === null) return { found: false, probes: i + 1, idx: start };
            if (slot !== DELETED && slot.hiddenKey === hk) {
                return { found: true, probes: i + 1, idx, record: slot };
            }
        }
        return { found: false, probes: this.size, idx: start };
    }

    delete(key) {
        const hk    = hideKey(key);
        const start = this._hash(key);
        this.probeLog = [];

        for (let i = 0; i < this.size; i++) {
            const idx  = (start + i) % this.size;
            const slot = this.slots[idx];
            this.probeLog.push(idx);

            if (slot === null) return { deleted: false, probes: i + 1, idx };
            if (slot !== DELETED && slot.hiddenKey === hk) {
                this.slots[idx] = DELETED;
                this.count--;
                return { deleted: true, probes: i + 1, idx };
            }
        }
        return { deleted: false, probes: this.size, idx: start };
    }

    filledCount()  { return this.count; }
    fillPercent()  { return ((this.count / this.size) * 100).toFixed(1); }
}

const MAX_LOOP = 50;

class CuckooTable {
    constructor(size, mainHashFn) {
        this.size       = size;
        this.slotsA     = new Array(size).fill(null);
        this.slotsB     = new Array(size).fill(null);
        this.count      = 0;
        this.collisions = 0;
        this.probeLog   = [];
    }

    _hA(key) { return mainHashFn(key, this.size); }
    _hB(key) { return hashFnCuckoo2(key, this.size); }

    insert(key, value) {
        const hk = hideKey(key);
        this.probeLog = [];

        const idxA0 = this._hA(key);
        const idxB0 = this._hB(key);
        if (this.slotsA[idxA0] && this.slotsA[idxA0].hiddenKey === hk) {
            this.slotsA[idxA0] = { hiddenKey: hk, dob: value.dob, group: value.group, origKey: key };
            return { ok: true, table: 'A', idx: idxA0, probes: 1, collision: false, updated: true };
        }
        if (this.slotsB[idxB0] && this.slotsB[idxB0].hiddenKey === hk) {
            this.slotsB[idxB0] = { hiddenKey: hk, dob: value.dob, group: value.group, origKey: key };
            return { ok: true, table: 'B', idx: idxB0, probes: 1, collision: false, updated: true };
        }

        let curKey   = key;
        let curValue = value;
        let curHk    = hk;
        let useA     = true;

        for (let iter = 0; iter < MAX_LOOP; iter++) {
            if (useA) {
                const idx = this._hA(curKey);
                this.probeLog.push({ table: 'A', idx });
                if (!this.slotsA[idx]) {
                    const isCol = iter > 0;
                    if (isCol) this.collisions++;
                    this.slotsA[idx] = { hiddenKey: curHk, dob: curValue.dob, group: curValue.group, origKey: curKey };
                    this.count++;
                    return { ok: true, table: 'A', idx, probes: iter + 1, collision: isCol };
                }
                this.collisions++;
                const evicted = this.slotsA[idx];
                this.slotsA[idx] = { hiddenKey: curHk, dob: curValue.dob, group: curValue.group, origKey: curKey };
                curKey   = evicted.origKey;
                curValue = { dob: evicted.dob, group: evicted.group };
                curHk    = evicted.hiddenKey;
                useA     = false;
            } else {
                const idx = this._hB(curKey);
                this.probeLog.push({ table: 'B', idx });
                if (!this.slotsB[idx]) {
                    this.slotsB[idx] = { hiddenKey: curHk, dob: curValue.dob, group: curValue.group, origKey: curKey };
                    this.count++;
                    return { ok: true, table: 'B', idx, probes: iter + 1, collision: true };
                }
                const evicted = this.slotsB[idx];
                this.slotsB[idx] = { hiddenKey: curHk, dob: curValue.dob, group: curValue.group, origKey: curKey };
                curKey   = evicted.origKey;
                curValue = { dob: evicted.dob, group: evicted.group };
                curHk    = evicted.hiddenKey;
                useA     = true;
            }
        }
        return { ok: false, reason: 'Цикл витіснень (rehash потрібен)' };
    }

    search(key) {
        const hk   = hideKey(key);
        const idxA = this._hA(key);
        const idxB = this._hB(key);
        this.probeLog = [{ table: 'A', idx: idxA }, { table: 'B', idx: idxB }];

        if (this.slotsA[idxA] && this.slotsA[idxA].hiddenKey === hk)
            return { found: true, table: 'A', idx: idxA, probes: 1, record: this.slotsA[idxA] };
        if (this.slotsB[idxB] && this.slotsB[idxB].hiddenKey === hk)
            return { found: true, table: 'B', idx: idxB, probes: 2, record: this.slotsB[idxB] };
        return { found: false, probes: 2, idx: idxA };
    }

    delete(key) {
        const hk   = hideKey(key);
        const idxA = this._hA(key);
        const idxB = this._hB(key);
        this.probeLog = [{ table: 'A', idx: idxA }, { table: 'B', idx: idxB }];

        if (this.slotsA[idxA] && this.slotsA[idxA].hiddenKey === hk) {
            this.slotsA[idxA] = null;
            this.count--;
            return { deleted: true, table: 'A', idx: idxA, probes: 1 };
        }
        if (this.slotsB[idxB] && this.slotsB[idxB].hiddenKey === hk) {
            this.slotsB[idxB] = null;
            this.count--;
            return { deleted: true, table: 'B', idx: idxB, probes: 2 };
        }
        return { deleted: false, probes: 2, idx: idxA };
    }

    filledCount() { return this.count; }
    fillPercent() {
        return ((this.count / (this.size * 2)) * 100).toFixed(1);
    }
}

const TABLE_SIZE = 17;

let linearTable = null;
let cuckooTable = null;
let highlightLP = { idx: -1, kind: '' };
let highlightCK = { idxA: -1, idxB: -1 };

function mainHashFn(key, size) { return hashFn1(key, size); }

function initTables() {
    linearTable = new LinearProbingTable(TABLE_SIZE, hashFn1);
    cuckooTable = new CuckooTable(TABLE_SIZE, mainHashFn);
    highlightLP = { idx: -1, kind: '' };
    highlightCK = { idxA: -1, idxB: -1 };
}

const el = (id) => document.getElementById(id);
function getActiveMethod() {
    return document.querySelector('input[name="method"]:checked').value;
}

function addLog(text, type = '') {
    const div = document.createElement('div');
    div.className   = `log-entry ${type ? 'log-' + type : ''}`;
    div.textContent = `[${new Date().toLocaleTimeString()}] ${text}`;
    el('activityLog').prepend(div);
}

function setResult(text, found) {
    el('searchResult').innerHTML = text.replace(/\n/g, '<br>');
    el('searchResult').className = 'search-result ' + (found ? 'result-found' : 'result-not-found');
}

function updateStats() {
    const method = getActiveMethod();
    if (method === 'lp') {
        el('statTotal').textContent      = `Всього: ${linearTable.filledCount()}`;
        el('statCollisions').textContent = `Колізії: ${linearTable.collisions}`;
        el('statFilled').textContent     = `Заповнено: ${linearTable.fillPercent()}%`;
    } else {
        el('statTotal').textContent      = `Всього: ${cuckooTable.filledCount()}`;
        el('statCollisions').textContent = `Колізії: ${cuckooTable.collisions}`;
        el('statFilled').textContent     = `Заповнено: ${cuckooTable.fillPercent()}%`;
    }
}

function renderLinearTable() {
    const container = el('lpTableViz');
    container.innerHTML = '';

    for (let i = 0; i < linearTable.size; i++) {
        const slot = linearTable.slots[i];
        const isHL = highlightLP.idx === i;

        const row = document.createElement('div');
        row.className = `slot-row${isHL ? ' highlighted' : ''}`;

        const idxDiv = document.createElement('div');
        idxDiv.className   = 'slot-index';
        idxDiv.textContent = i;

        const contentDiv = document.createElement('div');
        contentDiv.className = 'slot-content';

        if (slot === null) {
            contentDiv.innerHTML = '<span class="slot-empty">— порожньо —</span>';
        } else if (slot === DELETED) {
            contentDiv.innerHTML = '<span class="slot-deleted">✕ видалено</span>';
        } else {
            contentDiv.innerHTML = `
                <span class="chip-hidden">${slot.hiddenKey}</span>
                <span class="chip-dob">${formatDob(slot.dob)}</span>
                <span class="chip-group">${slot.group}</span>
            `;
            contentDiv.className += isHL ? ' highlighted-slot' : ' filled-slot';
        }

        row.appendChild(idxDiv);
        row.appendChild(contentDiv);
        container.appendChild(row);
    }
}

function renderCuckooTable() {
    ['A', 'B'].forEach(t => {
        const slots     = t === 'A' ? cuckooTable.slotsA : cuckooTable.slotsB;
        const container = el(`cuckoo${t}Viz`);
        container.innerHTML = '';

        for (let i = 0; i < cuckooTable.size; i++) {
            const slot = slots[i];
            const isHL = t === 'A' ? highlightCK.idxA === i : highlightCK.idxB === i;

            const row = document.createElement('div');
            row.className = `slot-row${isHL ? ' highlighted' : ''}`;

            const idxDiv = document.createElement('div');
            idxDiv.className   = 'slot-index';
            idxDiv.textContent = i;

            const contentDiv = document.createElement('div');
            contentDiv.className = 'slot-content';

            if (!slot) {
                contentDiv.innerHTML = '<span class="slot-empty">— порожньо —</span>';
            } else {
                contentDiv.innerHTML = `
                    <span class="chip-hidden">${slot.hiddenKey}</span>
                    <span class="chip-dob">${formatDob(slot.dob)}</span>
                    <span class="chip-group">${slot.group}</span>
                `;
                contentDiv.className += isHL ? ' highlighted-slot' : ` filled-slot cuckoo${t.toLowerCase()}-slot`;
            }

            row.appendChild(idxDiv);
            row.appendChild(contentDiv);
            container.appendChild(row);
        }
    });
}

function renderAll() {
    renderLinearTable();
    renderCuckooTable();
    updateStats();
}

function addRecord() {
    const name  = el('inputName').value.trim();
    const dob   = el('inputDob').value;
    const group = el('inputGroup').value.trim();
    if (!name || !dob || !group) { setResult('Заповніть усі поля', false); return; }

    const value = { dob, group };
    const hk    = hideKey(name);

    const rLP = linearTable.insert(name, value);
    const rCK = cuckooTable.insert(name, value);

    if (!rLP.ok) {
        addLog(`LP: не вдалося вставити (${rLP.reason})`, 'collision');
    } else {
        const tag = rLP.updated ? 'оновлено' : rLP.collision ? 'колізія' : 'вставлено';
        addLog(`LP: ключ ${hk} → слот[${rLP.idx}], ${tag}, зондів: ${rLP.probes}`,
               rLP.collision ? 'collision' : 'add');
    }

    if (!rCK.ok) {
        addLog(`Cuckoo: не вдалося вставити (${rCK.reason})`, 'collision');
    } else {
        const tag = rCK.updated ? 'оновлено' : rCK.collision ? 'витіснення' : 'вставлено';
        addLog(`Cuckoo: ключ ${hk} → таблиця ${rCK.table}[${rCK.idx}], ${tag}, ітерацій: ${rCK.probes}`,
               rCK.collision ? 'collision' : 'add');
    }

    highlightLP = { idx: rLP.ok ? rLP.idx : -1 };
    highlightCK = { idxA: rCK.ok && rCK.table === 'A' ? rCK.idx : -1,
                    idxB: rCK.ok && rCK.table === 'B' ? rCK.idx : -1 };
    el('inputName').value = el('inputDob').value = el('inputGroup').value = '';
    renderAll();
    setTimeout(() => { highlightLP = { idx: -1 }; highlightCK = { idxA: -1, idxB: -1 }; renderAll(); }, 2000);
}

function searchRecord() {
    const name = el('searchInput').value.trim();
    if (!name) return;

    const method = getActiveMethod();

    if (method === 'lp') {
        const r       = linearTable.search(name);
        const h       = hashFn1(name, TABLE_SIZE);
        const formula = `h("${name}") = sum(charCode) mod ${TABLE_SIZE} = ${h}`;
        if (r.found) {
            setResult(`${formula}<br>Знайдено у слоті [${r.idx}], зондів: ${r.probes}<br>` +
                      `${r.record.hiddenKey} | ${formatDob(r.record.dob)} | ${r.record.group}`, true);
            addLog(`LP пошук: "${name}" → знайдено у слоті[${r.idx}], зондів: ${r.probes}`, 'search');
            highlightLP = { idx: r.idx };
        } else {
            setResult(`${formula}<br>Не знайдено, зондів: ${r.probes}`, false);
            addLog(`LP пошук: "${name}" → не знайдено, зондів: ${r.probes}`, 'search');
        }
    } else {
        const r  = cuckooTable.search(name);
        const hA = hashFn1(name, TABLE_SIZE);
        const hB = hashFnCuckoo2(name, TABLE_SIZE);
        if (r.found) {
            setResult(`Знайдено у таблиці ${r.table}[${r.idx}], перевірок: ${r.probes}<br>` +
                      `hA=${hA}, hB=${hB}<br>` +
                      `${r.record.hiddenKey} | ${formatDob(r.record.dob)} | ${r.record.group}`, true);
            addLog(`Cuckoo пошук: "${name}" → знайдено у таблиці ${r.table}[${r.idx}]`, 'search');
            highlightCK = { idxA: r.table === 'A' ? r.idx : -1, idxB: r.table === 'B' ? r.idx : -1 };
        } else {
            setResult(`Не знайдено. Перевірено hA=${hA} (таб.A) та hB=${hB} (таб.B)`, false);
            addLog(`Cuckoo пошук: "${name}" → не знайдено`, 'search');
        }
    }
    renderAll();
    setTimeout(() => { highlightLP = { idx: -1 }; highlightCK = { idxA: -1, idxB: -1 }; renderAll(); }, 2500);
}

function deleteRecord() {
    const name = el('deleteInput').value.trim();
    if (!name) return;

    const rLP = linearTable.delete(name);
    const rCK = cuckooTable.delete(name);
    const hk  = hideKey(name);

    if (rLP.deleted || rCK.deleted) {
        addLog(`Видалено: ключ ${hk} | LP: слот[${rLP.idx}] | Cuckoo: таб.${rCK.table || '?'}[${rCK.idx}]`, 'delete');
        setResult(`Запис ${hk} видалено`, true);
        highlightLP = { idx: rLP.deleted ? rLP.idx : -1 };
        highlightCK = { idxA: rCK.deleted && rCK.table === 'A' ? rCK.idx : -1,
                        idxB: rCK.deleted && rCK.table === 'B' ? rCK.idx : -1 };
        renderAll();
        setTimeout(() => { highlightLP = { idx: -1 }; highlightCK = { idxA: -1, idxB: -1 }; renderAll(); }, 2000);
    } else {
        setResult(`Запис не знайдено (перевірте ім'я)`, false);
    }
    el('deleteInput').value = '';
}

document.addEventListener('DOMContentLoaded', () => {
    initTables();
    el('addRecordBtn').onclick  = addRecord;
    el('searchBtn').onclick     = searchRecord;
    el('deleteBtn').onclick     = deleteRecord;

    document.querySelectorAll('input[name="method"]').forEach(r =>
        r.addEventListener('change', () => {
            el('searchResult').textContent = '';
            updateStats();
        })
    );

    renderAll();
});
