class HashNode {
    constructor(hiddenKey, value) {
        this.hiddenKey = hiddenKey;
        this.value     = value;
        this.next      = null;
    }
}

class OpenHashTable {
    constructor(size, hashFn) {
        this.size       = size;
        this.hashFn     = hashFn;
        this.buckets    = new Array(size).fill(null);
        this.count      = 0;
        this.collisions = 0;
    }

    insert(key, value) {
        const idx       = this.hashFn(key);
        const hiddenKey = hideKey(key);
        let isCollision = false;

        if (this.buckets[idx] !== null) {
            let cur = this.buckets[idx];
            while (cur) {
                if (cur.hiddenKey === hiddenKey) {
                    cur.value = value;
                    return { bucketIndex: idx, isCollision: false, updated: true };
                }
                cur = cur.next;
            }
            isCollision = true;
            this.collisions++;
        }

        const node = new HashNode(hiddenKey, value);
        node.next  = this.buckets[idx];
        this.buckets[idx] = node;
        this.count++;
        return { bucketIndex: idx, isCollision };
    }

    searchByHashKey(searchKey) {
        const idx   = this.hashFn(searchKey);
        let cur     = this.buckets[idx];
        let steps   = 0;
        const records = [];
        while (cur) {
            steps++;
            records.push({ hiddenKey: cur.hiddenKey, value: cur.value });
            cur = cur.next;
        }
        return { records, bucketIndex: idx, steps };
    }

    deleteByKey(key) {
        const idx       = this.hashFn(key);
        const hiddenKey = hideKey(key);
        let cur = this.buckets[idx], prev = null;
        while (cur) {
            if (cur.hiddenKey === hiddenKey) {
                if (prev) prev.next = cur.next;
                else      this.buckets[idx] = cur.next;
                this.count--;
                return { deleted: true, bucketIndex: idx };
            }
            prev = cur; cur = cur.next;
        }
        return { deleted: false, bucketIndex: idx };
    }

    filledBuckets() { return this.buckets.filter(b => b !== null).length; }

    bucketToArray(idx) {
        const result = [];
        let cur = this.buckets[idx];
        while (cur) {
            result.push({ hiddenKey: cur.hiddenKey, value: cur.value });
            cur = cur.next;
        }
        return result;
    }
}

function hashFn1(dobRegistry) {
    return function(key) {
        // При вставці/видаленні key = ім'я, беремо місяць з реєстру
        if (dobRegistry[key] !== undefined) {
            return new Date(dobRegistry[key]).getMonth(); // 0..11
        }
        // При пошуку key = число 1-12 (місяць)
        const m = parseInt(key, 10);
        if (!isNaN(m) && m >= 1 && m <= 12) return m - 1;
        return 0;
    };
}

function hashFn2(key) {
    let sum = 0;
    for (let i = 0; i < key.length; i++) sum += key.charCodeAt(i);
    return sum % 26;
}

function hideKey(key) {
    let h = 0x811c9dc5;
    for (let i = 0; i < key.length; i++) {
        h ^= key.charCodeAt(i);
        h  = (h * 0x01000193) >>> 0;
    }
    return '0x' + h.toString(16).toUpperCase().padStart(8, '0');
}

// ================================================================
const MONTHS  = ['Січень','Лютий','Березень','Квітень','Травень','Червень',
                 'Липень','Серпень','Вересень','Жовтень','Листопад','Грудень'];
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

let dobRegistry       = {};
let table1            = null;
let table2            = null;
let highlightedBucket = { h1: -1, h2: -1 };

function initTables() {
    dobRegistry = {};
    table1 = new OpenHashTable(12, hashFn1(dobRegistry));
    table2 = new OpenHashTable(26, hashFn2);
}

const el = (id) => document.getElementById(id);
function getActiveHash() { return document.querySelector('input[name="hashFunc"]:checked').value; }

function addLog(text, type = '') {
    const div = document.createElement('div');
    div.className   = `log-entry ${type ? 'log-' + type : ''}`;
    div.textContent = `[${new Date().toLocaleTimeString()}] ${text}`;
    el('activityLog').prepend(div);
}

function setSearchResult(text, found) {
    el('searchResult').innerHTML = text.replace(/\n/g, '<br>');
    el('searchResult').className = 'search-result ' + (found ? 'result-found' : 'result-not-found');
}

function formatDob(dob) {
    if (!dob) return '—';
    return new Date(dob).toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function updateStats() {
    const tbl = getActiveHash() === '1' ? table1 : table2;
    el('statTotal').textContent      = `Всього: ${tbl.count}`;
    el('statCollisions').textContent = `Колізії: ${tbl.collisions}`;
    el('statFilled').textContent     = `Заповнено бакетів: ${tbl.filledBuckets()} / ${tbl.size}`;
}

function renderHashTable() {
    const hash      = getActiveHash();
    const tbl       = hash === '1' ? table1 : table2;
    const container = el('hashTableViz');
    container.innerHTML = '';
    const chipClass = hash === '1' ? 'hash1-chip' : 'hash2-chip';

    for (let i = 0; i < tbl.size; i++) {
        const items         = tbl.bucketToArray(i);
        const isHighlighted = (hash === '1' && highlightedBucket.h1 === i) ||
                              (hash === '2' && highlightedBucket.h2 === i);

        const row = document.createElement('div');
        row.className = `bucket-row${isHighlighted ? ' highlighted' : ''}`;

        const idxDiv = document.createElement('div');
        idxDiv.className   = 'bucket-index';
        idxDiv.textContent = i;

        const lblDiv = document.createElement('div');
        lblDiv.className   = 'bucket-label';
        lblDiv.textContent = hash === '1' ? MONTHS[i] : LETTERS[i];

        const chainDiv = document.createElement('div');
        chainDiv.className = 'bucket-chain';

        if (items.length === 0) {
            const empty = document.createElement('span');
            empty.className   = 'bucket-empty';
            empty.textContent = '— порожньо —';
            chainDiv.appendChild(empty);
        } else {
            items.forEach((item, pos) => {
                const chipWrap = document.createElement('div');
                chipWrap.className = 'chain-item';
                if (pos > 0) {
                    const arrow = document.createElement('span');
                    arrow.className   = 'chain-arrow';
                    arrow.textContent = '→';
                    chipWrap.appendChild(arrow);
                }
                const chip = document.createElement('div');
                chip.className = `record-chip ${chipClass}${isHighlighted ? ' highlighted-chip' : ''}`;
                chip.innerHTML = `
                    <span class="chip-hidden">🔒 ${item.hiddenKey}</span>
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
    const name  = el('inputName').value.trim();
    const dob   = el('inputDob').value;
    const group = el('inputGroup').value.trim();
    if (!name || !dob || !group) return;

    dobRegistry[name] = dob;
    const value = { dob, group };
    const r1 = table1.insert(name, value);
    const r2 = table2.insert(name, value);
    delete dobRegistry[name];

    const hk = hideKey(name);
    const h1label = MONTHS[r1.bucketIndex];
    const h2label = LETTERS[r2.bucketIndex];

    if (r1.isCollision) addLog(`Колізія HF1: бакет[${r1.bucketIndex}] (${h1label})`, 'collision');
    if (r2.isCollision) addLog(`Колізія HF2: бакет[${r2.bucketIndex}] (${h2label})`, 'collision');
    addLog(`Додано: ключ ${hk} → HF1: h=${r1.bucketIndex}(${h1label}) | HF2: h=${r2.bucketIndex}(${h2label})`, 'add');

    highlightedBucket = { h1: r1.bucketIndex, h2: r2.bucketIndex };
    el('inputName').value = el('inputDob').value = el('inputGroup').value = '';
    renderHashTable();
    setTimeout(() => { highlightedBucket = { h1: -1, h2: -1 }; renderHashTable(); }, 2000);
}

function searchRecord() {
    const searchKey = el('searchInput').value.trim();
    if (!searchKey) return;

    const hash = getActiveHash();
    const tbl  = hash === '1' ? table1 : table2;
    const { records, bucketIndex, steps } = tbl.searchByHashKey(searchKey);

    const label = hash === '1' ? MONTHS[bucketIndex] : LETTERS[bucketIndex];
    const hashFormula = hash === '1'
        ? `h(${searchKey}) = місяць ${searchKey} − 1 = ${bucketIndex}`
        : `h("${searchKey}") = sum(charCode) mod 26 = ${bucketIndex}`;

    if (records.length > 0) {
        const lines = records.map(r =>
            `&nbsp;&nbsp;🔒 ${r.hiddenKey} | 🎂 ${formatDob(r.value.dob)} | 📚 ${r.value.group}`
        ).join('<br>');
        setSearchResult(
            `✅ ${hashFormula} → бакет [${bucketIndex}] (${label})<br>Знайдено ${records.length} запис(ів), кроків: ${steps}<br>${lines}`,
            true
        );
        addLog(`Пошук: ${hashFormula} → бакет[${bucketIndex}], знайдено ${records.length} запис(ів)`, 'search');
        highlightedBucket = hash === '1' ? { h1: bucketIndex, h2: -1 } : { h1: -1, h2: bucketIndex };
    } else {
        setSearchResult(
            `❌ ${hashFormula} → бакет [${bucketIndex}] (${label}) — порожній`,
            false
        );
        addLog(`Пошук: ${hashFormula} → бакет[${bucketIndex}], порожньо`, 'search');
    }
    renderHashTable();
    setTimeout(() => { highlightedBucket = { h1: -1, h2: -1 }; renderHashTable(); }, 2500);
}

function deleteRecord() {
    const name = el('deleteInput').value.trim();
    const dob  = el('deleteDob').value;
    if (!name) return;

    if (dob) dobRegistry[name] = dob;
    const r1 = table1.deleteByKey(name);
    const r2 = table2.deleteByKey(name);
    delete dobRegistry[name];

    const hk = hideKey(name);
    if (r1.deleted || r2.deleted) {
        addLog(`Видалено: ключ ${hk} | HF1:бакет[${r1.bucketIndex}] HF2:бакет[${r2.bucketIndex}]`, 'delete');
        setSearchResult(`✅ Запис з ключем ${hk} видалено`, true);
        highlightedBucket = { h1: r1.bucketIndex, h2: r2.bucketIndex };
        renderHashTable();
        setTimeout(() => { highlightedBucket = { h1: -1, h2: -1 }; renderHashTable(); }, 2000);
    } else {
        setSearchResult(`❌ Запис не знайдено (перевірте ім'я та дату)`, false);
    }
    el('deleteInput').value = el('deleteDob').value = '';
}

document.addEventListener('DOMContentLoaded', () => {
    initTables();
    el('addRecordBtn').onclick  = addRecord;
    el('searchBtn').onclick     = searchRecord;
    el('deleteBtn').onclick     = deleteRecord;
    document.querySelectorAll('input[name="hashFunc"]').forEach(r =>
        r.addEventListener('change', () => {
            el('searchInput').value = '';
            el('searchResult').textContent = '';
            renderHashTable();
        })
    );
    renderHashTable();
});
