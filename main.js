class ArrayQueue {
    constructor() { this._data = []; this._head = 0; }
    enqueue(item) { this._data.push(item); }
    dequeue() {
        if (this.isEmpty()) return null;
        return this._data[this._head++];
    }
    peek() { return this.isEmpty() ? null : this._data[this._head]; }
    isEmpty() { return this._head >= this._data.length; }
    toArray() { return this._data.slice(this._head); }
}

class ListNode { constructor(val) { this.value = val; this.next = null; } }
class LinkedQueue {
    constructor() { this._head = null; this._tail = null; this._size = 0; }
    enqueue(item) {
        const node = new ListNode(item);
        if (this._tail) this._tail.next = node;
        this._tail = node;
        if (!this._head) this._head = node;
        this._size++;
    }
    dequeue() {
        if (this.isEmpty()) return null;
        const val = this._head.value;
        this._head = this._head.next;
        if (!this._head) this._tail = null;
        this._size--;
        return val;
    }
    peek() { return this._head ? this._head.value : null; }
    isEmpty() { return this._size === 0; }
    toArray() {
        const res = []; let cur = this._head;
        while(cur) { res.push(cur.value); cur = cur.next; }
        return res;
    }
}

const STAGES = { SETUP: 'setup', THEORY: 'theory', PRACTICE: 'practice', DONE: 'done' };
let theoryQueue, practiceQueue, currentStage = STAGES.SETUP;
let completedStudents = [], theoryResults = [], taskFragment = '';

const el = (id) => document.getElementById(id);

function getGradeClass(score) {
    if (score >= 90) return 'grade-excelent';
    if (score >= 75) return 'grade-good';
    if (score >= 60) return 'grade-satisfy';
    return 'grade-fail';
}

function setLog(text) {
    const entry = document.createElement('div');
    entry.className = 'log-entry';
    entry.textContent = `[${new Date().toLocaleTimeString()}] ${text}`;
    el('activityLog').prepend(entry);
}

function renderQueueList(arr) {
    const container = el('queueDisplay');
    container.innerHTML = '';
    arr.forEach((s, i) => {
        const div = document.createElement('div');
        div.className = `queue-item ${i === 0 ? 'active' : ''}`;
        div.innerHTML = `<strong>${i + 1}.</strong> ${s.name} <small>(№${s.bookNumber})</small>`;
        container.appendChild(div);
    });
}

function renderFinalList() {
    const container = el('completedList');
    container.innerHTML = '';
    completedStudents.forEach(s => {
        const div = document.createElement('div');
        div.className = 'completed-card';
        div.innerHTML = `
            <div style="font-weight:600">${s.name}</div>
            <div class="badges">
                <span class="badge ${getGradeClass(s.theoryGrade)}">Т: ${s.theoryGrade}</span>
                <span class="badge ${getGradeClass(s.practiceGrade)}">П: ${s.practiceGrade}</span>
            </div>
        `;
        container.appendChild(div);
    });
}

function updateUI() {
    if (currentStage === STAGES.DONE) {
        el('studentCard').style.display = 'none';
        el('doneBox').style.display = 'block';
        document.querySelector('.queue-viz').style.display = 'none'; // Приховуємо чергу
        el('completedList').parentElement.style.gridColumn = "1 / -1";
        renderFinalList();
        return;
    }

    const isTheory = currentStage === STAGES.THEORY;
    const activeQueue = isTheory ? theoryQueue : practiceQueue;
    
    el('stageLabel').textContent = isTheory ? 'Етап 1: Теорія' : 'Етап 2: Практика';
    el('implLabel').textContent = isTheory ? 'АТД: Масив' : 'АТД: Покажчики';

    const current = activeQueue.peek();
    if (current) {
        el('currentStudentName').textContent = current.name;
        el('currentBookNumber').textContent = `Залікова книжка №${current.bookNumber}`;
        el('taskFragmentDisplay').textContent = taskFragment;
    }
    renderQueueList(activeQueue.toArray());
    renderFinalList();
}

function startExam() {
    const inputs = document.querySelectorAll('.student-input');
    const students = [];
    inputs.forEach((inp, i) => { if (inp.value.trim()) students.push({ name: inp.value.trim(), bookNumber: 101 + i }); });

    if (students.length < 2) return alert("Додайте хоча б 2 студенти");

    theoryQueue = new ArrayQueue();
    practiceQueue = new LinkedQueue();
    students.forEach(s => { theoryQueue.enqueue({...s}); practiceQueue.enqueue({...s}); });

    currentStage = STAGES.THEORY;
    taskFragment = "Дайте відповідь на теоретичне питання...";
    el('setupSection').style.display = 'none';
    el('examSection').style.display = 'block';
    setLog("Іспит розпочато (Теорія).");
    updateUI();
}

function submitGrade() {
    const val = parseInt(el('gradeInput').value);
    if (isNaN(val) || val < 0 || val > 100) return alert("Введіть бал 0-100");

    if (currentStage === STAGES.THEORY) {
        const s = theoryQueue.dequeue();
        s.theoryGrade = val;
        theoryResults.push(s);
        setLog(`Теорія: ${s.name} — ${val}б.`);
        if (theoryQueue.isEmpty()) {
            currentStage = STAGES.PRACTICE;
            setLog("Перехід до практики.");
        }
    } else {
        const s = practiceQueue.dequeue();
        const tData = theoryResults.find(tr => tr.bookNumber === s.bookNumber);
        completedStudents.push({ ...s, theoryGrade: tData.theoryGrade, practiceGrade: val });
        setLog(`Практика: ${s.name} — ${val}б.`);
        if (practiceQueue.isEmpty()) currentStage = STAGES.DONE;
    }
    taskFragment = `Завдання №${Math.floor(Math.random()*100)}`;
    el('gradeInput').value = '';
    updateUI();
}

function addInput(name = "") {
    const div = document.createElement('div');
    div.className = 'student-row';
    div.innerHTML = `<input class="student-input" value="${name}"><button onclick="this.parentElement.remove()">✕</button>`;
    el('studentInputs').appendChild(div);
}

document.addEventListener('DOMContentLoaded', () => {
    ['Степаненко О.', 'Клименко І.', 'Павлов В.'].forEach(n => addInput(n));
    el('addStudentBtn').onclick = () => addInput();
    el('startExamBtn').onclick = startExam;
    el('submitGradeBtn').onclick = submitGrade;
    el('resetBtn').onclick = () => location.reload();
});