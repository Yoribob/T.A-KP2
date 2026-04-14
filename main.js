class HashNode {
    constructor(key, value) {
        this.key = key;
        this.value = value;
        this.next = null;
    }
}

class OpenHashTable {
    constructor(size, hashFn) {
        this.size = size;
        this.hashFn = hashFn;
        this.buckets = new Array(size).fill(null);
        this.count = 0;
        this.collisions = 0;
    }

    insert(key, value) {
        const idx = this.hashFn(key);
        let isCollision = false;

        if (this.buckets[idx] !== null) {
            let cur = this.buckets[idx];
            while (cur) {
                if (cur.key === key) { 
                    cur.value = value; 
                    return { bucketIndex: idx, isCollision: false, updated: true }; 
                }
                cur = cur.next;
            }
            isCollision = true;
            this.collisions++;
        }

        const node = new HashNode(key, value);
        node.next = this.buckets[idx];
        this.buckets[idx] = node;
        this.count++;
        return { bucketIndex: idx, isCollision };
    }

    search(key) {
        const idx = this.hashFn(key);
        let cur = this.buckets[idx];
        let steps = 0;
        while (cur) {
            steps++;
            if (cur.key === key) return { record: cur, bucketIndex: idx, steps };
            cur = cur.next;
        }
        return { record: null, bucketIndex: idx, steps };
    }

    delete(key) {
        const idx = this.hashFn(key);
        let cur = this.buckets[idx];
        let prev = null;
        while (cur) {
            if (cur.key === key) {
                if (prev) prev.next = cur.next;
                else this.buckets[idx] = cur.next;
                this.count--;
                return { deleted: true, bucketIndex: idx };
            }
            prev = cur;
            cur = cur.next;
        }
        return { deleted: false, bucketIndex: idx };
    }

    filledBuckets() {
        return this.buckets.filter(b => b !== null).length;
    }

    bucketToArray(idx) {
        const result = [];
        let cur = this.buckets[idx];
        while (cur) { 
            result.push({ key: cur.key, value: cur.value }); 
            cur = cur.next; 
        }
        return result;
    }
}

function makeHashFn1(dobRegistry) {
    return function(key) {
        const dob = dobRegistry[key];
        if (!dob) return 0;
        return new Date(dob).getMonth();
    };
}

function hashFn2(key) {
    let sum = 0;
    for (let i = 0; i < key.length; i++) sum += key.charCodeAt(i);
    return sum % 26;
}

const MONTHS_UA = ['Січень','Лютий','Березень','Квітень','Травень','Червень',
                   'Липень','Серпень','Вересень','Жовтень','Листопад','Грудень'];
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

let dobRegistry = {};
let table1 = null;
let table2 = null;
let highlightedBucket = { h1: -1, h2: -1 };

function initTables() {
    table1 = new OpenHashTable(12, makeHashFn1(dobRegistry));
    table2 = new OpenHashTable(26, hashFn2);
}

const el = (id) => document.getElementById(id);

function getActiveHash() {
    return document.querySelector('input[name="hashFunc"]:checked').value;
}

function addLog(text, type = '') {
    const div = document.createElement('div');
    div.className = `log-entry ${type ? 'log-' + type : ''}`;
    div.textContent = `[${new Date().toLocaleTimeString()}] ${text}`;
    el('activityLog').prepend(div);
}

function setSearchResult(text, found) {
    el('searchResult').textContent = text;
    el('searchResult').className = 'search-result ' + (found ? 'result-found' : 'result-not-found');
}

function formatDob(dob) {
    if (!dob) return '—';
    const d = new Date(dob);
    return d.toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function updateStats() {
    const hash = getActiveHash();
    const tbl = hash === '1' ? table1 : table2;
    el('statTotal').textContent = `Всього: ${tbl.count}`;
    el('statCollisions').textContent = `Колізії: ${tbl.collisions}`;
    el('statFilled').textContent = `Заповнено бакетів: ${tbl.filledBuckets()} / ${tbl.size}`;
}

function renderHashTable() {
    const hash = getActiveHash();
    const tbl = hash === '1' ? table1 : table2;
    const container = el('hashTableViz');
    container.innerHTML = '';
    const chipClass = hash === '1' ? 'hash1-chip' : 'hash2-chip';

    for (let i = 0; i < tbl.size; i++) {
        const items = tbl.bucketToArray(i);
        const isHighlighted = (hash === '1' && highlightedBucket.h1 === i) ||
                              (hash === '2' && highlightedBucket.h2 === i);

        const row = document.createElement('div');
        row.className = `bucket-row${isHighlighted ? ' highlighted' : ''}`;

        const idxDiv = document.createElement('div');
        idxDiv.className = 'bucket-index';
        idxDiv.textContent = i;

        const lblDiv = document.createElement('div');
        lblDiv.className = 'bucket-label';
        lblDiv.textContent = hash === '1' ? MONTHS_UA[i] : LETTERS[i];

        const chainDiv = document.createElement('div');
        chainDiv.className = 'bucket-chain';

        if (items.length === 0) {
            const empty = document.createElement('span');
            empty.className = 'bucket-empty';
            empty.textContent = '— порожньо —';
            chainDiv.appendChild(empty);
        } else {
            items.forEach((item, idx) => {
                const chipWrap = document.createElement('div');
                chipWrap.className = 'chain-item';
                if (idx > 0) {
                    const arrow = document.createElement('span');
                    arrow.className = 'chain-arrow';
                    arrow.textContent = '→';
                    chipWrap.appendChild(arrow);
                }
                const chip = document.createElement('div');
                chip.className = `record-chip ${chipClass}${isHighlighted ? ' highlighted-chip' : ''}`;
                chip.innerHTML = `
                    <span class="chip-name">${item.key}</span>
                    <span class="chip-dob">🎂 ${formatDob(item.value.dob)}</span>
                    <span class="chip-group">📚 ${item.value.group}</span>
                `;
                chipWrap.appendChild(chip);
                chainDiv.appendChild(chipWrap);
            });
        }
        row.appendChild(idxDiv);
        row.appendChild(lblDiv);
        row.appendChild(chainDiv);
        container.appendChild(row);
    }
    updateStats();
}

function addRecord() {
    const name = el('inputName').value.trim();
    const dob  = el('inputDob').value;
    const group = el('inputGroup').value.trim();
    if (!name || !dob || !group) return;

    dobRegistry[name] = dob;
    const value = { dob, group };
    const r1 = table1.insert(name, value);
    const r2 = table2.insert(name, value);

    if (r1.isCollision) addLog(`Колізія в HF1: бакет [${r1.bucketIndex}]`, 'collision');
    if (r2.isCollision) addLog(`Колізія в HF2: бакет [${r2.bucketIndex}]`, 'collision');

    addLog(`Додано: "${name}" → HF1:${r1.bucketIndex} | HF2:${r2.bucketIndex}`, 'add');
    highlightedBucket = { h1: r1.bucketIndex, h2: r2.bucketIndex };

    el('inputName').value = '';
    el('inputDob').value = '';
    el('inputGroup').value = '';
    renderHashTable();
    setTimeout(() => { highlightedBucket = { h1: -1, h2: -1 }; renderHashTable(); }, 2000);
}

function searchRecord() {
    const name = el('searchInput').value.trim();
    if (!name) return;
    const hash = getActiveHash();
    const tbl = hash === '1' ? table1 : table2;
    const { record, bucketIndex, steps } = tbl.search(name);

    if (record) {
        setSearchResult(`✅ Знайдено: "${record.key}" | Бакет: ${bucketIndex} | Кроки: ${steps}`, true);
        highlightedBucket = hash === '1' ? { h1: bucketIndex, h2: -1 } : { h1: -1, h2: bucketIndex };
    } else {
        setSearchResult(`❌ "${name}" не знайдено. Бакет: ${bucketIndex}`, false);
    }
    renderHashTable();
    setTimeout(() => { highlightedBucket = { h1: -1, h2: -1 }; renderHashTable(); }, 2500);
}

function deleteRecord() {
    const name = el('searchInput').value.trim();
    if (!name) return;
    const r1 = table1.delete(name);
    const r2 = table2.delete(name);
    delete dobRegistry[name];
    if (r1.deleted || r2.deleted) addLog(`Видалено: "${name}"`, 'delete');
    el('searchInput').value = '';
    renderHashTable();
}

function loadSample() {
    const SAMPLE_DATA = [
        { name: 'Іванов Андрій', dob: '2003-01-15', group: 'ІС-51' },
        { name: 'Петренко Максим', dob: '2003-03-22', group: 'ІС-51' },
        { name: 'Сидоренко Олег', dob: '2002-01-08', group: 'ІС-52' }
    ];
    initTables();
    SAMPLE_DATA.forEach(s => {
        dobRegistry[s.name] = s.dob;
        table1.insert(s.name, { dob: s.dob, group: s.group });
        table2.insert(s.name, { dob: s.dob, group: s.group });
    });
    renderHashTable();
}

document.addEventListener('DOMContentLoaded', () => {
    initTables();
    el('addRecordBtn').onclick = addRecord;
    el('searchBtn').onclick = searchRecord;
    el('deleteBtn').onclick = deleteRecord;
    el('loadSampleBtn').onclick = loadSample;
    document.querySelectorAll('input[name="hashFunc"]').forEach(r => {
        r.addEventListener('change', renderHashTable);
    });
    renderHashTable();
});